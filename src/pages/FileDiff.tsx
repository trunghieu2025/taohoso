import { useState, ChangeEvent } from 'react';
import { showToast } from '../components/Toast';
import { extractTextSegments } from '../utils/militaryDocGenerator';
import * as XLSX from 'xlsx';

/* ── Types ── */
interface FileData {
    name: string;
    buffer: ArrayBuffer;
    text: string;
}

interface DiffResult {
    line: string;
    type: 'same' | 'added' | 'removed' | 'changed';
    oldValue?: string;
    newValue?: string;
}

/* ── Text extraction ── */
function extractText(name: string, buffer: ArrayBuffer): string {
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        try {
            const wb = XLSX.read(buffer, { type: 'array' });
            const lines: string[] = [];
            for (const sheet of wb.SheetNames) {
                lines.push(`=== ${sheet} ===`);
                const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheet]);
                lines.push(csv);
            }
            return lines.join('\n');
        } catch { return '[Không đọc được Excel]'; }
    }
    try {
        const { segments } = extractTextSegments(buffer);
        return segments.map(s => s.text).join('\n');
    } catch { return '[Không đọc được file]'; }
}

/* ── Simple LCS-based diff ── */
function computeDiff(oldLines: string[], newLines: string[]): DiffResult[] {
    const results: DiffResult[] = [];
    const oldSet = new Set(oldLines);
    const newSet = new Set(newLines);

    // Build a combined view
    let oi = 0, ni = 0;
    while (oi < oldLines.length || ni < newLines.length) {
        if (oi < oldLines.length && ni < newLines.length) {
            if (oldLines[oi] === newLines[ni]) {
                results.push({ line: oldLines[oi], type: 'same' });
                oi++; ni++;
            } else if (!newSet.has(oldLines[oi])) {
                results.push({ line: oldLines[oi], type: 'removed' });
                oi++;
            } else if (!oldSet.has(newLines[ni])) {
                results.push({ line: newLines[ni], type: 'added' });
                ni++;
            } else {
                results.push({ line: oldLines[oi], type: 'removed' });
                results.push({ line: newLines[ni], type: 'added' });
                oi++; ni++;
            }
        } else if (oi < oldLines.length) {
            results.push({ line: oldLines[oi], type: 'removed' });
            oi++;
        } else {
            results.push({ line: newLines[ni], type: 'added' });
            ni++;
        }
    }
    return results;
}

