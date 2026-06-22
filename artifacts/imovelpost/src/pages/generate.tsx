import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { 
  useListProperties, 
  getListPropertiesQueryKey,
  useGeneratePost,
  useCreatePost,
  useImportListing,
  type ImportedListing,
  GeneratePostRequestPlatform,
  GeneratePostRequestTone,
  GeneratePostRequestFocus,
  PostInputPlatform,
  PostInputStatus
} from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Wand2, Copy, Save, Edit2, AlertCircle, 
  ImagePlus, X, ChevronDown, ChevronUp,
  MapPin, Maximize2, BadgeDollarSign, Loader2,
  Link2, Download, CheckSquare, Square, ExternalLink
} from "lucide-react";
import { translatePlatform } from "@/lib/utils";

const formSchema = z.object({
  propertyId: z.coerce.number().min(1, "Selecione um imóvel"),
  platform: z.enum([
    GeneratePostRequestPlatform.facebook,
    GeneratePostRequestPlatform.facebook_marketplace,
    GeneratePostRequestPlatform.instagram,
    GeneratePostRequestPlatform.whatsapp
  ]),
  tone: z.enum([
    GeneratePostRequestTone.professional,
    GeneratePostRequestTone.friendly,
    GeneratePostRequestTone.urgent,
    GeneratePostRequestTone.emotional
  ]).optional(),
  focus: z.enum([
    GeneratePostRequestFocus.price,
    GeneratePostRequestFocus.location,
    GeneratePostRequestFocus.program,
    GeneratePostRequestFocus.amenities,
    GeneratePostRequestFocus.lifestyle
  ]).optional(),
  customInstructions: z.string().optional(),
  regionContext: z.string().optional(),
  sizeContext: z.string().optional(),
  valueContext: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Photo {
  type: "uploaded" | "imported";
  url: string;
  previewUrl: string;
  name: string;
}

function formatBRL(value: number | null | undefined): string {
  if (!value) return "";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function Generate() {
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const initialPropertyId = searchParams.get("propertyId");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showContextFields, setShowContextFields] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Import from portal state
  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importedListing, setImportedListing] = useState<ImportedListing | null>(null);
  const [selectedImportPhotos, setSelectedImportPhotos] = useState<Set<string>>(new Set());

  const { data: properties, isLoading: isPropertiesLoading } = useListProperties({
    query: { queryKey: getListPropertiesQueryKey() }
  });

  const generateMutation = useGeneratePost();
  const createMutation = useCreatePost();
  const importMutation = useImportListing();

  const { uploadFile } = useUpload({
    onError: () => {
      toast({ title: "Erro no upload", description: "Falha ao enviar foto.", variant: "destructive" });
    }
  });

  const [generatedResult, setGeneratedResult] = useState<{
    title: string;
    content: string;
    hashtags: string[];
    platform: string;
    score: number;
    aiNotes: string;
    propertyId: number;
  } | null>(null);

  const [editedContent, setEditedContent] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: initialPropertyId ? parseInt(initialPropertyId, 10) : 0,
      platform: GeneratePostRequestPlatform.instagram,
      tone: GeneratePostRequestTone.professional,
      focus: GeneratePostRequestFocus.program,
      customInstructions: "",
      regionContext: "",
      sizeContext: "",
      valueContext: "",
    }
  });

  const handlePhotoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = 5 - photos.length;
    const toUpload = files.slice(0, remaining);

    setIsUploading(true);
    for (const file of toUpload) {
      if (!file.type.startsWith("image/")) continue;
      const previewUrl = URL.createObjectURL(file);
      const result = await uploadFile(file);
      if (result) {
        setPhotos(prev => [...prev, {
          type: "uploaded",
          url: `/api/storage${result.objectPath}`,
          previewUrl,
          name: file.name,
        }]);
      }
    }
    setIsUploading(false);
    e.target.value = "";
  }, [photos.length, uploadFile]);

  const removePhoto = useCallback((index: number) => {
    setPhotos(prev => {
      const next = [...prev];
      if (next[index].type === "uploaded") URL.revokeObjectURL(next[index].previewUrl);
      next.splice(index, 1);
      return next;
    });
  }, []);

  const handleImport = () => {
    if (!importUrl.trim()) return;
    importMutation.mutate({ data: { url: importUrl.trim() } }, {
      onSuccess: (listing) => {
        setImportedListing(listing);
        setSelectedImportPhotos(new Set(listing.photos.slice(0, 5)));
        toast({ title: `Importado do ${listing.source}`, description: `${listing.photos.length} fotos encontradas.` });
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Erro ao importar listagem.";
        toast({ title: "Erro ao importar", description: msg, variant: "destructive" });
      }
    });
  };

  const toggleImportPhoto = (url: string) => {
    setSelectedImportPhotos(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else if (next.size < 5) next.add(url);
      return next;
    });
  };

  const applyImportedPhotos = () => {
    const available = 5 - photos.filter(p => p.type === "uploaded").length;
    const toAdd = [...selectedImportPhotos]
      .filter(url => !photos.some(p => p.url === url))
      .slice(0, available);

    if (toAdd.length === 0) {
      toast({ title: "Nenhuma foto adicionada", description: "Todas as fotos selecionadas já foram adicionadas." });
      return;
    }

    setPhotos(prev => [
      ...prev.filter(p => p.type === "uploaded"),
      ...toAdd.map((url, i) => ({
        type: "imported" as const,
        url,
        previewUrl: url,
        name: `foto-importada-${i + 1}`,
      }))
    ]);

    toast({ title: `${toAdd.length} foto${toAdd.length > 1 ? "s" : ""} adicionada${toAdd.length > 1 ? "s" : ""}`, description: "Fotos do portal prontas para uso." });
  };

  const [importedDescription, setImportedDescription] = useState<string | null>(null);

  const applyImportedContext = (listing: ImportedListing) => {
    if (listing.neighborhood || listing.city) {
      const parts: string[] = [];
      if (listing.neighborhood) parts.push(`Bairro: ${listing.neighborhood}`);
      if (listing.city) parts.push(`Cidade: ${listing.city}`);
      form.setValue("regionContext", parts.join(". "));
    }

    const sizeParts: string[] = [];
    if (listing.area) sizeParts.push(`Área: ${listing.area}m²`);
    if (listing.bedrooms) sizeParts.push(`${listing.bedrooms} quarto${listing.bedrooms > 1 ? "s" : ""}`);
    if (listing.bathrooms) sizeParts.push(`${listing.bathrooms} banheiro${listing.bathrooms > 1 ? "s" : ""}`);
    if (listing.parkingSpots) sizeParts.push(`${listing.parkingSpots} vaga${listing.parkingSpots > 1 ? "s" : ""}`);
    if (sizeParts.length) form.setValue("sizeContext", sizeParts.join(", "));

    if (listing.price) {
      form.setValue("valueContext", `Valor: ${formatBRL(listing.price)}`);
    }

    if (!showContextFields) setShowContextFields(true);

    toast({ title: "Dados aplicados", description: "As informações do anúncio foram preenchidas nos campos de contexto." });
  };

  const applyListingDescription = (listing: ImportedListing) => {
    const desc = listing.listingDescription ?? listing.description ?? null;
    if (!desc) {
      toast({ title: "Sem descrição", description: "Nenhuma descrição foi encontrada neste anúncio.", variant: "destructive" });
      return;
    }
    setImportedDescription(desc);
    toast({ title: "Descrição carregada", description: "A descrição do anúncio será enviada para a IA ao gerar o post." });
  };

  const onGenerate = (data: FormValues) => {
    const imageUrls = photos.map(p => p.url);
    
    generateMutation.mutate({ 
      data: {
        ...data,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        regionContext: data.regionContext || undefined,
        sizeContext: data.sizeContext || undefined,
        valueContext: data.valueContext || undefined,
        listingDescription: importedDescription ?? undefined,
      }
    }, {
      onSuccess: (res) => {
        setGeneratedResult({ ...res, propertyId: data.propertyId });
        setEditedContent(res.content);
        toast({ title: "Post Gerado", description: "O post foi gerado com sucesso." });
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao gerar post.", variant: "destructive" });
      }
    });
  };

  const onSave = (status: PostInputStatus) => {
    if (!generatedResult) return;
    createMutation.mutate({
      data: {
        title: generatedResult.title,
        content: editedContent,
        hashtags: generatedResult.hashtags,
        platform: generatedResult.platform as PostInputPlatform,
        status: status,
        propertyId: generatedResult.propertyId,
        score: generatedResult.score,
        aiNotes: generatedResult.aiNotes,
      }
    }, {
      onSuccess: (post) => {
        toast({ title: "Sucesso", description: `Post ${status === 'draft' ? 'salvo como rascunho' : 'aprovado'}.` });
        setLocation(`/posts/${post.id}`);
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao salvar post.", variant: "destructive" });
      }
    });
  };

  const hasContextFilled = showContextFields && (
    form.watch("regionContext") || form.watch("sizeContext") || form.watch("valueContext")
  );

  const totalPhotos = photos.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gerar Post com IA</h2>
        <p className="text-muted-foreground mt-1">Configure os parâmetros e deixe a IA criar o post perfeito para você.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <div className="space-y-4">
          {/* Importar de portal */}
          <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowImport(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                Importar fotos de portal imobiliário
                {importedListing && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {importedListing.source}
                  </span>
                )}
              </span>
              {showImport ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {showImport && (
              <div className="border-t border-border px-4 py-4 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Cole a URL de um anúncio do VivaReal, ZAP Imóveis, OLX, Órulo ou outro portal para importar as fotos e dados do imóvel.
                </p>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={importUrl}
                    onChange={e => setImportUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleImport()}
                    placeholder="https://www.vivareal.com.br/imovel/..."
                    className="flex-1 h-9 px-3 rounded-md border border-input bg-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={importMutation.isPending || !importUrl.trim()}
                    className="h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
                  >
                    {importMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {importMutation.isPending ? "Importando..." : "Importar"}
                  </button>
                </div>

                {importedListing && (
                  <div className="space-y-3">
                    {/* Dados extraídos */}
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Dados extraídos — {importedListing.source}
                        </p>
                        <a
                          href={importUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary flex items-center gap-1 hover:underline"
                        >
                          Ver anúncio <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {importedListing.title && (
                        <p className="text-sm font-medium text-foreground line-clamp-2">{importedListing.title}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {importedListing.price !== null && importedListing.price !== undefined && (
                          <span className="font-semibold text-foreground">{formatBRL(importedListing.price)}</span>
                        )}
                        {importedListing.area && <span>{importedListing.area}m²</span>}
                        {importedListing.bedrooms && <span>{importedListing.bedrooms} qto{importedListing.bedrooms > 1 ? "s" : ""}</span>}
                        {importedListing.bathrooms && <span>{importedListing.bathrooms} ban{importedListing.bathrooms > 1 ? "hs" : "h"}</span>}
                        {importedListing.parkingSpots && <span>{importedListing.parkingSpots} vaga{importedListing.parkingSpots > 1 ? "s" : ""}</span>}
                        {importedListing.neighborhood && <span>{importedListing.neighborhood}</span>}
                        {importedListing.city && <span>{importedListing.city}</span>}
                      </div>
                    </div>

                    {/* Fotos */}
                    {importedListing.photos.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground">
                            {importedListing.photos.length} foto{importedListing.photos.length > 1 ? "s" : ""} encontrada{importedListing.photos.length > 1 ? "s" : ""} — selecione as que quer usar
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedImportPhotos.size === importedListing.photos.length) {
                                setSelectedImportPhotos(new Set());
                              } else {
                                setSelectedImportPhotos(new Set(importedListing.photos.slice(0, 5)));
                              }
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            {selectedImportPhotos.size === importedListing.photos.length ? "Desmarcar todas" : "Selecionar todas (até 5)"}
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                          {importedListing.photos.map((url, i) => {
                            const selected = selectedImportPhotos.has(url);
                            const alreadyAdded = photos.some(p => p.url === url);
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => !alreadyAdded && toggleImportPhoto(url)}
                                disabled={alreadyAdded}
                                className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                                  alreadyAdded 
                                    ? "border-chart-3 opacity-60 cursor-default" 
                                    : selected 
                                      ? "border-primary" 
                                      : "border-transparent hover:border-primary/40"
                                }`}
                              >
                                <img
                                  src={url}
                                  alt={`Foto ${i + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                                <div className={`absolute top-1 right-1 ${alreadyAdded ? "text-chart-3" : selected ? "text-primary" : "text-white/70"}`}>
                                  {alreadyAdded ? (
                                    <CheckSquare className="w-4 h-4 drop-shadow" />
                                  ) : selected ? (
                                    <CheckSquare className="w-4 h-4 drop-shadow" />
                                  ) : (
                                    <Square className="w-4 h-4 drop-shadow" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex flex-col gap-2 pt-1">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={applyImportedPhotos}
                              disabled={selectedImportPhotos.size === 0 || totalPhotos >= 5}
                              className="flex-1 h-8 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <ImagePlus className="w-3.5 h-3.5" />
                              Usar {selectedImportPhotos.size > 0 ? `${selectedImportPhotos.size} ` : ""}foto{selectedImportPhotos.size !== 1 ? "s" : ""} selecionada{selectedImportPhotos.size !== 1 ? "s" : ""}
                            </button>
                            <button
                              type="button"
                              onClick={() => applyImportedContext(importedListing)}
                              className="flex-1 h-8 rounded-md text-xs font-medium border border-input bg-card hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
                            >
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              Preencher contexto
                            </button>
                          </div>
                          {(importedListing.listingDescription || importedListing.description) && (
                            <button
                              type="button"
                              onClick={() => applyListingDescription(importedListing)}
                              className={`w-full h-8 rounded-md text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                                importedDescription
                                  ? "border-chart-3 bg-chart-3/10 text-chart-3"
                                  : "border-input bg-card hover:bg-muted"
                              }`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              {importedDescription ? "Descrição do anuncio aplicada" : "Usar descricao do anuncio para a IA"}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground text-center py-3 bg-muted/20 rounded-md">
                        Nenhuma foto encontrada nesta pagina. Tente outro portal ou adicione fotos manualmente.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Formulário principal */}
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
            <form onSubmit={form.handleSubmit(onGenerate)} className="space-y-5">
              {/* Imóvel */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Imóvel</label>
                <select 
                  {...form.register("propertyId")}
                  className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                  disabled={isPropertiesLoading}
                >
                  <option value={0}>Selecione um imóvel</option>
                  {properties?.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                {form.formState.errors.propertyId && (
                  <p className="text-sm text-destructive">{form.formState.errors.propertyId.message}</p>
                )}
              </div>

              {/* Fotos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Fotos para a IA analisar</label>
                  <span className="text-xs text-muted-foreground">{totalPhotos}/5 fotos</span>
                </div>

                {photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border border-border group">
                        <img 
                          src={photo.previewUrl} 
                          alt={photo.name} 
                          className="w-full h-full object-cover"
                          onError={e => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='10' fill='%23999'%3EFoto%3C/text%3E%3C/svg%3E";
                          }}
                        />
                        {photo.type === "imported" && (
                          <div className="absolute bottom-0.5 left-0.5">
                            <ExternalLink className="w-2.5 h-2.5 text-white drop-shadow" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                    {isUploading && (
                      <div className="w-16 h-16 rounded-md border border-dashed border-primary/40 flex items-center justify-center bg-primary/5">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    )}
                  </div>
                )}

                {totalPhotos < 5 && (
                  <label className={`flex items-center gap-2 px-3 py-2.5 rounded-md border border-dashed border-input hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors text-sm text-muted-foreground ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
                    <ImagePlus className="w-4 h-4 text-primary" />
                    {photos.length === 0 ? "Adicionar fotos do dispositivo" : "Adicionar mais fotos"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoSelect}
                      disabled={isUploading}
                    />
                  </label>
                )}
                {photos.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    A IA analisará as fotos para descrever o imóvel com mais precisão.
                    {photos.some(p => p.type === "imported") && " Fotos com o icone de link foram importadas do portal."}
                  </p>
                )}
              </div>

              {/* Plataforma */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Plataforma</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: GeneratePostRequestPlatform.instagram, label: "Instagram" },
                    { id: GeneratePostRequestPlatform.facebook, label: "Facebook" },
                    { id: GeneratePostRequestPlatform.facebook_marketplace, label: "FB Marketplace" },
                    { id: GeneratePostRequestPlatform.whatsapp, label: "WhatsApp" },
                  ].map(platform => (
                    <label key={platform.id} className="relative flex items-center justify-center p-3 border border-input rounded-md cursor-pointer hover:bg-muted transition-colors has-[:checked]:bg-primary/5 has-[:checked]:border-primary">
                      <input 
                        type="radio" 
                        value={platform.id} 
                        {...form.register("platform")}
                        className="absolute opacity-0"
                      />
                      <span className="text-sm font-medium">{platform.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tom e Foco */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tom de Voz</label>
                  <select 
                    {...form.register("tone")}
                    className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                  >
                    <option value="professional">Profissional</option>
                    <option value="friendly">Amigável</option>
                    <option value="urgent">Urgente (Escassez)</option>
                    <option value="emotional">Emocional</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Foco Principal</label>
                  <select 
                    {...form.register("focus")}
                    className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                  >
                    <option value="program">Programa (MCMV)</option>
                    <option value="price">Preço e Condições</option>
                    <option value="location">Localização</option>
                    <option value="amenities">Comodidades</option>
                    <option value="lifestyle">Estilo de Vida</option>
                  </select>
                </div>
              </div>

              {/* Contexto adicional */}
              <div className="border border-dashed border-input rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowContextFields(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    Contexto adicional para a IA
                    {hasContextFilled && (
                      <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">preenchido</span>
                    )}
                  </span>
                  {showContextFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showContextFields && (
                  <div className="px-4 pb-4 space-y-4 border-t border-dashed border-input pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> Sobre a região / bairro
                      </label>
                      <textarea
                        {...form.register("regionContext")}
                        placeholder="Ex: Próximo ao metrô, Shopping X a 5min, bairro tranquilo com praça..."
                        className="w-full min-h-[64px] p-3 rounded-md border border-input bg-transparent text-sm resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                        <Maximize2 className="w-3.5 h-3.5 text-primary" /> Sobre o espaço / tamanho
                      </label>
                      <textarea
                        {...form.register("sizeContext")}
                        placeholder="Ex: Sala ampla com varanda, quartos com armários embutidos, cozinha planejada..."
                        className="w-full min-h-[64px] p-3 rounded-md border border-input bg-transparent text-sm resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                        <BadgeDollarSign className="w-3.5 h-3.5 text-primary" /> Sobre o valor / condições
                      </label>
                      <textarea
                        {...form.register("valueContext")}
                        placeholder="Ex: Aceita carro como entrada, FGTS, parcela menor que aluguel, subsídio até R$ 55.000..."
                        className="w-full min-h-[64px] p-3 rounded-md border border-input bg-transparent text-sm resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Instruções livres */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Instruções adicionais (Opcional)</label>
                <textarea 
                  {...form.register("customInstructions")}
                  placeholder="Ex: Mencione que é o último apartamento disponível neste andar..."
                  className="w-full min-h-[64px] p-3 rounded-md border border-input bg-transparent text-sm resize-y"
                />
              </div>

              <button 
                type="submit"
                disabled={generateMutation.isPending || isUploading}
                className="w-full h-12 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Gerar Post{totalPhotos > 0 ? ` com ${totalPhotos} foto${totalPhotos > 1 ? "s" : ""}` : ""}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Resultado */}
        <div className="space-y-6">
          {generatedResult ? (
            <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {translatePlatform(generatedResult.platform)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">{generatedResult.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-chart-3/10 text-chart-3 rounded-md">
                    <span className="text-xs font-bold uppercase tracking-wider">Score</span>
                    <span className="text-sm font-bold">{generatedResult.score}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Edit2 className="w-4 h-4" /> Conteúdo do Post (Editável)
                  </label>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full min-h-[250px] p-4 rounded-md border border-input bg-transparent text-sm leading-relaxed focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="mb-6">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Hashtags Sugeridas</p>
                  <div className="flex flex-wrap gap-2">
                    {generatedResult.hashtags.map((tag, i) => (
                      <span key={i} className="text-sm text-primary bg-primary/5 px-2 py-1 rounded-md">
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                </div>

                {generatedResult.aiNotes && (
                  <div className="mb-6 p-4 bg-secondary/5 border border-secondary/20 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-secondary">Notas da IA</p>
                      <p className="text-sm text-muted-foreground mt-1">{generatedResult.aiNotes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border bg-muted/20 flex gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${editedContent}\n\n${generatedResult.hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}`);
                    toast({ title: "Copiado", description: "Conteúdo copiado para a área de transferência." });
                  }}
                  className="flex-1 h-10 rounded-md font-medium border border-input bg-card hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Copy className="w-4 h-4" /> Copiar
                </button>
                <button 
                  onClick={() => onSave(PostInputStatus.draft)}
                  disabled={createMutation.isPending}
                  className="flex-1 h-10 rounded-md font-medium border border-input bg-card hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  Salvar Rascunho
                </button>
                <button 
                  onClick={() => onSave(PostInputStatus.approved)}
                  disabled={createMutation.isPending}
                  className="flex-1 h-10 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> Aprovar Post
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-card-border border-dashed rounded-xl flex items-center justify-center p-12 text-center min-h-[400px]">
              <div>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground mx-auto mb-4">
                  <Wand2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Pronto para gerar</h3>
                <p className="text-muted-foreground mt-2 max-w-sm text-sm">
                  Importe fotos de um portal, adicione fotos do dispositivo e preencha o contexto para um post mais preciso.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
