
import { RunService } from './RunService';
import { NotificationService } from './NotificationService';
import { ProcessRun } from '../types';

export class Reactor {
    private runService: RunService;
    private notifService: NotificationService;
    private intervalId: any;

    constructor(runService: RunService, notifService: NotificationService) {
        this.runService = runService;
        this.notifService = notifService;
    }

    startHeartbeat() {
        // Run immediately
        this.scan();
        // Run every 60 seconds
        this.intervalId = setInterval(() => this.scan(), 60000);
        console.log("Reactor Engine: Online");
    }

    stopHeartbeat() {
        if (this.intervalId) clearInterval(this.intervalId);
    }

    private scan() {
        const activeRuns = this.runService.getActiveRuns();
        
        activeRuns.forEach(run => {
            // 1. Update Health Score
            const oldHealth = run.healthScore ?? 100;
            const updatedRun = this.runService.updateHealth(run.id);
            const newHealth = updatedRun?.healthScore ?? 100;

            // 2. Check for SLA Breaches (Transition to Critical)
            if (oldHealth > 50 && newHealth <= 50) {
                this.triggerAlert(run, 'CRITICAL');
            }
            
            // 3. Check for overdue (absolute date)
            if (run.dueAt && new Date(run.dueAt) < new Date() && oldHealth > 0) {
                 // We don't want to spam, so we check if we recently sent one? 
                 // For MVP, we just send if health drops.
                 // In real app, we'd check a `lastNotifiedAt` field.
            }
        });
    }

    private triggerAlert(run: ProcessRun, level: 'CRITICAL' | 'WARNING') {
        this.notifService.createSystemNotification(
            level === 'CRITICAL' ? 'SLA Breach Detected' : 'Health Warning',
            `Run "${run.runName}" has dropped to critical health (${run.healthScore}%). Immediate attention required.`,
            'SLA_BREACH',
            run.id,
            'RUN'
        );
    }
}
