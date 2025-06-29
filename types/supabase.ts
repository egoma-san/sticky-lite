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
      boards: {
        Row: {
          id: string
          name: string
          owner_id: string
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          is_public?: boolean
          created_at?: string
        }
      }
      board_members: {
        Row: {
          board_id: string
          user_id: string
          role: 'viewer' | 'editor'
          joined_at: string
        }
        Insert: {
          board_id: string
          user_id: string
          role?: 'viewer' | 'editor'
          joined_at?: string
        }
        Update: {
          board_id?: string
          user_id?: string
          role?: 'viewer' | 'editor'
          joined_at?: string
        }
      }
      stickies: {
        Row: {
          id: string
          user_id: string
          board_id: string
          x: number
          y: number
          text: string | null
          rich_text: string | null
          color: string
          size: number
          font_size: number
          is_bold: boolean
          is_italic: boolean
          is_underline: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          board_id: string
          x: number
          y: number
          text?: string | null
          rich_text?: string | null
          color: string
          size?: number
          font_size?: number
          is_bold?: boolean
          is_italic?: boolean
          is_underline?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          board_id?: string
          x?: number
          y?: number
          text?: string | null
          rich_text?: string | null
          color?: string
          size?: number
          font_size?: number
          is_bold?: boolean
          is_italic?: boolean
          is_underline?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}