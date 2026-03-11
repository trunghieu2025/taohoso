import { useState, useRef, ChangeEvent, useCallback, useEffect } from 'react';
import {
    scanDuplicateTexts,
    extractTextSegments,
    computeDataScore,
    textToTag,
    STOP_WORDS,
    extractTags,
    createTemplateWithTags,
    fillTemplate,
    renderDocxPreview,
    contextLabelToTag,
    groupSimilarValues,
    isLikelyNoise,
    classifyFieldType,
    FIELD_CATEGORY_INFO,
} from '../utils/militaryDocGenerator';
import type { ScanResult } from '../utils/militaryDocGenerator';
import * as XLSX from 'xlsx';
import PizZip from 'pizzip';
import { FormInput } from '../components/FormField';
import { FORM_TEMPLATES } from '../utils/formTemplates';
import ScanReviewModal from '../components/ScanReviewModal';
import OnboardingTour from '../components/OnboardingTour';
import DocxPreview from '../components/DocxPreview';
import { evaluateFormula, isValidFormula } from '../utils/formulaEvaluator';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import { scanWordTables, fillWordTable, calculateTableData } from '../utils/wordTableUtils';
import type { TableInfo, TableConfig, TableColumn } from '../utils/wordTableUtils';
import { hasGoogleApiKey, uploadToDrive, exportToCSV, openSheetsWithData } from '../utils/googleApi';
import TableSetupModal from '../components/TableSetupModal';
import TableEditor from '../components/TableEditor';
import FieldSelectorModal from '../components/FieldSelectorModal';
import { numberToVietnamese } from '../utils/numberToVietnamese';
import { useNavigate } from 'react-router-dom';
import { logHistory } from './Dashboard';
import { saveProject, createProjectFromFormData } from '../utils/projectStorage';

/* ── Types ── */
interface BundleFile {
    name: string;
    folder: string;
    buffer: ArrayBuffer;
    tags: string[];
    templateBuffer: ArrayBuffer;
    selected: boolean;
}

interface BundleSession {
    id: string;
    name: string;
    date: string;
    data: Record<string, string>;
    labels: Record<string, string>;
    allTags: string[];
    fileNames: string[];
}

type FormChangeEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

/* ── Guide HTML ── */
const GUIDE_HTML = `
<h2 style="color:#0369a1;margin:0 0 0.75rem;font-size:1.3rem">📦 Hướng dẫn Gói mẫu nhiều file</h2>

<div style="background:#f0f9ff;border-radius:8px;padding:0.75rem;margin-bottom:1rem;border-left:4px solid #0ea5e9">
<b style="color:#0369a1">💡 Tính năng này dùng để làm gì?</b><br>
Khi làm hồ sơ dự án, bạn có <b>nhiều file Word</b> (HĐ giám sát, HĐ quản lý, BB thương thảo, QĐ, Bìa HĐ...) cùng chia sẻ <b>dữ liệu giống nhau</b> (tên công trình, nhà thầu, số tiền...). Thay vì mở từng file để sửa, bạn <b>điền 1 lần → xuất tất cả</b>.
</div>

<h3 style="color:#1e293b;margin:0.75rem 0 0.4rem;font-size:1.05rem">📌 Bước 1: Upload file</h3>
<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:0.5rem">
<tr style="background:#e0f2fe"><td style="padding:6px;border:1px solid #bae6fd;width:40%"><b>📄 Thêm file lẻ</b></td><td style="padding:6px;border:1px solid #bae6fd">Chọn file .docx, .xlsx, .xls</td></tr>
<tr><td style="padding:6px;border:1px solid #bae6fd"><b>📁 Thêm thư mục</b></td><td style="padding:6px;border:1px solid #bae6fd">Chọn cả thư mục → tự lọc file .docx/.xlsx</td></tr>
</table>
<div style="background:#fef3c7;padding:0.5rem;border-radius:6px;font-size:13px;margin-bottom:0.5rem">
<b>Ví dụ:</b> Bạn có 3 thư mục: <code>Giám Sát/</code>, <code>QLDA/</code>, <code>Xây Lắp/</code><br>
→ Bấm <b>📁 Thêm thư mục</b> 3 lần, mỗi lần chọn 1 thư mục<br>
→ Hệ thống tự gộp tất cả file .docx lại (bỏ file trùng tên)
</div>

<h3 style="color:#1e293b;margin:0.75rem 0 0.4rem;font-size:1.05rem">📌 Bước 2: Quét & tạo form</h3>
<p style="font-size:13px;margin:0 0 0.3rem">Khi có ≥2 file → bấm <b style="color:#10b981">🔍 Quét & tạo form</b></p>
<div style="background:#fef3c7;padding:0.5rem;border-radius:6px;font-size:13px;margin-bottom:0.5rem">
Hệ thống tự tìm <b>2 loại trường</b>:<br>
• <b>Dữ liệu trùng lặp</b>: text xuất hiện ≥2 lần → tự tạo trường<br>
• <b>📌 Trường [BRACKET]</b>: text trong dấu <code>[...]</code> → <b>luôn lấy</b> dù chỉ 1 lần<br>
→ Giảm nhiễu thông minh + gộp giá trị tương tự<br>
→ Bạn chỉ cần tích ✅ các trường cần tự động hóa
</div>

<h3 style="color:#1e293b;margin:0.75rem 0 0.4rem;font-size:1.05rem">📌 Bước 3: Điền form</h3>
<p style="font-size:13px;margin:0 0 0.3rem">Nhập dữ liệu <b>1 lần</b> → áp dụng cho <b>TẤT CẢ</b> file cùng lúc.</p>
<div style="background:#fef3c7;padding:0.5rem;border-radius:6px;font-size:13px;margin-bottom:0.5rem">
<b>Ví dụ:</b><br>
• Tên công trình: <i>"Sửa chữa nhà kho K59"</i><br>
• Nhà thầu: <i>"Công ty TNHH ABC"</i><br>
• Giá trị HĐ: <i>"1.500.000.000"</i><br>
→ Tất cả 8 file HĐ, BB, QĐ đều tự điền cùng lúc!
</div>

<h3 style="color:#1e293b;margin:0.75rem 0 0.4rem;font-size:1.05rem">📌 Bước 4: Bảng dữ liệu (nếu có)</h3>
<p style="font-size:13px;margin:0 0 0.3rem">Nếu file Word chứa <b>bảng</b> (bảng khối lượng, bảng dự toán...) → tự quét:</p>
<div style="background:#fef3c7;padding:0.5rem;border-radius:6px;font-size:13px;margin-bottom:0.5rem">
<b>Ví dụ:</b> File "Bảng khối lượng.docx" có bảng 6 cột:<br>
<table style="width:100%;border-collapse:collapse;font-size:12px;margin:0.3rem 0">
<tr style="background:#e2e8f0"><td style="padding:3px 6px;border:1px solid #cbd5e1"><b>TT</b></td><td style="padding:3px 6px;border:1px solid #cbd5e1"><b>Danh mục</b></td><td style="padding:3px 6px;border:1px solid #cbd5e1"><b>ĐVT</b></td><td style="padding:3px 6px;border:1px solid #cbd5e1"><b>Khối lượng</b></td><td style="padding:3px 6px;border:1px solid #cbd5e1"><b>Đơn giá</b></td><td style="padding:3px 6px;border:1px solid #cbd5e1"><b>Thành tiền</b></td></tr>
<tr><td style="padding:3px 6px;border:1px solid #cbd5e1">1</td><td style="padding:3px 6px;border:1px solid #cbd5e1">Xi măng</td><td style="padding:3px 6px;border:1px solid #cbd5e1">Tấn</td><td style="padding:3px 6px;border:1px solid #cbd5e1">50</td><td style="padding:3px 6px;border:1px solid #cbd5e1">2.000.000</td><td style="padding:3px 6px;border:1px solid #cbd5e1"><i>tự tính</i></td></tr>
</table>
→ Cấu hình: TT = <b>Tự đánh số</b>, Thành tiền = <b>Tự tính</b> (KHỐI_LƯỢNG × ĐƠN_GIÁ)<br>
→ <b>📊 Nhập từ Excel</b> để paste dữ liệu bảng nhanh
</div>

<h3 style="color:#1e293b;margin:0.75rem 0 0.4rem;font-size:1.05rem">📌 Bước 5: Xem trước & Xuất</h3>
<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:0.5rem">
<tr style="background:#e0f2fe"><td style="padding:6px;border:1px solid #bae6fd;width:35%"><b>👁️ Xem trước</b></td><td style="padding:6px;border:1px solid #bae6fd">Bấm tab tên file, dùng <b>−/+</b> để zoom</td></tr>
<tr><td style="padding:6px;border:1px solid #bae6fd"><b>📦 Xuất ZIP</b></td><td style="padding:6px;border:1px solid #bae6fd">Tải tất cả file đã chọn → 1 file ZIP</td></tr>
<tr style="background:#e0f2fe"><td style="padding:6px;border:1px solid #bae6fd"><b>⬇️ Xuất riêng</b></td><td style="padding:6px;border:1px solid #bae6fd">Xuất từng file Word riêng lẻ</td></tr>
<tr><td style="padding:6px;border:1px solid #bae6fd"><b>📄 Xuất PDF</b></td><td style="padding:6px;border:1px solid #bae6fd">Xuất file đang preview thành PDF</td></tr>
</table>

<h3 style="color:#1e293b;margin:0.75rem 0 0.4rem;font-size:1.05rem">📌 Quản lý dữ liệu</h3>
<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:0.5rem">
<tr style="background:#dcfce7"><td style="padding:5px 8px;border:1px solid #86efac;width:35%"><b>💾 Sao lưu</b></td><td style="padding:5px 8px;border:1px solid #86efac">Xuất dữ liệu → file JSON (backup)</td></tr>
<tr><td style="padding:5px 8px;border:1px solid #86efac"><b>📂 Khôi phục</b></td><td style="padding:5px 8px;border:1px solid #86efac">Tải lại từ file JSON đã backup</td></tr>
<tr style="background:#dcfce7"><td style="padding:5px 8px;border:1px solid #86efac"><b>📥 Nhập dữ liệu</b></td><td style="padding:5px 8px;border:1px solid #86efac">Import JSON → điền vào TẤT CẢ template</td></tr>
<tr><td style="padding:5px 8px;border:1px solid #86efac"><b>📤 Xuất dữ liệu</b></td><td style="padding:5px 8px;border:1px solid #86efac">Export data → dùng cho bộ file mới</td></tr>
<tr style="background:#dcfce7"><td style="padding:5px 8px;border:1px solid #86efac"><b>📊 Nhập từ Excel</b></td><td style="padding:5px 8px;border:1px solid #86efac">Map dữ liệu Excel vào form tự động</td></tr>
<tr><td style="padding:5px 8px;border:1px solid #86efac"><b>💿 Lưu phiên</b></td><td style="padding:5px 8px;border:1px solid #86efac">Lưu session vào trình duyệt</td></tr>
<tr style="background:#dcfce7"><td style="padding:5px 8px;border:1px solid #86efac"><b>📋 Nhân bản</b></td><td style="padding:5px 8px;border:1px solid #86efac">Copy session → session mới</td></tr>
<tr><td style="padding:5px 8px;border:1px solid #86efac"><b>🗑️ Xóa tất cả</b></td><td style="padding:5px 8px;border:1px solid #86efac">Reset toàn bộ form</td></tr>
</table>

<div style="background:#fef2f2;border-radius:6px;padding:0.5rem;font-size:13px;border-left:4px solid #ef4444">
<b style="color:#dc2626">⚠️ Lưu ý quan trọng:</b><br>
• Hỗ trợ file <b>.docx</b> (Word 2007+) và <b>.xlsx/.xls</b> (Excel)<br>
• Trường trong dấu <b>[...]</b> được tự nhận dạng<br>
• Dữ liệu xử lý <b>100% trên trình duyệt</b> — không upload lên server<br>
• Nên <b>💾 Sao lưu</b> thường xuyên để không mất dữ liệu<br>
• Dữ liệu <b>tự lưu mỗi 2 giây</b>, đóng trình duyệt mở lại vẫn còn
</div>

<h3 style="color:#1e293b;margin:0.75rem 0 0.4rem;font-size:1.05rem">⌨️ Phím tắt</h3>
<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:0.5rem">
<tr style="background:#e0f2fe"><td style="padding:5px 8px;border:1px solid #bae6fd;width:35%"><b>Ctrl + S</b></td><td style="padding:5px 8px;border:1px solid #bae6fd">Lưu nhanh phiên làm việc</td></tr>
<tr><td style="padding:5px 8px;border:1px solid #bae6fd"><b>Ctrl + Enter</b></td><td style="padding:5px 8px;border:1px solid #bae6fd">Bắt đầu quét (ở bước Upload)</td></tr>
</table>

<h3 style="color:#1e293b;margin:0.75rem 0 0.4rem;font-size:1.05rem">🆕 Công cụ mới</h3>
<table style="width:100%;border-collapse:collapse;font-size:13px">
<tr style="background:#ede9fe"><td style="padding:5px 8px;border:1px solid #c4b5fd;width:35%"><b>📊 Dashboard</b></td><td style="padding:5px 8px;border:1px solid #c4b5fd">Thống kê, lịch sử, QR Code, đánh số VB</td></tr>
<tr><td style="padding:5px 8px;border:1px solid #c4b5fd"><b>⚖️ So sánh file</b></td><td style="padding:5px 8px;border:1px solid #c4b5fd">Upload bản cũ & mới → highlight khác biệt</td></tr>
</table>`;

