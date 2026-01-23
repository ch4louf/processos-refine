
import { Repository } from '../lib/repository';
import { ProcessDefinition, VersionStatus } from '../types';

export class ProcessService extends Repository<ProcessDefinition> {
    constructor() {
        super('processos-v5-processes', []);
    }

    getAll(): ProcessDefinition[] {
        return super.getAll();
    }

    getByRootId(rootId: string): ProcessDefinition[] {
        return this.data.filter(p => p.rootId === rootId);
    }

    getLatestVersion(rootId: string): ProcessDefinition | undefined {
        const versions = this.getByRootId(rootId);
        // Prioritize Published, then look for highest version number
        const published = versions.find(v => v.status === 'PUBLISHED');
        if (published) return published;
        
        return versions.sort((a,b) => b.versionNumber - a.versionNumber)[0];
    }

    publish(processId: string, userId: string, userName: string): ProcessDefinition {
        const process = this.getById(processId);
        if (!process) throw new Error("Process not found");

        // Archive current published version of this root
        this.data.forEach(p => {
            if (p.rootId === process.rootId && p.status === 'PUBLISHED') {
                p.status = 'ARCHIVED';
            }
        });

        // Publish new one
        process.status = 'PUBLISHED';
        process.publishedAt = new Date().toISOString();
        process.publishedBy = userName;
        process.lastReviewedAt = new Date().toISOString();
        process.lastReviewedBy = userName;

        this.update(process);
        return process;
    }
}
