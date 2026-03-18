import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { checkND30, CheckResult, RuleResult, RuleStatus } from '../utils/nd30Checker';
import { useT, useLanguage } from '../i18n/i18n';

const STATUS_ICON: Record<RuleStatus, string> = { pass: '✅', fail: '❌', warn: '⚠️', skip: '⏭️' };
const STATUS_COLOR: Record<RuleStatus, string> = { pass: '#059669', fail: '#dc2626', warn: '#d97706', skip: '#94a3b8' };
const STATUS_BG: Record<RuleStatus, string> = { pass: '#f0fdf4', fail: '#fef2f2', warn: '#fffbeb', skip: '#f8fafc' };

export default function ND30Checker() {
    const t = useT();
    const { lang } = useLanguage();
    const [result, setResult] = useState<CheckResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState('');
    const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

    const isVi = lang === 'vi';

    const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setLoading(true);
        setResult(null);
        try {
            const buffer = await file.arrayBuffer();
            const res = await checkND30(buffer);
            setResult(res);
            setExpandedRules(new Set(res.results.filter(r => r.status !== 'pass').map(r => r.id)));
        } catch (err) {
            alert(isVi ? 'Lỗi khi phân tích file. Vui lòng thử file .docx khác.' : 'Error analyzing file. Please try a different .docx file.');
        } finally {
            setLoading(false);
        }
    }, [isVi]);

    const toggleRule = (id: string) => {
        setExpandedRules(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const scorePercent = result ? Math.round((result.score / result.total) * 100) : 0;
    const scoreColor = scorePercent >= 80 ? '#059669' : scorePercent >= 50 ? '#d97706' : '#dc2626';

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
                        ? 'Upload file Word (.docx) → tự động kiểm tra 15 quy tắc thể thức theo Nghị định 30/2020/NĐ-CP'
                        : 'Upload a Word file (.docx) → automatically check 15 formatting rules per Vietnam Decree 30/2020/NĐ-CP'}
                </p>
            </div>

            {/* Upload Area */}
            <div style={{
                border: '2px dashed #cbd5e1',
                borderRadius: 16,
                padding: '2.5rem',
                textAlign: 'center',
                background: result ? '#f8fafc' : 'linear-gradient(135deg, #f0f9ff, #ede9fe)',
                cursor: 'pointer',
                transition: 'all 0.3s',
                marginBottom: '2rem',
            }}>
                <input
                    id="nd30-upload"
                    type="file"
                    accept=".docx"
                    onChange={handleUpload}
                    style={{ display: 'none' }}
                />
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
                    {fileName && (
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                            📎 {fileName}
                        </div>
                    )}
                </label>
            </div>

            {/* Results */}
            {result && (
                <>
                    {/* Score Circle */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap',
                    }}>
                        <div style={{
                            width: 120, height: 120, borderRadius: '50%',
                            border: `6px solid ${scoreColor}`,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            background: '#fff', boxShadow: `0 4px 20px ${scoreColor}22`,
                        }}>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: scoreColor }}>{result.score}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>/ {result.total}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: scoreColor }}>
                                {scorePercent}%
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                {scorePercent >= 80 
                                    ? (isVi ? '🎉 Đạt chuẩn!' : '🎉 Compliant!')
                                    : scorePercent >= 50
                                        ? (isVi ? '⚠️ Cần chỉnh sửa' : '⚠️ Needs fixing')
                                        : (isVi ? '❌ Chưa đạt' : '❌ Non-compliant')}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                <span style={{ color: '#059669' }}>✅ {result.results.filter(r => r.status === 'pass').length}</span>
                                <span style={{ color: '#dc2626' }}>❌ {result.results.filter(r => r.status === 'fail').length}</span>
                                <span style={{ color: '#d97706' }}>⚠️ {result.results.filter(r => r.status === 'warn').length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Rule Results */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {result.results.map((rule, idx) => (
                            <div
                                key={rule.id}
                                style={{
                                    background: STATUS_BG[rule.status],
                                    border: `1px solid ${STATUS_COLOR[rule.status]}33`,
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <div
                                    onClick={() => toggleRule(rule.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.8rem 1rem', cursor: 'pointer',
                                    }}
                                >
                                    <span style={{ fontSize: '1.1rem' }}>{STATUS_ICON[rule.status]}</span>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', width: 20 }}>{idx + 1}</span>
                                    <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>
                                        {isVi ? rule.name : rule.nameEn}
                                    </span>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px',
                                        borderRadius: 8, color: STATUS_COLOR[rule.status],
                                        background: `${STATUS_COLOR[rule.status]}15`,
                                        textTransform: 'uppercase',
                                    }}>
                                        {rule.status}
                                    </span>
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
                        borderRadius: 12, border: '1px solid #e2e8f0',
                        fontSize: '0.8rem', color: '#64748b',
                    }}>
                        <strong>{isVi ? 'Chú thích:' : 'Legend:'}</strong>{' '}
                        ✅ {isVi ? 'Đạt' : 'Pass'} •{' '}
                        ❌ {isVi ? 'Không đạt' : 'Fail'} •{' '}
                        ⚠️ {isVi ? 'Cảnh báo' : 'Warning'} •{' '}
                        ⏭️ {isVi ? 'Bỏ qua' : 'Skipped'}
                        <div style={{ marginTop: '0.5rem' }}>
                            {isVi 
                                ? 'Căn cứ: Nghị định 30/2020/NĐ-CP, Quyết định 4114/QĐ-BTC'
                                : 'Based on: Decree 30/2020/NĐ-CP, Decision 4114/QĐ-BTC'}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
