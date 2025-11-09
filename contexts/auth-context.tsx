"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as SupabaseUser,
  Session,
  AuthError,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Extender el tipo User para incluir información adicional
export interface ExtendedUser extends SupabaseUser {
  role?: "admin" | "customer";
  full_name?: string;
}

interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    userData?: { firstName: string; lastName: string }
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Función helper para enriquecer el usuario con datos de la BD
  const enrichUserData = async (
    supabaseUser: SupabaseUser | null,
    currentSession: Session | null
  ): Promise<ExtendedUser | null> => {
    if (!supabaseUser || !currentSession) return null;

    try {
      // Obtener información adicional del usuario desde la API
      // que usa Service Role para evitar problemas con RLS
      const response = await fetch("/api/auth/user-profile", {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (!response.ok) {
        // Si el error es 401, la sesión expiró - limpiar estado
        if (response.status === 401) {
          console.warn("Sesión expirada, limpiando estado local...");
          setSession(null);
          setUser(null);
          // Intentar refrescar la sesión
          await supabase.auth.refreshSession();
          return null;
        }

        console.error("Error fetching user profile:", response.statusText);
        // Retornar usuario básico si hay error
        return { ...supabaseUser, role: "customer" };
      }

      const userData = await response.json();

      // Combinar datos de autenticación con datos de la tabla users
      return {
        ...supabaseUser,
        role: userData?.role || "customer",
        full_name: userData?.full_name || "",
      };
    } catch (error) {
      console.error("Error enriching user data:", error);
      return { ...supabaseUser, role: "customer" };
    }
  };

  useEffect(() => {
    // Marcar como hidratado en el cliente
    setIsHydrated(true);

    // Obtener sesión inicial
    const getInitialSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
      } else {
        setSession(session);
        const enrichedUser = await enrichUserData(
          session?.user ?? null,
          session
        );
        setUser(enrichedUser);
      }

      setLoading(false);
    };

    getInitialSession();

    // Escuchar cambios en el estado de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      setSession(session);

      // Manejar eventos específicos
      if (event === "SIGNED_IN") {
        console.log(
          "[AUTH-CONTEXT] Usuario autenticado:",
          session?.user?.email
        );
        const enrichedUser = await enrichUserData(
          session?.user ?? null,
          session
        );
        setUser(enrichedUser);

        // Procesar código de referido pendiente (silencioso para el usuario)
        const pendingReferralCode = localStorage.getItem(
          "pending_referral_code"
        );
        console.log(
          "[AUTH-CONTEXT] Pending referral code:",
          pendingReferralCode
        );
        console.log("[AUTH-CONTEXT] User ID:", session?.user?.id);
        console.log(
          "[AUTH-CONTEXT] Has access token:",
          !!session?.access_token
        );

        if (pendingReferralCode && session?.access_token) {
          try {
            console.log(
              "[AUTH] Validating referral code:",
              pendingReferralCode
            );

            // Primero validar el código
            const validationResponse = await fetch(
              `/api/referrals/validate-code?code=${encodeURIComponent(
                pendingReferralCode
              )}`,
              {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              }
            );

            console.log(
              "[AUTH] Validation response status:",
              validationResponse.status
            );

            if (!validationResponse.ok) {
              // Código inválido o referidor inactivo - simplemente limpiar y continuar
              console.log(
                "[AUTH] Código de referido inválido o referidor inactivo - usuario registrado sin referidor"
              );
              localStorage.removeItem("pending_referral_code");
              return;
            }

            const validationData = await validationResponse.json();
            console.log("[AUTH] Validation data:", validationData);

            // Si el código es válido, intentar crear la relación
            console.log("[AUTH] Creating referral relationship...");
            const response = await fetch(
              "/api/referrals/create-referral-link",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  referral_code: pendingReferralCode,
                }),
              }
            );

            console.log(
              "[AUTH] Create referral response status:",
              response.status
            );

            if (response.ok) {
              const responseData = await response.json();
              console.log(
                "[AUTH] Relación de referido creada exitosamente:",
                responseData
              );
              localStorage.removeItem("pending_referral_code");
            } else {
              const data = await response.json();
              console.log(
                "[AUTH] No se pudo crear la relación de referido:",
                data.error || "Error desconocido"
              );
              localStorage.removeItem("pending_referral_code");
            }
          } catch (error) {
            console.error("[AUTH] Error procesando código de referido:", error);
            localStorage.removeItem("pending_referral_code");
          }
        }
      } else if (event === "SIGNED_OUT") {
        console.log("Usuario cerró sesión");
        setUser(null);
        setSession(null);
      } else if (event === "TOKEN_REFRESHED") {
        console.log("Token refrescado");
        const enrichedUser = await enrichUserData(
          session?.user ?? null,
          session
        );
        setUser(enrichedUser);
      } else if (event === "USER_UPDATED") {
        console.log("Usuario actualizado");
        const enrichedUser = await enrichUserData(
          session?.user ?? null,
          session
        );
        setUser(enrichedUser);
      } else {
        // Para otros eventos, intentar enriquecer datos si hay sesión
        const enrichedUser = await enrichUserData(
          session?.user ?? null,
          session
        );
        setUser(enrichedUser);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    userData?: { firstName: string; lastName: string }
  ) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData?.firstName || "",
            last_name: userData?.lastName || "",
          },
        },
      });

      if (error) {
        console.error("Error signing up:", error);
        return { error };
      }

      // Si el registro es exitoso pero requiere confirmación de email
      if (data.user && !data.session) {
        console.log(
          "Registration successful. Please check your email for confirmation."
        );
      }

      return { error: null };
    } catch (error) {
      console.error("Unexpected error during sign up:", error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Error signing in:", error);
        return { error };
      }

      console.log("Sign in successful:", data.user?.email);
      return { error: null };
    } catch (error) {
      console.error("Unexpected error during sign in:", error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Limpiar estado local primero para evitar errores de UI
      setUser(null);
      setSession(null);

      const { error } = await supabase.auth.signOut({ scope: "local" });

      if (error) {
        // Si el error es que la sesión ya no existe, no es crítico
        if (
          error.message?.includes("session") ||
          error.message?.includes("Auth session missing")
        ) {
          console.warn("Sesión ya cerrada, limpiando estado local...");
          // Forzar limpieza del storage local
          localStorage.removeItem("supabase.auth.token");
          sessionStorage.clear();
          return { error: null };
        }

        console.error("Error signing out:", error);
        return { error };
      }

      console.log("Sign out successful");
      return { error: null };
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
      // Aún así, limpiar estado local
      setUser(null);
      setSession(null);
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.clear();
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Error resetting password:", error);
        return { error };
      }

      console.log("Password reset email sent");
      return { error: null };
    } catch (error) {
      console.error("Unexpected error during password reset:", error);
      return { error: error as AuthError };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  // Evitar hidratación hasta que el cliente esté listo
  if (!isHydrated) {
    return (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
