import { useState } from "react";
import { useListProperties, getListPropertiesQueryKey, useDeleteProperty } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Building, Plus, MapPin, Tag, Edit, Trash2 } from "lucide-react";
import { formatBRL, translateProgram, translateType, translateStatus } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Properties() {
  const [, setLocation] = useLocation();
  const { data: properties, isLoading } = useListProperties({
    query: { queryKey: getListPropertiesQueryKey() }
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const deleteMutation = useDeleteProperty();

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este imóvel?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPropertiesQueryKey() });
          toast({ title: "Sucesso", description: "Imóvel excluído com sucesso." });
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao excluir o imóvel.", variant: "destructive" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Imóveis</h2>
          <p className="text-muted-foreground mt-1">Gerencie sua carteira de imóveis para geração de posts.</p>
        </div>
        <Link href="/properties/new" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground h-10 px-4 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Adicionar Imóvel
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-xl"></div>)}
        </div>
      ) : properties && properties.length > 0 ? (
        <div className="grid gap-4">
          {properties.map(property => (
            <div key={property.id} className="bg-card border border-card-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center text-muted-foreground shrink-0 overflow-hidden">
                  {property.imageUrls && property.imageUrls.length > 0 ? (
                    <img src={property.imageUrls[0]} alt={property.title} className="w-full h-full object-cover" />
                  ) : (
                    <Building className="w-8 h-8" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg hover:text-primary cursor-pointer" onClick={() => setLocation(`/properties/${property.id}`)}>
                    {property.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {property.city}, {property.state}</span>
                    <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {translateType(property.type)}</span>
                    <span className="font-medium text-foreground">{formatBRL(property.price)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-xs font-medium">
                      {translateProgram(property.program)}
                    </span>
                    <span className="px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded-full text-xs font-medium">
                      {translateStatus(property.status || 'available')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/properties/${property.id}`} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors">
                    <Edit className="w-4 h-4" />
                </Link>
                <button 
                  onClick={() => handleDelete(property.id)}
                  disabled={deleteMutation.isPending}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <Link href={`/generate?propertyId=${property.id}`} className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium transition-colors">
                    Gerar Post
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-card-border rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground mx-auto mb-4">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Nenhum imóvel cadastrado</h3>
          <p className="text-muted-foreground mt-1 mb-6">Adicione seu primeiro imóvel para começar a gerar posts.</p>
          <Link href="/properties/new" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground h-10 px-4 rounded-md font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              Adicionar Imóvel
          </Link>
        </div>
      )}
    </div>
  );
}
