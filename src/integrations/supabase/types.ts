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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          id: string
          run_id: string
          timestamp: string
          user_id: string
          user_name: string
        }
        Insert: {
          action: string
          id?: string
          run_id: string
          timestamp?: string
          user_id: string
          user_name: string
        }
        Update: {
          action?: string
          id?: string
          run_id?: string
          timestamp?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "process_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link_id: string | null
          link_type: string | null
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          read: boolean | null
          title: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          link_id?: string | null
          link_type?: string | null
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          read?: boolean | null
          title: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          link_id?: string | null
          link_type?: string | null
          message?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          read?: boolean | null
          title?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      process_definitions: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          is_public: boolean | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_definitions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      process_runs: {
        Row: {
          completed_at: string | null
          completed_step_ids: string[] | null
          created_at: string
          due_at: string | null
          health_score: number | null
          id: string
          last_interaction_at: string | null
          process_id: string
          run_name: string
          started_at: string
          started_by: string | null
          started_by_name: string | null
          status: Database["public"]["Enums"]["run_status"]
          step_values: Json | null
          updated_at: string
          validated_at: string | null
          validator_user_id: string | null
          version_id: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_step_ids?: string[] | null
          created_at?: string
          due_at?: string | null
          health_score?: number | null
          id?: string
          last_interaction_at?: string | null
          process_id: string
          run_name: string
          started_at?: string
          started_by?: string | null
          started_by_name?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          step_values?: Json | null
          updated_at?: string
          validated_at?: string | null
          validator_user_id?: string | null
          version_id: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          completed_step_ids?: string[] | null
          created_at?: string
          due_at?: string | null
          health_score?: number | null
          id?: string
          last_interaction_at?: string | null
          process_id?: string
          run_name?: string
          started_at?: string
          started_by?: string | null
          started_by_name?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          step_values?: Json | null
          updated_at?: string
          validated_at?: string | null
          validator_user_id?: string | null
          version_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_runs_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "process_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_runs_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "process_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      process_steps: {
        Row: {
          assigned_job_title: string | null
          assigned_job_titles: string[] | null
          assigned_team_ids: string[] | null
          assigned_user_id: string | null
          assigned_user_ids: string[] | null
          created_at: string
          id: string
          input_type: Database["public"]["Enums"]["step_type"]
          order_index: number
          required: boolean | null
          style: Json | null
          text: string
          updated_at: string
          version_id: string
        }
        Insert: {
          assigned_job_title?: string | null
          assigned_job_titles?: string[] | null
          assigned_team_ids?: string[] | null
          assigned_user_id?: string | null
          assigned_user_ids?: string[] | null
          created_at?: string
          id?: string
          input_type?: Database["public"]["Enums"]["step_type"]
          order_index: number
          required?: boolean | null
          style?: Json | null
          text: string
          updated_at?: string
          version_id: string
        }
        Update: {
          assigned_job_title?: string | null
          assigned_job_titles?: string[] | null
          assigned_team_ids?: string[] | null
          assigned_user_id?: string | null
          assigned_user_ids?: string[] | null
          created_at?: string
          id?: string
          input_type?: Database["public"]["Enums"]["step_type"]
          order_index?: number
          required?: boolean | null
          style?: Json | null
          text?: string
          updated_at?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_steps_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "process_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      process_versions: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_name: string | null
          description: string | null
          editor_job_title: string | null
          editor_team_id: string | null
          editor_user_id: string | null
          estimated_duration_days: number | null
          executor_job_title: string | null
          executor_team_id: string | null
          executor_user_id: string | null
          id: string
          last_reviewed_at: string | null
          last_reviewed_by: string | null
          process_id: string
          published_at: string | null
          published_by: string | null
          publisher_job_title: string | null
          publisher_team_id: string | null
          publisher_user_id: string | null
          review_due_lead_days: number | null
          review_frequency_days: number | null
          run_validator_job_title: string | null
          run_validator_team_id: string | null
          run_validator_user_id: string | null
          sequential_execution: boolean | null
          status: Database["public"]["Enums"]["version_status"]
          updated_at: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          editor_job_title?: string | null
          editor_team_id?: string | null
          editor_user_id?: string | null
          estimated_duration_days?: number | null
          executor_job_title?: string | null
          executor_team_id?: string | null
          executor_user_id?: string | null
          id?: string
          last_reviewed_at?: string | null
          last_reviewed_by?: string | null
          process_id: string
          published_at?: string | null
          published_by?: string | null
          publisher_job_title?: string | null
          publisher_team_id?: string | null
          publisher_user_id?: string | null
          review_due_lead_days?: number | null
          review_frequency_days?: number | null
          run_validator_job_title?: string | null
          run_validator_team_id?: string | null
          run_validator_user_id?: string | null
          sequential_execution?: boolean | null
          status?: Database["public"]["Enums"]["version_status"]
          updated_at?: string
          version_number?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          editor_job_title?: string | null
          editor_team_id?: string | null
          editor_user_id?: string | null
          estimated_duration_days?: number | null
          executor_job_title?: string | null
          executor_team_id?: string | null
          executor_user_id?: string | null
          id?: string
          last_reviewed_at?: string | null
          last_reviewed_by?: string | null
          process_id?: string
          published_at?: string | null
          published_by?: string | null
          publisher_job_title?: string | null
          publisher_team_id?: string | null
          publisher_user_id?: string | null
          review_due_lead_days?: number | null
          review_frequency_days?: number | null
          run_validator_job_title?: string | null
          run_validator_team_id?: string | null
          run_validator_user_id?: string | null
          sequential_execution?: boolean | null
          status?: Database["public"]["Enums"]["version_status"]
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "process_versions_editor_team_id_fkey"
            columns: ["editor_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_versions_executor_team_id_fkey"
            columns: ["executor_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_versions_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "process_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_versions_publisher_team_id_fkey"
            columns: ["publisher_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_versions_run_validator_team_id_fkey"
            columns: ["run_validator_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          job_title: string | null
          last_name: string
          permissions: Json | null
          status: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name: string
          id: string
          job_title?: string | null
          last_name: string
          permissions?: Json | null
          status?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          job_title?: string | null
          last_name?: string
          permissions?: Json | null
          status?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      step_feedback: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          resolved: boolean | null
          run_id: string
          step_id: string
          text: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          feedback_type: string
          id?: string
          resolved?: boolean | null
          run_id: string
          step_id: string
          text: string
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          resolved?: boolean | null
          run_id?: string
          step_id?: string
          text?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_feedback_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "process_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_feedback_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "process_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_job_title: string | null
          assignee_team_id: string | null
          assignee_user_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          run_id: string
          status: Database["public"]["Enums"]["task_status"]
          step_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assignee_job_title?: string | null
          assignee_team_id?: string | null
          assignee_user_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          run_id: string
          status?: Database["public"]["Enums"]["task_status"]
          step_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assignee_job_title?: string | null
          assignee_team_id?: string | null
          assignee_user_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          run_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          step_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_team_id_fkey"
            columns: ["assignee_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "process_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "process_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          created_at: string
          id: string
          role: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: Database["public"]["Enums"]["team_color"] | null
          created_at: string
          description: string | null
          id: string
          lead_user_id: string | null
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          color?: Database["public"]["Enums"]["team_color"] | null
          created_at?: string
          description?: string | null
          id?: string
          lead_user_id?: string | null
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          color?: Database["public"]["Enums"]["team_color"] | null
          created_at?: string
          description?: string | null
          id?: string
          lead_user_id?: string | null
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_lead_user_id_fkey"
            columns: ["lead_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_workspace: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
          _workspace_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "member"
      notification_type:
        | "TASK_ASSIGNED"
        | "REVIEW_REQUIRED"
        | "PROCESS_OUTDATED"
        | "VERSION_PUBLISHED"
        | "RUN_BLOCKED"
        | "MENTION"
        | "SLA_BREACH"
        | "STALE_RUN"
      run_status:
        | "NOT_STARTED"
        | "IN_PROGRESS"
        | "READY_TO_SUBMIT"
        | "IN_REVIEW"
        | "APPROVED"
        | "REJECTED"
        | "CANCELLED"
        | "PENDING_VALIDATION"
        | "COMPLETED"
      step_type: "CHECKBOX" | "TEXT_INPUT" | "FILE_UPLOAD" | "INFO"
      task_status: "OPEN" | "DONE"
      team_color:
        | "indigo"
        | "emerald"
        | "amber"
        | "slate"
        | "pink"
        | "blue"
        | "purple"
        | "gray"
        | "red"
        | "cyan"
      version_status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED"
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
      app_role: ["admin", "manager", "member"],
      notification_type: [
        "TASK_ASSIGNED",
        "REVIEW_REQUIRED",
        "PROCESS_OUTDATED",
        "VERSION_PUBLISHED",
        "RUN_BLOCKED",
        "MENTION",
        "SLA_BREACH",
        "STALE_RUN",
      ],
      run_status: [
        "NOT_STARTED",
        "IN_PROGRESS",
        "READY_TO_SUBMIT",
        "IN_REVIEW",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
        "PENDING_VALIDATION",
        "COMPLETED",
      ],
      step_type: ["CHECKBOX", "TEXT_INPUT", "FILE_UPLOAD", "INFO"],
      task_status: ["OPEN", "DONE"],
      team_color: [
        "indigo",
        "emerald",
        "amber",
        "slate",
        "pink",
        "blue",
        "purple",
        "gray",
        "red",
        "cyan",
      ],
      version_status: ["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"],
    },
  },
} as const
