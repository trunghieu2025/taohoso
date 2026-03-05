// Generate .docx from Word template by filling {tag} placeholders.
// Uses docxtemplater + docx-preview for pixel-perfect Word rendering.
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import { renderAsync } from 'docx-preview';

/* ── Types for duplicate text scanning ── */
export interface ScanResult {
    text: string;        // The repeated text value
    count: number;       // How many times it appears
    locations: string[]; // Where it appears (e.g. "Dòng 3", "Bảng 1, ô 2")
    suggestedTag: string; // Auto-generated tag name
    suggestedLabel: string; // Human-readable label
    selected: boolean;   // Whether user wants this as a placeholder
}

/* ── Common Vietnamese stop words to ignore ── */
const STOP_WORDS = new Set([
    'của', 'và', 'các', 'cho', 'trong', 'với', 'được', 'này', 'theo',
    'về', 'có', 'là', 'từ', 'đến', 'trên', 'tại', 'khi', 'đã',
    'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười',
    'ngày', 'tháng', 'năm', 'nhật', 'thứ',
    'bên', 'ông', 'bà', 'anh', 'chị',
    'cộng', 'hòa', 'xã', 'hội', 'chủ', 'nghĩa', 'việt', 'nam',
    'độc', 'lập', 'tự', 'do', 'hạnh', 'phúc',
    'Đồng', 'đồng', 'VND', 'VNĐ',
]);

/**
 * Scan a raw .docx for duplicate text segments.
 * Returns text values appearing ≥2 times, filtered and sorted by frequency.
 */
export function scanDuplicateTexts(buffer: ArrayBuffer): ScanResult[] {
    const zip = new PizZip(buffer);
    const textSegments: { text: string; location: string }[] = [];

    // Parse document.xml
    const docXml = zip.file('word/document.xml')?.asText();
    if (!docXml) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(docXml, 'application/xml');
    const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    // Extract text from paragraphs
    let paraIdx = 0;
    let tableIdx = 0;
    const body = doc.getElementsByTagNameNS(ns, 'body')[0];
    if (!body) return [];

    for (let i = 0; i < body.childNodes.length; i++) {
        const node = body.childNodes[i] as Element;
        if (!node.tagName) continue;

        if (node.tagName === 'w:p' || node.localName === 'p') {
            paraIdx++;
            const text = getTextFromParagraph(node, ns);
            if (text.trim()) {
                textSegments.push({ text: text.trim(), location: `Dòng ${paraIdx}` });
            }
        } else if (node.tagName === 'w:tbl' || node.localName === 'tbl') {
            tableIdx++;
            // Extract from table rows/cells
            const rows = node.getElementsByTagNameNS(ns, 'tr');
            for (let r = 0; r < rows.length; r++) {
                const cells = rows[r].getElementsByTagNameNS(ns, 'tc');
                for (let c = 0; c < cells.length; c++) {
                    const paras = cells[c].getElementsByTagNameNS(ns, 'p');
                    for (let p = 0; p < paras.length; p++) {
                        const text = getTextFromParagraph(paras[p], ns);
                        if (text.trim()) {
                            textSegments.push({
                                text: text.trim(),
                                location: `Bảng ${tableIdx}, dòng ${r + 1}, cột ${c + 1}`,
                            });
                        }
                    }
                }
            }
        }
    }

    // Count occurrences
    const countMap = new Map<string, { count: number; locations: string[] }>();
    for (const seg of textSegments) {
        const key = seg.text;
        if (!countMap.has(key)) {
            countMap.set(key, { count: 0, locations: [] });
        }
        const entry = countMap.get(key)!;
        entry.count++;
        if (entry.locations.length < 5) { // limit location list
            entry.locations.push(seg.location);
        }
    }

    // Filter: ≥2 occurrences, length ≥3, not stop words, not pure numbers
    const results: ScanResult[] = [];
    for (const [text, info] of countMap) {
        if (info.count < 2) continue;
        if (text.length < 3) continue;
        if (/^\d+[.,]?\d*$/.test(text)) continue; // pure numbers
        if (STOP_WORDS.has(text)) continue;
        if (STOP_WORDS.has(text.toLowerCase())) continue;

        results.push({
            text,
            count: info.count,
            locations: info.locations,
            suggestedTag: textToTag(text),
            suggestedLabel: text.length > 30 ? text.slice(0, 30) + '...' : text,
            selected: info.count >= 2 && text.length >= 4,
        });
    }

    // Sort by count descending, then by text length descending
    results.sort((a, b) => b.count - a.count || b.text.length - a.text.length);
    return results;
}

/** Extract text from a <w:p> element */
function getTextFromParagraph(p: Element, ns: string): string {
    const runs = p.getElementsByTagNameNS(ns, 'r');
    let text = '';
    for (let i = 0; i < runs.length; i++) {
        const tNodes = runs[i].getElementsByTagNameNS(ns, 't');
        for (let j = 0; j < tNodes.length; j++) {
            text += tNodes[j].textContent || '';
        }
    }
    return text;
}

/** Convert a Vietnamese text value to a tag name */
function textToTag(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .toUpperCase()
        .slice(0, 40);
}

/**
 * Replace selected text values with {tag} in the docx XML.
 * Works at the DOM level to handle text split across multiple <w:r><w:t> elements.
 * Returns a new ArrayBuffer with the modified template.
 */
