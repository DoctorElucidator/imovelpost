import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, propertiesTable } from "@workspace/db";
import { GeneratePostBody } from "@workspace/api-zod";
import { generateRealEstatePost, type PostPlatform, type PostTone, type PostFocus } from "../lib/openai";

const router: IRouter = Router();

router.post("/generate", async (req, res): Promise<void> => {
  const parsed = GeneratePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { propertyId, platform, tone, focus, customInstructions } = parsed.data;

  const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propertyId));
  if (!property) {
    res.status(404).json({ error: "Imóvel não encontrado" });
    return;
  }

  try {
    const result = await generateRealEstatePost(
      property,
      platform as PostPlatform,
      (tone ?? "friendly") as PostTone,
      (focus ?? "program") as PostFocus,
      customInstructions ?? undefined
    );
    res.json({ ...result, platform });
  } catch (err) {
    req.log.error({ err }, "Falha ao gerar post com IA");
    res.status(500).json({ error: "Erro ao gerar post com IA. Verifique sua chave OpenAI." });
  }
});

export default router;
