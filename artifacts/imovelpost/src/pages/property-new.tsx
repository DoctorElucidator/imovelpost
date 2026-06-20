import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateProperty, getListPropertiesQueryKey, PropertyInputType, PropertyInputProgram, PropertyInputStatus } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building, Save } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  title: z.string().min(5, "Título muito curto"),
  description: z.string().optional(),
  type: z.enum([PropertyInputType.apartment, PropertyInputType.house, PropertyInputType.studio, PropertyInputType.commercial, PropertyInputType.land]),
  price: z.coerce.number().min(1, "Preço inválido"),
  city: z.string().min(2, "Cidade inválida"),
  state: z.string().min(2, "Estado inválido"),
  neighborhood: z.string().optional(),
  area: z.coerce.number().min(1, "Área inválida"),
  bedrooms: z.coerce.number().min(0, "Valor inválido"),
  bathrooms: z.coerce.number().min(0, "Valor inválido"),
  parkingSpots: z.coerce.number().optional(),
  program: z.enum([PropertyInputProgram.minha_casa_minha_vida, PropertyInputProgram.mcmv_faixa1, PropertyInputProgram.mcmv_faixa2, PropertyInputProgram.mcmv_faixa3, PropertyInputProgram.regular]),
  status: z.enum([PropertyInputStatus.available, PropertyInputStatus.sold, PropertyInputStatus.reserved]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PropertyNew() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createMutation = useCreateProperty();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: PropertyInputType.apartment,
      price: 0,
      city: "",
      state: "",
      neighborhood: "",
      area: 0,
      bedrooms: 0,
      bathrooms: 0,
      parkingSpots: 0,
      program: PropertyInputProgram.regular,
      status: PropertyInputStatus.available,
    }
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPropertiesQueryKey() });
        toast({ title: "Sucesso", description: "Imóvel cadastrado com sucesso." });
        setLocation("/properties");
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao cadastrar imóvel.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/properties" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Novo Imóvel</h2>
          <p className="text-muted-foreground mt-1">Cadastre as informações do imóvel para gerar posts.</p>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Título do Imóvel</label>
              <input 
                {...form.register("title")}
                className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                placeholder="Ex: Apartamento 2 quartos no Centro"
              />
              {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <select 
                {...form.register("type")}
                className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
              >
                <option value="apartment">Apartamento</option>
                <option value="house">Casa</option>
                <option value="studio">Studio</option>
                <option value="commercial">Comercial</option>
                <option value="land">Terreno</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Programa de Financiamento</label>
              <select 
                {...form.register("program")}
                className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
              >
                <option value="regular">Regular</option>
                <option value="minha_casa_minha_vida">Minha Casa, Minha Vida</option>
                <option value="mcmv_faixa1">MCMV Faixa 1</option>
                <option value="mcmv_faixa2">MCMV Faixa 2</option>
                <option value="mcmv_faixa3">MCMV Faixa 3</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Preço (R$)</label>
              <input 
                type="number"
                {...form.register("price")}
                className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
              />
              {form.formState.errors.price && <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Área (m²)</label>
              <input 
                type="number"
                {...form.register("area")}
                className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cidade</label>
              <input 
                {...form.register("city")}
                className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado (UF)</label>
              <input 
                {...form.register("state")}
                className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                maxLength={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 md:col-span-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quartos</label>
                <input 
                  type="number"
                  {...form.register("bedrooms")}
                  className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Banheiros</label>
                <input 
                  type="number"
                  {...form.register("bathrooms")}
                  className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vagas</label>
                <input 
                  type="number"
                  {...form.register("parkingSpots")}
                  className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Descrição Detalhada</label>
              <textarea 
                {...form.register("description")}
                className="w-full min-h-[120px] p-3 rounded-md border border-input bg-transparent text-sm resize-y"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-border">
            <Link href="/properties" className="h-10 px-4 rounded-md font-medium border border-input hover:bg-muted transition-colors flex items-center justify-center">
                Cancelar
            </Link>
            <button 
              type="submit"
              disabled={createMutation.isPending}
              className="h-10 px-6 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin"></span>
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Imóvel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
