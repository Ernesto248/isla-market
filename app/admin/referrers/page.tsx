"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Referrer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  TrendingUp,
  Users,
  DollarSign,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

export default function ReferrersPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [referrerToDelete, setReferrerToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  // Cargar referidores
  const fetchReferrers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      if (statusFilter !== "all") {
        params.append("is_active", statusFilter);
      }

      const response = await fetch(
        `/api/admin/referrers?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar referidores");
      }

      const data = await response.json();
      setReferrers(data.referrers || []);
    } catch (error) {
      console.error("Error fetching referrers:", error);
      toast.error("Error al cargar referidores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchReferrers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, debouncedSearch, statusFilter]);

  // Desactivar referidor
  const handleDelete = async () => {
    if (!referrerToDelete) return;

    try {
      setActionLoading(referrerToDelete);

      const response = await fetch(`/api/admin/referrers/${referrerToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al desactivar referidor");
      }

      toast.success("Referidor desactivado exitosamente");
      fetchReferrers();
    } catch (error: any) {
      console.error("Error deleting referrer:", error);
      toast.error(error.message || "Error al desactivar referidor");
    } finally {
      setActionLoading(null);
      setDeleteDialogOpen(false);
      setReferrerToDelete(null);
    }
  };

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Referidores</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios que pueden referir clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push("/admin/referrers/dashboard")}
            variant="outline"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button onClick={() => router.push("/admin/referrers/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Referidor
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra referidores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código o nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de referidores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Referidores ({referrers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : referrers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-semibold">No hay referidores</p>
              <p className="text-sm text-muted-foreground">
                Comienza creando tu primer referidor
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push("/admin/referrers/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Referidor
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Referidos</TableHead>
                    <TableHead>Ventas</TableHead>
                    <TableHead>Comisiones</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrers.map((referrer) => {
                    const user = Array.isArray(referrer.user)
                      ? referrer.user[0]
                      : referrer.user;
                    return (
                      <TableRow key={referrer.id}>
                        <TableCell className="font-mono font-medium">
                          {referrer.referral_code}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {user?.full_name || "Sin nombre"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {user?.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{referrer.commission_rate}%</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {referrer.total_referrals}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({referrer.active_referrals} activos)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {formatCurrency(
                                Number(referrer.total_sales) || 0
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(
                              Number(referrer.total_commissions) || 0
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              referrer.is_active ? "default" : "secondary"
                            }
                          >
                            {referrer.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                router.push(`/admin/referrers/${referrer.id}`)
                              }
                              title="Ver detalle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setReferrerToDelete(referrer.id);
                                setDeleteDialogOpen(true);
                              }}
                              disabled={
                                !referrer.is_active ||
                                actionLoading === referrer.id
                              }
                              title="Desactivar"
                            >
                              {actionLoading === referrer.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar referidor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará al referidor y todas sus referencias
              activas. Los datos históricos se mantendrán. ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
