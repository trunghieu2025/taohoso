import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    fillTemplate,
    extractTags,
    textToTag,
    renderDocxPreview,
} from '../utils/militaryDocGenerator';
import { FormInput } from '../components/FormField';
import { showToast } from '../components/Toast';

/* ── Helper: detect list field ── */
const isListTag = (tag: string) => tag.startsWith('DANH_SACH_') || tag.startsWith('DS_');

export default function InvitationForm() {
    const navigate = useNavigate();
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

    /* ── Saved sessions ── */
    const STORAGE_KEY = 'invitation_sessions';
    const [savedSessions, setSavedSessions] = useState<any[]>(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
    });
    const saveSessions = (s: any[]) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); };

    /* ── File upload ── */
    const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.endsWith('.docx')) { showToast('Chỉ hỗ trợ file .docx'); return; }
        const buffer = await file.arrayBuffer();
        setTemplateBuffer(buffer);
        setTemplateName(file.name);
        // Scan tags
        const scanned = extractTags(buffer);
        setTags(scanned);
        const newData: Record<string, string> = {};
        const newLabels: Record<string, string> = {};
        scanned.forEach((tag: string) => {
            newData[tag] = '';
            // Auto-label: remove DANH_SACH_ prefix and replace _ with space
            if (isListTag(tag)) {
                newLabels[tag] = tag.replace(/^(DANH_SACH_|DS_)/, '').replace(/_/g, ' ');
                newData[tag] = '[""]';  // Start with 1 empty row
            }
        });
        setData(newData);
        setCustomLabels(newLabels);
        showToast(`Đã quét ${scanned.length} trường từ "${file.name}"`);
        // Auto preview
        handlePreview(buffer);
    };

    /* ── Preview ── */
    const handlePreview = async (buf?: ArrayBuffer) => {
        const b = buf || templateBuffer;
        if (!b || !previewRef.current) return;
        setPreviewLoading(true);
        try {
            await renderDocxPreview(b, data, previewRef.current);
        } catch { /* ignore */ }
        setPreviewLoading(false);
    };

    // Auto update preview when data changes
    useEffect(() => {
        if (templateBuffer) {
            const t = setTimeout(() => handlePreview(), 500);
            return () => clearTimeout(t);
        }
    }, [data, templateBuffer]);

    /* ── handleChange for regular inputs ── */
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    /* ── Export Word ── */
    const handleExport = async () => {
        if (!templateBuffer) return;
        setLoading(true);
        try {
            const filled = fillTemplate(templateBuffer, data);
            const blob = new Blob([filled], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = templateName.replace('.docx', '_filled.docx');
            a.click();
            URL.revokeObjectURL(url);
            showToast('Đã xuất file thành công!', 'success');
        } catch (err) {
            showToast('Lỗi khi xuất: ' + (err as Error).message);
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
            showToast('Đã xuất PDF!', 'success');
        } catch (err) { showToast('Lỗi xuất PDF: ' + (err as Error).message); }
        setLoading(false);
    };

    /* ── Save/Load session ── */
    const handleSave = () => {
        const name = prompt('Tên phiên:', `Giấy mời ${new Date().toLocaleDateString('vi-VN')}`);
        if (!name) return;
        const session = { id: Date.now().toString(), name, data, labels: customLabels, tags, templateName, date: new Date().toISOString() };
        const sessions = [...savedSessions, session];
        saveSessions(sessions);
        setSavedSessions(sessions);
        showToast(`Đã lưu "${name}"`);
    };

    const handleLoad = (s: any) => {
        setData(s.data || {});
        setCustomLabels(s.labels || {});
        setTags(s.tags || []);
        showToast(`Đã tải "${s.name}"`);
    };

    const handleDelete = (id: string) => {
        if (!confirm('Xóa phiên này?')) return;
        const sessions = savedSessions.filter(s => s.id !== id);
        saveSessions(sessions);
        setSavedSessions(sessions);
    };

    const handleRename = (id: string) => {
        const s = savedSessions.find(s => s.id === id);
        if (!s) return;
        const name = prompt('Đổi tên:', s.name);
        if (!name) return;
        const sessions = savedSessions.map(s => s.id === id ? { ...s, name } : s);
        saveSessions(sessions);
        setSavedSessions(sessions);
    };

    /* ── Styles ── */
    const S: React.CSSProperties = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem' };
    const btnSm: React.CSSProperties = { fontSize: '0.75rem', padding: '0.2rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', background: '#f8fafc' };

    /* ── Render ── */
    return (
        <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem' }}>
            {/* Header */}
            <div style={{ ...S, background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderColor: '#93c5fd', textAlign: 'center' }}>
                <h2 style={{ margin: 0, color: '#1e40af', fontSize: '1.3rem' }}>📨 Giấy mời & Văn bản có danh sách</h2>
                <p style={{ color: '#475569', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
                    Upload mẫu Word với trường [DANH_SACH_XXX] → thêm/bớt người linh động → xuất file
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <button className="btn btn-sm" onClick={() => navigate('/huong-dan/tao-ho-so')} style={{ ...btnSm, background: '#dbeafe', color: '#1d4ed8' }}>❓ Hướng dẫn</button>
                    <button className="btn btn-sm" onClick={() => navigate('/')} style={btnSm}>🏠 Trang chủ</button>
                </div>
            </div>

            {!templateBuffer ? (
                /* ── Upload section ── */
                <div style={{ ...S, textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📄</div>
                    <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>Upload mẫu giấy mời Word (.docx)</h3>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        Đặt <code>[DANH_SACH_DAI_BIEU]</code>, <code>[DANH_SACH_PHAN_CONG]</code> v.v. trong template để tạo danh sách động.
                        <br />Các trường thường như <code>[HỌ TÊN]</code>, <code>[NGÀY]</code> vẫn hoạt động bình thường.
                    </p>
                    <button className="btn btn-primary" onClick={() => fileRef.current?.click()}
                        style={{ padding: '0.6rem 1.5rem', fontSize: '1rem' }}>
                        📂 Chọn file Word
                    </button>
                    <input ref={fileRef} type="file" accept=".docx" style={{ display: 'none' }} onChange={handleUpload} />

                    {/* Saved sessions */}
                    {savedSessions.length > 0 && (
                        <div style={{ marginTop: '1.5rem', textAlign: 'left', ...S, background: '#f0fdf4', borderColor: '#86efac' }}>
                            <div style={{ fontWeight: 600, color: '#166534', marginBottom: '0.5rem' }}>📂 Phiên đã lưu ({savedSessions.length})</div>
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
                                <div style={{ fontWeight: 600, color: '#166534', fontSize: '0.9rem' }}>📝 Điền thông tin</div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{templateName}</span>
                            </div>

                            {/* Data management buttons */}
                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                <button className="btn btn-sm" onClick={handleSave} style={btnSm}>💿 Lưu phiên</button>
                                <button className="btn btn-sm" onClick={() => { setTemplateBuffer(null); setTags([]); setData({}); }} style={{ ...btnSm, color: '#ef4444' }}>↩️ Đổi mẫu</button>
                            </div>

                            {/* Progress bar */}
                            {(() => {
                                const filled = tags.filter(t => {
                                    if (isListTag(t)) {
                                        try { const p = JSON.parse(data[t] || '[]'); return Array.isArray(p) && p.some(i => i?.trim()); } catch { return !!data[t]?.trim(); }
                                    }
                                    return !!data[t]?.trim();
                                }).length;
                                const pct = tags.length > 0 ? Math.round((filled / tags.length) * 100) : 0;
                                return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                                            <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: pct === 100 ? '#10b981' : '#3b82f6', transition: 'width 0.3s' }} />
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: pct === 100 ? '#059669' : '#3b82f6' }}>{pct}%</span>
                                    </div>
                                );
                            })()}

                            {/* Fields */}
                            {tags.map(tag => {
                                if (isListTag(tag)) {
                                    let items: string[] = [];
                                    try { const p = JSON.parse(data[tag] || '[""]'); items = Array.isArray(p) ? p : ['']; } catch { items = ['']; }
                                    return (
                                        <div key={tag} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0369a1' }}>
                                                    📋 {customLabels[tag] || tag.replace(/^(DANH_SACH_|DS_)/, '').replace(/_/g, ' ')}
                                                    <span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#64748b', marginLeft: '0.3rem' }}>({items.filter(i => i.trim()).length} mục)</span>
                                                </label>
                                                <button className="btn btn-sm"
                                                    onClick={() => { const ni = [...items, '']; setData(prev => ({ ...prev, [tag]: JSON.stringify(ni) })); }}
                                                    style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: 4 }}>
                                                    ➕ Thêm dòng
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
                                {loading ? '⏳' : '📥 Xuất Word'}
                            </button>
                            <button className="btn btn-secondary" onClick={handleExportPDF} disabled={loading} style={{ padding: '0.5rem 1.2rem' }}>
                                📄 Xuất PDF
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Preview */}
                    <div style={{ position: 'sticky', top: '2.5rem', alignSelf: 'start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: 600 }}>👁️ Xem trước</span>
                            <button className="btn btn-sm" onClick={() => setZoom(z => Math.max(20, z - 10))} style={btnSm}>−</button>
                            <span style={{ minWidth: 35, textAlign: 'center' }}>{zoom}%</span>
                            <button className="btn btn-sm" onClick={() => setZoom(z => Math.min(100, z + 10))} style={btnSm}>+</button>
                            {previewLoading && <span style={{ color: '#64748b' }}>⏳</span>}
                        </div>
                        <div style={{ ...S, height: 'calc(100vh - 200px)', overflow: 'auto' }}>
                            <div ref={previewRef} style={{ zoom: zoom / 100 }} />
                            {!previewRef.current?.innerHTML && (
                                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Upload file để xem trước</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
