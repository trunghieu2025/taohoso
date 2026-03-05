// Excel template processing: scan duplicates, create templates, preview, export.
// Uses SheetJS (xlsx) for reading/writing Excel files in the browser.
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { ScanResult } from './militaryDocGenerator';

/**
 * Scan an Excel file for duplicate cell values.
 * Returns values appearing ≥2 times across all sheets.
 */
export function scanExcelDuplicates(buffer: ArrayBuffer): ScanResult[] {
    const wb = XLSX.read(buffer, { type: 'array' });

    const cellEntries: { text: string; location: string }[] = [];

    for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        if (!ws) continue;
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

        for (let r = range.s.r; r <= range.e.r; r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
                const addr = XLSX.utils.encode_cell({ r, c });
                const cell = ws[addr];
                if (!cell) continue;

                const text = String(cell.v ?? '').trim();
                if (!text) continue;

                const colLetter = XLSX.utils.encode_col(c);
                const loc = wb.SheetNames.length > 1
                    ? `${sheetName}!${colLetter}${r + 1}`
                    : `${colLetter}${r + 1}`;
                cellEntries.push({ text, location: loc });
            }
        }
    }

    // Count occurrences
    const countMap = new Map<string, { count: number; locations: string[] }>();
    for (const entry of cellEntries) {
        const key = entry.text;
        if (!countMap.has(key)) {
            countMap.set(key, { count: 0, locations: [] });
        }
        const info = countMap.get(key)!;
        info.count++;
        if (info.locations.length < 5) info.locations.push(entry.location);
    }

    // Filter
    const STOP = new Set(['của', 'và', 'các', 'cho', 'trong', 'với', 'được', 'này',
        'theo', 'về', 'có', 'là', 'từ', 'đến', 'trên', 'tại', 'khi', 'đã',
        'Đồng', 'đồng', 'VND', 'VNĐ', 'STT']);

    const results: ScanResult[] = [];
    for (const [text, info] of countMap) {
        if (info.count < 2) continue;
        if (text.length < 3) continue;
        if (/^\d+[.,]?\d*$/.test(text)) continue;
        if (STOP.has(text) || STOP.has(text.toLowerCase())) continue;

        results.push({
            text,
            count: info.count,
            locations: info.locations,
            suggestedTag: textToTag(text),
            suggestedLabel: text.length > 30 ? text.slice(0, 30) + '...' : text,
            selected: info.count >= 2 && text.length >= 4,
        });
    }

    results.sort((a, b) => b.count - a.count || b.text.length - a.text.length);
    return results;
}

/**
 * Extract existing {tag} placeholders from an Excel file.
 */
export function extractExcelTags(buffer: ArrayBuffer): string[] {
    const wb = XLSX.read(buffer, { type: 'array' });
    const tags = new Set<string>();

    for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        if (!ws) continue;
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

        for (let r = range.s.r; r <= range.e.r; r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
                const addr = XLSX.utils.encode_cell({ r, c });
                const cell = ws[addr];
                if (!cell || typeof cell.v !== 'string') continue;

                const matches = String(cell.v).match(/\{([^}]+)\}/g);
                if (matches) {
                    for (const m of matches) tags.add(m.slice(1, -1));
                }
            }
        }
    }

    return [...tags].sort();
}

/**
 * Replace text values with {tag} in the Excel file.
 * Returns a new ArrayBuffer.
 */
export function createExcelTemplate(
    buffer: ArrayBuffer,
    replacements: { text: string; tag: string }[],
): ArrayBuffer {
    const wb = XLSX.read(buffer, { type: 'array' });

    for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        if (!ws) continue;
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

        for (let r = range.s.r; r <= range.e.r; r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
                const addr = XLSX.utils.encode_cell({ r, c });
                const cell = ws[addr];
                if (!cell) continue;

                let val = String(cell.v ?? '');
                let changed = false;
                for (const { text, tag } of replacements) {
                    if (val.includes(text)) {
                        val = val.split(text).join(`{${tag}}`);
                        changed = true;
                    }
                }
                if (changed) {
                    cell.v = val;
                    cell.t = 's'; // force string type
                    if (cell.w) delete cell.w; // remove cached formatted value
                }
            }
        }
    }

    const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    return out as ArrayBuffer;
}

/**
 * Fill an Excel template with data and return HTML preview.
 */
