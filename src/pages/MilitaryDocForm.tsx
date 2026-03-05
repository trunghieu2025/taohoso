import { useState, useCallback, useEffect, useRef, ChangeEvent } from 'react';
import { FormInput } from '../components/FormField';
import ScanReviewModal from '../components/ScanReviewModal';
import {
    generateMilitaryDoc,
    renderDocxPreview,
    extractTags,
    scanDuplicateTexts,
    createTemplateWithTags,
} from '../utils/militaryDocGenerator';
import {
    scanExcelDuplicates,
    extractExcelTags,
    createExcelTemplate,
    renderExcelPreview,
    generateExcelDoc,
    readExcelData,
    mapExcelToTags,
} from '../utils/excelTemplateGenerator';
import type { ScanResult } from '../utils/militaryDocGenerator';
import { numberToVietnamese } from '../utils/numberToVietnamese';
import {
    saveSession, loadSession, listSessions, deleteSession,
    exportSessionToJSON, importFromJSON, getAutoSaveId, setAutoSaveId,
    type SavedSession,
} from '../utils/templateStorage';
import {
    saveContractor, listContractors, deleteContractor,
    contractorToFormData, formDataToContractor,
    type Contractor,
} from '../utils/contractorStorage';
import { scanWordTables, fillWordTable, calculateTableData, type TableInfo, type TableConfig, type TableColumn } from '../utils/wordTableUtils';
import TableSetupModal from '../components/TableSetupModal';
import TableEditor from '../components/TableEditor';
import html2pdf from 'html2pdf.js';

/* ── Template library ── */
const TEMPLATE_LIBRARY = [
    { name: 'Mẫu mặc định (Nhà tập thể)', file: 'template_nha_tap_the.docx', desc: 'Hồ sơ sửa chữa nhà tập thể' },
];

/* ── Estimate config (for dự toán chi tiết) ── */
const ESTIMATE_COLUMNS: TableColumn[] = [
    { index: 0, header: 'STT', type: 'auto_number' },
    { index: 1, header: 'Hạng mục', type: 'manual' },
    { index: 2, header: 'ĐVT', type: 'manual' },
    { index: 3, header: 'Khối lượng', type: 'manual' },
    { index: 4, header: 'Đơn giá', type: 'manual' },
    { index: 5, header: 'Thành tiền', type: 'auto_calc', formula: 'KHOI_LUONG * DON_GIA' },
];

/* ── Human-friendly labels for known MERGEFIELD tags ── */
const TAG_LABELS: Record<string, string> = {
    'NĂM': 'Năm',
    'SỐ_TIỀN': 'Số tiền (đồng)',
    'ST_BẰNG_CHỮ': 'Số tiền bằng chữ',
    'NGUỒN_KINH_PHÍ': 'Nguồn kinh phí',
    'CHT': 'Chỉ huy trưởng (cấp bậc + họ tên)',
    'CN_HCKT': 'CN HC-KT (cấp bậc + họ tên)',
    'BTC': 'BTC (cấp bậc + họ tên)',
    'BTC_2': 'BTC ghi sổ (cấp bậc + họ tên)',
    'CÔNG_TRÌNH': 'Tên công trình',
    'HẠNG_MỤC': 'Hạng mục sửa chữa',
    'KLTH': 'Khối lượng thực hiện',
    'TÊN_NHÀ_THẦU': 'Tên nhà thầu (Bên B)',
    'ĐẠI_DIỆN_NHÀ_THẦU': 'Đại diện nhà thầu',
    'CHỨC_VỤ_NHÀ_THẦU': 'Chức vụ đại diện',
    'SĐT_NHÀ_THẦU': 'SĐT nhà thầu',
    'MÃ_SỐ_THUẾ': 'Mã số thuế',
    'STK_NHÀ_THẦU': 'Số tài khoản nhà thầu',
    'NGÂN_HÀNG': 'Tại ngân hàng',
    'ĐỊA_CHỈ': 'Địa chỉ (Quy Nhơn, Bình Định)',
};

/* ── Random generic placeholders (not real data) ── */
const TAG_PLACEHOLDERS: Record<string, string> = {
    'NĂM': '2026',
    'SỐ_TIỀN': '185.000.000',
    'ST_BẰNG_CHỮ': 'Một trăm tám mươi lăm triệu đồng',
    'NGUỒN_KINH_PHÍ': 'NSQP2026',
    'CHT': 'Đại tá Nguyễn Văn A',
    'CN_HCKT': 'Trung tá Trần Văn B',
    'BTC': 'Trung úy Lê Văn C',
    'BTC_2': 'Trung tá CN Phạm Thị D',
    'CÔNG_TRÌNH': 'Sở Chỉ huy BĐBP tỉnh',
    'HẠNG_MỤC': 'Sửa chữa hệ thống cửa, chống thấm',
    'KLTH': 'Sửa chữa hệ thống cửa, chống thấm Nhà ở CBCS',
    'TÊN_NHÀ_THẦU': 'Công ty TNHH Xây dựng ABC',
    'ĐẠI_DIỆN_NHÀ_THẦU': 'Nguyễn Văn E',
    'CHỨC_VỤ_NHÀ_THẦU': 'Giám đốc',
    'SĐT_NHÀ_THẦU': '0912.345.678',
    'MÃ_SỐ_THUẾ': '4101234567',
    'STK_NHÀ_THẦU': '001234567890',
    'NGÂN_HÀNG': 'Vietcombank chi nhánh Bình Định',
    'ĐỊA_CHỈ': 'Quy Nhơn, Bình Định',
};

