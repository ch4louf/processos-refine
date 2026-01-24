
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, WorkspaceSettings, Team } from '../types';
import { MOCK_USERS, MOCK_WORKSPACE, MOCK_TEAMS } from '../services/mockData';
import { Repository } from '../lib/repository';

interface UserContextType {
  users: User[];
  teams: Team[];
  currentUser: User;
  workspace: WorkspaceSettings;
  updateUsers: (users: User[]) => void;
  inviteUser: (user: User) => void;
  setCurrentUserId: (id: string) => void;
  addTeam: (team: Team) => void;
  updateTeam: (team: Team, oldName?: string) => void;
  deleteTeam: (id: string) => void;
  getUserColor: (teamName: string) => string;
  updateWorkspace: (settings: WorkspaceSettings) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userRepo = useMemo(() => new Repository<User>('processos-v5-users', MOCK_USERS), []);
  const teamRepo = useMemo(() => new Repository<Team>('processos-v5-teams', MOCK_TEAMS), []);
  
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceSettings>(MOCK_WORKSPACE);
  
  // Initialize current user ID from first user in repo (Mock Alice)
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    // Initial load with permission migration
    let allUsers = userRepo.getAll();
    let needsMigration = false;
    
    // Merge missing users from MOCK_USERS (e.g., newly added inactive users)
    const existingIds = new Set(allUsers.map(u => u.id));
    const missingUsers = MOCK_USERS.filter(mu => !existingIds.has(mu.id));
    if (missingUsers.length > 0) {
      allUsers = [...allUsers, ...missingUsers];
      needsMigration = true;
    }
    
    // Migrate: ensure all users have canAccessWorkspace field and proper permission names
    allUsers = allUsers.map(u => {
      if (u.permissions) {
        let needsUpdate = false;
        const newPerms = { ...u.permissions } as any;
        
        // Migrate old permission names to new ones
        if ('canDesign' in newPerms) {
          newPerms.canDesignProcess = newPerms.canDesign;
          delete newPerms.canDesign;
          needsUpdate = true;
        }
        if ('canVerifyDesign' in newPerms) {
          newPerms.canPublishProcess = newPerms.canVerifyDesign;
          delete newPerms.canVerifyDesign;
          needsUpdate = true;
        }
        if ('canExecute' in newPerms) {
          newPerms.canExecuteRun = newPerms.canExecute;
          delete newPerms.canExecute;
          needsUpdate = true;
        }
        if ('canVerifyRun' in newPerms) {
          newPerms.canValidateRun = newPerms.canVerifyRun;
          delete newPerms.canVerifyRun;
          needsUpdate = true;
        }
        
        // Ensure canAccessWorkspace exists
        if (newPerms.canAccessWorkspace === undefined) {
          const wasAdmin = newPerms.canDesignProcess && newPerms.canPublishProcess && 
                           newPerms.canExecuteRun && newPerms.canValidateRun && 
                           newPerms.canManageTeam && newPerms.canAccessBilling;
          newPerms.canAccessWorkspace = wasAdmin;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          needsMigration = true;
          return { ...u, permissions: newPerms };
        }
      }
      return u;
    });
    
    if (needsMigration) {
      userRepo.setAll(allUsers);
    }
    
    setUsers(allUsers);
    
    // Initial Team Load
    setTeams(teamRepo.getAll());
    
    if (allUsers.length > 0) {
        setCurrentUserId(allUsers[0].id);
    }
  }, []);

  const currentUser = useMemo(() => users.find(u => u.id === currentUserId) || users[0] || MOCK_USERS[0], [users, currentUserId]);

  const updateUsers = (newUsers: User[]) => {
    userRepo.setAll(newUsers);
    setUsers(newUsers);
  };

  const inviteUser = (user: User) => {
    userRepo.add(user);
    setUsers(userRepo.getAll());
  };

  const addTeam = (team: Team) => {
    teamRepo.add(team);
    setTeams(teamRepo.getAll());
  };

  const updateTeam = (team: Team, oldName?: string) => {
    teamRepo.update(team);
    if (oldName && oldName !== team.name) {
       // Cascade rename to users
       const currentUsers = userRepo.getAll();
       const updatedUsers = currentUsers.map(u => u.team === oldName ? { ...u, team: team.name } : u);
       updateUsers(updatedUsers);
    }
    setTeams(teamRepo.getAll());
  };

  const deleteTeam = (id: string) => {
    teamRepo.delete(id);
    setTeams(teamRepo.getAll());
  };

  const getUserColor = (teamName: string) => {
    const team = teams.find(t => t.name === teamName);
    const color = team?.color || 'slate';
    // Unified Pastel Badge Theme
    const map: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        slate: 'bg-slate-50 text-slate-700 border-slate-200',
        pink: 'bg-pink-50 text-pink-700 border-pink-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        gray: 'bg-gray-50 text-gray-700 border-gray-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    };
    return map[color] || map.slate;
  };

  const updateWorkspace = (newSettings: WorkspaceSettings) => {
    setWorkspace(newSettings);
    // In a real app, this would persist to backend
  };

  return (
    <UserContext.Provider value={{ 
      users, 
      teams,
      currentUser, 
      workspace, 
      updateUsers, 
      inviteUser,
      setCurrentUserId,
      addTeam,
      updateTeam,
      deleteTeam,
      getUserColor,
      updateWorkspace
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