/* ── Component ── */
export default function FileDiff() {
    const [filesA, setFilesA] = useState<FileData[]>([]);
    const [filesB, setFilesB] = useState<FileData[]>([]);
    const [selectedA, setSelectedA] = useState(0);
    const [selectedB, setSelectedB] = useState(0);
    const [diffResults, setDiffResults] = useState<DiffResult[]>([]);
    const [showDiff, setShowDiff] = useState(false);
    const [summary, setSummary] = useState({ added: 0, removed: 0, same: 0 });

    const handleUpload = async (e: ChangeEvent<HTMLInputElement>, side: 'A' | 'B') => {
        const fileList = e.target.files;
        if (!fileList) return;
        const loaded: FileData[] = [];
        for (let i = 0; i < fileList.length; i++) {
            const f = fileList[i];
            if (f.name.startsWith('~')) continue;
            const buf = await f.arrayBuffer();
            const text = extractText(f.name, buf);
            loaded.push({ name: f.name, buffer: buf, text });
        }
        if (side === 'A') { setFilesA(loaded); setSelectedA(0); }
        else { setFilesB(loaded); setSelectedB(0); }
        setShowDiff(false);
    };

    const runDiff = () => {
        if (filesA.length === 0 || filesB.length === 0) {
            showToast('Vui lòng upload file ở cả 2 bên.');
            return;
        }
        const textA = filesA[selectedA]?.text || '';
        const textB = filesB[selectedB]?.text || '';
        const linesA = textA.split('\n').filter(l => l.trim());
        const linesB = textB.split('\n').filter(l => l.trim());
        const diff = computeDiff(linesA, linesB);
        setDiffResults(diff);

        const added = diff.filter(d => d.type === 'added').length;
        const removed = diff.filter(d => d.type === 'removed').length;
        const same = diff.filter(d => d.type === 'same').length;
        setSummary({ added, removed, same });
        setShowDiff(true);
    };

    const diffColors: Record<string, string> = {
        same: 'transparent',
        added: '#dcfce7',
        removed: '#fee2e2',
        changed: '#fef3c7',
    };

    const diffIcons: Record<string, string> = {
        same: ' ',
        added: '+',
        removed: '-',
        changed: '~',
    };

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                ⚖️ So sánh 2 bộ file — Phát hiện khác biệt
            </h1>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Upload bản cũ (bên trái) và bản mới (bên phải) → hệ thống highlight khác biệt.
                Hỗ trợ .docx và .xlsx.
            </p>

            {/* Upload panels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                {/* Side A */}
                <div style={panelStyle}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#dc2626', marginBottom: '0.5rem' }}>
                        📁 Bản CŨ (A)
                    </h3>
                    <input
                        type="file"
                        accept=".docx,.xlsx,.xls"
                        multiple
                        onChange={e => handleUpload(e, 'A')}
                        style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}
                    />
                    {filesA.length > 0 && (
                        <select
                            value={selectedA}
                            onChange={e => setSelectedA(Number(e.target.value))}
                            className="form-select"
                            style={{ fontSize: '0.8rem' }}
                        >
                            {filesA.map((f, i) => (
                                <option key={i} value={i}>{f.name}</option>
                            ))}
                        </select>
                    )}
                    {filesA.length > 0 && (
                        <div style={{ marginTop: '0.5rem', maxHeight: 200, overflow: 'auto', fontSize: '0.75rem', color: '#475569', background: '#f8fafc', padding: '0.5rem', borderRadius: 6, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            {filesA[selectedA]?.text.slice(0, 2000)}
                            {(filesA[selectedA]?.text.length || 0) > 2000 && '...'}
                        </div>
                    )}
                </div>

                {/* Side B */}
                <div style={panelStyle}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669', marginBottom: '0.5rem' }}>
                        📁 Bản MỚI (B)
                    </h3>
                    <input
                        type="file"
                        accept=".docx,.xlsx,.xls"
                        multiple
                        onChange={e => handleUpload(e, 'B')}
                        style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}
                    />
                    {filesB.length > 0 && (
                        <select
                            value={selectedB}
                            onChange={e => setSelectedB(Number(e.target.value))}
                            className="form-select"
                            style={{ fontSize: '0.8rem' }}
                        >
                            {filesB.map((f, i) => (
                                <option key={i} value={i}>{f.name}</option>
                            ))}
                        </select>
                    )}
                    {filesB.length > 0 && (
                        <div style={{ marginTop: '0.5rem', maxHeight: 200, overflow: 'auto', fontSize: '0.75rem', color: '#475569', background: '#f0fdf4', padding: '0.5rem', borderRadius: 6, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            {filesB[selectedB]?.text.slice(0, 2000)}
                            {(filesB[selectedB]?.text.length || 0) > 2000 && '...'}
                        </div>
                    )}
                </div>
            </div>

            {/* Compare button */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <button
                    className="btn btn-primary"
                    onClick={runDiff}
                    disabled={filesA.length === 0 || filesB.length === 0}
                >
                    ⚖️ So sánh ngay
                </button>
            </div>

            {/* Diff results */}
            {showDiff && (
                <>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <div style={{ ...badgeStyle, background: '#dcfce7', color: '#059669' }}>
                            ➕ Thêm mới: {summary.added}
                        </div>
                        <div style={{ ...badgeStyle, background: '#fee2e2', color: '#dc2626' }}>
                            ➖ Đã xóa: {summary.removed}
                        </div>
                        <div style={{ ...badgeStyle, background: '#f1f5f9', color: '#475569' }}>
                            ═ Giống nhau: {summary.same}
                        </div>
                        <div style={{ ...badgeStyle, background: '#dbeafe', color: '#1d4ed8' }}>
                            📊 Tổng: {diffResults.length} dòng
                        </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'auto', maxHeight: 500 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                                    <th style={{ width: 30, padding: '0.4rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>#</th>
                                    <th style={{ width: 20, padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}></th>
                                    <th style={{ padding: '0.4rem', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Nội dung</th>
                                </tr>
                            </thead>
                            <tbody>
                                {diffResults.map((d, i) => (
                                    <tr key={i} style={{ background: diffColors[d.type] }}>
                                        <td style={{ padding: '0.2rem 0.4rem', color: '#94a3b8', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                                            {i + 1}
                                        </td>
                                        <td style={{ padding: '0.2rem 0.4rem', fontWeight: 700, textAlign: 'center', color: d.type === 'added' ? '#059669' : d.type === 'removed' ? '#dc2626' : '#94a3b8' }}>
                                            {diffIcons[d.type]}
                                        </td>
                                        <td style={{ padding: '0.2rem 0.4rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', textDecoration: d.type === 'removed' ? 'line-through' : 'none' }}>
                                            {d.line}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

/* ── Styles ── */
const panelStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

const badgeStyle: React.CSSProperties = {
    padding: '0.4rem 0.8rem',
    borderRadius: 20,
    fontWeight: 600,
    fontSize: '0.82rem',
};
