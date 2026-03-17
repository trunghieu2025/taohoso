import { useState, useEffect } from 'react';
import { showToast } from '../components/Toast';
import { getGoogleClientId, setGoogleClientId, hasGoogleApiKey } from '../utils/googleApi';
import { isPinSet, setPin, verifyPin, removePin } from '../components/PinLock';
import { isDesktop } from '../utils/desktopFileHelper';
import { listSessions } from '../utils/templateStorage';
import { listProjects } from '../utils/projectStorage';
import { listContractors } from '../utils/contractorStorage';

export default function SettingsPage() {
    const [apiKey, setApiKeyState] = useState('');
    const [saved, setSaved] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [pinEnabled, setPinEnabled] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [oldPin, setOldPin] = useState('');

    useEffect(() => {
        setApiKeyState(getGoogleClientId());
        setPinEnabled(isPinSet());
    }, []);

    const handleSave = () => {
        setGoogleClientId(apiKey);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleClear = () => {
        setGoogleClientId('');
        setApiKeyState('');
    };

    const handleSetPin = async () => {
        if (newPin.length < 4) { showToast('PIN phải có ít nhất 4 ký tự', 'warning'); return; }
        if (newPin !== confirmPin) { showToast('PIN không khớp', 'warning'); return; }
        if (pinEnabled) {
            const ok = await verifyPin(oldPin);
            if (!ok) { showToast('PIN cũ không đúng', 'error'); return; }
        }
        await setPin(newPin);
        setPinEnabled(true);
        setNewPin(''); setConfirmPin(''); setOldPin('');
        showToast('Đã đặt mã PIN!', 'success');
    };

    const handleRemovePin = async () => {
        const ok = await verifyPin(oldPin);
        if (!ok) { showToast('PIN không đúng', 'error'); return; }
        removePin();
        setPinEnabled(false);
        setOldPin('');
        showToast('Đã gỡ mã PIN', 'success');
    };

    /* ── Backup / Restore ── */
    const [backupBusy, setBackupBusy] = useState(false);

    const handleExportBackup = async () => {
        setBackupBusy(true);
        try {
            const sessions = await listSessions();
            const projects = await listProjects();
            const contractors = await listContractors();
            // Collect localStorage items
            const lsData: Record<string, string> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) lsData[key] = localStorage.getItem(key) || '';
            }
            const backup = {
                version: 1,
                exportedAt: new Date().toISOString(),
                sessions,
                projects,
                contractors,
                localStorage: lsData,
            };
            const jsonStr = JSON.stringify(backup, null, 2);

            if (isDesktop() && window.electronAPI) {
                const result = await window.electronAPI.exportBackup(jsonStr);
                if (result.success) showToast(`Đã sao lưu tại ${result.filePath}`, 'success');
            } else {
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `TaoHoSo_Backup_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('Đã tải file sao lưu!', 'success');
            }
        } catch (err) {
            showToast('Lỗi sao lưu: ' + (err as Error).message, 'error');
        }
        setBackupBusy(false);
    };

    const handleImportBackup = async () => {
        setBackupBusy(true);
        try {
            let jsonStr: string;

            if (isDesktop() && window.electronAPI) {
                const result = await window.electronAPI.importBackup();
                if (!result.success || !result.data) { setBackupBusy(false); return; }
                jsonStr = result.data;
            } else {
                // Web: use file input
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                const file = await new Promise<File | null>((resolve) => {
                    input.onchange = () => resolve(input.files?.[0] || null);
                    input.click();
                });
                if (!file) { setBackupBusy(false); return; }
                jsonStr = await file.text();
            }

            const backup = JSON.parse(jsonStr);
            if (!backup.version || !backup.sessions) {
                showToast('File backup không hợp lệ', 'error');
                setBackupBusy(false);
                return;
            }

            // Restore localStorage
            if (backup.localStorage) {
                for (const [key, value] of Object.entries(backup.localStorage)) {
                    localStorage.setItem(key, value as string);
                }
            }

            // Restore IndexedDB data
            const dbReq = indexedDB.open('TaoHoSoDB', 3);
            dbReq.onsuccess = () => {
                const db = dbReq.result;
                const tx = db.transaction(['sessions', 'projects', 'contractors'], 'readwrite');
                // Clear and restore sessions
                const sessStore = tx.objectStore('sessions');
                sessStore.clear();
                for (const s of backup.sessions || []) { sessStore.put(s); }
                // Clear and restore projects
                const projStore = tx.objectStore('projects');
                projStore.clear();
                for (const p of backup.projects || []) { projStore.put(p); }
                // Clear and restore contractors
                const contStore = tx.objectStore('contractors');
                contStore.clear();
                for (const c of backup.contractors || []) { contStore.put(c); }

                tx.oncomplete = () => {
                    showToast('Khôi phục thành công! Đang tải lại...', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                };
                tx.onerror = () => showToast('Lỗi khôi phục dữ liệu', 'error');
            };
        } catch (err) {
            showToast('Lỗi: ' + (err as Error).message, 'error');
        }
        setBackupBusy(false);
    };

    return (
        <>
            <div className="page-header">
                <div className="container">
                    <h1>⚙️ Cài đặt</h1>
                    <p>Quản lý API key, bảo mật và tùy chỉnh ứng dụng</p>
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
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Google OAuth Client ID</h3>
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
                                Client ID
                            </label>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={e => setApiKeyState(e.target.value)}
                                    placeholder="xxx.apps.googleusercontent.com"
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
                                💾 Lưu Client ID
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

                        <div style={{
                            marginTop: '1rem', padding: '0.75rem', background: '#f0f9ff',
                            borderRadius: 8, border: '1px solid #bae6fd', fontSize: '0.82rem',
                            lineHeight: 1.6, color: '#0c4a6e',
                        }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>📝 Hướng dẫn lấy OAuth Client ID:</div>
                            <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                <li>Vào <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer"
                                    style={{ color: '#2563eb', fontWeight: 600 }}>Google Cloud Console</a></li>
                                <li>Tạo project mới (hoặc chọn project có sẵn)</li>
                                <li>Bật <strong>Google Drive API</strong> và <strong>Google Sheets API</strong></li>
                                <li>Bấm <strong>Create Credentials</strong> → chọn <strong>OAuth client ID</strong></li>
                                <li>Application type: <strong>Web application</strong></li>
                                <li>Authorized JavaScript origins: thêm{' '}
                                    {isDesktop()
                                        ? <><code>http://localhost</code> (bản desktop)</>  
                                        : <code>https://taohoso.vercel.app</code>
                                    }
                                </li>
                                <li>Copy <strong>Client ID</strong> → dán vào ô trên</li>
                            </ol>
                        </div>
                    </div>

                    {/* PIN Lock */}
                    <div style={{
                        background: '#fff', borderRadius: 12, padding: '1.5rem',
                        border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        marginBottom: '1.5rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🔒</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Khóa bảo mật (PIN)</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                                    Đặt PIN để bảo vệ dữ liệu khi mở web
                                </p>
                            </div>
                            <span style={{
                                marginLeft: 'auto', background: pinEnabled ? '#dcfce7' : '#f1f5f9',
                                color: pinEnabled ? '#166534' : '#64748b',
                                padding: '0.2rem 0.5rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                            }}>{pinEnabled ? '🔒 Đang bật' : '🔓 Tắt'}</span>
                        </div>

                        {pinEnabled && (
                            <div style={{ marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>PIN hiện tại</label>
                                <input type="password" value={oldPin} onChange={e => setOldPin(e.target.value)}
                                    placeholder="Nhập PIN cũ..." maxLength={20}
                                    style={{ width: '100%', padding: '0.4rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem', marginBottom: '0.5rem' }} />
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                                    {pinEnabled ? 'PIN mới' : 'Đặt PIN'}
                                </label>
                                <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)}
                                    placeholder="Ít nhất 4 ký tự" maxLength={20}
                                    style={{ width: '100%', padding: '0.4rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Xác nhận PIN</label>
                                <input type="password" value={confirmPin} onChange={e => setConfirmPin(e.target.value)}
                                    placeholder="Nhập lại PIN" maxLength={20}
                                    style={{ width: '100%', padding: '0.4rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-primary btn-sm" onClick={handleSetPin}>
                                {pinEnabled ? '🔄 Đổi PIN' : '🔒 Đặt PIN'}
                            </button>
                            {pinEnabled && (
                                <button className="btn btn-sm" onClick={handleRemovePin}
                                    style={{ color: '#ef4444', fontSize: '0.8rem' }}>
                                    🔓 Gỡ PIN
                                </button>
                            )}
                        </div>
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#fef3c7', borderRadius: 6, fontSize: '0.78rem', color: '#92400e' }}>
                            ⚠️ PIN bảo vệ theo phiên — đóng tab sẽ khóa lại. Nếu quên PIN, xóa dữ liệu trình duyệt để reset.
                        </div>
                    </div>

                    {/* Backup / Restore */}
                    <div style={{
                        background: '#fff', borderRadius: 12, padding: '1.5rem',
                        border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        marginBottom: '1.5rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>💾</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Sao lưu & Khôi phục dữ liệu</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                                    Export/Import toàn bộ hồ sơ, dự án, nhà thầu
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary btn-sm" onClick={handleExportBackup} disabled={backupBusy}>
                                📤 Sao lưu (Export)
                            </button>
                            <button className="btn btn-sm btn-secondary" onClick={handleImportBackup} disabled={backupBusy}>
                                📥 Khôi phục (Import)
                            </button>
                        </div>
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#f0f9ff', borderRadius: 6, fontSize: '0.78rem', color: '#0c4a6e' }}>
                            💡 File backup chứa toàn bộ dữ liệu (hồ sơ, dự án, nhà thầu, cài đặt). Sao lưu thường xuyên để tránh mất dữ liệu.
                        </div>
                    </div>

                    {/* App Info */}
                    <div style={{
                        background: '#fff', borderRadius: 12, padding: '1.5rem',
                        border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}>
                        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem' }}>{isDesktop() ? '🖥️' : '📱'} Thông tin ứng dụng</h3>
                        <div style={{ fontSize: '0.85rem', lineHeight: 1.8, color: '#334155' }}>
                            <p>🏷️ <strong>Phiên bản:</strong> 3.0.0 {isDesktop() && <span style={{ color: '#10b981', fontWeight: 600 }}>(Desktop)</span>}</p>
                            <p>📦 <strong>Tính năng:</strong> {isDesktop() ? 'Native Save, ' : 'PWA Offline, '}Toast, Ctrl+K Search, Print, Excel Report, PIN Lock</p>
                            <p>🔒 <strong>Bảo mật:</strong> Tất cả dữ liệu lưu trên máy bạn (IndexedDB + localStorage)</p>
                            <p>⌨️ <strong>Phím tắt:</strong> Ctrl+K = Tìm kiếm nhanh</p>
                        </div>
                        {!isDesktop() && (
                            <button className="btn btn-sm btn-secondary" style={{ marginTop: '0.5rem' }}
                                onClick={() => {
                                    if (confirm('Xóa toàn bộ cache và dữ liệu tạm?')) {
                                        caches.keys().then(names => names.forEach(n => caches.delete(n)));
                                        showToast('Đã xóa cache!', 'success');
                                    }
                                }}>
                                🗑️ Xóa cache
                            </button>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
