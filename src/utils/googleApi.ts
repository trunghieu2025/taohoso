/**
 * Google API Integration Utilities
 * Uses user-provided API key stored in localStorage.
 * Supports: Google Drive (upload/download) and Google Sheets (export)
 */

const STORAGE_KEY = 'taohoso_google_api_key';

export function getGoogleApiKey(): string {
    return localStorage.getItem(STORAGE_KEY) || '';
}

export function setGoogleApiKey(key: string): void {
    localStorage.setItem(STORAGE_KEY, key.trim());
}

export function hasGoogleApiKey(): boolean {
    return !!getGoogleApiKey();
}

/* ─── Google Drive ─── */

/**
 * Upload a file (ArrayBuffer) to Google Drive.
 * Returns the file ID on success.
 */
export async function uploadToDrive(
    fileName: string,
    fileBuffer: ArrayBuffer,
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    folderId?: string,
): Promise<{ id: string; webViewLink: string }> {
    const apiKey = getGoogleApiKey();
    if (!apiKey) throw new Error('Chưa có API key. Vào Cài đặt để nhập.');

    // Create metadata
    const metadata: Record<string, unknown> = {
        name: fileName,
        mimeType,
    };
    if (folderId) {
        metadata.parents = [folderId];
    }

    // Multipart upload
    const boundary = '---taohoso_upload_' + Date.now();
    const body = createMultipartBody(boundary, metadata, fileBuffer, mimeType);

    const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${apiKey}&fields=id,webViewLink`,
        {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body,
        },
    );

    if (!res.ok) {
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
    // Encode ArrayBuffer to base64
    const bytes = new Uint8Array(content);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);
    return new Blob([parts[0], parts[1], b64, `\r\n--${boundary}--`]);
}

/**
 * List files from Google Drive root.
 */
export async function listDriveFiles(
    query = '',
    pageSize = 20,
): Promise<{ id: string; name: string; mimeType: string; modifiedTime: string }[]> {
    const apiKey = getGoogleApiKey();
    if (!apiKey) throw new Error('Chưa có API key.');

    const q = query || "mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document'";
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?key=${apiKey}&q=${encodeURIComponent(q)}&pageSize=${pageSize}&fields=files(id,name,mimeType,modifiedTime)&orderBy=modifiedTime desc`,
    );

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Lỗi (${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
}

/**
 * Download a file from Google Drive.
 */
export async function downloadFromDrive(fileId: string): Promise<ArrayBuffer> {
    const apiKey = getGoogleApiKey();
    if (!apiKey) throw new Error('Chưa có API key.');

    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`,
    );

    if (!res.ok) {
        throw new Error(`Download lỗi (${res.status})`);
    }

    return res.arrayBuffer();
}

/* ─── Google Sheets ─── */

/**
 * Export data to a new Google Sheet.
 * Note: Creating sheets via API key alone requires the sheet to be public.
 * A simpler approach: generate a CSV and let the user import.
 */
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

/**
 * Export multiple records to CSV (for Sheets import).
 */
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

/**
 * Update values in an existing Google Sheet.
 * Requires the spreadsheet ID and range.
 */
export async function updateGoogleSheet(
    spreadsheetId: string,
    range: string,
    values: string[][],
): Promise<void> {
    const apiKey = getGoogleApiKey();
    if (!apiKey) throw new Error('Chưa có API key.');

    const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED&key=${apiKey}`,
        {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ values }),
        },
    );

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Lỗi Sheets (${res.status})`);
    }
}

/**
 * Open Google Sheets import page with pre-generated CSV.
 */
export function openSheetsWithData(data: Record<string, string>): void {
    exportToCSV(data, `TaoHoSo_${Date.now()}.csv`);
    // Open Google Sheets after CSV download
    setTimeout(() => {
        window.open('https://sheets.google.com/create', '_blank');
    }, 500);
}