/* ── Group tags for layout ── */
const TAG_GROUPS = [
    {
        icon: '🏛️',
        title: 'Thông tin chung',
        tags: ['NĂM', 'CÔNG_TRÌNH', 'HẠNG_MỤC', 'KLTH', 'NGUỒN_KINH_PHÍ', 'ĐỊA_CHỈ'],
        rows: [
            ['NĂM', 'NGUỒN_KINH_PHÍ'],
            ['CÔNG_TRÌNH', 'HẠNG_MỤC'],
            ['KLTH', 'ĐỊA_CHỈ'],
        ],
    },
    {
        icon: '💰',
        title: 'Tài chính',
        tags: ['SỐ_TIỀN', 'ST_BẰNG_CHỮ'],
        rows: [['SỐ_TIỀN', 'ST_BẰNG_CHỮ']],
    },
    {
        icon: '👤',
        title: 'Nhân sự — Lãnh đạo ký',
        tags: ['CHT', 'CN_HCKT', 'BTC', 'BTC_2'],
        rows: [['CHT', 'CN_HCKT'], ['BTC', 'BTC_2']],
    },
    {
        icon: '🏢',
        title: 'Nhà thầu (Bên B)',
        tags: ['TÊN_NHÀ_THẦU', 'ĐẠI_DIỆN_NHÀ_THẦU', 'CHỨC_VỤ_NHÀ_THẦU', 'SĐT_NHÀ_THẦU', 'MÃ_SỐ_THUẾ', 'STK_NHÀ_THẦU', 'NGÂN_HÀNG'],
        rows: [
            ['TÊN_NHÀ_THẦU', 'ĐẠI_DIỆN_NHÀ_THẦU'],
            ['CHỨC_VỤ_NHÀ_THẦU', 'SĐT_NHÀ_THẦU'],
            ['MÃ_SỐ_THUẾ', 'STK_NHÀ_THẦU'],
            ['NGÂN_HÀNG'],
        ],
    },
];

type FormChangeEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

