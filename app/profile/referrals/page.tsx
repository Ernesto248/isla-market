"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Copy,
  Share2,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatCurrency } from "@/lib/utils";

interface ReferrerStats {
  is_referrer: boolean;
  referrer?: {
    id: string;
    referral_code: string;
    commission_rate: number;
    duration_months: number;
    is_active: boolean;
    created_at: string;
  };
  overview?: {
    total_referrals: number;
    active_referrals: number;
    expired_referrals: number;
    total_orders: number;
    total_sales: number;
    total_commissions: number;
    monthly_commissions: number;
  };
  referrals?: {
    active: any[];
    expired: any[];
  };
  commissions?: {
    recent: any[];
    total: number;
    per_month: Array<{ month: string; total: number; count: number }>;
  };
}

export default function MyReferralsPage() {
  const router = useRouter();
  const { session, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferrerStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [isActiveReferralsOpen, setIsActiveReferralsOpen] = useState(true);
  const [isRecentCommissionsOpen, setIsRecentCommissionsOpen] = useState(true);

  useEffect(() => {
    if (session) {
      fetchMyStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchMyStats = async () => {
    try {
      const response = await fetch("/api/referrals/my-stats", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar estadísticas");
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching my stats:", error);
      toast.error("Error al cargar tus estadísticas de referidos");
    } finally {
      setLoading(false);
    }
  };

  const getReferralUrl = () => {
    // Usar el dominio de producción o el origin actual
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://isla-market.com";
    return `${baseUrl}/?ref=${stats?.referrer?.referral_code}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getReferralUrl());
      setCopied(true);
      toast.success("¡Enlace copiado al portapapeles!");
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error("Error al copiar el enlace");
    }
  };

  const shareLink = async () => {
    const url = getReferralUrl();
    const text = `¡Únete a nuestra tienda usando mi código de referido y obtén beneficios exclusivos! ${url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Código de Referido",
          text: text,
          url: url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats?.is_referrer) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Programa de Referidos</CardTitle>
            <CardDescription>
              Actualmente no eres parte del programa de referidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              El programa de referidos te permite ganar comisiones por cada
              persona que invites a nuestra tienda. Contacta con nuestro equipo
              para más información.
            </p>
            <Button onClick={() => router.push("/")}>Volver a la tienda</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const referrer = stats.referrer!;
  const overview = stats.overview!;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Mi Panel de Referidos
        </h1>
        <p className="text-muted-foreground">
          Comparte tu código y gana {referrer.commission_rate}% de comisión por
          cada venta
        </p>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <Badge
          variant={referrer.is_active ? "default" : "secondary"}
          className="text-sm"
        >
          {referrer.is_active ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      {/* Referral Link Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Tu Enlace de Referido
          </CardTitle>
          <CardDescription>
            Comparte este enlace para que las personas se registren con tu
            código
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Código de Referido
            </label>
            <div className="flex gap-2">
              <Input
                value={referrer.referral_code}
                readOnly
                className="font-mono text-lg"
              />
              <Button variant="outline" onClick={copyToClipboard}>
                {copied ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Enlace Completo
            </label>
            <div className="flex gap-2">
              <Input value={getReferralUrl()} readOnly className="text-sm" />
              <Button variant="outline" onClick={copyToClipboard}>
                {copied ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button onClick={shareLink}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartir
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
            <ExternalLink className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">¿Cómo funciona?</p>
              <p className="text-muted-foreground">
                Las personas que se registren usando tu enlace quedarán
                vinculadas a tu cuenta durante {referrer.duration_months} meses.
                Ganarás {referrer.commission_rate}% de comisión por cada compra
                que realicen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Referidos Totales
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_referrals}</div>
            <p className="text-xs text-muted-foreground">
              {overview.active_referrals} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas Generadas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview.total_sales)}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.total_orders} órdenes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Comisiones Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview.total_commissions)}
            </div>
            <p className="text-xs text-muted-foreground">Total acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview.monthly_commissions)}
            </div>
            <p className="text-xs text-muted-foreground">En comisiones</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Referrals */}
      <Collapsible
        open={isActiveReferralsOpen}
        onOpenChange={setIsActiveReferralsOpen}
        className="mb-6"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Referidos Activos ({stats.referrals?.active.length || 0})
                </CardTitle>
                <CardDescription>
                  Personas que se registraron con tu código y están activas
                </CardDescription>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  {isActiveReferralsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {stats.referrals?.active && stats.referrals.active.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Fecha de Registro</TableHead>
                      <TableHead className="text-right">Órdenes</TableHead>
                      <TableHead className="text-right">
                        Total Gastado
                      </TableHead>
                      <TableHead className="text-right">Comisiones</TableHead>
                      <TableHead>Expira</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.referrals.active.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {referral.referred_user?.full_name ||
                                "Sin nombre"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {referral.referred_user?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(referral.created_at).toLocaleDateString(
                            "es-ES"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {referral.total_orders}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(referral.total_spent)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(referral.total_commission_generated)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(referral.expires_at).toLocaleDateString(
                              "es-ES"
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aún no tienes referidos activos. ¡Comparte tu enlace para
                  empezar!
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Recent Commissions */}
      <Collapsible
        open={isRecentCommissionsOpen}
        onOpenChange={setIsRecentCommissionsOpen}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Comisiones Recientes</CardTitle>
                <CardDescription>
                  Últimas 10 comisiones generadas por tus referidos
                </CardDescription>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  {isRecentCommissionsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {stats.commissions?.recent &&
              stats.commissions.recent.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referido</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">
                        Total del Pedido
                      </TableHead>
                      <TableHead className="text-right">Tu Comisión</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.commissions.recent.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>
                          {commission.referred_user?.full_name ||
                            commission.referred_user?.email ||
                            "Usuario"}
                        </TableCell>
                        <TableCell>
                          {new Date(commission.created_at).toLocaleDateString(
                            "es-ES"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(parseFloat(commission.order_total))}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(
                            parseFloat(commission.commission_amount)
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aún no has generado comisiones. Tus referidos deben realizar
                  compras para que ganes comisiones.
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
