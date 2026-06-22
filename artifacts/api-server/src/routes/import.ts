import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface ListingData {
  title: string | null;
  price: number | null;
  description: string | null;
  listingDescription: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpots: number | null;
  photos: string[];
  source: string;
}

function detectSource(url: string): string {
  if (/vivareal/i.test(url)) return "VivaReal";
  if (/zapimoveis|zap\.com/i.test(url)) return "ZAP Imóveis";
  if (/olx\.com\.br/i.test(url)) return "OLX";
  if (/orulo\.com\.br/i.test(url)) return "Órulo";
  if (/quintoandar/i.test(url)) return "QuintoAndar";
  if (/imovelweb/i.test(url)) return "ImovelWeb";
  if (/mercadolivre|mercadolibre/i.test(url)) return "Mercado Livre";
  return "Portal Imobiliário";
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) results.push(...parsed);
      else results.push(parsed);
    } catch {
    }
  }
  return results;
}

function extractMeta(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i"
  );
  const m = regex.exec(html) || alt.exec(html);
  return m ? m[1].trim() : null;
}

function extractAllMeta(html: string, property: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "gi"
  );
  let m;
  while ((m = regex.exec(html)) !== null) {
    if (m[1]) results.push(m[1].trim());
  }
  return results;
}

function parsePrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9,.]/g, "");
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

function parseArea(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const m = /(\d+(?:[.,]\d+)?)\s*m/i.exec(raw);
  if (!m) return null;
  return parseFloat(m[1].replace(",", "."));
}

function extractFromJsonLd(nodes: Record<string, unknown>[]): Partial<ListingData> {
  const data: Partial<ListingData> = {};

  for (const node of nodes) {
    const type = String(node["@type"] ?? "");

    if (/Apartment|House|SingleFamilyResidence|RealEstate|Product|Offer/i.test(type) || node.name) {
      if (!data.title && node.name) data.title = String(node.name);
      if (!data.description && node.description) data.description = String(node.description);

      if (!data.price) {
        const offers = node.offers as Record<string, unknown> | undefined;
        if (offers?.price) data.price = Number(offers.price);
        else if (node.price) data.price = Number(node.price);
      }

      if (!data.area) {
        const floors = node.floorSize as Record<string, unknown> | undefined;
        if (floors?.value) data.area = Number(floors.value);
        else if (node.floorSize) data.area = parseArea(String(node.floorSize));
      }

      if (node.numberOfRooms && !data.bedrooms) data.bedrooms = Number(node.numberOfRooms);
      if (node.numberOfBathroomsTotal && !data.bathrooms) data.bathrooms = Number(node.numberOfBathroomsTotal);

      const address = node.address as Record<string, unknown> | undefined;
      if (address) {
        const parts: string[] = [];
        if (address.streetAddress) parts.push(String(address.streetAddress));
        if (address.addressLocality && !data.neighborhood) data.neighborhood = String(address.addressLocality);
        if (address.addressRegion && !data.city) data.city = String(address.addressRegion);
        if (parts.length && !data.address) data.address = parts.join(", ");
      }

      const images: string[] = [];
      if (Array.isArray(node.image)) {
        for (const img of node.image) {
          if (typeof img === "string") images.push(img);
          else if (img && typeof img === "object") {
            const url = (img as Record<string, unknown>).url ?? (img as Record<string, unknown>).contentUrl;
            if (url) images.push(String(url));
          }
        }
      } else if (typeof node.image === "string") {
        images.push(node.image);
      } else if (node.image && typeof node.image === "object") {
        const url = (node.image as Record<string, unknown>).url;
        if (url) images.push(String(url));
      }
      if (images.length) data.photos = [...(data.photos ?? []), ...images];
    }
  }

  return data;
}

