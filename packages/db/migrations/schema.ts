import { pgTable, uuid, timestamp, text, foreignKey, integer, numeric, jsonb, unique, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const adminRole = pgEnum("admin_role", ['superadmin', 'admin', 'manager'])
export const transactionType = pgEnum("transaction_type", ['buy', 'sell'])


export const stocks = pgTable("stocks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	name: text(),
	industrySector: text("industry_sector"),
	remarks: text(),
	marketCountryCode: text("market_country_code"),
	createdBy: uuid("created_by").notNull(),
});

export const classStockPrices = pgTable("class_stock_prices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	classId: uuid("class_id"),
	stockId: uuid("stock_id"),
	day: integer(),
	price: numeric(),
	newsId: uuid("news_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "class_stock_prices_class_id_classes_id_fk"
		}),
	foreignKey({
			columns: [table.stockId],
			foreignColumns: [stocks.id],
			name: "class_stock_prices_stock_id_stocks_id_fk"
		}),
	foreignKey({
			columns: [table.newsId],
			foreignColumns: [news.id],
			name: "class_stock_prices_news_id_news_id_fk"
		}),
]);

export const clients = pgTable("clients", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	mobilePhone: text("mobile_phone"),
	email: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by").notNull(),
});

export const news = pgTable("news", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	day: integer(),
	title: text(),
	content: text(),
	relatedStockIds: jsonb("related_stock_ids"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdBy: uuid("created_by").notNull(),
	classId: uuid("class_id"),
}, (table) => [
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "news_class_id_classes_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	classId: uuid("class_id").notNull(),
	nickname: text(),
	grade: text().notNull(),
	mobilePhone: text("mobile_phone").notNull(),
	affiliation: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "users_class_id_classes_id_fk"
		}),
]);

export const managers = pgTable("managers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdBy: uuid("created_by").notNull(),
	name: text().notNull(),
	mobilePhone: text("mobile_phone"),
	email: text(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "managers_client_id_clients_id_fk"
		}).onDelete("cascade"),
]);

export const transactions = pgTable("transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	walletId: uuid("wallet_id"),
	stockId: uuid("stock_id"),
	type: transactionType(),
	quantity: integer(),
	price: numeric(),
	day: integer(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	classId: uuid("class_id"),
}, (table) => [
	foreignKey({
			columns: [table.walletId],
			foreignColumns: [wallets.id],
			name: "transactions_wallet_id_wallets_id_fk"
		}),
	foreignKey({
			columns: [table.stockId],
			foreignColumns: [stocks.id],
			name: "transactions_stock_id_stocks_id_fk"
		}),
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "transactions_class_id_classes_id_fk"
		}),
]);

export const classes = pgTable("classes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text(),
	totalDays: integer("total_days"),
	status: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdBy: uuid("created_by").notNull(),
	clientId: uuid("client_id").notNull(),
	managerId: uuid("manager_id").notNull(),
	currentDay: integer("current_day"),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "classes_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.managerId],
			foreignColumns: [managers.id],
			name: "classes_manager_id_managers_id_fk"
		}),
]);

export const holdings = pgTable("holdings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	classId: uuid("class_id"),
	stockId: uuid("stock_id"),
	quantity: integer(),
	averagePurchasePrice: numeric("average_purchase_price"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "holdings_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "holdings_class_id_classes_id_fk"
		}),
	foreignKey({
			columns: [table.stockId],
			foreignColumns: [stocks.id],
			name: "holdings_stock_id_stocks_id_fk"
		}),
]);

export const wallets = pgTable("wallets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	balance: numeric(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wallets_user_id_users_id_fk"
		}),
]);

export const admins = pgTable("admins", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	name: text().notNull(),
	role: adminRole().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	unique("admins_email_unique").on(table.email),
]);
