CREATE TABLE "plaid_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"plaid_item_id" integer NOT NULL,
	"plaid_account_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"official_name" varchar(255),
	"type" varchar(50) NOT NULL,
	"sub_type" varchar(50),
	"mask" varchar(10),
	"current_balance" numeric(15, 2),
	"available_balance" numeric(15, 2),
	"iso_currency_code" varchar(3) DEFAULT 'USD',
	"unofficial_currency_code" varchar(10),
	"last_balance_update" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plaid_accounts_plaid_account_id_unique" UNIQUE("plaid_account_id")
);
--> statement-breakpoint
CREATE TABLE "plaid_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plaid_item_id" varchar(255) NOT NULL,
	"plaid_access_token" text NOT NULL,
	"institution_id" varchar(255) NOT NULL,
	"institution_name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"last_successfully_update" timestamp,
	"error_code" varchar(100),
	"error_message" varchar,
	"consent_expiration_time" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plaid_items_plaid_item_id_unique" UNIQUE("plaid_item_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"plaid_account_id" integer NOT NULL,
	"plaid_transaction_id" varchar(255) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"iso_currency_code" varchar(3) DEFAULT 'USD',
	"unofficial_currency_code" varchar(10),
	"date" date NOT NULL,
	"authorized_date" date,
	"name" varchar(255) NOT NULL,
	"merchant_name" varchar(255),
	"payment_channel" varchar(50),
	"category" text[],
	"category_id" varchar(50),
	"pending" boolean DEFAULT false NOT NULL,
	"pending_transaction_id" varchar(255),
	"account_owner" varchar(255),
	"transaction_type" varchar(50),
	"transaction_code" varchar(50),
	"location" text,
	"payment_meta" text,
	"personal_finance_category" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_plaid_transaction_id_unique" UNIQUE("plaid_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "plaid_accounts" ADD CONSTRAINT "plaid_accounts_plaid_item_id_plaid_items_id_fk" FOREIGN KEY ("plaid_item_id") REFERENCES "public"."plaid_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plaid_items" ADD CONSTRAINT "plaid_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_plaid_account_id_plaid_accounts_id_fk" FOREIGN KEY ("plaid_account_id") REFERENCES "public"."plaid_accounts"("id") ON DELETE cascade ON UPDATE no action;