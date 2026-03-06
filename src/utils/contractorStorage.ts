/**
 * Contractor management — save/load contractor info to IndexedDB.
 * Users can save contractor details and quickly fill them into forms.
 */

const DB_NAME = 'TaoHoSoDB';
const DB_VERSION = 3;
const STORE_SESSIONS = 'sessions';
const STORE_CONTRACTORS = 'contractors';

export interface Contractor {
    id?: number;
    name: string;
    representative: string;
    position: string;
    phone: string;
    taxCode: string;
    bankAccount: string;
    bank: string;
    createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
                db.createObjectStore(STORE_SESSIONS, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(STORE_CONTRACTORS)) {
                db.createObjectStore(STORE_CONTRACTORS, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('projects')) {
                db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function saveContractor(c: Omit<Contractor, 'id' | 'createdAt'> & { id?: number }): Promise<number> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CONTRACTORS, 'readwrite');
        const store = tx.objectStore(STORE_CONTRACTORS);
        const record: Contractor = { ...c, createdAt: new Date().toISOString() };
        if (c.id) {
            record.id = c.id;
            const putReq = store.put(record);
            putReq.onsuccess = () => resolve(putReq.result as number);
            putReq.onerror = () => reject(putReq.error);
        } else {
            const addReq = store.add(record);
            addReq.onsuccess = () => resolve(addReq.result as number);
            addReq.onerror = () => reject(addReq.error);
        }
    });
}

export async function listContractors(): Promise<Contractor[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CONTRACTORS, 'readonly');
        const req = tx.objectStore(STORE_CONTRACTORS).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function deleteContractor(id: number): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CONTRACTORS, 'readwrite');
        const req = tx.objectStore(STORE_CONTRACTORS).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

/** Map a Contractor to form data tags */
export function contractorToFormData(c: Contractor): Record<string, string> {
    return {
        'TÊN_NHÀ_THẦU': c.name,
        'ĐẠI_DIỆN_NHÀ_THẦU': c.representative,
        'CHỨC_VỤ_NHÀ_THẦU': c.position,
        'SĐT_NHÀ_THẦU': c.phone,
        'MÃ_SỐ_THUẾ': c.taxCode,
        'STK_NHÀ_THẦU': c.bankAccount,
        'NGÂN_HÀNG': c.bank,
    };
}

/** Extract contractor info from form data */
export function formDataToContractor(data: Record<string, string>): Omit<Contractor, 'id' | 'createdAt'> {
    return {
        name: data['TÊN_NHÀ_THẦU'] || '',
        representative: data['ĐẠI_DIỆN_NHÀ_THẦU'] || '',
        position: data['CHỨC_VỤ_NHÀ_THẦU'] || '',
        phone: data['SĐT_NHÀ_THẦU'] || '',
        taxCode: data['MÃ_SỐ_THUẾ'] || '',
        bankAccount: data['STK_NHÀ_THẦU'] || '',
        bank: data['NGÂN_HÀNG'] || '',
    };
}
