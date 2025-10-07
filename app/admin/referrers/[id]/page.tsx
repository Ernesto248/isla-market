"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Edit,
  Trash2,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  ChevronDown,
} from "lucide-react";
import type { Referrer, Referral, ReferralCommission } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ReferrerDetail extends Referrer {
  referrals?: Referral[];
  commissions?: ReferralCommission[];
}

export default function ReferrerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { session } = useAuth();
  const [referrer, setReferrer] = useState<ReferrerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isReferralsExpanded, setIsReferralsExpanded] = useState(true);
  const [isCommissionsExpanded, setIsCommissionsExpanded] = useState(true);

  const referrerId = params.id as string;

  useEffect(() => {
    if (session && referrerId) {
      fetchReferrerDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, referrerId]);

  const fetchReferrerDetail = async () => {
    try {
      const response = await fetch(`/api/admin/referrers/${referrerId}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar detalles del referidor");
      }

      const data = await response.json();
      setReferrer(data);
    } catch (error) {
      console.error("Error fetching referrer detail:", error);
      toast.error("Error al cargar detalles del referidor");
      router.push("/admin/referrers");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setDeleting(true);

      const response = await fetch(`/api/admin/referrers/${referrerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al desactivar referidor");
      }

      toast.success("Referidor desactivado exitosamente");
      router.push("/admin/referrers");
    } catch (error) {
      console.error("Error deactivating referrer:", error);
      toast.error("Error al desactivar referidor");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!referrer) {
    return null;
  }

  const totalCommissionsEarned =
    referrer.commissions?.reduce(
      (sum, c) => sum + parseFloat(c.commission_amount.toString()),
      0
    ) || 0;

  const activeReferrals =
    referrer.referrals?.filter((r) => r.is_active).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/referrers")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {referrer.referral_code}
              </h1>
              <Badge variant={referrer.is_active ? "default" : "secondary"}>
                {referrer.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {referrer.user?.full_name || referrer.user?.email}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/referrers/${referrerId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          {referrer.is_active && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Desactivar
            </Button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comisión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referrer.commission_rate}%
            </div>
            <p className="text-xs text-muted-foreground">Por cada venta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Referidos Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeReferrals}</div>
            <p className="text-xs text-muted-foreground">
              De {referrer.total_referrals} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas Generadas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(referrer.total_sales || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Volumen total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Comisiones Ganadas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCommissionsEarned)}
            </div>
            <p className="text-xs text-muted-foreground">Total acumulado</p>
          </CardContent>
        </Card>
      </div>

      {/* Información del Referidor */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Referidor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Usuario
              </p>
              <p className="text-base">
                {referrer.user?.full_name || referrer.user?.email}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-base">{referrer.user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Código de Referido
              </p>
              <p className="text-base font-mono">{referrer.referral_code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Duración
              </p>
              <p className="text-base">{referrer.duration_months} meses</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Fecha de Creación
              </p>
              <p className="text-base">
                {new Date(referrer.created_at).toLocaleDateString("es-ES")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Estado
              </p>
              <Badge variant={referrer.is_active ? "default" : "secondary"}>
                {referrer.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
          {referrer.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notas</p>
              <p className="text-base">{referrer.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Referidos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Referidos ({referrer.referrals?.length || 0})
              </CardTitle>
              <CardDescription>
                Usuarios que se registraron con este código
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReferralsExpanded(!isReferralsExpanded)}
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-200 ${
                  isReferralsExpanded ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>
        </CardHeader>
        {isReferralsExpanded && (
          <CardContent>
            {referrer.referrals && referrer.referrals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead>Expira</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrer.referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">
                        {referral.referred_user?.full_name || "Sin nombre"}
                      </TableCell>
                      <TableCell>{referral.referred_user?.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            referral.total_orders > 0
                              ? "default"
                              : referral.is_active
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {referral.total_orders > 0
                            ? "Convertido"
                            : referral.is_active
                            ? "Activo"
                            : "Expirado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(referral.created_at).toLocaleDateString(
                          "es-ES"
                        )}
                      </TableCell>
                      <TableCell>
                        {referral.expires_at ? (
                          new Date(referral.expires_at).toLocaleDateString(
                            "es-ES"
                          )
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay referidos registrados aún
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Historial de Comisiones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Historial de Comisiones ({referrer.commissions?.length || 0})
              </CardTitle>
              <CardDescription>
                Comisiones generadas por las compras de referidos
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCommissionsExpanded(!isCommissionsExpanded)}
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-200 ${
                  isCommissionsExpanded ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>
        </CardHeader>
        {isCommissionsExpanded && (
          <CardContent>
            {referrer.commissions && referrer.commissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Referido</TableHead>
                    <TableHead>Total del Pedido</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrer.commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-mono">
                        #{commission.order_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{commission.referred_user?.email}</TableCell>
                      <TableCell>
                        {formatCurrency(
                          parseFloat(commission.order_total.toString())
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(
                          parseFloat(commission.commission_amount.toString())
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Generada</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(commission.created_at).toLocaleDateString(
                          "es-ES"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay comisiones generadas aún
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Dialog de confirmación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar referidor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará el código de referido. Los referidos
              existentes seguirán activos hasta su fecha de expiración, pero no
              se podrán crear nuevos referidos con este código.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desactivando...
                </>
              ) : (
                "Desactivar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
