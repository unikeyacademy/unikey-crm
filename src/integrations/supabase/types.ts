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
      co_consultant_hours: {
        Row: {
          co_consultant_profile_id: string | null
          consultant_id: string
          created_at: string
          description: string | null
          hourly_rate: number
          hours: number
          id: string
          student_id: string
          updated_at: string
          work_date: string
        }
        Insert: {
          co_consultant_profile_id?: string | null
          consultant_id: string
          created_at?: string
          description?: string | null
          hourly_rate?: number
          hours: number
          id?: string
          student_id: string
          updated_at?: string
          work_date?: string
        }
        Update: {
          co_consultant_profile_id?: string | null
          consultant_id?: string
          created_at?: string
          description?: string | null
          hourly_rate?: number
          hours?: number
          id?: string
          student_id?: string
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "co_consultant_hours_co_consultant_profile_id_fkey"
            columns: ["co_consultant_profile_id"]
            isOneToOne: false
            referencedRelation: "co_consultant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_consultant_hours_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_consultant_hours_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      co_consultant_profiles: {
        Row: {
          bank_details: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          default_hourly_rate: number
          email: string
          full_name: string
          id: string
          is_active: boolean
          notes: string | null
          payment_terms: string | null
          phone: string | null
          specialisation: string | null
          updated_at: string
        }
        Insert: {
          bank_details?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          default_hourly_rate?: number
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          specialisation?: string | null
          updated_at?: string
        }
        Update: {
          bank_details?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          default_hourly_rate?: number
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          specialisation?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      consultations: {
        Row: {
          action_items: string[] | null
          attendees: string[] | null
          consultant_id: string
          consultation_date: string
          consultation_type: string
          created_at: string
          duration_minutes: number | null
          google_calendar_event_id: string | null
          id: string
          key_decisions: string | null
          meeting_link: string | null
          next_steps: string | null
          notes: string | null
          student_id: string
          topics_discussed: string[] | null
          updated_at: string
        }
        Insert: {
          action_items?: string[] | null
          attendees?: string[] | null
          consultant_id: string
          consultation_date: string
          consultation_type: string
          created_at?: string
          duration_minutes?: number | null
          google_calendar_event_id?: string | null
          id?: string
          key_decisions?: string | null
          meeting_link?: string | null
          next_steps?: string | null
          notes?: string | null
          student_id: string
          topics_discussed?: string[] | null
          updated_at?: string
        }
        Update: {
          action_items?: string[] | null
          attendees?: string[] | null
          consultant_id?: string
          consultation_date?: string
          consultation_type?: string
          created_at?: string
          duration_minutes?: number | null
          google_calendar_event_id?: string | null
          id?: string
          key_decisions?: string | null
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
      eca_opportunities: {
        Row: {
          best_for: string[] | null
          cost: string | null
          created_at: string
          created_by: string | null
          deadline_date: string | null
          deadline_type: string | null
          eligibility: string | null
          id: string
          internal_notes: string | null
          is_active: boolean | null
          is_recommended: boolean | null
          name: string
          past_success_notes: string | null
          prestige_level: string | null
          registration_fee: string | null
          required_documents: string[] | null
          subject_areas: string[]
          time_commitment: string | null
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          best_for?: string[] | null
          cost?: string | null
          created_at?: string
          created_by?: string | null
          deadline_date?: string | null
          deadline_type?: string | null
          eligibility?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean | null
          is_recommended?: boolean | null
          name: string
          past_success_notes?: string | null
          prestige_level?: string | null
          registration_fee?: string | null
          required_documents?: string[] | null
          subject_areas?: string[]
          time_commitment?: string | null
          type: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          best_for?: string[] | null
          cost?: string | null
          created_at?: string
          created_by?: string | null
          deadline_date?: string | null
          deadline_type?: string | null
          eligibility?: string | null
          id?: string
          internal_notes?: string | null
          is_active?: boolean | null
          is_recommended?: boolean | null
          name?: string
          past_success_notes?: string | null
          prestige_level?: string | null
          registration_fee?: string | null
          required_documents?: string[] | null
          subject_areas?: string[]
          time_commitment?: string | null
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
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
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          invoice_ref: string | null
          notes: string | null
          package_id: string
          payment_date: string
          payment_method: string | null
          payment_type: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          invoice_ref?: string | null
          notes?: string | null
          package_id: string
          payment_date?: string
          payment_method?: string | null
          payment_type?: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_ref?: string | null
          notes?: string | null
          package_id?: string
          payment_date?: string
          payment_method?: string | null
          payment_type?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "student_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
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
          awards: string | null
          completion_percentage: number | null
          created_at: string
          description: string | null
          eca_name: string
          eca_type: string
          end_date: string | null
          id: string
          impact: string | null
          lead_consultant_id: string | null
          link: string | null
          milestones: Json | null
          objectives: string | null
          outcomes: string | null
          primary_category: string | null
          reference_mentor: string | null
          role: string | null
          secondary_category: string | null
          start_date: string | null
          status: string | null
          student_id: string
          time_commitment: string | null
          updated_at: string
        }
        Insert: {
          awards?: string | null
          completion_percentage?: number | null
          created_at?: string
          description?: string | null
          eca_name: string
          eca_type: string
          end_date?: string | null
          id?: string
          impact?: string | null
          lead_consultant_id?: string | null
          link?: string | null
          milestones?: Json | null
          objectives?: string | null
          outcomes?: string | null
          primary_category?: string | null
          reference_mentor?: string | null
          role?: string | null
          secondary_category?: string | null
          start_date?: string | null
          status?: string | null
          student_id: string
          time_commitment?: string | null
          updated_at?: string
        }
        Update: {
          awards?: string | null
          completion_percentage?: number | null
          created_at?: string
          description?: string | null
          eca_name?: string
          eca_type?: string
          end_date?: string | null
          id?: string
          impact?: string | null
          lead_consultant_id?: string | null
          link?: string | null
          milestones?: Json | null
          objectives?: string | null
          outcomes?: string | null
          primary_category?: string | null
          reference_mentor?: string | null
          role?: string | null
          secondary_category?: string | null
          start_date?: string | null
          status?: string | null
          student_id?: string
          time_commitment?: string | null
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
      student_essays: {
        Row: {
          created_at: string
          essay_region: string
          essay_type: string
          google_doc_link: string | null
          id: string
          last_updated_date: string | null
          notes: string | null
          owner: string | null
          status: string
          student_id: string
          title: string | null
          university_target_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          essay_region: string
          essay_type: string
          google_doc_link?: string | null
          id?: string
          last_updated_date?: string | null
          notes?: string | null
          owner?: string | null
          status?: string
          student_id: string
          title?: string | null
          university_target_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          essay_region?: string
          essay_type?: string
          google_doc_link?: string | null
          id?: string
          last_updated_date?: string | null
          notes?: string | null
          owner?: string | null
          status?: string
          student_id?: string
          title?: string | null
          university_target_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_essays_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_essays_university_target_id_fkey"
            columns: ["university_target_id"]
            isOneToOne: false
            referencedRelation: "student_university_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      student_interviews: {
        Row: {
          created_at: string
          id: string
          interview_date: string | null
          interview_type: string
          post_interview_notes: string | null
          prep_session_dates: string[] | null
          student_id: string
          tutor_names: string[] | null
          university_name: string
          university_target_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          interview_date?: string | null
          interview_type: string
          post_interview_notes?: string | null
          prep_session_dates?: string[] | null
          student_id: string
          tutor_names?: string[] | null
          university_name: string
          university_target_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          interview_date?: string | null
          interview_type?: string
          post_interview_notes?: string | null
          prep_session_dates?: string[] | null
          student_id?: string
          tutor_names?: string[] | null
          university_name?: string
          university_target_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_interviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_interviews_university_target_id_fkey"
            columns: ["university_target_id"]
            isOneToOne: false
            referencedRelation: "student_university_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      student_packages: {
        Row: {
          contract_type: string | null
          created_at: string
          currency: string
          end_date: string | null
          id: string
          notes: string | null
          package_name: string
          package_type: string
          price: number
          start_date: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          contract_type?: string | null
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          package_name: string
          package_type: string
          price?: number
          start_date?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          contract_type?: string | null
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          package_name?: string
          package_type?: string
          price?: number
          start_date?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_packages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_test_scores: {
        Row: {
          created_at: string
          id: string
          next_planned_date: string | null
          notes: string | null
          score: string
          student_id: string
          test_category: string
          test_date: string | null
          test_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_planned_date?: string | null
          notes?: string | null
          score: string
          student_id: string
          test_category: string
          test_date?: string | null
          test_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          next_planned_date?: string | null
          notes?: string | null
          score?: string
          student_id?: string
          test_category?: string
          test_date?: string | null
          test_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_test_scores_student_id_fkey"
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
          clearing_shortlist: boolean | null
          country: string | null
          created_at: string
          deadline_date: string | null
          enrolment_intention: string | null
          firm_choice: boolean | null
          id: string
          insurance_choice: boolean | null
          matriculation_confirmed: boolean | null
          notes: string | null
          offer_conditions: string | null
          priority: string | null
          program: string | null
          round: string | null
          status: string | null
          student_id: string
          tasks_generated: boolean | null
          university_name: string
          updated_at: string
          waitlist_plan_status: string | null
        }
        Insert: {
          application_system?: string | null
          clearing_shortlist?: boolean | null
          country?: string | null
          created_at?: string
          deadline_date?: string | null
          enrolment_intention?: string | null
          firm_choice?: boolean | null
          id?: string
          insurance_choice?: boolean | null
          matriculation_confirmed?: boolean | null
          notes?: string | null
          offer_conditions?: string | null
          priority?: string | null
          program?: string | null
          round?: string | null
          status?: string | null
          student_id: string
          tasks_generated?: boolean | null
          university_name: string
          updated_at?: string
          waitlist_plan_status?: string | null
        }
        Update: {
          application_system?: string | null
          clearing_shortlist?: boolean | null
          country?: string | null
          created_at?: string
          deadline_date?: string | null
          enrolment_intention?: string | null
          firm_choice?: boolean | null
          id?: string
          insurance_choice?: boolean | null
          matriculation_confirmed?: boolean | null
          notes?: string | null
          offer_conditions?: string | null
          priority?: string | null
          program?: string | null
          round?: string | null
          status?: string | null
          student_id?: string
          tasks_generated?: boolean | null
          university_name?: string
          updated_at?: string
          waitlist_plan_status?: string | null
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
          academic_strengths: string | null
          academic_weaknesses: string | null
          application_cycle: string | null
          assigned_consultant_id: string | null
          city: string | null
          consultation_programme: string | null
          contract_signed_date: string | null
          created_at: string
          current_gpa: string | null
          current_school: string | null
          current_stage: string | null
          curriculum: string | null
          date_of_birth: string | null
          email: string | null
          engagement_stage: string | null
          first_name: string
          gender: string | null
          google_drive_folder_url: string | null
          grade_level: number | null
          graduation_year: number | null
          ib_predicted_grade: number | null
          id: string
          last_name: string
          lead_source: string | null
          notes: string | null
          parent_email: string | null
          parent_names: string | null
          parent_phone: string | null
          passport_nationality: string | null
          phone: string | null
          preferred_name: string | null
          quotation: string | null
          region_interest: string[] | null
          risk_profile: string | null
          secondary_consultant_id: string | null
          secondary_tutor: string | null
          stage_history: Json | null
          status: string | null
          student_id: string
          subject_choices: Json | null
          tags: string[] | null
          target_major_primary: string | null
          target_major_secondary: string | null
          timezone: string | null
          track: string | null
          tutor_in_charge: string | null
          updated_at: string
        }
        Insert: {
          academic_interests?: string[] | null
          academic_strengths?: string | null
          academic_weaknesses?: string | null
          application_cycle?: string | null
          assigned_consultant_id?: string | null
          city?: string | null
          consultation_programme?: string | null
          contract_signed_date?: string | null
          created_at?: string
          current_gpa?: string | null
          current_school?: string | null
          current_stage?: string | null
          curriculum?: string | null
          date_of_birth?: string | null
          email?: string | null
          engagement_stage?: string | null
          first_name: string
          gender?: string | null
          google_drive_folder_url?: string | null
          grade_level?: number | null
          graduation_year?: number | null
          ib_predicted_grade?: number | null
          id?: string
          last_name: string
          lead_source?: string | null
          notes?: string | null
          parent_email?: string | null
          parent_names?: string | null
          parent_phone?: string | null
          passport_nationality?: string | null
          phone?: string | null
          preferred_name?: string | null
          quotation?: string | null
          region_interest?: string[] | null
          risk_profile?: string | null
          secondary_consultant_id?: string | null
          secondary_tutor?: string | null
          stage_history?: Json | null
          status?: string | null
          student_id: string
          subject_choices?: Json | null
          tags?: string[] | null
          target_major_primary?: string | null
          target_major_secondary?: string | null
          timezone?: string | null
          track?: string | null
          tutor_in_charge?: string | null
          updated_at?: string
        }
        Update: {
          academic_interests?: string[] | null
          academic_strengths?: string | null
          academic_weaknesses?: string | null
          application_cycle?: string | null
          assigned_consultant_id?: string | null
          city?: string | null
          consultation_programme?: string | null
          contract_signed_date?: string | null
          created_at?: string
          current_gpa?: string | null
          current_school?: string | null
          current_stage?: string | null
          curriculum?: string | null
          date_of_birth?: string | null
          email?: string | null
          engagement_stage?: string | null
          first_name?: string
          gender?: string | null
          google_drive_folder_url?: string | null
          grade_level?: number | null
          graduation_year?: number | null
          ib_predicted_grade?: number | null
          id?: string
          last_name?: string
          lead_source?: string | null
          notes?: string | null
          parent_email?: string | null
          parent_names?: string | null
          parent_phone?: string | null
          passport_nationality?: string | null
          phone?: string | null
          preferred_name?: string | null
          quotation?: string | null
          region_interest?: string[] | null
          risk_profile?: string | null
          secondary_consultant_id?: string | null
          secondary_tutor?: string | null
          stage_history?: Json | null
          status?: string | null
          student_id?: string
          subject_choices?: Json | null
          tags?: string[] | null
          target_major_primary?: string | null
          target_major_secondary?: string | null
          timezone?: string | null
          track?: string | null
          tutor_in_charge?: string | null
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
