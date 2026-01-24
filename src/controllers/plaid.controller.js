import {
  createLinkToken,
  exchangePublicToken,
  getAccountBalance,
  getUserAccounts,
  getUserTransactions,
  removeItem,
  syncAccounts,
  syncTransactions,
} from '#services/plaid.service.js';
import logger from '#config/logger.js';

// Create a link token for Plaid Link
export const fetchCreateLinkToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.body;

    const result = await createLinkToken(userId, itemId);

    logger.info(`Link token created for user ${userId}`);

    res.status(200).json({
      success: true,
      date: result,
    });
  } catch (e) {
    logger.error(`Error creating link token ${e.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to create link token',
      error: e.message,
    });
  }
};

// Exchange public token for access token
export const fetchExchangePublicToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { publicToken } = req.body;

    if (!publicToken) {
      return res.status(400).json({
        success: false,
        message: 'Public token is required',
      });
    }

    const result = await exchangePublicToken(userId, publicToken);

    logger.info(`Public token exchanged for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Bank account connected successfully',
      data: result,
    });
  } catch (e) {
    logger.error(`Error exchanging public token: ${e.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to connect bank account',
      error: e.message,
    });
  }
};

// Get all connected accounts for a user
export const fetchAccountsById = async (req, res) => {
  try {
    const userId = req.user.id;

    const accounts = await getUserAccounts(userId);

    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts,
    });
  } catch (e) {
    logger.error(`Error fetching accounts: ${e.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accounts',
      error: e.message,
    });
  }
};

// Get account balance of a user
export const fetchBalanceById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountIds } = req.body;

    const accountIdArr = accountIds
      ? accountIds.split(',').map(id => parseInt(id))
      : [];

    const balances = await getAccountBalance(userId, accountIdArr);

    res.status(200).json({
      success: true,
      count: balances.length,
      data: balances,
    });
  } catch (e) {
    logger.error(`Error fetching balances: ${e.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balances',
      error: e.message,
    });
  }
};

// Sync transactions for user's accounts
export const fetchSyncTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = syncTransactions(userId);

    logger.info(
      `Transactions synced for user ${userId}: ${result.added.length} added, ${result.modified.length} modified, ${result.removed.length} removed`
    );

    res.status(200).json({
      success: true,
      message: 'Transaction synced successfully',
      data: {
        added: result.added.length,
        modified: result.modified.length,
        removed: result.removed.length,
      },
    });
  } catch (e) {
    logger.error(`Error syncing transactions: ${e.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to sync transactions',
      error: e.message,
    });
  }
};

// Get transactions for a user
export const fetchTransactionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const transactions = await getUserTransactions(userId, limit, offset);

    res.status(200).json({
      success: true,
      count: transactions.length,
      limit,
      offset,
      data: transactions,
    });
  } catch (e) {
    logger.error(`Error fetching transactions: ${e.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: e.message,
    });
  }
};

export const fetchSyncAccounts = async (req, res) => {
  try {
    const { itemId } = req.body;

    const accounts = await syncAccounts(parseInt(itemId));

    logger.info(`Accounts synced for item: ${itemId}`);

    res.status(200).json({
      success: true,
      message: 'Accounts synced successfully',
      count: accounts.length,
      data: accounts,
    });
  } catch (e) {
    logger.error(`Error syncing accounts: ${e.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to sync accounts',
      error: e.message,
    });
  }
};

export const deleteItemById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.body;

    await removeItem(userId, parseInt(itemId));

    logger.info(`Item ${itemId} removed for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Bank connection removed successfully',
    });
  } catch (e) {
    logger.error(`Error removing item: ${e.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to remove bank connection',
      error: e.message,
    });
  }
};
