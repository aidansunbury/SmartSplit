import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  json,
  pgEnum,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";
import { ulid } from "ulid";

// All dates are stored as integers representing the number of seconds since the Unix epoch

const createPrefixedUlid = (prefix: string) => {
  return `${prefix}_${ulid()}`;
};

export const createTable = pgTableCreator((name) => `${name}`);

// TODO add preferred payment methods
export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => createPrefixedUlid("usr")),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar("image", { length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  groups: many(usersToGroups),
}));

export const groups = createTable(
  "groups",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => createPrefixedUlid("grp")),

    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    settledSince: integer("settledSince").notNull().default(sql`0`),
    ownerId: varchar("ownerId", { length: 255 })
      .notNull()
      .references(() => users.id),
    // Can be refreshed
    joinCode: varchar("joinCode", { length: 255 })
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
  },
  (t) => ({
    joinCodeIdx: uniqueIndex("groups_join_code_idx").on(t.joinCode),
  }),
);

export const groupsRelations = relations(groups, ({ many, one }) => ({
  users: many(usersToGroups),
  owner: one(users, { fields: [groups.ownerId], references: [users.id] }),
  expenses: many(expenses),
  payments: many(payments),
  comments: many(comments),
}));

export const usersToGroups = createTable(
  "users_to_groups",
  {
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    groupId: varchar("groupId", { length: 255 })
      .notNull()
      .references(() => groups.id),
    // Every user in a group has a balance
    // Positive or negative balance within the group indicating how much the user is owed or owes respectively
    // all balances within a group should sum to 0
    balance: integer("balance").notNull().default(sql`0`),

    // TODO: when leaving a group, the association should not be outright deleted, as then expense and payment records would be orphaned. Marking them as inactive will hide the group in the UI and prevent them from modifying the group, but still allow current members to view the transaction history.
    active: boolean("active").notNull().default(true),
  },
  (t) => ({
    id: primaryKey({ columns: [t.userId, t.groupId] }),
    groupIdx: index("users_to_groups_group_idx").on(t.groupId),
    userIdx: index("users_to_groups_user_idx").on(t.userId),
  }),
);

export const usersToGroupsRelations = relations(usersToGroups, ({ one }) => ({
  user: one(users, { fields: [usersToGroups.userId], references: [users.id] }),
  group: one(groups, {
    fields: [usersToGroups.groupId],
    references: [groups.id],
  }),
}));

export const expenseCategories = pgEnum("expense_categories", [
  "restaurants",
  "entertainment",
  "groceries",
  "maintenance",
  "mortgage",
  "rent",
  "household",
  "gifts",
  "lodging",
  "parking",
  "transportation",
  "general",
  "utilities",
  "phone and internet",
  "health and medical",
]);

export type ExpenseShare = {
  userId: string;
  amount: number; // Positive integer in cents, the shares must sum to the total amount
};

export const expenses = createTable(
  "expenses",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => createPrefixedUlid("exp")),
    // Positive integer in cents
    amount: integer("amount").notNull(),

    // "equal" vs "custom" splits are not stored differently in the database, and are instead determined by the client based on the shares array
    shares: json("shares").$type<ExpenseShare>().array(),
    // .notNull()
    // .default(sql`ARRAY[]::text[]`),
    description: text("description").notNull(),
    // User supplied date of expense. Must be explicity set by user, but will be auto filled by the client
    date: integer("date").notNull(),
    category: expenseCategories("category"),
    notes: text("notes"),

    groupId: varchar("groupId", { length: 255 })
      .notNull()
      .references(() => groups.id),
    // User who created the expense
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    // Database generated timestamp
    createdAt: integer("createdAt")
      .notNull()
      .default(sql`extract(epoch from now())`),
  },
  (t) => ({
    groupIdx: index("expenses_group_idx").on(t.groupId),
    dateIdx: index("expenses_date_idx").on(t.date),
    createdAtIdx: index("expenses_created_at_idx").on(t.createdAt),
    positiveAmountCheck: check(
      "expenses_positive_amount_check",
      sql`${t.amount} > 0`,
    ),
  }),
);

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  group: one(groups, { fields: [expenses.groupId], references: [groups.id] }),
  user: one(users, { fields: [expenses.userId], references: [users.id] }),
  comments: many(comments),
}));

export const paymentMethods = pgEnum("payment_methods", [
  "Cash",
  "PayPal",
  "Venmo",
  "Cash App",
  "Zelle",
  "Other",
]);

export const payments = createTable(
  "payments",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => createPrefixedUlid("pay")),
    description: text("description").notNull(),
    notes: text("notes"),
    paymentMethod: paymentMethods("paymentMethods"),
    amount: integer("amount").notNull(),
    // User supplied date of payment. Must be explicity set by user, but will be auto filled on the frontend
    date: integer("date").notNull(),
    fromUserId: varchar("fromUserId", { length: 255 })
      .notNull()
      .references(() => users.id),
    toUserId: varchar("toUserId", { length: 255 })
      .notNull()
      .references(() => users.id),
    groupId: varchar("groupId", { length: 255 })
      .notNull()
      .references(() => groups.id),
    createdAt: integer("createdAt")
      .notNull()
      .default(sql`extract(epoch from now())`),
  },
  (t) => ({
    groupIdx: index("payments_group_idx").on(t.groupId),
    createdAtIdx: index("payments_created_at_idx").on(t.createdAt),
    dateIdx: index("payments_date_idx").on(t.date),
    positiveAmountCheck: check(
      "payments_positive_amount_check",
      sql`${t.amount} > 0`,
    ),
  }),
);

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  fromUser: one(users, {
    fields: [payments.fromUserId],
    references: [users.id],
  }),
  toUser: one(users, { fields: [payments.toUserId], references: [users.id] }),
  group: one(groups, { fields: [payments.groupId], references: [groups.id] }),
  comments: many(comments),
}));

export const comments = createTable(
  "comments",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => createPrefixedUlid("com")),
    content: text("content"),
    expenseId: varchar("expenseId", { length: 255 }).references(
      () => expenses.id,
    ),
    paymentId: varchar("paymentId", { length: 255 }).references(
      () => payments.id,
    ),
    groupId: varchar("groupId", { length: 255 })
      .notNull()
      .references(() => groups.id),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: integer("createdAt")
      .notNull()
      .default(sql`extract(epoch from now())`),
  },
  (t) => ({
    expenseIdx: index("comments_expense_idx").on(t.expenseId),

    // TODO validate that this behaves as expected
    expenseOrPaymentCheck: check(
      "expense_or_payment_check",
      sql`(${t.paymentId} IS NOT NULL AND ${t.expenseId} IS NULL) OR (${t.paymentId} IS NULL AND ${t.expenseId} IS NOT NULL)`,
    ),
  }),
);

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  group: one(groups, { fields: [comments.groupId], references: [groups.id] }),
  expense: one(expenses, {
    fields: [comments.expenseId],
    references: [expenses.id],
  }),
  payment: one(payments, {
    fields: [comments.paymentId],
    references: [payments.id],
  }),
}));

// TODO add categories

//* NextAuth Tables
export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);
