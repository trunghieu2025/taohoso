import { useState, useMemo } from 'react';

interface Props {
    fields: { key: string; label: string; value: string }[];
    onConfirm: (selectedKeys: string[], projectName: string) => void;
    onCancel: () => void;
    defaultName?: string;
}

export default function FieldSelectorModal({ fields, onConfirm, onCancel, defaultName }: Props) {
    const [selected, setSelected] = useState<Set<string>>(
        new Set(fields.filter(f => f.value.trim()).map(f => f.key))
    );
    const [search, setSearch] = useState('');
    const [projectName, setProjectName] = useState(defaultName || '');

    const filtered = useMemo(() => {
        if (!search) return fields;
        const q = search.toLowerCase();
        return fields.filter(f =>
            f.label.toLowerCase().includes(q) ||
            f.key.toLowerCase().includes(q) ||
            f.value.toLowerCase().includes(q)
        );
    }, [fields, search]);

    const toggle = (key: string) =>
        setSelected(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });

    const selectAll = () => setSelected(new Set(fields.map(f => f.key)));
    const deselectAll = () => setSelected(new Set());

    const handleConfirm = () => {
        if (!projectName.trim()) { alert('Vui lòng nhập tên dự án'); return; }
        if (selected.size === 0) { alert('Chọn ít nhất 1 trường'); return; }
        onConfirm([...selected], projectName.trim());
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
        }} onClick={onCancel}>
            <div style={{
                background: '#fff', borderRadius: 16, width: '90%', maxWidth: 650,
                maxHeight: '85vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0',
                    background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '16px 16px 0 0',
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1e40af' }}>
                        📊 Lưu vào dự án — Chọn trường quản lý
                    </h2>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                        Chọn các trường bạn muốn theo dõi trong quản lý hợp đồng
                    </p>
                </div>

                {/* Project name */}
                <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>Tên dự án *</div>
                    <input
                        type="text" value={projectName} onChange={e => setProjectName(e.target.value)}
                        placeholder="Nhập tên dự án..."
                        style={{
                            width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8,
                            border: '2px solid #93c5fd', fontSize: '0.9rem', outline: 'none',
                        }}
                        autoFocus
                    />
                </div>

                {/* Search + actions */}
                <div style={{ padding: '0.5rem 1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                    <input
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="🔍 Tìm trường..."
                        style={{ flex: 1, padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
                    />
                    <button onClick={selectAll} style={actionBtn}>✅ Tất cả</button>
                    <button onClick={deselectAll} style={actionBtn}>⬜ Bỏ hết</button>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {selected.size}/{fields.length}
                    </span>
                </div>

                {/* Field list */}
                <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem 1.5rem' }}>
                    {filtered.map(f => (
                        <label key={f.key} style={{
                            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                            padding: '0.4rem 0.5rem', borderRadius: 6, cursor: 'pointer',
                            background: selected.has(f.key) ? '#eff6ff' : 'transparent',
                            marginBottom: 2, transition: 'background 0.15s',
                        }}>
                            <input
                                type="checkbox" checked={selected.has(f.key)}
                                onChange={() => toggle(f.key)}
                                style={{ marginTop: 2, cursor: 'pointer' }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>
                                    {f.label}
                                </div>
                                {f.value && (
                                    <div style={{
                                        fontSize: '0.75rem', color: '#64748b',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {f.value}
                                    </div>
                                )}
                            </div>
                        </label>
                    ))}
                    {filtered.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                            Không tìm thấy trường nào
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '0.75rem 1.5rem', borderTop: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderRadius: '0 0 16px 16px', background: '#f8fafc',
                }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Đã chọn <b>{selected.size}</b> trường
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm" onClick={onCancel}
                            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Hủy</button>
                        <button className="btn btn-sm btn-primary" onClick={handleConfirm}
                            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                            📊 Lưu dự án ({selected.size} trường)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const actionBtn: React.CSSProperties = {
    background: 'none', border: '1px solid #e2e8f0', borderRadius: 6,
    padding: '0.2rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer', color: '#475569',
};
