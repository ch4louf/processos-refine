
export enum StepType {
  CHECKBOX = 'CHECKBOX',
  TEXT_INPUT = 'TEXT_INPUT',
  FILE_UPLOAD = 'FILE_UPLOAD',
  INFO = 'INFO'
}

export interface ProcessStep {
  id: string;
  orderIndex: number;
  text: string;
  inputType: StepType;
  required: boolean;
  assignedJobTitle?: string;
  assignedUserId?: string;
  assignedJobTitles?: string[];
  assignedUserIds?: string[];
  assignedTeamIds?: string[];
  style?: {
    bold?: boolean;
    color?: string;
  };
}

export type VersionStatus = 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export type RunStatus = 
  | 'NOT_STARTED' 
  | 'IN_PROGRESS' 
  | 'READY_TO_SUBMIT' 
  | 'IN_REVIEW' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'CANCELLED'
  | 'PENDING_VALIDATION'
  | 'COMPLETED';

export type RunStepStatus = 'PENDING' | 'DONE' | 'SKIPPED';

export type FeedbackType = 'BLOCKER' | 'ADVISORY' | 'PRAISE';

export interface StepFeedback {
  id: string;
  stepId: string;
  userId: string;
  userName: string;
  text: string;
  type: FeedbackType;
  createdAt: string;
  resolved: boolean;
}

export interface ProcessDefinition {
  id: string; 
  rootId: string; 
  versionNumber: number;
  status: VersionStatus;
  title: string;
  description: string;
  category: string;
  isPublic?: boolean;
  createdAt: string;
  createdBy: string;
  publishedAt?: string;
  publishedBy?: string;
  
  // 1. DESIGN GOVERNANCE (The Editor)
  editor_user_id?: string;
  editor_job_title?: string;
  editor_team_id?: string;

  // 2. PUBLICATION GOVERNANCE (The Publisher)
  publisher_user_id?: string;
  publisher_job_title?: string;
  publisher_team_id?: string;

  // 3. EXECUTION TEAM (The Executor - Defaults to Category/Owning Team)
  executor_user_id?: string;
  executor_job_title?: string;
  executor_team_id?: string;

  // 4. EXECUTION GOVERNANCE (The Run Validator)
  run_validator_user_id?: string;
  run_validator_job_title?: string;
  run_validator_team_id?: string;

  lastReviewedAt: string;
  lastReviewedBy: string;
  review_frequency_days: number;
  review_due_lead_days: number;
  sequential_execution: boolean;
  steps: ProcessStep[];
  // NEW: SLA Definitions
  estimated_duration_days?: number; 
}

export interface WorkspaceSettings {
  workspace_id: string;
  default_review_frequency_days: number;
  default_review_due_lead_days: number;
  settings?: {
    blockRunsOnExpired?: boolean;
    blockNewRunsOnExpired?: boolean;
  };
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string; 
  timestamp: string;
}

export interface ProcessRun {
  id: string;
  rootProcessId: string;
  versionId: string; 
  processTitle: string; 
  runName: string;
  startedBy: string;
  startedAt: string;
  completedAt?: string;
  validatedAt?: string;
  validatorUserId?: string;
  stepValues: Record<string, any>;
  completedStepIds: string[];
  stepFeedback: Record<string, StepFeedback[]>; 
  status: RunStatus;
  activityLog: ActivityLog[];
  // NEW: Reactor Fields
  dueAt?: string; // ISO Date
  healthScore?: number; // 0-100 (100 = Perfect, <50 = Critical)
  lastInteractionAt?: string; // To track staleness
}

export interface Task {
  id: string;
  runId: string;
  stepId: string;
  assigneeUserId?: string;
  assigneeJobTitle?: string;
  assigneeTeamId?: string;
  status: 'OPEN' | 'DONE';
  completedAt?: string;
  completedBy?: string;
}

export type NotificationType = 'TASK_ASSIGNED' | 'REVIEW_REQUIRED' | 'PROCESS_OUTDATED' | 'VERSION_PUBLISHED' | 'RUN_BLOCKED' | 'MENTION' | 'SLA_BREACH' | 'STALE_RUN';

export interface Notification {
  id: string;
  userId?: string;
  jobTitle?: string;
  title: string;
  message: string;
  type: NotificationType;
  linkId?: string;
  linkType?: 'RUN' | 'PROCESS' | 'MY_TASKS' | 'REVIEWS';
  timestamp: string;
  read: boolean;
}

export interface UserPermissions {
  canDesign: boolean;        
  canVerifyDesign: boolean;  
  canExecute: boolean;       
  canVerifyRun: boolean;     
  canManageTeam: boolean;    
  canAccessBilling: boolean;
  canAccessWorkspace: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string; 
  team: string;
  status: 'ACTIVE' | 'INACTIVE';
  invitedAt?: string;
  permissions: UserPermissions;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  color: 'indigo' | 'emerald' | 'amber' | 'slate' | 'pink' | 'blue' | 'purple' | 'gray' | 'red' | 'cyan';
  leadUserId?: string;
}

export type ToastType = 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