export default function MilitaryDocForm() {
    const [data, setData] = useState<Record<string, string>>({ NĂM: '2026' });
    const [loading, setLoading] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Template state
    const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
    const [templateName, setTemplateName] = useState('Mẫu mặc định (Nhà tập thể)');
    const [templateTags, setTemplateTags] = useState<string[]>([]);
    const [isCustomTemplate, setIsCustomTemplate] = useState(false);
    const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
    const [fileType, setFileType] = useState<'word' | 'excel'>('word');

    // Scan modal state
    const [showScanModal, setShowScanModal] = useState(false);
    const [scanResults, setScanResults] = useState<ScanResult[]>([]);
    const [rawUploadBuffer, setRawUploadBuffer] = useState<ArrayBuffer | null>(null);
    const [rawUploadName, setRawUploadName] = useState('');

    // Preview state
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewReady, setPreviewReady] = useState(false);
    const [zoom, setZoom] = useState(50);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const jsonInputRef = useRef<HTMLInputElement>(null);
    const excelDataInputRef = useRef<HTMLInputElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Auto-save & session state
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
    const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [showSessions, setShowSessions] = useState(false);
    const autoSaveRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Contractor state
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [showContractorPicker, setShowContractorPicker] = useState(false);

    // Export history
    const [exportHistory, setExportHistory] = useState<{ date: string; type: string }[]>([]);

    // Validation
    const REQUIRED_TAGS = ['CÔNG_TRÌNH', 'SỐ_TIỀN', 'NĂM'];
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Estimate (dự toán chi tiết)
    const [showEstimate, setShowEstimate] = useState(false);
    const ESTIMATE_CONFIG: TableConfig = { tableIndex: -1, columns: ESTIMATE_COLUMNS };
    const [estimateData, setEstimateData] = useState<string[][]>([ESTIMATE_COLUMNS.map(() => '')]);

    // Table state (multi-table support)
    const [detectedTables, setDetectedTables] = useState<TableInfo[]>([]);
    const [showTableSetup, setShowTableSetup] = useState(false);
    const [tableConfigs, setTableConfigs] = useState<Record<number, TableConfig>>({});
    const [tableDataMap, setTableDataMap] = useState<Record<number, string[][]>>({});

    const zoomIn = () => setZoom(z => Math.min(z + 10, 150));
    const zoomOut = () => setZoom(z => Math.max(z - 10, 30));
    const zoomFit = () => setZoom(50);

    // Load saved session or default template on mount
    useEffect(() => {
        (async () => {
            // Try to restore auto-saved session
            const autoId = getAutoSaveId();
            if (autoId) {
                try {
                    const session = await loadSession(autoId);
                    if (session) {
                        setTemplateBuffer(session.templateBuffer);
                        setTemplateName(session.name);
                        setTemplateTags(session.tags);
                        setIsCustomTemplate(session.isCustomTemplate);
                        setCustomLabels(session.labels);
                        setFileType(session.fileType);
                        setData(session.data);
                        setCurrentSessionId(autoId);
                        setLastSaved(session.updatedAt);
                        // Load sessions list
                        setSavedSessions(await listSessions());
                        return;
                    }
                } catch { /* fall through to default */ }
            }
            // Load default template
            try {
                const res = await fetch('/templates/template_nha_tap_the.docx');
                if (!res.ok) return;
                const buf = await res.arrayBuffer();
                setTemplateBuffer(buf);
                const tags = extractTags(buf);
                setTemplateTags(tags);
            } catch { /* ignore */ }
            // Load sessions list
            try { setSavedSessions(await listSessions()); } catch { /* ignore */ }
            try { setContractors(await listContractors()); } catch { /* ignore */ }
        })();
    }, []);

    // Auto-save debounced
    useEffect(() => {
        if (!templateBuffer) return;
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        autoSaveRef.current = setTimeout(async () => {
            try {
                const id = await saveSession({
                    ...(currentSessionId ? { id: currentSessionId } : {}),
                    name: templateName,
                    templateBuffer,
                    tags: templateTags,
                    labels: customLabels,
                    data,
                    fileType,
                    isCustomTemplate,
                });
                setCurrentSessionId(id);
                setAutoSaveId(id);
                setLastSaved(new Date().toISOString());
                setSavedSessions(await listSessions());
            } catch (err) {
                console.error('[auto-save]', err);
            }
        }, 2000);
        return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
    }, [data, templateBuffer, templateName, templateTags, customLabels, fileType, isCustomTemplate]);

    // Debounced preview update
    useEffect(() => {
        if (!templateBuffer || !previewContainerRef.current) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setPreviewLoading(true);
            try {
                if (fileType === 'excel') {
                    // Excel: render HTML table
                    const html = renderExcelPreview(templateBuffer, data);
                    previewContainerRef.current!.innerHTML = html;
                    // Style the Excel preview tables
                    const tables = previewContainerRef.current!.querySelectorAll('table');
                    tables.forEach(t => {
                        t.style.borderCollapse = 'collapse';
                        t.style.width = '100%';
                        t.style.fontSize = '11px';
                    });
                    const cells = previewContainerRef.current!.querySelectorAll('td,th');
                    cells.forEach(c => {
                        (c as HTMLElement).style.border = '1px solid #d1d5db';
                        (c as HTMLElement).style.padding = '4px 6px';
                    });
                } else {
                    // Word: docx-preview (fill ALL configured tables)
                    let previewBuf = templateBuffer;
                    for (const [ti, cfg] of Object.entries(tableConfigs)) {
                        const tData = tableDataMap[Number(ti)];
                        if (tData && tData.length > 0) {
                            previewBuf = fillWordTable(previewBuf, cfg.tableIndex, tData, cfg.columns.map(c => c.header));
                        }
                    }
                    await renderDocxPreview(previewBuf, data, previewContainerRef.current!);
                }
                setPreviewReady(true);
            } catch (err) {
                console.error('[preview]', err);
                if (previewContainerRef.current) {
                    previewContainerRef.current.innerHTML = '<p style="color:red;text-align:center;padding:2rem">Không thể xem trước file này</p>';
                }
            } finally {
                setPreviewLoading(false);
            }
        }, 600);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [data, templateBuffer, fileType, tableDataMap, tableConfigs]);

    const handleChange = useCallback((e: FormChangeEvent) => {
        const { name, value } = e.target;
        setData((prev) => {
            const next = { ...prev, [name]: value };
            // Auto-fill ST_BẰNG_CHỮ when SỐ_TIỀN changes
            if (name === 'SỐ_TIỀN' && value) {
                const text = numberToVietnamese(value);
                if (text) next['ST_BẰNG_CHỮ'] = text;
            }
            return next;
        });
    }, []);

    const handleExport = async () => {
        if (!templateBuffer) return;
        // Validation
        if (!isCustomTemplate) {
            const errors: Record<string, string> = {};
            REQUIRED_TAGS.forEach(tag => {
                if (templateTags.includes(tag) && !data[tag]?.trim()) {
                    errors[tag] = 'Trường bắt buộc';
                }
            });
            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                alert(`⚠️ Vui lòng điền ${Object.keys(errors).length} trường bắt buộc (đánh dấu đỏ)`);
                return;
            }
        }
        setFieldErrors({});
        setLoading(true);
        try {
            if (fileType === 'excel') {
                generateExcelDoc(data, templateBuffer);
            } else {
                // Fill ALL configured tables, then fill tags
                let buf = templateBuffer;
                for (const [ti, cfg] of Object.entries(tableConfigs)) {
                    const tData = tableDataMap[Number(ti)];
                    if (tData && tData.length > 0) {
                        buf = fillWordTable(buf, cfg.tableIndex, tData, cfg.columns.map(c => c.header));
                    }
                }
                await generateMilitaryDoc(data, buf);
            }
        } catch (err) {
            alert('Lỗi khi xuất file: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
        // Track export
        setExportHistory(prev => [{ date: new Date().toISOString(), type: fileType }, ...prev].slice(0, 20));
    };

    // Table setup confirm — add ONE table config (can be called multiple times)
    const handleTableConfigConfirm = (config: TableConfig) => {
        setTableConfigs(prev => ({ ...prev, [config.tableIndex]: config }));
        setShowTableSetup(false);
        // Initialize table data from detected table
        const table = detectedTables.find(t => t.tableIndex === config.tableIndex);
        if (table) {
            const rows = Array.from({ length: table.dataRowCount }, () => config.columns.map(() => ''));
            table.allData.forEach((dataRow: string[], ri: number) => {
                if (ri < rows.length) {
                    dataRow.forEach((val: string, ci: number) => {
                        if (ci < rows[ri].length) rows[ri][ci] = val;
                    });
                }
            });
            setTableDataMap(prev => ({ ...prev, [config.tableIndex]: calculateTableData(rows, config.columns) }));
        }
    };

    const handleUploadTemplate = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check for .doc (old format)
        if (file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
            alert(
                '⚠️ File .doc (Word cũ) không đọc được trên web.\n\n'
                + 'Hướng dẫn chuyển sang .docx:\n'
                + '1. Mở file bằng Word\n'
                + '2. Vào File → Save As\n'
                + '3. Chọn định dạng "Word Document (.docx)"\n'
                + '4. Lưu và upload lại file .docx'
            );
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Check for .xls (old Excel format)
        if (file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.xlsx')) {
            alert(
                '⚠️ File .xls (Excel cũ) không đọc được đầy đủ trên web.\n\n'
                + 'Hướng dẫn chuyển sang .xlsx:\n'
                + '1. Mở file bằng Excel\n'
                + '2. Vào File → Save As\n'
                + '3. Chọn định dạng "Excel Workbook (.xlsx)"\n'
                + '4. Lưu và upload lại file .xlsx'
            );
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Detect file type
        const isExcel = /\.xlsx?$/i.test(file.name);

        const buf = await file.arrayBuffer();
        try {
            if (isExcel) {
                // Excel file
                const existingTags = extractExcelTags(buf);
                if (existingTags.length > 0) {
                    setTemplateBuffer(buf);
                    setTemplateName(file.name);
                    setTemplateTags(existingTags);
                    setIsCustomTemplate(true);
                    setFileType('excel');
                    setCustomLabels({});
                    setPreviewReady(false);
                    setData(() => {
                        const d: Record<string, string> = {};
                        existingTags.forEach(t => { d[t] = ''; });
                        return d;
                    });
                } else {
                    const results = scanExcelDuplicates(buf);
                    if (results.length === 0) {
                        alert('Không tìm thấy giá trị trùng lặp nào trong file Excel.');
                        return;
                    }
                    setRawUploadBuffer(buf);
                    setRawUploadName(file.name);
                    setFileType('excel');
                    setScanResults(results);
                    setShowScanModal(true);
                }
            } else {
                // Word file
                const existingTags = extractTags(buf);
                if (existingTags.length > 0) {
                    setTemplateBuffer(buf);
                    setTemplateName(file.name);
                    setTemplateTags(existingTags);
                    setIsCustomTemplate(true);
                    setFileType('word');
                    setCustomLabels({});
                    setData((prev) => {
                        const newData: Record<string, string> = {};
                        existingTags.forEach(tag => { newData[tag] = prev[tag] || ''; });
                        return newData;
                    });
                } else {
                    const results = scanDuplicateTexts(buf);
                    if (results.length === 0) {
                        alert('Không tìm thấy giá trị trùng lặp nào trong file Word.');
                        return;
                    }
                    setRawUploadBuffer(buf);
                    setRawUploadName(file.name);
                    setFileType('word');
                    setScanResults(results);
                    setShowScanModal(true);
                }
                // Scan for tables in Word file
                try {
                    const tables = scanWordTables(buf);
                    if (tables.length > 0) {
                        setDetectedTables(tables);
                        setShowTableSetup(true);
                    } else {
                        setDetectedTables([]);
                        setTableConfigs({});
                        setTableDataMap({});
                    }
                } catch { setDetectedTables([]); }
            }
        } catch (err) {
            alert('Lỗi đọc file: ' + (err as Error).message);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleScanConfirm = (selected: { text: string; tag: string; label: string }[]) => {
        if (!rawUploadBuffer || selected.length === 0) return;

        // Create template with {tag} placeholders
        const replacements = selected.map(s => ({ text: s.text, tag: s.tag }));
        const newTemplate = fileType === 'excel'
            ? createExcelTemplate(rawUploadBuffer, replacements)
            : createTemplateWithTags(rawUploadBuffer, replacements);

        // Extract tags from the new template
        const tags = fileType === 'excel'
            ? extractExcelTags(newTemplate)
            : extractTags(newTemplate);

        // Save custom labels
        const labels: Record<string, string> = {};
        selected.forEach(s => { labels[s.tag] = s.label; });

        setTemplateBuffer(newTemplate);
        setTemplateName(rawUploadName);
        setTemplateTags(tags);
        setIsCustomTemplate(true);
        setCustomLabels(labels);
        setShowScanModal(false);
        // Keep rawUploadBuffer so user can re-open scan
        setPreviewReady(false);

        // Reset form data
        const newData: Record<string, string> = {};
        tags.forEach(tag => { newData[tag] = ''; });
        setData(newData);
    };

    const handleScanCancel = () => {
        setShowScanModal(false);
    };

    const handleReopenScan = () => {
        if (!rawUploadBuffer) return;
        const results = fileType === 'excel'
            ? scanExcelDuplicates(rawUploadBuffer)
            : scanDuplicateTexts(rawUploadBuffer);
        setScanResults(results);
        setShowScanModal(true);
    };

    const handleResetTemplate = async () => {
        try {
            const res = await fetch('/templates/template_nha_tap_the.docx');
            if (!res.ok) return;
            const buf = await res.arrayBuffer();
            setTemplateBuffer(buf);
            setTemplateName('Mẫu mặc định (Nhà tập thể)');
            setTemplateTags(extractTags(buf));
            setIsCustomTemplate(false);
            setFileType('word');
        } catch { /* ignore */ }
    };

    const handleClear = () => setShowClearConfirm(true);
    const confirmClear = () => {
        setData({ NĂM: '2026' });
        setShowClearConfirm(false);
    };

    // Fill demo data
    const handleFillDemo = () => {
        setData({ ...TAG_PLACEHOLDERS });
        setFieldErrors({});
    };

    // Clone session
    const handleClone = async () => {
        if (!templateBuffer) return;
        try {
            const id = await saveSession({
                name: templateName + ' (bản sao)',
                templateBuffer,
                tags: templateTags,
                labels: customLabels,
                data,
                fileType,
                isCustomTemplate,
            });
            setCurrentSessionId(id);
            setAutoSaveId(id);
            setSavedSessions(await listSessions());
            alert('✅ Đã nhân bản hồ sơ!');
        } catch { /* ignore */ }
    };

    // PDF export
    const handleExportPDF = async () => {
        const el = previewContainerRef.current;
        if (!el) return;
        setLoading(true);
        try {
            const filename = `HoSo_${(data['CÔNG_TRÌNH'] || 'document').replace(/\s+/g, '_')}.pdf`;
            await html2pdf().set({
                margin: 5,
                filename,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            }).from(el).save();
            setExportHistory(prev => [...prev, { date: new Date().toISOString(), type: 'PDF' }]);
        } catch (err) {
            alert('❌ Lỗi xuất PDF: ' + (err as Error).message);
        }
        setLoading(false);
    };

    // Template library
    const handleSelectTemplate = async (file: string, name: string) => {
        try {
            const res = await fetch(`/templates/${file}`);
            if (!res.ok) return;
            const buf = await res.arrayBuffer();
            setTemplateBuffer(buf);
            setTemplateName(name);
            setTemplateTags(extractTags(buf));
            setIsCustomTemplate(false);
            setFileType('word');
        } catch { /* ignore */ }
    };

    // Contractor management
    const handleSaveContractor = async () => {
        const c = formDataToContractor(data);
        if (!c.name) { alert('Vui lòng nhập tên nhà thầu trước'); return; }
        await saveContractor(c);
        setContractors(await listContractors());
        alert('✅ Đã lưu thông tin nhà thầu: ' + c.name);
    };

    const handleSelectContractor = (c: Contractor) => {
        setData(prev => ({ ...prev, ...contractorToFormData(c) }));
        setShowContractorPicker(false);
    };

    const handleDeleteContractor = async (id: number) => {
        await deleteContractor(id);
        setContractors(await listContractors());
    };

    // Excel data import
    const handleImportExcelData = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const buf = await file.arrayBuffer();
            const rows = readExcelData(buf);
            if (rows.length === 0) {
                alert('Không tìm thấy dữ liệu trong file Excel.');
                return;
            }
            const labels = isCustomTemplate ? customLabels : TAG_LABELS;
            const mapped = mapExcelToTags(rows[0], templateTags, labels);
            if (Object.keys(mapped).length === 0) {
                alert('Không khớp được cột nào với trường form. Hàng 1 cần chứa tiêu đề khớp với tên trường.');
                return;
            }
            setData(prev => ({ ...prev, ...mapped }));
            alert(`✅ Đã nhập ${Object.keys(mapped).length} trường từ Excel!`);
        } catch (err) {
            alert('❌ Lỗi đọc file: ' + (err as Error).message);
        }
        if (excelDataInputRef.current) excelDataInputRef.current.value = '';
    };

    // JSON export
    const handleExportJSON = async () => {
        if (!currentSessionId) {
            // Save first
            try {
                const id = await saveSession({
                    name: templateName,
                    templateBuffer: templateBuffer!,
                    tags: templateTags,
                    labels: customLabels,
                    data,
                    fileType,
                    isCustomTemplate,
                });
                setCurrentSessionId(id);
                const session = await loadSession(id);
                if (session) exportSessionToJSON(session);
            } catch { /* ignore */ }
        } else {
            const session = await loadSession(currentSessionId);
            if (session) exportSessionToJSON(session);
        }
    };

    // JSON import
    const handleImportJSON = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const imported = await importFromJSON(file);
            setData(imported.data);
            if (imported.labels && Object.keys(imported.labels).length > 0) {
                setCustomLabels(imported.labels);
            }
            if (imported.tags.length > 0) {
                setTemplateTags(imported.tags);
            }
            alert('✅ Đã khôi phục dữ liệu thành công!');
        } catch (err) {
            alert('❌ Lỗi đọc file: ' + (err as Error).message);
        }
        if (jsonInputRef.current) jsonInputRef.current.value = '';
    };

    // Load saved session
    const handleLoadSession = async (session: SavedSession) => {
        setTemplateBuffer(session.templateBuffer);
        setTemplateName(session.name);
        setTemplateTags(session.tags);
        setIsCustomTemplate(session.isCustomTemplate);
        setCustomLabels(session.labels);
        setFileType(session.fileType);
        setData(session.data);
        setCurrentSessionId(session.id!);
        setAutoSaveId(session.id!);
        setLastSaved(session.updatedAt);
        setPreviewReady(false);
        setShowSessions(false);
    };

    // Delete saved session
    const handleDeleteSession = async (id: number) => {
        await deleteSession(id);
        setSavedSessions(await listSessions());
        if (currentSessionId === id) setCurrentSessionId(null);
    };

    const sectionStyle: React.CSSProperties = {
        marginBottom: '1.5rem',
        padding: '1.25rem',
        borderRadius: 'var(--radius, 8px)',
        border: '1px solid var(--border, #e2e8f0)',
        background: 'var(--bg, #fff)',
    };

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: '1.05rem',
        fontWeight: 600,
        marginBottom: '0.75rem',
        paddingBottom: '0.4rem',
        borderBottom: '2px solid var(--primary, #4f46e5)',
        color: 'var(--primary, #4f46e5)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    };

    /* ── Render form fields ── */
    const renderFormFields = () => {
        if (isCustomTemplate) {
            // Custom template: auto-generate simple list of fields
            return (
                <div style={sectionStyle}>
                    <div style={sectionTitleStyle}>📋 Trường dữ liệu ({templateTags.length})</div>
                    {templateTags.map((tag) => (
                        <FormInput
                            key={tag}
                            label={customLabels[tag] || TAG_LABELS[tag] || tag.replace(/_/g, ' ')}
                            name={tag}
                            value={data[tag] || ''}
                            onChange={handleChange}
                            placeholder={TAG_PLACEHOLDERS[tag] || `Nhập ${(customLabels[tag] || tag).replace(/_/g, ' ').toLowerCase()}`}
                        />
                    ))}
                </div>
            );
        }

        // Default template: grouped layout
        return TAG_GROUPS.map((group) => {
            // Only show tags that exist in the template
            const activeTags = group.tags.filter(t => templateTags.includes(t));
            if (activeTags.length === 0) return null;

            return (
                <div key={group.title} style={sectionStyle}>
                    <div style={{ ...sectionTitleStyle, justifyContent: 'space-between' }}>
                        <span>{group.icon} {group.title}</span>
                        {/* Contractor picker for Nhà thầu section */}
                        {group.title === 'Nhà thầu (Bên B)' && !isCustomTemplate && (
                            <div style={{ display: 'flex', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 400 }}>
                                <button className="btn btn-sm" onClick={handleSaveContractor}
                                    style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }} title="Lưu nhà thầu hiện tại">
                                    💾 Lưu NT
                                </button>
                                <div style={{ position: 'relative' }}>
                                    <button className="btn btn-sm" onClick={() => setShowContractorPicker(!showContractorPicker)}
                                        style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}
                                        title={contractors.length > 0 ? 'Chọn nhà thầu đã lưu' : 'Chưa có nhà thầu nào'}>
                                        📋 Chọn NT ({contractors.length})
                                    </button>
                                    {showContractorPicker && contractors.length > 0 && (
                                        <div style={{
                                            position: 'absolute', right: 0, top: '100%', zIndex: 100,
                                            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: 250, padding: '0.25rem',
                                        }}>
                                            {contractors.map(c => (
                                                <div key={c.id} style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '0.4rem 0.5rem', borderRadius: 6, cursor: 'pointer',
                                                }} onClick={() => handleSelectContractor(c)}
                                                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                    <div>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{c.name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>MST: {c.taxCode}</div>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteContractor(c.id!); }}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {group.rows ? (
                        group.rows.map((row, i) => {
                            const activeRowTags = row.filter(t => activeTags.includes(t));
                            if (activeRowTags.length === 0) return null;
                            if (activeRowTags.length === 1) {
                                const tag = activeRowTags[0];
                                return (
                                    <FormInput
                                        key={tag}
                                        label={TAG_LABELS[tag] || tag}
                                        name={tag}
                                        value={data[tag] || ''}
                                        onChange={handleChange}
                                        placeholder={TAG_PLACEHOLDERS[tag] || ''}
                                        error={fieldErrors[tag]}
                                        required={REQUIRED_TAGS.includes(tag)}
                                    />
                                );
                            }
                            return (
                                <div className="form-row" key={i}>
                                    {activeRowTags.map((tag) => (
                                        <FormInput
                                            key={tag}
                                            label={TAG_LABELS[tag] || tag}
                                            name={tag}
                                            value={data[tag] || ''}
                                            onChange={handleChange}
                                            placeholder={TAG_PLACEHOLDERS[tag] || ''}
                                            error={fieldErrors[tag]}
                                            required={REQUIRED_TAGS.includes(tag)}
                                        />
                                    ))}
                                </div>
                            );
                        })
                    ) : (
                        activeTags.map((tag) => (
                            <FormInput
                                key={tag}
                                label={TAG_LABELS[tag] || tag}
                                name={tag}
                                value={data[tag] || ''}
                                onChange={handleChange}
                                placeholder={TAG_PLACEHOLDERS[tag] || ''}
                                error={fieldErrors[tag]}
                                required={REQUIRED_TAGS.includes(tag)}
                            />
                        ))
                    )}
                    {/* Render any tags in this group not covered by rows */}
                    {group.rows && activeTags
                        .filter(t => !group.rows!.flat().includes(t))
                        .map(tag => (
                            <FormInput
                                key={tag}
                                label={TAG_LABELS[tag] || tag}
                                name={tag}
                                value={data[tag] || ''}
                                onChange={handleChange}
                                placeholder={TAG_PLACEHOLDERS[tag] || ''}
                                error={fieldErrors[tag]}
                                required={REQUIRED_TAGS.includes(tag)}
                            />
                        ))}
                </div>
            );
        });
    };

    // Render ALL table editor sections
    const renderTableEditors = () => {
        const cfgEntries = Object.entries(tableConfigs);
        if (cfgEntries.length === 0 || fileType !== 'word') return null;
        return cfgEntries.map(([tiStr, cfg]) => {
            const ti = Number(tiStr);
            const tData = tableDataMap[ti] || [];
            const tableLabel = cfgEntries.length > 1 ? ` (Bảng ${ti + 1})` : '';
            return (
                <div key={ti} style={sectionStyle}>
                    <div style={{ ...sectionTitleStyle, justifyContent: 'space-between' }}>
                        <span>📊 Bảng dữ liệu{tableLabel}</span>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                            {detectedTables.length > cfgEntries.length && (
                                <button className="btn btn-sm" onClick={() => setShowTableSetup(true)}
                                    style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>➕ Thêm bảng</button>
                            )}
                            <button className="btn btn-sm" onClick={() => setShowTableSetup(true)}
                                style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>⚙️ Cấu hình lại</button>
                            <button className="btn btn-sm" onClick={() => {
                                setTableConfigs(prev => { const next = { ...prev }; delete next[ti]; return next; });
                                setTableDataMap(prev => { const next = { ...prev }; delete next[ti]; return next; });
                            }}
                                style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem', color: '#ef4444' }}>✕ Xóa</button>
                        </div>
                    </div>
                    <TableEditor config={cfg} data={tData} onChange={(newData) => setTableDataMap(prev => ({ ...prev, [ti]: newData }))} />
                </div>
            );
        });
    };

    return (
        <>
            <div className="page-header">
                <div className="container">
                    <h1>Hồ sơ sửa chữa công trình</h1>
                    <p>Nhập thông tin một lần — xuất file Word / Excel đầy đủ mẫu biểu</p>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    <div className="contract-layout">
                        {/* LEFT: FORM */}
                        <div className="wizard">
                            <div className="wizard-content">
                                {/* Template selector */}
                                <div style={{
                                    ...sectionStyle,
                                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                    borderColor: '#7dd3fc',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 2 }}>Đang dùng mẫu:</div>
                                            <div style={{ fontWeight: 600 }}>📄 {templateName}</div>
                                            {templateTags.length > 0 && (
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                                                    {templateTags.length} trường dữ liệu
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".docx,.doc,.xlsx,.xls"
                                                style={{ display: 'none' }}
                                                onChange={handleUploadTemplate}
                                            />
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                📤 Tải mẫu khác
                                            </button>
                                            {TEMPLATE_LIBRARY.length > 1 && (
                                                <select
                                                    onChange={e => {
                                                        const t = TEMPLATE_LIBRARY[Number(e.target.value)];
                                                        if (t) handleSelectTemplate(t.file, t.name);
                                                    }}
                                                    style={{ padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>📂 Chọn mẫu</option>
                                                    {TEMPLATE_LIBRARY.map((t, i) => (
                                                        <option key={i} value={i}>{t.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                            {isCustomTemplate && (
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={handleResetTemplate}
                                                >
                                                    ↩️ Mẫu mặc định
                                                </button>
                                            )}
                                            {rawUploadBuffer && (
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={handleReopenScan}
                                                    title="Chọn lại các trường dữ liệu"
                                                >
                                                    ⚙️ Chỉnh trường
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Data management panel */}
                                <div style={{
                                    ...sectionStyle,
                                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                    borderColor: '#86efac',
                                    padding: '0.75rem 1rem',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534' }}>💾 Quản lý dữ liệu</div>
                                            {lastSaved && (
                                                <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: 2 }}>
                                                    ✅ Đã lưu tự động lúc {new Date(lastSaved).toLocaleTimeString('vi')}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                            <button className="btn btn-sm" onClick={handleExportJSON} title="Tải file JSON về máy để sao lưu">
                                                💾 Sao lưu
                                            </button>
                                            <input ref={jsonInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJSON} />
                                            <button className="btn btn-sm" onClick={() => jsonInputRef.current?.click()} title="Khôi phục dữ liệu từ file JSON">
                                                📂 Khôi phục
                                            </button>
                                            <input ref={excelDataInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImportExcelData} />
                                            <button className="btn btn-sm" onClick={() => excelDataInputRef.current?.click()} title="Nhập dữ liệu từ file Excel (hàng 1 = tiêu đề, hàng 2 = dữ liệu)">
                                                📊 Nhập từ Excel
                                            </button>
                                            <button className="btn btn-sm" onClick={() => setShowSessions(!showSessions)} title="Xem danh sách phiên đã lưu">
                                                📑 Mẫu đã lưu ({savedSessions.length})
                                            </button>
                                        </div>
                                    </div>
                                    {/* Saved sessions list */}
                                    {showSessions && savedSessions.length > 0 && (
                                        <div style={{ marginTop: '0.5rem', borderTop: '1px solid #bbf7d0', paddingTop: '0.5rem' }}>
                                            {savedSessions.map(s => (
                                                <div key={s.id} style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '0.35rem 0.5rem', borderRadius: 6,
                                                    background: currentSessionId === s.id ? '#bbf7d0' : 'transparent',
                                                    marginBottom: 2, cursor: 'pointer',
                                                }} onClick={() => handleLoadSession(s)}>
                                                    <div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>📄 {s.name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                            {s.tags.length} trường · {new Date(s.updatedAt).toLocaleDateString('vi')}
                                                        </div>
                                                    </div>
                                                    <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id!); }}
                                                        style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', color: '#ef4444' }} title="Xóa">
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {showSessions && savedSessions.length === 0 && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                                            Chưa có phiên nào được lưu
                                        </div>
                                    )}
                                    {/* Stats */}
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #bbf7d0', paddingTop: '0.5rem' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📑 {savedSessions.length} hồ sơ</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>🏢 {contractors.length} nhà thầu</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📥 {exportHistory.length} lần xuất</div>
                                    </div>
                                </div>

                                {/* Form fields */}
                                {renderFormFields()}

                                {/* Estimate section */}
                                {!isCustomTemplate && (
                                    <div style={{
                                        marginBottom: '1.5rem', padding: '1.25rem',
                                        borderRadius: 'var(--radius, 8px)', border: '1px solid var(--border, #e2e8f0)',
                                        background: 'var(--bg, #fff)',
                                    }}>
                                        <div style={{
                                            fontSize: '1.05rem', fontWeight: 600, marginBottom: showEstimate ? '0.75rem' : 0,
                                            paddingBottom: showEstimate ? '0.4rem' : 0,
                                            borderBottom: showEstimate ? '2px solid var(--primary, #4f46e5)' : 'none',
                                            color: 'var(--primary, #4f46e5)',
                                            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                                        }} onClick={() => setShowEstimate(!showEstimate)}>
                                            <span>📐 Dự toán chi tiết</span>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: 'auto' }}>
                                                {showEstimate ? '▲ Thu gọn' : '▼ Mở rộng'}
                                            </span>
                                        </div>
                                        {showEstimate && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <TableEditor
                                                    config={ESTIMATE_CONFIG}
                                                    data={estimateData}
                                                    onChange={(newData) => {
                                                        setEstimateData(newData);
                                                        // Sync total to SỐ_TIỀN
                                                        const totalCol = ESTIMATE_COLUMNS.findIndex(c => c.type === 'auto_calc');
                                                        if (totalCol >= 0) {
                                                            const total = newData.reduce((sum, row) => {
                                                                const val = parseFloat((row[totalCol] || '0').replace(/\./g, '').replace(',', '.'));
                                                                return sum + (isNaN(val) ? 0 : val);
                                                            }, 0);
                                                            if (total > 0) {
                                                                const formatted = total.toLocaleString('vi-VN');
                                                                const text = numberToVietnamese(formatted);
                                                                setData(prev => ({
                                                                    ...prev,
                                                                    'SỐ_TIỀN': formatted,
                                                                    ...(text ? { 'ST_BẰNG_CHỮ': text } : {}),
                                                                }));
                                                            }
                                                        }
                                                    }}
                                                />
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                                                    💡 Tổng thành tiền sẽ tự động điền vào trường "Số tiền"
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Table editors (multi-table) */}
                                {renderTableEditors()}
                                {/* Add more tables button */}
                                {detectedTables.length > Object.keys(tableConfigs).length && Object.keys(tableConfigs).length > 0 && fileType === 'word' && (
                                    <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                                        <button className="btn btn-sm" onClick={() => setShowTableSetup(true)}
                                            style={{ fontSize: '0.8rem' }}>➕ Cấu hình thêm bảng ({detectedTables.length - Object.keys(tableConfigs).length} bảng còn lại)</button>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="wizard-actions">
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {showClearConfirm ? (
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--danger)' }}>Xóa tất cả?</span>
                                                <button className="btn btn-sm" onClick={() => setShowClearConfirm(false)}>Hủy</button>
                                                <button className="btn btn-sm btn-danger" onClick={confirmClear}>Xóa</button>
                                            </div>
                                        ) : (
                                            <button className="btn btn-secondary" onClick={handleClear}>
                                                🗑️ Xóa tất cả
                                            </button>
                                        )}
                                        {!isCustomTemplate && (
                                            <button className="btn btn-secondary" onClick={handleFillDemo}>
                                                📝 Điền mẫu thử
                                            </button>
                                        )}
                                        <button className="btn btn-secondary" onClick={handleClone} disabled={!templateBuffer}>
                                            📋 Nhân bản
                                        </button>
                                    </div>
                                    <button className="btn btn-primary" onClick={handleExport} disabled={loading || !templateBuffer}>
                                        {loading ? '⏳ Đang xuất...' : `📥 Xuất file ${fileType === 'excel' ? 'Excel (.xlsx)' : 'Word (.docx)'}`}
                                    </button>
                                    <button className="btn btn-secondary" onClick={handleExportPDF} disabled={loading || !previewReady}
                                        style={{ fontSize: '0.85rem' }}>
                                        📄 Xuất PDF
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: LIVE PREVIEW */}
                        <div className="contract-preview">
                            <div className="contract-preview-header">
                                <span>📄 Xem trước {previewLoading && '⏳'}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <button onClick={zoomOut} className="btn btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem', minWidth: 28 }} title="Thu nhỏ">−</button>
                                    <span style={{ fontSize: '0.75rem', minWidth: 36, textAlign: 'center', color: '#64748b', userSelect: 'none', cursor: 'pointer' }} onClick={zoomFit}>{zoom}%</span>
                                    <button onClick={zoomIn} className="btn btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem', minWidth: 28 }} title="Phóng to">+</button>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={handleExport}
                                        disabled={loading || !templateBuffer}
                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', marginLeft: '0.25rem' }}
                                    >
                                        {loading ? '⏳' : '📥 Xuất'}
                                    </button>
                                </div>
                            </div>
                            <div className="contract-preview-body" style={{ overflow: 'auto' }}>
                                {!templateBuffer && (
                                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                                        Đang tải mẫu...
                                    </p>
                                )}
                                <div
                                    ref={previewContainerRef}
                                    style={{
                                        display: previewReady ? 'block' : 'none',
                                        transform: `scale(${zoom / 100})`,
                                        transformOrigin: 'top left',
                                        width: `${10000 / zoom}%`,
                                    }}
                                />
                                {templateBuffer && !previewReady && !previewLoading && (
                                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                                        Đang chuẩn bị xem trước...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* SCAN REVIEW MODAL */}
            {showScanModal && (
                <ScanReviewModal
                    results={scanResults}
                    onConfirm={handleScanConfirm}
                    onCancel={handleScanCancel}
                />
            )}
            {/* TABLE SETUP MODAL */}
            {showTableSetup && detectedTables.length > 0 && (
                <TableSetupModal
                    tables={detectedTables}
                    onConfirm={handleTableConfigConfirm}
                    onClose={() => setShowTableSetup(false)}
                />
            )}
        </>
    );
}
