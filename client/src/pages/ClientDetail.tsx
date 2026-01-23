import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompanySchema, type Company, type Address } from "@shared/schema";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ShieldAlert, Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect } from "react";
import { z } from "zod";

const addressFormSchema = z.object({
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado (UF) é obrigatório"),
  zipCode: z.string().min(8, "CEP inválido"),
});

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const isNew = params?.id === "new";
  const clientId = isNew ? null : Number(params?.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: [api.companies.get.path, clientId],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.companies.get.path, { id: clientId! }));
      if (!res.ok) throw new Error("Client not found");
      return api.companies.get.responses[200].parse(await res.json());
    },
    enabled: !!clientId
  });

  const { data: addresses, isLoading: isLoadingAddresses, refetch: refetchAddresses } = useQuery<Address[]>({
    queryKey: ["/api/companies", clientId, "addresses"],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${clientId}/addresses`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!clientId
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
      type: "client"
    }
  });

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        tradeName: (client as any).trade_name || (client as any).tradeName || "",
        cnpj: client.cnpj,
        email: client.email || "",
        phone: client.phone || "",
        status: (client.status as any) || "active",
        type: "client"
      });
    }
  }, [client, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isNew ? api.companies.create.path : buildUrl(api.companies.update.path, { id: clientId! });
      const method = isNew ? api.companies.create.method : api.companies.update.method;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save client");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.companies.list.path] });
      toast({ title: "Sucesso", description: `Cliente ${isNew ? "cadastrado" : "atualizado"} com sucesso.` });
      if (isNew) setLocation(`/clients/${data.id}`);
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const [editingAddressId, setEditingAddressId] = React.useState<number | null>(null);

  const addAddressMutation = useMutation({
    mutationFn: async (data: any) => {
      const isEditing = !!editingAddressId;
      const url = isEditing 
        ? `/api/addresses/${editingAddressId}`
        : `/api/companies/${clientId}/addresses`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to save address");
      return res.json();
    },
    onSuccess: () => {
      refetchAddresses();
      toast({ title: editingAddressId ? "Endereço atualizado" : "Endereço adicionado" });
      setEditingAddressId(null);
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      refetchAddresses();
      toast({ title: "Endereço removido" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(buildUrl(api.companies.delete.path, { id: clientId! }), {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete client");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.companies.list.path] });
      toast({ title: "Cadastro excluído" });
      setLocation("/clients");
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
          <h1 className="text-2xl font-bold">Access Denied</h1>
        </div>
      </Layout>
    );
  }

  if (clientId && isLoadingClient) {
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
          <Button variant="ghost" size="icon" onClick={() => setLocation("/clients")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold">
              {isNew ? "Novo Cliente" : "Editar Cliente"}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? "Preencha as informações para cadastrar um novo embarcador" : "Atualize os dados do embarcador"}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
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
                            <Input {...field} placeholder="Ex: Acme Corp Ltda" />
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
                            <Input {...field} placeholder="Ex: Acme" />
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
                            <Input {...field} type="email" placeholder="contato@empresa.com" />
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

                  <div className="flex gap-4">
                    <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                      {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {isNew ? "Cadastrar Cliente" : "Salvar Alterações"}
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Endereços</h3>
              </div>
              
              {!isNew ? (
                <div className="grid gap-4">
                  {addresses?.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">Nenhum endereço cadastrado ainda.</p>
                  )}
                  {addresses?.map((addr) => (
                    <Card key={addr.id} className="p-4 flex justify-between items-start">
                      <div>
                        <p className="font-medium">{addr.street}, {addr.number}</p>
                        <p className="text-sm text-muted-foreground">{addr.neighborhood}, {addr.city} - {addr.state}</p>
                        <p className="text-sm text-muted-foreground">CEP: {addr.zipCode}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setEditingAddressId(addr.id)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => deleteAddressMutation.mutate(addr.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  
                  <Card className="p-4 border-dashed bg-muted/20">
                    <form 
                      key={editingAddressId || 'new'}
                      className="grid grid-cols-2 gap-4" 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const data = Object.fromEntries(formData.entries());
                        addAddressMutation.mutate(data);
                        e.currentTarget.reset();
                      }}
                    >
                      {editingAddressId && (
                        <div className="col-span-2 flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Editando endereço...</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setEditingAddressId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                      <div className="col-span-2">
                        <Input 
                          name="street" 
                          placeholder="Logradouro" 
                          required 
                          defaultValue={editingAddressId ? addresses?.find(a => a.id === editingAddressId)?.street : ''}
                        />
                      </div>
                      <Input 
                        name="number" 
                        placeholder="Número" 
                        required 
                        defaultValue={editingAddressId ? addresses?.find(a => a.id === editingAddressId)?.number : ''}
                      />
                      <Input 
                        name="neighborhood" 
                        placeholder="Bairro" 
                        required 
                        defaultValue={editingAddressId ? addresses?.find(a => a.id === editingAddressId)?.neighborhood : ''}
                      />
                      <Input 
                        name="city" 
                        placeholder="Cidade" 
                        required 
                        defaultValue={editingAddressId ? addresses?.find(a => a.id === editingAddressId)?.city : ''}
                      />
                      <Input 
                        name="state" 
                        placeholder="UF" 
                        maxLength={2} 
                        required 
                        defaultValue={editingAddressId ? addresses?.find(a => a.id === editingAddressId)?.state : ''}
                      />
                      <Input 
                        name="zipCode" 
                        placeholder="CEP" 
                        required 
                        defaultValue={editingAddressId ? addresses?.find(a => a.id === editingAddressId)?.zipCode : ''}
                      />
                      <Button className="col-span-2 gap-2" variant="outline" type="submit">
                        <Plus className="w-4 h-4" />
                        {editingAddressId ? "Salvar Endereço" : "Adicionar Endereço"}
                      </Button>
                    </form>
                  </Card>
                </div>
              ) : (
                <Card className="p-6 bg-muted/20 border-dashed">
                  <p className="text-center text-muted-foreground">
                    Salve o cadastro primeiro para poder adicionar endereços.
                  </p>
                </Card>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <h4 className="font-bold text-sm uppercase tracking-wider text-primary mb-2">Informação</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                As cotações criadas por este cliente utilizarão os endereços cadastrados aqui.
                Certifique-se de manter o CNPJ e e-mail atualizados para correta identificação.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
