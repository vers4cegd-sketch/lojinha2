import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

console.log('🔧 Supabase client configuration:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Missing');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'implicit'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'traking-shop-admin'
    }
  }
});

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          price: number;
          rating: number;
          image_url: string | null;
          checkout_url: string | null;
          tag: string;
          tag_type: string;
          features: any[];
          skins_count: number;
          skins: any[];
          is_special_offer: boolean;
          time_left: any;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          price?: number;
          rating?: number;
          image_url?: string | null;
          checkout_url?: string | null;
          tag?: string;
          tag_type?: string;
          features?: any[];
          skins_count?: number;
          skins?: any[];
          is_special_offer?: boolean;
          time_left?: any;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          price?: number;
          rating?: number;
          image_url?: string | null;
          checkout_url?: string | null;
          tag?: string;
          tag_type?: string;
          features?: any[];
          skins_count?: number;
          skins?: any[];
          is_special_offer?: boolean;
          time_left?: any;
          order_index?: number;
          updated_at?: string;
        };
      };
      skins: {
        Row: {
          id: string;
          arma: string;
          nome_skin: string;
          imagem_url: string | null;
          raridade: string | null;
          colecao: string | null;
          weapon_uuid: string;
          skin_uuid: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          arma: string;
          nome_skin: string;
          imagem_url?: string | null;
          raridade?: string | null;
          colecao?: string | null;
          weapon_uuid: string;
          skin_uuid: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          arma?: string;
          nome_skin?: string;
          imagem_url?: string | null;
          raridade?: string | null;
          colecao?: string | null;
          weapon_uuid?: string;
          skin_uuid?: string;
          updated_at?: string;
        };
      };
      account_skins: {
        Row: {
          id: string;
          product_id: string;
          skin_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          skin_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          skin_id?: string;
        };
      };
      admin_users: {
        Row: {
          id: string;
          username: string;
          email: string;
          password_hash: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          password_hash: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          password_hash?: string;
          role?: string;
        };
      };
    };
  };
};