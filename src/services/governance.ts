
import { ProcessDefinition, User, WorkspaceSettings, Team } from '../types';

/**
 * Freshness types for process reviews
 * - CURRENT: Process is within review period
 * - DUE_SOON: Within 30 days of expiration (notifications start)
 * - EXPIRED: Past due date (hard block for new runs)
 */
export type FreshnessStatus = 'CURRENT' | 'DUE_SOON' | 'EXPIRED';

/**
 * Review frequency presets in months
 */
export const REVIEW_FREQUENCY_PRESETS = [
  { label: '3 months', value: 90, days: 90 },
  { label: '6 months', value: 180, days: 180 },
  { label: '9 months', value: 270, days: 270 },
  { label: '12 months', value: 365, days: 365 },
] as const;

export const DEFAULT_REVIEW_FREQUENCY_DAYS = 180; // 6 months
export const DUE_SOON_LEAD_DAYS = 30; // Notifications start 30 days before expiration
export const ESCALATION_DAYS = 7; // Team Lead notified after 7 days in DUE_SOON without action

/**
 * SaaS Resolution Waterfall (B1, B2, B3, B4, B5):
 * 1. B1 (Specific Person): If userId is present and user is ACTIVE.
 * 2. B2 (Functional Job Title): If B1 fails/absent, find FIRST active user with jobTitle.
 * 3. B3 (Team Lead): If teamId present, find Team Lead.
 * 4. B4 (Functional Team): If B1-B3 fail, find FIRST active user in teamId.
 * 5. B5 (Ultimate Failover): Find FIRST active Admin (canManageTeam).
 */
export const resolveEffectiveUser = (
  userId: string | undefined,
  jobTitle: string | undefined,
  teamId: string | undefined,
  allUsers: User[],
  teams: Team[]
): User => {
  // B1: Specific Person Check
  if (userId) {
    const specificUser = allUsers.find(u => u.id === userId && u.status === 'ACTIVE');
    if (specificUser) return specificUser;
  }

  // B2: Functional Job Title Fallback
  if (jobTitle) {
    const titleProxy = allUsers.find(u => u.jobTitle === jobTitle && u.status === 'ACTIVE');
    if (titleProxy) return titleProxy;
  }

  // B3 & B4: Team Logic
  if (teamId) {
    // B3: Check Team Lead
    // Note: teamId might be the Team Name (e.g. 'Finance') or ID ('t-fin'). 
    const team = teams.find(t => t.name === teamId || t.id === teamId);
    
    if (team && team.leadUserId) {
       const lead = allUsers.find(u => u.id === team.leadUserId && u.status === 'ACTIVE');
       if (lead) return lead;
    }

    // B4: Any Team Member Fallback (Operational execution only, not governance)
    const teamProxy = allUsers.find(u => u.team === teamId && u.status === 'ACTIVE');
    if (teamProxy) return teamProxy;
  }

  // B5: Ultimate Failover - First Active Admin
  const admin = allUsers.find(u => u.status === 'ACTIVE' && u.permissions.canManageTeam);
  if (admin) return admin;

  // Critical Failsafe (should never reach here if an admin exists)
  return allUsers.find(u => u.status === 'ACTIVE') || allUsers[0];
};

/**
 * Checks if a user is a Global Admin (has ALL permissions).
 */
export const isGlobalAdmin = (user: User): boolean => {
  return Object.values(user.permissions).every(val => val === true);
};

export type GovernanceRole = 'EDITOR' | 'PUBLISHER' | 'RUN_VALIDATOR' | 'EXECUTOR';

/**
 * Verifies if a user is authorized to perform governance actions.
 */
