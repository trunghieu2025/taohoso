import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    fillTemplate,
    fillTemplateWithLists,
    extractTags,
    textToTag,
    renderDocxPreview,
    detectListGroups,
    type ListGroup,
} from '../utils/militaryDocGenerator';
import { FormInput } from '../components/FormField';
import { showToast } from '../components/Toast';
import { useLanguage } from '../i18n/i18n';

/* ── Helper: detect list field ── */
const isListTag = (tag: string) =>
    tag.startsWith('DANH_SACH_') || tag.startsWith('DS_') ||
    tag.startsWith('DANHSACH') || tag.startsWith('DANH_SACH');

export default function InvitationForm() {
    const navigate = useNavigate();
    const { lang } = useLanguage();
    const isVi = lang === 'vi';
    const fileRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    /* ── State ── */
    const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
    const [templateName, setTemplateName] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [data, setData] = useState<Record<string, string>>({});
    const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
    const [zoom, setZoom] = useState(55);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [loading, setLoading] = useState(false);

    /* ── List groups (auto-detected) ── */
    const [listGroups, setListGroups] = useState<ListGroup[]>([]);
    const [listData, setListData] = useState<Record<string, string[]>>({});

    // Tags that belong to a list group (should be hidden from regular form)
    const listGroupTags = new Set(listGroups.flatMap(g => g.tags));

    /* ── Saved sessions ── */
    const STORAGE_KEY = 'invitation_sessions';
    const [savedSessions, setSavedSessions] = useState<any[]>(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
    });
    const saveSessions = (s: any[]) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); };

    /* ── Saved project templates (reusable blank templates) ── */
    const TEMPLATE_KEY = 'invitation_templates';
    const [savedTemplates, setSavedTemplates] = useState<any[]>(() => {
        try { return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || '[]'); } catch { return []; }
    });
    const saveTemplates = (t: any[]) => { localStorage.setItem(TEMPLATE_KEY, JSON.stringify(t)); };

    /* ── Load template from buffer ── */
    const loadTemplateBuffer = (buffer: ArrayBuffer, name: string) => {
        setTemplateBuffer(buffer);
        setTemplateName(name);

        // Scan tags
        const scanned = extractTags(buffer);
        setTags(scanned);
        const newData: Record<string, string> = {};
        const newLabels: Record<string, string> = {};
        scanned.forEach((tag: string) => {
            newData[tag] = '';
            if (isListTag(tag)) {
                newLabels[tag] = tag.replace(/^(DANH_SACH_|DS_)/, '').replace(/_/g, ' ');
                newData[tag] = '[""]';
            }
        });
        setData(newData);
        setCustomLabels(newLabels);

        // Auto-detect list groups
        const groups = detectListGroups(buffer);
        setListGroups(groups);
        // Initialize list data with default values from tags
        const newListData: Record<string, string[]> = {};
        for (const g of groups) {
            newListData[g.id] = g.tags.map(() => ''); // Empty rows matching original count
        }
        setListData(newListData);

        const listCount = groups.reduce((sum, g) => sum + g.tags.length, 0);
        const regularCount = scanned.length - listCount;
        showToast(isVi ? `Đã quét ${scanned.length} trường (${groups.length} nhóm danh sách, ${regularCount} trường thường)` : `Scanned ${scanned.length} fields (${groups.length} list groups, ${regularCount} regular fields)`);
        handlePreview(buffer);
    };

    /* ── File upload ── */
    const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.endsWith('.docx')) { showToast(isVi ? 'Chỉ hỗ trợ file .docx' : 'Only .docx files are supported'); return; }
        const buffer = await file.arrayBuffer();
        loadTemplateBuffer(buffer, file.name);
    };

    /* ── Load sample template ── */
    const loadSampleTemplate = async () => {
        try {
            const res = await fetch('/templates/mau-giay-moi.docx');
            if (!res.ok) throw new Error(isVi ? 'Không tìm thấy file mẫu' : 'Template file not found');
            const buffer = await res.arrayBuffer();
            loadTemplateBuffer(buffer, 'mau-giay-moi.docx');
        } catch (err) {
            showToast((isVi ? 'Lỗi tải mẫu: ' : 'Load error: ') + (err as Error).message);
        }
    };

    /* ── Build merged data for preview/export ── */
    const getMergedData = () => {
        const merged = { ...data };
        // List group tags should NOT be in merged data (they're handled separately)
        for (const tag of listGroupTags) {
            delete merged[tag];
        }
        return merged;
    };

    /* ── Preview ── */
    const handlePreview = async (buf?: ArrayBuffer) => {
        const b = buf || templateBuffer;
        if (!b || !previewRef.current) return;
        setPreviewLoading(true);
        try {
            if (listGroups.length > 0) {
                // Use list-aware fill
                const filled = fillTemplateWithLists(b, getMergedData(), listGroups, listData);
                await renderDocxPreview(filled, {}, previewRef.current);
            } else {
                await renderDocxPreview(b, data, previewRef.current);
            }
        } catch { /* ignore */ }
        setPreviewLoading(false);
    };

    // Auto update preview when data changes
    useEffect(() => {
        if (templateBuffer) {
            const t = setTimeout(() => handlePreview(), 500);
            return () => clearTimeout(t);
        }
    }, [data, listData, templateBuffer]);

    /* ── handleChange for regular inputs ── */
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    /* ── Export Word ── */
    const handleExport = async () => {
        if (!templateBuffer) return;
        setLoading(true);
        try {
            let filled: ArrayBuffer;
            if (listGroups.length > 0) {
                filled = fillTemplateWithLists(templateBuffer, getMergedData(), listGroups, listData);
            } else {
                filled = fillTemplate(templateBuffer, data);
            }
            const blob = new Blob([filled], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = templateName.replace('.docx', '_filled.docx');
            a.click();
            URL.revokeObjectURL(url);
            showToast(isVi ? 'Đã xuất file thành công!' : 'File exported successfully!', 'success');
        } catch (err) {
            showToast((isVi ? 'Lỗi khi xuất: ' : 'Export error: ') + (err as Error).message);
        }
        setLoading(false);
    };

    /* ── Export PDF ── */
    const handleExportPDF = async () => {
        if (!previewRef.current) return;
        setLoading(true);
        try {
            const { default: html2pdf } = await import('html2pdf.js');
            await html2pdf().from(previewRef.current).set({
                margin: 10, filename: templateName.replace('.docx', '.pdf'),
                html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).save();
            showToast(isVi ? 'Đã xuất PDF!' : 'PDF exported!', 'success');
        } catch (err) { showToast((isVi ? 'Lỗi xuất PDF: ' : 'PDF export error: ') + (err as Error).message); }
        setLoading(false);
    };

    /* ── Helper: ArrayBuffer <-> Base64 ── */
    const bufferToBase64 = (buf: ArrayBuffer): string => {
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
    };
    const base64ToBuffer = (b64: string): ArrayBuffer => {
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes.buffer;
    };

    /* ── Save/Load session ── */
    const handleSave = () => {
        const name = prompt(isVi ? 'Tên phiên:' : 'Session name:', isVi ? `Giấy mời ${new Date().toLocaleDateString('vi-VN')}` : `Invitation ${new Date().toLocaleDateString('en-US')}`);
        if (!name) return;
        const session = {
            id: Date.now().toString(), name, data, labels: customLabels, tags, templateName,
            listData, listGroups,
            templateBase64: templateBuffer ? bufferToBase64(templateBuffer) : null,
            date: new Date().toISOString()
        };
        const sessions = [...savedSessions, session];
        saveSessions(sessions);
        setSavedSessions(sessions);
        showToast(isVi ? `Đã lưu "${name}"` : `Saved "${name}"`);
    };

    const handleLoad = (s: any) => {
        setData(s.data || {});
        setCustomLabels(s.labels || {});
        setTags(s.tags || []);
        setTemplateName(s.templateName || '');
        if (s.listData) setListData(s.listData);
        if (s.listGroups) setListGroups(s.listGroups);
        // Restore template buffer from base64
        if (s.templateBase64) {
            const buf = base64ToBuffer(s.templateBase64);
            setTemplateBuffer(buf);
            showToast(isVi ? `Đã tải "${s.name}" — sẵn sàng chỉnh sửa & xuất file` : `Loaded "${s.name}" — ready to edit & export`);
            setTimeout(() => handlePreview(buf), 300);
        } else {
            showToast(isVi ? `Đã tải dữ liệu "${s.name}" — cần upload lại file mẫu` : `Loaded data "${s.name}" — please re-upload template`);
        }
    };

    const handleDelete = (id: string) => {
        if (!confirm(isVi ? 'Xóa phiên này?' : 'Delete this session?')) return;
        const sessions = savedSessions.filter(s => s.id !== id);
        saveSessions(sessions);
        setSavedSessions(sessions);
    };

    const handleRename = (id: string) => {
        const s = savedSessions.find(s => s.id === id);
        if (!s) return;
        const name = prompt(isVi ? 'Đổi tên:' : 'Rename:', s.name);
        if (!name) return;
        const sessions = savedSessions.map(s => s.id === id ? { ...s, name } : s);
        saveSessions(sessions);
        setSavedSessions(sessions);
    };

    /* ── Save/Load/Delete project templates ── */
    const handleSaveAsTemplate = () => {
        if (!templateBuffer) return;
        const name = prompt(isVi ? 'Tên mẫu dự án:' : 'Project template name:', templateName.replace('.docx', ''));
        if (!name) return;
        const tmpl = {
            id: Date.now().toString(), name, templateName,
            tags, listGroups, labels: customLabels,
            templateBase64: bufferToBase64(templateBuffer),
            date: new Date().toISOString()
        };
        const templates = [...savedTemplates, tmpl];
        saveTemplates(templates);
        setSavedTemplates(templates);
        showToast(isVi ? `Đã lưu mẫu dự án "${name}" — dùng lại không cần upload!` : `Saved project template "${name}" — reuse without re-uploading!`);
    };

    const handleLoadTemplate = (t: any) => {
        if (!t.templateBase64) { showToast(isVi ? 'Mẫu không có file template' : 'Template has no file data'); return; }
        const buf = base64ToBuffer(t.templateBase64);
        loadTemplateBuffer(buf, t.templateName || 'template.docx');
        showToast(isVi ? `Đã tải mẫu "${t.name}" — điền dữ liệu mới!` : `Loaded template "${t.name}" — fill new data!`);
    };

    const handleDeleteTemplate = (id: string) => {
        if (!confirm(isVi ? 'Xóa mẫu dự án này?' : 'Delete this project template?')) return;
        const templates = savedTemplates.filter(t => t.id !== id);
        saveTemplates(templates);
        setSavedTemplates(templates);
    };

    /* ── Styles ── */
    const S: React.CSSProperties = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem' };
    const btnSm: React.CSSProperties = { fontSize: '0.75rem', padding: '0.2rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', background: '#f8fafc' };

    /* ── Render ── */
    return (
        <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem' }}>
            {/* Header */}
            <div style={{ ...S, background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderColor: '#93c5fd', textAlign: 'center' }}>
                <h2 style={{ margin: 0, color: '#1e40af', fontSize: '1.3rem' }}>📨 {isVi ? 'Giấy mời & Văn bản có danh sách' : 'Invitations & List Documents'}</h2>
                <p style={{ color: '#475569', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
                    {isVi ? 'Upload mẫu Word của bạn → app tự nhận diện danh sách → thêm/bớt người linh động → xuất file' : 'Upload your Word template → app auto-detects lists → add/remove items flexibly → export file'}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <button className="btn btn-sm" onClick={() => navigate('/huong-dan/tao-ho-so')} style={{ ...btnSm, background: '#dbeafe', color: '#1d4ed8' }}>❓ {isVi ? 'Hướng dẫn' : 'Guide'}</button>
                    <button className="btn btn-sm" onClick={() => navigate('/')} style={btnSm}>🏠 {isVi ? 'Trang chủ' : 'Home'}</button>
                </div>
            </div>

            {!templateBuffer ? (
                /* ── Upload section ── */
                <div style={{ ...S, textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📄</div>
                    <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>{isVi ? 'Upload mẫu giấy mời Word (.docx)' : 'Upload Invitation Word Template (.docx)'}</h3>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        {isVi ? <>App sẽ <b>tự nhận diện</b> các danh sách đại biểu, phân công nhiệm vụ trong file của bạn.<br />Không cần chỉnh sửa file mẫu — upload nguyên bản!</> : <>The app will <b>auto-detect</b> delegate lists and task assignments in your file.<br />No need to edit the template — upload as-is!</>}
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={() => fileRef.current?.click()}
                            style={{ padding: '0.6rem 1.5rem', fontSize: '1rem' }}>
                            📂 {isVi ? 'Chọn file Word của bạn' : 'Choose your Word file'}
                        </button>
                        <button className="btn btn-secondary" onClick={loadSampleTemplate}
                            style={{ padding: '0.6rem 1.5rem', fontSize: '1rem', background: '#fef3c7', borderColor: '#fbbf24', color: '#92400e' }}>
                            📨 {isVi ? 'Dùng mẫu giấy mời sẵn' : 'Use sample template'}
                        </button>
                    </div>
                    <input ref={fileRef} type="file" accept=".docx" style={{ display: 'none' }} onChange={handleUpload} />

                    {/* Saved project templates */}
                    {savedTemplates.length > 0 && (
                        <div style={{ marginTop: '1.5rem', textAlign: 'left', ...S, background: '#faf5ff', borderColor: '#c4b5fd' }}>
                            <div style={{ fontWeight: 600, color: '#6d28d9', marginBottom: '0.5rem' }}>🗂️ {isVi ? 'Mẫu dự án đã lưu' : 'Saved Project Templates'} ({savedTemplates.length})</div>
                            <p style={{ fontSize: '0.75rem', color: '#7c3aed', margin: '0 0 0.5rem' }}>{isVi ? 'Click để dùng lại — không cần upload lại file!' : 'Click to reuse — no need to re-upload!'}</p>
                            {savedTemplates.map(t => (
                                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.35rem 0.5rem', marginBottom: '0.3rem', borderRadius: 6, background: '#ede9fe', cursor: 'pointer' }}
                                    onClick={() => handleLoadTemplate(t)}>
                                    <span style={{ flex: 1, color: '#6d28d9', fontWeight: 500 }}>
                                        📚 {t.name}
                                        <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.7rem', marginLeft: '0.3rem' }}>
                                            ({t.tags?.length || 0} {isVi ? 'trường' : 'fields'} • {new Date(t.date).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')})
                                        </span>
                                    </span>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem' }} title="Xóa mẫu">✕</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Saved sessions */}
                    {savedSessions.length > 0 && (
                        <div style={{ marginTop: '1rem', textAlign: 'left', ...S, background: '#f0fdf4', borderColor: '#86efac' }}>
                            <div style={{ fontWeight: 600, color: '#166534', marginBottom: '0.5rem' }}>📂 {isVi ? 'Phiên đã lưu' : 'Saved Sessions'} ({savedSessions.length})</div>
                            <p style={{ fontSize: '0.75rem', color: '#166534', margin: '0 0 0.5rem' }}>{isVi ? 'Click để tiếp tục chỉnh sửa (có sẵn dữ liệu đã điền)' : 'Click to continue editing (pre-filled data)'}</p>
                            {savedSessions.map(s => (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.25rem 0', borderBottom: '1px solid #dcfce7' }}>
                                    <span style={{ flex: 1, cursor: 'pointer', color: '#166534' }} onClick={() => handleLoad(s)} title="Click để tải">
                                        📄 {s.name} <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>({new Date(s.date).toLocaleDateString('vi-VN')})</span>
                                    </span>
                                    <button onClick={() => handleRename(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: '0.8rem' }} title="Đổi tên">✏️</button>
                                    <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem' }} title="Xóa">✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* ── Form + Preview ── */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* LEFT: Form */}
                    <div>
                        <div style={{ ...S, background: '#f0fdf4', borderColor: '#86efac' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ fontWeight: 600, color: '#166534', fontSize: '0.9rem' }}>📝 {isVi ? 'Điền thông tin' : 'Fill Information'}</div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{templateName}</span>
                            </div>

                            {/* Data management buttons */}
                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                <button className="btn btn-sm" onClick={handleSave} style={btnSm}>💿 {isVi ? 'Lưu phiên' : 'Save Session'}</button>
                                <button className="btn btn-sm" onClick={handleSaveAsTemplate} style={{ ...btnSm, background: '#faf5ff', color: '#7c3aed', borderColor: '#c4b5fd' }}>📚 {isVi ? 'Lưu làm mẫu dự án' : 'Save as Template'}</button>
                                <button className="btn btn-sm" onClick={() => { setTemplateBuffer(null); setTags([]); setData({}); setListGroups([]); setListData({}); }} style={{ ...btnSm, color: '#ef4444' }}>↩️ {isVi ? 'Đổi mẫu' : 'Change Template'}</button>
                            </div>

                            {/* ═══ LIST GROUPS (auto-detected) ═══ */}
                            {listGroups.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#7c3aed', marginBottom: '0.5rem' }}>
                                        🔍 {isVi ? `Đã nhận diện ${listGroups.length} nhóm danh sách — thêm/bớt tùy ý` : `Detected ${listGroups.length} list groups — add/remove freely`}
                                    </div>
                                    {listGroups.map((group, gIdx) => {
                                        const items = listData[group.id] || [];
                                        return (
                                            <div key={group.id} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: '#faf5ff', borderRadius: 8, border: '1px solid #c4b5fd' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#6d28d9' }}>
                                                        📋 {isVi ? 'Nhóm' : 'Group'} {gIdx + 1}: {group.tags.length} {isVi ? 'dòng gốc' : 'original rows'}
                                                        <span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#64748b', marginLeft: '0.3rem' }}>
                                                            ({isVi ? 'hiện' : 'current'}: {items.length} {isVi ? 'dòng' : 'rows'})
                                                        </span>
                                                    </label>
                                                    <button className="btn btn-sm"
                                                        onClick={() => {
                                                            setListData(prev => ({
                                                                ...prev,
                                                                [group.id]: [...(prev[group.id] || []), '']
                                                            }));
                                                        }}
                                                        style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd', borderRadius: 4 }}>
                                                        ➕ {isVi ? 'Thêm dòng' : 'Add row'}
                                                    </button>
                                                </div>
                                                {items.map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.3rem', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.75rem', color: '#6d28d9', minWidth: 20, fontWeight: 600 }}>{idx + 1}.</span>
                                                        <input
                                                            value={item}
                                                            onChange={(e) => {
                                                                setListData(prev => {
                                                                    const newItems = [...(prev[group.id] || [])];
                                                                    newItems[idx] = e.target.value;
                                                                    return { ...prev, [group.id]: newItems };
                                                                });
                                                            }}
                                                            placeholder={group.tags[idx] ? `Gốc: ${group.tags[idx].replace(/_/g, ' ').toLowerCase()}` : `Dòng mới ${idx + 1}...`}
                                                            style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem', border: '1px solid #c4b5fd', borderRadius: 4, background: '#fff' }}
                                                        />
                                                        {items.length > 1 && (
                                                            <button
                                                                onClick={() => {
                                                                    setListData(prev => ({
                                                                        ...prev,
                                                                        [group.id]: (prev[group.id] || []).filter((_, i) => i !== idx)
                                                                    }));
                                                                }}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.85rem' }}
                                                                title="Xóa dòng">✕</button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ═══ REGULAR FIELDS (non-list) ═══ */}
                            {tags.filter(tag => !listGroupTags.has(tag)).map(tag => {
                                if (isListTag(tag)) {
                                    let items: string[] = [];
                                    try { const p = JSON.parse(data[tag] || '[""]'); items = Array.isArray(p) ? p : ['']; } catch { items = ['']; }
                                    return (
                                        <div key={tag} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0369a1' }}>
                                                    📋 {customLabels[tag] || tag.replace(/^(DANH_SACH_|DS_)/, '').replace(/_/g, ' ')}
                                                    <span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#64748b', marginLeft: '0.3rem' }}>({items.filter(i => i.trim()).length} {isVi ? 'mục' : 'items'})</span>
                                                </label>
                                                <button className="btn btn-sm"
                                                    onClick={() => { const ni = [...items, '']; setData(prev => ({ ...prev, [tag]: JSON.stringify(ni) })); }}
                                                    style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: 4 }}>
                                                    ➕ {isVi ? 'Thêm dòng' : 'Add row'}
                                                </button>
                                            </div>
                                            {items.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.3rem', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b', minWidth: 20 }}>{idx + 1}.</span>
                                                    <input value={item} onChange={(e) => {
                                                        const ni = [...items]; ni[idx] = e.target.value;
                                                        setData(prev => ({ ...prev, [tag]: JSON.stringify(ni) }));
                                                    }} placeholder={`Dòng ${idx + 1}...`}
                                                        style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: 4 }} />
                                                    {items.length > 1 && (
                                                        <button onClick={() => { const ni = items.filter((_, i) => i !== idx); setData(prev => ({ ...prev, [tag]: JSON.stringify(ni) })); }}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.85rem' }} title="Xóa">✕</button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }
                                return (
                                    <div key={tag}>
                                        <FormInput label={customLabels[tag] || tag.replace(/_/g, ' ')} name={tag}
                                            value={data[tag] || ''} onChange={handleChange}
                                            placeholder={`Nhập ${(customLabels[tag] || tag).replace(/_/g, ' ').toLowerCase()}`} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Export buttons */}
                        <div style={{ ...S, display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button className="btn btn-primary" onClick={handleExport} disabled={loading} style={{ padding: '0.5rem 1.2rem' }}>
                                {loading ? '⏳' : `📥 ${isVi ? 'Xuất Word' : 'Export Word'}`}
                            </button>
                            <button className="btn btn-secondary" onClick={handleExportPDF} disabled={loading} style={{ padding: '0.5rem 1.2rem' }}>
                                📄 {isVi ? 'Xuất PDF' : 'Export PDF'}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Preview */}
                    <div style={{ position: 'sticky', top: '2.5rem', alignSelf: 'start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: 600 }}>👁️ {isVi ? 'Xem trước' : 'Preview'}</span>
                            <button className="btn btn-sm" onClick={() => setZoom(z => Math.max(20, z - 10))} style={btnSm}>−</button>
                            <span style={{ minWidth: 35, textAlign: 'center' }}>{zoom}%</span>
                            <button className="btn btn-sm" onClick={() => setZoom(z => Math.min(100, z + 10))} style={btnSm}>+</button>
                            {previewLoading && <span style={{ color: '#64748b' }}>⏳</span>}
                        </div>
                        <div style={{ ...S, height: 'calc(100vh - 200px)', overflow: 'auto' }}>
                            <div ref={previewRef} style={{ zoom: zoom / 100 }} />
                            {!previewRef.current?.innerHTML && (
                                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>{isVi ? 'Upload file để xem trước' : 'Upload file to preview'}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
