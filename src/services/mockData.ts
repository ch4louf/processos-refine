
import { ProcessDefinition, StepType, User, ProcessRun, WorkspaceSettings, UserPermissions, Task, Notification, StepFeedback, Team } from '../types';

// --- UTILS ---
const now = new Date();
const getDate = (daysOffset: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysOffset);
  // Add some random hour jitter for realism
  d.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 59));
  return d.toISOString();
};

const getFutureDate = (daysOffset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString();
};

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

// --- PERMISSIONS PRESETS ---
const adminPerms: UserPermissions = { canDesign: true, canVerifyDesign: true, canExecute: true, canVerifyRun: true, canManageTeam: true, canAccessBilling: true };
const managerPerms: UserPermissions = { canDesign: true, canVerifyDesign: true, canExecute: true, canVerifyRun: true, canManageTeam: false, canAccessBilling: false };
const opsPerms: UserPermissions = { canDesign: false, canVerifyDesign: false, canExecute: true, canVerifyRun: false, canManageTeam: false, canAccessBilling: false };
const auditorPerms: UserPermissions = { canDesign: false, canVerifyDesign: false, canExecute: false, canVerifyRun: true, canManageTeam: false, canAccessBilling: false };
const guestPerms: UserPermissions = { canDesign: false, canVerifyDesign: false, canExecute: false, canVerifyRun: false, canManageTeam: false, canAccessBilling: false };

