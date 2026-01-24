import { CountryCode, Products } from 'plaid';
import { db } from '#config/database.js';
import { plaidAccounts, plaidItems, transactions } from '#src/models/index.js';
import { and, desc, eq } from 'drizzle-orm';
import { plaidClient } from '#src/config/plaid.js';
import logger from '#config/logger.js';
import e from 'express';

// PLAID_PRODUCTS is a comma-separated list of products to use when initializing
// Link. Note that this list must contain 'assets' in order for the app to be
// able to create and retrieve asset reports.
const PLAID_PRODUCTS = (
  process.env.PLAID_PRODUCTS || Products.Transactions
).split(',');

// PLAID_COUNTRY_CODES is a comma-separated list of countries for which users
// will be able to select institutions from.
const PLAID_COUNTRY_CODES = (
  process.env.PLAID_COUNTRY_CODES || CountryCode.Us
).split(',');

// create a link token for Plaid Link initialization
export const createLinkToken = async (userId, itemId = null) => {
  try {
    const config = {
      user: {
        client_user_id: userId.toString(),
      },
      client_name: 'Plaid Acquisition API',
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: 'en',
    };

    // If updating an existing item, include the access token
    if (itemId) {
      const [item] = await db
        .select()
        .from(plaidItems)
        .where(and(eq(plaidItems.id, itemId), eq(plaidItems.userId, userId)))
        .limit(1);

      if (item) {
        config.access_token = item.plaidAccessToken;
      }
    }

    const createTokenResponse = await plaidClient.sandboxPublicTokenCreate(config);
    return {
      linkToken: createTokenResponse.data.linkToken,
      expiration: createTokenResponse.data.expiration,
    };
  } catch (e) {
    logger.error('Failed to create link token', e.message);
    throw e;
  }
};

// exchange public token for access token
export const exchangePublicToken = async (userId, publicToken) => {
  try {
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = tokenResponse.data.accessToken;
    const itemId = tokenResponse.data.item_id;

    // Get item details
    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    });

    const institutionId = itemResponse.data.item.institution_id;

    // Get institution details
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: PLAID_COUNTRY_CODES,
    });

    const institutionName = institutionResponse.data.institution.name;

    const [newItem] = await db
      .insert(plaidItems)
      .values({
        userId,
        plaidItemId: itemId,
        plaidAccessToken: accessToken,
        institutionId,
        institutionName,
        status: 'active',
        lastSuccessfulUpdate: new Date(),
      })
      .returning();

    // Fetch and store accounts
    await this.syncAccounts(newItem.id, accessToken);

    return {
      itemId: newItem.id,
      institutionName,
    };
  } catch (e) {
    logger.error('Failed to exchange public token', e);
    throw e;
  }
};

