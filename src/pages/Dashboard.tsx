import { useState, useEffect } from 'react';
import { showToast } from '../components/Toast';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { isDesktop } from '../utils/desktopFileHelper';
import { useLanguage } from '../i18n/i18n';

/* ── Types ── */
interface ProjectStats {
    totalProjects: number;
    totalFiles: number;
    totalFields: number;
    recentSessions: { name: string; date: string; fields: number }[];
}

/* ── History from localStorage ── */
function getStats(): ProjectStats {
    let totalProjects = 0, totalFiles = 0, totalFields = 0;
    const recentSessions: ProjectStats['recentSessions'] = [];

    // Count projects from projectStorage
    try {
        const projects = JSON.parse(localStorage.getItem('taohoso_projects') || '[]');
        totalProjects = projects.length;
    } catch { }

    // Count bundle sessions
    try {
        const sessions = JSON.parse(localStorage.getItem('taohoso_bundle_sessions') || '[]');
        for (const s of sessions) {
            totalFiles += (s.fileNames || []).length;
            totalFields += (s.allTags || []).length;
            recentSessions.push({
                name: s.name || 'Chưa đặt tên',
                date: s.date || '',
                fields: (s.allTags || []).length,
            });
        }
    } catch { }

    // Count autosave
    try {
        const auto = JSON.parse(localStorage.getItem('taohoso_bundle_autosave') || 'null');
        if (auto) {
            totalFiles += (auto.fileNames || []).length;
            totalFields += (auto.allTags || []).length;
        }
    } catch { }

    // Count field history
    try {
        const hist = JSON.parse(localStorage.getItem('taohoso_field_history') || '[]');
        totalFields = Math.max(totalFields, hist.length);
    } catch { }

    return { totalProjects, totalFiles, totalFields, recentSessions: recentSessions.slice(-10).reverse() };
}

/* ── Version History ── */
interface HistoryEntry {
    id: string;
    timestamp: number;
    action: string;
    sessionName: string;
    fieldsCount: number;
}

function getHistory(): HistoryEntry[] {
    try {
        return JSON.parse(localStorage.getItem('taohoso_change_history') || '[]');
    } catch { return []; }
}

export function logHistory(action: string, sessionName: string, fieldsCount: number) {
    try {
        const history = getHistory();
        history.push({
            id: Date.now().toString(36),
            timestamp: Date.now(),
            action,
            sessionName,
            fieldsCount,
        });
        // Keep last 100
        localStorage.setItem('taohoso_change_history', JSON.stringify(history.slice(-100)));
    } catch { }
}

