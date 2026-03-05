/**
 * Modal to let users configure table columns after scanning a Word template.
 * User can set each column as: manual input, auto-number, or auto-calculate.
 */
import { useState } from 'react';
import type { TableInfo, TableColumn, TableConfig } from '../utils/wordTableUtils';

interface Props {
    tables: TableInfo[];
    onConfirm: (config: TableConfig) => void;
    onClose: () => void;
}

export default function TableSetupModal({ tables, onConfirm, onClose }: Props) {
    const [selectedTable, setSelectedTable] = useState(0);
    const table = tables[selectedTable];
    const [columns, setColumns] = useState<TableColumn[]>(
        () => table.headers.map((h, i) => ({
            index: i,
            header: h,
            type: guessColumnType(h, i, table.sampleData),
            formula: guessFormula(h, table.headers),
        }))
    );

    const updateColumn = (idx: number, patch: Partial<TableColumn>) => {
        setColumns(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
    };

    const handleTableChange = (ti: number) => {
        setSelectedTable(ti);
        const t = tables[ti];
        setColumns(t.headers.map((h, i) => ({
            index: i,
            header: h,
            type: guessColumnType(h, i, t.sampleData),
            formula: guessFormula(h, t.headers),
        })));
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                background: '#fff', borderRadius: 12, padding: '1.5rem', maxWidth: 700, width: '95%',
                maxHeight: '85vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>📊 Cấu hình bảng dữ liệu</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                    Chọn bảng trong file Word và thiết lập loại cho từng cột.
                </p>

                {tables.length > 1 && (
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Chọn bảng: </label>
                        <select value={selectedTable} onChange={e => handleTableChange(Number(e.target.value))}
                            style={{ padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                            {tables.map((t, i) => (
                                <option key={i} value={i}>
                                    Bảng {i + 1} ({t.headers.length} cột, {t.dataRowCount} dòng)
                                    {t.headers[0] ? ` — ${t.headers.slice(0, 3).join(', ')}...` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    Bảng có {table.headers.length} cột, {table.dataRowCount} dòng dữ liệu
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                            <th style={thStyle}>Cột</th>
                            <th style={thStyle}>Loại</th>
                            <th style={thStyle}>Công thức</th>
                            <th style={thStyle}>Mẫu dữ liệu</th>
                        </tr>
                    </thead>
                    <tbody>
                        {columns.map((col, idx) => (
                            <tr key={idx}>
                                <td style={tdStyle}>
                                    <strong>{col.header || `Cột ${idx + 1}`}</strong>
                                </td>
                                <td style={tdStyle}>
                                    <select value={col.type} onChange={e => updateColumn(idx, { type: e.target.value as TableColumn['type'] })}
                                        style={{ padding: '0.2rem 0.3rem', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: '0.8rem' }}>
                                        <option value="manual">✏️ Nhập tay</option>
                                        <option value="auto_number">🔢 Tự đánh số</option>
                                        <option value="auto_calc">🧮 Tự tính</option>
                                    </select>
                                </td>
                                <td style={tdStyle}>
                                    {col.type === 'auto_calc' && (
                                        <input
                                            value={col.formula || ''}
                                            onChange={e => updateColumn(idx, { formula: e.target.value })}
                                            placeholder="VD: KHOI_LUONG * DON_GIA"
                                            style={{ width: '100%', padding: '0.2rem 0.3rem', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                                        />
                                    )}
                                </td>
                                <td style={{ ...tdStyle, color: '#64748b', fontSize: '0.78rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {table.sampleData[0]?.[idx] || '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
                    <button className="btn btn-primary" onClick={() => onConfirm({ tableIndex: table.tableIndex, columns })}>
                        ✅ Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
}

const thStyle: React.CSSProperties = {
    padding: '0.4rem 0.5rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0',
};
const tdStyle: React.CSSProperties = {
    padding: '0.35rem 0.5rem', borderBottom: '1px solid #f1f5f9',
};

/** Auto-guess column type from header text */
function guessColumnType(header: string, idx: number, sample: string[][]): TableColumn['type'] {
    const h = header.toLowerCase();
    if (h.includes('tt') || h.includes('stt') || h === 'số tt') return 'auto_number';
    if (h.includes('thành tiền') || h.includes('thanh tien') || h.includes('tổng')) return 'auto_calc';
    // Check if first column and sample data looks like sequential numbers
    if (idx === 0 && sample.length > 0) {
        const firstVals = sample.map(r => r[0]).filter(Boolean);
        if (firstVals.every(v => /^\d+$/.test(v.trim()))) return 'auto_number';
    }
    return 'manual';
}

/** Auto-guess formula for auto_calc columns */
function guessFormula(header: string, allHeaders: string[]): string | undefined {
    const h = header.toLowerCase();
    if (h.includes('thành tiền') || h.includes('thanh tien')) {
        // Look for KHOI_LUONG and DON_GIA columns
        const klIdx = allHeaders.findIndex(hh => {
            const l = hh.toLowerCase();
            return l.includes('khối lượng') || l.includes('khoi luong') || l.includes('kl');
        });
        const dgIdx = allHeaders.findIndex(hh => {
            const l = hh.toLowerCase();
            return l.includes('đơn giá') || l.includes('don gia') || l.includes('đg');
        });
        if (klIdx >= 0 && dgIdx >= 0) {
            const klRef = normalizeHeader(allHeaders[klIdx]);
            const dgRef = normalizeHeader(allHeaders[dgIdx]);
            return `${klRef} * ${dgRef}`;
        }
    }
    return undefined;
}

function normalizeHeader(h: string): string {
    return h.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
}
