export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          price: number;
          category: string;
          unit: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Row']>;
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          bulk_ledger_type: 'prepaid' | 'postpaid' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['customers']['Row']>;
      };
      transactions: {
        Row: {
          id: string;
          bill_type: 'quick' | 'products' | 'mixed';
          total_amount: number;
          payment_mode: 'cash' | 'gpay';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['transactions']['Row']>;
      };
      transaction_items: {
        Row: {
          id: string;
          transaction_id: string;
          product_id: string | null;
          quantity: number;
          rate: number;
          total: number;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transaction_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['transaction_items']['Row']>;
      };
      bulk_ledger: {
        Row: {
          id: string;
          customer_id: string;
          quantity: number;
          price_per_unit: number;
          total_amount: number;
          settled: boolean;
          settled_on: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bulk_ledger']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bulk_ledger']['Row']>;
      };
      expenses: {
        Row: {
          id: string;
          category: string;
          amount: number;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['expenses']['Row']>;
      };
    };
  };
}

export type Product = Database['public']['Tables']['products']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionItem = Database['public']['Tables']['transaction_items']['Row'];
export type BulkLedger = Database['public']['Tables']['bulk_ledger']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];

export interface BillItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface DailyStats {
  totalSales: number;
  cashTotal: number;
  gpayTotal: number;
  itemCount: number;
  transactionCount: number;
}
