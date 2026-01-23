-- =====================================================
-- PROCESSOS: Production-Ready Database Schema
-- =====================================================

-- 1. ENUM TYPES
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'member');
CREATE TYPE public.version_status AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE public.run_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'READY_TO_SUBMIT', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'PENDING_VALIDATION', 'COMPLETED');
CREATE TYPE public.step_type AS ENUM ('CHECKBOX', 'TEXT_INPUT', 'FILE_UPLOAD', 'INFO');
CREATE TYPE public.task_status AS ENUM ('OPEN', 'DONE');
CREATE TYPE public.notification_type AS ENUM ('TASK_ASSIGNED', 'REVIEW_REQUIRED', 'PROCESS_OUTDATED', 'VERSION_PUBLISHED', 'RUN_BLOCKED', 'MENTION', 'SLA_BREACH', 'STALE_RUN');
CREATE TYPE public.team_color AS ENUM ('indigo', 'emerald', 'amber', 'slate', 'pink', 'blue', 'purple', 'gray', 'red', 'cyan');

-- 2. BASE TABLES
-- =====================================================

-- Workspaces (Multi-tenant isolation)
CREATE TABLE public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    settings JSONB DEFAULT '{"default_review_frequency_days": 180, "default_review_due_lead_days": 30}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teams within a workspace
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color public.team_color DEFAULT 'slate',
    lead_user_id UUID, -- Will be FK'd after profiles table
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, name)
);

-- User Profiles (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    job_title TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    permissions JSONB DEFAULT '{"canDesign": false, "canVerifyDesign": false, "canExecute": true, "canVerifyRun": false, "canManageTeam": false, "canAccessBilling": false}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK for team lead after profiles exists
ALTER TABLE public.teams ADD CONSTRAINT teams_lead_user_id_fkey 
    FOREIGN KEY (lead_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- User Roles (separate table for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, workspace_id)
);

-- Team Memberships
CREATE TABLE public.team_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'lead')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(team_id, user_id)
);

-- 3. PROCESS DEFINITIONS
-- =====================================================

-- Process Definition Root (represents a process family)
CREATE TABLE public.process_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Process Definition Versions
CREATE TABLE public.process_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id UUID NOT NULL REFERENCES public.process_definitions(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    status public.version_status NOT NULL DEFAULT 'DRAFT',
    description TEXT,
    
    -- Governance: Who can edit/publish/validate
    editor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    editor_job_title TEXT,
    editor_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    
    publisher_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    publisher_job_title TEXT,
    publisher_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    
    executor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    executor_job_title TEXT,
    executor_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    
    run_validator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    run_validator_job_title TEXT,
    run_validator_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    
    -- Review tracking
    review_frequency_days INTEGER DEFAULT 180,
    review_due_lead_days INTEGER DEFAULT 30,
    last_reviewed_at TIMESTAMPTZ,
    last_reviewed_by TEXT,
    
    -- Execution settings
    sequential_execution BOOLEAN DEFAULT false,
    estimated_duration_days INTEGER,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by_name TEXT,
    published_at TIMESTAMPTZ,
    published_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(process_id, version_number)
);

-- Process Steps (within a version)
CREATE TABLE public.process_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES public.process_versions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    input_type public.step_type NOT NULL DEFAULT 'CHECKBOX',
    required BOOLEAN DEFAULT true,
    
    -- Assignment
    assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_job_title TEXT,
    assigned_job_titles TEXT[],
    assigned_user_ids UUID[],
    assigned_team_ids UUID[],
    
    -- Styling
    style JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PROCESS RUNS
-- =====================================================