/* ── localStorage helpers ── */
const STORAGE_KEY = 'bundle_sessions';
const AUTOSAVE_KEY = 'bundle_autosave';
const PRESETS_KEY = 'bundle_presets';

interface FilePreset { id: string; name: string; date: string; fileNames: string[] }

function saveBundleSessions(sessions: BundleSession[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); }
function loadBundleSessions(): BundleSession[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function savePresets(p: FilePreset[]) { localStorage.setItem(PRESETS_KEY, JSON.stringify(p)); }
function loadPresets(): FilePreset[] { try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]'); } catch { return []; } }

/* ── Number detection for auto Vietnamese text ── */
const NUMBER_KEYWORDS = ['GIA_TRI', 'THANH_TIEN', 'TONG', 'SO_TIEN', 'GIA', 'CHI_PHI', 'KINH_PHI', 'DU_TOAN', 'PHI'];
function isMoneyField(tag: string): boolean {
    const upper = tag.toUpperCase();
    return NUMBER_KEYWORDS.some(k => upper.includes(k));
}

export default function BundleForm() {
    const navigate = useNavigate();
    /* ── State ── */
    const [files, setFiles] = useState<BundleFile[]>([]);
    const [allTags, setAllTags] = useState<string[]>([]);
    const [labels, setLabels] = useState<Record<string, string>>({});
    const [data, setData] = useState<Record<string, string>>({});
    const [stagedFiles, setStagedFiles] = useState<{ name: string; folder: string; buffer: ArrayBuffer }[]>([]);

    // Scan
    const [scanning, setScanning] = useState(false);
    const [showScanModal, setShowScanModal] = useState(false);
    const [scanResults, setScanResults] = useState<ScanResult[]>([]);

    // Preview
    const [activePreview, setActivePreview] = useState(0);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [zoom, setZoom] = useState(50);
    const previewRef = useRef<HTMLDivElement>(null);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const excelInputRef = useRef<HTMLInputElement>(null);

    // Table state
    const [fileTableInfos, setFileTableInfos] = useState<Record<string, TableInfo[]>>({});
    const [fileTableConfigs, setFileTableConfigs] = useState<Record<string, TableConfig>>({});
    const [fileTableData, setFileTableData] = useState<Record<string, string[][]>>({});
    const [showTableSetup, setShowTableSetup] = useState(false);
    const [tableSetupFile, setTableSetupFile] = useState('');
    const [activeTableFile, setActiveTableFile] = useState('');

    // UI
    const [step, setStep] = useState<'upload' | 'form'>('upload');
    const [exporting, setExporting] = useState(false);
    const [exportCount, setExportCount] = useState(0);
    const [showGuide, setShowGuide] = useState(false);
    const [savedSessions, setSavedSessions] = useState<BundleSession[]>([]);
    const [showMobilePreview, setShowMobilePreview] = useState(false);
    const [fieldSearch, setFieldSearch] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [presets, setPresets] = useState<FilePreset[]>([]);
    const [diffSessions, setDiffSessions] = useState<[string, string]>(['', '']);
    const [showDiff, setShowDiff] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [focusedTag, setFocusedTag] = useState<string | null>(null);
    const [showTour, setShowTour] = useState(false);
    const [formulas, setFormulas] = useState<Record<string, string>>({});
    const [activeFormulaTag, setActiveFormulaTag] = useState<string | null>(null);
    const [previewBuffer, setPreviewBuffer] = useState<ArrayBuffer | null>(null);
    const [previewName, setPreviewName] = useState('');

    // Load sessions + presets on mount + check for active template
    useEffect(() => {
        setSavedSessions(loadBundleSessions());
        setPresets(loadPresets());

        // Check if user came from Template Marketplace
        try {
            const templateJson = localStorage.getItem('taohoso_active_template');
            if (templateJson) {
                localStorage.removeItem('taohoso_active_template');
                const template = JSON.parse(templateJson);
                if (template?.fields?.length > 0) {
                    const tags = template.fields.map((f: { tag: string }) => f.tag);
                    const newLabels: Record<string, string> = {};
                    for (const f of template.fields) {
                        newLabels[f.tag] = f.label || f.tag;
                    }
                    setAllTags(tags);
                    setLabels(newLabels);
                    setStep('form');
                    alert(`✅ Đã tải bộ mẫu "${template.name}" với ${tags.length} trường.\n\n📁 Upload file Word rồi điền dữ liệu nhé!`);
                }
            }
        } catch { /* ignore */ }
    }, []);

    // Auto-save
    useEffect(() => {
        if (step !== 'form' || allTags.length === 0) return;
        const timer = setTimeout(() => {
            const session: BundleSession = {
                id: '__autosave__',
                name: 'Tự động lưu',
                date: new Date().toISOString(),
                data, labels, allTags,
                fileNames: files.map(f => f.name),
            };
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(session));
        }, 2000);
        return () => clearTimeout(timer);
    }, [data, step, allTags, labels, files]);

    // Keyboard shortcuts: Ctrl+S save, Ctrl+Enter scan/submit
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                // Force auto-save
                if (step === 'form' && allTags.length > 0) {
                    const session: BundleSession = {
                        id: '__autosave__', name: 'Tự động lưu (Ctrl+S)',
                        date: new Date().toISOString(), data, labels, allTags,
                        fileNames: files.map(f => f.name),
                    };
                    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(session));
                    // Flash save indicator
                    document.title = '✅ Đã lưu!';
                    setTimeout(() => { document.title = 'Tạo Hồ Sơ - Gói mẫu nhiều file'; }, 1500);
                }
            }
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                if (step === 'upload' && stagedFiles.length > 0) {
                    handleStartScan();
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });

    /* ── Upload (accumulative) ── */
    const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;
        const newFiles: { name: string; folder: string; buffer: ArrayBuffer }[] = [];
        for (let i = 0; i < fileList.length; i++) {
            const f = fileList[i];
            const isDocx = f.name.endsWith('.docx');
            const isXlsx = f.name.endsWith('.xlsx') || f.name.endsWith('.xls');
            if ((!isDocx && !isXlsx) || f.name.startsWith('~')) continue;
            const buf = await f.arrayBuffer();
            const relPath = (f as any).webkitRelativePath || '';
            const folder = relPath ? relPath.split('/').slice(0, -1).join('/') : '';
            newFiles.push({ name: f.name, folder, buffer: buf });
        }
        if (newFiles.length === 0) { alert('Không tìm thấy file .docx/.xlsx nào.'); return; }
        setStagedFiles(prev => {
            const existing = new Set(prev.map(f => f.name));
            const unique = newFiles.filter(f => !existing.has(f.name));
            if (unique.length < newFiles.length) alert(`Bỏ qua ${newFiles.length - unique.length} file trùng tên.`);
            return [...prev, ...unique];
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (folderInputRef.current) folderInputRef.current.value = '';
    };

    /* ── Drag & Drop ── */
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const items = e.dataTransfer.items;
        const newFiles: { name: string; folder: string; buffer: ArrayBuffer }[] = [];
        for (let i = 0; i < items.length; i++) {
            const entry = items[i].webkitGetAsEntry?.();
            if (entry) {
                const files = await readEntry(entry);
                newFiles.push(...files);
            } else {
                const f = items[i].getAsFile();
                if (f && (f.name.endsWith('.docx') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) && !f.name.startsWith('~')) {
                    newFiles.push({ name: f.name, folder: '', buffer: await f.arrayBuffer() });
                }
            }
        }
        if (newFiles.length === 0) { alert('Không tìm thấy file .docx/.xlsx nào.'); return; }
        setStagedFiles(prev => {
            const existing = new Set(prev.map(f => f.name));
            const unique = newFiles.filter(f => !existing.has(f.name));
            if (unique.length < newFiles.length) alert(`Bỏ qua ${newFiles.length - unique.length} file trùng tên.`);
            return [...prev, ...unique];
        });
    };

    const readEntry = async (entry: any): Promise<{ name: string; folder: string; buffer: ArrayBuffer }[]> => {
        if (entry.isFile) {
            return new Promise(resolve => {
                entry.file(async (f: File) => {
                    if ((f.name.endsWith('.docx') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) && !f.name.startsWith('~')) {
                        resolve([{ name: f.name, folder: entry.fullPath.replace('/' + f.name, '').replace(/^\//, ''), buffer: await f.arrayBuffer() }]);
                    } else resolve([]);
                });
            });
        }
        if (entry.isDirectory) {
            const reader = entry.createReader();
            return new Promise(resolve => {
                reader.readEntries(async (entries: any[]) => {
                    const all = await Promise.all(entries.map(readEntry));
                    resolve(all.flat());
                });
            });
        }
        return [];
    };

    const removeStagedFile = (idx: number) => setStagedFiles(prev => prev.filter((_, i) => i !== idx));

    /* ── Scan (cross-file: gộp text từ TẤT CẢ file, rồi mới đếm trùng lặp) ── */
    const handleStartScan = () => {
        if (stagedFiles.length === 0) return;
        setScanning(true);

        // Bước 1: Gộp ALL text segments từ tất cả file vào 1 pool
        const allSegments: { text: string; location: string }[] = [];
        const allContextLabels = new Map<string, string>();
        const crossFileValues = new Map<string, Set<string>>();

        for (const f of stagedFiles) {
            const isXlsx = f.name.endsWith('.xlsx') || f.name.endsWith('.xls');

            if (isXlsx) {
                // Extract text from Excel cells
                try {
                    const wb = XLSX.read(f.buffer, { type: 'array' });
                    for (const sheetName of wb.SheetNames) {
                        const sheet = wb.Sheets[sheetName];
                        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
                        for (let r = range.s.r; r <= range.e.r; r++) {
                            for (let c = range.s.c; c <= range.e.c; c++) {
                                const addr = XLSX.utils.encode_cell({ r, c });
                                const cell = sheet[addr];
                                if (cell && cell.v != null) {
                                    const text = String(cell.v).trim();
                                    if (text.length >= 3 && !/^\d{1,2}$/.test(text)) {
                                        const loc = `[${f.name}] ${sheetName}!${addr}`;
                                        allSegments.push({ text, location: loc });
                                        if (!crossFileValues.has(text)) crossFileValues.set(text, new Set());
                                        crossFileValues.get(text)!.add(f.name);
                                    }
                                }
                            }
                        }
                    }
                } catch (e) { console.warn('Excel parse error:', f.name, e); }
            } else {
                // Extract text from docx
                const { segments, contextLabels } = extractTextSegments(f.buffer);
                for (const seg of segments) {
                    allSegments.push({ text: seg.text, location: `[${f.name}] ${seg.location}` });
                    if (!crossFileValues.has(seg.text)) crossFileValues.set(seg.text, new Set());
                    crossFileValues.get(seg.text)!.add(f.name);
                }
                for (const [k, v] of contextLabels) {
                    if (!allContextLabels.has(k)) allContextLabels.set(k, v);
                }
            }
        }

        // Bước 2: Đếm tổng số lần xuất hiện (xuyên file)
        const countMap = new Map<string, { count: number; locations: string[] }>();
        for (const seg of allSegments) {
            if (!countMap.has(seg.text)) {
                countMap.set(seg.text, { count: 0, locations: [] });
            }
            const entry = countMap.get(seg.text)!;
            entry.count++;
            if (entry.locations.length < 8) {
                entry.locations.push(seg.location);
            }
        }

        // Bước 2.5: Tìm trường [BRACKET] — xuất hiện 1 lần vẫn lấy
        const bracketFields = new Set<string>();
        for (const f of stagedFiles) {
            if (f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) continue;
            try {
                const zip = new PizZip(f.buffer);
                const xml = zip.file('word/document.xml')?.asText() || '';
                // Find all [TEXT] patterns in raw XML (handles split tags)
                const cleanXml = xml.replace(/<[^>]+>/g, '');
                const bracketRegex = /\[([^\[\]]{2,80})\]/g;
                let match;
                while ((match = bracketRegex.exec(cleanXml)) !== null) {
                    const inner = match[1].trim();
                    if (inner.length >= 2 && !/^\d+$/.test(inner)) {
                        bracketFields.add(inner);
                        // Also add to countMap if not there
                        const fullText = `[${inner}]`;
                        if (!countMap.has(fullText)) {
                            countMap.set(fullText, { count: 1, locations: [`[${f.name}] bracket field`] });
                        }
                    }
                }
            } catch { /* skip */ }
        }

        // Bước 3: Lọc — ≥2 lần tổng cộng HOẶC là bracket field
        const rawResults = new Map<string, ScanResult>();
        for (const [text, info] of countMap) {
            const isBracket = text.startsWith('[') && text.endsWith(']') && bracketFields.has(text.slice(1, -1));
            // Skip if count < 2 AND not a bracket field
            if (info.count < 2 && !isBracket) continue;
            if (text.length < 2) continue;
            if (/^\d+[.,]?\d*$/.test(text)) continue;
            if (!isBracket && STOP_WORDS.has(text)) continue;
            if (!isBracket && STOP_WORDS.has(text.toLowerCase())) continue;

            const fileCount = crossFileValues.get(text)?.size || 1;
            let score = computeDataScore(text);
            if (fileCount > 1) score = Math.min(100, score + 20);
            // Bracket fields get high score automatically
            if (isBracket) score = Math.max(score, 85);
            const category = score >= 50 ? 'data' as const : 'boilerplate' as const;
            const ctxLabel = allContextLabels.get(text);

            // Smart tag: bracket field → use inner text as tag
            let tag = textToTag(text);
            if (isBracket) {
                const inner = text.slice(1, -1).trim();
                tag = textToTag(inner);
            } else if (ctxLabel) {
                const smartTag = contextLabelToTag(ctxLabel);
                if (smartTag) tag = smartTag;
            }

            // Noise classification
            const noise = !isBracket && isLikelyNoise(text, score);

            rawResults.set(text, {
                text,
                count: info.count,
                locations: info.locations,
                suggestedTag: tag,
                suggestedLabel: isBracket
                    ? `📌 ${text}` // Mark bracket fields with pin
                    : (text.length > 30 ? text.slice(0, 30) + '...' : text),
                selected: isBracket || (!noise && category === 'data' && text.length >= 4),
                category: isBracket ? 'data' : category,
                dataScore: noise ? Math.max(0, score - 30) : score,
                crossFileCount: fileCount,
                contextLabel: ctxLabel,
            });
        }

        // Bước 4: Fuzzy grouping — gộp các giá trị tương tự
        const allTexts = [...rawResults.keys()];
        const groups = groupSimilarValues(allTexts);
        const mergedResults: ScanResult[] = [];

        for (const [rep, members] of groups) {
            const repResult = rawResults.get(rep)!;
            if (members.length > 1) {
                // Merge counts and locations from all members
                let totalCount = 0;
                const allLocs: string[] = [];
                let maxScore = 0;
                let maxFileCount = 0;
                for (const m of members) {
                    const mr = rawResults.get(m);
                    if (mr) {
                        totalCount += mr.count;
                        allLocs.push(...mr.locations);
                        maxScore = Math.max(maxScore, mr.dataScore);
                        maxFileCount = Math.max(maxFileCount, mr.crossFileCount || 1);
                    }
                }
                mergedResults.push({
                    ...repResult,
                    count: totalCount,
                    locations: allLocs.slice(0, 8),
                    dataScore: maxScore,
                    crossFileCount: maxFileCount,
                    suggestedLabel: repResult.text.length > 30
                        ? repResult.text.slice(0, 30) + ` (+${members.length - 1} biến thể)`
                        : repResult.text + (members.length > 1 ? ` (+${members.length - 1})` : ''),
                });
            } else {
                mergedResults.push(repResult);
            }
        }

        // Bước 5: Phân loại trường + Sort thông minh
        for (const r of mergedResults) {
            const isBrk = r.text.startsWith('[') && r.text.endsWith(']') && bracketFields.has(r.text.slice(1, -1));
            r.fieldType = classifyFieldType(r.text, r.suggestedTag, isBrk);
        }

        const sorted = mergedResults.sort((a, b) => {
            // Sort by category order first
            const orderA = FIELD_CATEGORY_INFO[a.fieldType || 'other'].order;
            const orderB = FIELD_CATEGORY_INFO[b.fieldType || 'other'].order;
            if (orderA !== orderB) return orderA - orderB;
            // Within same category: selected first
            if (a.selected !== b.selected) return a.selected ? -1 : 1;
            // Then by cross-file count
            if ((b.crossFileCount || 0) !== (a.crossFileCount || 0))
                return (b.crossFileCount || 0) - (a.crossFileCount || 0);
            // Then by score
            return b.dataScore - a.dataScore;
        });
        setScanResults(sorted);
        setShowScanModal(true);
        setScanning(false);
    };

    /* ── Scan confirm ── */
    const handleScanConfirm = (selected: { text: string; tag: string; label: string }[]) => {
        const replacements = selected.map(r => ({ text: r.text, tag: r.tag }));
        if (replacements.length === 0) { alert('Vui lòng chọn ít nhất 1 trường.'); return; }
        const bundleFiles: BundleFile[] = stagedFiles.map(f => {
            const templateBuffer = createTemplateWithTags(f.buffer, replacements);
            const tags = extractTags(templateBuffer);
            return { name: f.name, folder: f.folder, buffer: f.buffer, templateBuffer, tags, selected: true };
        });
        const tagSet = new Set<string>();
        bundleFiles.forEach(f => f.tags.forEach(t => tagSet.add(t)));
        const newLabels: Record<string, string> = {};
        for (const r of selected) newLabels[r.tag] = r.label || r.text.slice(0, 50);
        setFiles(bundleFiles);
        setAllTags([...tagSet].sort());
        setLabels(newLabels);
        setData({});
        setShowScanModal(false);
        setStep('form');

        // Auto-scan tables in each file
        const infos: Record<string, TableInfo[]> = {};
        for (const bf of bundleFiles) {
            try {
                const tables = scanWordTables(bf.templateBuffer);
                if (tables.length > 0) infos[bf.name] = tables;
            } catch { /* skip files without tables */ }
        }
        setFileTableInfos(infos);
        setFileTableConfigs({});
        setFileTableData({});
    };

    /* ── Table config confirm ── */
    const handleTableConfigConfirm = (config: TableConfig) => {
        setFileTableConfigs(prev => ({ ...prev, [tableSetupFile]: config }));
        // Init empty data rows based on table data
        const tables = fileTableInfos[tableSetupFile];
        if (tables && tables[config.tableIndex]) {
            const t = tables[config.tableIndex];
            const rowCount = Math.max(t.dataRowCount, 1);
            const colCount = config.columns.length;
            const initData = Array.from({ length: rowCount }, (_, ri) =>
                Array.from({ length: colCount }, (_, ci) =>
                    t.allData[ri]?.[ci] || ''
                )
            );
            setFileTableData(prev => ({ ...prev, [tableSetupFile]: initData }));
        }
        setShowTableSetup(false);
    };

    /* ── Table data change ── */
    const handleTableDataChange = (fileName: string, newData: string[][]) => {
        setFileTableData(prev => ({ ...prev, [fileName]: newData }));
    };

    /* ── Fill template with both tags AND table data ── */
    const fillFileComplete = (f: BundleFile): ArrayBuffer => {
        // First fill text tags
        let result = fillTemplate(f.templateBuffer, data);
        // Then fill table if configured
        const config = fileTableConfigs[f.name];
        const tData = fileTableData[f.name];
        if (config && tData) {
            const calculated = calculateTableData(tData, config.columns);
            result = fillWordTable(result, config.tableIndex, calculated);
        }
        return result;
    };

    /* ── Form with auto number-to-text ── */
    const handleChange = useCallback((e: FormChangeEvent) => {
        const { name, value } = e.target;
        setData(prev => {
            const next = { ...prev, [name]: value };
            // Auto-fill "bằng chữ" field for money fields
            if (isMoneyField(name)) {
                const textTag = name + '_BANG_CHU';
                const vn = numberToVietnamese(value);
                if (vn) next[textTag] = vn;
            }
            return next;
        });
    }, []);

    /* ── Preset management ── */
    const handleSavePreset = () => {
        const name = prompt('Đặt tên cho bộ file mẫu:');
        if (!name) return;
        const preset: FilePreset = { id: Date.now().toString(), name, date: new Date().toISOString(), fileNames: stagedFiles.map(f => f.name) };
        const updated = [...presets, preset];
        savePresets(updated);
        setPresets(updated);
        alert(`Đã lưu bộ mẫu "${name}" (${stagedFiles.length} file).`);
    };

    const handleDeletePreset = (id: string) => {
        const updated = presets.filter(p => p.id !== id);
        savePresets(updated);
        setPresets(updated);
    };

    /* ── B1: Reverse Fill — Export/Import data JSON ── */
    const handleExportData = () => {
        const exportObj = { data, labels, allTags, exportDate: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'bo-du-lieu-ho-so.json'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportData = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const imported = JSON.parse(text);
                if (imported.data && typeof imported.data === 'object') {
                    setData(prev => ({ ...prev, ...imported.data }));
                    if (imported.labels) setLabels(prev => ({ ...prev, ...imported.labels }));
                    if (imported.allTags) {
                        setAllTags(prev => {
                            const merged = new Set([...prev, ...imported.allTags]);
                            return [...merged].sort();
                        });
                    }
                    alert(`✅ Đã nhập ${Object.keys(imported.data).length} trường dữ liệu!`);
                    logHistory('Nhập dữ liệu từ JSON', file.name, Object.keys(imported.data).length);
                } else {
                    alert('File JSON không hợp lệ. Cần có trường "data".');
                }
            } catch { alert('Lỗi đọc file JSON.'); }
        };
        input.click();
    };

    /* ── Batch export from Excel ── */
    const handleBatchExport = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || files.length === 0) return;
        const selectedFiles = files.filter(f => f.selected);
        if (selectedFiles.length === 0) { alert('Chọn ít nhất 1 file.'); return; }
        setExporting(true);
        try {
            const XLSX = await import('xlsx');
            const buf = await file.arrayBuffer();
            const wb = XLSX.read(buf, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
            if (rows.length === 0) { alert('File Excel rỗng.'); setExporting(false); return; }

            const zip = new JSZip();
            for (let ri = 0; ri < rows.length; ri++) {
                const rowData: Record<string, string> = { ...data };
                // Map Excel columns to tags
                for (const tag of allTags) {
                    const tagLower = tag.toLowerCase().replace(/_/g, ' ');
                    for (const [col, val] of Object.entries(rows[ri])) {
                        if (col.toLowerCase().includes(tagLower) || tagLower.includes(col.toLowerCase())) {
                            rowData[tag] = String(val);
                            if (isMoneyField(tag)) {
                                const vn = numberToVietnamese(String(val));
                                if (vn) rowData[tag + '_BANG_CHU'] = vn;
                            }
                            break;
                        }
                    }
                }
                const folderName = `Bo_${ri + 1}_${Object.values(rows[ri])[0] || ''}`
                    .replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1E00-\u1EFF ]/g, '').slice(0, 60);
                for (const f of selectedFiles) {
                    let filled = fillTemplate(f.templateBuffer, rowData);
                    const config = fileTableConfigs[f.name];
                    const tData = fileTableData[f.name];
                    if (config && tData) {
                        const calculated = calculateTableData(tData, config.columns);
                        filled = fillWordTable(filled, config.tableIndex, calculated);
                    }
                    zip.file(`${folderName}/${f.name}`, new Blob([filled]));
                }
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            saveAs(zipBlob, `HangLoat_${rows.length}bo_${selectedFiles.length}file.zip`);
            setExportCount(prev => prev + rows.length);
            alert(`Đã xuất ${rows.length} bộ × ${selectedFiles.length} file = ${rows.length * selectedFiles.length} file!`);
        } catch (err) { alert('Lỗi xuất hàng loạt: ' + (err as Error).message); }
        setExporting(false);
        if (e.target) e.target.value = '';
    };

    /* ── Preview ── */
    const handlePreview = async (idx: number) => {
        if (!files[idx] || !previewRef.current) return;
        setActivePreview(idx);
        setPreviewLoading(true);
        try { await renderDocxPreview(files[idx].templateBuffer, data, previewRef.current); }
        catch (err) { previewRef.current.innerHTML = `<p style="color:red">Lỗi: ${(err as Error).message}</p>`; }
        setPreviewLoading(false);
    };

    /* ── File selection ── */
    const toggleFileSelection = (idx: number) => setFiles(prev => prev.map((f, i) => i === idx ? { ...f, selected: !f.selected } : f));
    const selectAll = () => setFiles(prev => prev.map(f => ({ ...f, selected: true })));
    const deselectAll = () => setFiles(prev => prev.map(f => ({ ...f, selected: false })));

    /* ── Clear all data ── */
    const handleClearAll = () => {
        if (!confirm('Xóa tất cả dữ liệu đã nhập?')) return;
        setData({});
    };

    /* ── Clone session ── */
    const handleClone = () => {
        const session: BundleSession = {
            id: Date.now().toString(),
            name: `Bản sao ${new Date().toLocaleString('vi-VN')}`,
            date: new Date().toISOString(),
            data: { ...data }, labels: { ...labels }, allTags: [...allTags],
            fileNames: files.map(f => f.name),
        };
        const sessions = [...savedSessions, session];
        saveBundleSessions(sessions);
        setSavedSessions(sessions);
        alert('Đã nhân bản thành công!');
    };

    /* ── Save/Load sessions ── */
    const handleSaveSession = () => {
        const name = prompt('Đặt tên cho phiên này:');
        if (!name) return;
        const session: BundleSession = {
            id: Date.now().toString(), name, date: new Date().toISOString(),
            data: { ...data }, labels: { ...labels }, allTags: [...allTags],
            fileNames: files.map(f => f.name),
        };
        const sessions = [...savedSessions, session];
        saveBundleSessions(sessions);
        setSavedSessions(sessions);
        alert('Đã lưu!');
    };

    const handleLoadSession = (session: BundleSession) => {
        setData(session.data);
        setLabels(session.labels);
        setAllTags(session.allTags);
        alert(`Đã tải "${session.name}". Lưu ý: cần upload lại file template nếu chưa có.`);
    };

    const handleDeleteSession = (id: string) => {
        const sessions = savedSessions.filter(s => s.id !== id);
        saveBundleSessions(sessions);
        setSavedSessions(sessions);
    };

    /* ── Backup/Restore JSON ── */
    const handleBackup = () => {
        const backup = { data, labels, allTags, fileNames: files.map(f => f.name), date: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        saveAs(blob, `GoiMau_backup_${new Date().toISOString().slice(0, 10)}.json`);
    };

    const handleRestore = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const backup = JSON.parse(reader.result as string);
                if (backup.data) setData(backup.data);
                if (backup.labels) setLabels(backup.labels);
                if (backup.allTags) setAllTags(backup.allTags);
                alert('Đã khôi phục dữ liệu! Cần upload lại file template nếu chưa có.');
            } catch { alert('File JSON không hợp lệ.'); }
        };
        reader.readAsText(file);
    };

    /* ── Excel import ── */
    const handleExcelImport = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const XLSX = await import('xlsx');
            const buf = await file.arrayBuffer();
            const wb = XLSX.read(buf, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
            if (rows.length === 0) { alert('File Excel rỗng.'); return; }
            // Map first row values to tags
            const firstRow = rows[0];
            const newData: Record<string, string> = { ...data };
            for (const tag of allTags) {
                const tagLower = tag.toLowerCase().replace(/_/g, ' ');
                for (const [col, val] of Object.entries(firstRow)) {
                    if (col.toLowerCase().includes(tagLower) || tagLower.includes(col.toLowerCase())) {
                        newData[tag] = String(val);
                        break;
                    }
                }
            }
            setData(newData);
            alert(`Đã nhập dữ liệu từ "${file.name}" (${Object.keys(firstRow).length} cột).`);
        } catch (err) { alert('Lỗi đọc Excel: ' + (err as Error).message); }
        if (excelInputRef.current) excelInputRef.current.value = '';
    };

    /* ── Export ZIP ── */
    const handleExportZIP = async () => {
        const selectedFiles = files.filter(f => f.selected);
        if (selectedFiles.length === 0) { alert('Chọn ít nhất 1 file.'); return; }
        setExporting(true);
        try {
            const zip = new JSZip();
            for (const f of selectedFiles) {
                const filled = fillFileComplete(f);
                const blob = new Blob([filled], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                zip.file(f.folder ? `${f.folder}/${f.name}` : f.name, blob);
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            saveAs(zipBlob, `GoiMau_${selectedFiles.length}file_${new Date().toISOString().slice(0, 10)}.zip`);
            setExportCount(prev => prev + 1);
        } catch (err) { alert('Lỗi xuất: ' + (err as Error).message); }
        setExporting(false);
    };

    /* ── Export single ── */
    const handleExportSingle = (idx: number) => {
        const f = files[idx];
        if (!f) return;
        const filled = fillFileComplete(f);
        saveAs(new Blob([filled], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), f.name);
        setExportCount(prev => prev + 1);
    };

    /* ── Export PDF ── */
    const handleExportPDF = async () => {
        if (!previewRef.current) return;
        setExporting(true);
        try {
            await html2pdf().set({
                margin: 5, filename: `${files[activePreview]?.name || 'preview'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            }).from(previewRef.current).save();
        } catch (err) { alert('Lỗi xuất PDF: ' + (err as Error).message); }
        setExporting(false);
    };

    /* ── Save to project ── */
    const [showFieldSelector, setShowFieldSelector] = useState(false);

    const handleSaveToProject = () => {
        setShowFieldSelector(true);
    };

    const handleFieldSelectConfirm = async (selectedKeys: string[], projectName: string) => {
        setShowFieldSelector(false);
        try {
            const projectData = createProjectFromFormData(data, undefined, labels);
            projectData.name = projectName;
            projectData.selectedFields = selectedKeys;
            projectData.bundleSessionIds = savedSessions.map(s => s.id);
            const projectId = await saveProject(projectData);
            alert('✅ Đã lưu vào dự án!');
            navigate(`/du-an/${projectId}`);
        } catch (err) {
            alert('❌ Lỗi: ' + (err as Error).message);
        }
    };

    /* ── Styles ── */
    const S: React.CSSProperties = { marginBottom: '0.75rem', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' };
    const btnSm: React.CSSProperties = { fontSize: '0.75rem', padding: '0.25rem 0.5rem', cursor: 'pointer' };
    const selectedCount = files.filter(f => f.selected).length;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className="app-layout" style={{ maxWidth: 1400, margin: '0 auto', padding: '0.75rem' }}>
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>📦 Gói mẫu nhiều file</h1>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                        Upload nhiều file Word/Excel → điền 1 lần → xuất tất cả
                    </p>
                </div>
                <button className="btn btn-sm" onClick={() => setShowTour(true)} style={{ ...btnSm, background: '#dbeafe', color: '#1d4ed8' }}>
                    ❓ Hướng dẫn
                </button>
            </div>

            {/* ── Stats bar ── */}
            {step === 'form' && (
                <div style={{
                    ...S, display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center',
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', borderColor: '#6ee7b7',
                    fontSize: '0.85rem', padding: '0.5rem 1rem',
                }}>
                    <span>📄 <b>{files.length}</b> file</span>
                    <span>📋 <b>{allTags.length}</b> trường</span>
                    <span>📤 <b>{exportCount}</b> lần xuất</span>
                    <span>✅ <b>{selectedCount}</b> file đã chọn</span>
                </div>
            )}

            {/* ═══════ UPLOAD STEP ═══════ */}
            {step === 'upload' && (
                <div
                    id="upload-area"
                    style={{
                        ...S,
                        background: dragOver
                            ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                            : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                        borderColor: dragOver ? '#3b82f6' : '#7dd3fc',
                        borderStyle: dragOver ? 'dashed' : 'solid',
                        borderWidth: dragOver ? 3 : 1,
                        textAlign: 'center', padding: '2rem',
                        transition: 'all 0.2s ease',
                    }}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{dragOver ? '📥' : '📁'}</div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#0369a1' }}>
                        {dragOver ? 'Thả file vào đây!' : 'Chọn file .docx / .xlsx'}
                    </h2>
                    <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        Kéo thả file/thư mục vào đây, hoặc bấm nút bên dưới.
                    </p>

                    <input ref={fileInputRef} type="file" accept=".docx,.xlsx,.xls" multiple style={{ display: 'none' }} onChange={handleUpload} />
                    {/* Folder picker */}
                    <input ref={folderInputRef} type="file" accept=".docx,.xlsx,.xls" webkitdirectory="" multiple style={{ display: 'none' }} onChange={handleUpload} />

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={scanning}
                            style={{ fontSize: '1rem', padding: '0.6rem 1.5rem' }}>📄 Thêm file lẻ</button>
                        <button className="btn btn-primary" onClick={() => folderInputRef.current?.click()} disabled={scanning}
                            style={{ fontSize: '1rem', padding: '0.6rem 1.5rem', background: '#7c3aed' }}>📁 Thêm thư mục</button>
                        {stagedFiles.length >= 1 && (
                            <button className="btn btn-primary" onClick={handleStartScan} disabled={scanning}
                                style={{ fontSize: '1rem', padding: '0.6rem 1.5rem', background: '#10b981' }}>
                                {scanning ? '⏳ Đang quét...' : `🔍 Quét & tạo form (${stagedFiles.length} file)`}
                            </button>
                        )}
                    </div>
                    {/* B1: Import/Export Data */}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        <button className="btn btn-sm" onClick={handleImportData}
                            style={{ fontSize: '0.8rem', background: '#dbeafe', color: '#1d4ed8' }}>
                            📥 Nhập dữ liệu (JSON)
                        </button>
                        {allTags.length > 0 && (
                            <button className="btn btn-sm" onClick={handleExportData}
                                style={{ fontSize: '0.8rem', background: '#d1fae5', color: '#059669' }}>
                                📤 Xuất dữ liệu (JSON)
                            </button>
                        )}
                    </div>

                    {/* Presets */}
                    {presets.length > 0 && (
                        <div style={{ marginTop: '1rem', textAlign: 'left', background: '#fff', borderRadius: 8, padding: '0.5rem', border: '1px solid #e0f2fe' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0369a1', marginBottom: '0.3rem' }}>📦 Bộ mẫu đã lưu</div>
                            {presets.map(p => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.15rem 0' }}>
                                    <span style={{ flex: 1, color: '#334155' }}>📄 {p.name} ({p.fileNames.length} file)</span>
                                    <button onClick={() => handleDeletePreset(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.7rem' }}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                    {stagedFiles.length >= 1 && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <button className="btn btn-sm" onClick={handleSavePreset}
                                style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', background: '#fef3c7', color: '#92400e' }}>
                                💾 Lưu bộ file mẫu
                            </button>
                        </div>
                    )}

                    {stagedFiles.length > 0 && (
                        <div style={{ marginTop: '1.5rem', textAlign: 'left', background: '#fff', borderRadius: 8, padding: '0.75rem', border: '1px solid #bae6fd' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#0369a1' }}>
                                📑 Đã chọn {stagedFiles.length} file:
                            </div>
                            {stagedFiles.map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.5rem', fontSize: '0.85rem', borderRadius: 4, background: i % 2 === 0 ? '#f0f9ff' : 'transparent' }}>
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        📄 {f.name}
                                        {f.folder && <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}> ({f.folder})</span>}
                                    </span>
                                    <button onClick={() => removeStagedFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.9rem' }} title="Xóa">✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>💡 Bấm "Thêm file" nhiều lần để chọn từ các thư mục khác nhau</div>
                </div>
            )}

            {/* ═══════ FORM STEP ═══════ */}
            {step === 'form' && files.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: '1rem',
                }}>
                    {/* ── LEFT COLUMN ── */}
                    <div>
                        {/* Data management panel */}
                        <div style={{ ...S, background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderColor: '#86efac' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#166534' }}>📊 Quản lý dữ liệu</div>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <button className="btn btn-sm" onClick={handleBackup} style={btnSm}>💾 Sao lưu</button>
                                <label className="btn btn-sm" style={{ ...btnSm, display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                                    📂 Khôi phục
                                    <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleRestore} />
                                </label>
                                <label className="btn btn-sm" style={{ ...btnSm, display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                                    📊 Nhập từ Excel
                                    <input ref={excelInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExcelImport} />
                                </label>
                                <button className="btn btn-sm" onClick={handleSaveSession} style={btnSm}>💿 Lưu phiên</button>
                                <button className="btn btn-sm" onClick={handleClone} style={btnSm}>📋 Nhân bản</button>
                                <button className="btn btn-sm" onClick={handleClearAll} style={{ ...btnSm, color: '#ef4444' }}>🗑️ Xóa tất cả</button>
                            </div>
                            {savedSessions.length > 0 && (
                                <div style={{ marginTop: '0.5rem', borderTop: '1px solid #bbf7d0', paddingTop: '0.5rem' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>📁 Phiên đã lưu ({savedSessions.length})</div>
                                    {savedSessions.map(s => (
                                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.2rem 0' }}>
                                            <span style={{ flex: 1, cursor: 'pointer', color: '#166534' }} onClick={() => handleLoadSession(s)}>
                                                📄 {s.name} <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>({new Date(s.date).toLocaleDateString('vi-VN')})</span>
                                            </span>
                                            <button onClick={() => handleDeleteSession(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem' }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Session diff */}
                            {savedSessions.length >= 2 && (
                                <div style={{ marginTop: '0.5rem', borderTop: '1px solid #bbf7d0', paddingTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                                        <span style={{ fontWeight: 600 }}>🔍 So sánh:</span>
                                        <select value={diffSessions[0]} onChange={e => setDiffSessions([e.target.value, diffSessions[1]])}
                                            style={{ fontSize: '0.7rem', padding: '0.1rem', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                                            <option value="">Chọn phiên 1</option>
                                            {savedSessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <span>vs</span>
                                        <select value={diffSessions[1]} onChange={e => setDiffSessions([diffSessions[0], e.target.value])}
                                            style={{ fontSize: '0.7rem', padding: '0.1rem', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                                            <option value="">Chọn phiên 2</option>
                                            {savedSessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <button className="btn btn-sm" disabled={!diffSessions[0] || !diffSessions[1] || diffSessions[0] === diffSessions[1]}
                                            onClick={() => setShowDiff(true)}
                                            style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>So sánh</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* File list */}
                        <div style={{ ...S, background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderColor: '#fbbf24' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>📑 Danh sách file ({files.length})</span>
                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                    <button className="btn btn-sm" onClick={selectAll} style={btnSm}>✅ Tất cả</button>
                                    <button className="btn btn-sm" onClick={deselectAll} style={btnSm}>⬜ Bỏ chọn</button>
                                </div>
                            </div>
                            {files.map((f, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.3rem 0.4rem', borderRadius: 6,
                                    background: activePreview === i ? '#fef9c3' : 'transparent',
                                    cursor: 'pointer', fontSize: '0.8rem',
                                }} onClick={() => handlePreview(i)}>
                                    <input type="checkbox" checked={f.selected} onChange={() => toggleFileSelection(i)} onClick={e => e.stopPropagation()} style={{ cursor: 'pointer' }} />
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {f.name}</span>
                                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{f.tags.length}t</span>
                                    <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleExportSingle(i); }}
                                        style={{ fontSize: '0.6rem', padding: '0.1rem 0.2rem' }} title="Xuất riêng">⬇️</button>
                                </div>
                            ))}
                        </div>

                        {/* Export buttons */}
                        <div style={{ ...S, display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <button className="btn btn-primary" onClick={handleExportZIP} disabled={exporting || selectedCount === 0}
                                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                                {exporting ? '⏳...' : `📦 Xuất ZIP (${selectedCount}/${files.length})`}
                            </button>
                            <label className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                                🚀 Xuất hàng loạt
                                <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleBatchExport} />
                            </label>
                            <button className="btn btn-secondary" onClick={handleExportPDF} disabled={exporting}
                                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>📄 Xuất PDF</button>
                            <button className="btn btn-secondary" onClick={() => {
                                const first = files.find(f => f.selected);
                                if (!first) { alert('Chọn ít nhất 1 file!'); return; }
                                const filled = fillTemplate(first.buffer, data);
                                setPreviewBuffer(filled);
                                setPreviewName(first.name);
                            }} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
                                👁️ Xem trước Word
                            </button>
                            <button className="btn btn-secondary" onClick={handleSaveToProject}
                                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: '#eff6ff', borderColor: '#93c5fd', color: '#2563eb' }}>
                                📊 Lưu vào dự án
                            </button>
                            <button className="btn btn-secondary" onClick={() => { setStep('upload'); setFiles([]); setStagedFiles([]); }}
                                style={{ fontSize: '0.85rem' }}>↩️ Upload lại</button>
                            {hasGoogleApiKey() && (
                                <>
                                    <button className="btn btn-secondary" onClick={async () => {
                                        const first = files.find(f => f.selected);
                                        if (!first) { alert('Chọn ít nhất 1 file!'); return; }
                                        try {
                                            const filled = fillTemplate(first.buffer, data);
                                            const result = await uploadToDrive(first.name, filled);
                                            alert(`✅ Đã upload lên Google Drive!\nFile ID: ${result.id}`);
                                            if (result.webViewLink) window.open(result.webViewLink, '_blank');
                                        } catch (err) {
                                            alert('❌ ' + (err as Error).message);
                                        }
                                    }} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: '#fef3c7', borderColor: '#fbbf24', color: '#92400e' }}>
                                        ☁️ Lưu Drive
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => openSheetsWithData(data)}
                                        style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: '#dcfce7', borderColor: '#86efac', color: '#166534' }}>
                                        📊 Xuất Sheets
                                    </button>
                                </>
                            )}
                            {!hasGoogleApiKey() && (
                                <a href="/cai-dat" className="btn btn-sm" style={{ fontSize: '0.75rem', color: '#64748b', textDecoration: 'none' }}>
                                    ☁️ Kết nối Google
                                </a>
                            )}
                            {isMobile && (
                                <button className="btn btn-sm" onClick={() => setShowMobilePreview(!showMobilePreview)}
                                    style={{ ...btnSm, background: '#dbeafe' }}>{showMobilePreview ? '📋 Form' : '👁️ Preview'}</button>
                            )}
                        </div>

                        {/* Form fields (hide on mobile when preview is shown) */}
                        {(!isMobile || !showMobilePreview) && (
                            <div style={S}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#4f46e5' }}>
                                        📋 Trường dữ liệu ({allTags.length})
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                        {/* Template selector */}
                                        <select onChange={e => {
                                            const tpl = FORM_TEMPLATES.find(t => t.id === e.target.value);
                                            if (tpl) {
                                                setAllTags(prev => [...new Set([...prev, ...tpl.tags])]);
                                                setLabels(prev => ({ ...prev, ...tpl.labels }));
                                            }
                                            e.target.value = '';
                                        }} style={{ fontSize: '0.7rem', padding: '0.15rem 0.3rem', border: '1px solid #c7d2fe', borderRadius: 4 }}>
                                            <option value="">📋 Mẫu...</option>
                                            {FORM_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                                        </select>
                                        {allTags.length > 5 && (
                                            <input type="text" value={fieldSearch} onChange={e => setFieldSearch(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && fieldSearch) {
                                                        const match = allTags.find(t => (labels[t] || t).toLowerCase().includes(fieldSearch.toLowerCase()));
                                                        if (match) {
                                                            const el = document.getElementById(`field-${match}`);
                                                            if (el) {
                                                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                el.style.background = '#fef08a';
                                                                setTimeout(() => { el.style.background = ''; }, 1500);
                                                            }
                                                        }
                                                    }
                                                }}
                                                placeholder="🔍 Tìm trường... (Enter để cuộn)"
                                                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', border: '1px solid #c7d2fe', borderRadius: 6, width: 180 }} />
                                        )}
                                    </div>
                                </div>
                                {/* Grouped fields */}
                                {(() => {
                                    const filtered = allTags.filter(tag => !fieldSearch || (labels[tag] || tag).toLowerCase().includes(fieldSearch.toLowerCase()));
                                    // Group by pattern
                                    const groups: Record<string, string[]> = {};
                                    for (const tag of filtered) {
                                        const t = (labels[tag] || tag).toLowerCase();
                                        let group = '📝 Khác';
                                        if (/tên|họ|đại diện|chức vụ|ông|bà/.test(t)) group = '👤 Nhân sự';
                                        else if (/địa|xã|huyện|tỉnh|thành phố/.test(t)) group = '📍 Địa chỉ';
                                        else if (/giá|tiền|kinh phí|dự toán|thanh toán|số tiền|giá trị/.test(t)) group = '💰 Tài chính';
                                        else if (/ngày|thời gian|năm|tháng/.test(t)) group = '📅 Thời gian';
                                        else if (/số hđ|hợp đồng|quyết định|số qđ/.test(t)) group = '📄 Hợp đồng';
                                        if (!groups[group]) groups[group] = [];
                                        groups[group].push(tag);
                                    }
                                    const groupOrder = ['👤 Nhân sự', '📍 Địa chỉ', '💰 Tài chính', '📅 Thời gian', '📄 Hợp đồng', '📝 Khác'];
                                    const sortedGroups = groupOrder.filter(g => groups[g]);
                                    // Only show groups if > 8 fields, otherwise flat list
                                    if (filtered.length <= 8 || sortedGroups.length <= 1) {
                                        return filtered.map(tag => {
                                            const hasFormula = formulas[tag] && isValidFormula(formulas[tag]);
                                            // Auto-compute formula value
                                            if (hasFormula) {
                                                const computed = evaluateFormula(formulas[tag], data);
                                                if (computed !== data[tag] && !computed.startsWith('⚠️')) {
                                                    // Update data with computed value (deferred)
                                                    setTimeout(() => setData(prev => ({ ...prev, [tag]: computed })), 0);
                                                }
                                            }
                                            return (
                                                <div key={tag} id={`field-${tag}`} style={{ transition: 'background 0.3s', position: 'relative' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <FormInput label={labels[tag] || tag.replace(/_/g, ' ')} name={tag}
                                                                value={data[tag] || ''} onChange={handleChange}
                                                                onFocus={() => setFocusedTag(tag)} onBlur={() => setTimeout(() => setFocusedTag(null), 200)}
                                                                placeholder={`Nhập ${(labels[tag] || tag).toLowerCase()}`} />
                                                        </div>
                                                        <button
                                                            onClick={() => setActiveFormulaTag(activeFormulaTag === tag ? null : tag)}
                                                            title="Công thức tính"
                                                            style={{
                                                                background: hasFormula ? '#ede9fe' : 'none',
                                                                border: hasFormula ? '1px solid #a78bfa' : '1px solid #e2e8f0',
                                                                borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem',
                                                                padding: '0.15rem 0.3rem', color: hasFormula ? '#7c3aed' : '#94a3b8',
                                                                marginTop: '0.4rem',
                                                            }}
                                                        >🧮</button>
                                                    </div>
                                                    {activeFormulaTag === tag && (
                                                        <div style={{
                                                            padding: '0.4rem 0.5rem', background: '#faf5ff', border: '1px solid #c4b5fd',
                                                            borderRadius: 6, marginTop: '0.2rem', marginBottom: '0.4rem', fontSize: '0.78rem',
                                                        }}>
                                                            <div style={{ fontWeight: 600, color: '#6d28d9', marginBottom: '0.2rem' }}>🧮 Công thức</div>
                                                            <input
                                                                type="text"
                                                                value={formulas[tag] || ''}
                                                                onChange={e => setFormulas(prev => ({ ...prev, [tag]: e.target.value }))}
                                                                placeholder="VD: {GIA_TRI_HD} * {THUE_VAT} / 100"
                                                                style={{
                                                                    width: '100%', padding: '0.3rem 0.5rem', borderRadius: 4,
                                                                    border: '1px solid #c4b5fd', fontSize: '0.78rem', fontFamily: 'monospace',
                                                                }}
                                                            />
                                                            {formulas[tag] && (
                                                                <div style={{ marginTop: '0.2rem', color: isValidFormula(formulas[tag]) ? '#059669' : '#dc2626' }}>
                                                                    {isValidFormula(formulas[tag])
                                                                        ? `= ${evaluateFormula(formulas[tag], data)}`
                                                                        : '⚠️ Cần ít nhất 1 {TAG} và 1 phép tính (+, -, *, /)'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {isMoneyField(tag) && data[tag] && (
                                                        <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '-0.3rem', marginBottom: '0.4rem', paddingLeft: '0.5rem', fontStyle: 'italic' }}>
                                                            💰 {numberToVietnamese(data[tag])}
                                                        </div>
                                                    )}
                                                    {/* Auto-suggest */}
                                                    {focusedTag === tag && !data[tag] && (() => {
                                                        const suggestions = [...new Set(savedSessions.map(s => s.data[tag]).filter(Boolean))].slice(0, 5);
                                                        if (suggestions.length === 0) return null;
                                                        return (
                                                            <div style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: 300, left: 0, right: 0 }}>
                                                                {suggestions.map((s, i) => (
                                                                    <div key={i} onMouseDown={() => { setData(prev => ({ ...prev, [tag]: s })); setFocusedTag(null); }}
                                                                        style={{ padding: '0.3rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9' }}
                                                                        onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                                                                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                                                        💡 {s.length > 40 ? s.slice(0, 38) + '…' : s}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            );
                                        });
                                    }
                                    return sortedGroups.map(group => {
                                        const collapsed = collapsedGroups.has(group);
                                        return (
                                            <div key={group} style={{ marginBottom: '0.5rem' }}>
                                                <div onClick={() => setCollapsedGroups(prev => {
                                                    const next = new Set(prev);
                                                    collapsed ? next.delete(group) : next.add(group);
                                                    return next;
                                                })} style={{
                                                    padding: '0.3rem 0.5rem', background: '#f0f9ff', borderRadius: 6,
                                                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#2563eb',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                }}>
                                                    <span>{group} ({groups[group].length})</span>
                                                    <span>{collapsed ? '▶' : '▼'}</span>
                                                </div>
                                                {!collapsed && groups[group].map(tag => (
                                                    <div key={tag} id={`field-${tag}`} style={{ transition: 'background 0.3s', position: 'relative' }}>
                                                        <FormInput label={labels[tag] || tag.replace(/_/g, ' ')} name={tag}
                                                            value={data[tag] || ''} onChange={handleChange}
                                                            onFocus={() => setFocusedTag(tag)} onBlur={() => setTimeout(() => setFocusedTag(null), 200)}
                                                            placeholder={`Nhập ${(labels[tag] || tag).toLowerCase()}`} />
                                                        {isMoneyField(tag) && data[tag] && (
                                                            <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '-0.3rem', marginBottom: '0.4rem', paddingLeft: '0.5rem', fontStyle: 'italic' }}>
                                                                💰 {numberToVietnamese(data[tag])}
                                                            </div>
                                                        )}
                                                        {/* Auto-suggest */}
                                                        {focusedTag === tag && !data[tag] && (() => {
                                                            const suggestions = [...new Set(savedSessions.map(s => s.data[tag]).filter(Boolean))].slice(0, 5);
                                                            if (suggestions.length === 0) return null;
                                                            return (
                                                                <div style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: 300, left: 0, right: 0 }}>
                                                                    {suggestions.map((s, i) => (
                                                                        <div key={i} onMouseDown={() => { setData(prev => ({ ...prev, [tag]: s })); setFocusedTag(null); }}
                                                                            style={{ padding: '0.3rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9' }}
                                                                            onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                                                                            onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                                                            💡 {s.length > 40 ? s.slice(0, 38) + '…' : s}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        )}

                        {/* Table data section */}
                        {(!isMobile || !showMobilePreview) && Object.keys(fileTableInfos).length > 0 && (
                            <div style={{ ...S, background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', borderColor: '#a78bfa' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#5b21b6' }}>
                                        📊 Bảng dữ liệu ({Object.keys(fileTableInfos).length} file có bảng)
                                    </span>
                                </div>

                                {/* File tabs for tables */}
                                <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                    {Object.keys(fileTableInfos).map(fn => (
                                        <button key={fn}
                                            className={`btn btn - sm ${activeTableFile === fn ? 'btn-primary' : ''} `}
                                            onClick={() => setActiveTableFile(fn)}
                                            style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                                            {fn.length > 20 ? fn.slice(0, 18) + '…' : fn}
                                            {fileTableConfigs[fn] ? ' ✅' : ' ⚙️'}
                                        </button>
                                    ))}
                                </div>

                                {/* Active file table */}
                                {activeTableFile && fileTableInfos[activeTableFile] && (
                                    <div>
                                        {!fileTableConfigs[activeTableFile] ? (
                                            <div style={{ textAlign: 'center', padding: '1rem' }}>
                                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                                    Tìm thấy {fileTableInfos[activeTableFile].length} bảng trong file này.
                                                </p>
                                                <button className="btn btn-primary"
                                                    onClick={() => { setTableSetupFile(activeTableFile); setShowTableSetup(true); }}
                                                    style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                                                    ⊞ Cấu hình bảng
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
                                                    <button className="btn btn-sm"
                                                        onClick={() => { setTableSetupFile(activeTableFile); setShowTableSetup(true); }}
                                                        style={btnSm}>⚙️ Cấu hình lại</button>
                                                </div>
                                                <TableEditor
                                                    config={fileTableConfigs[activeTableFile]}
                                                    data={fileTableData[activeTableFile] || []}
                                                    onChange={(d) => handleTableDataChange(activeTableFile, d)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT COLUMN: Preview ── */}
                    {(!isMobile || showMobilePreview) && (
                        <div style={{ position: isMobile ? 'static' : 'sticky', top: '1rem', alignSelf: 'start' }}>
                            {/* Tab selector */}
                            <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.4rem', flexWrap: 'wrap', overflowX: 'auto' }}>
                                {files.map((f, i) => (
                                    <button key={i} className={`btn btn - sm ${activePreview === i ? 'btn-primary' : ''} `}
                                        onClick={() => handlePreview(i)}
                                        style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', opacity: f.selected ? 1 : 0.5, whiteSpace: 'nowrap' }}
                                        title={f.name}>
                                        {f.name.length > 18 ? f.name.slice(0, 16) + '…' : f.name}
                                    </button>
                                ))}
                            </div>

                            {/* Zoom controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                                <span style={{ fontWeight: 600 }}>👁️ Xem trước</span>
                                <button className="btn btn-sm" onClick={() => setZoom(z => Math.max(20, z - 10))} style={btnSm}>−</button>
                                <span style={{ minWidth: 35, textAlign: 'center' }}>{zoom}%</span>
                                <button className="btn btn-sm" onClick={() => setZoom(z => Math.min(100, z + 10))} style={btnSm}>+</button>
                                {previewLoading && <span style={{ color: '#64748b' }}>⏳</span>}
                            </div>

                            <div style={{ ...S, height: isMobile ? '60vh' : 'calc(100vh - 200px)', overflow: 'auto' }}>
                                <div ref={previewRef} style={{ zoom: zoom / 100 }} />
                                {!previewRef.current?.innerHTML && (
                                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Bấm vào tên file để xem trước</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Scan Modal ── */}
            {showScanModal && (
                <ScanReviewModal results={scanResults} onConfirm={handleScanConfirm}
                    onCancel={() => { setShowScanModal(false); setStep('upload'); }} />
            )}

            {/* ── Table Setup Modal ── */}
            {showTableSetup && fileTableInfos[tableSetupFile] && (
                <TableSetupModal
                    tables={fileTableInfos[tableSetupFile]}
                    onConfirm={handleTableConfigConfirm}
                    onClose={() => setShowTableSetup(false)}
                />
            )}

            {/* ── Guide Modal ── */}
            {showGuide && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}
                    onClick={() => setShowGuide(false)}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', maxWidth: 750, width: '92%', maxHeight: '85vh', overflow: 'auto' }}
                        onClick={e => e.stopPropagation()}>
                        <div dangerouslySetInnerHTML={{ __html: GUIDE_HTML }} />
                        <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                            <button className="btn btn-primary" onClick={() => setShowGuide(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Field Selector Modal */}
            {showFieldSelector && (
                <FieldSelectorModal
                    fields={Object.keys(data).filter(k => data[k]?.trim()).map(k => ({
                        key: k,
                        label: labels[k] || k.replace(/_/g, ' '),
                        value: data[k] || '',
                    }))}
                    defaultName={data['TÊN_CT'] || data['TÊN_CÔNG_TRÌNH'] || data['CÔNG_TRÌNH'] || ''}
                    onConfirm={handleFieldSelectConfirm}
                    onCancel={() => setShowFieldSelector(false)}
                />
            )}

            {/* Session diff modal */}
            {showDiff && (() => {
                const s1 = savedSessions.find(s => s.id === diffSessions[0]);
                const s2 = savedSessions.find(s => s.id === diffSessions[1]);
                if (!s1 || !s2) return null;
                const allKeys = [...new Set([...Object.keys(s1.data), ...Object.keys(s2.data)])];
                const changed = allKeys.filter(k => (s1.data[k] || '') !== (s2.data[k] || ''));
                return (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}
                        onClick={() => setShowDiff(false)}>
                        <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', maxWidth: 700, width: '92%', maxHeight: '85vh', overflow: 'auto' }}
                            onClick={e => e.stopPropagation()}>
                            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>🔍 So sánh: "{s1.name}" vs "{s2.name}"</h3>
                            {changed.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>✅ Không có thay đổi</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f1f5f9' }}>
                                            <th style={{ padding: '0.4rem', textAlign: 'left' }}>Trường</th>
                                            <th style={{ padding: '0.4rem', textAlign: 'left', color: '#dc2626' }}>{s1.name}</th>
                                            <th style={{ padding: '0.4rem', textAlign: 'left', color: '#059669' }}>{s2.name}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {changed.map(k => (
                                            <tr key={k} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '0.3rem', fontWeight: 500, color: '#64748b' }}>{labels[k] || k}</td>
                                                <td style={{ padding: '0.3rem', background: '#fef2f2', color: '#dc2626' }}>{s1.data[k] || '—'}</td>
                                                <td style={{ padding: '0.3rem', background: '#f0fdf4', color: '#059669' }}>{s2.data[k] || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                                <button className="btn btn-primary" onClick={() => setShowDiff(false)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                );
            })()}
            {/* Docx Preview */}
            {previewBuffer && (
                <DocxPreview
                    fileBuffer={previewBuffer}
                    fileName={previewName}
                    onClose={() => { setPreviewBuffer(null); setPreviewName(''); }}
                />
            )}
            {/* Onboarding Tour */}
            <OnboardingTour page="bundle" forceShow={showTour} onClose={() => setShowTour(false)} />
        </div>
    );
}
