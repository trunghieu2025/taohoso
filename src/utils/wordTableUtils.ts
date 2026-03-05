/**
 * Scan Word documents for tables, extract structure, and fill table cells.
 * Handles: merged cells (gridSpan), nested tables, empty cells, multi-row headers.
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
    headerRowCount: number; // number of header rows detected
}

export interface TableConfig {
    tableIndex: number;
    columns: TableColumn[];
}

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/** Get direct child elements by local name (not all descendants) */
function directChildren(parent: Element, localName: string): Element[] {
    const result: Element[] = [];
    for (let i = 0; i < parent.childNodes.length; i++) {
        const node = parent.childNodes[i] as Element;
        if (node.localName === localName && node.namespaceURI === NS) {
            result.push(node);
        }
    }
    return result;
}

/** Get gridSpan value from a table cell (default 1) */
function getGridSpan(cell: Element): number {
    const tcPr = directChildren(cell, 'tcPr')[0];
    if (!tcPr) return 1;
    const gridSpan = directChildren(tcPr, 'gridSpan')[0];
    if (!gridSpan) return 1;
    const val = gridSpan.getAttribute('w:val') || gridSpan.getAttributeNS(NS, 'val');
    return parseInt(val || '1', 10) || 1;
}

/** Check if a cell is a vertically merged continuation */
function isVMergeContinuation(cell: Element): boolean {
    const tcPr = directChildren(cell, 'tcPr')[0];
    if (!tcPr) return false;
    const vMerge = directChildren(tcPr, 'vMerge')[0];
    if (!vMerge) return false;
    // If w:val="restart" it's the start, not continuation
    const val = vMerge.getAttribute('w:val') || vMerge.getAttributeNS(NS, 'val');
    return val !== 'restart';
}

/** Extract ALL text from a cell, including text in nested paragraphs and runs */
function getTextFromCell(cell: Element): string {
    const texts: string[] = [];
    // Walk all descendant <w:t> elements (but skip nested tables)
    walkTextNodes(cell, texts);
    return texts.join('').trim();
}

function walkTextNodes(node: Element, texts: string[]): void {
    for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i] as Element;
        if (!child.localName) continue;
        // Skip nested tables
        if (child.localName === 'tbl' && child.namespaceURI === NS) continue;
        // Collect text from <w:t> elements
        if (child.localName === 't' && child.namespaceURI === NS) {
            texts.push(child.textContent || '');
        } else {
            walkTextNodes(child, texts);
        }
    }
}

/**
 * Expand a row's cells into grid positions, accounting for gridSpan.
 * Returns array of cell references indexed by grid column position.
 */
function expandRowToGrid(row: Element, gridCols: number): (Element | null)[] {
    const cells = directChildren(row, 'tc');
    const grid: (Element | null)[] = new Array(gridCols).fill(null);
    let gridPos = 0;
    for (const cell of cells) {
        const span = getGridSpan(cell);
        if (gridPos < gridCols) {
            grid[gridPos] = cell;
        }
        gridPos += span;
    }
    return grid;
}

/**
 * Detect the number of grid columns in a table by looking at all rows.
 */
function detectGridColumns(rows: Element[]): number {
    let maxCols = 0;
    for (const row of rows) {
        const cells = directChildren(row, 'tc');
        let cols = 0;
        for (const cell of cells) {
            cols += getGridSpan(cell);
        }
        if (cols > maxCols) maxCols = cols;
    }
    return maxCols;
}

/**
 * Detect if a row is likely a header row (contains bold or header-like text).
 */
function isLikelyHeaderRow(row: Element): boolean {
    const cells = directChildren(row, 'tc');
    let boldCount = 0;
    let nonEmptyCount = 0;
    for (const cell of cells) {
        const text = getTextFromCell(cell);
        if (text) nonEmptyCount++;
        // Check if any run in the cell has bold formatting
        const runs = cell.getElementsByTagNameNS(NS, 'r');
        for (let r = 0; r < runs.length; r++) {
            const rPr = directChildren(runs[r] as Element, 'rPr')[0];
            if (rPr) {
                const bold = directChildren(rPr, 'b')[0];
                if (bold) { boldCount++; break; }
            }
        }
    }
    return boldCount > 0 && nonEmptyCount > 0;
}

/**
 * Detect summary rows at the bottom (Tổng cộng, Làm tròn, etc.)
 */
function isSummaryRow(row: Element): boolean {
    const text = getTextFromCell(directChildren(row, 'tc')[0] || row).toLowerCase();
    const summaryKeywords = ['tổng cộng', 'tong cong', 'cộng', 'làm tròn', 'lam tron', 'bằng chữ', 'bang chu'];
    return summaryKeywords.some(kw => text.includes(kw));
}

/**
 * Scan a Word document for tables and return their structure.
 * Handles merged cells and multi-row headers.
 */
