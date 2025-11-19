export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      consultations: {
        Row: {
          action_items: string[] | null
          consultant_id: string
          consultation_date: string
          consultation_type: string
          created_at: string
          duration_minutes: number | null
          id: string
          meeting_link: string | null
          next_steps: string | null
          notes: string | null
          student_id: string
          topics_discussed: string[] | null
          updated_at: string
        }
        Insert: {
          action_items?: string[] | null
          consultant_id: string
          consultation_date: string
          consultation_type: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          next_steps?: string | null
          notes?: string | null
          student_id: string
          topics_discussed?: string[] | null
          updated_at?: string
        }
        Update: {
          action_items?: string[] | null
          consultant_id?: string
          consultation_date?: string
          consultation_type?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          next_steps?: string | null
          notes?: string | null
          student_id?: string
          topics_discussed?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_communications: {
        Row: {
          communication_date: string
          communication_type: string
          consultant_id: string
          created_at: string
          follow_up_required: boolean | null
          id: string
          notes: string | null
          student_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          communication_date: string
          communication_type: string
          consultant_id: string
          created_at?: string
          follow_up_required?: boolean | null
          id?: string
          notes?: string | null
          student_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          communication_date?: string
          communication_type?: string
          consultant_id?: string
          created_at?: string
          follow_up_required?: boolean | null
          id?: string
          notes?: string | null
          student_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_communications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      student_ecas: {
        Row: {
          completion_percentage: number | null
          created_at: string
          description: string | null
          eca_name: string
          eca_type: string
          end_date: string | null
          id: string
          lead_consultant_id: string | null
          milestones: Json | null
          objectives: string | null
          outcomes: string | null
          start_date: string | null
          status: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string
          description?: string | null
          eca_name: string
          eca_type: string
          end_date?: string | null
          id?: string
          lead_consultant_id?: string | null
          milestones?: Json | null
          objectives?: string | null
          outcomes?: string | null
          start_date?: string | null
          status?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string
          description?: string | null
          eca_name?: string
          eca_type?: string
          end_date?: string | null
          id?: string
          lead_consultant_id?: string | null
          milestones?: Json | null
          objectives?: string | null
          outcomes?: string | null
          start_date?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_ecas_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_university_targets: {
        Row: {
          application_system: string | null
          country: string | null
          created_at: string
          deadline_date: string | null
          id: string
          notes: string | null
          priority: string | null
          program: string | null
          status: string | null
          student_id: string
          university_name: string
          updated_at: string
        }
        Insert: {
          application_system?: string | null
          country?: string | null
          created_at?: string
          deadline_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          program?: string | null
          status?: string | null
          student_id: string
          university_name: string
          updated_at?: string
        }
        Update: {
          application_system?: string | null
          country?: string | null
          created_at?: string
          deadline_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          program?: string | null
          status?: string | null
          student_id?: string
          university_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_university_targets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_interests: string[] | null
          application_cycle: string | null
          assigned_consultant_id: string | null
          contract_signed_date: string | null
          created_at: string
          current_school: string | null
          current_stage: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          gender: string | null
          grade_level: number | null
          ib_predicted_grade: number | null
          id: string
          last_name: string
          notes: string | null
          parent_email: string | null
          parent_names: string | null
          parent_phone: string | null
          phone: string | null
          preferred_name: string | null
          region_interest: string[] | null
          status: string | null
          student_id: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          academic_interests?: string[] | null
          application_cycle?: string | null
          assigned_consultant_id?: string | null
          contract_signed_date?: string | null
          created_at?: string
          current_school?: string | null
          current_stage?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          grade_level?: number | null
          ib_predicted_grade?: number | null
          id?: string
          last_name: string
          notes?: string | null
          parent_email?: string | null
          parent_names?: string | null
          parent_phone?: string | null
          phone?: string | null
          preferred_name?: string | null
          region_interest?: string[] | null
          status?: string | null
          student_id: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          academic_interests?: string[] | null
          application_cycle?: string | null
          assigned_consultant_id?: string | null
          contract_signed_date?: string | null
          created_at?: string
          current_school?: string | null
          current_stage?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          grade_level?: number | null
          ib_predicted_grade?: number | null
          id?: string
          last_name?: string
          notes?: string | null
          parent_email?: string | null
          parent_names?: string | null
          parent_phone?: string | null
          phone?: string | null
          preferred_name?: string | null
          region_interest?: string[] | null
          status?: string | null
          student_id?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          related_consultation_id: string | null
          status: string | null
          student_id: string | null
          task_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_consultation_id?: string | null
          status?: string | null
          student_id?: string | null
          task_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_consultation_id?: string | null
          status?: string | null
          student_id?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_related_consultation_id_fkey"
            columns: ["related_consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "consultant" | "viewer"
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
      app_role: ["admin", "consultant", "viewer"],
    },
  },
} as const
