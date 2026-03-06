import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { listProjects, type Project } from '../utils/projectStorage';

/** Normalize Vietnamese text for accent-insensitive search */
function normalize(s: string): string {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

interface SearchHit {
    projectId: number;
    projectName: string;
    source: string;
    sourceIcon: string;
    content: string;
    matchStart: number;
    matchLen: number;
}

export default function ProjectSearchAll() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [query, setQuery] = useState('');

    useEffect(() => { listProjects().then(setProjects); }, []);

    const results = useMemo(() => {
        if (!query || query.length < 2) return [];
        const normQ = normalize(query);
        const hits: SearchHit[] = [];

        for (const p of projects) {
            const pid = p.id!;
            const pName = p.name;

            const search = (text: string, source: string, icon: string) => {
                if (!text?.trim()) return;
                const pos = normalize(text).indexOf(normQ);
                if (pos >= 0) {
                    hits.push({ projectId: pid, projectName: pName, source, sourceIcon: icon, content: text, matchStart: pos, matchLen: query.length });
                }
            };

            // General
            search(p.name, 'Tên dự án', '🏗️');
            search(p.location, 'Địa điểm', '📍');
            search(p.contractorName, 'Nhà thầu', '👷');
            search(p.totalAmount, 'Giá trị', '💰');
            search(p.notes || '', 'Ghi chú', '💬');

            // Form data
            if (p.formData) {
                for (const [key, val] of Object.entries(p.formData)) {
                    if (!val?.trim()) continue;
                    const label = (p.formLabels?.[key] || key).replace(/_/g, ' ');
                    search(val, `Trường: ${label}`, '📋');
                }
            }

            // Checklist
            for (const c of p.checklist || []) search(c.label, `Checklist`, c.done ? '✅' : '☐');

            // Milestones
            for (const m of p.milestones || []) search(m.label, `Timeline`, m.date ? '🟢' : '⚪');

            // Custom fields
            for (const cf of p.customFields || []) {
                search(cf.label, `Tùy chỉnh`, '📝');
                search(cf.value, `Tùy chỉnh: ${cf.label}`, '📝');
            }
        }
        return hits;
    }, [query, projects]);

    // Group by project
    const grouped = useMemo(() => {
        const map = new Map<number, { name: string; hits: SearchHit[] }>();
        for (const h of results) {
            if (!map.has(h.projectId)) map.set(h.projectId, { name: h.projectName, hits: [] });
            map.get(h.projectId)!.hits.push(h);
        }
        return [...map.entries()];
    }, [results]);

    const renderHighlight = (text: string, start: number, len: number) => {
        if (start < 0 || !len) return <span>{text.slice(0, 80)}{text.length > 80 ? '...' : ''}</span>;
        const cs = Math.max(0, start - 25);
        const ce = Math.min(text.length, start + len + 40);
        return (
            <span>
                {cs > 0 ? '...' : ''}{text.slice(cs, start)}
                <mark style={{ background: '#fef08a', borderRadius: 2 }}>{text.slice(start, start + len)}</mark>
                {text.slice(start + len, ce)}{ce < text.length ? '...' : ''}
            </span>
        );
    };

    return (
        <div className="container" style={{ maxWidth: 900, padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.4rem', margin: 0, color: '#1e293b' }}>🔍 Tra cứu tài liệu dự án</h1>
                <Link to="/quan-ly-du-an" className="btn btn-sm btn-secondary">📊 Quản lý DA</Link>
            </div>

            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Tìm kiếm xuyên <b>tất cả {projects.length} dự án</b> — trích rõ nguồn, trường, file.
            </p>

            {/* Search box */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem',
                padding: '0.75rem 1rem', borderRadius: 12, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                border: '2px solid #a78bfa',
            }}>
                <span style={{ fontSize: '1.2rem' }}>🔍</span>
                <input
                    type="text" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Nhập từ khóa (VD: nhà thầu ABC, số tiền, địa chỉ...)"
                    style={{
                        flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #c4b5fd',
                        fontSize: '0.95rem', outline: 'none', background: '#fff',
                    }}
                    autoFocus
                />
                {query && (
                    <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600 }}>
                        {results.length} kết quả
                    </span>
                )}
            </div>

            {/* Results */}
            {query && query.length >= 2 && grouped.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                    <div>Không tìm thấy kết quả cho "<b>{query}</b>"</div>
                </div>
            )}

            {grouped.map(([projectId, group]) => (
                <div key={projectId} style={{
                    marginBottom: '1rem', borderRadius: 12, border: '1px solid #e2e8f0',
                    overflow: 'hidden', background: '#fff',
                }}>
                    {/* Project header */}
                    <div style={{
                        padding: '0.6rem 1rem', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <Link to={`/du-an/${projectId}`} style={{ fontWeight: 600, color: '#1e40af', textDecoration: 'none', fontSize: '0.9rem' }}>
                            📁 {group.name}
                        </Link>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {group.hits.length} kết quả
                        </span>
                    </div>
                    {/* Hits */}
                    <div style={{ padding: '0.4rem 0.75rem' }}>
                        {group.hits.map((h, i) => (
                            <div key={i} style={{
                                padding: '0.35rem 0.5rem', borderBottom: i < group.hits.length - 1 ? '1px solid #f1f5f9' : 'none',
                                display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                            }}>
                                <span style={{ fontSize: '0.85rem' }}>{h.sourceIcon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 600 }}>
                                        {h.source}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                                        {renderHighlight(h.content, h.matchStart, h.matchLen)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {!query && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
                    <div>Nhập từ khóa để tra cứu nội dung xuyên tất cả dự án</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        Hỗ trợ tìm kiếm không dấu • Trích rõ nguồn từng kết quả
                    </div>
                </div>
            )}
        </div>
    );
}
