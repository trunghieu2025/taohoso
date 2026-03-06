/**
 * IndexedDB storage layer for saving/loading template sessions.
 * Each session = template file + tags + labels + form data.
 */

const DB_NAME = 'TaoHoSoDB';
const DB_VERSION = 3;
const STORE_NAME = 'sessions';

export interface SavedSession {
    id?: number;
    name: string;
    templateBuffer: ArrayBuffer;
    tags: string[];
    labels: Record<string, string>;
    data: Record<string, string>;
    fileType: 'word' | 'excel';
    isCustomTemplate: boolean;
    createdAt: string;
    updatedAt: string;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('contractors')) {
                db.createObjectStore('contractors', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('projects')) {
                db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/* ── CRUD ── */

export async function saveSession(session: Omit<SavedSession, 'id' | 'createdAt' | 'updatedAt'> & { id?: number }): Promise<number> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const now = new Date().toISOString();

        const record: SavedSession = {
            ...session,
            createdAt: now,
            updatedAt: now,
        };

        if (session.id) {
            // Update existing
            const getReq = store.get(session.id);
            getReq.onsuccess = () => {
                const existing = getReq.result as SavedSession | undefined;
                if (existing) {
                    record.id = session.id;
                    record.createdAt = existing.createdAt;
                }
                const putReq = store.put(record);
                putReq.onsuccess = () => resolve(putReq.result as number);
                putReq.onerror = () => reject(putReq.error);
            };
        } else {
            const addReq = store.add(record);
            addReq.onsuccess = () => resolve(addReq.result as number);
            addReq.onerror = () => reject(addReq.error);
        }
    });
}

export async function loadSession(id: number): Promise<SavedSession | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
    });
}

export async function listSessions(): Promise<SavedSession[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function deleteSession(id: number): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

/* ── JSON Export / Import ── */

export function exportSessionToJSON(session: SavedSession): void {
    const exportData = {
        name: session.name,
        tags: session.tags,
        labels: session.labels,
        data: session.data,
        fileType: session.fileType,
        exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ho-so-${session.name.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export interface ImportedData {
    name: string;
    tags: string[];
    labels: Record<string, string>;
    data: Record<string, string>;
    fileType: 'word' | 'excel';
}

export function importFromJSON(file: File): Promise<ImportedData> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const json = JSON.parse(reader.result as string);
                resolve({
                    name: json.name || file.name,
                    tags: json.tags || [],
                    labels: json.labels || {},
                    data: json.data || {},
                    fileType: json.fileType || 'word',
                });
            } catch (err) {
                reject(new Error('File JSON không hợp lệ'));
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

/* ── Auto-save helpers ── */

const AUTOSAVE_KEY = 'taohoso_autosave';

export function getAutoSaveId(): number | null {
    const val = localStorage.getItem(AUTOSAVE_KEY);
    return val ? parseInt(val, 10) : null;
}

export function setAutoSaveId(id: number): void {
    localStorage.setItem(AUTOSAVE_KEY, String(id));
}
