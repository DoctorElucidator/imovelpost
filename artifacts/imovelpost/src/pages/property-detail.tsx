import { useGetProperty, getGetPropertyQueryKey, useListPosts, getListPostsQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { ArrowLeft, MapPin, Tag, Edit, Plus, FileText, CheckCircle, Clock } from "lucide-react";
import { formatBRL, translateProgram, translateType, translateStatus, translatePlatform } from "@/lib/utils";

export default function PropertyDetail() {
  const { id } = useParams();
  const propertyId = id ? parseInt(id, 10) : 0;

  const { data: property, isLoading: isPropertyLoading } = useGetProperty(propertyId, {
    query: { enabled: !!propertyId, queryKey: getGetPropertyQueryKey(propertyId) }
  });

  const { data: posts, isLoading: isPostsLoading } = useListPosts({ propertyId }, {
    query: { enabled: !!propertyId, queryKey: getListPostsQueryKey({ propertyId }) }
  });

  if (isPropertyLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="h-64 bg-muted rounded-xl"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Imóvel não encontrado</h2>
        <Link href="/properties" className="text-primary hover:underline mt-4 inline-block">Voltar para imóveis</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/properties" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{property.title}</h2>
            <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold">
              {translateStatus(property.status || 'available')}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {property.city}, {property.state}</span>
            <span className="flex items-center gap-1"><Tag className="w-4 h-4" /> {translateType(property.type)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 px-4 rounded-md font-medium border border-input hover:bg-muted transition-colors flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Editar
          </button>
          <Link href={`/generate?propertyId=${property.id}`} className="h-10 px-4 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              Gerar Novo Post
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Detalhes do Imóvel</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Preço</p>
                <p className="text-lg font-bold">{formatBRL(property.price)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Área</p>
                <p className="text-lg font-bold">{property.area} m²</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quartos/Banheiros</p>
                <p className="text-lg font-bold">{property.bedrooms} / {property.bathrooms}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vagas</p>
                <p className="text-lg font-bold">{property.parkingSpots || 0}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Programa</p>
              <span className="inline-block px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-sm font-medium">
                {translateProgram(property.program)}
              </span>
            </div>

            {property.description && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground mb-2">Descrição</p>
                <p className="text-sm leading-relaxed">{property.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Posts Gerados
            </h3>
            
            {isPostsLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-24 bg-muted rounded-xl"></div>
                <div className="h-24 bg-muted rounded-xl"></div>
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map(post => (
                  <div key={post.id} className="bg-card border border-card-border rounded-xl p-5 shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted border border-border">
                            {translatePlatform(post.platform)}
                          </span>
                          {post.status === 'published' && <span className="flex items-center gap-1 text-xs font-medium text-chart-3"><CheckCircle className="w-3 h-3" /> Publicado</span>}
                          {post.status === 'draft' && <span className="flex items-center gap-1 text-xs font-medium text-chart-4"><Clock className="w-3 h-3" /> Rascunho</span>}
                        </div>
                        <h4 className="font-medium hover:text-primary cursor-pointer">
                          <Link href={`/posts/${post.id}`}>{post.title}</Link>
                        </h4>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{post.content}</p>
                      </div>
                      <div className="shrink-0 text-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm mx-auto mb-1">
                          {post.score || '-'}
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Score</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-card-border rounded-xl p-8 text-center shadow-sm">
                <p className="text-muted-foreground mb-4">Nenhum post gerado para este imóvel ainda.</p>
                <Link href={`/generate?propertyId=${property.id}`} className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground h-9 px-4 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                    Gerar Primeiro Post
                </Link>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-muted rounded-xl p-6 sticky top-8">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Estatísticas de Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Posts Gerados</span>
                <span className="font-bold">{posts?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Média de Score</span>
                <span className="font-bold">
                  {posts?.length ? Math.round(posts.reduce((acc, p) => acc + (p.score || 0), 0) / posts.length) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
