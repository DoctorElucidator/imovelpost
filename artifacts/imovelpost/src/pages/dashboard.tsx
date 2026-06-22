import { useMemo } from "react";
import { 
  useGetDashboardStats, 
  getGetDashboardStatsQueryKey,
  useListPosts,
  getListPostsQueryKey
} from "@workspace/api-client-react";
import { Building, FileText, Megaphone, CheckCircle, Clock, Calendar, MessageCircle, Wand2 } from "lucide-react";
import { Link } from "wouter";
import { formatBRL, translatePlatform, translateProgram } from "@/lib/utils";

function formatScheduledDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const postDay = new Date(d);
  postDay.setHours(0, 0, 0, 0);

  const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (postDay.getTime() === today.getTime()) return `Hoje, ${timeStr}`;
  if (postDay.getTime() === tomorrow.getTime()) return `Amanhã, ${timeStr}`;
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }) + `, ${timeStr}`;
}

function buildWhatsAppUrl(content: string, hashtags?: string[]): string {
  const tags = (hashtags ?? []).map(t => (t.startsWith("#") ? t : `#${t}`)).join(" ");
  const text = tags ? `${content}\n\n${tags}` : content;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export default function Dashboard() {
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() }
  });

  const { data: allPosts } = useListPosts(
    {},
    { query: { queryKey: getListPostsQueryKey({}) } }
  );

  const scheduledPosts = useMemo(() => {
    if (!allPosts) return [];
    const now = new Date();
    const oneWeekLater = new Date(now);
    oneWeekLater.setDate(now.getDate() + 7);

    return allPosts
      .filter(p => {
        if (!p.scheduledAt) return false;
        const d = new Date(p.scheduledAt);
        return d >= now && d <= oneWeekLater;
      })
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
  }, [allPosts]);

  if (isStatsLoading) {
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
        <Link
          href="/generate"
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground h-10 px-6 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Wand2 className="w-4 h-4" />
          Gerar Novo Post
        </Link>
      </div>

      {/* Stats cards */}
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

      {/* Agenda + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          {/* Agenda da Semana */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-chart-4" />
                Agenda da Semana
              </h3>
              <Link href="/posts?tab=scheduled" className="text-sm text-primary hover:underline">
                Ver todos agendados
              </Link>
            </div>

            <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
              {scheduledPosts.length > 0 ? (
                <div className="divide-y divide-border">
                  {scheduledPosts.map(post => (
                    <div key={post.id} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                      <div className="shrink-0 text-center min-w-[52px]">
                        <div className="text-xs font-bold text-chart-4 uppercase">
                          {new Date(post.scheduledAt!).toLocaleDateString("pt-BR", { weekday: "short" })}
                        </div>
                        <div className="text-lg font-bold leading-tight">
                          {new Date(post.scheduledAt!).getDate()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(post.scheduledAt!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted border border-border">
                            {translatePlatform(post.platform)}
                          </span>
                          <span className="text-xs text-chart-4 font-medium">
                            {formatScheduledDate(post.scheduledAt!)}
                          </span>
                        </div>
                        <Link href={`/posts/${post.id}`} className="font-medium text-sm hover:text-primary transition-colors line-clamp-1">
                          {post.title}
                        </Link>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{post.content}</p>
                      </div>
                      <a
                        href={buildWhatsAppUrl(post.content, post.hashtags)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 h-8 w-8 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors flex items-center justify-center"
                        title="Compartilhar no WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum post agendado para os próximos 7 dias.</p>
                  <p className="text-xs mt-1">Abra um post aprovado e defina uma data de publicação.</p>
                </div>
              )}
            </div>
          </div>

          {/* Atividade Recente */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Atividade Recente</h3>
            <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="divide-y divide-border">
                  {stats.recentActivity.map((activity, i) => (
                    <div key={i} className="p-4 flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
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
        </div>

        {/* Destaques */}
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
              <p className="text-sm font-medium text-muted-foreground mb-1">Pontuação Média IA</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${stats.avgPostScore || 0}%` }} />
                </div>
                <span className="font-bold">{stats.avgPostScore || 0}/100</span>
              </div>
            </div>
            <div className="pt-4 border-t border-border space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Acesso Rápido</p>
              <Link
                href="/properties/new"
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
              >
                <Building className="w-4 h-4 text-primary" /> Cadastrar novo imóvel
              </Link>
              <Link
                href="/generate"
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
              >
                <Wand2 className="w-4 h-4 text-primary" /> Gerar post com IA
              </Link>
              <Link
                href="/posts"
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
              >
                <CheckCircle className="w-4 h-4 text-primary" /> Ver posts salvos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
