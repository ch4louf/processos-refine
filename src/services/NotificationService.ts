
import { Repository } from '../lib/repository';
import { Notification, NotificationType } from '../types';

export class NotificationService extends Repository<Notification> {
    constructor() {
        super('processos-v5-notifications', []);
    }

    createSystemNotification(title: string, message: string, type: NotificationType, linkId?: string, linkType?: any, userId?: string) {
        const n: Notification = {
            id: `n-${Date.now()}-${Math.random()}`,
            title,
            message,
            type,
            linkId,
            linkType,
            timestamp: new Date().toISOString(),
            read: false,
            userId // If null, global/broadcast or handled by UI filtering
        };
        this.add(n);
        return n;
    }

    getUnread(userId: string): Notification[] {
        return this.data.filter(n => !n.read && (n.userId === userId || !n.userId));
    }
}
