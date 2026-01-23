import {
  boolean,
  date,
  decimal,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { plaidAccounts } from '#models/plaidAccounts.model.js';

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  plaidAccountId: integer('plaid_account_id')
    .notNull()
    .references(() => plaidAccounts.id, { onDelete: 'cascade' }),
  plaidTransactionId: varchar('plaid_transaction_id', { length: 255 })
    .notNull()
    .unique(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  isoCurrencyCode: varchar('iso_currency_code', { length: 3 }).default('USD'),
  unofficialCurrencyCode: varchar('unofficial_currency_code', { length: 10 }),
  date: date('date').notNull(),
  authorizedDate: date('authorized_date'),
  name: varchar('name', { length: 255 }).notNull(),
  merchantName: varchar('merchant_name', { length: 255 }),
  paymentChannel: varchar('payment_channel', { length: 50 }),
  category: text('category').array(),
  categoryId: varchar('category_id', { length: 50 }),
  pending: boolean('pending').notNull().default(false),
  pendingTransactionId: varchar('pending_transaction_id', { length: 255 }),
  accountOwner: varchar('account_owner', { length: 255 }),
  transactionType: varchar('transaction_type', { length: 50 }),
  transactionCode: varchar('transaction_code', { length: 50 }),
  location: text('location'),
  paymentMeta: text('payment_meta'),
  personalFinanceCategory: text('personal_finance_category'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
