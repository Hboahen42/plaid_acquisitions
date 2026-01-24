import {
  boolean,
  decimal,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { plaidItems } from '#models/plaidItems.model.js';

export const plaidAccounts = pgTable('plaid_accounts', {
  id: serial('id').primaryKey(),
  plaidItemId: integer('plaid_item_id')
    .notNull()
    .references(() => plaidItems.id, { onDelete: 'cascade' }),
  plaidAccountId: varchar('plaid_account_id', { length: 255 })
    .notNull()
    .unique(),
  name: varchar('name', { length: 255 }).notNull(),
  officialName: varchar('official_name', { length: 255 }),
  type: varchar('type', { length: 50 }).notNull(),
  subtype: varchar('sub_type', { length: 50 }),
  mask: varchar('mask', { length: 10 }),
  currentBalance: decimal('current_balance', { precision: 15, scale: 2 }),
  availableBalance: decimal('available_balance', { precision: 15, scale: 2 }),
  isoCurrencyCode: varchar('iso_currency_code', { length: 3 }).default('USD'),
  unofficialCurrencyCode: varchar('unofficial_currency_code', { length: 10 }),
  lastBalanceUpdate: timestamp('last_balance_update'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
