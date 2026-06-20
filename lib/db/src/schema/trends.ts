import { pgTable, text, serial, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trendPatternsTable = pgTable("trend_patterns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  score: real("score").notNull().default(0),
  platform: text("platform").notNull(),
  exampleText: text("example_text"),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTrendPatternSchema = createInsertSchema(trendPatternsTable).omit({
  id: true, createdAt: true,
});
export type InsertTrendPattern = z.infer<typeof insertTrendPatternSchema>;
export type TrendPattern = typeof trendPatternsTable.$inferSelect;
