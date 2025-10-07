"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, CheckCircle2, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";

interface ReferralCode {
  id: string;
  referral_code: string;
  user_id: string;
  commission_rate: number;
  duration_months: number;
  is_active: boolean;
  created_at: string;
  user_email?: string;
  user_name?: string;
  total_referrals?: number;
  active_referrals?: number;
}

export default function ReferralCodesPage() {
  const router = useRouter();
  const { session, user } = useAuth();
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") {
      router.push("/");
      return;
    }

    fetchCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchCodes = async () => {
    try {
      const response = await fetch("/api/admin/referrers", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar códigos");
      }

      const data = await response.json();
      setCodes(data.referrers || []);
    } catch (error) {
      console.error("Error fetching codes:", error);
      toast.error("Error al cargar los códigos de referido");
    } finally {
      setLoading(false);
    }
  };

  const getReferralUrl = (code: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/?ref=${code}`;
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(getReferralUrl(code));
      setCopiedCode(code);
      toast.success("¡Enlace copiado al portapapeles!");
      setTimeout(() => setCopiedCode(null), 3000);
    } catch (error) {
      toast.error("Error al copiar el enlace");
    }
  };

  const filteredCodes = codes.filter((code) => {
    const search = searchTerm.toLowerCase();
    return (
      code.referral_code.toLowerCase().includes(search) ||
      code.user_email?.toLowerCase().includes(search) ||
      code.user_name?.toLowerCase().includes(search)
    );
  });

  const activeCount = codes.filter((c) => c.is_active).length;
  const totalReferrals = codes.reduce(
    (sum, c) => sum + (c.total_referrals || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Códigos de Referido
        </h1>
        <p className="text-muted-foreground">
          Gestiona y visualiza todos los códigos de referido activos
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Códigos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              de {codes.length} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Referidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              Registros mediante códigos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {codes.length > 0
                ? (
                    codes.reduce((sum, c) => sum + c.commission_rate, 0) /
                    codes.length
                  ).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Comisión promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Códigos</CardTitle>
              <CardDescription>
                Todos los códigos de referido registrados en el sistema
              </CardDescription>
            </div>
            <Button onClick={() => router.push("/admin/referrers/new")}>
              Crear Referidor
            </Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, email o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Referidor</TableHead>
                <TableHead>Tasa</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Referidos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Enlace</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCodes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                  >
                    {searchTerm
                      ? "No se encontraron códigos que coincidan con la búsqueda"
                      : "No hay códigos de referido registrados"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <span className="font-mono font-semibold">
                        {code.referral_code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {code.user_name || "Sin nombre"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {code.user_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{code.commission_rate}%</TableCell>
                    <TableCell>{code.duration_months} meses</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {code.total_referrals || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {code.active_referrals || 0} activos
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={code.is_active ? "default" : "secondary"}>
                        {code.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[200px]">
                        <Input
                          value={getReferralUrl(code.referral_code)}
                          readOnly
                          className="h-8 text-xs"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code.referral_code)}
                        >
                          {copiedCode === code.referral_code ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/referrers/${code.id}`)
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
