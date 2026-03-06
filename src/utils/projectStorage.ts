/**
 * Project management — IndexedDB storage for construction projects.
 * Each project = 1 construction repair project with checklist, timeline, custom fields.
 */

const DB_NAME = 'TaoHoSoDB';
const DB_VERSION = 3;
const STORE_PROJECTS = 'projects';

/* ── Types ── */

export interface ChecklistItem {
    id: string;
    label: string;
    done: boolean;
    doneDate?: string;
}

export interface Milestone {
    id: string;
    label: string;
    date: string;
    status: 'pending' | 'done';
}

export interface CustomField {
    label: string;
    value: string;
}

export interface Project {
    id?: number;
    name: string;
    year: string;
    location: string;
    status: 'new' | 'in_progress' | 'completed';

    // Finance
    totalAmount: string;
    amountInWords: string;
    fundingSource: string;

    // Contractor
    contractorId?: number;
    contractorName: string;

    // Checklist
    checklist: ChecklistItem[];

    // Timeline
    milestones: Milestone[];

    // Custom fields
    customFields: CustomField[];

    // Notes
    notes: string;

    // Linked sessions
    sessionIds: number[];
    bundleSessionIds: string[];

    // Deadline
    deadline?: string;      // ISO date string for submission deadline
    deadlineLabel?: string; // e.g. "Hạn nộp hồ sơ"

    // Full form data (all fields from source form)
    formData?: Record<string, string>;
    formLabels?: Record<string, string>;
    selectedFields?: string[];  // fields user chose to track

    createdAt: string;
    updatedAt: string;
}

/* ── Default checklist for new projects ── */

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
    { id: 'tt', label: 'Tờ trình đề nghị', done: false },
    { id: 'dt', label: 'Dự toán chi tiết', done: false },
    { id: 'hd', label: 'Hợp đồng', done: false },
    { id: 'bbnt', label: 'Biên bản nghiệm thu', done: false },
    { id: 'bkct', label: 'Bảng kê chứng từ', done: false },
    { id: 'qt', label: 'Quyết toán', done: false },
];

export const DEFAULT_MILESTONES: Milestone[] = [
    { id: 'sign', label: 'Ký hợp đồng', date: '', status: 'pending' },
    { id: 'start', label: 'Khởi công', date: '', status: 'pending' },
    { id: 'inspect', label: 'Nghiệm thu', date: '', status: 'pending' },
    { id: 'payment', label: 'Thanh toán', date: '', status: 'pending' },
];

/* ── DB ── */

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            // Keep existing stores
            if (!db.objectStoreNames.contains('sessions')) {
                db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('contractors')) {
                db.createObjectStore('contractors', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
                db.createObjectStore(STORE_PROJECTS, { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/* ── CRUD ── */

export async function saveProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: number }): Promise<number> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readwrite');
        const store = tx.objectStore(STORE_PROJECTS);
        const now = new Date().toISOString();

        const record: Project = {
            ...project,
            createdAt: now,
            updatedAt: now,
        };

        if (project.id) {
            const getReq = store.get(project.id);
            getReq.onsuccess = () => {
                const existing = getReq.result as Project | undefined;
                if (existing) {
                    record.id = project.id;
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

export async function loadProject(id: number): Promise<Project | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readonly');
        const req = tx.objectStore(STORE_PROJECTS).get(id);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
    });
}

export async function listProjects(): Promise<Project[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readonly');
        const req = tx.objectStore(STORE_PROJECTS).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function deleteProject(id: number): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readwrite');
        const req = tx.objectStore(STORE_PROJECTS).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

/** Clone a project — creates a copy with "(Bản sao)" suffix */
export async function cloneProject(id: number): Promise<number> {
    const original = await loadProject(id);
    if (!original) throw new Error('Project not found');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = original;
    return saveProject({
        ...rest,
        name: original.name + ' (Bản sao)',
    });
}

/** Create a project from form data (MilitaryDocForm) */
export function createProjectFromFormData(
    data: Record<string, string>,
    sessionId?: number,
    labels?: Record<string, string>,
): Omit<Project, 'id' | 'createdAt' | 'updatedAt'> {
    return {
        name: data['TÊN_CT'] || data['TÊN_CÔNG_TRÌNH'] || data['CÔNG_TRÌNH'] || 'Dự án mới',
        year: data['NĂM'] || new Date().getFullYear().toString(),
        location: data['ĐỊA_CHỈ'] || '',
        status: 'new',
        totalAmount: data['SỐ_TIỀN'] || '',
        amountInWords: data['ST_BẰNG_CHỮ'] || '',
        fundingSource: data['NGUỒN_KP'] || data['NGUỒN_KINH_PHÍ'] || '',
        contractorName: data['TÊN_NHÀ_THẦU'] || '',
        checklist: DEFAULT_CHECKLIST.map(c => ({ ...c })),
        milestones: DEFAULT_MILESTONES.map(m => ({ ...m })),
        customFields: [],
        notes: '',
        sessionIds: sessionId ? [sessionId] : [],
        bundleSessionIds: [],
        formData: { ...data },
        formLabels: labels ? { ...labels } : undefined,
    };
}
