"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z
  .object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "signup" | "forgot-password";
  onModeChange: (mode: "login" | "signup" | "forgot-password") => void;
}

export function AuthModal({
  isOpen,
  onClose,
  mode,
  onModeChange,
}: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const { signIn, signUp, resetPassword } = useAuth();
  const t = translations["es"];

  // Capturar código de referido de la URL cuando el modal se abre
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get("ref");

      if (refParam) {
        setReferralCode(refParam);
        // Mostrar mensaje amigable cuando hay un código de referido
        if (mode === "signup") {
          toast.info(`Código de referido detectado: ${refParam}`);
        }
      }
    }
  }, [isOpen, mode]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const forgotPasswordForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);

    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        toast.error("Error al iniciar sesión. Verifica tus credenciales.");
        return;
      }

      toast.success("¡Bienvenido de vuelta!");
      onClose();
    } catch (error) {
      toast.error("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupForm) => {
    setIsLoading(true);

    try {
      // Validar código de referido si existe
      if (referralCode) {
        const validateResponse = await fetch(
          `/api/referrals/validate-code?code=${referralCode}`
        );

        if (!validateResponse.ok) {
          toast.error(
            "El código de referido no es válido o ha expirado. Continuando sin código de referido."
          );
          setReferralCode(null);
        }
      }

      const { error } = await signUp(data.email, data.password, {
        firstName: data.firstName,
        lastName: data.lastName,
      });

      if (error) {
        toast.error("Error al crear la cuenta. Inténtalo de nuevo.");
        return;
      }

      // Si hay código de referido, guardarlo silenciosamente (solo para tracking interno de comisiones)
      if (referralCode) {
        localStorage.setItem("pending_referral_code", referralCode);
      }

      // Mensaje genérico - el sistema de referidos es interno
      toast.success("¡Cuenta creada! Revisa tu email para confirmar.");

      onClose();
    } catch (error) {
      toast.error("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordForm) => {
    setIsLoading(true);

    try {
      const { error } = await resetPassword(data.email);

      if (error) {
        toast.error("Error al enviar el email. Inténtalo de nuevo.");
        return;
      }

      toast.success("Email enviado. Revisa tu bandeja de entrada.");
      onModeChange("login");
    } catch (error) {
      toast.error("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "login"
              ? t.login
              : mode === "signup"
              ? t.signup
              : "Recuperar Contraseña"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Inicia sesión en tu cuenta"
              : mode === "signup"
              ? "Crea una nueva cuenta"
              : "Ingresa tu email para recuperar tu contraseña"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {mode === "login" ? (
            <form
              onSubmit={loginForm.handleSubmit(handleLogin)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  {...loginForm.register("email")}
                  className={
                    loginForm.formState.errors.email ? "border-red-500" : ""
                  }
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  {...loginForm.register("password")}
                  className={
                    loginForm.formState.errors.password ? "border-red-500" : ""
                  }
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  t.login
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => onModeChange("forgot-password")}
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          ) : mode === "signup" ? (
            <form
              onSubmit={signupForm.handleSubmit(handleSignup)}
              className="space-y-4"
            >
              {referralCode && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <span className="font-semibold">Código de referido:</span>{" "}
                    {referralCode}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                    Obtendrás beneficios al registrarte con este código
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t.firstName}</Label>
                  <Input
                    id="firstName"
                    {...signupForm.register("firstName")}
                    className={
                      signupForm.formState.errors.firstName
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {signupForm.formState.errors.firstName && (
                    <p className="text-sm text-red-500">
                      {signupForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">{t.lastName}</Label>
                  <Input
                    id="lastName"
                    {...signupForm.register("lastName")}
                    className={
                      signupForm.formState.errors.lastName
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {signupForm.formState.errors.lastName && (
                    <p className="text-sm text-red-500">
                      {signupForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  {...signupForm.register("email")}
                  className={
                    signupForm.formState.errors.email ? "border-red-500" : ""
                  }
                />
                {signupForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  {...signupForm.register("password")}
                  className={
                    signupForm.formState.errors.password ? "border-red-500" : ""
                  }
                />
                {signupForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...signupForm.register("confirmPassword")}
                  className={
                    signupForm.formState.errors.confirmPassword
                      ? "border-red-500"
                      : ""
                  }
                />
                {signupForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {signupForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  t.signup
                )}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="reset-email">{t.email}</Label>
                <Input
                  id="reset-email"
                  type="email"
                  {...forgotPasswordForm.register("email")}
                  className={
                    forgotPasswordForm.formState.errors.email
                      ? "border-red-500"
                      : ""
                  }
                />
                {forgotPasswordForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {forgotPasswordForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  "Enviar Email"
                )}
              </Button>
            </form>
          )}

          <div className="text-center">
            {mode === "forgot-password" ? (
              <button
                type="button"
                onClick={() => onModeChange("login")}
                className="text-sm text-primary hover:underline"
              >
                Volver al inicio de sesión
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  onModeChange(mode === "login" ? "signup" : "login")
                }
                className="text-sm text-primary hover:underline"
              >
                {mode === "login" ? t.dontHaveAccount : t.alreadyHaveAccount}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
