import { useRef, useEffect, useState } from 'react';
import { renderAsync } from 'docx-preview';

interface Props {
    fileBuffer: ArrayBuffer | null;
    fileName: string;
    onClose: () => void;
}

export default function DocxPreview({ fileBuffer, fileName, onClose }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!fileBuffer || !containerRef.current) return;
        setLoading(true);
        setError(null);

        renderAsync(fileBuffer, containerRef.current, undefined, {
            className: 'docx-preview-content',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: true,
            experimental: false,
            trimXmlDeclaration: true,
            useBase64URL: true,
        })
            .then(() => setLoading(false))
            .catch((err) => {
                setError('Không thể hiển thị file: ' + (err as Error).message);
                setLoading(false);
            });
    }, [fileBuffer]);

    const handlePrint = () => {
        const content = containerRef.current?.innerHTML;
        if (!content) return;
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`<!DOCTYPE html>
<html><head><title>${fileName}</title>
<style>
@page { size: A4; margin: 15mm; }
body { font-family: 'Times New Roman', serif; font-size: 12pt; }
.docx-wrapper { background: white !important; padding: 0 !important; }
.docx-wrapper > section { box-shadow: none !important; margin: 0 !important; padding: 15mm !important; }
</style>
</head><body>${content}</body></html>`);
        win.document.close();
        win.onload = () => { win.print(); win.onafterprint = () => win.close(); };
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.6rem 1rem', background: '#1e293b', color: '#fff',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>📄</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{fileName}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={handlePrint} style={btnStyle}>🖨️ In / PDF</button>
                    <button onClick={onClose} style={{ ...btnStyle, background: '#ef4444' }}>✕ Đóng</button>
                </div>
            </div>

            {/* Content */}
            <div style={{
                flex: 1, overflow: 'auto', background: '#e2e8f0',
                display: 'flex', justifyContent: 'center', padding: '1rem',
            }}>
                {loading && (
                    <div style={{ alignSelf: 'center', color: '#64748b', fontSize: '1rem' }}>
                        ⏳ Đang tải file...
                    </div>
                )}
                {error && (
                    <div style={{
                        alignSelf: 'center', color: '#dc2626', fontSize: '0.9rem',
                        background: '#fef2f2', padding: '1rem', borderRadius: 8,
                    }}>
                        ❌ {error}
                    </div>
                )}
                <div
                    ref={containerRef}
                    style={{
                        background: '#fff',
                        maxWidth: 900,
                        width: '100%',
                        minHeight: loading ? 0 : 400,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        borderRadius: 4,
                        display: loading ? 'none' : 'block',
                    }}
                />
            </div>
        </div>
    );
}

const btnStyle: React.CSSProperties = {
    background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6,
    padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
};
