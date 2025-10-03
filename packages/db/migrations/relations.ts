import { relations } from "drizzle-orm/relations";
import { classes, classStockPrices, stocks, news, users, clients, managers, wallets, transactions, holdings } from "./schema";

export const classStockPricesRelations = relations(classStockPrices, ({one}) => ({
	class: one(classes, {
		fields: [classStockPrices.classId],
		references: [classes.id]
	}),
	stock: one(stocks, {
		fields: [classStockPrices.stockId],
		references: [stocks.id]
	}),
	news: one(news, {
		fields: [classStockPrices.newsId],
		references: [news.id]
	}),
}));

export const classesRelations = relations(classes, ({one, many}) => ({
	classStockPrices: many(classStockPrices),
	news: many(news),
	users: many(users),
	transactions: many(transactions),
	client: one(clients, {
		fields: [classes.clientId],
		references: [clients.id]
	}),
	manager: one(managers, {
		fields: [classes.managerId],
		references: [managers.id]
	}),
	holdings: many(holdings),
}));

export const stocksRelations = relations(stocks, ({many}) => ({
	classStockPrices: many(classStockPrices),
	transactions: many(transactions),
	holdings: many(holdings),
}));

export const newsRelations = relations(news, ({one, many}) => ({
	classStockPrices: many(classStockPrices),
	class: one(classes, {
		fields: [news.classId],
		references: [classes.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	class: one(classes, {
		fields: [users.classId],
		references: [classes.id]
	}),
	holdings: many(holdings),
	wallets: many(wallets),
}));

export const managersRelations = relations(managers, ({one, many}) => ({
	client: one(clients, {
		fields: [managers.clientId],
		references: [clients.id]
	}),
	classes: many(classes),
}));

export const clientsRelations = relations(clients, ({many}) => ({
	managers: many(managers),
	classes: many(classes),
}));

export const transactionsRelations = relations(transactions, ({one}) => ({
	wallet: one(wallets, {
		fields: [transactions.walletId],
		references: [wallets.id]
	}),
	stock: one(stocks, {
		fields: [transactions.stockId],
		references: [stocks.id]
	}),
	class: one(classes, {
		fields: [transactions.classId],
		references: [classes.id]
	}),
}));

export const walletsRelations = relations(wallets, ({one, many}) => ({
	transactions: many(transactions),
	user: one(users, {
		fields: [wallets.userId],
		references: [users.id]
	}),
}));

export const holdingsRelations = relations(holdings, ({one}) => ({
	user: one(users, {
		fields: [holdings.userId],
		references: [users.id]
	}),
	class: one(classes, {
		fields: [holdings.classId],
		references: [classes.id]
	}),
	stock: one(stocks, {
		fields: [holdings.stockId],
		references: [stocks.id]
	}),
}));