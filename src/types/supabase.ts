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
      employees: {
        Row: {
          id: string;
          store_id: string | null;
          name: string;
          phone: string | null;
          role: string;
          base_salary: number;
          commission_rate: number;
          is_active: boolean;
          login_enabled: boolean;
          address: string | null;
          start_date: string | null;
          shift_start: string | null;
          shift_end: string | null;
          work_days: number[];
          late_tolerance_minutes: number;
          monthly_incentive: number;
          photo_url: string | null;
          photo_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id?: string | null;
          name: string;
          phone?: string | null;
          role: string;
          base_salary?: number;
          commission_rate?: number;
          is_active?: boolean;
          login_enabled?: boolean;
          address?: string | null;
          start_date?: string | null;
          shift_start?: string | null;
          shift_end?: string | null;
          work_days?: number[];
          late_tolerance_minutes?: number;
          monthly_incentive?: number;
          photo_url?: string | null;
          photo_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string | null;
          name?: string;
          phone?: string | null;
          role?: string;
          base_salary?: number;
          commission_rate?: number;
          is_active?: boolean;
          login_enabled?: boolean;
          address?: string | null;
          start_date?: string | null;
          shift_start?: string | null;
          shift_end?: string | null;
          work_days?: number[];
          late_tolerance_minutes?: number;
          monthly_incentive?: number;
          photo_url?: string | null;
          photo_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'employees_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      attendance: {
        Row: {
          id: string;
          employee_id: string;
          date: string;
          clock_in: string | null;
          clock_out: string | null;
          last_seen_at: string | null;
          clock_in_source: string | null;
          clock_out_source: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          date: string;
          clock_in?: string | null;
          clock_out?: string | null;
          last_seen_at?: string | null;
          clock_in_source?: string | null;
          clock_out_source?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          date?: string;
          clock_in?: string | null;
          clock_out?: string | null;
          last_seen_at?: string | null;
          clock_in_source?: string | null;
          clock_out_source?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'attendance_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
      advances: {
        Row: {
          id: string;
          employee_id: string;
          amount: number;
          date: string;
          reason: string | null;
          is_deducted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          amount: number;
          date: string;
          reason?: string | null;
          is_deducted?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          amount?: number;
          date?: string;
          reason?: string | null;
          is_deducted?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'advances_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
      payroll: {
        Row: {
          id: string;
          employee_id: string;
          period_start: string;
          period_end: string;
          base_salary: number;
          commission_total: number;
          deductions: number;
          net_salary: number;
          status: string;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          period_start: string;
          period_end: string;
          base_salary: number;
          commission_total: number;
          deductions: number;
          net_salary: number;
          status: string;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          period_start?: string;
          period_end?: string;
          base_salary?: number;
          commission_total?: number;
          deductions?: number;
          net_salary?: number;
          status?: string;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payroll_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
        ];
      };
      customers: {
        Row: {
          address: string | null;
          createdAt: string | null;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          storeId: string | null;
        };
        Insert: {
          address?: string | null;
          createdAt?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          storeId?: string | null;
        };
        Update: {
          address?: string | null;
          createdAt?: string | null;
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
          attendanceId: string | null;
          category: string;
          date: string;
          description: string;
          id: string;
          recurringPeriod: string | null;
          recurringTemplateId: string | null;
          storeId: string | null;
        };
        Insert: {
          amount: number;
          attendanceId?: string | null;
          category: string;
          date: string;
          description: string;
          id?: string;
          recurringPeriod?: string | null;
          recurringTemplateId?: string | null;
          storeId?: string | null;
        };
        Update: {
          amount?: number;
          attendanceId?: string | null;
          category?: string;
          date?: string;
          description?: string;
          id?: string;
          recurringPeriod?: string | null;
          recurringTemplateId?: string | null;
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
          {
            foreignKeyName: 'expenses_recurring_template_store_fkey';
            columns: ['recurringTemplateId', 'storeId'];
            isOneToOne: false;
            referencedRelation: 'monthly_expense_templates';
            referencedColumns: ['id', 'store_id'];
          },
        ];
      };
      monthly_expense_templates: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          sort_order: number;
          store_id: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          sort_order?: number;
          store_id: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          sort_order?: number;
          store_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'monthly_expense_templates_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      inventory_items: {
        Row: {
          id: string;
          is_low_stock: boolean | null;
          lowStockThreshold: number;
          name: string;
          stock: number;
          storeId: string | null;
          unit: string;
          updatedAt: string | null;
        };
        Insert: {
          id?: string;
          lowStockThreshold: number;
          name: string;
          stock: number;
          storeId?: string | null;
          unit: string;
          updatedAt?: string | null;
        };
        Update: {
          id?: string;
          lowStockThreshold?: number;
          name?: string;
          stock?: number;
          storeId?: string | null;
          unit?: string;
          updatedAt?: string | null;
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
      inventory_movements: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          inventory_item_id: string;
          kind: string;
          note: string | null;
          quantity: number;
          recipe_id: string | null;
          stock_after: number;
          stock_before: number;
          store_id: string | null;
          transaction_id: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          inventory_item_id: string;
          kind: string;
          note?: string | null;
          quantity: number;
          recipe_id?: string | null;
          stock_after: number;
          stock_before: number;
          store_id?: string | null;
          transaction_id?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          inventory_item_id?: string;
          kind?: string;
          note?: string | null;
          quantity?: number;
          recipe_id?: string | null;
          stock_after?: number;
          stock_before?: number;
          store_id?: string | null;
          transaction_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_movements_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_movements_inventory_item_id_fkey';
            columns: ['inventory_item_id'];
            isOneToOne: false;
            referencedRelation: 'inventory_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_movements_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'inventory_recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_movements_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_movements_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'transactions';
            referencedColumns: ['id'];
          },
        ];
      };
      inventory_recipes: {
        Row: {
          amount: number;
          basis: string;
          created_at: string;
          id: string;
          inventory_item_id: string;
          is_active: boolean;
          service_id: string | null;
          store_id: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          basis?: string;
          created_at?: string;
          id?: string;
          inventory_item_id: string;
          is_active?: boolean;
          service_id?: string | null;
          store_id?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          basis?: string;
          created_at?: string;
          id?: string;
          inventory_item_id?: string;
          is_active?: boolean;
          service_id?: string | null;
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_recipes_inventory_item_id_fkey';
            columns: ['inventory_item_id'];
            isOneToOne: false;
            referencedRelation: 'inventory_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_recipes_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_recipes_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          employee_id: string | null;
          id: string;
          isActive: boolean | null;
          name: string;
          role: string;
          store_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          employee_id?: string | null;
          id: string;
          isActive?: boolean | null;
          name: string;
          role: string;
          store_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          employee_id?: string | null;
          id?: string;
          isActive?: boolean | null;
          name?: string;
          role?: string;
          store_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: true;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
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
          minQuantity: number;
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
          minQuantity?: number;
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
          minQuantity?: number;
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
          id: number;
          receiptMessage: string | null;
          storeId: string | null;
          isMaintenanceMode: boolean | null;
          maintenanceMessage: string | null;
          whatsappFooter: string | null;
          qrisStaticCode: string | null;
          businessName: string | null;
          trackingUrl: string | null;
        };
        Insert: {
          id?: never;
          receiptMessage?: string | null;
          storeId?: string | null;
          isMaintenanceMode?: boolean | null;
          maintenanceMessage?: string | null;
          whatsappFooter?: string | null;
          qrisStaticCode?: string | null;
          businessName?: string | null;
          trackingUrl?: string | null;
        };
        Update: {
          id?: never;
          receiptMessage?: string | null;
          storeId?: string | null;
          isMaintenanceMode?: boolean | null;
          maintenanceMessage?: string | null;
          whatsappFooter?: string | null;
          qrisStaticCode?: string | null;
          businessName?: string | null;
          trackingUrl?: string | null;
        };
        Relationships: [];
      };
      standard_operating_procedures: {
        Row: {
          category: string;
          content: string;
          created_at: string | null;
          display_order: number;
          id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          content: string;
          created_at?: string | null;
          display_order?: number;
          id?: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          content?: string;
          created_at?: string | null;
          display_order?: number;
          id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      stock_opname: {
        Row: {
          discrepancy: number | null;
          id: string;
          inventory_item_id: string | null;
          notes: string | null;
          physical_stock: number;
          recorded_at: string;
          recorded_by: string | null;
          store_id: string | null;
          virtual_stock: number;
        };
        Insert: {
          id?: string;
          inventory_item_id?: string | null;
          notes?: string | null;
          physical_stock: number;
          recorded_at?: string;
          recorded_by?: string | null;
          store_id?: string | null;
          virtual_stock: number;
        };
        Update: {
          id?: string;
          inventory_item_id?: string | null;
          notes?: string | null;
          physical_stock?: number;
          recorded_at?: string;
          recorded_by?: string | null;
          store_id?: string | null;
          virtual_stock?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'stock_opname_inventory_item_id_fkey';
            columns: ['inventory_item_id'];
            isOneToOne: false;
            referencedRelation: 'inventory_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_opname_recorded_by_fkey';
            columns: ['recorded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_opname_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
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
          supervisorApprovalId: string | null;
          whatsappSentAt: string | null;
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
          supervisorApprovalId?: string | null;
          whatsappSentAt?: string | null;
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
          supervisorApprovalId?: string | null;
          whatsappSentAt?: string | null;
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
      adjust_inventory_stock: {
        Args: { p_item_id: string; p_mode: string; p_note?: string; p_value: number };
        Returns: number;
      };
      record_stock_opname: {
        Args: { p_item_id: string; p_notes?: string; p_physical_stock: number };
        Returns: Database['public']['Tables']['stock_opname']['Row'];
      };
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
      has_my_supervisor_pin: { Args: Record<PropertyKey, never>; Returns: boolean };
      request_supervisor_approval: {
        Args: {
          p_action: string;
          p_pin: string;
          p_transaction_id?: string;
        };
        Returns: Json;
      };
      set_my_supervisor_pin: { Args: { p_pin: string }; Returns: undefined };
      record_attendance: {
        Args: { p_event?: string };
        Returns: undefined;
      };
      update_transaction_progress: {
        Args: {
          p_amount_paid?: number;
          p_change?: number;
          p_order_status?: string;
          p_payment_method?: string;
          p_payment_status?: string;
          p_supervisor_approval_id?: string;
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
          supervisorApprovalId: string | null;
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
