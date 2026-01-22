import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, ShieldAlert, Loader2, Power, PowerOff } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

export default function ClientList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: [api.companies.list.path, { type: "client" }],
    queryFn: async () => {
      const url = buildUrl(api.companies.list.path) + "?type=client";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch clients");
      return api.companies.list.responses[200].parse(await res.json());
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await fetch(buildUrl(api.companies.update.path, { id }), {
        method: api.companies.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.companies.list.path] });
      toast({ title: "Status atualizado" });
    }
  });

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">Somente administradores podem acessar esta página.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">Gestão de Clientes</h1>
            <p className="text-muted-foreground">Cadastre e gerencie os embarcadores da plataforma</p>
          </div>
          <Link href="/clients/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
          </Link>
        </div>

        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão Social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : clients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum cliente cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                clients?.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.cnpj}</TableCell>
                    <TableCell>{client.email || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={client.status === "active"}
                          onCheckedChange={() => toggleStatusMutation.mutate({ 
                            id: client.id, 
                            status: client.status === "active" ? "inactive" : "active" 
                          })}
                          disabled={toggleStatusMutation.isPending}
                          data-testid={`switch-status-client-${client.id}`}
                        />
                        <Badge variant={client.status === "active" ? "default" : "secondary"}>
                          {client.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/clients/${client.id}`}>
                        <Button variant="ghost" size="icon" data-testid={`link-edit-client-${client.id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
