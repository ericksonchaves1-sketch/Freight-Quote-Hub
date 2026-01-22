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

const FREIGHT_TYPES = [
  { id: "rodoviario", label: "Rodoviário" },
  { id: "fracionado", label: "Fracionado" },
  { id: "lotacao", label: "Lotação" },
  { id: "refrigerado", label: "Refrigerado" },
  { id: "perigoso", label: "Perigoso" },
];

export default function CarrierList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: carriers, isLoading } = useQuery({
    queryKey: [api.carriers.list.path],
    queryFn: async () => {
      const res = await fetch(api.carriers.list.path);
      if (!res.ok) throw new Error("Failed to fetch carriers");
      return api.carriers.list.responses[200].parse(await res.json());
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await fetch(buildUrl(api.carriers.update.path, { id }), {
        method: api.carriers.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.carriers.list.path] });
      toast({ title: "Status atualizado" });
    }
  });

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
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
            <h1 className="text-3xl font-display font-bold">Gestão de Transportadoras</h1>
            <p className="text-muted-foreground">Cadastre e gerencie as transportadoras da plataforma</p>
          </div>
          <Link href="/carriers/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Transportadora
            </Button>
          </Link>
        </div>

        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão Social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Tipos de Frete</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : carriers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhuma transportadora cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                carriers?.map((carrier) => (
                  <TableRow key={carrier.id}>
                    <TableCell className="font-medium">{carrier.name}</TableCell>
                    <TableCell>{carrier.cnpj}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {((carrier as any).tiposFrete || "").split(",").filter(Boolean).map((typeId: string) => {
                          const type = FREIGHT_TYPES.find(t => t.id === typeId);
                          return (
                            <Badge key={typeId} variant="outline" className="capitalize text-[10px] h-4">
                              {type?.label || typeId}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={carrier.status === "active"}
                          onCheckedChange={() => toggleStatusMutation.mutate({ 
                            id: carrier.id, 
                            status: carrier.status === "active" ? "inactive" : "active" 
                          })}
                          disabled={toggleStatusMutation.isPending}
                          data-testid={`switch-status-carrier-${carrier.id}`}
                        />
                        <Badge variant={carrier.status === "active" ? "default" : "secondary"}>
                          {carrier.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/carriers/${carrier.id}`}>
                        <Button variant="ghost" size="icon" data-testid={`link-edit-carrier-${carrier.id}`}>
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
