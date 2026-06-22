import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetPost, 
  getGetPostQueryKey,
  useUpdatePost,
  useDeletePost,
  PostUpdateStatus
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Copy, Save, Trash2, Clock, CheckCircle, 
  UploadCloud, Calendar, X, MessageCircle, ExternalLink 
} from "lucide-react";
import { translatePlatform, translateStatus } from "@/lib/utils";

function buildWhatsAppUrl(content: string, hashtags: string[]): string {
  const tags = hashtags.map(t => (t.startsWith("#") ? t : `#${t}`)).join(" ");
  const text = tags ? `${content}\n\n${tags}` : content;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function formatScheduledAt(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PostDetail() {
  const { id } = useParams();
  const postId = id ? parseInt(id, 10) : 0;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: post, isLoading } = useGetPost(postId, {
    query: { enabled: !!postId, queryKey: getGetPostQueryKey(postId) }
  });

  const updateMutation = useUpdatePost();
  const deleteMutation = useDeletePost();

  const [content, setContent] = useState("");
  const [hashtagsStr, setHashtagsStr] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    if (post) {
      setContent(post.content);
      setHashtagsStr(post.hashtags ? post.hashtags.join(", ") : "");
      setScheduledAt(post.scheduledAt ? toDatetimeLocal(post.scheduledAt) : "");
      if (post.scheduledAt) setShowScheduler(true);
    }
  }, [post]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-[400px] bg-muted rounded-xl"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Post não encontrado</h2>
        <Link href="/posts" className="text-primary hover:underline mt-4 inline-block">Voltar para posts</Link>
      </div>
    );
  }

  const hashtags = hashtagsStr.split(",").map(s => s.trim()).filter(Boolean);

  const handleSave = () => {
    updateMutation.mutate({
      id: postId,
      data: {
        content,
        hashtags,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
        toast({ title: "Sucesso", description: "Post atualizado com sucesso." });
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao atualizar post.", variant: "destructive" });
      }
    });
  };

  const handleClearSchedule = () => {
    setScheduledAt("");
    updateMutation.mutate({
      id: postId,
      data: { scheduledAt: "" }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
        toast({ title: "Agendamento removido", description: "O post voltou para rascunho." });
        setShowScheduler(false);
      }
    });
  };

  const handleStatusChange = (status: PostUpdateStatus) => {
    updateMutation.mutate({
      id: postId,
      data: { status }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
        toast({ title: "Sucesso", description: `Status alterado para ${translateStatus(status)}.` });
      }
    });
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este post?")) {
      deleteMutation.mutate({ id: postId }, {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Post excluído com sucesso." });
          setLocation("/posts");
        }
      });
    }
  };

  const handleCopy = () => {
    const tags = hashtags.map(t => (t.startsWith("#") ? t : `#${t}`)).join(" ");
    navigator.clipboard.writeText(tags ? `${content}\n\n${tags}` : content);
    toast({ title: "Copiado", description: "Conteúdo copiado para a área de transferência." });
  };

  const isDirty =
    content !== post.content ||
    hashtagsStr !== (post.hashtags?.join(", ") || "") ||
    scheduledAt !== (post.scheduledAt ? toDatetimeLocal(post.scheduledAt) : "");

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/posts" className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{post.title}</h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">{translatePlatform(post.platform)}</span>
            <span className="w-1 h-1 rounded-full bg-border"></span>
            <span className="text-sm font-medium px-2 py-0.5 rounded bg-muted">
              {translateStatus(post.status)}
            </span>
            {post.scheduledAt && (
              <>
                <span className="w-1 h-1 rounded-full bg-border"></span>
                <span className="text-sm font-medium text-chart-4 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {formatScheduledAt(post.scheduledAt)}
                </span>
              </>
            )}
            {post.score && (
              <>
                <span className="w-1 h-1 rounded-full bg-border"></span>
                <span className="text-sm font-medium text-chart-3">Score: {post.score}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-wrap items-center gap-2">
          <div className="flex-1 flex gap-2 flex-wrap">
            <button
              onClick={() => handleStatusChange(PostUpdateStatus.draft)}
              disabled={post.status === "draft"}
              className="px-3 py-1.5 rounded text-sm font-medium border border-input bg-background hover:bg-muted disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" /> Rascunho
            </button>
            <button
              onClick={() => handleStatusChange(PostUpdateStatus.approved)}
              disabled={post.status === "approved"}
              className="px-3 py-1.5 rounded text-sm font-medium border border-input bg-background hover:bg-muted disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5 text-primary" /> Aprovar
            </button>
            <button
              onClick={() => handleStatusChange(PostUpdateStatus.published)}
              disabled={post.status === "published"}
              className="px-3 py-1.5 rounded text-sm font-medium border border-input bg-background hover:bg-muted disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 text-chart-3" /> Publicar
            </button>
            <button
              onClick={() => setShowScheduler(v => !v)}
              className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors flex items-center gap-1.5 ${
                post.scheduledAt || showScheduler
                  ? "border-chart-4/40 bg-chart-4/10 text-chart-4"
                  : "border-input bg-background hover:bg-muted"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {post.scheduledAt ? "Agendado" : "Agendar"}
            </button>
          </div>
          <button
            onClick={handleDelete}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            title="Excluir Post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Scheduler */}
        {showScheduler && (
          <div className="px-6 py-4 border-b border-border bg-chart-4/5 flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 flex-1 min-w-48">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-chart-4" /> Data e hora de publicação
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm w-full max-w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                O post ficará disponível na data marcada para você publicar manualmente.
              </p>
              {post.scheduledAt && (
                <button
                  type="button"
                  onClick={handleClearSchedule}
                  className="h-8 px-3 rounded-md text-xs font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <X className="w-3 h-3" /> Remover
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content editor */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Conteúdo do Post</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full min-h-[300px] p-4 rounded-md border border-input bg-transparent text-sm leading-relaxed focus:ring-1 focus:ring-primary outline-none resize-y"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Hashtags (separadas por vírgula)</label>
            <input
              type="text"
              value={hashtagsStr}
              onChange={e => setHashtagsStr(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
              placeholder="#imoveis, #minhacasaminhavida"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
            <button
              onClick={handleCopy}
              className="h-10 px-4 rounded-md font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2 text-sm"
            >
              <Copy className="w-4 h-4" /> Copiar Texto
            </button>

            {post.platform === "whatsapp" || true ? (
              <a
                href={buildWhatsAppUrl(content, hashtags)}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-md font-medium bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors flex items-center gap-2 text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Compartilhar no WhatsApp
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            ) : null}

            <div className="flex-1" />

            <button
              onClick={handleSave}
              disabled={updateMutation.isPending || !isDirty}
              className="h-10 px-6 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 text-sm"
            >
              <Save className="w-4 h-4" />
              {scheduledAt && scheduledAt !== (post.scheduledAt ? toDatetimeLocal(post.scheduledAt) : "")
                ? "Salvar e Agendar"
                : "Salvar Alterações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
