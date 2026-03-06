import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    listContractors, saveContractor, deleteContractor, type Contractor,
} from '../utils/contractorStorage';
import { listProjects } from '../utils/projectStorage';

export default function ContractorDirectory() {
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [projectCounts, setProjectCounts] = useState<Record<string, number>>({});
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<Contractor | null>(null);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '', representative: '', position: '', phone: '',
        taxCode: '', bankAccount: '', bank: '',
    });

    useEffect(() => {
        reload();
    }, []);

    const reload = async () => {
        const list = await listContractors();
        setContractors(list);
        // Count projects per contractor
        const projects = await listProjects();
        const counts: Record<string, number> = {};
        projects.forEach(p => {
            if (p.contractorName) {
                counts[p.contractorName] = (counts[p.contractorName] || 0) + 1;
            }
        });
        setProjectCounts(counts);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { alert('Vui lòng nhập tên nhà thầu'); return; }
        await saveContractor({
            ...form,
            ...(editItem?.id ? { id: editItem.id } : {}),
        } as any);
        setShowForm(false);
        setEditItem(null);
        setForm({ name: '', representative: '', position: '', phone: '', taxCode: '', bankAccount: '', bank: '' });
        await reload();
    };

    const handleEdit = (c: Contractor) => {
        setEditItem(c);
        setForm({
            name: c.name, representative: c.representative, position: c.position,
            phone: c.phone, taxCode: c.taxCode, bankAccount: c.bankAccount, bank: c.bank,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Xóa nhà thầu này?')) return;
        await deleteContractor(id);
        await reload();
    };

    const filtered = contractors.filter(c => {
        if (!search) return true;
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q)
            || c.taxCode.toLowerCase().includes(q)
            || c.phone.includes(q);
    });

    const inputStyle: React.CSSProperties = {
        padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #e2e8f0',
        fontSize: '0.85rem', width: '100%',
    };

    return (
        <div className="container" style={{ maxWidth: 1000, padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>📋 Danh bạ Nhà thầu</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => navigate('/quan-ly-du-an')}>📊 Dự án</button>
                    <button className="btn btn-sm btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', representative: '', position: '', phone: '', taxCode: '', bankAccount: '', bank: '' }); setShowForm(true); }}>
                        ➕ Thêm nhà thầu
                    </button>
                </div>
            </div>

            {/* Search */}
            <input type="text" placeholder="🔍 Tìm theo tên, MST, SĐT..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, marginBottom: '1rem', maxWidth: 350 }} />

            {/* Add/Edit form */}
            {showForm && (
                <div style={{
                    padding: '1rem', borderRadius: 12, border: '1px solid #93c5fd',
                    background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', marginBottom: '1rem',
                }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
                        {editItem ? '🖊 Sửa nhà thầu' : '➕ Thêm nhà thầu mới'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tên nhà thầu *</div>
                            <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Đại diện</div>
                            <input style={inputStyle} value={form.representative} onChange={e => setForm({ ...form, representative: e.target.value })} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Chức vụ</div>
                            <input style={inputStyle} value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SĐT</div>
                            <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Mã số thuế</div>
                            <input style={inputStyle} value={form.taxCode} onChange={e => setForm({ ...form, taxCode: e.target.value })} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Số tài khoản</div>
                            <input style={inputStyle} value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ngân hàng</div>
                            <input style={inputStyle} value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button className="btn btn-sm btn-primary" onClick={handleSave}>💾 Lưu</button>
                        <button className="btn btn-sm" onClick={() => { setShowForm(false); setEditItem(null); }}>Hủy</button>
                    </div>
                </div>
            )}

            {/* Table */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                    <div>Chưa có nhà thầu nào</div>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                                <th style={thStyle}>Tên nhà thầu</th>
                                <th style={thStyle}>Đại diện</th>
                                <th style={thStyle}>SĐT</th>
                                <th style={thStyle}>MST</th>
                                <th style={thStyle}>Ngân hàng</th>
                                <th style={thStyle}>Dự án</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.position}</div>
                                    </td>
                                    <td style={tdStyle}>{c.representative}</td>
                                    <td style={tdStyle}>{c.phone}</td>
                                    <td style={tdStyle}>{c.taxCode}</td>
                                    <td style={tdStyle}>
                                        <div>{c.bank}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.bankAccount}</div>
                                    </td>
                                    <td style={tdStyle}>{projectCounts[c.name] || 0}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        <button className="btn btn-sm" onClick={() => handleEdit(c)}
                                            style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', marginRight: 4 }}>🖊</button>
                                        <button className="btn btn-sm" onClick={() => handleDelete(c.id!)}
                                            style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', color: '#ef4444' }}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const thStyle: React.CSSProperties = { padding: '0.6rem 0.75rem', fontWeight: 600, fontSize: '0.8rem', color: '#475569' };
const tdStyle: React.CSSProperties = { padding: '0.6rem 0.75rem' };
