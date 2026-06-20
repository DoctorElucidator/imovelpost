import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  useListProperties, 
  getListPropertiesQueryKey,
  useGeneratePost,
  useCreatePost,
  GeneratePostRequestPlatform,
  GeneratePostRequestTone,
  GeneratePostRequestFocus,
  PostInputPlatform,
  PostInputStatus
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Copy, Save, Edit2, AlertCircle } from "lucide-react";
import { translatePlatform } from "@/lib/utils";

const formSchema = z.object({
  propertyId: z.coerce.number().min(1, "Selecione um imóvel"),
  platform: z.enum([GeneratePostRequestPlatform.facebook, GeneratePostRequestPlatform.facebook_marketplace, GeneratePostRequestPlatform.instagram, GeneratePostRequestPlatform.whatsapp]),
  tone: z.enum([GeneratePostRequestTone.professional, GeneratePostRequestTone.friendly, GeneratePostRequestTone.urgent, GeneratePostRequestTone.emotional]).optional(),
  focus: z.enum([GeneratePostRequestFocus.price, GeneratePostRequestFocus.location, GeneratePostRequestFocus.program, GeneratePostRequestFocus.amenities, GeneratePostRequestFocus.lifestyle]).optional(),
  customInstructions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Generate() {
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const initialPropertyId = searchParams.get("propertyId");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: properties, isLoading: isPropertiesLoading } = useListProperties({
    query: { queryKey: getListPropertiesQueryKey() }
  });

  const generateMutation = useGeneratePost();
  const createMutation = useCreatePost();

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
    }
  });

  const onGenerate = (data: FormValues) => {
    generateMutation.mutate({ data }, {
      onSuccess: (res) => {
        setGeneratedResult({
          ...res,
          propertyId: data.propertyId
        });
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gerar Post com IA</h2>
        <p className="text-muted-foreground mt-1">Configure os parâmetros e deixe a IA criar o post perfeito para você.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário de Configuração */}
        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm h-fit">
          <form onSubmit={form.handleSubmit(onGenerate)} className="space-y-6">
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
              {form.formState.errors.propertyId && <p className="text-sm text-destructive">{form.formState.errors.propertyId.message}</p>}
            </div>

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

            <div className="space-y-2">
              <label className="text-sm font-medium">Instruções Adicionais (Opcional)</label>
              <textarea 
                {...form.register("customInstructions")}
                placeholder="Ex: Mencione que aceita carro como entrada..."
                className="w-full min-h-[80px] p-3 rounded-md border border-input bg-transparent text-sm resize-y"
              />
            </div>

            <button 
              type="submit"
              disabled={generateMutation.isPending}
              className="w-full h-12 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {generateMutation.isPending ? (
                <span className="w-5 h-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin"></span>
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              {generateMutation.isPending ? "Gerando..." : "Gerar Post"}
            </button>
          </form>
        </div>

        {/* Resultado */}
        <div className="space-y-6">
          {generatedResult ? (
            <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
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
                    <AlertCircle className="w-5 h-5 text-secondary shrink-0" />
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
            <div className="h-full bg-card border border-card-border border-dashed rounded-xl flex items-center justify-center p-12 text-center">
              <div>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground mx-auto mb-4">
                  <Wand2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Pronto para gerar</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  Preencha o formulário ao lado e clique em "Gerar Post" para ver a mágica acontecer.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
