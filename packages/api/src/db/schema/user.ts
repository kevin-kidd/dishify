import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";

// User

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  emailVerified: integer("emailVerified", { mode: "boolean" }),
  email: text("email").notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});
export const UserTable = user;

export type User = InferSelectModel<typeof UserTable>;
export type InsertUser = InferInsertModel<typeof UserTable>;
export const insertUserSchema = createInsertSchema(UserTable);
export const selectUserSchema = createSelectSchema(UserTable);

// Session

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => UserTable.id),
  token: text("token").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
  expiresAt: integer("expiresAt", { mode: "timestamp" }),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
});
export const SessionTable = session;
export type Session = InferSelectModel<typeof SessionTable>;
export type InsertSession = InferInsertModel<typeof SessionTable>;
export const insertSessionSchema = createInsertSchema(SessionTable);
export const selectSessionSchema = createSelectSchema(SessionTable);

// Account

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => UserTable.id),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  idToken: text("idToken"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});
export const AccountTable = account;

export type Account = InferSelectModel<typeof AccountTable>;
export type InsertAccount = InferInsertModel<typeof AccountTable>;
export const insertAccountSchema = createInsertSchema(AccountTable);
export const selectAccountSchema = createSelectSchema(AccountTable);

// Verification

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});
export const VerificationTable = verification;

export type Verification = InferSelectModel<typeof VerificationTable>;
export type InsertVerification = InferInsertModel<typeof VerificationTable>;
export const insertVerificationSchema = createInsertSchema(VerificationTable);
export const selectVerificationSchema = createSelectSchema(VerificationTable);
