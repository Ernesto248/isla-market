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
    supabaseUser: SupabaseUser | null
  ): Promise<ExtendedUser | null> => {
    if (!supabaseUser) return null;

    try {
      // Obtener información adicional del usuario desde la tabla users
      const { data: userData, error } = await supabase
        .from("users")
        .select("role, full_name")
        .eq("id", supabaseUser.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        // Retornar usuario básico si hay error
        return { ...supabaseUser, role: "customer" };
      }

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
        const enrichedUser = await enrichUserData(session?.user ?? null);
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
      const enrichedUser = await enrichUserData(session?.user ?? null);
      setUser(enrichedUser);
      setLoading(false);

      // Manejar eventos específicos
      if (event === "SIGNED_IN") {
        console.log("Usuario autenticado:", session?.user?.email);
      } else if (event === "SIGNED_OUT") {
        console.log("Usuario cerró sesión");
      }
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

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error signing out:", error);
        return { error };
      }

      console.log("Sign out successful");
      return { error: null };
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
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
