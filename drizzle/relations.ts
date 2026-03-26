import { relations } from "drizzle-orm/relations";
import { users, guests } from "./schema";

export const guestsRelations = relations(guests, ({one}) => ({
	user: one(users, {
		fields: [guests.email],
		references: [users.email]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	guests: many(guests),
}));