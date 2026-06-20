import { useGetInsights, getGetInsightsQueryKey, useGetTrends, getGetTrendsQueryKey, useRunAnalysis } from "@workspace/api-client-react";
import { TrendingUp, BarChart3, Activity, Zap, ArrowUpRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { translatePlatform, translateProgram, translateTone } from "@/lib/utils";

export default function Analysis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: insights, isLoading: isInsightsLoading } = useGetInsights({
    query: { queryKey: getGetInsightsQueryKey() }
  });

  const { data: trends, isLoading: isTrendsLoading } = useGetTrends({
    query: { queryKey: getGetTrendsQueryKey() }
  });

  const runAnalysisMutation = useRunAnalysis();

  const handleRunAnalysis = () => {
    runAnalysisMutation.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Análise Iniciada", description: "A IA está analisando seus dados para gerar novos insights." });
        // Simulating a delay before invalidating to show loading state nicely
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: getGetInsightsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTrendsQueryKey() });
          toast({ title: "Análise Concluída", description: "Insights e tendências atualizados." });
        }, 2000);
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao iniciar análise.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            Análise e Insights
          </h2>
          <p className="text-muted-foreground mt-1">Descubra o que funciona melhor para o seu público e otimize suas estratégias.</p>
        </div>
        <button 
          onClick={handleRunAnalysis}
          disabled={runAnalysisMutation.isPending}
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground h-10 px-6 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
        >
          {runAnalysisMutation.isPending ? (
            <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin"></span>
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Executar Nova Análise
        </button>
      </div>

      {isInsightsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
        </div>
      ) : insights ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground mb-2">Posts Analisados</p>
            <p className="text-3xl font-bold">{insights.totalPostsAnalyzed}</p>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground mb-2">Score Médio</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-primary">{Math.round(insights.avgEngagementScore)}</p>
              <span className="text-sm text-muted-foreground mb-1">/100</span>
            </div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground mb-2">Melhor Tom</p>
            <p className="text-xl font-bold">{translateTone(insights.bestPerformingTone) || 'N/A'}</p>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground mb-2">Melhor Plataforma</p>
            <p className="text-xl font-bold">{translatePlatform(insights.bestPerformingPlatform || '') || 'N/A'}</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" />
            Tendências Detectadas
          </h3>
          
          {isTrendsLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted rounded-xl"></div>)}
            </div>
          ) : trends && trends.length > 0 ? (
            <div className="space-y-4">
              {trends.map(trend => (
                <div key={trend.id} className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-bold flex items-center gap-2">
                      {trend.title}
                      <span className="flex items-center text-xs font-semibold text-chart-3 bg-chart-3/10 px-2 py-0.5 rounded-full">
                        <ArrowUpRight className="w-3 h-3 mr-1" /> Score {trend.score}
                      </span>
                    </h4>
                    <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md border border-border">
                      {translatePlatform(trend.platform)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">{trend.description}</p>
                  
                  {trend.exampleText && (
                    <div className="bg-muted/50 border border-border rounded-lg p-3 mb-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Exemplo de Aplicação</p>
                      <p className="text-sm italic">"{trend.exampleText}"</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {trend.tags.map((tag, i) => (
                      <span key={i} className="text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20 px-2 py-1 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="bg-card border border-card-border rounded-xl p-12 text-center shadow-sm">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h4 className="text-lg font-medium">Nenhuma tendência detectada</h4>
                <p className="text-muted-foreground mt-1">Execute uma análise para gerar tendências baseadas nos seus posts.</p>
             </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Principais Descobertas</h3>
          
          {insights?.keyFindings && insights.keyFindings.length > 0 ? (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm space-y-4">
              {insights.keyFindings.map((finding, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-medium text-foreground">{finding}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm text-center">
              <p className="text-muted-foreground text-sm">Sem descobertas recentes.</p>
            </div>
          )}

          {insights?.topCities && insights.topCities.length > 0 && (
            <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Cidades em Destaque</h4>
              <ul className="space-y-3">
                {insights.topCities.map((city, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    {city}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