export function renderExcelPreview(
    buffer: ArrayBuffer,
    data: Record<string, string>,
): string {
    // Fill template
    const wb = XLSX.read(buffer, { type: 'array' });

    for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        if (!ws) continue;
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

        for (let r = range.s.r; r <= range.e.r; r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
                const addr = XLSX.utils.encode_cell({ r, c });
                const cell = ws[addr];
                if (!cell || typeof cell.v !== 'string') continue;

                let val = cell.v;
                for (const [tag, value] of Object.entries(data)) {
                    if (val.includes(`{${tag}}`)) {
                        val = val.split(`{${tag}}`).join(value || '');
                    }
                }
                if (val !== cell.v) {
                    cell.v = val;
                    if (cell.w) delete cell.w;
                }
            }
        }
    }

    // Render all sheets to HTML
    const htmlParts: string[] = [];
    for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        if (!ws) continue;

        if (wb.SheetNames.length > 1) {
            htmlParts.push(`<h3 style="margin:1rem 0 0.5rem;color:#334155;font-size:0.95rem">📊 ${sheetName}</h3>`);
        }

        const html = XLSX.utils.sheet_to_html(ws, { editable: false });
        htmlParts.push(html);
    }

    return htmlParts.join('');
}

/**
 * Fill an Excel template with data and download.
 */
export function generateExcelDoc(
    data: Record<string, string>,
    buffer: ArrayBuffer,
): void {
    const wb = XLSX.read(buffer, { type: 'array' });

    for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        if (!ws) continue;
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

        for (let r = range.s.r; r <= range.e.r; r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
                const addr = XLSX.utils.encode_cell({ r, c });
                const cell = ws[addr];
                if (!cell || typeof cell.v !== 'string') continue;

                let val = cell.v;
                let changed = false;
                for (const [tag, value] of Object.entries(data)) {
                    if (val.includes(`{${tag}}`)) {
                        val = val.split(`{${tag}}`).join(value || '');
                        changed = true;
                    }
                }
                if (changed) {
                    cell.v = val;
                    if (cell.w) delete cell.w;
                }
            }
        }
    }

    const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([out], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const name = (data['ĐƠN_VỊ'] || data[Object.keys(data)[0]] || 'HoSo').replace(/\s+/g, '_');
    saveAs(blob, `HoSo_${name}.xlsx`);
}

/** Convert text to tag name (reused from militaryDocGenerator) */
function textToTag(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .toUpperCase()
        .slice(0, 40);
}

/**
 * Read data from an Excel file for form auto-fill.
 * Expects row 1 = headers (labels), row 2+ = data.
 * Returns array of objects mapping header→value for each row.
 */
export function readExcelData(buffer: ArrayBuffer): Record<string, string>[] {
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return [];

    const rows: Record<string, string>[][] = [];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { header: 1, defval: '' });
    if (jsonData.length < 2) return [];

    const headers = (jsonData[0] as unknown as string[]).map(h => String(h).trim());

    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as unknown as string[];
        const obj: Record<string, string> = {};
        let hasData = false;
        headers.forEach((h, idx) => {
            const val = String(row[idx] ?? '').trim();
            if (val) hasData = true;
            obj[h] = val;
        });
        if (hasData) rows.push([obj]);
    }

    return rows.map(r => r[0]);
}

/**
 * Map imported Excel data to form tags.
 * Tries matching by: exact tag name, label text, or normalized text.
 */
export function mapExcelToTags(
    excelRow: Record<string, string>,
    tags: string[],
    labels: Record<string, string>,
): Record<string, string> {
    const result: Record<string, string> = {};
    const reversedLabels: Record<string, string> = {};
    for (const [tag, label] of Object.entries(labels)) {
        reversedLabels[label.toLowerCase()] = tag;
    }

    for (const [header, value] of Object.entries(excelRow)) {
        if (!value) continue;
        const headerLower = header.toLowerCase();
        const headerTag = textToTag(header);

        // Try exact tag match
        if (tags.includes(header)) { result[header] = value; continue; }
        // Try tag from header text
        if (tags.includes(headerTag)) { result[headerTag] = value; continue; }
        // Try label match
        if (reversedLabels[headerLower]) { result[reversedLabels[headerLower]] = value; continue; }
        // Fuzzy: find tag whose label contains header
        for (const [tag, label] of Object.entries(labels)) {
            if (label.toLowerCase().includes(headerLower) || headerLower.includes(label.toLowerCase())) {
                result[tag] = value;
                break;
            }
        }
    }

    return result;
}
