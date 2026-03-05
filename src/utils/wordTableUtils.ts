/**
 * Scan Word documents for tables, extract structure, and fill table cells.
 */
import PizZip from 'pizzip';

export interface TableColumn {
    index: number;
    header: string;
    type: 'manual' | 'auto_number' | 'auto_calc';
    formula?: string; // e.g. "KHOI_LUONG * DON_GIA"
}

export interface TableInfo {
    tableIndex: number;
    headers: string[];
    dataRowCount: number;
    allData: string[][]; // all data rows from table
}

export interface TableConfig {
    tableIndex: number;
    columns: TableColumn[];
}

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function getTextFromCell(cell: Element): string {
    const paras = cell.getElementsByTagNameNS(NS, 'p');
    const texts: string[] = [];
    for (let p = 0; p < paras.length; p++) {
        const runs = paras[p].getElementsByTagNameNS(NS, 'r');
        let paraText = '';
        for (let r = 0; r < runs.length; r++) {
            const tNodes = runs[r].getElementsByTagNameNS(NS, 't');
            for (let t = 0; t < tNodes.length; t++) {
                paraText += tNodes[t].textContent || '';
            }
        }
        texts.push(paraText);
    }
    return texts.join('\n').trim();
}

/**
 * Scan a Word document for tables and return their structure.
 */
export function scanWordTables(buffer: ArrayBuffer): TableInfo[] {
    const zip = new PizZip(buffer);
    const docXml = zip.file('word/document.xml')?.asText();
    if (!docXml) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(docXml, 'application/xml');
    const tables = doc.getElementsByTagNameNS(NS, 'tbl');
    const result: TableInfo[] = [];

    for (let ti = 0; ti < tables.length; ti++) {
        const tbl = tables[ti];
        const rows = tbl.getElementsByTagNameNS(NS, 'tr');
        if (rows.length < 2) continue; // need at least header + 1 data row

        // First row = headers
        const headerCells = rows[0].getElementsByTagNameNS(NS, 'tc');
        const headers: string[] = [];
        for (let c = 0; c < headerCells.length; c++) {
            headers.push(getTextFromCell(headerCells[c]));
        }

        // Data rows
        const dataRows: string[][] = [];
        for (let r = 1; r < rows.length; r++) {
            const cells = rows[r].getElementsByTagNameNS(NS, 'tc');
            const row: string[] = [];
            for (let c = 0; c < cells.length; c++) {
                row.push(getTextFromCell(cells[c]));
            }
            dataRows.push(row);
        }

        result.push({
            tableIndex: ti,
            headers,
            dataRowCount: dataRows.length,
            allData: dataRows,
        });
    }

    return result;
}

/**
 * Fill a Word table with data.
 * Replaces cell contents in the specified table with the provided data.
 */
export function fillWordTable(
    buffer: ArrayBuffer,
    tableIndex: number,
    data: string[][],
): ArrayBuffer {
    const zip = new PizZip(buffer);
    const docXml = zip.file('word/document.xml')?.asText();
    if (!docXml) return buffer;

    const parser = new DOMParser();
    const doc = parser.parseFromString(docXml, 'application/xml');
    const tables = doc.getElementsByTagNameNS(NS, 'tbl');

    if (tableIndex >= tables.length) return buffer;
    const tbl = tables[tableIndex];
    const rows = tbl.getElementsByTagNameNS(NS, 'tr');

    // Skip header row (row 0), fill data rows starting at row 1
    for (let r = 0; r < data.length && r + 1 < rows.length; r++) {
        const cells = rows[r + 1].getElementsByTagNameNS(NS, 'tc');
        for (let c = 0; c < data[r].length && c < cells.length; c++) {
            setCellText(cells[c], data[r][c]);
        }
    }

    const serializer = new XMLSerializer();
    zip.file('word/document.xml', serializer.serializeToString(doc));
    return zip.generate({ type: 'arraybuffer' });
}

/**
 * Set text content of a table cell, preserving formatting of first run.
 */
function setCellText(cell: Element, text: string): void {
    const paras = cell.getElementsByTagNameNS(NS, 'p');
    if (paras.length === 0) return;

    // Use first paragraph, clear others
    const firstPara = paras[0];
    const runs = firstPara.getElementsByTagNameNS(NS, 'r');

    if (runs.length > 0) {
        // Set text in first run's first <w:t>
        const tNodes = runs[0].getElementsByTagNameNS(NS, 't');
        if (tNodes.length > 0) {
            tNodes[0].textContent = text;
            tNodes[0].setAttribute('xml:space', 'preserve');
        }
        // Clear other runs
        for (let i = runs.length - 1; i > 0; i--) {
            runs[i].parentNode?.removeChild(runs[i]);
        }
    }

    // Remove extra paragraphs
    for (let i = paras.length - 1; i > 0; i--) {
        paras[i].parentNode?.removeChild(paras[i]);
    }
}

/**
 * Calculate table data based on column configuration.
 */
export function calculateTableData(
    rawData: string[][],
    columns: TableColumn[],
): string[][] {
    return rawData.map((row, rowIdx) => {
        const result = [...row];
        columns.forEach((col, colIdx) => {
            if (col.type === 'auto_number') {
                result[colIdx] = String(rowIdx + 1);
            } else if (col.type === 'auto_calc' && col.formula) {
                try {
                    const val = evaluateFormula(col.formula, columns, result);
                    result[colIdx] = formatNumber(val);
                } catch { /* ignore calculation errors */ }
            }
        });
        return result;
    });
}

function evaluateFormula(formula: string, columns: TableColumn[], row: string[]): number {
    // Replace column references with values
    let expr = formula;
    columns.forEach((col, idx) => {
        const colRef = col.header
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D')
            .replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        const numVal = parseVietnameseNumber(row[idx]);
        expr = expr.replace(new RegExp(colRef, 'g'), String(numVal));
    });
    // Simple evaluation: only support *, +, -, /
    // eslint-disable-next-line no-eval
    return Function('"use strict"; return (' + expr + ')')() as number;
}

function parseVietnameseNumber(s: string): number {
    if (!s) return 0;
    // Remove dots (thousand sep), replace comma with dot (decimal)
    const cleaned = s.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

function formatNumber(n: number): string {
    if (isNaN(n) || !isFinite(n)) return '';
    // Format with dot thousand separator, comma decimal
    return n.toLocaleString('vi-VN');
}
