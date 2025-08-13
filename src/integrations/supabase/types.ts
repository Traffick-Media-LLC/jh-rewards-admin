export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          email_type: string
          id: string
          metadata: Json | null
          recipient: string
          resend_id: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email_type: string
          id?: string
          metadata?: Json | null
          recipient: string
          resend_id?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email_type?: string
          id?: string
          metadata?: Json | null
          recipient?: string
          resend_id?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          fulfillment_status: string | null
          id: string
          items: Json
          shipping_city: string | null
          shipping_country: string | null
          shipping_name: string | null
          shipping_phone: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          shipping_street: string | null
          shopify_financial_status: string | null
          shopify_order_id: string | null
          shopify_order_name: string | null
          shopify_order_number: number | null
          status: string
          total_points: number
          tracking_number: string | null
          tracking_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          fulfillment_status?: string | null
          id?: string
          items?: Json
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          shipping_street?: string | null
          shopify_financial_status?: string | null
          shopify_order_id?: string | null
          shopify_order_name?: string | null
          shopify_order_number?: number | null
          status?: string
          total_points?: number
          tracking_number?: string | null
          tracking_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          fulfillment_status?: string | null
          id?: string
          items?: Json
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          shipping_street?: string | null
          shopify_financial_status?: string | null
          shopify_order_id?: string | null
          shopify_order_name?: string | null
          shopify_order_number?: number | null
          status?: string
          total_points?: number
          tracking_number?: string | null
          tracking_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          points: number
          type: Database["public"]["Enums"]["points_tx_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          points: number
          type: Database["public"]["Enums"]["points_tx_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          points?: number
          type?: Database["public"]["Enums"]["points_tx_type"]
          user_id?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          product_id: string
          sort: number
          url_card: string
          url_full: string
          url_thumb: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          product_id: string
          sort?: number
          url_card: string
          url_full: string
          url_thumb: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          product_id?: string
          sort?: number
          url_card?: string
          url_full?: string
          url_thumb?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          active: boolean
          created_at: string
          id: string
          inventory: number
          price_adjustment_cents: number
          product_id: string
          sku_suffix: string | null
          updated_at: string
          variant_combination: Json
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          inventory?: number
          price_adjustment_cents?: number
          product_id: string
          sku_suffix?: string | null
          updated_at?: string
          variant_combination?: Json
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          inventory?: number
          price_adjustment_cents?: number
          product_id?: string
          sku_suffix?: string | null
          updated_at?: string
          variant_combination?: Json
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          currency: string
          description: string | null
          has_variants: boolean
          homepage: boolean
          id: string
          image_url: string | null
          images: Json | null
          inventory: number
          name: string
          price_cents: number
          sale_price_cents: number | null
          shopify_product_id: string | null
          shopify_variant_id: string | null
          sku: string | null
          updated_at: string
          variant_types: string[]
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          has_variants?: boolean
          homepage?: boolean
          id?: string
          image_url?: string | null
          images?: Json | null
          inventory?: number
          name: string
          price_cents?: number
          sale_price_cents?: number | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          sku?: string | null
          updated_at?: string
          variant_types?: string[]
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          has_variants?: boolean
          homepage?: boolean
          id?: string
          image_url?: string | null
          images?: Json | null
          inventory?: number
          name?: string
          price_cents?: number
          sale_price_cents?: number | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          sku?: string | null
          updated_at?: string
          variant_types?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          marketing_emails: boolean
          phone: string | null
          points_balance: number
          postal_code: string | null
          product_preferences: string[]
          redeemed_this_month: number
          shopify_customer_id: string | null
          sms_notifications: boolean
          state: string | null
          street: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          marketing_emails?: boolean
          phone?: string | null
          points_balance?: number
          postal_code?: string | null
          product_preferences?: string[]
          redeemed_this_month?: number
          shopify_customer_id?: string | null
          sms_notifications?: boolean
          state?: string | null
          street?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_emails?: boolean
          phone?: string | null
          points_balance?: number
          postal_code?: string | null
          product_preferences?: string[]
          redeemed_this_month?: number
          shopify_customer_id?: string | null
          sms_notifications?: boolean
          state?: string | null
          street?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      redeemed_codes: {
        Row: {
          api_response: Json | null
          code: string
          created_at: string
          id: string
          points_awarded: number
          user_id: string
        }
        Insert: {
          api_response?: Json | null
          code: string
          created_at?: string
          id?: string
          points_awarded?: number
          user_id: string
        }
        Update: {
          api_response?: Json | null
          code?: string
          created_at?: string
          id?: string
          points_awarded?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      variant_options: {
        Row: {
          created_at: string
          id: string
          option_name: string
          product_id: string
          sort_order: number
          variant_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_name: string
          product_id: string
          sort_order?: number
          variant_type: string
        }
        Update: {
          created_at?: string
          id?: string
          option_name?: string
          product_id?: string
          sort_order?: number
          variant_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          _action_type: string
          _resource_type: string
          _resource_id?: string
          _details?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      points_tx_type: "earn" | "redeem" | "adjustment"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      points_tx_type: ["earn", "redeem", "adjustment"],
    },
  },
} as const
