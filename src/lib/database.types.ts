export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          created_at: string
          name: string
          phone: string
          email: string
          last_contact: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          phone: string
          email: string
          last_contact?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          phone?: string
          email?: string
          last_contact?: string | null
          user_id?: string
        }
      }
    }
  }
} 