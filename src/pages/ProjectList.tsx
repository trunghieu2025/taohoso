import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listProjects, deleteProject, cloneProject, type Project, PREDEFINED_TAGS } from '../utils/projectStorage';
import { checkDeadlines, requestNotificationPermission, saveDeadlineReminder } from '../utils/deadlineNotifications';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    new: { label: '⚪ Mới', color: '#64748b', bg: '#f1f5f9' },
    in_progress: { label: '🟡 Đang làm', color: '#d97706', bg: '#fef3c7' },
    completed: { label: '🟢 Hoàn thành', color: '#059669', bg: '#d1fae5' },
};

function formatMoney(s: string): string {
    if (!s) return '—';
    const num = parseInt(s.replace(/\./g, ''), 10);
    if (isNaN(num)) return s;
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' tỷ';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(0) + ' tr';
    return s;
}

export default function ProjectList() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterYear, setFilterYear] = useState('all');
    const [filterTag, setFilterTag] = useState('all');
    const [urgentCount, setUrgentCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        listProjects().then(all => {
            setProjects(all);
            // Auto-register deadlines and check
            for (const p of all) {
                if (p.deadline && p.id) {
                    saveDeadlineReminder({
                        projectId: String(p.id),
                        projectName: p.name,
                        deadline: p.deadline,
                        enabled: true,
                    });
                }
            }
            const urgent = checkDeadlines(3);
            setUrgentCount(urgent.length);
        }).catch(() => { });
    }, []);

    const reload = async () => setProjects(await listProjects());

    const handleDelete = async (id: number) => {
        if (!confirm('Xóa dự án này?')) return;
        await deleteProject(id);
        await reload();
    };

    const handleClone = async (id: number) => {
        await cloneProject(id);
        await reload();
    };

    // Filters
    const filtered = projects.filter(p => {
        if (filterStatus !== 'all' && p.status !== filterStatus) return false;
        if (filterYear !== 'all' && p.year !== filterYear) return false;
        if (filterTag !== 'all' && !(p.tags || []).includes(filterTag)) return false;
        if (search) {
            const q = search.toLowerCase();
            return p.name.toLowerCase().includes(q)
                || p.contractorName.toLowerCase().includes(q)
                || p.location.toLowerCase().includes(q);
        }
        return true;
    }).sort((a, b) => {
        // Overdue projects first
        const aOverdue = a.deadline && new Date(a.deadline) <= new Date() ? 1 : 0;
        const bOverdue = b.deadline && new Date(b.deadline) <= new Date() ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Stats
    const totalAmount = projects.reduce((sum, p) => {
        const num = parseInt((p.totalAmount || '').replace(/\./g, ''), 10);
        return sum + (isNaN(num) ? 0 : num);
    }, 0);
    const inProgress = projects.filter(p => p.status === 'in_progress').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const years = [...new Set(projects.map(p => p.year))].sort().reverse();

    const cardStyle: React.CSSProperties = {
        flex: '1 1 140px', padding: '1rem 1.25rem', borderRadius: 12,
        textAlign: 'center', minWidth: 130,
    };

    return (
        <div className="container" style={{ maxWidth: 1100, padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>📊 Quản lý Dự án</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {urgentCount > 0 && (
                        <span style={{ background: '#fef2f2', color: '#dc2626', padding: '0.3rem 0.6rem', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
                            🔔 {urgentCount} dự án sắp hết hạn
                        </span>
                    )}
                    <button className="btn btn-sm" onClick={async () => {
                        const ok = await requestNotificationPermission();
                        alert(ok ? '✅ Đã bật nhắc nhở! Bạn sẽ nhận thông báo khi dự án sắp hết hạn.' : '❌ Trình duyệt không cho phép thông báo.');
                    }} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#dbeafe', color: '#1d4ed8' }}>
                        🔔 Bật nhắc nhở
                    </button>
                    <Link to="/danh-ba-nha-thau" className="btn btn-sm btn-secondary">📋 Nhà thầu</Link>
                    <Link to="/ho-so-sua-chua" className="btn btn-sm btn-primary">➕ Tạo hồ sơ mới</Link>
                </div>
            </div>

            {/* Dashboard cards */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #93c5fd' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2563eb' }}>{projects.length}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Tổng dự án</div>
                </div>
                <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#059669' }}>{formatMoney(totalAmount.toString())}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Tổng giá trị</div>
                </div>
                <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fcd34d' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#d97706' }}>{inProgress}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Đang thực hiện</div>
                </div>
                <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #f0fdf4, #d1fae5)', border: '1px solid #6ee7b7' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#059669' }}>{completed}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Hoàn thành</div>
                </div>
            </div>

            {/* Search & filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input
                    type="text" placeholder="🔍 Tìm theo tên, nhà thầu, địa điểm..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ flex: '1 1 250px', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                    <option value="all">Tất cả trạng thái</option>
                    <option value="new">⚪ Mới</option>
                    <option value="in_progress">🟡 Đang làm</option>
                    <option value="completed">🟢 Hoàn thành</option>
                </select>
                {years.length > 0 && (
                    <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                        <option value="all">Tất cả năm</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                )}
                <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                    <option value="all">Tất cả nhãn</option>
                    {PREDEFINED_TAGS.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
            </div>

            {/* Project table */}
            {filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '3rem', color: '#94a3b8',
                    background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0',
                }}>
                    {projects.length === 0 ? (
                        <>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
                            <div>Chưa có dự án nào</div>
                            <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                Tạo hồ sơ từ <Link to="/ho-so-sua-chua">Tự động hóa</Link> hoặc <Link to="/goi-mau">Gói mẫu</Link> rồi bấm "Lưu vào dự án"
                            </div>
                        </>
                    ) : (
                        <div>Không tìm thấy dự án phù hợp</div>
                    )}
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                                <th style={thStyle}>Tên công trình</th>
                                <th style={thStyle}>Nhà thầu</th>
                                <th style={thStyle}>Giá trị</th>
                                <th style={thStyle}>Checklist</th>
                                <th style={thStyle}>Trạng thái</th>
                                <th style={thStyle}>Hạn nộp</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => {
                                const st = STATUS_LABELS[p.status] || STATUS_LABELS.new;
                                const checkDone = (p.checklist || []).filter(c => c.done).length;
                                const checkTotal = (p.checklist || []).length;
                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }}
                                        onClick={() => navigate(`/du-an/${p.id}`)}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.location}</div>
                                            {(p.tags || []).length > 0 && (
                                                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 2 }}>
                                                    {(p.tags || []).map(tag => {
                                                        const t = PREDEFINED_TAGS.find(pt => pt.name === tag);
                                                        return <span key={tag} style={{ fontSize: '0.6rem', padding: '0 0.3rem', borderRadius: 6, background: t?.bg || '#f1f5f9', color: t?.color || '#64748b', fontWeight: 600 }}>{tag}</span>;
                                                    })}
                                                </div>
                                            )}
                                        </td>
                                        <td style={tdStyle}>{p.contractorName || '—'}</td>
                                        <td style={tdStyle}>{formatMoney(p.totalAmount)}</td>
                                        <td style={tdStyle}>
                                            <div style={{ fontSize: '0.8rem' }}>{checkDone}/{checkTotal}</div>
                                            <div style={{ background: '#e2e8f0', borderRadius: 4, height: 4, marginTop: 3 }}>
                                                <div style={{ background: '#059669', borderRadius: 4, height: 4, width: checkTotal ? `${(checkDone / checkTotal) * 100}%` : '0%' }} />
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{ padding: '0.15rem 0.5rem', borderRadius: 12, fontSize: '0.75rem', background: st.bg, color: st.color }}>
                                                {st.label}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            {(() => {
                                                if (!p.deadline) return <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>;
                                                const dl = new Date(p.deadline);
                                                const now = new Date();
                                                const diff = Math.ceil((dl.getTime() - now.getTime()) / 86400000);
                                                const color = diff < 0 ? '#dc2626' : diff <= 3 ? '#d97706' : '#059669';
                                                const icon = diff < 0 ? '🔴' : diff <= 3 ? '🟡' : '';
                                                return (
                                                    <span style={{ color, fontWeight: diff <= 3 ? 700 : 400, fontSize: '0.8rem' }}>
                                                        {icon} {dl.toLocaleDateString('vi-VN')}
                                                        {diff < 0 && <div style={{ fontSize: '0.7rem' }}>Quá hạn {-diff} ngày</div>}
                                                        {diff >= 0 && diff <= 3 && <div style={{ fontSize: '0.7rem' }}>Còn {diff} ngày</div>}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleClone(p.id!); }}
                                                title="Nhân bản" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', color: '#2563eb', marginRight: 4 }}>📋</button>
                                            <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(p.id!); }}
                                                style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', color: '#ef4444' }}>🗑️</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const thStyle: React.CSSProperties = { padding: '0.6rem 0.75rem', fontWeight: 600, fontSize: '0.8rem', color: '#475569' };
const tdStyle: React.CSSProperties = { padding: '0.6rem 0.75rem' };
