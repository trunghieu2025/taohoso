import { useState, ChangeEvent, useCallback } from 'react';
import type { ScanResult } from '../utils/militaryDocGenerator';
import { FIELD_CATEGORY_INFO } from '../utils/militaryDocGenerator';
import type { FieldCategory } from '../utils/militaryDocGenerator';
import { usePageT } from '../i18n/pageTranslations';

interface Props {
    results: ScanResult[];
    onConfirm: (selected: { text: string; tag: string; label: string }[]) => void;
    onCancel: () => void;
    fileBuffers?: ArrayBuffer[]; // For preview highlight
}

/** Group locations by file and format compactly:
 *  "[fileA.docx] Dòng 1", "[fileA.docx] Dòng 5" → "fileA.docx: Dòng 1, 5"
 */
function formatLocations(locations: string[]): string {
    const groups = new Map<string, string[]>();
    for (const loc of locations) {
        const match = loc.match(/^\[(.+?)\]\s*(.+)$/);
        if (match) {
            const file = match[1].length > 20 ? match[1].slice(0, 18) + '..' : match[1];
            if (!groups.has(file)) groups.set(file, []);
            // Extract just the number from "Dòng 51"
            const numMatch = match[2].match(/\d+/);
            const short = numMatch ? `Dòng ${numMatch[0]}` : match[2];
            if (!groups.get(file)!.includes(short)) groups.get(file)!.push(short);
        } else {
            // No file prefix (single file mode)
            const key = '📄';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(loc);
        }
    }
    return [...groups.entries()]
        .map(([file, locs]) => file === '📄' ? locs.join(', ') : `${file}: ${locs.join(', ')}`)
        .join(' | ');
}

/* ── Field History (localStorage) ── */
const HISTORY_KEY = 'taohoso_field_history';

interface FieldHistoryEntry { text: string; tag: string; label: string; }

function loadFieldHistory(): FieldHistoryEntry[] {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch { return []; }
}

function saveFieldHistory(entries: FieldHistoryEntry[]) {
    try {
        // Merge with existing, keep unique by text, limit to 200
        const existing = loadFieldHistory();
        const map = new Map<string, FieldHistoryEntry>();
        for (const e of existing) map.set(e.text, e);
        for (const e of entries) map.set(e.text, e);
        const merged = [...map.values()].slice(-200);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
    } catch { /* ignore */ }
}
/* ── Scan Template (localStorage) ── */
const TEMPLATE_KEY = 'taohoso_scan_templates';

interface ScanTemplate {
    name: string;
    tags: { text: string; tag: string; label: string }[];
    createdAt: number;
}

function loadScanTemplates(): ScanTemplate[] {
    try { return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || '[]'); }
    catch { return []; }
}

function saveScanTemplate(template: ScanTemplate) {
    const all = loadScanTemplates();
    all.push(template);
    // Keep last 20
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(all.slice(-20)));
}

function deleteScanTemplate(name: string) {
    const all = loadScanTemplates().filter(t => t.name !== name);
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(all));
}

