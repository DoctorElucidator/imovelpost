import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Building, FileText, Megaphone, CheckCircle, Clock } from "lucide-react";
import { Link } from "wouter";
import { formatBRL, translatePlatform, translateProgram } from "@/lib/utils";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>
          <p className="text-muted-foreground mt-1">Acompanhe a performance das suas propriedades e publicações.</p>
        </div>
        <Link href="/generate" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground h-10 px-6 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <CheckCircle className="w-4 h-4" />
            Gerar Novo Post
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-card border border-card-border rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Imóveis</p>
              <p className="text-2xl font-bold">{stats.totalProperties}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card border border-card-border rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/10 rounded-lg text-secondary">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Posts Publicados</p>
              <p className="text-2xl font-bold">{stats.publishedPosts}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card border border-card-border rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-chart-3/10 rounded-lg text-chart-3">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Campanhas Ativas</p>
              <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card border border-card-border rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-chart-4/10 rounded-lg text-chart-4">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Posts em Rascunho</p>
              <p className="text-2xl font-bold">{stats.draftPosts}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4">
          <h3 className="text-xl font-semibold">Atividade Recente</h3>
          <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="divide-y divide-border">
                {stats.recentActivity.map((activity, i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <p className="text-sm">{activity}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>Nenhuma atividade recente registrada.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Destaques</h3>
          <div className="bg-card border border-card-border rounded-xl shadow-sm p-6 space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Programa Principal</p>
              <p className="text-lg font-semibold text-foreground">
                {stats.topProgram ? translateProgram(stats.topProgram) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Plataforma de Melhor Desempenho</p>
              <p className="text-lg font-semibold text-foreground">
                {stats.topPlatform ? translatePlatform(stats.topPlatform) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pontuação Média AI</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${stats.avgPostScore || 0}%` }} />
                </div>
                <span className="font-bold">{stats.avgPostScore || 0}/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
