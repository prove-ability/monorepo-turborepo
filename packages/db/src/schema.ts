import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  jsonb,
  numeric,
  pgEnum,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const transactionTypeEnum = pgEnum("transaction_type", ["buy", "sell"]);
export const countryCodeEnum = pgEnum("country_code", ["KR", "US", "JP", "CN"]);

export const guests = pgTable("guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
  nickname: text("nickname"),
  name: text("name").notNull(),
  mobilePhone: text("mobile_phone").notNull(),
  affiliation: text("affiliation").notNull(),
  grade: text("grade").notNull(),
  classId: uuid("class_id")
    .references((): AnyPgColumn => classes.id)
    .notNull(),
  loginId: text("login_id").notNull().unique(),
  password: text("password").notNull(),
});

export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
  name: text("name"),
  totalDays: integer("total_days"),
  currentDay: integer("current_day"),
  status: text("status"),
  createdBy: uuid("created_by").notNull(),
  clientId: uuid("client_id")
    .references((): AnyPgColumn => clients.id)
    .notNull(),
  managerId: uuid("manager_id")
    .references((): AnyPgColumn => managers.id)
    .notNull(),
});

export const news = pgTable("news", {
  id: uuid("id").primaryKey().defaultRandom(),
  day: integer("day"),
  title: text("title"),
  content: text("content"),
  relatedStockIds: jsonb("related_stock_ids").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
  createdBy: uuid("created_by").notNull(),
  classId: uuid("class_id").references((): AnyPgColumn => classes.id),
});

export const stocks = pgTable("stocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
  name: text("name").notNull(),
  industrySector: text("industry_sector").notNull(),
  remarks: text("remarks"),
  marketCountryCode: countryCodeEnum("market_country_code").notNull(),
  createdBy: uuid("created_by").notNull(),
});

export const classStockPrices = pgTable("class_stock_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").references((): AnyPgColumn => classes.id),
  stockId: uuid("stock_id").references((): AnyPgColumn => stocks.id),
  day: integer("day"),
  price: numeric("price"),
  newsId: uuid("news_id").references((): AnyPgColumn => news.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
});

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  guestId: uuid("guest_id")
    .references((): AnyPgColumn => guests.id)
    .notNull()
    .unique(),
  balance: numeric("balance").default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id").references((): AnyPgColumn => wallets.id),
  stockId: uuid("stock_id").references((): AnyPgColumn => stocks.id),
  type: transactionTypeEnum("type"),
  quantity: integer("quantity"),
  price: numeric("price"),
  day: integer("day"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  classId: uuid("class_id").references((): AnyPgColumn => classes.id),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdBy: uuid("created_by").notNull(),
});

export const managers = pgTable("managers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  mobilePhone: text("mobile_phone"),
  email: text("email"),
  clientId: uuid("client_id").references((): AnyPgColumn => clients.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
  createdBy: uuid("created_by").notNull(),
});

// Relations
export const guestsRelations = relations(guests, ({ one, many }) => ({
  class: one(classes, {
    fields: [guests.classId],
    references: [classes.id],
  }),
  wallet: one(wallets, {
    fields: [guests.id],
    references: [wallets.guestId],
  }),
  holdings: many(holdings),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  guest: one(guests, {
    fields: [wallets.guestId],
    references: [guests.id],
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
  client: one(clients, {
    fields: [managers.clientId],
    references: [clients.id],
  }),
}));

export const holdings = pgTable("holdings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references((): AnyPgColumn => guests.id),
  classId: uuid("class_id").references((): AnyPgColumn => classes.id),
  stockId: uuid("stock_id").references((): AnyPgColumn => stocks.id),
  quantity: integer("quantity"),
  averagePurchasePrice: numeric("average_purchase_price"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
});

export const holdingsRelations = relations(holdings, ({ one }) => ({
  user: one(guests, {
    fields: [holdings.userId],
    references: [guests.id],
  }),
  stock: one(stocks, {
    fields: [holdings.stockId],
    references: [stocks.id],
  }),
}));

// You can define more relations for other tables here following the same pattern
