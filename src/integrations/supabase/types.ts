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
      ad_hoc_requests: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          related_task_id: string | null
          request_type: string
          resolution_notes: string | null
          status: string | null
          student_id: string | null
          submitted_by: string
          submitted_by_email: string | null
          submitted_by_name: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_task_id?: string | null
          request_type: string
          resolution_notes?: string | null
          status?: string | null
          student_id?: string | null
          submitted_by: string
          submitted_by_email?: string | null
          submitted_by_name?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_task_id?: string | null
          request_type?: string
          resolution_notes?: string | null
          status?: string | null
          student_id?: string | null
          submitted_by?: string
          submitted_by_email?: string | null
          submitted_by_name?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_hoc_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_hoc_requests_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_hoc_requests_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_hoc_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      application_checklists: {
        Row: {
          checklist_name: string
          created_at: string
          description: string | null
          id: string
          student_id: string
          university_target_id: string | null
          updated_at: string
        }
        Insert: {
          checklist_name: string
          created_at?: string
          description?: string | null
          id?: string
          student_id: string
          university_target_id?: string | null
          updated_at?: string
        }
        Update: {
          checklist_name?: string
          created_at?: string
          description?: string | null
          id?: string
          student_id?: string
          university_target_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_checklists_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_checklists_university_target_id_fkey"
            columns: ["university_target_id"]
            isOneToOne: false
            referencedRelation: "student_university_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          checklist_id: string
          completed_by: string | null
          completed_date: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          item_name: string
          order_index: number | null
          priority: string | null
          updated_at: string
        }
        Insert: {
          checklist_id: string
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          item_name: string
          order_index?: number | null
          priority?: string | null
          updated_at?: string
        }
        Update: {
          checklist_id?: string
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          item_name?: string
          order_index?: number | null
          priority?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "application_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          application_system: string
          created_at: string
          description: string | null
          id: string
          items: Json
          template_name: string
          updated_at: string
        }
        Insert: {
          application_system: string
          created_at?: string
          description?: string | null
          id?: string
          items?: Json
          template_name: string
          updated_at?: string
        }
        Update: {
          application_system?: string
          created_at?: string
          description?: string | null
          id?: string
          items?: Json
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultations: {
        Row: {
          action_items: string[] | null
          consultant_id: string
          consultation_date: string
          consultation_type: string
          created_at: string
          duration_minutes: number | null
          google_calendar_event_id: string | null
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
          google_calendar_event_id?: string | null
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
          google_calendar_event_id?: string | null
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
      email_logs: {
        Row: {
          body: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string
          sent_by: string
          status: string | null
          student_id: string | null
          subject: string
          template_id: string | null
        }
        Insert: {
          body: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string
          sent_by: string
          status?: string | null
          student_id?: string | null
          subject: string
          template_id?: string | null
        }
        Update: {
          body?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string
          sent_by?: string
          status?: string | null
          student_id?: string | null
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_schedules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          send_to_parent: boolean | null
          send_to_student: boolean | null
          template_id: string | null
          trigger_days_before: number | null
          trigger_stage: string | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          send_to_parent?: boolean | null
          send_to_student?: boolean | null
          template_id?: string | null
          trigger_days_before?: number | null
          trigger_stage?: string | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          send_to_parent?: boolean | null
          send_to_student?: boolean | null
          template_id?: string | null
          trigger_days_before?: number | null
          trigger_stage?: string | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_schedules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string
          id: string
          merge_fields: Json | null
          subject: string
          template_name: string
          template_type: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          id?: string
          merge_fields?: Json | null
          subject: string
          template_name: string
          template_type: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          merge_fields?: Json | null
          subject?: string
          template_name?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
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
      parent_communications_log: {
        Row: {
          communication_type: string
          content: string | null
          created_at: string
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          recipient: string
          sent_at: string
          sent_by: string
          student_id: string
          subject: string | null
        }
        Insert: {
          communication_type: string
          content?: string | null
          created_at?: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          recipient: string
          sent_at?: string
          sent_by: string
          student_id: string
          subject?: string | null
        }
        Update: {
          communication_type?: string
          content?: string | null
          created_at?: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          recipient?: string
          sent_at?: string
          sent_by?: string
          student_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_communications_log_student_id_fkey"
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
          google_access_token: string | null
          google_refresh_token: string | null
          google_token_expires_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_emails: {
        Row: {
          created_at: string | null
          email_log_id: string | null
          email_schedule_id: string | null
          error_message: string | null
          id: string
          scheduled_for: string
          sent_at: string | null
          status: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_log_id?: string | null
          email_schedule_id?: string | null
          error_message?: string | null
          id?: string
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_log_id?: string | null
          email_schedule_id?: string | null
          error_message?: string | null
          id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_emails_email_log_id_fkey"
            columns: ["email_log_id"]
            isOneToOne: false
            referencedRelation: "email_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_emails_email_schedule_id_fkey"
            columns: ["email_schedule_id"]
            isOneToOne: false
            referencedRelation: "email_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_emails_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string
          file_path: string
          file_size: number | null
          id: string
          notes: string | null
          student_id: string
          updated_at: string
          upload_date: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type: string
          file_path: string
          file_size?: number | null
          id?: string
          notes?: string | null
          student_id: string
          updated_at?: string
          upload_date?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string
          file_path?: string
          file_size?: number | null
          id?: string
          notes?: string | null
          student_id?: string
          updated_at?: string
          upload_date?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
          tasks_generated: boolean | null
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
          tasks_generated?: boolean | null
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
          tasks_generated?: boolean | null
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
          curriculum: string | null
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
          quotation: string | null
          region_interest: string[] | null
          stage_history: Json | null
          status: string | null
          student_id: string
          subject_choices: Json | null
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
          curriculum?: string | null
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
          quotation?: string | null
          region_interest?: string[] | null
          stage_history?: Json | null
          status?: string | null
          student_id: string
          subject_choices?: Json | null
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
          curriculum?: string | null
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
          quotation?: string | null
          region_interest?: string[] | null
          stage_history?: Json | null
          status?: string | null
          student_id?: string
          subject_choices?: Json | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      task_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          stage: string | null
          tasks: Json
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          stage?: string | null
          tasks?: Json
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          stage?: string | null
          tasks?: Json
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      university_deadline_templates: {
        Row: {
          application_system: string | null
          created_at: string
          id: string
          milestone_tasks: Json
          template_name: string
        }
        Insert: {
          application_system?: string | null
          created_at?: string
          id?: string
          milestone_tasks?: Json
          template_name: string
        }
        Update: {
          application_system?: string | null
          created_at?: string
          id?: string
          milestone_tasks?: Json
          template_name?: string
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
