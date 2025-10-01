import { createClient } from "@supabase/supabase-js";

// Lazy initialization para evitar errores durante el build
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// Cliente para el frontend (con anon key)
export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Durante el build, retornar un objeto mock para evitar errores
    if (
      typeof window === "undefined" &&
      process.env.NODE_ENV !== "production"
    ) {
      console.warn("Supabase credentials not found during build");
    }
    // Retornar un cliente mock que no hará nada
    return createClient("https://placeholder.supabase.co", "placeholder-key");
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return supabaseInstance;
})();

// Cliente para el backend (con service role key) - SOLO para uso en servidor
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin operations"
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

// Tipos de base de datos
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          slug: string;
          image_url: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          slug: string;
          image_url?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          slug?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          category_id: string;
          images: string[] | null;
          stock_quantity: number | null;
          is_active: boolean | null;
          weight: number | null;
          dimensions: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          category_id: string;
          images?: string[] | null;
          stock_quantity?: number | null;
          is_active?: boolean | null;
          weight?: number | null;
          dimensions?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          category_id?: string;
          images?: string[] | null;
          stock_quantity?: number | null;
          is_active?: boolean | null;
          weight?: number | null;
          dimensions?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "admin" | "customer" | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "admin" | "customer" | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: "admin" | "customer" | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          shipping_address_id: string;
          status:
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "paid"
            | null;
          total_amount: number;
          stripe_payment_intent_id: string | null;
          stripe_session_id: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          shipping_address_id: string;
          status?:
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "paid"
            | null;
          total_amount: number;
          stripe_payment_intent_id?: string | null;
          stripe_session_id?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          shipping_address_id?: string;
          status?:
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "paid"
            | null;
          total_amount?: number;
          stripe_payment_intent_id?: string | null;
          stripe_session_id?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      shipping_addresses: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          phone: string;
          street: string;
          house_number: string;
          between_streets: string;
          neighborhood: string;
          province: string;
          is_default: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          phone: string;
          street: string;
          house_number: string;
          between_streets: string;
          neighborhood: string;
          province: string;
          is_default?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
          street?: string;
          house_number?: string;
          between_streets?: string;
          neighborhood?: string;
          province?: string;
          is_default?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          created_at?: string | null;
        };
      };
    };
  };
}