// --- 1. NEXUS CORP DIRECTORY (25 Users) ---
export const MOCK_USERS: User[] = [
  // FINANCE (The Power Users)
  { id: 'u-1', firstName: 'Alice', lastName: 'Dubois', email: 'alice@nexus.corp', jobTitle: 'Financial Controller', team: 'Finance', status: 'ACTIVE', permissions: adminPerms },
  { id: 'u-2', firstName: 'Bob', lastName: 'Martin', email: 'bob@nexus.corp', jobTitle: 'Senior Accountant', team: 'Finance', status: 'ACTIVE', permissions: opsPerms },
  { id: 'u-3', firstName: 'Mia', lastName: 'Wong', email: 'mia@nexus.corp', jobTitle: 'Payroll Specialist', team: 'Finance', status: 'ACTIVE', permissions: opsPerms },
  { id: 'u-4', firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah@nexus.corp', jobTitle: 'CFO', team: 'Finance', status: 'ACTIVE', permissions: { ...adminPerms, canManageTeam: true } },

  // HR & PEOPLE (The Onboarders)
  { id: 'u-5', firstName: 'Claire', lastName: 'Vance', email: 'claire@nexus.corp', jobTitle: 'HR Director', team: 'People', status: 'ACTIVE', permissions: managerPerms },
  { id: 'u-6', firstName: 'Tina', lastName: 'Fey', email: 'tina@nexus.corp', jobTitle: 'Recruiting Lead', team: 'People', status: 'ACTIVE', permissions: opsPerms },
  { id: 'u-7', firstName: 'Leo', lastName: 'Messi', email: 'leo@nexus.corp', jobTitle: 'People Ops', team: 'People', status: 'ACTIVE', permissions: opsPerms },

  // IT & ENGINEERING (The Fixers)
  { id: 'u-8', firstName: 'David', lastName: 'Chen', email: 'david@nexus.corp', jobTitle: 'IT Manager', team: 'IT', status: 'ACTIVE', permissions: managerPerms },
  { id: 'u-9', firstName: 'Grace', lastName: 'Hopper', email: 'grace@nexus.corp', jobTitle: 'DevOps Engineer', team: 'IT', status: 'ACTIVE', permissions: opsPerms },
  { id: 'u-10', firstName: 'Noah', lastName: 'Sols', email: 'noah@nexus.corp', jobTitle: 'Security Analyst', team: 'IT', status: 'ACTIVE', permissions: { ...opsPerms, canVerifyRun: true } },
  { id: 'u-11', firstName: 'Paul', lastName: 'Allen', email: 'paul@nexus.corp', jobTitle: 'Systems Architect', team: 'IT', status: 'ACTIVE', permissions: managerPerms },

  // LEGAL & COMPLIANCE (The Blockers)
  { id: 'u-12', firstName: 'Eva', lastName: 'Rossi', email: 'eva@nexus.corp', jobTitle: 'General Counsel', team: 'Legal', status: 'ACTIVE', permissions: managerPerms },
  { id: 'u-13', firstName: 'Rosa', lastName: 'Parks', email: 'rosa@nexus.corp', jobTitle: 'Compliance Officer', team: 'Legal', status: 'ACTIVE', permissions: auditorPerms },
  
  // OPERATIONS (The Doers)
  { id: 'u-14', firstName: 'Frank', lastName: 'Wright', email: 'frank@nexus.corp', jobTitle: 'COO', team: 'Operations', status: 'ACTIVE', permissions: adminPerms },
  { id: 'u-15', firstName: 'Ursula', lastName: 'K.', email: 'ursula@nexus.corp', jobTitle: 'Facilities Mgr', team: 'Operations', status: 'ACTIVE', permissions: opsPerms },
  { id: 'u-16', firstName: 'Henry', lastName: 'Ford', email: 'henry@nexus.corp', jobTitle: 'Logistics Lead', team: 'Operations', status: 'ACTIVE', permissions: opsPerms },

  // SALES & MARKETING
  { id: 'u-17', firstName: 'Jack', lastName: 'Ma', email: 'jack@nexus.corp', jobTitle: 'VP Sales', team: 'Sales', status: 'ACTIVE', permissions: opsPerms },
  { id: 'u-18', firstName: 'Victor', lastName: 'Hugo', email: 'victor@nexus.corp', jobTitle: 'AE Enterprise', team: 'Sales', status: 'ACTIVE', permissions: opsPerms },
  { id: 'u-19', firstName: 'Isabel', lastName: 'Allende', email: 'isabel@nexus.corp', jobTitle: 'CMO', team: 'Marketing', status: 'ACTIVE', permissions: opsPerms },
  { id: 'u-20', firstName: 'Yara', lastName: 'Shahidi', email: 'yara@nexus.corp', jobTitle: 'Brand Mgr', team: 'Marketing', status: 'ACTIVE', permissions: opsPerms },

  // EXTERNAL / GUESTS
  { id: 'u-guest', firstName: 'Guest', lastName: 'Auditor', email: 'audit@kpmg.fake', jobTitle: 'External Auditor', team: 'External', status: 'ACTIVE', permissions: guestPerms }
];

export const MOCK_TEAMS: Team[] = [
  { id: 't-fin', name: 'Finance', description: 'Global accounting and payroll.', color: 'indigo', leadUserId: 'u-1' },
  { id: 't-hr', name: 'People', description: 'HR, Recruiting, and Culture.', color: 'pink', leadUserId: 'u-5' },
  { id: 't-it', name: 'IT', description: 'Information Technology and Security.', color: 'cyan', leadUserId: 'u-8' },
  { id: 't-leg', name: 'Legal', description: 'Legal counsel and compliance.', color: 'emerald', leadUserId: 'u-12' },
  { id: 't-ops', name: 'Operations', description: 'Facilities and Logistics.', color: 'blue', leadUserId: 'u-14' },
  { id: 't-sales', name: 'Sales', description: 'Global Sales team.', color: 'amber', leadUserId: 'u-17' },
  { id: 't-mkt', name: 'Marketing', description: 'Brand and Communications.', color: 'purple', leadUserId: 'u-19' },
  { id: 't-ext', name: 'External', description: 'Auditors and Contractors.', color: 'gray', leadUserId: 'u-guest' },
];

export const MOCK_WORKSPACE: WorkspaceSettings = {
  workspace_id: 'ws-nexus-01',
  default_review_frequency_days: 180,
  default_review_due_lead_days: 30
};

// ... existing code for HERO PROCESS DEFINITIONS ...
// A. FINANCE: Global Month-End Close (The Beast)
const p_finance_root = 'root-finance-close';
const financeV2: ProcessDefinition = {
  id: 'p-fin-v2', rootId: p_finance_root, versionNumber: 2, status: 'PUBLISHED',
  title: 'Global Month-End Close', category: 'Finance', isPublic: false, // PRIVATE
  description: 'Standardized closing procedure for all subsidiaries. Must be completed by WD+5.',
  createdAt: getDate(45), createdBy: 'Alice Dubois', publishedAt: getDate(40), publishedBy: 'Sarah Jenkins',
  lastReviewedAt: getDate(10), lastReviewedBy: 'Alice Dubois',
  review_frequency_days: 90, review_due_lead_days: 15, sequential_execution: true,
  estimated_duration_days: 5,
  editor_job_title: 'Financial Controller', 
  publisher_job_title: 'CFO',
  run_validator_job_title: 'CFO',
  steps: [
    { id: 's-f-1', orderIndex: 0, text: 'Upload Bank Reconciliation Statements (MT940/CAMT.053) for all operating accounts', inputType: StepType.FILE_UPLOAD, required: true, assignedTeamIds: ['Finance'] },
    { id: 's-f-2', orderIndex: 1, text: 'Confirm Total Intercompany Eliminations Variance (Must be < $100)', inputType: StepType.TEXT_INPUT, required: true, assignedJobTitles: ['Senior Accountant'] },
    { id: 's-f-3', orderIndex: 2, text: 'Input Final EBITDA Adjustment (Include detailed memo for any one-off items)', inputType: StepType.TEXT_INPUT, required: true, assignedJobTitles: ['Financial Controller'] },
    { id: 's-f-info', orderIndex: 3, text: 'Warning: Ensure all recurring journal entries are posted before locking the GL. Once locked, re-opening requires CFO approval.', inputType: StepType.INFO, required: false },
    { id: 's-f-4', orderIndex: 4, text: 'Execute Soft Close / Lock General Ledger (GL) for the period', inputType: StepType.CHECKBOX, required: true, assignedJobTitles: ['Financial Controller'] },
    { id: 's-f-5', orderIndex: 5, text: 'Upload Signed Trial Balance Summary', inputType: StepType.FILE_UPLOAD, required: true, assignedJobTitles: ['CFO'] },
    { id: 's-f-6', orderIndex: 6, text: 'CFO Final Sign-off on Consolidated Report', inputType: StepType.CHECKBOX, required: true, assignedJobTitles: ['CFO'] }
  ]
};
const financeV1: ProcessDefinition = { ...financeV2, id: 'p-fin-v1', versionNumber: 1, status: 'ARCHIVED', createdAt: getDate(200), publishedAt: getDate(190), steps: financeV2.steps.slice(0, 4) };

// NEW: Finance v3 Draft (Work in Progress by Alice)
const financeV3Draft: ProcessDefinition = {
  ...financeV2,
  id: 'p-fin-v3-draft', versionNumber: 3, status: 'DRAFT',
  description: 'Updated for 2025 with AI reconciliation steps.',
  createdAt: getDate(2), createdBy: 'Alice Dubois', publishedAt: undefined, publishedBy: undefined,
  steps: [
    ...financeV2.steps,
    { id: 's-f-7-draft', orderIndex: 7, text: 'Run AI Anomaly Detection Review on Expense Accounts', inputType: StepType.CHECKBOX, required: true, assignedJobTitles: ['Financial Controller'] }
  ]
};

// B. HR: Employee Onboarding (Cross-Functional)
const p_hr_root = 'root-hr-onboard';
const hrV3: ProcessDefinition = {
  id: 'p-hr-v3', rootId: p_hr_root, versionNumber: 3, status: 'PUBLISHED',
  title: 'Employee Onboarding Pipeline', category: 'People', isPublic: true, // PUBLIC
  description: 'End-to-end workflow for new hires. Triggers IT provisioning and Ops access.',
  createdAt: getDate(60), createdBy: 'Claire Vance', publishedAt: getDate(55), publishedBy: 'Claire Vance',
  lastReviewedAt: getDate(5), lastReviewedBy: 'Claire Vance',
  review_frequency_days: 180, review_due_lead_days: 30, sequential_execution: false, // Parallel allowed
  estimated_duration_days: 3,
  editor_team_id: 'People', 
  publisher_job_title: 'HR Director',
  run_validator_job_title: 'HR Director',
  steps: [
    { id: 's-h-1', orderIndex: 0, text: 'Upload Countersigned Offer Letter & NDA', inputType: StepType.FILE_UPLOAD, required: true, assignedTeamIds: ['People'] },
    { id: 's-h-2', orderIndex: 1, text: 'Provision Laptop: Enter Asset Tag Number', inputType: StepType.TEXT_INPUT, required: true, assignedTeamIds: ['IT'] },
    { id: 's-h-3', orderIndex: 2, text: 'Create SSO & Email Accounts (Paste Okta Log URL)', inputType: StepType.TEXT_INPUT, required: true, assignedTeamIds: ['IT'] },
    { id: 's-h-4', orderIndex: 3, text: 'Issue Building Security Badge (RFID Check)', inputType: StepType.CHECKBOX, required: true, assignedTeamIds: ['Operations'] },
    { id: 's-h-info', orderIndex: 4, text: 'Note: If the employee is remote, skip the Security Badge step and mark as N/A in comments.', inputType: StepType.INFO, required: false },
    { id: 's-h-5', orderIndex: 5, text: 'Upload Photo of Day 1 Welcome Desk Setup', inputType: StepType.FILE_UPLOAD, required: true, assignedTeamIds: ['People'] }
  ]
};

// C. COMPLIANCE: Vendor Assessment (Heavy Data)
const p_comp_root = 'root-comp-vendor';
const compV1: ProcessDefinition = {
  id: 'p-comp-v1', rootId: p_comp_root, versionNumber: 1, status: 'PUBLISHED',
  title: 'Vendor Security Assessment (VSA)', category: 'Legal', isPublic: false,
  description: 'Required for all new software vendors handling PII data.',
  createdAt: getDate(120), createdBy: 'Noah Sols', publishedAt: getDate(118), publishedBy: 'Eva Rossi',
  lastReviewedAt: getDate(118), lastReviewedBy: 'Eva Rossi',
  review_frequency_days: 365, review_due_lead_days: 60, sequential_execution: true,
  estimated_duration_days: 14,
  editor_job_title: 'Security Analyst', 
  publisher_job_title: 'General Counsel',
  run_validator_job_title: 'Compliance Officer',
  steps: [
    { id: 's-c-1', orderIndex: 0, text: 'Vendor Basic Information (Name, HQ Location, Primary Contact)', inputType: StepType.TEXT_INPUT, required: true },
    { id: 's-c-2', orderIndex: 1, text: 'Upload SOC2 Type II Report (Must be < 12 months old)', inputType: StepType.FILE_UPLOAD, required: true },
    { id: 's-c-3', orderIndex: 2, text: 'Upload ISO 27001 Certificate', inputType: StepType.FILE_UPLOAD, required: false },
    { id: 's-c-4', orderIndex: 3, text: 'GDPR Data Processing Addendum (DPA) - Enter Docusign Envelope ID', inputType: StepType.TEXT_INPUT, required: true, assignedTeamIds: ['Legal'] },
    { id: 's-c-5', orderIndex: 4, text: 'Security Analyst Risk Scoring (0-100)', inputType: StepType.TEXT_INPUT, required: true, assignedJobTitles: ['Security Analyst'] }
  ]
};

// D. IT: Incident Response (Fast)
const p_it_root = 'root-it-incident';
const itV5: ProcessDefinition = {
  id: 'p-it-v5', rootId: p_it_root, versionNumber: 5, status: 'PUBLISHED',
  title: 'P1 Incident Response Protocol', category: 'IT', isPublic: true,
  description: 'Emergency workflow for system outages or security breaches.',
  createdAt: getDate(10), createdBy: 'David Chen', publishedAt: getDate(9), publishedBy: 'David Chen',
  lastReviewedAt: getDate(9), lastReviewedBy: 'David Chen',
  review_frequency_days: 30, review_due_lead_days: 7, sequential_execution: true,
  estimated_duration_days: 1,
  editor_team_id: 'IT', 
  publisher_job_title: 'IT Manager',
  run_validator_job_title: 'IT Manager',
  steps: [
    { id: 's-i-1', orderIndex: 0, text: 'Acknowledge Alert & Declare Severity Level (SEV1-SEV5)', inputType: StepType.TEXT_INPUT, required: true, assignedTeamIds: ['IT'] },
    { id: 's-i-2', orderIndex: 1, text: 'Isolate Affected Systems / Kill Switch Activation', inputType: StepType.CHECKBOX, required: true, assignedJobTitles: ['DevOps Engineer'] },
    { id: 's-i-3', orderIndex: 2, text: 'Notify Executive Stakeholders (Paste Slack Thread Link)', inputType: StepType.TEXT_INPUT, required: true, assignedJobTitles: ['IT Manager'] },
    { id: 's-i-4', orderIndex: 3, text: 'Upload Post-Mortem Root Cause Analysis (RCA) PDF', inputType: StepType.FILE_UPLOAD, required: true }
  ]
};

// NEW: IT v6 (IN REVIEW)
const itV6Review: ProcessDefinition = {
  ...itV5,
  id: 'p-it-v6-review', versionNumber: 6, status: 'IN_REVIEW',
  description: 'P1 Incident Response - Updated with new CISO reporting line.',
  createdAt: getDate(1), createdBy: 'Grace Hopper', 
  steps: [
      ...itV5.steps,
      { id: 's-i-5-review', orderIndex: 4, text: 'Submit Regulatory Disclosure (GDPR/CCPA)', inputType: StepType.CHECKBOX, required: true, assignedTeamIds: ['Legal'] }
  ]
};

// E. FILLER PROCESSES & PURE DRAFTS
const fillerDefs = [
  { title: 'Travel Expense Reimbursement', cat: 'Finance', steps: ['Upload Receipts', 'Enter Total Amount', 'Manager Approval'], public: true },
  { title: 'Social Media Post Approval', cat: 'Marketing', steps: ['Draft Copy', 'Upload Creative Assets', 'Legal Check'], public: false }, 
  { title: 'Office Supply Requisition', cat: 'Operations', steps: ['List Items Needed', 'Budget Code'], public: true },
  { title: 'Code Production Deployment', cat: 'IT', steps: ['Peer Review Link', 'Pass CI/CD Checks', 'Deploy to Staging', 'Deploy to Prod'], public: false },
  { title: 'Quarterly Sales Business Review', cat: 'Sales', steps: ['Aggregate Pipeline Data', 'Upload Deck', 'VP Signoff'], public: false },
  { title: 'Contract Renewal Review', cat: 'Legal', steps: ['Review Terms', 'Upload Redline', 'Final Signoff'], public: false },
  { title: 'Visitor Access Request', cat: 'Operations', steps: ['Enter Visitor Name & Date'], public: true },
  { title: 'New Hardware Procurement', cat: 'IT', steps: ['Select Specs', 'Budget Approval', 'Order Confirmation ID'], public: true },
  { title: 'Customer Refund Authorization', cat: 'Finance', steps: ['Enter Transaction ID', 'Reason Code'], public: false },
  { title: 'Brand Asset Usage Request', cat: 'Marketing', steps: ['Upload Mockup'], public: true },
  { title: 'Internship Program Offboarding', cat: 'People', steps: ['Collect Badge', 'Wipe Laptop', 'Exit Interview Notes', 'Alumni Email'], public: false },
  { title: 'Remote Work Application', cat: 'People', steps: ['Reason for Request', 'Manager Approval'], public: true },
  { title: 'VPN Access Provisioning', cat: 'IT', steps: ['User ID', 'Grant Group Access'], public: true },
  { title: 'Petty Cash Reconciliation', cat: 'Finance', steps: ['Count Cash on Hand', 'Upload Count Sheet'], public: false },
  { title: 'Whistleblower Report Handling', cat: 'Legal', steps: ['Intake Report', 'Initial Assessment', 'Investigator Assignment', 'Final Report Upload', 'Board Notification'], public: true },
];

const fillerProcesses: ProcessDefinition[] = fillerDefs.map((def, idx) => ({
  id: `p-filler-${idx}`, rootId: `root-filler-${idx}`, versionNumber: 1, status: 'PUBLISHED',
  title: def.title, category: def.cat, isPublic: def.public,
  description: 'Standard operating procedure.',
  createdAt: getDate(100), createdBy: 'System', publishedAt: getDate(90), publishedBy: 'System',
  lastReviewedAt: getDate(30), lastReviewedBy: 'Alice Dubois',
  review_frequency_days: 365, review_due_lead_days: 30, sequential_execution: false,
  editor_team_id: def.cat,
  publisher_team_id: def.cat,
  run_validator_team_id: def.cat,
  estimated_duration_days: 3,
  steps: def.steps.map((stepText, i) => {
    // Smartly assign input types based on text content
    let type = StepType.CHECKBOX;
    if (stepText.includes('Upload') || stepText.includes('Receipt') || stepText.includes('Deck')) type = StepType.FILE_UPLOAD;
    else if (stepText.includes('Enter') || stepText.includes('List') || stepText.includes('Link') || stepText.includes('ID')) type = StepType.TEXT_INPUT;
    
    return {
        id: `s-fil-${idx}-${i}`, 
        orderIndex: i, 
        text: stepText, 
        inputType: type, 
        required: true, 
        assignedTeamIds: [def.cat]
    };
  })
}));

// Add a Draft v2 for "Social Media Post Approval" (Index 1 in filler)
const fillerSocialMediaV2: ProcessDefinition = {
    ...fillerProcesses[1],
    id: 'p-filler-1-v2', versionNumber: 2, status: 'DRAFT',
    title: 'Social Media Post Approval (2025)',
    createdAt: getDate(5), createdBy: 'Yara Shahidi', publishedAt: undefined, publishedBy: undefined,
    steps: [...fillerProcesses[1].steps, { id: 's-sm-3', orderIndex: 3, text: 'Check against new Brand Guidelines 2025', inputType: StepType.CHECKBOX, required: true }]
};

// NEW: Pure Drafts (Never Published)
const pureDraft1: ProcessDefinition = {
    id: 'p-pure-1', rootId: 'root-pure-1', versionNumber: 1, status: 'DRAFT',
    title: 'Office Relocation Plan (Paris HQ)', category: 'Operations', isPublic: false,
    description: 'Draft plan for Q4 office move. Not yet ready for execution.',
    createdAt: getDate(10), createdBy: 'Ursula K.',
    lastReviewedAt: getDate(10), lastReviewedBy: 'Ursula K.',
    review_frequency_days: 180, review_due_lead_days: 30, sequential_execution: true,
    steps: [
        { id: 's-pure-1-1', orderIndex: 0, text: 'Select potential real estate agents (List top 3)', inputType: StepType.TEXT_INPUT, required: true },
        { id: 's-pure-1-2', orderIndex: 1, text: 'Budget Approval from CFO (Upload Signed Memo)', inputType: StepType.FILE_UPLOAD, required: true }
    ]
};

const pureDraft2: ProcessDefinition = {
    id: 'p-pure-2', rootId: 'root-pure-2', versionNumber: 1, status: 'DRAFT',
    title: 'AI Usage Policy', category: 'Legal', isPublic: true,
    description: 'Internal policy for using LLMs and generative AI tools.',
    createdAt: getDate(3), createdBy: 'Eva Rossi',
    lastReviewedAt: getDate(3), lastReviewedBy: 'Eva Rossi',
    review_frequency_days: 180, review_due_lead_days: 30, sequential_execution: false,
    steps: [
        { id: 's-pure-2-1', orderIndex: 0, text: 'Review Terms of Service for OpenAI Enterprise', inputType: StepType.CHECKBOX, required: true },
        { id: 's-pure-2-2', orderIndex: 1, text: 'Define Data Privacy boundaries (Confidential vs Public)', inputType: StepType.TEXT_INPUT, required: true }
    ]
};


export const MOCK_PROCESSES: ProcessDefinition[] = [
  financeV2, financeV1, financeV3Draft, // Finance Family (v1, v2, v3 Draft)
  hrV3, 
  compV1, 
  itV5, itV6Review, // IT Family (v5, v6 Review)
  ...fillerProcesses,
  fillerSocialMediaV2, // Existing Filler family upgrade
  pureDraft1, pureDraft2 // Brand new drafts
];

// --- 3. GENERATING RUN HISTORY (The Time Machine) ---

const runs: ProcessRun[] = [];

// HISTORY: 6 Months of Financial Closes
['Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025'].forEach((month, idx) => {
  runs.push({
    id: `run-fin-${idx}`, rootProcessId: p_finance_root, versionId: idx < 2 ? 'p-fin-v1' : 'p-fin-v2',
    processTitle: 'Global Month-End Close', runName: `Close - ${month}`,
    startedBy: 'Bob Martin', startedAt: getDate(150 - (idx * 30)),
    completedAt: getDate(145 - (idx * 30)), validatedAt: getDate(144 - (idx * 30)), validatorUserId: 'u-1',
    status: 'APPROVED',
    stepValues: { 
        's-f-2': 'Variance: $0.45', 
        's-f-3': idx === 2 ? 'Adjusted +$45k (Year End)' : 'None' 
    },
    completedStepIds: ['s-f-1', 's-f-2', 's-f-3', 's-f-4', 's-f-5', 's-f-6'].slice(0, idx < 2 ? 4 : 6), 
    stepFeedback: {}, activityLog: [],
    healthScore: 100
  });
});

// HISTORY: A Rejected Vendor Assessment
runs.push({
  id: 'run-comp-fail', rootProcessId: p_comp_root, versionId: 'p-comp-v1',
  processTitle: 'Vendor Security Assessment (VSA)', runName: 'Vendor: Sketchy AI Startup',
  startedBy: 'Victor Hugo', startedAt: getDate(20),
  status: 'REJECTED',
  stepValues: { 
      's-c-1': 'SketchyAI, Cayman Islands',
      's-c-5': 'Risk Score: 15/100 (CRITICAL FAIL)'
  },
  completedStepIds: ['s-c-1'],
  stepFeedback: {
    's-c-2': [{ id: 'fb-1', stepId: 's-c-2', userId: 'u-10', userName: 'Noah Sols', text: 'SOC2 Report is expired (2022) and covers wrong entity.', type: 'BLOCKER', createdAt: getDate(19), resolved: false }]
  },
  activityLog: [{ id: 'l-1', userId: 'u-12', userName: 'Eva Rossi', action: 'Rejected Run', timestamp: getDate(18) }],
  healthScore: 0
});

// HISTORY: Cancelled Incident
runs.push({
  id: 'run-it-cancel', rootProcessId: p_it_root, versionId: 'p-it-v5',
  processTitle: 'P1 Incident Response', runName: 'Incident #9921 - False Alarm',
  startedBy: 'Grace Hopper', startedAt: getDate(40),
  status: 'CANCELLED',
  stepValues: { 's-i-1': 'Severity Low - Database flickering resolved by auto-scaling' },
  completedStepIds: ['s-i-1'],
  stepFeedback: {}, activityLog: [],
  healthScore: 50
});

// ACTIVE: Current Month Close (IN PROGRESS - Alice needs to act)
runs.push({
  id: 'run-fin-curr', rootProcessId: p_finance_root, versionId: 'p-fin-v2',
  processTitle: 'Global Month-End Close', runName: 'Close - March 2025',
  startedBy: 'Bob Martin', startedAt: getDate(2),
  dueAt: getFutureDate(3), // Due in 3 days
  healthScore: 95, // Healthy
  status: 'IN_PROGRESS',
  stepValues: { 's-f-2': 'Variance: $12.50' },
  completedStepIds: ['s-f-1', 's-f-2'], // Steps 3 (Controller/Alice) and 4 (Controller/Alice) are next
  stepFeedback: {}, activityLog: [{ id: 'l-curr-1', userId: 'u-2', userName: 'Bob Martin', action: 'Completed Intercompany Confirmation', timestamp: getDate(1) }]
});

// ACTIVE: Onboarding (IN REVIEW - Pending HR Director)
runs.push({
  id: 'run-hr-1', rootProcessId: p_hr_root, versionId: 'p-hr-v3',
  processTitle: 'Employee Onboarding Pipeline', runName: 'Onboard: John Doe (Eng)',
  startedBy: 'Tina Fey', startedAt: getDate(3),
  dueAt: getFutureDate(1), // Due tomorrow
  healthScore: 88,
  status: 'IN_REVIEW',
  stepValues: { 
      's-h-2': 'Asset Tag: NEX-LPT-2025-442',
      's-h-3': 'https://nexus.okta.com/users/jdoe/logs' 
  },
  completedStepIds: ['s-h-1', 's-h-2', 's-h-3', 's-h-4', 's-h-5'],
  stepFeedback: {}, activityLog: [{ id: 'l-hr-1', userId: 'u-6', userName: 'Tina Fey', action: 'Submitted for Review', timestamp: getDate(0) }]
});

// ACTIVE: Onboarding (BLOCKED - IT issue)
runs.push({
  id: 'run-hr-2', rootProcessId: p_hr_root, versionId: 'p-hr-v3',
  processTitle: 'Employee Onboarding Pipeline', runName: 'Onboard: Jane Smith (Sales)',
  startedBy: 'Tina Fey', startedAt: getDate(5),
  dueAt: getDate(-1), // OVERDUE by 1 day!
  healthScore: 45, // CRITICAL
  status: 'IN_PROGRESS',
  stepValues: {},
  completedStepIds: ['s-h-1'],
  stepFeedback: {
    's-h-2': [{ id: 'fb-hr-2', stepId: 's-h-2', userId: 'u-8', userName: 'David Chen', text: 'MacBook Pros are out of stock. ETA 2 days. Cannot provision asset tag yet.', type: 'BLOCKER', createdAt: getDate(1), resolved: false }]
  },
  activityLog: []
});

// ACTIVE: Vendor Assessment (READY TO SUBMIT)
runs.push({
  id: 'run-comp-curr', rootProcessId: p_comp_root, versionId: 'p-comp-v1',
  processTitle: 'Vendor Security Assessment', runName: 'Vendor: SuperSaaS Inc',
  startedBy: 'Alice Dubois', startedAt: getDate(4),
  dueAt: getFutureDate(10),
  healthScore: 98,
  status: 'READY_TO_SUBMIT',
  stepValues: { 
      's-c-1': 'SuperSaaS, SF', 
      's-c-4': 'Envelope: d83a-4421-9921',
      's-c-5': 'Risk Score: Low (85/100)' 
  },
  completedStepIds: ['s-c-1', 's-c-2', 's-c-3', 's-c-4', 's-c-5'],
  stepFeedback: {
    's-c-3': [{ id: 'fb-comp-1', stepId: 's-c-3', userId: 'u-13', userName: 'Rosa Parks', text: 'ISO cert expires next month, please flag for renewal.', type: 'ADVISORY', createdAt: getDate(2), resolved: false }]
  },
  activityLog: [
      { id: 'l-comp-5', userId: 'u-10', userName: 'Noah Sols', action: 'Completed Step 5: Risk Scoring', timestamp: getDate(0) },
      { id: 'l-comp-4', userId: 'u-12', userName: 'Eva Rossi', action: 'Completed Step 4: DPA', timestamp: getDate(1) }
  ]
});

// GENERATE 30 RANDOM COMPLETED FILLER RUNS
fillerProcesses.slice(0, 10).forEach((proc, i) => {
    runs.push({
        id: `run-fill-hist-${i}`, rootProcessId: proc.rootId, versionId: proc.id,
        processTitle: proc.title, runName: `${proc.title} - Ref #${1000+i}`,
        startedBy: 'System', startedAt: getDate(100 + i), completedAt: getDate(99 + i),
        status: 'COMPLETED', 
        stepValues: {
            [`s-fil-${i}-0`]: 'Confirmed', 
            [`s-fil-${i}-1`]: 'Approved'
        }, 
        completedStepIds: proc.steps.map(s => s.id),
        stepFeedback: {}, activityLog: [],
        healthScore: 100
    });
});

export const MOCK_INSTANCES: ProcessRun[] = runs;

// --- 4. GENERATING TASKS ---
const tasks: Task[] = [];

// Finance Close: Alice needs to do Step 3 and 4
tasks.push({ id: 't-1', runId: 'run-fin-curr', stepId: 's-f-3', assigneeJobTitle: 'Financial Controller', status: 'OPEN' });
tasks.push({ id: 't-2', runId: 'run-fin-curr', stepId: 's-f-4', assigneeJobTitle: 'Financial Controller', status: 'OPEN' });

// HR Blocked: IT Team needs to do Step 2
tasks.push({ id: 't-3', runId: 'run-hr-2', stepId: 's-h-2', assigneeTeamId: 'IT', status: 'OPEN' });

// Incident: IT Manager needs to Notify Stakeholders
tasks.push({ id: 't-4', runId: 'run-it-curr', stepId: 's-i-3', assigneeJobTitle: 'IT Manager', status: 'OPEN' }); // Assume created below

export const MOCK_TASKS: Task[] = tasks;

// --- 5. NOTIFICATIONS ---
export const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'n-1', type: 'RUN_BLOCKED', title: 'Onboarding Blocked', message: 'Jane Smith onboarding is blocked by IT procurement issue.', linkId: 'run-hr-2', linkType: 'RUN', read: false, timestamp: getDate(0) },
    { id: 'n-2', type: 'REVIEW_REQUIRED', title: 'Governance Review', message: 'Employee Onboarding (John Doe) requires your verification.', linkId: 'run-hr-1', linkType: 'RUN', read: false, timestamp: getDate(0) },
    { id: 'n-3', type: 'TASK_ASSIGNED', title: 'New Task: Month End', message: 'EBITDA Adjustment input required for March Close.', linkId: 'run-fin-curr', linkType: 'RUN', read: false, timestamp: getDate(1) },
    { id: 'n-4', type: 'PROCESS_OUTDATED', title: 'Audit Alert', message: 'Incident Response Protocol is due for quarterly review.', linkId: 'p-it-v5', linkType: 'PROCESS', read: true, timestamp: getDate(2) }
];
