import { Router, type IRouter } from "express";
import { eq, count, avg } from "drizzle-orm";
import { db, propertiesTable, postsTable, campaignsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const [propCount] = await db.select({ count: count() }).from(propertiesTable);
  const [totalPosts] = await db.select({ count: count() }).from(postsTable);
  const [draftPosts] = await db.select({ count: count() }).from(postsTable).where(eq(postsTable.status, "draft"));
  const [publishedPosts] = await db.select({ count: count() }).from(postsTable).where(eq(postsTable.status, "published"));
  const [totalCampaigns] = await db.select({ count: count() }).from(campaignsTable);
  const [activeCampaigns] = await db.select({ count: count() }).from(campaignsTable).where(eq(campaignsTable.status, "active"));
  const [avgScore] = await db.select({ avg: avg(postsTable.score) }).from(postsTable);

  const recentPosts = await db.select({ title: postsTable.title, status: postsTable.status, platform: postsTable.platform })
    .from(postsTable)
    .orderBy(postsTable.createdAt)
    .limit(5);

  const recentActivity = recentPosts.map(p => `Post "${p.title}" - ${p.platform} (${p.status})`);

  res.json({
    totalProperties: Number(propCount?.count ?? 0),
    totalPosts: Number(totalPosts?.count ?? 0),
    draftPosts: Number(draftPosts?.count ?? 0),
    publishedPosts: Number(publishedPosts?.count ?? 0),
    totalCampaigns: Number(totalCampaigns?.count ?? 0),
    activeCampaigns: Number(activeCampaigns?.count ?? 0),
    avgPostScore: Math.round(Number(avgScore?.avg ?? 0) * 10) / 10,
    topProgram: "Minha Casa, Minha Vida",
    topPlatform: "facebook_marketplace",
    recentActivity,
  });
});

export default router;
