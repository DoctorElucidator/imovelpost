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
import { ArrowLeft, Copy, Save, Trash2, Clock, CheckCircle, UploadCloud, Archive } from "lucide-react";
import { translatePlatform, translateStatus } from "@/lib/utils";

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

  useEffect(() => {
    if (post) {
      setContent(post.content);
      setHashtagsStr(post.hashtags ? post.hashtags.join(", ") : "");
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

  const handleSave = () => {
    const hashtags = hashtagsStr.split(',').map(s => s.trim()).filter(Boolean);
    
    updateMutation.mutate({
      id: postId,
      data: { content, hashtags }
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
    const tags = hashtagsStr.split(',').map(s => s.trim()).filter(Boolean);
    const textToCopy = `${content}\n\n${tags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}`;
    navigator.clipboard.writeText(textToCopy);
    toast({ title: "Copiado", description: "Conteúdo copiado para a área de transferência." });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/posts" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{post.title}</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm font-medium text-muted-foreground">{translatePlatform(post.platform)}</span>
            <span className="w-1 h-1 rounded-full bg-border"></span>
            <span className="text-sm font-medium px-2 py-0.5 rounded bg-muted">Status: {translateStatus(post.status)}</span>
            {post.score && (
              <>
                <span className="w-1 h-1 rounded-full bg-border"></span>
                <span className="text-sm font-medium text-chart-3 flex items-center gap-1">Score: {post.score}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-wrap items-center gap-2">
          <div className="flex-1 flex gap-2">
            <button 
              onClick={() => handleStatusChange(PostUpdateStatus.draft)}
              disabled={post.status === 'draft'}
              className="px-3 py-1.5 rounded text-sm font-medium border border-input bg-background hover:bg-muted disabled:opacity-50 flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" /> Rascunho
            </button>
            <button 
              onClick={() => handleStatusChange(PostUpdateStatus.approved)}
              disabled={post.status === 'approved'}
              className="px-3 py-1.5 rounded text-sm font-medium border border-input bg-background hover:bg-muted disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5 text-primary" /> Aprovar
            </button>
            <button 
              onClick={() => handleStatusChange(PostUpdateStatus.published)}
              disabled={post.status === 'published'}
              className="px-3 py-1.5 rounded text-sm font-medium border border-input bg-background hover:bg-muted disabled:opacity-50 flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5 text-chart-3" /> Publicar
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

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Conteúdo do Post</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[300px] p-4 rounded-md border border-input bg-transparent text-sm leading-relaxed focus:ring-1 focus:ring-primary outline-none resize-y"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Hashtags (separadas por vírgula)</label>
            <input
              type="text"
              value={hashtagsStr}
              onChange={(e) => setHashtagsStr(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
              placeholder="#imoveis, #minhacasaminhavida"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button 
              onClick={handleCopy}
              className="h-10 px-4 rounded-md font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" /> Copiar Texto Final
            </button>
            <button 
              onClick={handleSave}
              disabled={updateMutation.isPending || (content === post.content && hashtagsStr === (post.hashtags?.join(", ") || ""))}
              className="h-10 px-6 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
