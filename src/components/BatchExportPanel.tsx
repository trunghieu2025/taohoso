/**
 * Batch Export Panel
 * Upload Excel (multiple rows) → generate a Word doc for each row → ZIP download.
 */
import { useState, useRef, ChangeEvent } from 'react';
import JSZip from 'jszip';
import { readExcelData, mapExcelToTags } from '../utils/excelTemplateGenerator';
import { fillTemplate } from '../utils/militaryDocGenerator';

interface Props {
    templateBuffer: ArrayBuffer | null;
    templateTags: string[];
    onClose: () => void;
}

export default function BatchExportPanel({ templateBuffer, templateTags, onClose }: Props) {
    const [rows, setRows] = useState<Record<string, string>[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileRef = useRef<HTMLInputElement>(null);
    const jsonRef = useRef<HTMLInputElement>(null);

    const handleUploadExcel = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const buf = await file.arrayBuffer();
            const data = readExcelData(buf);
            if (data.length === 0) {
                alert('Không tìm thấy dữ liệu trong file Excel.');
                return;
            }
            setRows(data);
        } catch (err) {
            alert('❌ Lỗi đọc file: ' + (err as Error).message);
        }
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleUploadJson = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            const arr = Array.isArray(data) ? data : [data];
            if (arr.length === 0) {
                alert('Không tìm thấy dữ liệu trong file JSON.');
                return;
            }
            setRows(arr.map((obj: Record<string, unknown>) => {
                const row: Record<string, string> = {};
                for (const [k, v] of Object.entries(obj)) {
                    row[k] = String(v ?? '');
                }
                return row;
            }));
        } catch (err) {
            alert('❌ Lỗi đọc JSON: ' + (err as Error).message);
        }
        if (jsonRef.current) jsonRef.current.value = '';
    };

    const handleExportAll = async () => {
        if (!templateBuffer || rows.length === 0) return;
        setProcessing(true);
        setProgress(0);

        const zip = new JSZip();

        for (let i = 0; i < rows.length; i++) {
            const mapped = mapExcelToTags(rows[i], templateTags, {});
            const docName = (mapped['CÔNG_TRÌNH'] || mapped['TEN_CT'] || `Doc_${i + 1}`).replace(/[\\/:*?"<>|]/g, '_');
            const filename = `HoSo_${docName}.docx`;

            // Fill template and get ArrayBuffer
            const filledBuffer = fillTemplate(templateBuffer, mapped);
            zip.file(filename, filledBuffer);

            setProgress(Math.round(((i + 1) / rows.length) * 100));
        }

        // Download ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HoSo_HangLoat_${rows.length}_files.zip`;
        a.click();
        URL.revokeObjectURL(url);

        setProcessing(false);
        alert(`✅ Đã xuất ${rows.length} file trong 1 file ZIP!`);
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
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>📦 Tạo hồ sơ hàng loạt</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                    Upload file Excel hoặc JSON với mỗi dòng/object là 1 công trình → xuất tất cả thành 1 file ZIP.
                </p>

                {/* Upload */}
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleUploadExcel} />
                    <input ref={jsonRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleUploadJson} />
                    <button className="btn btn-sm btn-secondary" onClick={() => fileRef.current?.click()}>
                        📊 Chọn file Excel
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => jsonRef.current?.click()}>
                        📋 Chọn file JSON
                    </button>
                </div>

                {/* Preview */}
                {rows.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            📋 {rows.length} công trình sẽ được xuất:
                        </div>
                        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.82rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                                        <th style={thStyle}>#</th>
                                        {Object.keys(rows[0]).slice(0, 4).map(k => (
                                            <th key={k} style={thStyle}>{k}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, i) => (
                                        <tr key={i}>
                                            <td style={tdStyle}>{i + 1}</td>
                                            {Object.keys(rows[0]).slice(0, 4).map(k => (
                                                <td key={k} style={tdStyle}>{row[k] || '—'}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Progress */}
                {processing && (
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', marginBottom: '0.3rem' }}>⏳ Đang xuất: {progress}%</div>
                        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: '#10b981', transition: 'width 0.2s' }} />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleExportAll}
                        disabled={processing || rows.length === 0}
                    >
                        📦 Xuất tất cả ({rows.length} file)
                    </button>
                </div>
            </div>
        </div>
    );
}

const thStyle: React.CSSProperties = {
    padding: '0.4rem 0.5rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
    padding: '0.3rem 0.5rem', borderBottom: '1px solid #f1f5f9',
};
