import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { checkND30, CheckResult, RuleStatus, RULE_GROUPS } from '../utils/nd30Checker';
import { fixND30, FixResult } from '../utils/nd30Fixer';
import { buildPreview, PreviewParagraph } from '../utils/nd30Preview';
import { useLanguage } from '../i18n/i18n';

const STATUS_ICON: Record<RuleStatus, string> = { pass: '✅', fail: '❌', warn: '⚠️', skip: '⏭️' };
const STATUS_COLOR: Record<RuleStatus, string> = { pass: '#059669', fail: '#dc2626', warn: '#d97706', skip: '#94a3b8' };
const STATUS_BG: Record<RuleStatus, string> = { pass: '#f0fdf4', fail: '#fef2f2', warn: '#fffbeb', skip: '#f8fafc' };

/* ── History type ── */
interface HistoryItem {
    fileName: string;
    date: string;
    score: number;
    total: number;
    passCount: number;
    failCount: number;
    warnCount: number;
}

/* ── DocPreview ── */
function DocPreview({ paragraphs, mode }: { paragraphs: PreviewParagraph[]; mode: 'original' | 'fixed' }) {
    const errBg = mode === 'original' ? '#fef2f2' : '#f0fdf4';
    const errBorder = mode === 'original' ? '#fca5a5' : '#86efac';
    const errLabel = mode === 'original' ? '❌' : '✅';
    return (
        <div style={{ fontFamily: '"Times New Roman", serif', fontSize: '11pt', lineHeight: 1.6, padding: '1.2rem', background: '#fff', minHeight: 300 }}>
            {paragraphs.map((p, i) => {
                if (p.isTable && p.cells) {
                    return (
                        <table key={i} style={{ width: '100%', borderCollapse: 'collapse', margin: '0.3rem 0', background: p.issues.length > 0 ? errBg : undefined, outline: p.issues.length > 0 ? `2px solid ${errBorder}` : undefined, borderRadius: 4 }}>
                            <tbody>
                                {p.cells.map((row, ri) => (
                                    <tr key={ri}>
                                        {row.map((cell, ci) => (
                                            <td key={ci} style={{ padding: '0.3rem 0.5rem', verticalAlign: 'top', border: 'none', ...cell.style, background: cell.issues.length > 0 ? errBg : undefined, position: 'relative' as const }}>
                                                {cell.text}
                                                {cell.issues.length > 0 && <span style={{ position: 'absolute', top: 2, right: 2, fontSize: '0.6rem' }}>{errLabel}</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    );
                }
                const hasIssue = p.issues.length > 0;
                return (
                    <div key={i} style={{ ...p.style, padding: '1px 4px', margin: '1px 0', background: hasIssue ? errBg : undefined, borderLeft: hasIssue ? `3px solid ${errBorder}` : '3px solid transparent', borderRadius: 2, position: 'relative' as const, minHeight: p.text ? undefined : '0.6em', transition: 'all 0.2s' }}>
                        {p.text || '\u00A0'}
                        {hasIssue && <span style={{ position: 'absolute', top: 1, right: 4, fontSize: '0.6rem', opacity: 0.7 }}>{errLabel}</span>}
                    </div>
                );
            })}
        </div>
    );
}

/* ── Main Page ── */
export default function ND30Checker() {
    const { lang } = useLanguage();
    const [result, setResult] = useState<CheckResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [fixing, setFixing] = useState(false);
    const [fileName, setFileName] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [originalBuffer, setOriginalBuffer] = useState<ArrayBuffer | null>(null);
    const [fixResult, setFixResult] = useState<FixResult | null>(null);
    const [reCheckResult, setReCheckResult] = useState<CheckResult | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const dropRef = useRef<HTMLDivElement>(null);

    const isVi = lang === 'vi';

    // Load history from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('nd30_history');
            if (saved) setHistory(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    const saveHistory = (item: HistoryItem) => {
        const updated = [item, ...history].slice(0, 20);
        setHistory(updated);
        localStorage.setItem('nd30_history', JSON.stringify(updated));
    };

    const originalPreview = useMemo(() => {
        if (!originalBuffer || !result) return [];
        return buildPreview(originalBuffer, result);
    }, [originalBuffer, result]);

    const fixedPreview = useMemo(() => {
        if (!fixResult || !reCheckResult) return [];
        return buildPreview(fixResult.fixedBuffer, reCheckResult);
    }, [fixResult, reCheckResult]);

    // Group rules by group name
    const groupedRules = useMemo(() => {
        if (!result) return [];
        const groups: { name: string; nameEn: string; rules: typeof result.results }[] = [];
        const groupMap = new Map<string, typeof result.results>();
        for (const r of result.results) {
            const gName = r.group || '📋 Khác';
            if (!groupMap.has(gName)) groupMap.set(gName, []);
            groupMap.get(gName)!.push(r);
        }
        // Order by RULE_GROUPS order
        const groupOrder: string[] = RULE_GROUPS.map(g => g.name);
        for (const [gName, rules] of groupMap) {
            const gDef = RULE_GROUPS.find(g => g.name === gName);
            groups.push({ name: gName, nameEn: gDef?.nameEn || gName, rules });
        }
        groups.sort((a, b) => {
            const ai = groupOrder.indexOf(a.name);
            const bi = groupOrder.indexOf(b.name);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
        return groups;
    }, [result]);

    const processFile = useCallback(async (file: File) => {
        setFileName(file.name);
        setLoading(true);
        setResult(null);
        setFixResult(null);
        setReCheckResult(null);
        setShowPreview(false);
        try {
            const buffer = await file.arrayBuffer();
            setOriginalBuffer(buffer);
            const res = await checkND30(buffer);
            setResult(res);
            // Auto-expand groups with failures
            const failGroups = new Set<string>();
            for (const r of res.results) {
                if (r.status === 'fail' || r.status === 'warn') failGroups.add(r.group || '📋 Khác');
            }
            setExpandedGroups(failGroups);
            // Save to history
            saveHistory({
                fileName: file.name,
                date: new Date().toISOString(),
                score: res.score,
                total: res.total,
                passCount: res.results.filter(r => r.status === 'pass').length,
                failCount: res.results.filter(r => r.status === 'fail').length,
                warnCount: res.results.filter(r => r.status === 'warn').length,
            });
        } catch {
            alert(isVi ? 'Lỗi khi phân tích file. Vui lòng thử file .docx khác.' : 'Error analyzing file. Please try a different .docx file.');
        } finally {
            setLoading(false);
        }
    }, [isVi, history]);

    const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    }, [processFile]);

    // Drag & Drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); }, []);
    const handleDragLeave = useCallback(() => setIsDragOver(false), []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.name.endsWith('.docx')) processFile(file);
        else alert(isVi ? 'Chỉ hỗ trợ file .docx' : 'Only .docx files supported');
    }, [processFile, isVi]);

    const handleAutoFix = useCallback(async () => {
        if (!originalBuffer || !result) return;
        setFixing(true);
        try {
            const fixed = await fixND30(originalBuffer, result);
            setFixResult(fixed);
            const reCheck = await checkND30(fixed.fixedBuffer);
            setReCheckResult(reCheck);
            setShowPreview(true);
        } catch {
            alert(isVi ? 'Lỗi khi sửa file.' : 'Error fixing file.');
        } finally {
            setFixing(false);
        }
    }, [originalBuffer, result, isVi]);

    const handleDownload = useCallback(() => {
        if (!fixResult) return;
        const blob = new Blob([fixResult.fixedBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${fileName.replace(/\.docx$/i, '')}_ND30_fixed.docx`; a.click();
        URL.revokeObjectURL(url);
    }, [fixResult, fileName]);

    const toggleGroup = (name: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name); else next.add(name);
            return next;
        });
    };

    const hasFailures = result && result.results.some(r => r.status === 'fail' || r.status === 'warn');
    const scorePercent = result ? Math.round((result.score / result.total) * 100) : 0;
    const scoreColor = scorePercent >= 80 ? '#059669' : scorePercent >= 50 ? '#d97706' : '#dc2626';
    const reScorePercent = reCheckResult ? Math.round((reCheckResult.score / reCheckResult.total) * 100) : 0;
    const reScoreColor = reScorePercent >= 80 ? '#059669' : reScorePercent >= 50 ? '#d97706' : '#dc2626';

    return (
        <div className="container" style={{ maxWidth: showPreview ? 1200 : 900, margin: '0 auto', padding: '2rem 1rem', transition: 'max-width 0.3s' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Link to="/" style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'none' }}>← {isVi ? 'Trang chủ' : 'Home'}</Link>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0', color: '#1e293b' }}>📋 {isVi ? 'Kiểm tra thể thức NĐ30' : 'ND30 Format Checker'}</h1>
                <p style={{ fontSize: '0.95rem', color: '#64748b', maxWidth: 600, margin: '0 auto' }}>
                    {isVi ? '25 quy tắc • Tự động sửa • Xem trước • Lịch sử' : '25 rules • Auto-fix • Preview • History'}
                </p>
                {/* History toggle */}
                <button onClick={() => setShowHistory(!showHistory)} style={{
                    marginTop: '0.5rem', padding: '0.3rem 0.8rem', fontSize: '0.8rem', fontWeight: 600,
                    color: showHistory ? '#fff' : '#64748b', background: showHistory ? '#3b82f6' : '#f1f5f9',
                    border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer',
                }}>📜 {isVi ? `Lịch sử (${history.length})` : `History (${history.length})`}</button>
            </div>

            {/* History panel */}
            {showHistory && history.length > 0 && (
                <div style={{ marginBottom: '1.5rem', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ padding: '0.6rem 1rem', background: '#f1f5f9', fontWeight: 700, fontSize: '0.85rem', color: '#334155', display: 'flex', justifyContent: 'space-between' }}>
                        <span>📜 {isVi ? 'Lịch sử kiểm tra' : 'Check History'}</span>
                        <button onClick={() => { setHistory([]); localStorage.removeItem('nd30_history'); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}>🗑️ {isVi ? 'Xóa' : 'Clear'}</button>
                    </div>
                    <div style={{ maxHeight: 200, overflow: 'auto' }}>
                        {history.map((h, i) => {
                            const pct = Math.round((h.score / h.total) * 100);
                            const c = pct >= 80 ? '#059669' : pct >= 50 ? '#d97706' : '#dc2626';
                            return (
                                <div key={i} style={{ padding: '0.4rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                                    <span style={{ fontWeight: 700, color: c, minWidth: 35 }}>{pct}%</span>
                                    <span style={{ flex: 1, color: '#334155' }}>{h.fileName}</span>
                                    <span style={{ color: '#059669' }}>✅{h.passCount}</span>
                                    <span style={{ color: '#dc2626' }}>❌{h.failCount}</span>
                                    <span style={{ color: '#d97706' }}>⚠️{h.warnCount}</span>
                                    <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{new Date(h.date).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Upload Area — Drag & Drop */}
            <div ref={dropRef}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                style={{
                    border: `2px dashed ${isDragOver ? '#3b82f6' : '#cbd5e1'}`,
                    borderRadius: 16, padding: '2rem', textAlign: 'center',
                    background: isDragOver ? 'linear-gradient(135deg, #dbeafe, #ede9fe)' : result ? '#f8fafc' : 'linear-gradient(135deg, #f0f9ff, #ede9fe)',
                    cursor: 'pointer', transition: 'all 0.3s', marginBottom: '2rem',
                    transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                }}>
                <input id="nd30-upload" type="file" accept=".docx" onChange={handleUpload} style={{ display: 'none' }} />
                <label htmlFor="nd30-upload" style={{ cursor: 'pointer', display: 'block' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', transition: 'transform 0.3s', transform: isDragOver ? 'scale(1.2)' : 'scale(1)' }}>
                        {loading ? '⏳' : isDragOver ? '📥' : result ? '🔄' : '📄'}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#334155' }}>
                        {loading ? (isVi ? 'Đang phân tích...' : 'Analyzing...')
                            : isDragOver ? (isVi ? 'Thả file vào đây!' : 'Drop file here!')
                            : result ? (isVi ? 'Upload file khác' : 'Upload another file')
                            : (isVi ? 'Chọn hoặc kéo thả file Word (.docx)' : 'Choose or drag & drop Word file (.docx)')}
                    </div>
                    {fileName && <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem' }}>📎 {fileName}</div>}
                </label>
            </div>

            {result && (
                <>
                    {/* Score row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ width: 100, height: 100, borderRadius: '50%', border: `6px solid ${scoreColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', boxShadow: `0 4px 20px ${scoreColor}22` }}>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: scoreColor }}>{result.score}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>/ {result.total}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: scoreColor }}>{scorePercent}%</div>
                            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.3rem', fontSize: '0.75rem' }}>
                                <span style={{ color: '#059669' }}>✅{result.results.filter(r => r.status === 'pass').length}</span>
                                <span style={{ color: '#dc2626' }}>❌{result.results.filter(r => r.status === 'fail').length}</span>
                                <span style={{ color: '#d97706' }}>⚠️{result.results.filter(r => r.status === 'warn').length}</span>
                                <span style={{ color: '#94a3b8' }}>⏭️{result.results.filter(r => r.status === 'skip').length}</span>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {hasFailures && !fixResult && (
                                <button onClick={handleAutoFix} disabled={fixing} style={{
                                    padding: '0.7rem 1.3rem', fontSize: '0.95rem', fontWeight: 700,
                                    color: '#fff', background: fixing ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    border: 'none', borderRadius: 10, cursor: fixing ? 'wait' : 'pointer',
                                    boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                                }}>
                                    {fixing ? '⏳' : '🔧'} {fixing ? (isVi ? 'Đang sửa...' : 'Fixing...') : (isVi ? 'Tự động sửa' : 'Auto-Fix')}
                                </button>
                            )}
                            {originalPreview.length > 0 && !showPreview && (
                                <button onClick={() => setShowPreview(true)} style={{
                                    padding: '0.7rem 1.3rem', fontSize: '0.95rem', fontWeight: 700,
                                    color: '#3b82f6', background: '#fff', border: '2px solid #3b82f6',
                                    borderRadius: 10, cursor: 'pointer',
                                }}>👁️ {isVi ? 'Xem trước' : 'Preview'}</button>
                            )}
                            {showPreview && (
                                <button onClick={() => setShowPreview(false)} style={{
                                    padding: '0.7rem 1.3rem', fontSize: '0.95rem', fontWeight: 700,
                                    color: '#64748b', background: '#f1f5f9', border: '2px solid #e2e8f0',
                                    borderRadius: 10, cursor: 'pointer',
                                }}>📋 {isVi ? 'Ẩn preview' : 'Hide Preview'}</button>
                            )}
                        </div>

                        {/* Fixed score + download */}
                        {fixResult && reCheckResult && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.3rem' }}>→</span>
                                <div style={{ width: 75, height: 75, borderRadius: '50%', border: `5px solid ${reScoreColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', boxShadow: `0 4px 15px ${reScoreColor}22` }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: reScoreColor }}>{reCheckResult.score}</div>
                                    <div style={{ fontSize: '0.6rem', color: '#64748b' }}>/ {reCheckResult.total}</div>
                                </div>
                                <button onClick={handleDownload} style={{
                                    padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: 700,
                                    color: '#fff', background: 'linear-gradient(135deg, #059669, #10b981)',
                                    border: 'none', borderRadius: 10, cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                                }}>📥 {isVi ? 'Tải file sửa' : 'Download'}</button>
                            </div>
                        )}
                    </div>

                    {/* Split-screen preview */}
                    {showPreview && (
                        <div style={{ marginBottom: '1.5rem', borderRadius: 14, overflow: 'hidden', border: '2px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: fixedPreview.length > 0 ? '1fr 1fr' : '1fr', borderBottom: '2px solid #e2e8f0' }}>
                                <div style={{ padding: '0.7rem 1rem', background: '#fef2f2', fontWeight: 700, fontSize: '0.9rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: fixedPreview.length > 0 ? '1px solid #e2e8f0' : 'none' }}>
                                    📄 {isVi ? 'Bản gốc — Lỗi đánh dấu đỏ' : 'Original — Errors in red'}
                                </div>
                                {fixedPreview.length > 0 && (
                                    <div style={{ padding: '0.7rem 1rem', background: '#f0fdf4', fontWeight: 700, fontSize: '0.9rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        ✅ {isVi ? 'Đã sửa — Đánh dấu xanh' : 'Fixed — Marked in green'}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: fixedPreview.length > 0 ? '1fr 1fr' : '1fr', maxHeight: 500, overflow: 'auto' }}>
                                <div style={{ borderRight: fixedPreview.length > 0 ? '2px solid #e2e8f0' : 'none' }}>
                                    <DocPreview paragraphs={originalPreview} mode="original" />
                                </div>
                                {fixedPreview.length > 0 && <div><DocPreview paragraphs={fixedPreview} mode="fixed" /></div>}
                            </div>
                        </div>
                    )}

                    {/* Changes summary */}
                    {fixResult && fixResult.changes.length > 0 && (
                        <div style={{ marginBottom: '1.5rem', borderRadius: 14, overflow: 'hidden', border: '2px solid #3b82f633', background: '#f8fafc' }}>
                            <div style={{ padding: '0.7rem 1rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                                🔍 {isVi ? `Đã sửa ${fixResult.changes.length} lỗi` : `Fixed ${fixResult.changes.length} issues`}
                            </div>
                            <div style={{ padding: '0.3rem 0.5rem' }}>
                                {fixResult.changes.map((change, i) => (
                                    <div key={i} style={{ padding: '0.5rem 0.6rem', borderBottom: i < fixResult.changes.length - 1 ? '1px solid #e2e8f0' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b', minWidth: 120 }}>🔧 {isVi ? change.rule : change.ruleEn}</span>
                                        <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 6, background: '#fee2e2', color: '#dc2626', textDecoration: 'line-through' }}>
                                            {isVi ? change.before.split(' / ')[0] : change.before.split(' / ')[1] || change.before}
                                        </span>
                                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>→</span>
                                        <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 6, background: '#dcfce7', color: '#059669', fontWeight: 600 }}>
                                            {isVi ? change.after.split(' / ')[0] : change.after.split(' / ')[1] || change.after}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Grouped Rule Results */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {groupedRules.map(group => {
                            const groupPass = group.rules.filter(r => r.status === 'pass').length;
                            const groupFail = group.rules.filter(r => r.status === 'fail').length;
                            const groupWarn = group.rules.filter(r => r.status === 'warn').length;
                            const groupSkip = group.rules.filter(r => r.status === 'skip').length;
                            const groupTotal = group.rules.length - groupSkip;
                            const isExpanded = expandedGroups.has(group.name);
                            const allPass = groupFail === 0 && groupWarn === 0;
                            const groupColor = allPass ? '#059669' : groupFail > 0 ? '#dc2626' : '#d97706';

                            return (
                                <div key={group.name} style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${groupColor}33`, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    {/* Group header */}
                                    <div onClick={() => toggleGroup(group.name)} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.75rem 1rem', cursor: 'pointer',
                                        background: allPass ? '#f0fdf4' : groupFail > 0 ? '#fef2f2' : '#fffbeb',
                                        borderBottom: isExpanded ? `1px solid ${groupColor}22` : 'none',
                                    }}>
                                        <span style={{ fontSize: '1rem' }}>{allPass ? '✅' : groupFail > 0 ? '❌' : '⚠️'}</span>
                                        <span style={{ flex: 1, fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                                            {isVi ? group.name : group.nameEn}
                                        </span>
                                        <div style={{ display: 'flex', gap: '0.3rem', fontSize: '0.7rem' }}>
                                            <span style={{ padding: '1px 5px', borderRadius: 6, background: '#dcfce7', color: '#059669', fontWeight: 700 }}>{groupPass}</span>
                                            {groupFail > 0 && <span style={{ padding: '1px 5px', borderRadius: 6, background: '#fee2e2', color: '#dc2626', fontWeight: 700 }}>{groupFail}</span>}
                                            {groupWarn > 0 && <span style={{ padding: '1px 5px', borderRadius: 6, background: '#fef3c7', color: '#d97706', fontWeight: 700 }}>{groupWarn}</span>}
                                            {groupSkip > 0 && <span style={{ padding: '1px 5px', borderRadius: 6, background: '#f1f5f9', color: '#94a3b8', fontWeight: 700 }}>{groupSkip}</span>}
                                        </div>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: groupColor }}>{groupTotal > 0 ? `${groupPass}/${groupTotal}` : ''}</span>
                                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{isExpanded ? '▲' : '▼'}</span>
                                    </div>

                                    {/* Group rules */}
                                    {isExpanded && (
                                        <div style={{ padding: '0.3rem 0' }}>
                                            {group.rules.map(rule => (
                                                <div key={rule.id} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    padding: '0.5rem 1rem 0.5rem 2rem',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    background: STATUS_BG[rule.status],
                                                }}>
                                                    <span style={{ fontSize: '0.85rem', width: 20 }}>{STATUS_ICON[rule.status]}</span>
                                                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#334155', minWidth: 130 }}>
                                                        {isVi ? rule.name : rule.nameEn}
                                                    </span>
                                                    <span style={{ flex: 1, fontSize: '0.75rem', color: '#64748b' }}>
                                                        {isVi ? rule.detail : rule.detailEn}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 6,
                                                        color: STATUS_COLOR[rule.status], background: `${STATUS_COLOR[rule.status]}12`,
                                                        textTransform: 'uppercase',
                                                    }}>{rule.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div style={{ marginTop: '1.5rem', padding: '0.8rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b' }}>
                        ✅ {isVi ? 'Đạt' : 'Pass'} • ❌ {isVi ? 'Không đạt' : 'Fail'} • ⚠️ {isVi ? 'Cảnh báo' : 'Warning'} • ⏭️ {isVi ? 'Bỏ qua' : 'Skipped'}
                        {' | '}{isVi ? 'Căn cứ: NĐ 30/2020/NĐ-CP (25 quy tắc)' : 'Based on: Decree 30/2020/NĐ-CP (25 rules)'}
                    </div>
                </>
            )}
        </div>
    );
}
