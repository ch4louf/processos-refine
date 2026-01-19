
import { storage } from './storage';

// Generic Repository implementing CRUD operations using LocalStorage as the backing store.
export class Repository<T extends { id: string }> {
    protected data: T[];
    
    constructor(protected storageKey: string, initialData: T[] = []) {
        // Load data on instantiation. 
        // If DB is empty (null), seed with initialData.
        const existing = localStorage.getItem(storageKey);
        if (existing) {
            this.data = JSON.parse(existing);
        } else {
            this.data = initialData;
            this.save();
        }
    }

    getAll(): T[] {
        return [...this.data];
    }

    getById(id: string): T | undefined {
        return this.data.find(item => item.id === id);
    }

    add(item: T): void {
        this.data = [item, ...this.data];
        this.save();
    }

    update(item: T): void {
        this.data = this.data.map(existing => existing.id === item.id ? item : existing);
        this.save();
    }

    delete(id: string): void {
        this.data = this.data.filter(item => item.id !== id);
        this.save();
    }

    // Bulk update for reordering or batch changes
    setAll(items: T[]): void {
        this.data = items;
        this.save();
    }

    private save(): void {
        storage.set(this.storageKey, this.data);
    }
}
