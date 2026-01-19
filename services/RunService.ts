
import { Repository } from '../lib/repository';
import { ProcessRun, RunStatus } from '../types';

export class RunService extends Repository<ProcessRun> {
    constructor() {
        super('processos-v5-runs', []);
    }

    getActiveRuns(): ProcessRun[] {
        return this.data.filter(r => 
            r.status !== 'COMPLETED' && 
            r.status !== 'APPROVED' && 
            r.status !== 'CANCELLED' && 
            r.status !== 'REJECTED'
        );
    }

    calculateHealth(run: ProcessRun): number {
        if (!run.dueAt) return 100;
        
        const now = new Date();
        const due = new Date(run.dueAt);
        const diffMs = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            // Overdue: Lose 10 points per day overdue
            return Math.max(0, 100 - (Math.abs(diffDays) * 10));
        } else if (diffDays <= 2) {
            // Due soon: Slight hit
            return 80;
        }
        
        // Blockers kill health
        const hasBlockers = Object.values(run.stepFeedback).some(fbArray => 
            fbArray.some(f => f.type === 'BLOCKER' && !f.resolved)
        );

        if (hasBlockers) return 50;

        return 100;
    }

    updateHealth(runId: string): ProcessRun | undefined {
        const run = this.getById(runId);
        if (!run) return;
        
        const newHealth = this.calculateHealth(run);
        if (newHealth !== run.healthScore) {
            run.healthScore = newHealth;
            this.update(run);
        }
        return run;
    }
}