export function scanWordTables(buffer: ArrayBuffer): TableInfo[] {
    const zip = new PizZip(buffer);
    const docXml = zip.file('word/document.xml')?.asText();
    if (!docXml) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(docXml, 'application/xml');
    const body = doc.getElementsByTagNameNS(NS, 'body')[0];
    if (!body) return [];

    // Get only top-level tables (not nested)
    const topTables = directChildren(body, 'tbl');
    const result: TableInfo[] = [];

    for (let ti = 0; ti < topTables.length; ti++) {
        const tbl = topTables[ti];
        const rows = directChildren(tbl, 'tr');
        if (rows.length < 2) continue; // need at least header + 1 data row

        const gridCols = detectGridColumns(rows);
        if (gridCols < 2) continue; // skip single-column tables

        // Detect header rows (1 or more)
        let headerRowCount = 1;
        // Check if row 1 is also a header (e.g., sub-headers)
        if (rows.length > 2 && isLikelyHeaderRow(rows[1])) {
            headerRowCount = 2;
        }

        // Build headers from header rows
        const headers: string[] = new Array(gridCols).fill('');
        for (let hr = 0; hr < headerRowCount; hr++) {
            const gridCells = expandRowToGrid(rows[hr], gridCols);
            for (let c = 0; c < gridCols; c++) {
                const cell = gridCells[c];
                if (cell) {
                    const text = getTextFromCell(cell);
                    if (text) {
                        headers[c] = headers[c] ? `${headers[c]}\n${text}` : text;
                    }
                }
            }
        }

        // Clean up multi-line headers
        for (let c = 0; c < headers.length; c++) {
            headers[c] = headers[c].replace(/\n+/g, ' ').trim();
            if (!headers[c]) headers[c] = `Cột ${c + 1}`;
        }

        // Extract data rows (skip header rows and summary rows at bottom)
        const dataRows: string[][] = [];
        for (let r = headerRowCount; r < rows.length; r++) {
            if (isSummaryRow(rows[r])) continue; // skip summary rows
            const gridCells = expandRowToGrid(rows[r], gridCols);
            const row: string[] = new Array(gridCols).fill('');
            for (let c = 0; c < gridCols; c++) {
                const cell = gridCells[c];
                if (cell && !isVMergeContinuation(cell)) {
                    row[c] = getTextFromCell(cell);
                }
            }
            dataRows.push(row);
        }

        if (dataRows.length === 0) continue;

        result.push({
            tableIndex: ti,
            headers,
            dataRowCount: dataRows.length,
            allData: dataRows,
            headerRowCount,
        });
    }

    return result;
}

/**
 * Fill a Word table with data.
 * Replaces cell contents in the specified table with the provided data.
 * Handles merged cells (gridSpan) correctly.
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
    const body = doc.getElementsByTagNameNS(NS, 'body')[0];
    if (!body) return buffer;

    const topTables = directChildren(body, 'tbl');
    if (tableIndex >= topTables.length) return buffer;

    const tbl = topTables[tableIndex];
    const rows = directChildren(tbl, 'tr');
    const gridCols = detectGridColumns(rows);

    // Detect header row count
    let headerRowCount = 1;
    if (rows.length > 2 && isLikelyHeaderRow(rows[1])) {
        headerRowCount = 2;
    }

    // Skip summary rows at bottom
    let dataRowEnd = rows.length;
    for (let r = rows.length - 1; r >= headerRowCount; r--) {
        if (isSummaryRow(rows[r])) {
            dataRowEnd = r;
        } else {
            break;
        }
    }

    // Fill data rows
    for (let dataIdx = 0; dataIdx < data.length; dataIdx++) {
        const rowIdx = headerRowCount + dataIdx;
        if (rowIdx >= dataRowEnd) break;

        const gridCells = expandRowToGrid(rows[rowIdx], gridCols);
        for (let c = 0; c < data[dataIdx].length && c < gridCols; c++) {
            const cell = gridCells[c];
            if (cell && !isVMergeContinuation(cell)) {
                setCellText(cell, data[dataIdx][c]);
            }
        }
    }

    const serializer = new XMLSerializer();
    zip.file('word/document.xml', serializer.serializeToString(doc));
    return zip.generate({ type: 'arraybuffer' });
}

/**
 * Set text content of a table cell, preserving formatting of first run.
 * If the cell has no runs, create new run + text elements.
 */
function setCellText(cell: Element, text: string): void {
    // Find first paragraph (direct child)
    const paras = directChildren(cell, 'p');
    if (paras.length === 0) return;

    const firstPara = paras[0];
    const runs = directChildren(firstPara, 'r');

    if (runs.length > 0) {
        // Find first <w:t> in first run
        const tNodes = runs[0].getElementsByTagNameNS(NS, 't');
        if (tNodes.length > 0) {
            tNodes[0].textContent = text;
            tNodes[0].setAttribute('xml:space', 'preserve');
        } else {
            // Run exists but has no <w:t> — create one
            const doc = cell.ownerDocument;
            const tEl = doc.createElementNS(NS, 'w:t');
            tEl.setAttribute('xml:space', 'preserve');
            tEl.textContent = text;
            runs[0].appendChild(tEl);
        }
        // Clear other runs (keep first for formatting)
        for (let i = runs.length - 1; i > 0; i--) {
            runs[i].parentNode?.removeChild(runs[i]);
        }
    } else {
        // No runs exist (empty cell) — create <w:r><w:t>text</w:t></w:r>
        const doc = cell.ownerDocument;
        const rEl = doc.createElementNS(NS, 'w:r');
        const tEl = doc.createElementNS(NS, 'w:t');
        tEl.setAttribute('xml:space', 'preserve');
        tEl.textContent = text;
        rEl.appendChild(tEl);
        firstPara.appendChild(rEl);
    }

    // Remove extra paragraphs (keep first)
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
        // Ensure result has correct length
        while (result.length < columns.length) result.push('');

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
    let expr = formula;
    columns.forEach((col, idx) => {
        const colRef = col.header
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D')
            .replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        const numVal = parseVietnameseNumber(row[idx]);
        expr = expr.replace(new RegExp(colRef, 'g'), String(numVal));
    });
    return Function('"use strict"; return (' + expr + ')')() as number;
}

function parseVietnameseNumber(s: string): number {
    if (!s) return 0;
    const cleaned = s.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

function formatNumber(n: number): string {
    if (isNaN(n) || !isFinite(n)) return '';
    return n.toLocaleString('vi-VN');
}