export const hasGovernancePermission = (
  user: User,
  process: ProcessDefinition,
  role: GovernanceRole,
  workspace: WorkspaceSettings,
  teams: Team[] = [] 
): boolean => {
  // Global Admin "Break Glass" Override
  if (isGlobalAdmin(user)) return true;

  let targetUserId: string | undefined;
  let targetJobTitle: string | undefined;
  let explicitTeamId: string | undefined;

  switch (role) {
      case 'EDITOR':
          targetUserId = process.editor_user_id;
          targetJobTitle = process.editor_job_title;
          explicitTeamId = process.editor_team_id;
          break;
      case 'PUBLISHER':
          targetUserId = process.publisher_user_id;
          targetJobTitle = process.publisher_job_title;
          explicitTeamId = process.publisher_team_id;
          break;
      case 'RUN_VALIDATOR':
          targetUserId = process.run_validator_user_id;
          targetJobTitle = process.run_validator_job_title;
          explicitTeamId = process.run_validator_team_id;
          break;
      case 'EXECUTOR':
          targetUserId = process.executor_user_id;
          targetJobTitle = process.executor_job_title;
          explicitTeamId = process.executor_team_id;
          break;
  }

  // 1. Explicit Specific User Override
  if (targetUserId) {
    return user.id === targetUserId;
  }

  // 2. Explicit Job Title
  if (targetJobTitle) {
    return user.jobTitle === targetJobTitle;
  }

  // 3. Explicit "Any Member" Team Delegation
  if (explicitTeamId) {
    // If the rule explicitly targets a team (e.g. "Finance"), allow ANY member.
    if (user.team === explicitTeamId) return true;
    
    // Also allow the Team Lead explicitly (just in case)
    const team = teams.find(t => t.name === explicitTeamId || t.id === explicitTeamId);
    if (team && team.leadUserId === user.id) return true;
  }

  // 4. Default Fallback: Owning Team Leader
  // If no explicit settings, the Owning Team's LEAD is the authority.
  if (!targetUserId && !targetJobTitle && !explicitTeamId) {
      const owningTeamName = process.category;
      const owningTeam = teams.find(t => t.name === owningTeamName);
      if (owningTeam && owningTeam.leadUserId === user.id) return true;
  }

  return false;
};

/**
 * Resolves Editor, Publisher, RunValidator, and Executor for a given process definition.
 */
export const getProcessGovernance = (process: ProcessDefinition, allUsers: User[], workspace: WorkspaceSettings, teams: Team[] = []) => {
  
  const editor = resolveEffectiveUser(
      process.editor_user_id,
      process.editor_job_title,
      process.editor_team_id || process.category,
      allUsers,
      teams
  );

  const publisher = resolveEffectiveUser(
      process.publisher_user_id,
      process.publisher_job_title,
      process.publisher_team_id || process.category,
      allUsers,
      teams
  );

  const runValidator = resolveEffectiveUser(
      process.run_validator_user_id,
      process.run_validator_job_title,
      process.run_validator_team_id || process.category,
      allUsers,
      teams
  );

  const executor = resolveEffectiveUser(
      process.executor_user_id,
      process.executor_job_title,
      process.executor_team_id || process.category,
      allUsers,
      teams
  );

  return { editor, publisher, runValidator, executor };
};

/**
 * SaaS Logic: Calculates if a process version is due for audit review.
 * Returns:
 * - CURRENT: Within review period
 * - DUE_SOON: Within 30 days of expiration date
 * - EXPIRED: Past the expiration date (hard block for new runs)
 */
export const calculateStatus = (process: ProcessDefinition): FreshnessStatus => {
  // Only published processes have freshness tracking
  if (process.status !== 'PUBLISHED') return 'CURRENT'; 

  const lastReviewDate = new Date(process.lastReviewedAt);
  const expirationDate = new Date(lastReviewDate);
  expirationDate.setDate(expirationDate.getDate() + process.review_frequency_days);
  
  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // EXPIRED: Past the expiration date (immediate hard block)
  if (diffDays < 0) return 'EXPIRED';
  
  // DUE_SOON: Within lead days of expiration (notifications start)
  if (diffDays <= DUE_SOON_LEAD_DAYS) return 'DUE_SOON';
  
  // CURRENT: Normal operation
  return 'CURRENT';
};

/**
 * Get the expiration date for a process
 */
