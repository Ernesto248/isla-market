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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Users,
  DollarSign,
  TrendingUp,
  Award,
  BarChart,
  UserPlus,
} from "lucide-react";
import type { ReferrerStats, ReferrerRanking } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function ReferrersDashboardPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferrerStats | null>(null);
  const [ranking, setRanking] = useState<ReferrerRanking[]>([]);

  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, rankingResponse] = await Promise.all([
        fetch("/api/admin/referrers/stats", {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }),
        fetch("/api/admin/referrers/ranking?limit=10", {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }),
      ]);

      if (!statsResponse.ok || !rankingResponse.ok) {
        throw new Error("Error al cargar datos del dashboard");
      }

      const statsData = await statsResponse.json();
      const rankingData = await rankingResponse.json();

      // Mapear la estructura de la API al formato esperado
      const mappedStats: ReferrerStats = {
        total_referrers: statsData.overview?.total_referrers || 0,
        active_referrers: statsData.overview?.active_referrers || 0,
        total_referrals: statsData.overview?.total_referrals || 0,
        active_referrals: statsData.overview?.active_referrals || 0,
        total_commissions_generated: statsData.overview?.total_commissions || 0,
        total_sales_from_referrals: statsData.overview?.total_sales || 0,
        average_commission_per_referrer:
          statsData.averages?.commission_per_referrer || 0,
      };

      setStats(mappedStats);
      setRanking(rankingData.ranking || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Error al cargar datos del dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard de Referidos
            </h1>
            <p className="text-muted-foreground">
              Métricas y análisis del programa de referidos
            </p>
          </div>
        </div>

        <Button onClick={() => router.push("/admin/referrers/new")}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Referidor
        </Button>
      </div>

      {/* Estadísticas Globales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Referidores Totales
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_referrers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_referrers || 0} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Referidos Totales
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_referrals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_referrals || 0} activos
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
              {formatCurrency(stats?.total_sales_from_referrals || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Por referidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Comisiones Generadas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.total_commissions_generated || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total acumulado</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Adicionales */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Métricas del Programa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Promedio de comisión por referidor
              </span>
              <span className="text-sm font-medium">
                {formatCurrency(stats?.average_commission_per_referrer || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Tasa de conversión de referidos
              </span>
              <span className="text-sm font-medium">
                {stats && stats.total_referrals > 0
                  ? (
                      (stats.active_referrals / stats.total_referrals) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Tasa de activación de referidores
              </span>
              <span className="text-sm font-medium">
                {stats && stats.total_referrers > 0
                  ? (
                      (stats.active_referrers / stats.total_referrers) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Referidos por referidor (promedio)
              </span>
              <span className="text-sm font-medium">
                {stats && stats.active_referrers > 0
                  ? (stats.total_referrals / stats.active_referrers).toFixed(1)
                  : 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Estado del Programa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Referidores activos
              </span>
              <Badge variant="default">{stats?.active_referrers || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Referidores inactivos
              </span>
              <Badge variant="secondary">
                {(stats?.total_referrers || 0) - (stats?.active_referrers || 0)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Referidos activos
              </span>
              <Badge variant="default">{stats?.active_referrals || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Referidos expirados
              </span>
              <Badge variant="outline">
                {(stats?.total_referrals || 0) - (stats?.active_referrals || 0)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Top Referidores */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Referidores</CardTitle>
          <CardDescription>
            Los referidores con mejor desempeño del programa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ranking.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-right">Referidos</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                  <TableHead className="text-right">Comisiones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((ref) => (
                  <TableRow
                    key={ref.referrer_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/admin/referrers/${ref.referrer_id}`)
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">#{ref.rank}</span>
                        {ref.rank <= 3 && (
                          <Award
                            className={`h-4 w-4 ${
                              ref.rank === 1
                                ? "text-yellow-500"
                                : ref.rank === 2
                                ? "text-gray-400"
                                : "text-amber-600"
                            }`}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {ref.referral_code}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {ref.user_name || "Sin nombre"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {ref.user_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {ref.total_referrals}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(ref.total_sales)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(ref.total_commissions)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de ranking disponibles
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card>
        <CardHeader>
          <CardTitle>Administrar Referidores</CardTitle>
          <CardDescription>
            Gestiona los referidores y su desempeño en el programa
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={() => router.push("/admin/referrers")}>
            <Users className="mr-2 h-4 w-4" />
            Ver Todos los Referidores
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/referrers/new")}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Crear Nuevo Referidor
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
