import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysisRunsTable = pgTable("analysis_runs", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("running"),
  patternsFound: integer("patterns_found").notNull().default(0),
  findings: text("findings").array().notNull().default([]),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertAnalysisRunSchema = createInsertSchema(analysisRunsTable).omit({
  id: true, startedAt: true,
});
export type InsertAnalysisRun = z.infer<typeof insertAnalysisRunSchema>;
export type AnalysisRun = typeof analysisRunsTable.$inferSelect;
