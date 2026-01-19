
// A simple wrapper for LocalStorage to handle serialization and error safety
export const storage = {
    get: <T>(key: string, defaultValue: T): T => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading key ${key} from localStorage`, error);
            return defaultValue;
        }
    },
    set: <T>(key: string, value: T): void => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error writing key ${key} to localStorage`, error);
        }
    },
    remove: (key: string): void => {
        localStorage.removeItem(key);
    }
};
