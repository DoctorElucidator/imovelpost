import { useState } from "react";
import { useListPosts, getListPostsQueryKey, ListPostsStatus } from "@workspace/api-client-react";
import { Link } from "wouter";
import { FileText, Copy, Edit, Clock, CheckCircle, UploadCloud, Archive } from "lucide-react";
import { translatePlatform, translateStatus } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Posts() {
  const [statusFilter, setStatusFilter] = useState<ListPostsStatus | undefined>(undefined);
  
  const { data: posts, isLoading } = useListPosts(
    { status: statusFilter }, 
    { query: { queryKey: getListPostsQueryKey({ status: statusFilter }) } }
  );

  const { toast } = useToast();

  const handleCopy = (content: string, hashtags?: string[]) => {
    const textToCopy = `${content}${hashtags && hashtags.length > 0 ? '\n\n' + hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ') : ''}`;
    navigator.clipboard.writeText(textToCopy);
    toast({ title: "Copiado", description: "Post copiado para a área de transferência." });
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'draft': return <Clock className="w-4 h-4 text-chart-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'published': return <UploadCloud className="w-4 h-4 text-chart-3" />;
      case 'archived': return <Archive className="w-4 h-4 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Posts Salvos</h2>
          <p className="text-muted-foreground mt-1">Gerencie, edite e copie seus posts gerados.</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
          <button 
            onClick={() => setStatusFilter(undefined)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${!statusFilter ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === 'draft' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Rascunhos
          </button>
          <button 
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === 'approved' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Aprovados
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-muted rounded-xl animate-pulse"></div>)}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <div key={post.id} className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm flex flex-col hover:border-primary/30 transition-colors">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-background border border-border">
                  {translatePlatform(post.platform)}
                </span>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {getStatusIcon(post.status)}
                  <span>{translateStatus(post.status)}</span>
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
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                    {post.hashtags.length > 3 && <span className="text-xs text-muted-foreground">+{post.hashtags.length - 3}</span>}
                  </div>
                )}
                
                <div className="flex items-center gap-2 pt-4 border-t border-border mt-auto">
                  <Link href={`/posts/${post.id}`} className="flex-1 h-9 rounded-md font-medium border border-input bg-transparent hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm">
                      <Edit className="w-3.5 h-3.5" /> Editar
                  </Link>
                  <button 
                    onClick={() => handleCopy(post.content, post.hashtags)}
                    className="flex-1 h-9 rounded-md font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-card-border rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Nenhum post encontrado</h3>
          <p className="text-muted-foreground mt-1 mb-6">
            {statusFilter 
              ? `Você não tem posts com o status '${translateStatus(statusFilter)}'.` 
              : 'Você ainda não gerou nenhum post.'}
          </p>
          <Link href="/generate" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground h-10 px-6 rounded-md font-medium hover:bg-primary/90 transition-colors">
              Gerar Novo Post
          </Link>
        </div>
      )}
    </div>
  );
}
