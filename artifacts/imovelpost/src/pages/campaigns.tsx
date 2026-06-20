import { useState } from "react";
import { 
  useListCampaigns, 
  getListCampaignsQueryKey,
  useCreateCampaign,
  CampaignInputPlatform
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Plus, Calendar, Target, Activity } from "lucide-react";
import { translatePlatform, translateStatus } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  description: z.string().optional(),
  platform: z.enum([CampaignInputPlatform.all, CampaignInputPlatform.facebook, CampaignInputPlatform.facebook_marketplace, CampaignInputPlatform.instagram, CampaignInputPlatform.whatsapp]),
  targetCity: z.string().optional(),
  targetProgram: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Campaigns() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: campaigns, isLoading } = useListCampaigns({
    query: { queryKey: getListCampaignsQueryKey() }
  });

  const createMutation = useCreateCampaign();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      platform: CampaignInputPlatform.all,
      targetCity: "",
      targetProgram: "",
    }
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
        toast({ title: "Sucesso", description: "Campanha criada." });
        setIsModalOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao criar campanha.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campanhas</h2>
          <p className="text-muted-foreground mt-1">Organize seus posts por objetivo, região ou programa.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground h-10 px-4 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Campanha
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse"></div>)}
        </div>
      ) : campaigns && campaigns.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="bg-card border border-card-border rounded-xl p-6 shadow-sm hover:border-primary/30 transition-colors flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{campaign.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description || "Sem descrição"}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
                  ${campaign.status === 'active' ? 'bg-primary/10 text-primary border border-primary/20' : 
                    campaign.status === 'paused' ? 'bg-chart-4/10 text-chart-4 border border-chart-4/20' : 
                    'bg-muted text-muted-foreground border border-border'}
                `}>
                  {translateStatus(campaign.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{campaign.postsCount}</span> posts
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Megaphone className="w-4 h-4 text-secondary" />
                  <span className="font-medium text-foreground">{translatePlatform(campaign.platform)}</span>
                </div>
                {(campaign.targetCity || campaign.targetProgram) && (
                  <div className="col-span-2 flex flex-wrap gap-2 mt-2">
                    {campaign.targetCity && (
                      <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded border border-border">
                        <Target className="w-3 h-3" /> {campaign.targetCity}
                      </span>
                    )}
                    {campaign.targetProgram && (
                      <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded border border-border">
                        <Target className="w-3 h-3" /> {campaign.targetProgram}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-card-border rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground mx-auto mb-4">
            <Megaphone className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Nenhuma campanha</h3>
          <p className="text-muted-foreground mt-1 mb-6">Agrupe posts para estratégias de vendas focadas.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground h-10 px-6 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Criar Campanha
          </button>
        </div>
      )}

      {/* Basic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Nova Campanha</h3>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome da Campanha</label>
                <input 
                  {...form.register("name")}
                  className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                  placeholder="Ex: Liquidação Centro"
                />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Plataforma Foco</label>
                <select 
                  {...form.register("platform")}
                  className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                >
                  <option value="all">Todas</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cidade Alvo</label>
                  <input 
                    {...form.register("targetCity")}
                    className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Programa Alvo</label>
                  <input 
                    {...form.register("targetProgram")}
                    className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                    placeholder="Ex: MCMV"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <textarea 
                  {...form.register("description")}
                  className="w-full min-h-[80px] p-3 rounded-md border border-input bg-transparent text-sm resize-y"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 rounded-md font-medium border border-input hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={createMutation.isPending}
                  className="h-10 px-6 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  {createMutation.isPending ? "Criando..." : "Criar Campanha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
