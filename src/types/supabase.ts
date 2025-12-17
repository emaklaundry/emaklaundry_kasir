export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      assets: {
        Row: {
          id: string;
          maintenanceHistory: Json | null;
          name: string;
          purchaseCost: number | null;
          purchaseDate: string | null;
          serialNumber: string | null;
          status: string;
          storeId: string | null;
        };
        Insert: {
          id?: string;
          maintenanceHistory?: Json | null;
          name: string;
          purchaseCost?: number | null;
          purchaseDate?: string | null;
          serialNumber?: string | null;
          status: string;
          storeId?: string | null;
        };
        Update: {
          id?: string;
          maintenanceHistory?: Json | null;
          name?: string;
          purchaseCost?: number | null;
          purchaseDate?: string | null;
          serialNumber?: string | null;
          status?: string;
          storeId?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assets_storeId_fkey';
            columns: ['storeId'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string | null;
          id: number;
          storeId: string | null;
          timestamp: string | null;
          user: string | null;
        };
        Insert: {
          action?: string | null;
          id?: never;
          storeId?: string | null;
          timestamp?: string | null;
          user?: string | null;
        };
        Update: {
          action?: string | null;
          id?: never;
          storeId?: string | null;
          timestamp?: string | null;
          user?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_storeId_fkey';
            columns: ['storeId'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      customers: {
        Row: {
          address: string | null;
          createdAt: string | null;
          defaultDiscount: number | null;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          storeId: string | null;
        };
        Insert: {
          address?: string | null;
          createdAt?: string | null;
          defaultDiscount?: number | null;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          storeId?: string | null;
        };
        Update: {
          address?: string | null;
          createdAt?: string | null;
          defaultDiscount?: number | null;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          storeId?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'customers_storeId_fkey';
            columns: ['storeId'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      expenses: {
        Row: {
          amount: number;
          category: string;
          date: string;
          description: string;
          id: string;
          storeId: string | null;
        };
        Insert: {
          amount: number;
          category: string;
          date: string;
          description: string;
          id?: string;
          storeId?: string | null;
        };
        Update: {
          amount?: number;
          category?: string;
          date?: string;
          description?: string;
          id?: string;
          storeId?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'expenses_storeId_fkey';
            columns: ['storeId'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      inventory_items: {
        Row: {
          id: string;
          lowStockThreshold: number;
          name: string;
          stock: number;
          storeId: string | null;
          unit: string;
        };
        Insert: {
          id?: string;
          lowStockThreshold: number;
          name: string;
          stock: number;
          storeId?: string | null;
          unit: string;
        };
        Update: {
          id?: string;
          lowStockThreshold?: number;
          name?: string;
          stock?: number;
          storeId?: string | null;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_items_storeId_fkey';
            columns: ['storeId'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          canGiveDiscount: boolean | null;
          created_at: string | null;
          id: string;
          isActive: boolean | null;
          name: string;
          role: string;
          store_id: string | null;
        };
        Insert: {
          canGiveDiscount?: boolean | null;
          created_at?: string | null;
          id: string;
          isActive?: boolean | null;
          name: string;
          role: string;
          store_id?: string | null;
        };
        Update: {
          canGiveDiscount?: boolean | null;
          created_at?: string | null;
          id?: string;
          isActive?: boolean | null;
          name?: string;
          role?: string;
          store_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      scheduled_maintenances: {
        Row: {
          assetId: string | null;
          description: string;
          estimatedCost: number | null;
          frequencyUnit: string;
          frequencyValue: number;
          id: string;
          lastCompletedDate: string | null;
          nextDueDate: string;
        };
        Insert: {
          assetId?: string | null;
          description: string;
          estimatedCost?: number | null;
          frequencyUnit: string;
          frequencyValue: number;
          id?: string;
          lastCompletedDate?: string | null;
          nextDueDate: string;
        };
        Update: {
          assetId?: string | null;
          description?: string;
          estimatedCost?: number | null;
          frequencyUnit?: string;
          frequencyValue?: number;
          id?: string;
          lastCompletedDate?: string | null;
          nextDueDate?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scheduled_maintenances_assetId_fkey';
            columns: ['assetId'];
            isOneToOne: false;
            referencedRelation: 'assets';
            referencedColumns: ['id'];
          },
        ];
      };
      services: {
        Row: {
          category: Database['public']['Enums']['service_category'];
          durationDays: number;
          id: string;
          name: string;
          price: number;
          storeId: string | null;
          unit: string;
          wash_type: string;
        };
        Insert: {
          category: Database['public']['Enums']['service_category'];
          durationDays: number;
          id?: string;
          name: string;
          price: number;
          storeId?: string | null;
          unit: string;
          wash_type?: string;
        };
        Update: {
          category?: Database['public']['Enums']['service_category'];
          durationDays?: number;
          id?: string;
          name?: string;
          price?: number;
          storeId?: string | null;
          unit?: string;
          wash_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'services_storeId_fkey';
            columns: ['storeId'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      settings: {
        Row: {
          discountRate: number | null;
          id: number;
          receiptMessage: string | null;
          taxRate: number | null;
        };
        Insert: {
          discountRate?: number | null;
          id?: never;
          receiptMessage?: string | null;
          taxRate?: number | null;
        };
        Update: {
          discountRate?: number | null;
          id?: never;
          receiptMessage?: string | null;
          taxRate?: number | null;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          address: string | null;
          created_at: string | null;
          id: string;
          isActive: boolean | null;
          name: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          id?: string;
          isActive?: boolean | null;
          name: string;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          id?: string;
          isActive?: boolean | null;
          name?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amountPaid: number;
          change: number;
          createdAt: string | null;
          createdByUserId: string | null;
          customerId: string | null;
          discount: number;
          estimatedCompletionDate: string | null;
          id: string;
          idempotencyKey: string | null;
          invoice_code: string | null;
          items: Json;
          notes: string | null;
          orderStatus: string;
          paymentMethod: string | null;
          paymentStatus: string;
          storeId: string | null;
          subtotal: number;
          tax: number;
          total: number;
        };
        Insert: {
          amountPaid: number;
          change: number;
          createdAt?: string | null;
          createdByUserId?: string | null;
          customerId?: string | null;
          discount: number;
          estimatedCompletionDate?: string | null;
          id?: string;
          idempotencyKey?: string | null;
          invoice_code?: string | null;
          items: Json;
          notes?: string | null;
          orderStatus: string;
          paymentMethod?: string | null;
          paymentStatus: string;
          storeId?: string | null;
          subtotal: number;
          tax: number;
          total: number;
        };
        Update: {
          amountPaid?: number;
          change?: number;
          createdAt?: string | null;
          createdByUserId?: string | null;
          customerId?: string | null;
          discount?: number;
          estimatedCompletionDate?: string | null;
          id?: string;
          idempotencyKey?: string | null;
          invoice_code?: string | null;
          items?: Json;
          notes?: string | null;
          orderStatus?: string;
          paymentMethod?: string | null;
          paymentStatus?: string;
          storeId?: string | null;
          subtotal?: number;
          tax?: number;
          total?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_createdByUserId_fkey';
            columns: ['createdByUserId'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_customerId_fkey';
            columns: ['customerId'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_storeId_fkey';
            columns: ['storeId'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      bulk_update_order_status:
        | {
            Args: {
              p_new_status: Database['public']['Enums']['order_status'];
              p_transaction_ids: string[];
              p_user_id: string;
            };
            Returns: number;
          }
        | { Args: never; Returns: undefined };
      complete_scheduled_maintenance:
        | {
            Args: {
              p_asset_id: string;
              p_frequency_unit: string;
              p_frequency_value: number;
              p_log_description: string;
              p_schedule_id: string;
            };
            Returns: undefined;
          }
        | { Args: { maintenance_id: string }; Returns: undefined }
        | { Args: never; Returns: undefined };
      generate_invoice_code: { Args: { length?: number }; Returns: string };
      get_laundry_status: {
        Args: { input_identifier: string };
        Returns: {
          amountPaid: number;
          createdAt: string;
          customerName: string;
          estimatedCompletionDate: string;
          id: string;
          invoiceCode: string;
          orderStatus: string;
          paymentStatus: string;
          total: number;
        }[];
      };
      get_my_role: { Args: never; Returns: string };
      get_my_store_id: { Args: never; Returns: string };
      get_public_services: {
        Args: { store_id_input: string };
        Returns: {
          category: string;
          duration_days: number;
          service_name: string;
        }[];
      };
      handle_new_user: {
        Args: {
          store_id: string;
          user_id: string;
          user_name: string;
          user_role: string;
        };
        Returns: undefined;
      };
      update_transaction_progress: {
        Args: {
          p_amount_paid?: number;
          p_change?: number;
          p_order_status?: string;
          p_payment_method?: string;
          p_payment_status?: string;
          transaction_id_input: string;
        };
        Returns: {
          amountPaid: number;
          change: number;
          createdAt: string | null;
          createdByUserId: string | null;
          customerId: string | null;
          discount: number;
          estimatedCompletionDate: string | null;
          id: string;
          idempotencyKey: string | null;
          invoice_code: string | null;
          items: Json;
          notes: string | null;
          orderStatus: string;
          paymentMethod: string | null;
          paymentStatus: string;
          storeId: string | null;
          subtotal: number;
          tax: number;
          total: number;
        }[];
        SetofOptions: {
          from: '*';
          to: 'transactions';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
    };
    Enums: {
      order_status: 'Diproses' | 'Siap Diambil' | 'Selesai';
      payment_method: 'Tunai' | 'QRIS' | 'Transfer Bank';
      payment_status: 'Lunas' | 'Belum Lunas' | 'Bayar Sebagian';
      service_category: 'Kiloan' | 'Satuan' | 'Sepatu' | 'Karpet';
      user_role: 'Super Admin' | 'Admin' | 'Kasir';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      order_status: ['Diproses', 'Siap Diambil', 'Selesai'],
      payment_method: ['Tunai', 'QRIS', 'Transfer Bank'],
      payment_status: ['Lunas', 'Belum Lunas', 'Bayar Sebagian'],
      service_category: ['Kiloan', 'Satuan', 'Sepatu', 'Karpet'],
      user_role: ['Super Admin', 'Admin', 'Kasir'],
    },
  },
} as const;