export const getExpirationDate = (process: ProcessDefinition): Date => {
  const lastReviewDate = new Date(process.lastReviewedAt);
  const expirationDate = new Date(lastReviewDate);
  expirationDate.setDate(expirationDate.getDate() + process.review_frequency_days);
  return expirationDate;
};

/**
 * Get days until expiration (negative if expired)
 */
export const getDaysUntilExpiration = (process: ProcessDefinition): number => {
  const expirationDate = getExpirationDate(process);
  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if a user can refresh a process
 * Editor OR Publisher OR Team Lead can refresh (no capability required)
 */
export const canRefreshProcess = (
  user: User,
  process: ProcessDefinition,
  workspace: WorkspaceSettings,
  teams: Team[]
): boolean => {
  // Global Admin can always refresh
  if (isGlobalAdmin(user)) return true;
  
  // Designated Editor can refresh
  if (hasGovernancePermission(user, process, 'EDITOR', workspace, teams)) return true;
  
  // Designated Publisher can refresh
  if (hasGovernancePermission(user, process, 'PUBLISHER', workspace, teams)) return true;
  
  // Team Lead of owning team can refresh (override)
  const owningTeam = teams.find(t => t.name === process.category);
  if (owningTeam && owningTeam.leadUserId === user.id) return true;
  
  return false;
};

/**
 * Check if a user can launch a run for a process
 * Designated Executor OR Designated Validator OR Owning Team member + canExecute capability
 */
export const canLaunchRun = (
  user: User,
  process: ProcessDefinition,
  workspace: WorkspaceSettings,
  teams: Team[]
): boolean => {
  // Must have canExecute capability
  if (!user.permissions.canExecute) return false;
  
  // Global Admin can always launch
  if (isGlobalAdmin(user)) return true;
  
  // Designated Executor can launch
  if (hasGovernancePermission(user, process, 'EXECUTOR', workspace, teams)) return true;
  
  // Designated Validator can launch
  if (hasGovernancePermission(user, process, 'RUN_VALIDATOR', workspace, teams)) return true;
  
  // Any member of the Owning Team can launch
  const owningTeamName = process.category;
  if (user.team === owningTeamName) return true;
  
  // Check team membership via teams array
  const owningTeam = teams.find(t => t.name === owningTeamName);
  if (owningTeam && owningTeam.leadUserId === user.id) return true;
  
  return false;
};

/**
 * Check if a user can see a run instance
 * Initiator, Designated Executor, Designated Validator, Step Assignee (any status), Entire Owning Team
 */
export const canSeeRun = (
  user: User,
  run: { startedBy: string; versionId: string },
  process: ProcessDefinition,
  tasks: Array<{ runId: string; assigneeUserId?: string; assigneeJobTitle?: string; assigneeTeamId?: string }>,
  allUsers: User[],
  workspace: WorkspaceSettings,
  teams: Team[],
  runId: string
): boolean => {
  // Global Admin can see everything
  if (isGlobalAdmin(user)) return true;
  
  // 1. Initiator: User started the run
  const userFullName = `${user.firstName} ${user.lastName}`;
  if (run.startedBy === userFullName) return true;
  
  // 2. Designated Executor
  if (hasGovernancePermission(user, process, 'EXECUTOR', workspace, teams)) return true;
  
  // 3. Designated Validator
  if (hasGovernancePermission(user, process, 'RUN_VALIDATOR', workspace, teams)) return true;
  
  // 4. Step Assignee (OPEN or DONE - any status)
  const runTasks = tasks.filter(t => t.runId === runId);
  for (const task of runTasks) {
    const assignee = resolveEffectiveUser(
      task.assigneeUserId,
      task.assigneeJobTitle,
      task.assigneeTeamId,
      allUsers,
      teams
    );
    if (assignee.id === user.id) return true;
  }
  
  // 5. Entire Owning Team membership
  const owningTeamName = process.category;
  if (user.team === owningTeamName) return true;
  
  // Also check team lead
  const owningTeam = teams.find(t => t.name === owningTeamName);
  if (owningTeam && owningTeam.leadUserId === user.id) return true;
  
  return false;
};