/* ── QR Code Generator (SVG) ── */
function generateQRSvg(text: string, size = 200): string {
    // Simple QR-like visual using data URI
    const encoded = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=svg`;
}

/* ── Component ── */
export default function Dashboard() {
    const [stats, setStats] = useState<ProjectStats>(getStats);
    const [history, setHistory] = useState<HistoryEntry[]>(getHistory);
    const [qrUrl, setQrUrl] = useState('');
    const [showQr, setShowQr] = useState(false);
    const [docNumber, setDocNumber] = useState('');
    const [docPrefix, setDocPrefix] = useState('');
    const [docCounter, setDocCounter] = useState(1);
    const [generatedNumber, setGeneratedNumber] = useState('');
    const { lang } = useLanguage();
    const isVi = lang === 'vi';

    useEffect(() => {
        setStats(getStats());
        setHistory(getHistory());
    }, []);

    // Auto-numbering
    const generateDocNumber = () => {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const day = String(new Date().getDate()).padStart(2, '0');
        const counter = String(docCounter).padStart(3, '0');
        const prefix = docPrefix || 'QĐ';

        const formats: Record<string, string> = {
            'QĐ': `${counter}/${prefix}-UBND`,
            'CV': `${counter}/${prefix}-VP`,
            'BB': `${counter}/${prefix}-BQLDA`,
            'TB': `${counter}/${prefix}-BQLDA`,
            'TTr': `${counter}/${prefix}-BQLDA`,
            'HD': `${counter}/${year}/${prefix}-BQLDA`,
        };

        const result = formats[prefix] || `${counter}/${prefix}-BQLDA`;
        setGeneratedNumber(result);
        setDocCounter(prev => prev + 1);
    };

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                📊 Dashboard — {isVi ? 'Tổng quan hệ thống' : 'System Overview'}
            </h1>
            <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.9rem' }}>
                {isVi ? 'Thống kê, lịch sử thay đổi, QR Code, và đánh số văn bản tự động.' : 'Statistics, change history, QR Code, and auto document numbering.'}
            </p>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={statCardStyle}>
                    <div style={{ fontSize: '2rem' }}>📁</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{stats.totalProjects}</div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{isVi ? 'Dự án' : 'Projects'}</div>
                </div>
                <div style={statCardStyle}>
                    <div style={{ fontSize: '2rem' }}>📄</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{stats.totalFiles}</div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{isVi ? 'File đã xử lý' : 'Files Processed'}</div>
                </div>
                <div style={statCardStyle}>
                    <div style={{ fontSize: '2rem' }}>🏷️</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{stats.totalFields}</div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{isVi ? 'Trường đã tạo' : 'Fields Created'}</div>
                </div>
                <div style={statCardStyle}>
                    <div style={{ fontSize: '2rem' }}>📋</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6' }}>{history.length}</div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{isVi ? 'Lịch sử thay đổi' : 'Change History'}</div>
                </div>
            </div>

            {/* Two column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Left: History */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>🕐 {isVi ? 'Lịch sử thay đổi' : 'Change History'}</h2>
                    {history.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{isVi ? 'Chưa có lịch sử. Sử dụng Gói mẫu để bắt đầu.' : 'No history yet. Use Bundle Template to get started.'}</p>
                    ) : (
                        <div style={{ maxHeight: 300, overflow: 'auto' }}>
                            {history.map((h, i) => (
                                <div key={i} style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.82rem' }}>
                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{h.action}</div>
                                    <div style={{ color: '#64748b' }}>
                                        {h.sessionName} • {h.fieldsCount} {isVi ? 'trường' : 'fields'} •{' '}
                                        {new Date(h.timestamp).toLocaleString(isVi ? 'vi-VN' : 'en-US')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <Link to="/goi-mau" style={{ display: 'inline-block', marginTop: '0.75rem', color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
                        → {isVi ? 'Mở Gói mẫu' : 'Open Bundle Template'}
                    </Link>
                </div>

                {/* Right: Recent sessions */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>💾 {isVi ? 'Phiên làm việc gần đây' : 'Recent Sessions'}</h2>
                    {stats.recentSessions.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{isVi ? 'Chưa có phiên nào.' : 'No sessions yet.'}</p>
                    ) : (
                        <div style={{ maxHeight: 300, overflow: 'auto' }}>
                            {stats.recentSessions.map((s, i) => (
                                <div key={i} style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.82rem' }}>
                                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                                    <div style={{ color: '#64748b' }}>
                                        {s.fields} {isVi ? 'trường' : 'fields'} • {s.date ? new Date(s.date).toLocaleDateString(isVi ? 'vi-VN' : 'en-US') : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tools row */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop() ? '1fr' : '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                {/* QR Code Generator — ẩn trên desktop (cần internet) */}
                {!isDesktop() && (<div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>📱 {isVi ? 'Tạo QR Code' : 'Generate QR Code'}</h2>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                        {isVi ? 'Tạo QR chứa link bộ hồ sơ để chia sẻ nhanh.' : 'Generate QR with document link for quick sharing.'}
                    </p>
                    <input
                        type="text"
                        value={qrUrl}
                        onChange={e => setQrUrl(e.target.value)}
                        placeholder={isVi ? 'Nhập URL hoặc text...' : 'Enter URL or text...'}
                        className="form-input"
                        style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => {
                        if (qrUrl.trim()) setShowQr(true);
                        else {
                            setQrUrl(window.location.origin + '/goi-mau');
                            setShowQr(true);
                        }
                    }}>
                        🔲 {isVi ? 'Tạo QR Code' : 'Generate QR Code'}
                    </button>
                    {showQr && (
                        <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                            <img
                                src={generateQRSvg(qrUrl || window.location.origin + '/goi-mau')}
                                alt="QR Code"
                                style={{ width: 180, height: 180, border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, background: '#fff' }}
                            />
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem', wordBreak: 'break-all' }}>
                                {qrUrl || window.location.origin + '/goi-mau'}
                            </p>
                        </div>
                    )}
                </div>)}

                {/* Auto Document Numbering */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>🔢 {isVi ? 'Đánh số văn bản tự động' : 'Auto Document Numbering'}</h2>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                        {isVi ? 'Tự động tạo số hiệu văn bản theo format cơ quan.' : 'Auto-generate document numbers per agency format.'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <select
                            value={docPrefix}
                            onChange={e => setDocPrefix(e.target.value)}
                            className="form-select"
                            style={{ flex: 1, fontSize: '0.85rem' }}
                        >
                            <option value="">{isVi ? 'Chọn loại văn bản' : 'Select document type'}</option>
                            <option value="QĐ">{isVi ? 'QĐ — Quyết định' : 'QĐ — Decision'}</option>
                            <option value="CV">{isVi ? 'CV — Công văn' : 'CV — Official Letter'}</option>
                            <option value="BB">{isVi ? 'BB — Biên bản' : 'BB — Minutes'}</option>
                            <option value="TB">{isVi ? 'TB — Thông báo' : 'TB — Notice'}</option>
                            <option value="TTr">{isVi ? 'TTr — Tờ trình' : 'TTr — Proposal'}</option>
                            <option value="HD">{isVi ? 'HĐ — Hợp đồng' : 'HĐ — Contract'}</option>
                        </select>
                        <input
                            type="number"
                            value={docCounter}
                            onChange={e => setDocCounter(Number(e.target.value))}
                            min={1}
                            className="form-input"
                            style={{ width: 80, fontSize: '0.85rem' }}
                            placeholder={isVi ? 'Số' : 'Number'}
                        />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={generateDocNumber}>
                        📝 {isVi ? 'Tạo số văn bản' : 'Generate Doc Number'}
                    </button>
                    {generatedNumber && (
                        <div style={{
                            marginTop: '0.75rem', padding: '0.75rem', background: '#f0fdf4',
                            borderRadius: 8, border: '1px solid #a7f3d0', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '0.75rem', color: '#059669', marginBottom: 4 }}>{isVi ? 'Số hiệu văn bản:' : 'Document Number:'}</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>
                                {generatedNumber}
                            </div>
                            <button
                                className="btn btn-sm"
                                style={{ marginTop: '0.5rem', fontSize: '0.7rem', background: '#dbeafe' }}
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedNumber);
                                    showToast((isVi ? 'Đã copy: ' : 'Copied: ') + generatedNumber);
                                }}
                            >
                                📋 Copy
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Export Excel Report */}
            <div style={{ marginTop: '1.5rem', ...sectionStyle }}>
                <h2 style={sectionTitleStyle}>📊 {isVi ? 'Xuất báo cáo Excel' : 'Export Excel Report'}</h2>
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                    {isVi ? 'Tổng hợp toàn bộ dữ liệu (dự án, phiên, lịch sử) thành 1 file Excel.' : 'Consolidate all data (projects, sessions, history) into one Excel file.'}
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => {
                    try {
                        const wb = XLSX.utils.book_new();
                        const projects = JSON.parse(localStorage.getItem('taohoso_projects') || '[]');
                        if (projects.length > 0) {
                            const rows = projects.map((p: any) => ({ 'Tên dự án': p.name || '', 'Ngày tạo': p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : '', 'Số trường': Object.keys(p.data || {}).length }));
                            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Dự án');
                        }
                        if (stats.recentSessions.length > 0) {
                            const rows = stats.recentSessions.map(s => ({ 'Tên phiên': s.name, 'Ngày': s.date ? new Date(s.date).toLocaleDateString('vi-VN') : '', 'Số trường': s.fields }));
                            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Phiên');
                        }
                        if (history.length > 0) {
                            const rows = history.map(h => ({ 'Hành động': h.action, 'Phiên': h.sessionName, 'Trường': h.fieldsCount, 'Thời gian': new Date(h.timestamp).toLocaleString('vi-VN') }));
                            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Lịch sử');
                        }
                        XLSX.writeFile(wb, `BaoCao_TaoHoSo_${new Date().toISOString().slice(0,10)}.xlsx`);
                        showToast(isVi ? 'Đã xuất báo cáo Excel!' : 'Excel report exported!', 'success');
                    } catch (err) { showToast((isVi ? 'Lỗi: ' : 'Error: ') + (err as Error).message, 'error'); }
                }}>
                    📥 {isVi ? 'Xuất báo cáo tổng hợp (.xlsx)' : 'Export Summary Report (.xlsx)'}
                </button>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link to="/goi-mau" className="btn btn-primary">📦 {isVi ? 'Gói mẫu' : 'Bundle Template'}</Link>
                <Link to="/quan-ly-du-an" className="btn btn-outline">📋 {isVi ? 'Quản lý dự án' : 'Project Management'}</Link>
                <Link to="/danh-ba-nha-thau" className="btn btn-outline">📇 {isVi ? 'Danh bạ nhà thầu' : 'Contractor Directory'}</Link>
                <Link to="/tra-cuu-du-an" className="btn btn-outline">🔍 {isVi ? 'Tra cứu dự án' : 'Search Projects'}</Link>
                <Link to="/so-sanh-du-an" className="btn btn-outline">⚖️ {isVi ? 'So sánh dự án' : 'Compare Projects'}</Link>
            </div>
        </div>
    );
}

/* ── Styles ── */
const statCardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '1.25rem',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'transform 0.2s, box-shadow 0.2s',
};

const sectionStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 700,
    marginBottom: '0.75rem',
    color: '#1e293b',
};
