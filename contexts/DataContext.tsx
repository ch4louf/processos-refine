
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ProcessDefinition, ProcessRun, Task } from '../types';
import { MOCK_PROCESSES, MOCK_INSTANCES, MOCK_TASKS } from '../services/mockData';
import { ProcessService } from '../services/ProcessService';
import { RunService } from '../services/RunService';
import { NotificationService } from '../services/NotificationService';
import { Reactor } from '../services/Reactor';
import { Repository } from '../lib/repository';

interface DataContextType {
  processes: ProcessDefinition[];
  runs: ProcessRun[];
  tasks: Task[];
  saveProcess: (process: ProcessDefinition) => void;
  saveProcesses: (processes: ProcessDefinition[]) => void;
  addRun: (run: ProcessRun) => void;
  updateRun: (run: ProcessRun) => void;
  saveTasks: (tasks: Task[]) => void;
  // Exposed services for advanced usage
  services: {
    process: ProcessService;
    run: RunService;
    notification: NotificationService;
  }
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize Services
  const processService = useMemo(() => new ProcessService(), []);
  const runService = useMemo(() => new RunService(), []);
  const notificationService = useMemo(() => new NotificationService(), []);
  const taskRepo = useMemo(() => new Repository<Task>('processos-v5-tasks', MOCK_TASKS), []);
  const reactor = useMemo(() => new Reactor(runService, notificationService), [runService, notificationService]);

  // React State for reactivity
  const [processes, setProcesses] = useState<ProcessDefinition[]>([]);
  const [runs, setRuns] = useState<ProcessRun[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Seed Data & Start Reactor
  useEffect(() => {
    // SEEDING LOGIC: If repositories are empty, seed them.
    if (processService.getAll().length === 0) processService.setAll(MOCK_PROCESSES);
    if (runService.getAll().length === 0) runService.setAll(MOCK_INSTANCES);
    // TaskRepo handles its own seeding in constructor via Repository class, but we sync state here
    
    // Sync React State
    refreshState();

    // Start Reactor
    reactor.startHeartbeat();
    
    return () => reactor.stopHeartbeat();
  }, []);

  const refreshState = () => {
    setProcesses(processService.getAll());
    setRuns(runService.getAll());
    setTasks(taskRepo.getAll());
  };

  const saveProcess = (process: ProcessDefinition) => {
    // If it exists update, else add
    if (processService.getById(process.id)) {
        processService.update(process);
    } else {
        processService.add(process);
    }
    refreshState();
  };

  const saveProcesses = (newProcesses: ProcessDefinition[]) => {
    processService.setAll(newProcesses);
    refreshState();
  };

  const addRun = (run: ProcessRun) => {
    runService.add(run);
    refreshState();
  };

  const updateRun = (updated: ProcessRun) => {
    runService.update(updated);
    refreshState();
  };

  const saveTasks = (newTasks: Task[]) => {
    taskRepo.setAll(newTasks);
    refreshState();
  };

  return (
    <DataContext.Provider value={{ 
      processes, 
      runs, 
      tasks, 
      saveProcess,
      saveProcesses,
      addRun, 
      updateRun,
      saveTasks,
      services: {
        process: processService,
        run: runService,
        notification: notificationService
      }
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