function extractEmbeddedJson(html: string): Partial<ListingData> {
  const data: Partial<ListingData> = {};

  const patterns = [
    /__INITIAL_STATE__\s*=\s*({[\s\S]+?});\s*(?:window|var|<\/script)/,
    /window\.__STATE__\s*=\s*({[\s\S]+?});\s*(?:<\/script>|window)/,
    /window\.__NUXT__\s*=\s*({[\s\S]+?});\s*(?:<\/script>|window)/,
    /"listing"\s*:\s*({[\s\S]+?})\s*,\s*"(?:similar|recommended)/,
    /"property"\s*:\s*({[\s\S]+?})\s*,\s*"(?:similar|gallery)/,
  ];

  for (const pattern of patterns) {
    const m = pattern.exec(html);
    if (!m) continue;
    try {
      const obj = JSON.parse(m[1]);
      const text = JSON.stringify(obj);

      const priceMatch = /"(?:price|valor|preco|value)"\s*:\s*(\d+(?:\.\d+)?)/i.exec(text);
      if (priceMatch && !data.price) data.price = Number(priceMatch[1]);

      const areaMatch = /"(?:area|totalArea|usableArea|areaTotal|areUtil)"\s*:\s*(\d+(?:\.\d+)?)/i.exec(text);
      if (areaMatch && !data.area) data.area = Number(areaMatch[1]);

      const bedroomsMatch = /"(?:bedrooms|quartos|rooms|suites)"\s*:\s*(\d+)/i.exec(text);
      if (bedroomsMatch && !data.bedrooms) data.bedrooms = Number(bedroomsMatch[1]);

      const bathroomsMatch = /"(?:bathrooms|banheiros|toilets)"\s*:\s*(\d+)/i.exec(text);
      if (bathroomsMatch && !data.bathrooms) data.bathrooms = Number(bathroomsMatch[1]);

      const parkingMatch = /"(?:parkingSpaces|vagas|garage|garagem)"\s*:\s*(\d+)/i.exec(text);
      if (parkingMatch && !data.parkingSpots) data.parkingSpots = Number(parkingMatch[1]);

      const neighborhoodMatch = /"(?:neighborhood|bairro|district)"\s*:\s*"([^"]{2,60})"/i.exec(text);
      if (neighborhoodMatch && !data.neighborhood) data.neighborhood = neighborhoodMatch[1];

      const cityMatch = /"(?:city|cidade)"\s*:\s*"([^"]{2,60})"/i.exec(text);
      if (cityMatch && !data.city) data.city = cityMatch[1];

      break;
    } catch {
    }
  }

  return data;
}

function extractTextDescription(html: string): string | null {
  // Remove scripts, styles, nav, header, footer, aside
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(nav|header|footer|aside|noscript)[^>]*>[\s\S]*?<\/\1>/gi, "");

  // Portal-specific description container selectors (class/id patterns)
  const portalPatterns = [
    // VivaReal / ZAP
    /class="[^"]*description[^"]*"[^>]*>([\s\S]{80,3000}?)<\/(?:p|div|section|article)/i,
    /id="[^"]*description[^"]*"[^>]*>([\s\S]{80,3000}?)<\/(?:p|div|section|article)/i,
    // Generic long <p> blocks (often the actual listing description)
    /<p[^>]*class="[^"]*(?:descri|texto|detail|observ)[^"]*"[^>]*>([\s\S]{80,2000}?)<\/p>/gi,
    // OLX / Mercado Livre
    /<div[^>]*class="[^"]*(?:descri|detail|about|caracterist)[^"]*"[^>]*>([\s\S]{80,3000}?)<\/div>/gi,
  ];

  for (const pattern of portalPatterns) {
    const m = pattern.exec(cleaned);
    if (m?.[1]) {
      const text = m[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\s{2,}/g, " ")
        .trim();
      if (text.length > 60) return text.slice(0, 1500);
    }
  }

  // Fallback: find the longest <p> block in the page
  const pTags = cleaned.match(/<p[^>]*>([\s\S]{60,1000}?)<\/p>/gi) ?? [];
  let longest = "";
  for (const tag of pTags) {
    const text = tag
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (text.length > longest.length && !/<[a-z]/i.test(text)) {
      longest = text;
    }
  }
  return longest.length > 60 ? longest.slice(0, 1500) : null;
}

