import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, postsTable } from "@workspace/db";
import {
  CreatePostBody,
  GetPostParams,
  UpdatePostParams,
  UpdatePostBody,
  DeletePostParams,
  ListPostsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/posts", async (req, res): Promise<void> => {
  const qp = ListPostsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const conditions = [];
  if (qp.data.status) conditions.push(eq(postsTable.status, qp.data.status));
  if (qp.data.propertyId) conditions.push(eq(postsTable.propertyId, qp.data.propertyId));

  const posts = conditions.length > 0
    ? await db.select().from(postsTable).where(and(...conditions)).orderBy(postsTable.createdAt)
    : await db.select().from(postsTable).orderBy(postsTable.createdAt);

  res.json(posts);
});

router.post("/posts", async (req, res): Promise<void> => {
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { scheduledAt, ...rest } = parsed.data;
  const [post] = await db.insert(postsTable).values({
    ...rest,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
  }).returning();
  res.status(201).json(post);
});

router.get("/posts/:id", async (req, res): Promise<void> => {
  const params = GetPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (!post) {
    res.status(404).json({ error: "Post não encontrado" });
    return;
  }
  res.json(post);
});

router.patch("/posts/:id", async (req, res): Promise<void> => {
  const params = UpdatePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { scheduledAt, publishedAt, ...updateRest } = parsed.data;
  const [post] = await db.update(postsTable).set({
    ...updateRest,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    publishedAt: publishedAt ? new Date(publishedAt) : undefined,
  }).where(eq(postsTable.id, params.data.id)).returning();
  if (!post) {
    res.status(404).json({ error: "Post não encontrado" });
    return;
  }
  res.json(post);
});

router.delete("/posts/:id", async (req, res): Promise<void> => {
  const params = DeletePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [post] = await db.delete(postsTable).where(eq(postsTable.id, params.data.id)).returning();
  if (!post) {
    res.status(404).json({ error: "Post não encontrado" });
    return;
  }
  res.sendStatus(204);
});

export default router;
