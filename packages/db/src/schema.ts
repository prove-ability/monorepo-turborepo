import { pgTable, text, uuid, timestamp, integer, jsonb, numeric, pgEnum, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for transaction type
export const transactionTypeEnum = pgEnum('transaction_type', ['buy', 'sell']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  loginId: text('login_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  classId: uuid('class_id').references(() => classes.id),
  nickname: text('nickname'),
  grade: text('grade'),
  phone: text('phone'),
  schoolName: text('school_name'),
  password: text('password'), // Note: Storing plain text passwords is not recommended
});

export const classes = pgTable('classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  day: integer('day'),
  status: text('status'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
  clientId: uuid('client_id').references(() => clients.id),
  managerId: uuid('manager_id').references(() => managers.id),
});

export const news = pgTable('news', {
  id: uuid('id').primaryKey().defaultRandom(),
  day: integer('day'),
  title: text('title'),
  content: text('content'),
  relatedStockIds: jsonb('related_stock_ids'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
  classId: uuid('class_id').references(() => classes.id),
});

export const stocks = pgTable('stocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  name: text('name'),
  industrySector: text('industry_sector'),
  remarks: text('remarks'),
  marketCountryCode: text('market_country_code'),
  createdBy: uuid('created_by'),
});

export const classStockPrices = pgTable('class_stock_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  classId: uuid('class_id').references(() => classes.id),
  stockId: uuid('stock_id').references(() => stocks.id),
  day: integer('day'),
  price: numeric('price'),
  newsId: uuid('news_id').references(() => news.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  balance: numeric('balance'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').references(() => wallets.id),
  stockId: uuid('stock_id').references(() => stocks.id),
  type: transactionTypeEnum('type'),
  quantity: integer('quantity'),
  price: numeric('price'),
  day: integer('day'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  classId: uuid('class_id').references(() => classes.id),
});

export const clients = pgTable('clients', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name'),
    mobilePhone: text('mobile_phone'),
    email: text('email'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    createdBy: uuid('created_by'),
});

export const managers = pgTable('managers', {
    id: uuid('id').primaryKey().defaultRandom(),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    managerId: uuid('manager_id').references(() => users.id),
    clientId: uuid('client_id').references(() => clients.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
    createdBy: uuid('created_by'),
    currentDay: integer('current_day'),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  class: one(classes, {
    fields: [users.classId],
    references: [classes.id],
  }),
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
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

export const managersRelations = relations(managers, ({ one }) => ({
  user: one(users, {
    fields: [managers.managerId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [managers.clientId],
    references: [clients.id],
  }),
}));

// You can define more relations for other tables here following the same pattern