CREATE TABLE public.process_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id UUID NOT NULL REFERENCES public.process_definitions(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES public.process_versions(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    
    run_name TEXT NOT NULL,
    status public.run_status NOT NULL DEFAULT 'NOT_STARTED',
    
    started_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    started_by_name TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    
    -- Validation
    validated_at TIMESTAMPTZ,
    validator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Step data (JSONB for flexibility)
    step_values JSONB DEFAULT '{}'::jsonb,
    completed_step_ids TEXT[] DEFAULT '{}',
    
    -- Reactor / Health
    due_at TIMESTAMPTZ,
    health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
    last_interaction_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step Feedback
CREATE TABLE public.step_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.process_runs(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES public.process_steps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    text TEXT NOT NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('BLOCKER', 'ADVISORY', 'PRAISE')),
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity Logs
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.process_runs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TASKS
-- =====================================================

CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.process_runs(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES public.process_steps(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    
    assignee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assignee_job_title TEXT,
    assignee_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    
    status public.task_status NOT NULL DEFAULT 'OPEN',
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. NOTIFICATIONS
-- =====================================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type public.notification_type NOT NULL,
    
    link_id TEXT,
    link_type TEXT CHECK (link_type IN ('RUN', 'PROCESS', 'MY_TASKS', 'REVIEWS')),
    
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. INDEXES
-- =====================================================

CREATE INDEX idx_profiles_workspace ON public.profiles(workspace_id);
CREATE INDEX idx_teams_workspace ON public.teams(workspace_id);
CREATE INDEX idx_team_memberships_user ON public.team_memberships(user_id);
CREATE INDEX idx_team_memberships_team ON public.team_memberships(team_id);
CREATE INDEX idx_process_definitions_workspace ON public.process_definitions(workspace_id);
CREATE INDEX idx_process_versions_process ON public.process_versions(process_id);
CREATE INDEX idx_process_versions_status ON public.process_versions(status);
CREATE INDEX idx_process_steps_version ON public.process_steps(version_id);
CREATE INDEX idx_process_runs_workspace ON public.process_runs(workspace_id);
CREATE INDEX idx_process_runs_status ON public.process_runs(status);
CREATE INDEX idx_tasks_workspace ON public.tasks(workspace_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- 8. HELPER FUNCTIONS (Security Definer)
-- =====================================================

-- Check if user has a role in workspace
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _workspace_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id 
        AND workspace_id = _workspace_id 
        AND role = _role
    )
$$;

-- Check if user is admin of any workspace
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = 'admin'
    )
$$;

-- Check if user is member of a team
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.team_memberships
        WHERE user_id = _user_id AND team_id = _team_id
    )
$$;

-- Get user's workspace_id
CREATE OR REPLACE FUNCTION public.get_user_workspace(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT workspace_id FROM public.profiles WHERE id = _user_id
$$;

-- 9. UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_process_definitions_updated_at BEFORE UPDATE ON public.process_definitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_process_versions_updated_at BEFORE UPDATE ON public.process_versions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_process_steps_updated_at BEFORE UPDATE ON public.process_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_process_runs_updated_at BEFORE UPDATE ON public.process_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view profiles in their workspace" ON public.profiles
    FOR SELECT USING (
        workspace_id = public.get_user_workspace(auth.uid()) 
        OR id = auth.uid()
    );

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- USER_ROLES (only admins can manage)
CREATE POLICY "Users can view roles in their workspace" ON public.user_roles
    FOR SELECT USING (workspace_id = public.get_user_workspace(auth.uid()));

CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (public.is_admin(auth.uid()));

-- WORKSPACES
CREATE POLICY "Users can view their workspace" ON public.workspaces
    FOR SELECT USING (id = public.get_user_workspace(auth.uid()));

CREATE POLICY "Admins can update workspace" ON public.workspaces
    FOR UPDATE USING (public.has_role(auth.uid(), id, 'admin'));

-- TEAMS
CREATE POLICY "Users can view teams in their workspace" ON public.teams
    FOR SELECT USING (workspace_id = public.get_user_workspace(auth.uid()));

CREATE POLICY "Admins can manage teams" ON public.teams
    FOR ALL USING (public.has_role(auth.uid(), workspace_id, 'admin'));

-- TEAM_MEMBERSHIPS
CREATE POLICY "Users can view memberships in their workspace" ON public.team_memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.teams t 
            WHERE t.id = team_id 
            AND t.workspace_id = public.get_user_workspace(auth.uid())
        )
    );

CREATE POLICY "Admins can manage memberships" ON public.team_memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.teams t 
            WHERE t.id = team_id 
            AND public.has_role(auth.uid(), t.workspace_id, 'admin')
        )
    );

