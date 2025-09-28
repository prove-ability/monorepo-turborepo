import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  jsonb,
  numeric,
  pgEnum,
  foreignKey,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enum for transaction type
export const transactionTypeEnum = pgEnum("transaction_type", ["buy", "sell"]);

export const adminRoleEnum = pgEnum("admin_role", [
  "superadmin",
  "admin",
  "manager",
]);

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey(), // This should correspond to the auth.users.id
  email: text("email").unique(),
  role: adminRoleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").unique(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  classId: uuid("class_id").references((): AnyPgColumn => classes.id),
  nickname: text("nickname"),
  grade: text("grade"),
  phone: text("phone"),
  schoolName: text("school_name"),
});

export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  day: integer("day"),
  status: text("status"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  createdBy: uuid("created_by"),
  clientId: uuid("client_id").references((): AnyPgColumn => clients.id),
  managerId: uuid("manager_id").references((): AnyPgColumn => managers.id),
  currentDay: integer("current_day"),
});

export const news = pgTable("news", {
  id: uuid("id").primaryKey().defaultRandom(),
  day: integer("day"),
  title: text("title"),
  content: text("content"),
  relatedStockIds: jsonb("related_stock_ids").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  createdBy: uuid("created_by"),
  classId: uuid("class_id").references((): AnyPgColumn => classes.id),
});

export const stocks = pgTable("stocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  name: text("name"),
  industrySector: text("industry_sector"),
  remarks: text("remarks"),
  marketCountryCode: text("market_country_code"),
  createdBy: uuid("created_by"),
});

export const classStockPrices = pgTable("class_stock_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").references((): AnyPgColumn => classes.id),
  stockId: uuid("stock_id").references((): AnyPgColumn => stocks.id),
  day: integer("day"),
  price: numeric("price"),
  newsId: uuid("news_id").references((): AnyPgColumn => news.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references((): AnyPgColumn => users.id),
  balance: numeric("balance"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id").references((): AnyPgColumn => wallets.id),
  stockId: uuid("stock_id").references((): AnyPgColumn => stocks.id),
  type: transactionTypeEnum("type"),
  quantity: integer("quantity"),
  price: numeric("price"),
  day: integer("day"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  classId: uuid("class_id").references((): AnyPgColumn => classes.id),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  mobile_phone: text("mobile_phone"),
  email: text("email"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  created_by: uuid("created_by"),
});

export const managers = pgTable("managers", {
  id: uuid("id").primaryKey().defaultRandom(),
  start_date: timestamp("start_date"),
  end_date: timestamp("end_date"),
  manager_id: uuid("manager_id").references((): AnyPgColumn => users.id),
  client_id: uuid("client_id").references((): AnyPgColumn => clients.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }),
  created_by: uuid("created_by"),
  current_day: integer("current_day"),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  class: one(classes, {
    fields: [users.classId],
    references: [classes.id],
  }),
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  holdings: many(holdings),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));

export const classesRelations = relations(classes, ({ one }) => ({
  client: one(clients, {
    fields: [classes.clientId],
    references: [clients.id],
  }),
  manager: one(managers, {
    fields: [classes.managerId],
    references: [managers.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  managers: many(managers),
}));

export const managersRelations = relations(managers, ({ one }) => ({
  user: one(users, {
    fields: [managers.manager_id],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [managers.client_id],
    references: [clients.id],
  }),
}));

export const holdings = pgTable("holdings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references((): AnyPgColumn => users.id),
  classId: uuid("class_id").references((): AnyPgColumn => classes.id),
  stockId: uuid("stock_id").references((): AnyPgColumn => stocks.id),
  quantity: integer("quantity"),
  averagePurchasePrice: numeric("average_purchase_price"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const holdingsRelations = relations(holdings, ({ one }) => ({
  user: one(users, {
    fields: [holdings.userId],
    references: [users.id],
  }),
  stock: one(stocks, {
    fields: [holdings.stockId],
    references: [stocks.id],
  }),
}));

// You can define more relations for other tables here following the same pattern
