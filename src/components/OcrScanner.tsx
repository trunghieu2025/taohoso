import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { showToast } from './Toast';

interface OcrScannerProps {
  onExtracted: (text: string) => void;
}

export default function OcrScanner({ onExtracted }: OcrScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file ảnh (JPG, PNG)', 'warning');
      return;
    }

    // Show preview
    const url = URL.createObjectURL(file);
    setPreview(url);
    setScanning(true);
    setProgress(0);
    setResult('');

    try {
      const { data } = await Tesseract.recognize(file, 'vie+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round((m.progress || 0) * 100));
          }
        },
      });

      setResult(data.text);
      showToast('Đã quét xong ảnh!', 'success');
    } catch (err) {
      showToast('Lỗi OCR: ' + (err as Error).message, 'error');
    }
    setScanning(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '1.25rem',
      border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>📸 Scan ảnh → Text (OCR)</h3>
      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
        Chụp ảnh giấy tờ → AI trích xuất text → copy vào form
      </p>

      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        style={{
          border: '2px dashed #cbd5e1', borderRadius: 8, padding: '1.5rem',
          textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s',
          background: '#fafafa', marginBottom: '0.75rem',
        }}
      >
        {preview ? (
          <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6 }} />
        ) : (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>📷</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Bấm để chọn ảnh hoặc kéo thả vào đây
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Hỗ trợ: JPG, PNG (tiếng Việt + Anh)
            </div>
          </div>
        )}
      </div>

      {scanning && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
            <span>🔄 Đang quét...</span>
            <span>{progress}%</span>
          </div>
          <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`, background: '#10b981',
              borderRadius: 3, transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {result && (
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
            Kết quả:
          </label>
          <textarea
            value={result}
            onChange={e => setResult(e.target.value)}
            rows={6}
            style={{
              width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1',
              borderRadius: 6, fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={() => {
              onExtracted(result);
              showToast('Đã gửi text vào form!', 'success');
            }}>
              ✅ Dùng text này
            </button>
            <button className="btn btn-sm" onClick={() => {
              navigator.clipboard.writeText(result);
              showToast('Đã copy!', 'success');
            }}>
              📋 Copy
            </button>
            <button className="btn btn-sm" onClick={() => {
              setResult(''); setPreview('');
              if (fileRef.current) fileRef.current.value = '';
            }} style={{ color: '#ef4444' }}>
              🗑️ Xóa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
