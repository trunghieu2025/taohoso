import { useState, useEffect } from 'react';
import { listProjects, type Project } from '../utils/projectStorage';

export default function ProjectCompare() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [idA, setIdA] = useState<number | null>(null);
    const [idB, setIdB] = useState<number | null>(null);

    useEffect(() => {
        listProjects().then(setProjects).catch(() => { });
    }, []);

    const projA = projects.find(p => p.id === idA) || null;
    const projB = projects.find(p => p.id === idB) || null;

    // Gather all field keys from both projects
    const allKeys = new Set<string>();
    if (projA?.formData) Object.keys(projA.formData).forEach(k => allKeys.add(k));
    if (projB?.formData) Object.keys(projB.formData).forEach(k => allKeys.add(k));
    const sortedKeys = [...allKeys].sort();

    // Count differences
    const diffs = sortedKeys.filter(k => (projA?.formData?.[k] || '') !== (projB?.formData?.[k] || ''));

    return (
        <div className="container" style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊 So sánh 2 dự án</h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Chọn 2 dự án đã lưu để so sánh khác biệt giữa các trường dữ liệu.
            </p>

            {projects.length < 2 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#fef3c7', borderRadius: 8, color: '#92400e' }}>
                    ⚠️ Cần ít nhất 2 dự án đã lưu để so sánh. Hiện có {projects.length} dự án.
                </div>
            ) : (
                <>
                    {/* Selectors */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, color: '#2563eb' }}>
                                📁 Dự án A
                            </label>
                            <select
                                value={idA ?? ''}
                                onChange={e => setIdA(e.target.value ? Number(e.target.value) : null)}
                                style={selectStyle}
                            >
                                <option value="">-- Chọn dự án --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id} disabled={p.id === idB}>
                                        {p.name} ({p.year})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, color: '#dc2626' }}>
                                📁 Dự án B
                            </label>
                            <select
                                value={idB ?? ''}
                                onChange={e => setIdB(e.target.value ? Number(e.target.value) : null)}
                                style={selectStyle}
                            >
                                <option value="">-- Chọn dự án --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id} disabled={p.id === idA}>
                                        {p.name} ({p.year})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Summary */}
                    {projA && projB && (
                        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac' }}>
                            <strong>{sortedKeys.length}</strong> trường dữ liệu |
                            <strong style={{ color: diffs.length > 0 ? '#dc2626' : '#059669' }}> {diffs.length}</strong> khác biệt |
                            <strong style={{ color: '#059669' }}> {sortedKeys.length - diffs.length}</strong> giống nhau
                        </div>
                    )}

                    {/* Diff table */}
                    {projA && projB && sortedKeys.length > 0 && (
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        <th style={thStyle}>Trường</th>
                                        <th style={{ ...thStyle, background: '#eff6ff', color: '#2563eb' }}>{projA.name}</th>
                                        <th style={{ ...thStyle, background: '#fef2f2', color: '#dc2626' }}>{projB.name}</th>
                                        <th style={{ ...thStyle, width: 50, textAlign: 'center' }}>KQ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedKeys.map(key => {
                                        const valA = projA.formData?.[key] || '';
                                        const valB = projB.formData?.[key] || '';
                                        const isDiff = valA !== valB;
                                        const label = projA.formLabels?.[key] || projB.formLabels?.[key] || key.replace(/_/g, ' ');
                                        return (
                                            <tr key={key} style={{ background: isDiff ? '#fefce8' : 'white' }}>
                                                <td style={{ ...tdStyle, fontWeight: 600, fontSize: '0.8rem', color: '#475569', maxWidth: 200 }}>
                                                    {label}
                                                </td>
                                                <td style={{ ...tdStyle, background: isDiff ? '#eff6ff' : undefined, maxWidth: 250 }}>
                                                    <div style={{ wordBreak: 'break-word' }}>{valA || <span style={{ color: '#cbd5e1' }}>—</span>}</div>
                                                </td>
                                                <td style={{ ...tdStyle, background: isDiff ? '#fef2f2' : undefined, maxWidth: 250 }}>
                                                    <div style={{ wordBreak: 'break-word' }}>{valB || <span style={{ color: '#cbd5e1' }}>—</span>}</div>
                                                </td>
                                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                    {isDiff ? '🔴' : '🟢'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {projA && projB && sortedKeys.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                            Cả 2 dự án chưa có dữ liệu form nào.
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

const selectStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1',
    borderRadius: 8, fontSize: '0.9rem', background: '#fff',
};
const thStyle: React.CSSProperties = {
    padding: '0.6rem 0.75rem', fontWeight: 600, fontSize: '0.8rem',
    color: '#475569', borderBottom: '2px solid #e2e8f0', textAlign: 'left',
};
const tdStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top',
};
