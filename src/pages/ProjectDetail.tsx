import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    loadProject, saveProject,
    type Project, type ChecklistItem, type Milestone, type CustomField,
} from '../utils/projectStorage';
import ProjectSearch from '../components/ProjectSearch';

const STATUS_OPTIONS = [
    { value: 'new', label: '⚪ Mới' },
    { value: 'in_progress', label: '🟡 Đang làm' },
    { value: 'completed', label: '🟢 Hoàn thành' },
];

function genId(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export default function ProjectDetail() {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showFormData, setShowFormData] = useState(false);

    useEffect(() => {
        if (id) loadProject(parseInt(id)).then(setProject);
    }, [id]);

    const save = useCallback(async (updated: Project) => {
        setSaving(true);
        try {
            await saveProject({ ...updated, id: updated.id });
            setProject(updated);
        } catch { /* ignore */ }
        setSaving(false);
    }, []);

    if (!project) return (
        <div className="container" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '2rem' }}>📂</div>
            <div>Không tìm thấy dự án</div>
            <Link to="/quan-ly-du-an" style={{ marginTop: '1rem', display: 'inline-block' }}>← Quay lại</Link>
        </div>
    );

    const checkDone = project.checklist.filter(c => c.done).length;
    const checkTotal = project.checklist.length;

    const updateField = (field: keyof Project, value: any) => {
        const updated = { ...project, [field]: value };
        setProject(updated);
        save(updated);
    };

    const toggleChecklist = (itemId: string) => {
        const updated = {
            ...project,
            checklist: project.checklist.map(c =>
                c.id === itemId ? { ...c, done: !c.done, doneDate: !c.done ? new Date().toISOString() : undefined } : c
            ),
        };
        setProject(updated);
        save(updated);
    };

    const addChecklistItem = () => {
        const label = prompt('Tên mục hồ sơ:');
        if (!label) return;
        const updated = {
            ...project,
            checklist: [...project.checklist, { id: genId(), label, done: false }],
        };
        setProject(updated);
        save(updated);
    };

    const removeChecklistItem = (itemId: string) => {
        const updated = { ...project, checklist: project.checklist.filter(c => c.id !== itemId) };
        setProject(updated);
        save(updated);
    };

    const updateMilestone = (msId: string, field: keyof Milestone, value: string) => {
        const updated = {
            ...project,
            milestones: project.milestones.map(m =>
                m.id === msId ? { ...m, [field]: value, ...(field === 'date' && value ? { status: 'done' as const } : {}) } : m
            ),
        };
        setProject(updated);
        save(updated);
    };

    const addMilestone = () => {
        const label = prompt('Tên mốc tiến độ:');
        if (!label) return;
        const updated = {
            ...project,
            milestones: [...project.milestones, { id: genId(), label, date: '', status: 'pending' as const }],
        };
        setProject(updated);
        save(updated);
    };

    const removeMilestone = (msId: string) => {
        const updated = { ...project, milestones: project.milestones.filter(m => m.id !== msId) };
        setProject(updated);
        save(updated);
    };

    const addCustomField = () => {
        const label = prompt('Tên trường (VD: Số HĐ, Bảo hành...):');
        if (!label) return;
        const updated = {
            ...project,
            customFields: [...(project.customFields || []), { label, value: '' }],
        };
        setProject(updated);
        save(updated);
    };

    const updateCustomField = (idx: number, value: string) => {
        const fields = [...(project.customFields || [])];
        fields[idx] = { ...fields[idx], value };
        const updated = { ...project, customFields: fields };
        setProject(updated);
        save(updated);
    };

    const removeCustomField = (idx: number) => {
        const fields = [...(project.customFields || [])];
        fields.splice(idx, 1);
        const updated = { ...project, customFields: fields };
        setProject(updated);
        save(updated);
    };

    const sectionStyle: React.CSSProperties = {
        padding: '1rem 1.25rem', borderRadius: 12, border: '1px solid #e2e8f0',
        marginBottom: '1rem', background: '#fff',
    };
    const sectionTitle: React.CSSProperties = {
        fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem',
        color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    };
    const fieldRow: React.CSSProperties = { display: 'flex', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' };
    const fieldLabel: React.CSSProperties = { fontSize: '0.75rem', color: '#64748b', marginBottom: 2 };
    const fieldValue: React.CSSProperties = { fontSize: '0.9rem', fontWeight: 500 };
    const inputStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.85rem', width: '100%' };

    return (
        <div className="container" style={{ maxWidth: 1100, padding: '1.5rem 1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link to="/quan-ly-du-an" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← Quản lý DA</Link>
                    <h1 style={{ fontSize: '1.3rem', margin: 0 }}>{project.name}</h1>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {saving && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>💾 Đang lưu...</span>}
                    <button className="btn btn-sm" onClick={() => setEditing(!editing)}>
                        {editing ? '✅ Xong' : '🖊 Sửa'}
                    </button>
                </div>
            </div>

            {/* Search */}
            <ProjectSearch project={project} />

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                {/* Left column */}
                <div>
                    {/* General info */}
                    <div style={sectionStyle}>
                        <div style={sectionTitle}>📋 Thông tin chung</div>
                        {editing ? (
                            <>
                                <div style={fieldRow}>
                                    <div style={{ flex: 1 }}>
                                        <div style={fieldLabel}>Tên công trình</div>
                                        <input style={inputStyle} value={project.name} onChange={e => updateField('name', e.target.value)} />
                                    </div>
                                </div>
                                <div style={fieldRow}>
                                    <div style={{ flex: 1 }}>
                                        <div style={fieldLabel}>Năm</div>
                                        <input style={inputStyle} value={project.year} onChange={e => updateField('year', e.target.value)} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={fieldLabel}>Địa điểm</div>
                                        <input style={inputStyle} value={project.location} onChange={e => updateField('location', e.target.value)} />
                                    </div>
                                </div>
                                <div style={fieldRow}>
                                    <div style={{ flex: 1 }}>
                                        <div style={fieldLabel}>Giá trị</div>
                                        <input style={inputStyle} value={project.totalAmount} onChange={e => updateField('totalAmount', e.target.value)} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={fieldLabel}>Nguồn KP</div>
                                        <input style={inputStyle} value={project.fundingSource} onChange={e => updateField('fundingSource', e.target.value)} />
                                    </div>
                                </div>
                                <div style={fieldRow}>
                                    <div style={{ flex: 1 }}>
                                        <div style={fieldLabel}>Nhà thầu</div>
                                        <input style={inputStyle} value={project.contractorName} onChange={e => updateField('contractorName', e.target.value)} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={fieldLabel}>Trạng thái</div>
                                        <select style={inputStyle} value={project.status} onChange={e => updateField('status', e.target.value)}>
                                            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={fieldRow}>
                                    <div style={{ flex: 1 }}><div style={fieldLabel}>Năm</div><div style={fieldValue}>{project.year}</div></div>
                                    <div style={{ flex: 1 }}><div style={fieldLabel}>Địa điểm</div><div style={fieldValue}>{project.location || '—'}</div></div>
                                </div>
                                <div style={fieldRow}>
                                    <div style={{ flex: 1 }}><div style={fieldLabel}>Giá trị</div><div style={fieldValue}>{project.totalAmount || '—'}</div></div>
                                    <div style={{ flex: 1 }}><div style={fieldLabel}>Nguồn KP</div><div style={fieldValue}>{project.fundingSource || '—'}</div></div>
                                </div>
                                <div style={fieldRow}>
                                    <div style={{ flex: 1 }}><div style={fieldLabel}>Nhà thầu</div><div style={fieldValue}>{project.contractorName || '—'}</div></div>
                                    <div style={{ flex: 1 }}><div style={fieldLabel}>Trạng thái</div>
                                        <span style={{
                                            padding: '0.15rem 0.5rem', borderRadius: 12, fontSize: '0.8rem',
                                            background: STATUS_OPTIONS.find(o => o.value === project.status)?.value === 'completed' ? '#d1fae5' : STATUS_OPTIONS.find(o => o.value === project.status)?.value === 'in_progress' ? '#fef3c7' : '#f1f5f9',
                                        }}>
                                            {STATUS_OPTIONS.find(o => o.value === project.status)?.label}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Deadline */}
                    <div style={{
                        ...sectionStyle,
                        ...(project.deadline && (() => {
                            const diff = Math.ceil((new Date(project.deadline).getTime() - Date.now()) / 86400000);
                            if (diff < 0) return { background: 'linear-gradient(135deg, #fef2f2, #fff)', borderColor: '#fca5a5' };
                            if (diff <= 3) return { background: 'linear-gradient(135deg, #fffbeb, #fff)', borderColor: '#fcd34d' };
                            return {};
                        })()),
                    }}>
                        <div style={sectionTitle}>⏰ Hạn nộp hồ sơ</div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ flex: '0 0 auto' }}>
                                <div style={fieldLabel}>Nhãn</div>
                                <input style={{ ...inputStyle, width: 180 }}
                                    value={project.deadlineLabel || ''}
                                    onChange={e => updateField('deadlineLabel', e.target.value)}
                                    placeholder="VD: Hạn nộp hồ sơ" />
                            </div>
                            <div style={{ flex: '0 0 auto' }}>
                                <div style={fieldLabel}>Ngày hạn</div>
                                <input type="date" style={{ ...inputStyle, width: 160 }}
                                    value={project.deadline || ''}
                                    onChange={e => updateField('deadline', e.target.value)} />
                            </div>
                            {project.deadline && (() => {
                                const diff = Math.ceil((new Date(project.deadline).getTime() - Date.now()) / 86400000);
                                if (diff < 0) return (
                                    <div style={{ padding: '0.3rem 0.75rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#dc2626', fontWeight: 700, fontSize: '0.85rem' }}>
                                        🔴 Quá hạn {-diff} ngày!
                                    </div>
                                );
                                if (diff <= 3) return (
                                    <div style={{ padding: '0.3rem 0.75rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, color: '#d97706', fontWeight: 600, fontSize: '0.85rem' }}>
                                        🟡 Còn {diff} ngày
                                    </div>
                                );
                                return (
                                    <div style={{ padding: '0.3rem 0.75rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, color: '#059669', fontSize: '0.85rem' }}>
                                        ✅ Còn {diff} ngày
                                    </div>
                                );
                            })()}
                            {project.deadline && (
                                <button onClick={() => { updateField('deadline', ''); updateField('deadlineLabel', ''); }}
                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>✕ Xóa</button>
                            )}
                        </div>
                    </div>

                    {/* Contract/Form data */}
                    {project.formData && Object.keys(project.formData).length > 0 && (
                        <div style={{ ...sectionStyle, background: 'linear-gradient(135deg, #eff6ff, #fff)', borderColor: '#93c5fd' }}>
                            <div style={sectionTitle}>
                                <span>📄 Thông tin hợp đồng ({(project.selectedFields || Object.keys(project.formData)).filter(k => project.formData![k]?.trim()).length} trường)</span>
                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                    <button className="btn btn-sm" onClick={() => {
                                        // Toggle field management
                                        const allKeys = Object.keys(project.formData!).filter(k => project.formData![k]?.trim());
                                        const currentSelected = new Set(project.selectedFields || allKeys);
                                        const key = prompt('Nhập tên trường để thêm/bỏ (hoặc "all" để hiện tất cả):');
                                        if (!key) return;
                                        if (key === 'all') {
                                            updateField('selectedFields', allKeys);
                                        } else {
                                            const matchKey = allKeys.find(k =>
                                                k.toLowerCase().includes(key.toLowerCase()) ||
                                                (project.formLabels?.[k] || '').toLowerCase().includes(key.toLowerCase())
                                            );
                                            if (matchKey) {
                                                if (currentSelected.has(matchKey)) {
                                                    currentSelected.delete(matchKey);
                                                } else {
                                                    currentSelected.add(matchKey);
                                                }
                                                updateField('selectedFields', [...currentSelected]);
                                            } else {
                                                alert('Không tìm thấy trường: ' + key);
                                            }
                                        }
                                    }} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>⚙️</button>
                                    <button className="btn btn-sm" onClick={() => setShowFormData(!showFormData)}
                                        style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                                        {showFormData ? '▲ Thu gọn' : '▼ Mở rộng'}
                                    </button>
                                </div>
                            </div>
                            {showFormData && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 0.75rem' }}>
                                    {(project.selectedFields || Object.keys(project.formData))
                                        .filter(key => project.formData![key]?.trim())
                                        .map(key => (
                                            <div key={key} style={{ padding: '0.3rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                                                    {(project.formLabels?.[key] || key).replace(/_/g, ' ')}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#1e293b', wordBreak: 'break-word' }}>
                                                    {project.formData![key]}
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    )}

                    {/* Custom fields */}
                    <div style={sectionStyle}>
                        <div style={sectionTitle}>
                            📝 Trường tùy chỉnh
                            <button className="btn btn-sm" onClick={addCustomField} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>➕ Thêm</button>
                        </div>
                        {(project.customFields || []).length === 0 ? (
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Chưa có trường nào. Bấm "Thêm" để thêm.</div>
                        ) : (
                            (project.customFields || []).map((cf, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                                    <div style={{ flex: '0 0 120px', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{cf.label}:</div>
                                    <input style={{ ...inputStyle, flex: 1 }} value={cf.value}
                                        onChange={e => updateCustomField(idx, e.target.value)}
                                        placeholder={`Nhập ${cf.label}`} />
                                    <button onClick={() => removeCustomField(idx)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Notes */}
                    <div style={sectionStyle}>
                        <div style={sectionTitle}>💬 Ghi chú</div>
                        <textarea
                            value={project.notes || ''} onChange={e => updateField('notes', e.target.value)}
                            placeholder="Nhập ghi chú cho dự án..."
                            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                        />
                    </div>
                </div>

                {/* Right column */}
                <div>
                    {/* Checklist */}
                    <div style={{ ...sectionStyle, background: 'linear-gradient(135deg, #f0fdf4, #fff)' }}>
                        <div style={sectionTitle}>
                            <span>✅ Checklist hồ sơ ({checkDone}/{checkTotal})</span>
                            <button className="btn btn-sm" onClick={addChecklistItem} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>➕ Thêm</button>
                        </div>
                        {/* Progress bar */}
                        <div style={{ background: '#e2e8f0', borderRadius: 6, height: 8, marginBottom: '0.75rem' }}>
                            <div style={{
                                background: checkDone === checkTotal && checkTotal > 0 ? '#059669' : '#3b82f6',
                                borderRadius: 6, height: 8, width: checkTotal ? `${(checkDone / checkTotal) * 100}%` : '0%',
                                transition: 'width 0.3s',
                            }} />
                        </div>
                        {project.checklist.map(item => (
                            <div key={item.id} style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.35rem 0', borderBottom: '1px solid #f1f5f9',
                            }}>
                                <input type="checkbox" checked={item.done} onChange={() => toggleChecklist(item.id)}
                                    style={{ width: 18, height: 18, cursor: 'pointer' }} />
                                <span style={{
                                    flex: 1, fontSize: '0.85rem',
                                    textDecoration: item.done ? 'line-through' : 'none',
                                    color: item.done ? '#94a3b8' : '#1e293b',
                                }}>{item.label}</span>
                                {item.doneDate && (
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                        {new Date(item.doneDate).toLocaleDateString('vi-VN')}
                                    </span>
                                )}
                                <button onClick={() => removeChecklistItem(item.id)}
                                    style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                            </div>
                        ))}
                    </div>

                    {/* Timeline */}
                    <div style={sectionStyle}>
                        <div style={sectionTitle}>
                            <span>📅 Timeline</span>
                            <button className="btn btn-sm" onClick={addMilestone} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>➕ Thêm</button>
                        </div>
                        {project.milestones.map((ms, idx) => (
                            <div key={ms.id} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                {/* Timeline dot + line */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
                                    <div style={{
                                        width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                                        background: ms.date ? '#059669' : '#e2e8f0',
                                        border: ms.date ? '3px solid #d1fae5' : '3px solid #f1f5f9',
                                    }} />
                                    {idx < project.milestones.length - 1 && (
                                        <div style={{ width: 2, flex: 1, background: '#e2e8f0', marginTop: 2 }} />
                                    )}
                                </div>
                                {/* Content */}
                                <div style={{ flex: 1, paddingBottom: '0.5rem' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: ms.date ? '#059669' : '#64748b' }}>
                                        {ms.label}
                                    </div>
                                    <input type="date" value={ms.date}
                                        onChange={e => updateMilestone(ms.id, 'date', e.target.value)}
                                        style={{ ...inputStyle, width: 140, fontSize: '0.8rem', marginTop: 3 }} />
                                </div>
                                <button onClick={() => removeMilestone(ms.id)}
                                    style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.75rem', alignSelf: 'flex-start' }}>✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
