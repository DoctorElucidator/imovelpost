import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function translateProgram(program: string): string {
  const map: Record<string, string> = {
    minha_casa_minha_vida: "Minha Casa, Minha Vida",
    mcmv_faixa1: "MCMV Faixa 1",
    mcmv_faixa2: "MCMV Faixa 2",
    mcmv_faixa3: "MCMV Faixa 3",
    regular: "Regular",
  };
  return map[program] || program;
}

export function translateType(type: string): string {
  const map: Record<string, string> = {
    apartment: "Apartamento",
    house: "Casa",
    studio: "Studio",
    commercial: "Comercial",
    land: "Terreno",
  };
  return map[type] || type;
}

export function translatePlatform(platform: string): string {
  const map: Record<string, string> = {
    facebook: "Facebook",
    facebook_marketplace: "Facebook Marketplace",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    all: "Todos",
  };
  return map[platform] || platform;
}

export function translateStatus(status: string): string {
  const map: Record<string, string> = {
    available: "Disponível",
    sold: "Vendido",
    reserved: "Reservado",
    draft: "Rascunho",
    approved: "Aprovado",
    published: "Publicado",
    archived: "Arquivado",
    active: "Ativo",
    paused: "Pausado",
    completed: "Concluído",
  };
  return map[status] || status;
}

export function translateTone(tone?: string): string {
  if (!tone) return "";
  const map: Record<string, string> = {
    professional: "Profissional",
    friendly: "Amigável",
    urgent: "Urgente",
    emotional: "Emocional",
  };
  return map[tone] || tone;
}

export function translateFocus(focus?: string): string {
  if (!focus) return "";
  const map: Record<string, string> = {
    price: "Preço",
    location: "Localização",
    program: "Programa",
    amenities: "Comodidades",
    lifestyle: "Estilo de Vida",
  };
  return map[focus] || focus;
}
