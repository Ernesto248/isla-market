"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { z } from "zod";

// Schema de validación
const referrerSchema = z.object({
  user_id: z.string().min(1, "Selecciona un usuario"),
  referral_code: z
    .string()
    .min(6, "Mínimo 6 caracteres")
    .max(15, "Máximo 15 caracteres")
    .regex(/^[A-Z0-9]+$/, "Solo letras mayúsculas y números"),
  commission_rate: z.number().min(0.01, "Mínimo 0.01%").max(50, "Máximo 50%"),
  duration_months: z
    .number()
    .int()
    .min(1, "Mínimo 1 mes")
    .max(36, "Máximo 36 meses"),
  notes: z.string().optional(),
});

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

export default function NewReferrerPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [formData, setFormData] = useState({
    user_id: "",
    referral_code: "",
    commission_rate: "3.00",
    duration_months: "6",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar usuarios disponibles
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/customers", {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (!response.ok) throw new Error("Error al cargar usuarios");

        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Error al cargar usuarios");
      } finally {
        setLoadingUsers(false);
      }
    };

    if (session) {
      fetchUsers();
    }
  }, [session]);

  // Generar código sugerido basado en el nombre del usuario
  const generateCode = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return "";

    const name = user.full_name || user.email.split("@")[0];
    const cleanName = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, 10);
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");

    return `${cleanName}${random}`;
  };

  const handleUserChange = (userId: string) => {
    setFormData({
      ...formData,
      user_id: userId,
      referral_code: generateCode(userId),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validar datos
      const validatedData = referrerSchema.parse({
        ...formData,
        commission_rate: parseFloat(formData.commission_rate),
        duration_months: parseInt(formData.duration_months),
      });

      setLoading(true);

      const response = await fetch("/api/admin/referrers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear referidor");
      }

      toast.success("Referidor creado exitosamente");
      router.push("/admin/referrers");
    } catch (error: any) {
      console.error("Error creating referrer:", error);

      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error(error.message || "Error al crear referidor");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/referrers")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Referidor</h1>
          <p className="text-muted-foreground">
            Asigna un código de referido a un usuario
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Referidor</CardTitle>
            <CardDescription>
              Completa los datos para crear un nuevo referidor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Usuario */}
            <div className="space-y-2">
              <Label htmlFor="user_id">Usuario *</Label>
              <Select
                value={formData.user_id}
                onValueChange={handleUserChange}
                disabled={loadingUsers}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.user_id && (
                <p className="text-sm text-destructive">{errors.user_id}</p>
              )}
            </div>

            {/* Código de referido */}
            <div className="space-y-2">
              <Label htmlFor="referral_code">Código de Referido *</Label>
              <Input
                id="referral_code"
                value={formData.referral_code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    referral_code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="JUAN2024"
                maxLength={15}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                6-15 caracteres, solo letras mayúsculas y números
              </p>
              {errors.referral_code && (
                <p className="text-sm text-destructive">
                  {errors.referral_code}
                </p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Comisión */}
              <div className="space-y-2">
                <Label htmlFor="commission_rate">Comisión (%) *</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="50"
                  value={formData.commission_rate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commission_rate: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Entre 0.01% y 50%
                </p>
                {errors.commission_rate && (
                  <p className="text-sm text-destructive">
                    {errors.commission_rate}
                  </p>
                )}
              </div>

              {/* Duración */}
              <div className="space-y-2">
                <Label htmlFor="duration_months">Duración (meses) *</Label>
                <Input
                  id="duration_months"
                  type="number"
                  min="1"
                  max="36"
                  value={formData.duration_months}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_months: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Entre 1 y 36 meses
                </p>
                {errors.duration_months && (
                  <p className="text-sm text-destructive">
                    {errors.duration_months}
                  </p>
                )}
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Información adicional sobre este referidor..."
                rows={4}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/referrers")}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear Referidor
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