// Sync Accounts for a given item
export const syncAccounts = async (itemId, accessToken = null) => {
  try {
    // Get the access token if not provided
    if (!accessToken) {
      const [item] = await db
        .select()
        .from(plaidItems)
        .where(eq(plaidItems.id, itemId))
        .limit(1);

      if (!item) {
        logger.error('No sync accounts found', itemId);
        throw e;
      }
      accessToken = item.plaidAccessToken;
    }

    // Fetch accounts from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = await accountsResponse.data.accounts;

    // Update or insert accounts
    for (const account of accounts) {
      const accountData = {
        plaidItemId: itemId,
        plaidAccountId: account.account_id,
        name: account.name,
        officialName: account.official_name,
        type: account.type,
        subtype: account.subtype,
        mask: account.mask,
        currentBalance: account.balance.current?.toString(),
        availableBalance: account.balance.available?.toString(),
        isoCurrencyCode: account.balance.iso_currency_code,
        unofficialCurrencyCode: account.balance.unofficial_currency_code,
        lastBalanceUpdate: new Date(),
        isActive: true,
      };

      // Check if account exists
      const [existingAccount] = await db
        .select()
        .from(plaidAccounts)
        .where(eq(plaidAccounts.plaidAccountId, accounts.account_id))
        .limit(1);

      if (existingAccount) {
        await db
          .update(plaidAccounts)
          .set({ ...accountData, updatedAt: new Date() })
          .where(eq(plaidAccounts.plaidAccountId, existingAccount.id));
      } else {
        await db.insert(plaidAccounts).values(accountData);
      }
    }

    // update item status
    await db
      .update(plaidItems)
      .set({
        status: 'active',
        lastSuccessfulUpdate: new Date(),
        errorCode: null,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(plaidItems.id, itemId));
  } catch (e) {
    await db
      .update(plaidItems)
      .set({
        status: 'error',
        errorCode: e.error_code || 'UNKNOWN',
        errorMessage: e.message,
        updatedAt: Date.now(),
      })
      .where(eq(plaidItems.id, itemId));

    logger.error('Failed to sync accounts', e);
    throw e;
  }
};

// Get all accounts for a user
export const getUserAccounts = async userId => {
  try {
    return await db
      .select({
        accountId: plaidAccounts.id,
        accountName: plaidAccounts.name,
        officialName: plaidAccounts.officialName,
        type: plaidAccounts.type,
        subtype: plaidAccounts.subtype,
        mask: plaidAccounts.mask,
        currentBalance: plaidAccounts.currentBalance,
        availableBalance: plaidAccounts.availableBalance,
        currency: plaidAccounts.isoCurrencyCode,
        institutionName: plaidItems.institutionName,
        itemId: plaidItems.id,
        status: plaidItems.status,
      })
      .from(plaidAccounts)
      .innerJoin(plaidItems, eq(plaidAccounts.plaidItemId, plaidItems.id))
      .where(eq(plaidItems.userId, userId));
  } catch (e) {
    logger.error('Failed to get user accounts', e);
    throw e;
  }
};

// Fetch transactions for a user's accounts
export const syncTransactions = async userId => {
  try {
    // Get all user items
    const userItems = await db
      .select()
      .from(plaidItems)
      .where(eq(plaidItems.userId, userId));

    if (userItems.length === 0) {
      return { added: [], modified: [], removed: [] };
    }

    const syncResults = {
      added: [],
      modified: [],
      removed: [],
    };

    for (const item of userItems) {
      try {
        let cursor = item.transactionsCursor || null;
        let hasMore = true;

        while (hasMore) {
          const request = {
            access_token: item.plaidAccessToken,
            cursor,
            count: 500,
          };

          const response = await plaidClient.transactionsSync(request);
          const data = response.data;

          // Process added transactions
          for (const addedTransaction of data.added) {
            const [account] = await db
              .select()
              .from(plaidAccounts)
              .where(
                eq(plaidAccounts.plaidAccountId, addedTransaction.account_id)
              )
              .limit(1);

            if (!account) continue;

            const transactionData = {
              plaidAccountId: account.id,
              plaidTransactionId: addedTransaction.transaction_id,
              amount: addedTransaction.amount.toString(),
              isoCurrencyCode: addedTransaction.iso_currency_code,
              unofficialCurrencyCode: addedTransaction.unofficial_currency_code,
              date: addedTransaction.date,
              authorizedDate: addedTransaction.authorized_date,
              name: addedTransaction.name,
              merchantName: addedTransaction.merchant_name,
              paymentChannel: addedTransaction.payment_channel,
              category: addedTransaction.category,
              categoryId: addedTransaction.category_id,
              pending: addedTransaction.pending,
              pendingTransactionId: addedTransaction.pending_transaction_id,
              accountOwner: addedTransaction.account_owner,
              transactionType: addedTransaction.transaction_type,
              transactionCode: addedTransaction.transaction_code,
              location: addedTransaction.location
                ? JSON.stringify(addedTransaction.location)
                : null,
              paymentMeta: addedTransaction.payment_meta
                ? JSON.stringify(addedTransaction.payment_meta)
                : null,
              personalFinanceCategory:
                addedTransaction.personal_finance_category
                  ? JSON.stringify(addedTransaction.personal_finance_category)
                  : null,
            };

            await db.insert(transactions).values(transactionData);
            syncResults.added.push(addedTransaction);
          }

          // Process modified transactions
          for (const modifiedTransaction of data.modified) {
            const [account] = await db
              .select()
              .from(plaidAccounts)
              .where(
                eq(plaidAccounts.plaidAccountId, modifiedTransaction.account_id)
              )
              .limit(1);

            if (!account) continue;

            const transactionData = {
              plaidAccountId: account.id,
              amount: modifiedTransaction.amount.toString(),
              isoCurrencyCode: modifiedTransaction.iso_currency_code,
              unofficialCurrencyCode:
                modifiedTransaction.unofficial_currency_code,
              date: modifiedTransaction.date,
              authorizedDate: modifiedTransaction.authorized_date,
              name: modifiedTransaction.name,
              merchantName: modifiedTransaction.merchant_name,
              paymentChannel: modifiedTransaction.payment_channel,
              category: modifiedTransaction.category,
              categoryId: modifiedTransaction.category_id,
              pending: modifiedTransaction.pending,
              pendingTransactionId: modifiedTransaction.pending_transaction_id,
              accountOwner: modifiedTransaction.account_owner,
              transactionType: modifiedTransaction.transaction_type,
              transactionCode: modifiedTransaction.transaction_code,
              location: modifiedTransaction.location
                ? JSON.stringify(modifiedTransaction.location)
                : null,
              paymentMeta: modifiedTransaction.payment_meta
                ? JSON.stringify(modifiedTransaction.payment_meta)
                : null,
              personalFinanceCategory:
                modifiedTransaction.personal_finance_category
                  ? JSON.stringify(
                    modifiedTransaction.personal_finance_category
                  )
                  : null,
              updatedAt: new Date(),
            };

            await db
              .update(transactions)
              .set(transactionData)
              .where(
                eq(
                  transactions.plaidTransactionId,
                  modifiedTransaction.transaction_id
                )
              );

            syncResults.modified.push(modifiedTransaction);
          }

          // Process removed transactions
          for (const removedTransaction of data.removed) {
            await db
              .delete(transactions)
              .where(
                eq(
                  transactions.plaidTransactionId,
                  removedTransaction.transaction_id
                )
              );

            syncResults.removed.push(removedTransaction);
          }

          // Update cursor and check if there's more data
          cursor = response.data.next_cursor;
          hasMore = response.data.has_more;
        }

        // Save the cursor for next sync
        await db
          .update(plaidItems)
          .set({
            transactionsCursor: cursor,
            lastSuccessfulUpdate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(plaidItems.id, item.id));
      } catch (e) {
        // Update item with error status
        await db
          .update(plaidItems)
          .set({
            status: 'error',
            errorCode: e.error_code || 'SYNC_ERROR',
            errorMessage: e.message,
            updatedAt: new Date(),
          })
          .where(eq(plaidItems.id, item.id));

        logger.error(`Error syncing transactions for item ${item.id}:`, e);
        throw e;
      }
    }

    return syncResults;
  } catch (e) {
    logger.error(`Failed to sync transactions: ${e.message}`);
    throw e;
  }
};

// Get transactions for a user
export const getUserTransactions = async (userId, limit = 100, offset = 0) => {
  try {
    return await db
      .select({
        transactionId: transactions.id,
        accountName: plaidAccounts.name,
        institutionName: plaidItems.institutionName,
        amount: transactions.amount,
        currency: transactions.isoCurrencyCode,
        date: transactions.date,
        name: transactions.name,
        merchantName: transactions.merchantName,
        category: transactions.category,
        pending: transactions.pending,
        paymentChannel: transactions.paymentChannel,
      })
      .from(transactions)
      .innerJoin(
        plaidAccounts,
        eq(transactions.plaidAccountId, plaidAccounts.id)
      )
      .innerJoin(plaidItems, eq(plaidAccounts.plaidItemId, plaidItems.id))
      .where(eq(plaidItems.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset);
  } catch (e) {
    logger.error(`Failed to get user transactions: ${e.message}`);
    throw e;
  }
};

// Remove a Plaid item (discount bank)
export const removeItem = async (userId, itemId) => {
  try {
    const [item] = await db
      .select()
      .from(plaidItems)
      .where(and(eq(plaidItems.id, itemId), eq(plaidItems.userId, userId)))
      .limit(1);

    if (!item) {
      logger.error(`Item: ${itemId} not found`);
      throw e;
    }

    // Remove from Plaid
    await plaidClient.itemRemove({
      access_token: item.plaidAccessToken,
    });

    // Delete from database (cascade will handle accounts and transactions)
    await db.delete(plaidItems).where(eq(plaidItems.id, itemId));

    return { success: true };
  } catch (e) {
    logger.error(`Failed to remove item: ${e.message}`);
    throw e;
  }
};

// Get balance for specific accounts
export const getAccountBalance = async (userId, accountIds = []) => {
  try {
    let query = db
      .select({
        accountId: plaidAccounts.id,
        accountName: plaidAccounts.name,
        type: plaidAccounts.type,
        subtype: plaidAccounts.subtype,
        currentBalance: plaidAccounts.currentBalance,
        availableBalance: plaidAccounts.availableBalance,
        currency: plaidAccounts.isoCurrencyCode,
        institutionName: plaidItems.institutionName,
      })
      .from(plaidAccounts)
      .innerJoin(plaidItems, eq(plaidAccounts.plaidItemId, plaidItems.id))
      .where(eq(plaidItems.userId, userId));

    if (accountIds.length > 0) {
      query = query.where(
        and(eq(plaidItems.userId, userId), plaidAccounts.id.in(accountIds))
      );
    }

    return await query;
  } catch (e) {
    logger.error(`Failed to get account balance: ${e.message}`);
    throw e;
  }
};
