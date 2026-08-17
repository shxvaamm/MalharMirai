export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'super_admin' | 'admin' | 'member' | 'volunteer';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed';
export type AnnouncementPriority = 'normal' | 'urgent';
export type MediaType = 'image' | 'video';
export type GalleryCategory = 'winners' | 'previous_events' | 'workshops' | 'general';

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: UserRole;
          dept_id: string | null;
          phone: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role?: UserRole;
          dept_id?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: UserRole;
          dept_id?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          performed_by_id: string | null;
          performed_by_email: string;
          target_user_id: string | null;
          target_user_email: string;
          previous_role: string;
          new_role: string;
          action_type: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          performed_by_id?: string | null;
          performed_by_email: string;
          target_user_id?: string | null;
          target_user_email: string;
          previous_role: string;
          new_role: string;
          action_type: string;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          performed_by_id?: string | null;
          performed_by_email?: string;
          target_user_id?: string | null;
          target_user_email?: string;
          previous_role?: string;
          new_role?: string;
          action_type?: string;
          details?: Json;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          date_time: string;
          venue: string;
          poster_url: string | null;
          max_capacity: number;
          status: EventStatus;
          registration_deadline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: string;
          date_time: string;
          venue: string;
          poster_url?: string | null;
          max_capacity?: number;
          status?: EventStatus;
          registration_deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          date_time?: string;
          venue?: string;
          poster_url?: string | null;
          max_capacity?: number;
          status?: EventStatus;
          registration_deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      registrations: {
        Row: {
          id: string;
          event_id: string;
          student_name: string;
          student_email: string;
          student_phone: string;
          registered_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          student_name: string;
          student_email: string;
          student_phone: string;
          registered_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          student_name?: string;
          student_email?: string;
          student_phone?: string;
          registered_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          priority: AnnouncementPriority;
          is_emergency: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          priority?: AnnouncementPriority;
          is_emergency?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          priority?: AnnouncementPriority;
          is_emergency?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      gallery: {
        Row: {
          id: string;
          title: string;
          media_url: string;
          media_type: MediaType;
          category: GalleryCategory;
          event_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          media_url: string;
          media_type?: MediaType;
          category?: GalleryCategory;
          event_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          media_url?: string;
          media_type?: MediaType;
          category?: GalleryCategory;
          event_id?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_team_member: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      transfer_super_admin_rpc: {
        Args: {
          target_user_id: string;
          actor_id: string;
          actor_email: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      user_role: UserRole;
      event_status: EventStatus;
      announcement_priority: AnnouncementPriority;
      media_type: MediaType;
      gallery_category: GalleryCategory;
    };
  };
}
