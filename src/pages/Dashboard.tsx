import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
                📊 Dashboard — Tổng quan hệ thống
            </h1>
            <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.9rem' }}>
                Thống kê, lịch sử thay đổi, QR Code, và đánh số văn bản tự động.
            </p>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={statCardStyle}>
                    <div style={{ fontSize: '2rem' }}>📁</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{stats.totalProjects}</div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Dự án</div>
                </div>
                <div style={statCardStyle}>
                    <div style={{ fontSize: '2rem' }}>📄</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{stats.totalFiles}</div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>File đã xử lý</div>
                </div>
                <div style={statCardStyle}>
                    <div style={{ fontSize: '2rem' }}>🏷️</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{stats.totalFields}</div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Trường đã tạo</div>
                </div>
                <div style={statCardStyle}>
                    <div style={{ fontSize: '2rem' }}>📋</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6' }}>{history.length}</div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Lịch sử thay đổi</div>
                </div>
            </div>

            {/* Two column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Left: History */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>🕐 Lịch sử thay đổi</h2>
                    {history.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Chưa có lịch sử. Sử dụng Gói mẫu để bắt đầu.</p>
                    ) : (
                        <div style={{ maxHeight: 300, overflow: 'auto' }}>
                            {history.map((h, i) => (
                                <div key={i} style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.82rem' }}>
                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{h.action}</div>
                                    <div style={{ color: '#64748b' }}>
                                        {h.sessionName} • {h.fieldsCount} trường •{' '}
                                        {new Date(h.timestamp).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <Link to="/goi-mau" style={{ display: 'inline-block', marginTop: '0.75rem', color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
                        → Mở Gói mẫu
                    </Link>
                </div>

                {/* Right: Recent sessions */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>💾 Phiên làm việc gần đây</h2>
                    {stats.recentSessions.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Chưa có phiên nào.</p>
                    ) : (
                        <div style={{ maxHeight: 300, overflow: 'auto' }}>
                            {stats.recentSessions.map((s, i) => (
                                <div key={i} style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.82rem' }}>
                                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                                    <div style={{ color: '#64748b' }}>
                                        {s.fields} trường • {s.date ? new Date(s.date).toLocaleDateString('vi-VN') : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tools row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                {/* QR Code Generator */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>📱 Tạo QR Code</h2>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                        Tạo QR chứa link bộ hồ sơ để chia sẻ nhanh.
                    </p>
                    <input
                        type="text"
                        value={qrUrl}
                        onChange={e => setQrUrl(e.target.value)}
                        placeholder="Nhập URL hoặc text..."
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
                        🔲 Tạo QR Code
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
                </div>

                {/* Auto Document Numbering */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>🔢 Đánh số văn bản tự động</h2>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                        Tự động tạo số hiệu văn bản theo format cơ quan.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <select
                            value={docPrefix}
                            onChange={e => setDocPrefix(e.target.value)}
                            className="form-select"
                            style={{ flex: 1, fontSize: '0.85rem' }}
                        >
                            <option value="">Chọn loại văn bản</option>
                            <option value="QĐ">QĐ — Quyết định</option>
                            <option value="CV">CV — Công văn</option>
                            <option value="BB">BB — Biên bản</option>
                            <option value="TB">TB — Thông báo</option>
                            <option value="TTr">TTr — Tờ trình</option>
                            <option value="HD">HĐ — Hợp đồng</option>
                        </select>
                        <input
                            type="number"
                            value={docCounter}
                            onChange={e => setDocCounter(Number(e.target.value))}
                            min={1}
                            className="form-input"
                            style={{ width: 80, fontSize: '0.85rem' }}
                            placeholder="Số"
                        />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={generateDocNumber}>
                        📝 Tạo số văn bản
                    </button>
                    {generatedNumber && (
                        <div style={{
                            marginTop: '0.75rem', padding: '0.75rem', background: '#f0fdf4',
                            borderRadius: 8, border: '1px solid #a7f3d0', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '0.75rem', color: '#059669', marginBottom: 4 }}>Số hiệu văn bản:</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>
                                {generatedNumber}
                            </div>
                            <button
                                className="btn btn-sm"
                                style={{ marginTop: '0.5rem', fontSize: '0.7rem', background: '#dbeafe' }}
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedNumber);
                                    alert('Đã copy: ' + generatedNumber);
                                }}
                            >
                                📋 Copy
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Navigation */}
            <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link to="/goi-mau" className="btn btn-primary">📦 Gói mẫu</Link>
                <Link to="/quan-ly-du-an" className="btn btn-outline">📋 Quản lý dự án</Link>
                <Link to="/danh-ba-nha-thau" className="btn btn-outline">📇 Danh bạ nhà thầu</Link>
                <Link to="/tra-cuu-du-an" className="btn btn-outline">🔍 Tra cứu dự án</Link>
                <Link to="/so-sanh-du-an" className="btn btn-outline">⚖️ So sánh dự án</Link>
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
