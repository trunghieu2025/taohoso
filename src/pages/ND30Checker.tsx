import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { checkND30, CheckResult, RuleResult, RuleStatus } from '../utils/nd30Checker';
import { fixND30, FixChange, FixResult } from '../utils/nd30Fixer';
import { useT, useLanguage } from '../i18n/i18n';

const STATUS_ICON: Record<RuleStatus, string> = { pass: '✅', fail: '❌', warn: '⚠️', skip: '⏭️' };
const STATUS_COLOR: Record<RuleStatus, string> = { pass: '#059669', fail: '#dc2626', warn: '#d97706', skip: '#94a3b8' };
const STATUS_BG: Record<RuleStatus, string> = { pass: '#f0fdf4', fail: '#fef2f2', warn: '#fffbeb', skip: '#f8fafc' };

export default function ND30Checker() {
    const t = useT();
    const { lang } = useLanguage();
    const [result, setResult] = useState<CheckResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [fixing, setFixing] = useState(false);
    const [fileName, setFileName] = useState('');
    const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
    const [originalBuffer, setOriginalBuffer] = useState<ArrayBuffer | null>(null);
    const [fixResult, setFixResult] = useState<FixResult | null>(null);
    const [reCheckResult, setReCheckResult] = useState<CheckResult | null>(null);
    const [showDiff, setShowDiff] = useState(false);

    const isVi = lang === 'vi';

    const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setLoading(true);
        setResult(null);
        setFixResult(null);
        setReCheckResult(null);
        setShowDiff(false);
        try {
            const buffer = await file.arrayBuffer();
            setOriginalBuffer(buffer);
            const res = await checkND30(buffer);
            setResult(res);
            setExpandedRules(new Set(res.results.filter(r => r.status !== 'pass').map(r => r.id)));
        } catch (err) {
            alert(isVi ? 'Lỗi khi phân tích file. Vui lòng thử file .docx khác.' : 'Error analyzing file. Please try a different .docx file.');
        } finally {
            setLoading(false);
        }
    }, [isVi]);

    const handleAutoFix = useCallback(async () => {
        if (!originalBuffer || !result) return;
        setFixing(true);
        try {
            const fixed = await fixND30(originalBuffer, result);
            setFixResult(fixed);
            // Re-check the fixed file
            const reCheck = await checkND30(fixed.fixedBuffer);
            setReCheckResult(reCheck);
            setShowDiff(true);
        } catch (err) {
            alert(isVi ? 'Lỗi khi sửa file.' : 'Error fixing file.');
        } finally {
            setFixing(false);
        }
    }, [originalBuffer, result, isVi]);

    const handleDownload = useCallback(() => {
        if (!fixResult) return;
        const blob = new Blob([fixResult.fixedBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const baseName = fileName.replace(/\.docx$/i, '');
        a.href = url;
        a.download = `${baseName}_ND30_fixed.docx`;
        a.click();
        URL.revokeObjectURL(url);
    }, [fixResult, fileName]);

    const toggleRule = (id: string) => {
        setExpandedRules(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const hasFailures = result && result.results.some(r => r.status === 'fail' || r.status === 'warn');
    const scorePercent = result ? Math.round((result.score / result.total) * 100) : 0;
    const scoreColor = scorePercent >= 80 ? '#059669' : scorePercent >= 50 ? '#d97706' : '#dc2626';
    const reScorePercent = reCheckResult ? Math.round((reCheckResult.score / reCheckResult.total) * 100) : 0;
    const reScoreColor = reScorePercent >= 80 ? '#059669' : reScorePercent >= 50 ? '#d97706' : '#dc2626';

    return (
        <div className="container" style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Link to="/" style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'none' }}>
                    ← {isVi ? 'Trang chủ' : 'Home'}
                </Link>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0', color: '#1e293b' }}>
                    📋 {isVi ? 'Kiểm tra thể thức NĐ30' : 'ND30 Format Checker'}
                </h1>
                <p style={{ fontSize: '0.95rem', color: '#64748b', maxWidth: 600, margin: '0 auto' }}>
                    {isVi
                        ? 'Upload file Word (.docx) → kiểm tra 15 quy tắc → tự động sửa lỗi → tải file đã sửa'
                        : 'Upload Word (.docx) → check 15 rules → auto-fix errors → download fixed file'}
                </p>
            </div>

            {/* Upload Area */}
            <div style={{
                border: '2px dashed #cbd5e1', borderRadius: 16, padding: '2.5rem',
                textAlign: 'center',
                background: result ? '#f8fafc' : 'linear-gradient(135deg, #f0f9ff, #ede9fe)',
                cursor: 'pointer', transition: 'all 0.3s', marginBottom: '2rem',
            }}>
                <input id="nd30-upload" type="file" accept=".docx" onChange={handleUpload} style={{ display: 'none' }} />
                <label htmlFor="nd30-upload" style={{ cursor: 'pointer', display: 'block' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
                        {loading ? '⏳' : result ? '🔄' : '📄'}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        {loading
                            ? (isVi ? 'Đang phân tích...' : 'Analyzing...')
                            : result
                                ? (isVi ? 'Upload file khác' : 'Upload another file')
                                : (isVi ? 'Chọn file Word (.docx)' : 'Choose Word file (.docx)')}
                    </div>
                    {fileName && <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>📎 {fileName}</div>}
                </label>
            </div>

            {/* Results */}
            {result && (
                <>
                    {/* Score + Auto-Fix button row */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap',
                    }}>
                        <div style={{
                            width: 110, height: 110, borderRadius: '50%',
                            border: `6px solid ${scoreColor}`,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            background: '#fff', boxShadow: `0 4px 20px ${scoreColor}22`,
                        }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: scoreColor }}>{result.score}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>/ {result.total}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: scoreColor }}>{scorePercent}%</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                {scorePercent >= 80 ? '🎉' : scorePercent >= 50 ? '⚠️' : '❌'}
                                {' '}{scorePercent >= 80 ? (isVi ? 'Đạt chuẩn!' : 'Compliant!') : scorePercent >= 50 ? (isVi ? 'Cần chỉnh sửa' : 'Needs fixing') : (isVi ? 'Chưa đạt' : 'Non-compliant')}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', fontSize: '0.8rem' }}>
                                <span style={{ color: '#059669' }}>✅ {result.results.filter(r => r.status === 'pass').length}</span>
                                <span style={{ color: '#dc2626' }}>❌ {result.results.filter(r => r.status === 'fail').length}</span>
                                <span style={{ color: '#d97706' }}>⚠️ {result.results.filter(r => r.status === 'warn').length}</span>
                            </div>
                        </div>

                        {/* Auto-Fix Button */}
                        {hasFailures && !fixResult && (
                            <button
                                onClick={handleAutoFix}
                                disabled={fixing}
                                style={{
                                    padding: '0.8rem 1.5rem', fontSize: '1rem', fontWeight: 700,
                                    color: '#fff', background: fixing ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    border: 'none', borderRadius: 12, cursor: fixing ? 'wait' : 'pointer',
                                    boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                                    transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                }}
                            >
                                {fixing ? '⏳' : '🔧'} {fixing ? (isVi ? 'Đang sửa...' : 'Fixing...') : (isVi ? 'Tự động sửa lỗi' : 'Auto-Fix')}
                            </button>
                        )}

                        {/* After fix: show re-check score + download */}
                        {fixResult && reCheckResult && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>→</span>
                                    <div style={{
                                        width: 80, height: 80, borderRadius: '50%',
                                        border: `5px solid ${reScoreColor}`,
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        background: '#fff', boxShadow: `0 4px 15px ${reScoreColor}22`,
                                    }}>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: reScoreColor }}>{reCheckResult.score}</div>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>/ {reCheckResult.total}</div>
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: reScoreColor }}>
                                        {reScorePercent}%
                                    </span>
                                </div>
                                <button
                                    onClick={handleDownload}
                                    style={{
                                        padding: '0.6rem 1.2rem', fontSize: '0.9rem', fontWeight: 700,
                                        color: '#fff', background: 'linear-gradient(135deg, #059669, #10b981)',
                                        border: 'none', borderRadius: 10, cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                                    }}
                                >
                                    📥 {isVi ? 'Tải file đã sửa' : 'Download Fixed File'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Diff / Changes Panel */}
                    {showDiff && fixResult && fixResult.changes.length > 0 && (
                        <div style={{
                            marginBottom: '1.5rem', borderRadius: 14, overflow: 'hidden',
                            border: '2px solid #3b82f633', background: '#f8fafc',
                        }}>
                            <div style={{
                                padding: '0.8rem 1rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                            }}>
                                🔍 {isVi ? `Đã sửa ${fixResult.changes.length} lỗi — So sánh trước/sau` : `Fixed ${fixResult.changes.length} issues — Before/After comparison`}
                            </div>
                            <div style={{ padding: '0.5rem' }}>
                                {fixResult.changes.map((change, i) => (
                                    <div key={i} style={{
                                        padding: '0.7rem 0.8rem', borderBottom: i < fixResult.changes.length - 1 ? '1px solid #e2e8f0' : 'none',
                                        display: 'flex', flexDirection: 'column', gap: '0.3rem',
                                    }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                                            🔧 {isVi ? change.rule : change.ruleEn}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: '0.8rem', padding: '2px 8px', borderRadius: 6,
                                                background: '#fee2e2', color: '#dc2626', textDecoration: 'line-through',
                                            }}>
                                                {isVi ? change.before.split(' / ')[0] : change.before.split(' / ')[1] || change.before}
                                            </span>
                                            <span style={{ color: '#94a3b8' }}>→</span>
                                            <span style={{
                                                fontSize: '0.8rem', padding: '2px 8px', borderRadius: 6,
                                                background: '#dcfce7', color: '#059669', fontWeight: 600,
                                            }}>
                                                {isVi ? change.after.split(' / ')[0] : change.after.split(' / ')[1] || change.after}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rule Results */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {result.results.map((rule, idx) => (
                            <div key={rule.id} style={{
                                background: STATUS_BG[rule.status], border: `1px solid ${STATUS_COLOR[rule.status]}33`,
                                borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s',
                            }}>
                                <div onClick={() => toggleRule(rule.id)} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.8rem 1rem', cursor: 'pointer',
                                }}>
                                    <span style={{ fontSize: '1.1rem' }}>{STATUS_ICON[rule.status]}</span>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', width: 20 }}>{idx + 1}</span>
                                    <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>
                                        {isVi ? rule.name : rule.nameEn}
                                    </span>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                                        color: STATUS_COLOR[rule.status], background: `${STATUS_COLOR[rule.status]}15`,
                                        textTransform: 'uppercase',
                                    }}>{rule.status}</span>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                        {expandedRules.has(rule.id) ? '▲' : '▼'}
                                    </span>
                                </div>
                                {expandedRules.has(rule.id) && (
                                    <div style={{
                                        padding: '0 1rem 0.8rem 3.2rem',
                                        fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6,
                                    }}>
                                        {isVi ? rule.detail : rule.detailEn}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div style={{
                        marginTop: '1.5rem', padding: '1rem', background: '#f8fafc',
                        borderRadius: 12, border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b',
                    }}>
                        <strong>{isVi ? 'Chú thích:' : 'Legend:'}</strong>{' '}
                        ✅ {isVi ? 'Đạt' : 'Pass'} • ❌ {isVi ? 'Không đạt' : 'Fail'} • ⚠️ {isVi ? 'Cảnh báo' : 'Warning'} • ⏭️ {isVi ? 'Bỏ qua' : 'Skipped'}
                        <div style={{ marginTop: '0.5rem' }}>
                            {isVi ? 'Căn cứ: Nghị định 30/2020/NĐ-CP, Quyết định 4114/QĐ-BTC' : 'Based on: Decree 30/2020/NĐ-CP, Decision 4114/QĐ-BTC'}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
