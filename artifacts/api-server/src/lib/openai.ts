import OpenAI from "openai";
import { logger } from "./logger";

if (!process.env.OPENAI_API_KEY) {
  logger.warn("OPENAI_API_KEY not set — AI generation will fail at runtime");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type PostPlatform = "facebook" | "facebook_marketplace" | "instagram" | "whatsapp";
export type PostTone = "professional" | "friendly" | "urgent" | "emotional";
export type PostFocus = "price" | "location" | "program" | "amenities" | "lifestyle";

function platformLabel(p: PostPlatform): string {
  const map: Record<PostPlatform, string> = {
    facebook: "Facebook (post de feed)",
    facebook_marketplace: "Facebook Marketplace",
    instagram: "Instagram",
    whatsapp: "WhatsApp (mensagem para grupos)",
  };
  return map[p];
}

function toneLabel(t: PostTone): string {
  const map: Record<PostTone, string> = {
    professional: "profissional e confiante",
    friendly: "amigável e acolhedor",
    urgent: "urgente e escasso (crie senso de urgência)",
    emotional: "emocional, que toca no sonho da casa própria",
  };
  return map[t];
}

function focusLabel(f: PostFocus): string {
  const map: Record<PostFocus, string> = {
    price: "preço atrativo e condições de pagamento",
    location: "localização e bairro",
    program: "programa habitacional (ex: Minha Casa Minha Vida)",
    amenities: "diferenciais e comodidades do imóvel",
    lifestyle: "estilo de vida e qualidade de vida",
  };
  return map[f];
}

function programLabel(p: string): string {
  const map: Record<string, string> = {
    minha_casa_minha_vida: "Minha Casa, Minha Vida",
    mcmv_faixa1: "Minha Casa, Minha Vida - Faixa 1",
    mcmv_faixa2: "Minha Casa, Minha Vida - Faixa 2",
    mcmv_faixa3: "Minha Casa, Minha Vida - Faixa 3",
    regular: "Imóvel convencional",
  };
  return map[p] ?? p;
}

interface PropertyData {
  title: string;
  description?: string | null;
  type: string;
  price: number;
  city: string;
  state: string;
  neighborhood?: string | null;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  program: string;
  amenities: string[];
}

export async function generateRealEstatePost(
  property: PropertyData,
  platform: PostPlatform,
  tone: PostTone = "friendly",
  focus: PostFocus = "program",
  customInstructions?: string
): Promise<{
  title: string;
  content: string;
  hashtags: string[];
  score: number;
  aiNotes: string;
}> {
  const priceFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(property.price);

  const systemPrompt = `Você é um especialista em marketing imobiliário brasileiro, com amplo conhecimento sobre o que performa melhor no Facebook Marketplace, Facebook, Instagram e WhatsApp para venda de imóveis no Brasil. Você conhece profundamente o programa Minha Casa, Minha Vida e sabe como comunicar de forma eficaz para o público-alvo de cada faixa de renda.

Suas respostas devem:
- Ser 100% em português do Brasil
- Ser juridicamente corretas (não prometer o que não pode ser garantido, não usar informações falsas)
- Ser otimizadas para o algoritmo e engajamento da plataforma especificada
- Usar linguagem autêntica, não genérica
- Incluir call-to-action claro
- Nunca alucinar dados — use apenas o que foi fornecido
- Não usar emojis no texto principal (apenas se for natural para a plataforma)

Responda APENAS com JSON válido no formato especificado.`;

  const userPrompt = `Crie um post para venda do seguinte imóvel:

**Dados do Imóvel:**
- Título: ${property.title}
- Tipo: ${property.type}
- Programa: ${programLabel(property.program)}
- Preço: ${priceFormatted}
- Cidade/Estado: ${property.city}, ${property.state}
${property.neighborhood ? `- Bairro: ${property.neighborhood}` : ""}
- Área: ${property.area}m²
- Quartos: ${property.bedrooms} | Banheiros: ${property.bathrooms} | Vagas: ${property.parkingSpots}
${property.amenities.length > 0 ? `- Diferenciais: ${property.amenities.join(", ")}` : ""}
${property.description ? `- Descrição adicional: ${property.description}` : ""}

**Configurações do Post:**
- Plataforma: ${platformLabel(platform)}
- Tom: ${toneLabel(tone)}
- Foco principal: ${focusLabel(focus)}
${customInstructions ? `- Instruções adicionais: ${customInstructions}` : ""}

**Retorne EXATAMENTE este JSON:**
{
  "title": "título curto e impactante para o post",
  "content": "texto completo do post otimizado para a plataforma, com quebras de linha \\n onde necessário, call-to-action no final",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "score": 85,
  "aiNotes": "breve explicação das escolhas feitas e por que este post deve performar bem"
}

O score deve ser um número de 0-100 refletindo a qualidade e potencial de engajamento estimado do post. Hashtags sem o símbolo #.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned empty response");

  const parsed = JSON.parse(raw);
  return {
    title: String(parsed.title ?? ""),
    content: String(parsed.content ?? ""),
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(String) : [],
    score: Number(parsed.score ?? 75),
    aiNotes: String(parsed.aiNotes ?? ""),
  };
}

export async function runMarketAnalysis(): Promise<{
  patternsFound: number;
  findings: string[];
  trends: Array<{
    title: string;
    description: string;
    score: number;
    platform: string;
    exampleText: string;
    tags: string[];
  }>;
}> {
  const systemPrompt = `Você é um analista especialista em marketing imobiliário digital no Brasil, com acesso a dados de performance de posts em redes sociais sobre imóveis. Você analisa padrões de posts que vendem melhor no Facebook Marketplace, Facebook, Instagram e WhatsApp, especialmente para o programa Minha Casa, Minha Vida e imóveis populares.

Responda APENAS com JSON válido.`;

  const userPrompt = `Faça uma análise dos padrões de posts imobiliários que melhor performam no Brasil atualmente (2025). Considere:

1. O que funciona melhor no Facebook Marketplace para MCMV
2. Posts que geram mais engajamento no Facebook para imóveis
3. Estratégias eficazes no Instagram Stories e Feed para imóveis
4. Como comunicar pelo WhatsApp para grupos de compradores

Retorne EXATAMENTE este JSON:
{
  "findings": [
    "descoberta 1 sobre o que performa melhor",
    "descoberta 2",
    "descoberta 3",
    "descoberta 4",
    "descoberta 5"
  ],
  "trends": [
    {
      "title": "nome do padrão ou tendência",
      "description": "descrição detalhada de por que funciona e como aplicar",
      "score": 92,
      "platform": "facebook_marketplace",
      "exampleText": "exemplo curto de como seria o início de um post seguindo este padrão",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Inclua 6 a 8 trends diferentes, cobrindo diferentes plataformas. Scores de 70-98. Base em boas práticas reais de marketing imobiliário no Brasil.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.6,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned empty response");

  const parsed = JSON.parse(raw);
  const trends = Array.isArray(parsed.trends) ? parsed.trends : [];
  return {
    patternsFound: trends.length,
    findings: Array.isArray(parsed.findings) ? parsed.findings.map(String) : [],
    trends,
  };
}
