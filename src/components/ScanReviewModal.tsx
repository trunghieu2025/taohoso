import { useState, ChangeEvent } from 'react';
import type { ScanResult } from '../utils/militaryDocGenerator';

interface Props {
    results: ScanResult[];
    onConfirm: (selected: { text: string; tag: string; label: string }[]) => void;
    onCancel: () => void;
}

export default function ScanReviewModal({ results, onConfirm, onCancel }: Props) {
    const [items, setItems] = useState<ScanResult[]>(() =>
        results.map((r) => ({ ...r }))
    );

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

    const handleConfirm = () => {
        const selected = items
            .filter((item) => item.selected && item.suggestedTag.trim())
            .map((item) => ({
                text: item.text,
                tag: item.suggestedTag.trim(),
                label: item.suggestedLabel || item.text,
            }));
        onConfirm(selected);
    };

    const selectedCount = items.filter((i) => i.selected).length;

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
                            🔍 Kết quả quét — {items.length} giá trị trùng lặp
                        </h2>
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                            Chọn các giá trị cần chuyển thành trường nhập liệu. Bạn có thể sửa tên trường và nhãn.
                        </p>
                    </div>
                    <button onClick={onCancel} style={closeBtnStyle}>✕</button>
                </div>

                {/* Toolbar */}
                <div style={toolbarStyle}>
                    <button className="btn btn-sm" onClick={selectAll}>☑ Chọn tất cả</button>
                    <button className="btn btn-sm" onClick={deselectAll}>☐ Bỏ tất cả</button>
                    <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#64748b' }}>
                        Đã chọn: <strong>{selectedCount}</strong> / {items.length}
                    </span>
                </div>

                {/* Table */}
                <div style={tableContainerStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, width: 40 }}>☑</th>
                                <th style={thStyle}>Giá trị trong file</th>
                                <th style={{ ...thStyle, width: 60, textAlign: 'center' }}>Lần</th>
                                <th style={thStyle}>Tên trường (tag)</th>
                                <th style={thStyle}>Nhãn hiển thị</th>
                                <th style={{ ...thStyle, width: 150 }}>Vị trí</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr
                                    key={idx}
                                    style={{
                                        background: item.selected ? '#f0fdf4' : '#fafafa',
                                        opacity: item.selected ? 1 : 0.6,
                                    }}
                                >
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={() => toggleItem(idx)}
                                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                                        />
                                    </td>
                                    <td style={{ ...tdStyle, fontWeight: 500, maxWidth: 200 }}>
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.text}
                                        </div>
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#dc2626' }}>
                                        {item.count}
                                    </td>
                                    <td style={tdStyle}>
                                        <input
                                            type="text"
                                            value={item.suggestedTag}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => updateTag(idx, e.target.value)}
                                            disabled={!item.selected}
                                            style={inputStyle}
                                            placeholder="TEN_TRUONG"
                                        />
                                    </td>
                                    <td style={tdStyle}>
                                        <input
                                            type="text"
                                            value={item.suggestedLabel}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => updateLabel(idx, e.target.value)}
                                            disabled={!item.selected}
                                            style={inputStyle}
                                            placeholder="Nhãn hiển thị"
                                        />
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: '0.75rem', color: '#94a3b8' }}>
                                        {item.locations.join(', ')}
                                        {item.count > item.locations.length && ` +${item.count - item.locations.length}`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div style={footerStyle}>
                    <button className="btn btn-secondary" onClick={onCancel}>
                        Hủy
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleConfirm}
                        disabled={selectedCount === 0}
                    >
                        ✅ Xác nhận ({selectedCount} trường)
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

const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e2e8f0',
    background: '#f8fafc',
    borderRadius: '0 0 12px 12px',
};
