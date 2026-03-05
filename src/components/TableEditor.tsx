/**
 * Inline spreadsheet-like table editor for filling Word table data.
 * Supports: manual input, auto-numbering, auto-calculation, row add/remove,
 * Excel data import, and totals row.
 */
import { useState, useCallback, useRef, ChangeEvent } from 'react';
import type { TableColumn, TableConfig } from '../utils/wordTableUtils';
import { calculateTableData } from '../utils/wordTableUtils';
import { readExcelData } from '../utils/excelTemplateGenerator';

interface Props {
    config: TableConfig;
    data: string[][];
    onChange: (data: string[][]) => void;
}

export default function TableEditor({ config, data, onChange }: Props) {
    const { columns } = config;
    const excelRef = useRef<HTMLInputElement>(null);
    const [showImportHelp, setShowImportHelp] = useState(false);

    const updateCell = useCallback((rowIdx: number, colIdx: number, value: string) => {
        const newData = data.map(r => [...r]);
        newData[rowIdx][colIdx] = value;
        // Recalculate auto columns
        const calculated = calculateTableData(newData, columns);
        onChange(calculated);
    }, [data, columns, onChange]);

    const addRow = () => {
        const emptyRow = columns.map(() => '');
        const newData = [...data, emptyRow];
        onChange(calculateTableData(newData, columns));
    };

    const removeRow = (idx: number) => {
        if (data.length <= 1) return;
        const newData = data.filter((_, i) => i !== idx);
        onChange(calculateTableData(newData, columns));
    };

    const handleImportExcel = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const buf = await file.arrayBuffer();
            const rows = readExcelData(buf);
            if (rows.length === 0) {
                alert('Không tìm thấy dữ liệu trong file Excel.');
                return;
            }
            // Map Excel columns to table columns by header match
            const newData: string[][] = rows.map(() => columns.map(() => ''));
            rows.forEach((excelRow, ri) => {
                const excelHeaders = Object.keys(excelRow);
                columns.forEach((col, ci) => {
                    if (col.type === 'auto_number' || col.type === 'auto_calc') return;
                    // Try to match by header
                    const match = excelHeaders.find(eh =>
                        eh.toLowerCase().includes(col.header.toLowerCase()) ||
                        col.header.toLowerCase().includes(eh.toLowerCase())
                    );
                    if (match) newData[ri][ci] = excelRow[match];
                });
            });
            onChange(calculateTableData(newData, columns));
            alert(`✅ Đã nhập ${rows.length} dòng từ Excel!`);
        } catch (err) {
            alert('❌ Lỗi đọc file: ' + (err as Error).message);
        }
        if (excelRef.current) excelRef.current.value = '';
    };

    // Calculate totals for numeric columns
    const totals = columns.map((col, ci) => {
        if (col.type === 'auto_number') return '';
        const vals = data.map(r => parseNum(r[ci])).filter(v => !isNaN(v) && v > 0);
        if (vals.length === 0) return '';
        return vals.reduce((a, b) => a + b, 0).toLocaleString('vi-VN');
    });

    const hasAnyTotal = totals.some(t => t);

    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex', gap: '0.4rem', padding: '0.4rem 0.6rem',
                background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', alignItems: 'center',
            }}>
                <button className="btn btn-sm" onClick={addRow} style={btnStyle}>➕ Thêm dòng</button>
                <input ref={excelRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImportExcel} />
                <button className="btn btn-sm" onClick={() => excelRef.current?.click()} style={btnStyle}>📊 Nhập từ Excel</button>
                <button className="btn btn-sm" onClick={() => setShowImportHelp(!showImportHelp)} style={{ ...btnStyle, color: '#64748b' }}>❓</button>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 'auto' }}>{data.length} dòng</span>
            </div>

            {showImportHelp && (
                <div style={{ padding: '0.5rem 0.8rem', background: '#eff6ff', fontSize: '0.78rem', color: '#1e40af', borderBottom: '1px solid #bfdbfe' }}>
                    File Excel cần có <strong>hàng 1 = tiêu đề</strong> khớp với tên cột bảng. Hàng 2+ = dữ liệu.
                    Cột tự tính sẽ được tính tự động sau khi nhập.
                </div>
            )}

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                            {columns.map((col, ci) => (
                                <th key={ci} style={{
                                    padding: '0.35rem 0.4rem', borderBottom: '2px solid #e2e8f0',
                                    textAlign: 'left', whiteSpace: 'nowrap', fontSize: '0.78rem',
                                    minWidth: col.type === 'auto_number' ? 40 : 80,
                                }}>
                                    {col.header || `Cột ${ci + 1}`}
                                    {col.type === 'auto_number' && <span style={{ color: '#94a3b8' }}> 🔢</span>}
                                    {col.type === 'auto_calc' && <span style={{ color: '#94a3b8' }}> 🧮</span>}
                                </th>
                            ))}
                            <th style={{ width: 30, borderBottom: '2px solid #e2e8f0' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, ri) => (
                            <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#fafafa' }}>
                                {columns.map((col, ci) => (
                                    <td key={ci} style={{ padding: '0.15rem 0.2rem', borderBottom: '1px solid #f1f5f9' }}>
                                        {col.type === 'auto_number' ? (
                                            <span style={{ padding: '0.15rem 0.3rem', color: '#64748b', fontSize: '0.8rem' }}>{ri + 1}</span>
                                        ) : col.type === 'auto_calc' ? (
                                            <span style={{ padding: '0.15rem 0.3rem', color: '#16a34a', fontWeight: 500, fontSize: '0.8rem' }}>{row[ci]}</span>
                                        ) : (
                                            <input
                                                value={row[ci] || ''}
                                                onChange={e => updateCell(ri, ci, e.target.value)}
                                                style={{
                                                    width: '100%', padding: '0.2rem 0.3rem', border: '1px solid transparent',
                                                    borderRadius: 3, fontSize: '0.8rem', background: 'transparent',
                                                    outline: 'none',
                                                }}
                                                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                                                onBlur={e => e.target.style.borderColor = 'transparent'}
                                            />
                                        )}
                                    </td>
                                ))}
                                <td style={{ padding: '0.1rem', borderBottom: '1px solid #f1f5f9' }}>
                                    {data.length > 1 && (
                                        <button onClick={() => removeRow(ri)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem', padding: '0 0.2rem' }}>✕</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    {hasAnyTotal && (
                        <tfoot>
                            <tr style={{ background: '#fef9c3', fontWeight: 600 }}>
                                {totals.map((t, ci) => (
                                    <td key={ci} style={{ padding: '0.3rem 0.4rem', borderTop: '2px solid #e2e8f0', fontSize: '0.8rem' }}>
                                        {ci === 0 && !t ? 'Tổng' : t}
                                    </td>
                                ))}
                                <td></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}

const btnStyle: React.CSSProperties = { padding: '0.15rem 0.5rem', fontSize: '0.72rem' };

function parseNum(s: string): number {
    if (!s) return NaN;
    return parseFloat(s.replace(/\./g, '').replace(',', '.')) || NaN;
}
