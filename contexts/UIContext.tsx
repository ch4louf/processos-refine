
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Notification, Toast, ToastType } from '../types';
import { NotificationService } from '../services/NotificationService';

interface UIContextType {
  notifications: Notification[];
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const notifService = useMemo(() => new NotificationService(), []);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Initial Load
    setNotifications(notifService.getAll());

    // Poll for changes (poor man's reactivity for shared service updates from Reactor)
    const interval = setInterval(() => {
        const current = notifService.getAll();
        // Simple length check or robust diff could go here. For now, simple sync.
        // In a real app, use RxJS or EventEmitters.
        setNotifications(current);
    }, 2000); 

    return () => clearInterval(interval);
  }, [notifService]);

  const showToast = useCallback((message: string, type: ToastType = 'SUCCESS') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const addNotification = (n: Notification) => {
    notifService.add(n);
    setNotifications(notifService.getAll());
  };

  const markNotificationAsRead = (id: string) => {
    const n = notifService.getById(id);
    if (n) {
        n.read = true;
        notifService.update(n);
        setNotifications(notifService.getAll());
    }
  };

  const markAllNotificationsAsRead = () => {
    const all = notifService.getAll();
    all.forEach(n => {
        n.read = true;
        notifService.update(n);
    });
    setNotifications(notifService.getAll());
  };

  return (
    <UIContext.Provider value={{ 
      notifications, 
      toasts, 
      showToast, 
      addNotification, 
      markNotificationAsRead,
      markAllNotificationsAsRead
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