export default function ScanReviewModal({ results, onConfirm, onCancel, fileBuffers }: Props) {
    const p = usePageT();
    const [items, setItems] = useState<ScanResult[]>(() => {
        const history = loadFieldHistory();
        return results.map((r) => {
            const wasUsed = history.some(h => h.text === r.text || h.tag === r.suggestedTag);
            return { ...r, selected: wasUsed || r.selected };
        });
    });
    const [filter, setFilter] = useState<'all' | 'data' | 'boilerplate'>('all');
    const [crossFileOnly, setCrossFileOnly] = useState(false);
    const [groupByRole, setGroupByRole] = useState(false);
    const [previewText, setPreviewText] = useState<string | null>(null);
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [savedTemplates, setSavedTemplates] = useState<ScanTemplate[]>(loadScanTemplates);
    const [showLoadTemplate, setShowLoadTemplate] = useState(false);

    const filteredItems = items.filter(i => {
        if (filter !== 'all' && i.category !== filter) return false;
        if (crossFileOnly && (i.crossFileCount || 0) < 2) return false;
        return true;
    });

    const toggleItem = (idx: number) => {
        setItems((prev) =>
            prev.map((item, i) => (i === idx ? { ...item, selected: !item.selected } : item))
        );
    };

    const selectAll = () =>
        setItems((prev) => prev.map((item) => ({ ...item, selected: true })));
    const deselectAll = () =>
        setItems((prev) => prev.map((item) => ({ ...item, selected: false })));

    const updateTag = (idx: number, tag: string) => {
        setItems((prev) =>
            prev.map((item, i) => (i === idx ? { ...item, suggestedTag: tag } : item))
        );
    };

    const updateLabel = (idx: number, label: string) => {
        setItems((prev) =>
            prev.map((item, i) => (i === idx ? { ...item, suggestedLabel: label } : item))
        );
    };

    // Drag-and-drop: move item up/down
    const moveItem = useCallback((idx: number, direction: 'up' | 'down') => {
        setItems(prev => {
            const newItems = [...prev];
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= newItems.length) return prev;
            [newItems[idx], newItems[targetIdx]] = [newItems[targetIdx], newItems[idx]];
            return newItems;
        });
    }, []);

    const handleConfirm = () => {
        const selected = items
            .filter((item) => item.selected && item.suggestedTag.trim())
            .map((item) => ({
                text: item.text,
                tag: item.suggestedTag.trim(),
                label: item.suggestedLabel || item.text,
            }));
        saveFieldHistory(selected);
        onConfirm(selected);
    };

    // Export to Excel
    const handleExportExcel = () => {
        const rows = items.map(i => ({
            'Giá trị': i.text,
            'Tag': i.suggestedTag,
            'Nhãn': i.suggestedLabel,
            'Số lần': i.count,
            'Phân loại': i.category === 'data' ? 'Dữ liệu' : 'Boilerplate',
            'Đã chọn': i.selected ? 'Có' : 'Không',
            'Vị trí': i.locations.join('; '),
        }));
        const header = Object.keys(rows[0] || {}).join('\t');
        const body = rows.map(r => Object.values(r).join('\t')).join('\n');
        const tsv = header + '\n' + body;
        const blob = new Blob(['\uFEFF' + tsv], { type: 'text/tab-separated-values;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'scan_results.xls'; a.click();
        URL.revokeObjectURL(url);
    };

    // Save scan template
    const handleSaveTemplate = () => {
        if (!templateName.trim()) return;
        const tags = items.filter(i => i.selected).map(i => ({
            text: i.text, tag: i.suggestedTag, label: i.suggestedLabel,
        }));
        saveScanTemplate({ name: templateName, tags, createdAt: Date.now() });
        setSavedTemplates(loadScanTemplates());
        setShowSaveTemplate(false);
        setTemplateName('');
    };

    // Load scan template
    const handleLoadTemplate = (tpl: ScanTemplate) => {
        setItems(prev => prev.map(item => {
            const match = tpl.tags.find(t => t.text === item.text);
            if (match) {
                return { ...item, selected: true, suggestedTag: match.tag, suggestedLabel: match.label };
            }
            return { ...item, selected: false };
        }));
        setShowLoadTemplate(false);
    };

    // Role grouping
    const getRole = (item: ScanResult): string => {
        const label = (item.contextLabel || item.suggestedLabel || '').toLowerCase();
        const text = item.text.toLowerCase();
        const combined = label + ' ' + text;
        if (/chủ đầu tư|bên a|chủ đầu|đại diện chủ/.test(combined)) return '🏛️ Chủ đầu tư';
        if (/nhà thầu|bên b|đại diện nhà|công ty/.test(combined)) return '🏗️ Nhà thầu';
        if (/tư vấn|giám sát|tvgs|tư vấn giám/.test(combined)) return '👁️ Tư vấn GS';
        if (/địa chỉ|địa điểm|xã|huyện|tỉnh/.test(combined)) return '📍 Địa chỉ';
        if (/điện thoại|số điện|sdt|phone/.test(combined)) return '📞 Liên hệ';
        if (/tài khoản|mã số|mst|ngân hàng/.test(combined)) return '🏦 Tài chính';
        if (/công trình|dự án|hạng mục/.test(combined)) return '📋 Dự án';
        return '📝 Khác';
    };

    const groupedItems = groupByRole ? (() => {
        const groups = new Map<string, { items: ScanResult[]; indices: number[] }>();
        for (const item of filteredItems) {
            const role = getRole(item);
            if (!groups.has(role)) groups.set(role, { items: [], indices: [] });
            groups.get(role)!.items.push(item);
            groups.get(role)!.indices.push(items.indexOf(item));
        }
        return groups;
    })() : null;

    const toggleGroup = (role: string, select: boolean) => {
        if (!groupedItems) return;
        const indices = new Set(groupedItems.get(role)?.indices || []);
        setItems(prev => prev.map((item, i) => indices.has(i) ? { ...item, selected: select } : item));
    };

    const selectedCount = items.filter((i) => i.selected).length;

    const renderRow = (item: ScanResult, realIdx: number) => (
        <tr
            key={realIdx}
            style={{
                background: item.selected ? '#f0fdf4' : item.category === 'boilerplate' ? '#fffbeb' : '#fafafa',
                opacity: item.selected ? 1 : 0.5,
                cursor: 'pointer',
            }}
            onClick={(e) => {
                // Don't trigger preview when clicking inputs/checkboxes
                if ((e.target as HTMLElement).tagName === 'INPUT') return;
                setPreviewText(previewText === item.text ? null : item.text);
            }}
        >
            <td style={{ ...tdStyle, textAlign: 'center', width: 30 }}>
                {/* Move buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                    <button onClick={(e) => { e.stopPropagation(); moveItem(realIdx, 'up'); }}
                        style={moveBtnStyle} title="Di chuyển lên">▲</button>
                    <button onClick={(e) => { e.stopPropagation(); moveItem(realIdx, 'down'); }}
                        style={moveBtnStyle} title="Di chuyển xuống">▼</button>
                </div>
            </td>
            <td style={{ ...tdStyle, textAlign: 'center' }}>
                <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleItem(realIdx)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
            </td>
            <td style={{ ...tdStyle, fontWeight: 500, maxWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{
                        display: 'inline-block', padding: '0 4px', borderRadius: 4,
                        fontSize: '0.65rem', fontWeight: 600,
                        background: item.fieldType === 'bracket' ? '#ede9fe'
                            : item.fieldType === 'project' ? '#dbeafe'
                                : item.fieldType === 'party' ? '#fce7f3'
                                    : item.fieldType === 'finance' ? '#d1fae5'
                                        : item.fieldType === 'date' ? '#fef3c7'
                                            : '#f1f5f9',
                        color: item.fieldType === 'bracket' ? '#7c3aed'
                            : item.fieldType === 'project' ? '#1d4ed8'
                                : item.fieldType === 'party' ? '#be185d'
                                    : item.fieldType === 'finance' ? '#059669'
                                        : item.fieldType === 'date' ? '#b45309'
                                            : '#475569',
                    }}>{FIELD_CATEGORY_INFO[item.fieldType || 'other'].icon}</span>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.text}
                    </div>
                </div>
            </td>
            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#dc2626' }}>
                {item.count}
            </td>
            <td style={{ ...tdStyle }}>
                <input
                    type="text"
                    value={item.suggestedTag}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateTag(realIdx, e.target.value)}
                    disabled={!item.selected}
                    style={inputStyle}
                    placeholder="TEN_TRUONG"
                />
            </td>
            <td style={tdStyle}>
                <input
                    type="text"
                    value={item.suggestedLabel}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateLabel(realIdx, e.target.value)}
                    disabled={!item.selected}
                    style={inputStyle}
                    placeholder={p('display_label')}
                />
            </td>
            <td style={{ ...tdStyle, fontSize: '0.7rem', color: '#94a3b8', maxWidth: 180 }}>
                <div style={{ lineHeight: 1.4 }}>
                    {formatLocations(item.locations)}
                    {item.count > item.locations.length && <span style={{ color: '#cbd5e1' }}> +{item.count - item.locations.length}</span>}
                </div>
            </td>
        </tr>
    );

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
                            🔍 {p('scan_result')} — {items.length} {p('duplicate_values')}
                        </h2>
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                            {p('choose_values')}. {p('click_row_preview')}.
                        </p>
                    </div>
                    <button onClick={onCancel} style={closeBtnStyle}>✕</button>
                </div>

                {/* Toolbar */}
                <div style={toolbarStyle}>
                    <button className="btn btn-sm" onClick={selectAll}>☑ {p('select_all')}</button>
                    <button className="btn btn-sm" onClick={deselectAll}>☐ {p('deselect_all')}</button>
                    <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                        <button className="btn btn-sm" onClick={() => setFilter('all')}
                            style={{ background: filter === 'all' ? '#dbeafe' : undefined, fontSize: '0.75rem' }}>{p('all')} ({items.length})</button>
                        <button className="btn btn-sm" onClick={() => setFilter('data')}
                            style={{ background: filter === 'data' ? '#d1fae5' : undefined, fontSize: '0.75rem' }}>📋 {p('data')} ({items.filter(i => i.category === 'data').length})</button>
                        <button className="btn btn-sm" onClick={() => setFilter('boilerplate')}
                            style={{ background: filter === 'boilerplate' ? '#fef3c7' : undefined, fontSize: '0.75rem' }}>📄 {p('boilerplate')} ({items.filter(i => i.category === 'boilerplate').length})</button>
                    </div>
                    {items.some(i => (i.crossFileCount || 0) > 1) && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.5rem', fontSize: '0.75rem', cursor: 'pointer', color: '#6d28d9', fontWeight: 600 }}>
                            <input type="checkbox" checked={crossFileOnly} onChange={e => setCrossFileOnly(e.target.checked)} />
                            🔗 {p('cross_file')} ({items.filter(i => (i.crossFileCount || 0) > 1).length})
                        </label>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.5rem', fontSize: '0.75rem', cursor: 'pointer', color: '#0369a1', fontWeight: 600 }}>
                        <input type="checkbox" checked={groupByRole} onChange={e => setGroupByRole(e.target.checked)} />
                        👥 {p('group_by_role')}
                    </label>
                    <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#64748b' }}>
                        {p('selected')}: <strong>{selectedCount}</strong> / {items.length}
                    </span>
                </div>

                {/* Action bar: save template, load template, export */}
                <div style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#fefce8', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-sm" onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                        style={{ fontSize: '0.75rem', background: '#dbeafe' }}>💾 {p('save_template')}</button>
                    <button className="btn btn-sm" onClick={() => setShowLoadTemplate(!showLoadTemplate)}
                        style={{ fontSize: '0.75rem', background: '#d1fae5' }}>📂 {p('load_template')} ({savedTemplates.length})</button>
                    <button className="btn btn-sm" onClick={handleExportExcel}
                        style={{ fontSize: '0.75rem', background: '#fde68a' }}>📊 {p('export_excel')}</button>

                    {showSaveTemplate && (
                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                            <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)}
                                placeholder={`${p('template_name')}...`} style={{ ...inputStyle, width: 150, fontSize: '0.75rem' }} />
                            <button className="btn btn-sm" onClick={handleSaveTemplate}
                                style={{ fontSize: '0.7rem', background: '#10b981', color: '#fff' }}>✓ {p('save_btn')}</button>
                        </div>
                    )}

                    {showLoadTemplate && savedTemplates.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            {savedTemplates.map((t, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <button className="btn btn-sm" onClick={() => handleLoadTemplate(t)}
                                        style={{ fontSize: '0.7rem' }}>{t.name} ({t.tags.length})</button>
                                    <button onClick={() => { deleteScanTemplate(t.name); setSavedTemplates(loadScanTemplates()); }}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Preview panel */}
                {previewText && (
                    <div style={{ padding: '0.5rem 1.5rem', background: '#f0f9ff', borderBottom: '1px solid #bfdbfe', maxHeight: 120, overflow: 'auto' }}>
                        <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600, marginBottom: 4 }}>👁️ Preview — Click dòng khác để đóng</div>
                        {items.find(i => i.text === previewText)?.locations.map((loc, j) => (
                            <div key={j} style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.6 }}>
                                <span style={{ color: '#64748b' }}>{loc.replace(/\[.*?\]\s*/, '')}: </span>
                                <mark style={{ background: '#fef08a', padding: '0 2px', borderRadius: 2 }}>{previewText}</mark>
                            </div>
                        ))}
                    </div>
                )}

                {/* Table */}
                <div style={tableContainerStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, width: 30 }}>↕</th>
                                <th style={{ ...thStyle, width: 40 }}>☑</th>
                                <th style={thStyle}>{p('value_in_file')}</th>
                                <th style={{ ...thStyle, width: 60, textAlign: 'center' }}>{p('count')}</th>
                                <th style={thStyle}>{p('field_name_tag')}</th>
                                <th style={thStyle}>{p('display_label')}</th>
                                <th style={{ ...thStyle, width: 150 }}>{p('position')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupByRole && groupedItems ? (
                                [...groupedItems.entries()].map(([role, group]) => (
                                    <>
                                        <tr key={`group-${role}`}>
                                            <td colSpan={7} style={{
                                                padding: '0.5rem 0.75rem', background: '#f0f9ff',
                                                fontWeight: 700, fontSize: '0.85rem', color: '#1e40af',
                                                borderBottom: '2px solid #bfdbfe',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span>{role} ({group.items.length})</span>
                                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                        <button className="btn btn-sm" onClick={() => toggleGroup(role, true)}
                                                            style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>☑ {p('select_btn')}</button>
                                                        <button className="btn btn-sm" onClick={() => toggleGroup(role, false)}
                                                            style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>☐ {p('skip_btn')}</button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {group.items.map((item) => {
                                            const realIdx = items.indexOf(item);
                                            return renderRow(item, realIdx);
                                        })}
                                    </>
                                ))
                            ) : (
                                (() => {
                                    const rows: React.ReactNode[] = [];
                                    let lastType: FieldCategory | undefined;
                                    for (const item of filteredItems) {
                                        const ft = item.fieldType || 'other';
                                        if (ft !== lastType) {
                                            const info = FIELD_CATEGORY_INFO[ft];
                                            rows.push(
                                                <tr key={`cat-${ft}`} style={{ background: '#f8fafc' }}>
                                                    <td colSpan={7} style={{
                                                        padding: '0.4rem 0.75rem', fontWeight: 700,
                                                        fontSize: '0.85rem', color: '#334155',
                                                        borderBottom: '2px solid #e2e8f0',
                                                    }}>{info.icon} {info.label}</td>
                                                </tr>
                                            );
                                            lastType = ft;
                                        }
                                        const realIdx = items.indexOf(item);
                                        rows.push(renderRow(item, realIdx));
                                    }
                                    return rows;
                                })()
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div style={footerStyle}>
                    <button className="btn btn-secondary" onClick={onCancel}>
                        {p('cancel')}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleConfirm}
                        disabled={selectedCount === 0}
                    >
                        ✅ {p('confirm')} ({selectedCount} {p('fields')})
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Styles ── */
const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '1rem',
};

const modalStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    maxWidth: 900,
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e2e8f0',
};

const closeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    borderRadius: 4,
    color: '#94a3b8',
};

const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    borderBottom: '1px solid #f1f5f9',
    background: '#f8fafc',
    alignItems: 'center',
};

const tableContainerStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '0',
};

const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem',
};

const thStyle: React.CSSProperties = {
    padding: '0.6rem 0.75rem',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '0.8rem',
    color: '#475569',
    borderBottom: '2px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    background: '#fff',
};

const tdStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.3rem 0.5rem',
    border: '1px solid #cbd5e1',
    borderRadius: 4,
    fontSize: '0.82rem',
    fontFamily: 'monospace',
};

const moveBtnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '0.6rem', padding: '0 2px', color: '#94a3b8', lineHeight: 1,
};

const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e2e8f0',
    background: '#f8fafc',
    borderRadius: '0 0 12px 12px',
};
