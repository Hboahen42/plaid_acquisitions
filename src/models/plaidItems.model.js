import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from '#models/user.model.js';

export const plaidItems = pgTable('plaid_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  plaidItemId: varchar('plaid_item_id', { length: 255 }).notNull().unique(),
  plaidAccessToken: text('plaid_access_token').notNull(),
  institutionId: varchar('institution_id', { length: 255 }).notNull(),
  institutionName: varchar('institution_name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  lastSuccessfullyUpdate: timestamp('last_successfully_update'),
  errorCode: varchar('error_code', { length: 100 }),
  errorMessage: varchar('error_message'),
  consentExpirationTime: varchar('consent_expiration_time'),
  transactionsCursor: text('transactions_cursor'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
