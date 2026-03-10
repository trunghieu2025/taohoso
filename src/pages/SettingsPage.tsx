import { useState, useEffect } from 'react';
import { getGoogleApiKey, setGoogleApiKey, hasGoogleApiKey } from '../utils/googleApi';

export default function SettingsPage() {
    const [apiKey, setApiKeyState] = useState('');
    const [saved, setSaved] = useState(false);
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        setApiKeyState(getGoogleApiKey());
    }, []);

    const handleSave = () => {
        setGoogleApiKey(apiKey);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleClear = () => {
        setGoogleApiKey('');
        setApiKeyState('');
    };

    return (
        <>
            <div className="page-header">
                <div className="container">
                    <h1>⚙️ Cài đặt</h1>
                    <p>Quản lý API key và tùy chỉnh ứng dụng</p>
                </div>
            </div>

            <section className="section">
                <div className="container" style={{ maxWidth: 700 }}>
                    {/* Google API Key */}
                    <div style={{
                        background: '#fff', borderRadius: 12, padding: '1.5rem',
                        border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        marginBottom: '1.5rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>☁️</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Google API Key</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                                    Kết nối Google Drive & Sheets
                                </p>
                            </div>
                            {hasGoogleApiKey() && (
                                <span style={{
                                    marginLeft: 'auto', background: '#dcfce7', color: '#166534',
                                    padding: '0.2rem 0.5rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                                }}>✅ Đã kết nối</span>
                            )}
                        </div>

                        <div style={{ marginBottom: '0.75rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                                API Key
                            </label>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={e => setApiKeyState(e.target.value)}
                                    placeholder="AIzaSy..."
                                    style={{
                                        flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1',
                                        borderRadius: 6, fontSize: '0.9rem', fontFamily: 'monospace',
                                    }}
                                />
                                <button className="btn btn-sm" onClick={() => setShowKey(!showKey)}
                                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}>
                                    {showKey ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button className="btn btn-primary btn-sm" onClick={handleSave}
                                disabled={!apiKey.trim()}>
                                💾 Lưu API Key
                            </button>
                            {apiKey && (
                                <button className="btn btn-sm" onClick={handleClear}
                                    style={{ color: '#ef4444', fontSize: '0.8rem' }}>
                                    🗑️ Xóa
                                </button>
                            )}
                            {saved && (
                                <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 600 }}>
                                    ✅ Đã lưu!
                                </span>
                            )}
                        </div>

                        {/* Guide */}
                        <div style={{
                            marginTop: '1rem', padding: '0.75rem', background: '#f0f9ff',
                            borderRadius: 8, border: '1px solid #bae6fd', fontSize: '0.82rem',
                            lineHeight: 1.6, color: '#0c4a6e',
                        }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>📝 Hướng dẫn lấy API Key:</div>
                            <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                <li>Vào <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer"
                                    style={{ color: '#2563eb', fontWeight: 600 }}>Google Cloud Console</a></li>
                                <li>Tạo project mới (hoặc chọn project có sẵn)</li>
                                <li>Bật <strong>Google Drive API</strong> và <strong>Google Sheets API</strong></li>
                                <li>Tạo <strong>API Key</strong> → Copy và dán vào ô trên</li>
                            </ol>
                            <div style={{ marginTop: '0.4rem', color: '#64748b', fontSize: '0.78rem' }}>
                                ⚠️ API Key lưu trên máy bạn (localStorage), không gửi ra server.
                            </div>
                        </div>
                    </div>

                    {/* App Info */}
                    <div style={{
                        background: '#fff', borderRadius: 12, padding: '1.5rem',
                        border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}>
                        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem' }}>📱 Thông tin ứng dụng</h3>
                        <div style={{ fontSize: '0.85rem', lineHeight: 1.8, color: '#334155' }}>
                            <p>🏷️ <strong>Phiên bản:</strong> 2.7.0</p>
                            <p>📦 <strong>Tính năng:</strong> PWA Offline, Scan Word, Custom Formula, Batch Export, Google Integration</p>
                            <p>🔒 <strong>Bảo mật:</strong> Tất cả dữ liệu lưu trên máy bạn (IndexedDB + localStorage)</p>
                        </div>
                        <button className="btn btn-sm btn-secondary" style={{ marginTop: '0.5rem' }}
                            onClick={() => {
                                if (confirm('Xóa toàn bộ cache và dữ liệu tạm? (Dữ liệu dự án vẫn giữ nguyên)')) {
                                    caches.keys().then(names => names.forEach(n => caches.delete(n)));
                                    alert('✅ Đã xóa cache!');
                                }
                            }}>
                            🗑️ Xóa cache
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
}