-- PROCESS_DEFINITIONS
CREATE POLICY "Users can view processes in their workspace" ON public.process_definitions
    FOR SELECT USING (workspace_id = public.get_user_workspace(auth.uid()));

CREATE POLICY "Users with canDesign can create processes" ON public.process_definitions
    FOR INSERT WITH CHECK (
        workspace_id = public.get_user_workspace(auth.uid())
        AND created_by = auth.uid()
    );

CREATE POLICY "Admins can manage all processes" ON public.process_definitions
    FOR ALL USING (public.has_role(auth.uid(), workspace_id, 'admin'));

-- PROCESS_VERSIONS
CREATE POLICY "Users can view versions in their workspace" ON public.process_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.process_definitions pd
            WHERE pd.id = process_id
            AND pd.workspace_id = public.get_user_workspace(auth.uid())
        )
    );

CREATE POLICY "Users can create versions for processes they have access to" ON public.process_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.process_definitions pd
            WHERE pd.id = process_id
            AND pd.workspace_id = public.get_user_workspace(auth.uid())
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update their own draft versions" ON public.process_versions
    FOR UPDATE USING (
        created_by = auth.uid() AND status = 'DRAFT'
    );

CREATE POLICY "Admins can manage all versions" ON public.process_versions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.process_definitions pd
            WHERE pd.id = process_id
            AND public.has_role(auth.uid(), pd.workspace_id, 'admin')
        )
    );

-- PROCESS_STEPS
CREATE POLICY "Users can view steps for accessible versions" ON public.process_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.process_versions pv
            JOIN public.process_definitions pd ON pd.id = pv.process_id
            WHERE pv.id = version_id
            AND pd.workspace_id = public.get_user_workspace(auth.uid())
        )
    );

CREATE POLICY "Version creators can manage steps" ON public.process_steps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.process_versions pv
            WHERE pv.id = version_id
            AND pv.created_by = auth.uid()
            AND pv.status = 'DRAFT'
        )
    );

-- PROCESS_RUNS
CREATE POLICY "Users can view runs in their workspace" ON public.process_runs
    FOR SELECT USING (workspace_id = public.get_user_workspace(auth.uid()));

CREATE POLICY "Users can create runs" ON public.process_runs
    FOR INSERT WITH CHECK (
        workspace_id = public.get_user_workspace(auth.uid())
        AND started_by = auth.uid()
    );

CREATE POLICY "Run starters and validators can update runs" ON public.process_runs
    FOR UPDATE USING (
        started_by = auth.uid() 
        OR public.has_role(auth.uid(), workspace_id, 'admin')
    );

-- STEP_FEEDBACK
CREATE POLICY "Users can view feedback in their workspace runs" ON public.step_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.process_runs pr
            WHERE pr.id = run_id
            AND pr.workspace_id = public.get_user_workspace(auth.uid())
        )
    );

CREATE POLICY "Users can add feedback" ON public.step_feedback
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own feedback" ON public.step_feedback
    FOR UPDATE USING (user_id = auth.uid());

-- ACTIVITY_LOGS
CREATE POLICY "Users can view logs in their workspace runs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.process_runs pr
            WHERE pr.id = run_id
            AND pr.workspace_id = public.get_user_workspace(auth.uid())
        )
    );

CREATE POLICY "Users can add logs" ON public.activity_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- TASKS
CREATE POLICY "Users can view tasks in their workspace" ON public.tasks
    FOR SELECT USING (workspace_id = public.get_user_workspace(auth.uid()));

CREATE POLICY "Users can update tasks assigned to them" ON public.tasks
    FOR UPDATE USING (assignee_user_id = auth.uid());

CREATE POLICY "Admins can manage all tasks" ON public.tasks
    FOR ALL USING (public.has_role(auth.uid(), workspace_id, 'admin'));

-- NOTIFICATIONS
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);