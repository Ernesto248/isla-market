"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

const referrerSchema = z.object({
  commission_rate: z
    .number()
    .min(0, "La comisión debe ser mayor o igual a 0")
    .max(100, "La comisión no puede ser mayor a 100"),
  duration_months: z
    .number()
    .int()
    .min(1, "La duración debe ser al menos 1 mes")
    .max(120, "La duración no puede exceder 120 meses"),
  is_active: z.boolean(),
  notes: z.string().optional(),
});

type ReferrerFormData = z.infer<typeof referrerSchema>;

interface Referrer {
  id: string;
  user_id: string;
  referral_code: string;
  commission_rate: number;
  duration_months: number;
  is_active: boolean;
  notes?: string;
  user?: {
    email: string;
    full_name?: string;
  };
}

export default function EditReferrerPage() {
  const router = useRouter();
  const params = useParams();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [referrer, setReferrer] = useState<Referrer | null>(null);

  const referrerId = params.id as string;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReferrerFormData>({
    resolver: zodResolver(referrerSchema),
  });

  const isActive = watch("is_active");

  useEffect(() => {
    if (session && referrerId) {
      fetchReferrer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, referrerId]);

  const fetchReferrer = async () => {
    try {
      const response = await fetch(`/api/admin/referrers/${referrerId}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar referidor");
      }

      const data = await response.json();
      setReferrer(data);

      // Llenar el formulario con los datos existentes
      setValue("commission_rate", data.commission_rate);
      setValue("duration_months", data.duration_months);
      setValue("is_active", data.is_active);
      setValue("notes", data.notes || "");
    } catch (error) {
      console.error("Error fetching referrer:", error);
      toast.error("Error al cargar los datos del referidor");
      router.push("/admin/referrers");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ReferrerFormData) => {
    try {
      setSubmitting(true);

      const response = await fetch(`/api/admin/referrers/${referrerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar referidor");
      }

      toast.success("Referidor actualizado exitosamente");
      router.push(`/admin/referrers/${referrerId}`);
    } catch (error: any) {
      console.error("Error updating referrer:", error);
      toast.error(error.message || "Error al actualizar el referidor");
    } finally {
      setSubmitting(false);
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/admin/referrers/${referrerId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Editar Referidor
          </h1>
          <p className="text-muted-foreground">
            {referrer.user?.full_name || referrer.user?.email} -{" "}
            {referrer.referral_code}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Configuración del Referidor</CardTitle>
            <CardDescription>
              Modifica los parámetros del programa de referidos para este
              usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información no editable */}
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-muted-foreground">Usuario</Label>
                <p className="text-base font-medium">
                  {referrer.user?.full_name || referrer.user?.email}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  Código de Referido
                </Label>
                <p className="text-base font-mono font-semibold">
                  {referrer.referral_code}
                </p>
              </div>
            </div>

            {/* Tasa de Comisión */}
            <div className="space-y-2">
              <Label htmlFor="commission_rate">
                Tasa de Comisión (%)
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="commission_rate"
                type="number"
                step="0.01"
                {...register("commission_rate", {
                  valueAsNumber: true,
                })}
                className={errors.commission_rate ? "border-destructive" : ""}
              />
              {errors.commission_rate && (
                <p className="text-sm text-destructive">
                  {errors.commission_rate.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Porcentaje de comisión por cada venta de referidos
              </p>
            </div>

            {/* Duración */}
            <div className="space-y-2">
              <Label htmlFor="duration_months">
                Duración (meses)
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Select
                value={watch("duration_months")?.toString()}
                onValueChange={(value) =>
                  setValue("duration_months", parseInt(value))
                }
              >
                <SelectTrigger
                  className={errors.duration_months ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Seleccionar duración" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 mes</SelectItem>
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                  <SelectItem value="24">24 meses</SelectItem>
                  <SelectItem value="36">36 meses</SelectItem>
                </SelectContent>
              </Select>
              {errors.duration_months && (
                <p className="text-sm text-destructive">
                  {errors.duration_months.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Tiempo durante el cual los referidos generan comisiones
              </p>
            </div>

            {/* Estado Activo */}
            <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Estado del Referidor</Label>
                <p className="text-sm text-muted-foreground">
                  {isActive
                    ? "El código está activo y puede generar nuevos referidos"
                    : "El código está inactivo y no generará nuevos referidos"}
                </p>
              </div>
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setValue("is_active", checked)}
              />
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Información adicional sobre este referidor..."
                {...register("notes")}
                className={errors.notes ? "border-destructive" : ""}
              />
              {errors.notes && (
                <p className="text-sm text-destructive">
                  {errors.notes.message}
                </p>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/referrers/${referrerId}`)}
                disabled={submitting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
