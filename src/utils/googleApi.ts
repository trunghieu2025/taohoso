/**
 * Google API Integration — OAuth 2.0
 * Uses Google Identity Services (GIS) for proper authentication.
 * Customer provides their own OAuth Client ID in Settings.
 */

const CLIENT_ID_KEY = 'taohoso_google_client_id';
let cachedAccessToken: string | null = null;

/* ─── Client ID management ─── */

export function getGoogleClientId(): string {
    return localStorage.getItem(CLIENT_ID_KEY) || '';
}

export function setGoogleClientId(id: string): void {
    localStorage.setItem(CLIENT_ID_KEY, id.trim());
    cachedAccessToken = null; // Reset token when client ID changes
}

export function hasGoogleApiKey(): boolean {
    return !!getGoogleClientId();
}

// Legacy aliases
export function getGoogleApiKey(): string { return getGoogleClientId(); }
export function setGoogleApiKey(key: string): void { setGoogleClientId(key); }

/* ─── Load Google Identity Services ─── */

let gisLoaded = false;

function loadGIS(): Promise<void> {
    if (gisLoaded) return Promise.resolve();
    return new Promise((resolve, reject) => {
        if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
            gisLoaded = true;
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => { gisLoaded = true; resolve(); };
        script.onerror = () => reject(new Error('Không tải được Google Identity Services'));
        document.head.appendChild(script);
    });
}

/* ─── OAuth Token ─── */

async function getAccessToken(): Promise<string> {
    if (cachedAccessToken) return cachedAccessToken;

    const clientId = getGoogleClientId();
    if (!clientId) throw new Error('Chưa có Client ID. Vào Cài đặt để nhập.');

    await loadGIS();

    return new Promise((resolve, reject) => {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',
            callback: (response: any) => {
                if (response.error) {
                    reject(new Error(response.error_description || response.error));
                    return;
                }
                cachedAccessToken = response.access_token;
                // Token expires, clear after 50 minutes
                setTimeout(() => { cachedAccessToken = null; }, 50 * 60 * 1000);
                resolve(response.access_token);
            },
            error_callback: (err: any) => {
                reject(new Error(err?.message || 'Đăng nhập Google thất bại'));
            },
        });
        tokenClient.requestAccessToken();
    });
}

/* ─── Google Drive ─── */

export async function uploadToDrive(
    fileName: string,
    fileBuffer: ArrayBuffer,
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    folderId?: string,
): Promise<{ id: string; webViewLink: string }> {
    const token = await getAccessToken();

    const metadata: Record<string, unknown> = { name: fileName, mimeType };
    if (folderId) metadata.parents = [folderId];

    const boundary = '---taohoso_upload_' + Date.now();
    const body = createMultipartBody(boundary, metadata, fileBuffer, mimeType);

    const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body,
        },
    );

    if (!res.ok) {
        if (res.status === 401) { cachedAccessToken = null; }
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Upload lỗi (${res.status})`);
    }

    return res.json();
}

function createMultipartBody(
    boundary: string,
    metadata: Record<string, unknown>,
    content: ArrayBuffer,
    contentType: string,
): Blob {
    const metaStr = JSON.stringify(metadata);
    const parts = [
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaStr}\r\n`,
        `--${boundary}\r\nContent-Type: ${contentType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`,
    ];
    const bytes = new Uint8Array(content);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);
    return new Blob([parts[0], parts[1], b64, `\r\n--${boundary}--`]);
}

export async function listDriveFiles(
    query = '',
    pageSize = 20,
): Promise<{ id: string; name: string; mimeType: string; modifiedTime: string }[]> {
    const token = await getAccessToken();

    const q = query || "mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document'";
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=${pageSize}&fields=files(id,name,mimeType,modifiedTime)&orderBy=modifiedTime desc`,
        { headers: { 'Authorization': `Bearer ${token}` } },
    );

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Lỗi (${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
}

export async function downloadFromDrive(fileId: string): Promise<ArrayBuffer> {
    const token = await getAccessToken();

    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { 'Authorization': `Bearer ${token}` } },
    );

    if (!res.ok) throw new Error(`Download lỗi (${res.status})`);
    return res.arrayBuffer();
}

/* ─── Google Sheets ─── */

export function exportToCSV(
    data: Record<string, string>,
    fileName = 'data.csv',
): void {
    const headers = Object.keys(data);
    const values = Object.values(data).map(v => `"${v.replace(/"/g, '""')}"`);
    const csv = headers.join(',') + '\n' + values.join(',');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

export function exportMultiToCSV(
    records: Record<string, string>[],
    fileName = 'data.csv',
): void {
    if (records.length === 0) return;

    const headers = [...new Set(records.flatMap(r => Object.keys(r)))];
    const headerRow = headers.join(',');
    const dataRows = records.map(r =>
        headers.map(h => `"${(r[h] || '').replace(/"/g, '""')}"`).join(','),
    );

    const csv = [headerRow, ...dataRows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

export async function updateGoogleSheet(
    spreadsheetId: string,
    range: string,
    values: string[][],
): Promise<void> {
    const token = await getAccessToken();

    const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values }),
        },
    );

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Lỗi Sheets (${res.status})`);
    }
}

export function openSheetsWithData(data: Record<string, string>): void {
    exportToCSV(data, `TaoHoSo_${Date.now()}.csv`);
    setTimeout(() => {
        window.open('https://sheets.google.com/create', '_blank');
    }, 500);
}