export function createTemplateWithTags(
    buffer: ArrayBuffer,
    replacements: { text: string; tag: string }[],
): ArrayBuffer {
    const zip = new PizZip(buffer);
    const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    // Process all XML parts that may contain text
    const xmlParts = ['word/document.xml', 'word/header1.xml', 'word/header2.xml',
        'word/footer1.xml', 'word/footer2.xml'];

    const parser = new DOMParser();
    const serializer = new XMLSerializer();

    for (const partName of xmlParts) {
        const file = zip.file(partName);
        if (!file) continue;

        const xmlStr = file.asText();
        const doc = parser.parseFromString(xmlStr, 'application/xml');

        // Process all paragraphs (including those inside tables)
        const paragraphs = doc.getElementsByTagNameNS(ns, 'p');
        for (let pi = 0; pi < paragraphs.length; pi++) {
            const p = paragraphs[pi];
            replaceParagraphText(p, ns, replacements);
        }

        zip.file(partName, serializer.serializeToString(doc));
    }

    return zip.generate({ type: 'arraybuffer' });
}

/**
 * In a single <w:p>, consolidate text from all <w:t> elements,
 * do replacements, and write back.
 */
function replaceParagraphText(
    p: Element,
    ns: string,
    replacements: { text: string; tag: string }[],
) {
    // Collect all <w:r> elements that are direct children
    const runs: Element[] = [];
    for (let i = 0; i < p.childNodes.length; i++) {
        const node = p.childNodes[i] as Element;
        if (node.localName === 'r' && node.namespaceURI === ns) {
            runs.push(node);
        }
    }
    if (runs.length === 0) return;

    // Collect all <w:t> elements across all runs, with references
    const tInfos: { run: Element; tElem: Element; text: string }[] = [];
    for (const run of runs) {
        const tElems = run.getElementsByTagNameNS(ns, 't');
        for (let j = 0; j < tElems.length; j++) {
            tInfos.push({
                run,
                tElem: tElems[j],
                text: tElems[j].textContent || '',
            });
        }
    }
    if (tInfos.length === 0) return;

    // Concatenate all text
    const fullText = tInfos.map(t => t.text).join('');

    // Check if any replacement matches
    let newText = fullText;
    let hasMatch = false;
    for (const { text, tag } of replacements) {
        if (newText.includes(text)) {
            // Use split/join for global replace (avoids regex escaping issues)
            newText = newText.split(text).join(`{${tag}}`);
            hasMatch = true;
        }
    }

    if (!hasMatch) return;

    // Write the modified text back:
    // Put all text into the first <w:t>, clear the rest
    tInfos[0].tElem.textContent = newText;
    // Preserve spaces
    tInfos[0].tElem.setAttribute('xml:space', 'preserve');

    for (let i = 1; i < tInfos.length; i++) {
        tInfos[i].tElem.textContent = '';
    }
}


/**
 * Scan a .docx ArrayBuffer for all {tag} placeholders.
 * Returns a deduplicated sorted list of tag names.
 */
export function extractTags(templateBuffer: ArrayBuffer): string[] {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
        nullGetter() { return ''; },
        paragraphLoop: true,
        linebreaks: true,
    });
    const fullText = doc.getFullText();
    const matches = fullText.match(/\{([^}]+)\}/g) || [];
    const tags = matches.map((m: string) => m.slice(1, -1));
    return [...new Set(tags)].sort();
}

/**
 * Fill a template buffer with data using docxtemplater.
 * Returns the filled ArrayBuffer.
 */
export function fillTemplate(templateBuffer: ArrayBuffer, data: Record<string, string>): ArrayBuffer {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
        nullGetter() { return ''; },
        paragraphLoop: true,
        linebreaks: true,
    });
    doc.render(data);
    return doc.getZip().generate({ type: 'arraybuffer' });
}

/**
 * Render a docx into a container element with pixel-perfect Word formatting.
 * Uses docx-preview to render tables, fonts, borders, alignment, etc.
 */
export async function renderDocxPreview(
    templateBuffer: ArrayBuffer,
    data: Record<string, string>,
    container: HTMLElement,
): Promise<void> {
    let filledBuffer: ArrayBuffer;
    try {
        filledBuffer = fillTemplate(templateBuffer, data);
    } catch (err) {
        console.error('[preview] docxtemplater render error:', err);
        filledBuffer = templateBuffer;
    }

    // Clear previous content
    container.innerHTML = '';

    await renderAsync(filledBuffer, container, undefined, {
        className: 'docx-preview',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: true,
        experimental: false,
        trimXmlDeclaration: true,
        debug: false,
    });
}

/**
 * Generate and download a .docx file filled with form data.
 */
export async function generateMilitaryDoc(
    data: Record<string, string>,
    customTemplate?: ArrayBuffer,
): Promise<void> {
    let templateBuffer: ArrayBuffer;

    if (customTemplate) {
        templateBuffer = customTemplate;
    } else {
        const response = await fetch('/templates/template_nha_tap_the.docx');
        if (!response.ok) throw new Error('Không tải được file mẫu Word');
        templateBuffer = await response.arrayBuffer();
    }

    const filledBuffer = fillTemplate(templateBuffer, data);
    const blob = new Blob([filledBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const name = (data['ĐƠN_VỊ'] || 'HoSo').replace(/\s+/g, '_');
    const year = data['NĂM'] || '2025';
    saveAs(blob, `HoSo_${name}_${year}.docx`);
}
