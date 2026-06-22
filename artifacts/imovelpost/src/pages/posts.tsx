import { useState, useMemo } from "react";
import { useListPosts, getListPostsQueryKey, ListPostsStatus } from "@workspace/api-client-react";
import { Link } from "wouter";
import { FileText, Copy, Edit, Clock, CheckCircle, UploadCloud, Archive, Calendar, MessageCircle } from "lucide-react";
import { translatePlatform, translateStatus } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Tab = ListPostsStatus | "scheduled" | undefined;

function buildWhatsAppUrl(content: string, hashtags?: string[]): string {
  const tags = (hashtags ?? []).map(t => (t.startsWith("#") ? t : `#${t}`)).join(" ");
  const text = tags ? `${content}\n\n${tags}` : content;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function formatScheduledDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export default function Posts() {
  const [activeTab, setActiveTab] = useState<Tab>(undefined);

  const statusForApi: ListPostsStatus | undefined =
    activeTab === "scheduled" ? undefined : activeTab;

  const { data: allPosts, isLoading } = useListPosts(
    { status: statusForApi },
    { query: { queryKey: getListPostsQueryKey({ status: statusForApi }) } }
  );

  const posts = useMemo(() => {
    if (activeTab === "scheduled") {
      return (allPosts ?? []).filter(p => !!p.scheduledAt);
    }
    return allPosts ?? [];
  }, [allPosts, activeTab]);

  const { toast } = useToast();

  const handleCopy = (content: string, hashtags?: string[]) => {
    const tags = (hashtags ?? []).map(t => (t.startsWith("#") ? t : `#${t}`)).join(" ");
    navigator.clipboard.writeText(tags ? `${content}\n\n${tags}` : content);
    toast({ title: "Copiado", description: "Post copiado para a área de transferência." });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":     return <Clock className="w-4 h-4 text-chart-4" />;
      case "approved":  return <CheckCircle className="w-4 h-4 text-primary" />;
      case "published": return <UploadCloud className="w-4 h-4 text-chart-3" />;
      case "archived":  return <Archive className="w-4 h-4 text-muted-foreground" />;
      default:          return null;
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: undefined,     label: "Todos" },
    { key: "draft",       label: "Rascunhos" },
    { key: "approved",    label: "Aprovados" },
    { key: "published",   label: "Publicados" },
    { key: "scheduled",   label: "Agendados" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Posts Salvos</h2>
          <p className="text-muted-foreground mt-1">Gerencie, edite e compartilhe seus posts gerados.</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit flex-wrap">
          {tabs.map(tab => (
            <button
              key={String(tab.key)}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-muted rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <div
              key={post.id}
              className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm flex flex-col hover:border-primary/30 transition-colors"
            >
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-background border border-border">
                  {translatePlatform(post.platform)}
                </span>
                <div className="flex items-center gap-2">
                  {post.scheduledAt && (
                    <span className="flex items-center gap-1 text-xs font-medium text-chart-4">
                      <Calendar className="w-3 h-3" />
                      {formatScheduledDate(post.scheduledAt)}
                    </span>
                  )}
                  {!post.scheduledAt && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                      {getStatusIcon(post.status)}
                      <span className="text-xs">{translateStatus(post.status)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold mb-2 line-clamp-1">{post.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-4 flex-1 whitespace-pre-wrap">
                  {post.content}
                </p>
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.hashtags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-xs text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                        {tag.startsWith("#") ? tag : `#${tag}`}
                      </span>
                    ))}
                    {post.hashtags.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{post.hashtags.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-border mt-auto">
                  <Link
                    href={`/posts/${post.id}`}
                    className="flex-1 h-9 rounded-md font-medium border border-input bg-transparent hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit className="w-3.5 h-3.5" /> Editar
                  </Link>
                  <button
                    onClick={() => handleCopy(post.content, post.hashtags)}
                    className="h-9 px-3 rounded-md font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5 text-sm"
                    title="Copiar texto"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={buildWhatsAppUrl(post.content, post.hashtags)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 rounded-md font-medium bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors flex items-center justify-center gap-1.5 text-sm"
                    title="Compartilhar no WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-card-border rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground mx-auto mb-4">
            {activeTab === "scheduled" ? <Calendar className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
          </div>
          <h3 className="text-lg font-medium text-foreground">
            {activeTab === "scheduled" ? "Nenhum post agendado" : "Nenhum post encontrado"}
          </h3>
          <p className="text-muted-foreground mt-1 mb-6">
            {activeTab === "scheduled"
              ? "Abra um post aprovado e defina uma data de publicação."
              : activeTab
              ? `Você não tem posts com o status '${translateStatus(activeTab as string)}'.`
              : "Você ainda não gerou nenhum post."}
          </p>
          {activeTab !== "scheduled" && (
            <Link
              href="/generate"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground h-10 px-6 rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              Gerar Novo Post
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
