import { useState, useMemo } from 'react';
import type { Project } from '../utils/projectStorage';

interface SearchResult {
    source: string;     // "Trường: Tên nhà thầu", "Checklist: Hợp đồng", etc.
    sourceIcon: string; // emoji
    content: string;    // matched content
    matchStart: number; // index where match starts in content
    matchLen: number;   // length of match
}

interface Props {
    project: Project;
}

/** Normalize Vietnamese text for accent-insensitive search */
function normalize(s: string): string {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Find all matches of query in text, return start indices */
function findAllMatches(text: string, query: string): number[] {
    const normText = normalize(text);
    const normQuery = normalize(query);
    if (!normQuery) return [];
    const indices: number[] = [];
    let pos = 0;
    while ((pos = normText.indexOf(normQuery, pos)) !== -1) {
        indices.push(pos);
        pos += 1;
    }
    return indices;
}

export default function ProjectSearch({ project }: Props) {
    const [query, setQuery] = useState('');
    const [expanded, setExpanded] = useState(true);

    const results = useMemo(() => {
        if (!query || query.length < 2) return [];
        const hits: SearchResult[] = [];

        // Search in formData
        if (project.formData) {
            for (const [key, value] of Object.entries(project.formData)) {
                if (!value?.trim()) continue;
                const matches = findAllMatches(value, query);
                if (matches.length > 0) {
                    const label = (project.formLabels?.[key] || key).replace(/_/g, ' ');
                    hits.push({
                        source: `Trường: ${label}`,
                        sourceIcon: '📋',
                        content: value,
                        matchStart: matches[0],
                        matchLen: query.length,
                    });
                }
                // Also search in labels
                const labelMatches = findAllMatches(
                    (project.formLabels?.[key] || key).replace(/_/g, ' '), query
                );
                if (labelMatches.length > 0 && matches.length === 0) {
                    const label = (project.formLabels?.[key] || key).replace(/_/g, ' ');
                    hits.push({
                        source: `Trường: ${label}`,
                        sourceIcon: '📋',
                        content: value || '(trống)',
                        matchStart: -1,
                        matchLen: 0,
                    });
                }
            }
        }

        // Search in checklist labels
        for (const item of project.checklist || []) {
            const matches = findAllMatches(item.label, query);
            if (matches.length > 0) {
                hits.push({
                    source: `Checklist: ${item.label}`,
                    sourceIcon: item.done ? '✅' : '☐',
                    content: item.done ? `Hoàn thành${item.doneDate ? ' (' + new Date(item.doneDate).toLocaleDateString('vi-VN') + ')' : ''}` : 'Chưa hoàn thành',
                    matchStart: -1,
                    matchLen: 0,
                });
            }
        }

        // Search in milestones
        for (const ms of project.milestones || []) {
            const matches = findAllMatches(ms.label, query);
            if (matches.length > 0) {
                hits.push({
                    source: `Timeline: ${ms.label}`,
                    sourceIcon: ms.date ? '🟢' : '⚪',
                    content: ms.date ? `Ngày: ${ms.date}` : 'Chưa có ngày',
                    matchStart: -1,
                    matchLen: 0,
                });
            }
        }

        // Search in custom fields
        for (const cf of project.customFields || []) {
            const labelMatch = findAllMatches(cf.label, query);
            const valueMatch = findAllMatches(cf.value, query);
            if (labelMatch.length > 0 || valueMatch.length > 0) {
                hits.push({
                    source: `Tùy chỉnh: ${cf.label}`,
                    sourceIcon: '📝',
                    content: cf.value || '(trống)',
                    matchStart: valueMatch.length > 0 ? valueMatch[0] : -1,
                    matchLen: query.length,
                });
            }
        }

        // Search in notes
        if (project.notes) {
            const matches = findAllMatches(project.notes, query);
            if (matches.length > 0) {
                hits.push({
                    source: 'Ghi chú',
                    sourceIcon: '💬',
                    content: project.notes,
                    matchStart: matches[0],
                    matchLen: query.length,
                });
            }
        }

        // Search in general fields
        const generalFields = [
            { key: 'name', label: 'Tên dự án', icon: '🏗️' },
            { key: 'location', label: 'Địa điểm', icon: '📍' },
            { key: 'contractorName', label: 'Nhà thầu', icon: '👷' },
            { key: 'totalAmount', label: 'Giá trị', icon: '💰' },
            { key: 'fundingSource', label: 'Nguồn KP', icon: '🏦' },
        ];
        for (const f of generalFields) {
            const val = (project as any)[f.key];
            if (!val) continue;
            const matches = findAllMatches(String(val), query);
            if (matches.length > 0) {
                hits.push({
                    source: f.label,
                    sourceIcon: f.icon,
                    content: String(val),
                    matchStart: matches[0],
                    matchLen: query.length,
                });
            }
        }

        return hits;
    }, [query, project]);

    /** Highlight matched text */
    const renderHighlight = (text: string, start: number, len: number) => {
        if (start < 0 || !len) return <span>{text}</span>;
        // Show context around match
        const contextStart = Math.max(0, start - 30);
        const contextEnd = Math.min(text.length, start + len + 50);
        const prefix = contextStart > 0 ? '...' : '';
        const suffix = contextEnd < text.length ? '...' : '';
        return (
            <span>
                {prefix}
                {text.slice(contextStart, start)}
                <mark style={{ background: '#fef08a', padding: '0 1px', borderRadius: 2 }}>
                    {text.slice(start, start + len)}
                </mark>
                {text.slice(start + len, contextEnd)}
                {suffix}
            </span>
        );
    };

    return (
        <div style={{
            padding: '0.75rem 1rem', borderRadius: 12, border: '1px solid #a78bfa',
            background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', marginBottom: '1rem',
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: expanded ? '0.5rem' : 0,
            }}>
                <span style={{ fontSize: '1rem' }}>🔍</span>
                <input
                    type="text" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Tra cứu nội dung dự án (tên, trường, ghi chú...)"
                    style={{
                        flex: 1, padding: '0.4rem 0.6rem', borderRadius: 8,
                        border: '1px solid #c4b5fd', fontSize: '0.85rem', outline: 'none',
                        background: '#fff',
                    }}
                />
                {query && (
                    <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 500 }}>
                        {results.length} kết quả
                    </span>
                )}
                <button onClick={() => setExpanded(!expanded)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>
                    {expanded ? '▲' : '▼'}
                </button>
            </div>

            {expanded && query && results.length > 0 && (
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                    {results.map((r, i) => (
                        <div key={i} style={{
                            padding: '0.4rem 0.5rem', marginBottom: '0.25rem',
                            borderRadius: 8, background: '#fff', border: '1px solid #e9d5ff',
                        }}>
                            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', marginBottom: 2 }}>
                                <span>{r.sourceIcon}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7c3aed' }}>
                                    {r.source}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.4 }}>
                                {renderHighlight(r.content, r.matchStart, r.matchLen)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {expanded && query && query.length >= 2 && results.length === 0 && (
                <div style={{ textAlign: 'center', padding: '0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Không tìm thấy kết quả cho "{query}"
                </div>
            )}
        </div>
    );
}
