import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompanySchema } from "@shared/schema";
import { api, buildUrl } from "@shared/routes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ShieldAlert, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { z } from "zod";

const FREIGHT_TYPES = [
  { id: "rodoviario", label: "Rodoviário" },
  { id: "fracionado", label: "Fracionado" },
  { id: "lotacao", label: "Lotação" },
  { id: "refrigerado", label: "Refrigerado" },
  { id: "perigoso", label: "Perigoso" },
];

export default function CarrierDetail() {
  const [, params] = useRoute("/carriers/:id");
  const isNew = params?.id === "new";
  const carrierId = isNew ? null : Number(params?.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: carrier, isLoading: isLoadingCarrier } = useQuery({
    queryKey: [api.companies.get.path, carrierId],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.companies.get.path, { id: carrierId! }));
      if (!res.ok) throw new Error("Carrier not found");
      return api.companies.get.responses[200].parse(await res.json());
    },
    enabled: !!carrierId
  });

  const form = useForm({
    resolver: zodResolver(insertCompanySchema.extend({
      email: z.string().email("E-mail inválido").optional().or(z.literal("")),
      cnpj: z.string().refine((val) => {
        const digits = val.replace(/\D/g, "");
        return digits.length === 11 || digits.length === 14;
      }, "Documento inválido (CPF ou CNPJ)"),
    })),
    defaultValues: {
      name: "",
      tradeName: "",
      cnpj: "",
      email: "",
      phone: "",
      status: "active",
      type: "carrier" as const,
      freightTypes: "",
      regions: ""
    }
  });

  useEffect(() => {
    if (carrier) {
      form.reset({
        name: carrier.name,
        tradeName: (carrier as any).trade_name || (carrier as any).tradeName || "",
        cnpj: carrier.cnpj,
        email: carrier.email || "",
        phone: carrier.phone || "",
        status: (carrier.status as any) || "active",
        type: "carrier" as const,
        freightTypes: (carrier as any).freight_types || (carrier as any).freightTypes || "",
        regions: (carrier as any).regions || ""
      });
    }
  }, [carrier, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isNew ? api.carriers.create.path : buildUrl(api.carriers.update.path, { id: carrierId! });
      const method = isNew ? api.carriers.create.method : api.carriers.update.method;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: "carrier" })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save carrier");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.carriers.list.path] });
      toast({ title: "Sucesso", description: `Transportadora ${isNew ? "cadastrada" : "atualizada"} com sucesso.` });
      setLocation("/carriers");
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(buildUrl(api.carriers.delete.path, { id: carrierId! }), {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete carrier");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.carriers.list.path] });
      toast({ title: "Cadastro excluído" });
      setLocation("/carriers");
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
        </div>
      </Layout>
    );
  }

  if (carrierId && isLoadingCarrier) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/carriers")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold">
              {isNew ? "Nova Transportadora" : "Editar Transportadora"}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? "Preencha as informações para cadastrar uma nova transportadora" : "Atualize os dados da transportadora"}
            </p>
          </div>
        </div>

        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razão Social</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Transportes Rápidos Ltda" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tradeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Fantasia</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: TransRápido" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF / CNPJ</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="000.000.000-00 ou 00.000.000/0000-00" 
                          maxLength={18}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, "");
                            if (val.length <= 11) {
                              // CPF Mask
                              val = val.replace(/(\d{3})(\d)/, "$1.$2");
                              val = val.replace(/(\d{3})(\d)/, "$1.$2");
                              val = val.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                            } else {
                              // CNPJ Mask
                              val = val.replace(/^(\d{2})(\d)/, "$1.$2");
                              val = val.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
                              val = val.replace(/\.(\d{3})(\d)/, ".$1/$2");
                              val = val.replace(/(\d{4})(\d)/, "$1-$2");
                            }
                            field.onChange(val);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="contato@transportadora.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(00) 00000-0000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Tipos de Frete</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {FREIGHT_TYPES.map((type) => (
                    <FormField
                      key={type.id}
                      control={form.control}
                      name="freightTypes"
                      render={({ field }) => {
                        const selectedTypes = field.value ? field.value.split(",") : [];
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={selectedTypes.includes(type.id)}
                                onCheckedChange={(checked) => {
                                  const newTypes = checked
                                    ? [...selectedTypes, type.id]
                                    : selectedTypes.filter((t) => t !== type.id);
                                  field.onChange(newTypes.join(","));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {type.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="regions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regiões Atendidas</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Sul, Sudeste, Nacional" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isNew ? "Cadastrar Transportadora" : "Salvar Alterações"}
                </Button>
                {!isNew && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm("Tem certeza que deseja excluir este cadastro?")) {
                        deleteMutation.mutate();
                      }
                    }}
                  >
                    {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Excluir Cadastro
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  );
}