function extractImagesFromHtml(html: string, sourceUrl: string): string[] {
  const photos: string[] = [];
  const seen = new Set<string>();
  const base = new URL(sourceUrl).origin;

  const addPhoto = (url: string) => {
    if (!url || seen.has(url)) return;
    if (/\.(jpg|jpeg|png|webp)/i.test(url) || url.includes("photo") || url.includes("imagem") || url.includes("image")) {
      if (url.length > 20 && !url.includes("logo") && !url.includes("icon") && !url.includes("avatar")) {
        if (url.startsWith("//")) url = "https:" + url;
        else if (url.startsWith("/")) url = base + url;
        if (url.startsWith("http")) {
          seen.add(url);
          photos.push(url);
        }
      }
    }
  };

  const photoPatterns = [
    /"(?:url|src|href|photo|foto|image)"\s*:\s*"(https?:[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
    /data-src=["'](https?:[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi,
    /src=["'](https?:[^"']+\/(?:photos?|fotos?|images?|imagens?)[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi,
  ];

  for (const pattern of photoPatterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      addPhoto(m[1]);
    }
    pattern.lastIndex = 0;
  }

  return photos;
}

router.post("/import/listing", async (req, res): Promise<void> => {
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "URL é obrigatório" });
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("Protocolo inválido");
  } catch {
    res.status(400).json({ error: "URL inválida. Use uma URL completa (https://...)" });
    return;
  }

  const source = detectSource(url);

  try {
    const response = await fetch(parsedUrl.href, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      res.status(422).json({ error: `O portal retornou erro ${response.status}. Verifique se a URL está correta e o anúncio ainda está ativo.` });
      return;
    }

    const html = await response.text();

    const jsonLdNodes = extractJsonLd(html);
    const fromJsonLd = extractFromJsonLd(jsonLdNodes);
    const fromEmbedded = extractEmbeddedJson(html);

    const ogTitle = extractMeta(html, "og:title");
    const ogDescription = extractMeta(html, "og:description");
    const ogImages = extractAllMeta(html, "og:image");
    const metaPrice = extractMeta(html, "product:price:amount") ?? extractMeta(html, "price");

    const htmlPhotos = extractImagesFromHtml(html, url);

    const allPhotos = [
      ...(fromJsonLd.photos ?? []),
      ...ogImages,
      ...htmlPhotos,
    ];

    const uniquePhotos = [...new Set(allPhotos)]
      .filter((u) => u.startsWith("http"))
      .slice(0, 20);

    const listingDescription = extractTextDescription(html);

    const listing: ListingData = {
      title: fromJsonLd.title ?? ogTitle ?? null,
      price: fromJsonLd.price ?? fromEmbedded.price ?? parsePrice(metaPrice) ?? null,
      description: fromJsonLd.description ?? ogDescription ?? null,
      listingDescription: listingDescription ?? null,
      address: fromJsonLd.address ?? null,
      neighborhood: fromJsonLd.neighborhood ?? fromEmbedded.neighborhood ?? null,
      city: fromJsonLd.city ?? fromEmbedded.city ?? null,
      area: fromJsonLd.area ?? fromEmbedded.area ?? null,
      bedrooms: fromJsonLd.bedrooms ?? fromEmbedded.bedrooms ?? null,
      bathrooms: fromJsonLd.bathrooms ?? fromEmbedded.bathrooms ?? null,
      parkingSpots: fromJsonLd.parkingSpots ?? fromEmbedded.parkingSpots ?? null,
      photos: uniquePhotos,
      source,
    };

    if (!listing.title && !listing.price && uniquePhotos.length === 0) {
      res.status(422).json({
        error:
          "Não foi possível extrair dados desta página. O portal pode exigir login ou usar renderização JavaScript dinâmica. Tente copiar a URL diretamente da barra do navegador.",
      });
      return;
    }

    res.json(listing);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("timeout") || msg.includes("TimeoutError")) {
      res.status(422).json({ error: "A página demorou muito para responder. Tente novamente." });
      return;
    }
    req.log.error({ err }, "Erro ao importar listagem");
    res.status(422).json({ error: "Não foi possível acessar esta URL. Verifique sua conexão ou tente outro portal." });
  }
});

export default router;
