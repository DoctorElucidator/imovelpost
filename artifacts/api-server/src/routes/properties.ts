import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, propertiesTable } from "@workspace/db";
import {
  CreatePropertyBody,
  GetPropertyParams,
  UpdatePropertyParams,
  UpdatePropertyBody,
  DeletePropertyParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/properties", async (req, res): Promise<void> => {
  const props = await db.select().from(propertiesTable).orderBy(propertiesTable.createdAt);
  res.json(props);
});

router.post("/properties", async (req, res): Promise<void> => {
  const parsed = CreatePropertyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [prop] = await db.insert(propertiesTable).values(parsed.data).returning();
  res.status(201).json(prop);
});

router.get("/properties/:id", async (req, res): Promise<void> => {
  const params = GetPropertyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, params.data.id));
  if (!prop) {
    res.status(404).json({ error: "Imóvel não encontrado" });
    return;
  }
  res.json(prop);
});

router.patch("/properties/:id", async (req, res): Promise<void> => {
  const params = UpdatePropertyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePropertyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [prop] = await db.update(propertiesTable).set(parsed.data).where(eq(propertiesTable.id, params.data.id)).returning();
  if (!prop) {
    res.status(404).json({ error: "Imóvel não encontrado" });
    return;
  }
  res.json(prop);
});

router.delete("/properties/:id", async (req, res): Promise<void> => {
  const params = DeletePropertyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [prop] = await db.delete(propertiesTable).where(eq(propertiesTable.id, params.data.id)).returning();
  if (!prop) {
    res.status(404).json({ error: "Imóvel não encontrado" });
    return;
  }
  res.sendStatus(204);
});

export default router;
