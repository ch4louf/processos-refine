
import { ProcessDefinition, User, WorkspaceSettings, Team } from '../types';

/**
 * Freshness types for process reviews
 */
export type FreshnessStatus = 'UP_TO_DATE' | 'DUE_SOON' | 'OUTDATED';

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
 */
export const calculateStatus = (process: ProcessDefinition): FreshnessStatus => {
  if (process.status !== 'PUBLISHED') return 'UP_TO_DATE'; 

  const lastDate = new Date(process.lastReviewedAt);
  const nextReviewDate = new Date(lastDate);
  nextReviewDate.setDate(nextReviewDate.getDate() + process.review_frequency_days);
  
  const now = new Date('2025-03-15T10:00:00Z');
  const diffTime = nextReviewDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'OUTDATED';
  if (diffDays <= process.review_due_lead_days) return 'DUE_SOON';
  return 'UP_TO_DATE';
};
