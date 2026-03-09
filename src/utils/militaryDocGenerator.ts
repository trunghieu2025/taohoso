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
    category: 'data' | 'boilerplate'; // Smart classification
    dataScore: number;   // 0-100 likelihood of being real project data
    crossFileCount?: number; // How many different files contain this value
    contextLabel?: string; // Label extracted from surrounding context (e.g. "Đại diện")
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
 * Extract ALL text segments from a .docx without filtering.
 * Returns raw segments for cross-file merging before duplicate detection.
 * Used by BundleForm to merge segments from all files first, then filter.
 */
export function extractTextSegments(buffer: ArrayBuffer): {
    segments: { text: string; location: string }[];
    contextLabels: Map<string, string>;
} {
    const zip = new PizZip(buffer);
    const segments: { text: string; location: string }[] = [];
    const contextLabels = new Map<string, string>();

    const docXml = zip.file('word/document.xml')?.asText();
    if (!docXml) return { segments, contextLabels };

    const parser = new DOMParser();
    const doc = parser.parseFromString(docXml, 'application/xml');
    const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    let paraIdx = 0;
    let tableIdx = 0;
    const body = doc.getElementsByTagNameNS(ns, 'body')[0];
    if (!body) return { segments, contextLabels };

    for (let i = 0; i < body.childNodes.length; i++) {
        const node = body.childNodes[i] as Element;
        if (!node.tagName) continue;

        if (node.tagName === 'w:p' || node.localName === 'p') {
            paraIdx++;
            const text = getTextFromParagraph(node, ns);
            if (text.trim()) {
                const loc = `Dòng ${paraIdx}`;
                segments.push({ text: text.trim(), location: loc });
                extractSubSegments(text.trim(), loc, segments, contextLabels);
            }
        } else if (node.tagName === 'w:tbl' || node.localName === 'tbl') {
            tableIdx++;
            const rows = node.getElementsByTagNameNS(ns, 'tr');
            for (let r = 0; r < rows.length; r++) {
                const cells = rows[r].getElementsByTagNameNS(ns, 'tc');
                for (let c = 0; c < cells.length; c++) {
                    const paras = cells[c].getElementsByTagNameNS(ns, 'p');
                    for (let p = 0; p < paras.length; p++) {
                        const text = getTextFromParagraph(paras[p], ns);
                        if (text.trim()) {
                            const loc = `Bảng ${tableIdx}, dòng ${r + 1}, cột ${c + 1}`;
                            segments.push({ text: text.trim(), location: loc });
                            extractSubSegments(text.trim(), loc, segments, contextLabels);
                        }
                    }
                }
            }
        }
    }

    return { segments, contextLabels };
}

/**
 * Scan a raw .docx for duplicate text segments.
 * Returns text values appearing ≥2 times, filtered and sorted by frequency.
 * 
 * Enhanced: Also extracts sub-paragraph segments (split by : ; , tab)
 * to detect values like names, phone numbers, addresses embedded in
 * longer paragraphs.
 */
export function scanDuplicateTexts(buffer: ArrayBuffer): ScanResult[] {
    const { segments: textSegments, contextLabels } = extractTextSegments(buffer);
    if (textSegments.length === 0) return [];

    // Count occurrences
    const countMap = new Map<string, { count: number; locations: string[] }>();
    for (const seg of textSegments) {
        const key = seg.text;
        if (!countMap.has(key)) {
            countMap.set(key, { count: 0, locations: [] });
        }
        const entry = countMap.get(key)!;
        entry.count++;
        if (entry.locations.length < 5) {
            entry.locations.push(seg.location);
        }
    }

    // Filter: ≥2 occurrences, length ≥3, not stop words, not pure numbers
    const results: ScanResult[] = [];
    for (const [text, info] of countMap) {
        if (info.count < 2) continue;
        if (text.length < 3) continue;
        if (/^\d+[.,]?\d*$/.test(text)) continue;
        if (STOP_WORDS.has(text)) continue;
        if (STOP_WORDS.has(text.toLowerCase())) continue;

        const score = computeDataScore(text);
        const category = score >= 50 ? 'data' as const : 'boilerplate' as const;
        const ctxLabel = contextLabels.get(text);

        results.push({
            text,
            count: info.count,
            locations: info.locations,
            suggestedTag: textToTag(text),
            suggestedLabel: text.length > 30 ? text.slice(0, 30) + '...' : text,
            selected: category === 'data' && text.length >= 4,
            category,
            dataScore: score,
            contextLabel: ctxLabel,
        });
    }

    // Sort: data first (by score desc), then boilerplate (by score desc)
    results.sort((a, b) => {
        if (a.category !== b.category) return a.category === 'data' ? -1 : 1;
        return b.dataScore - a.dataScore || b.count - a.count;
    });
    return results;
}

// Export helpers for cross-file scanning in BundleForm
export { computeDataScore, textToTag, STOP_WORDS };

/**
 * Score 0-100 how likely a text value is real project data vs boilerplate.
 * High score = names, phone numbers, addresses, amounts
 * Low score = article titles, legal headings, long standard clauses
 */
function computeDataScore(text: string): number {
    let score = 50; // neutral start

    // ── BONUSES (likely project data) ──

    // Vietnamese name pattern (2-4 capitalized words with diacritics)
    if (/^[A-ZÀ-Ỹ][a-zà-ỹ]+(\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){1,4}$/.test(text)) score += 40;

    // Phone number
    if (/^0\d{2,3}[\s.-]?\d{3,4}[\s.-]?\d{3,4}$/.test(text)) score += 45;

    // Tax ID / long number (10-14 digits)
    if (/^\d{10,14}$/.test(text)) score += 35;

    // Bank account pattern
    if (/^\d{4}[.\s]?\d{4}[.\s]?\d{4,}/.test(text)) score += 35;

    // Contains year pattern (2024, 2025, 2026)
    if (/20\d{2}/.test(text) && text.length < 30) score += 10;

    // Short values (likely specific data, not boilerplate)
    if (text.length <= 25) score += 15;
    if (text.length <= 15) score += 10;

    // Contains "tỉnh", "huyện", "xã", "phường" (address)
    if (/tỉnh|huyện|xã|phường|thành phố|quận|thị trấn/i.test(text) && text.length < 60) score += 20;

    // Company name pattern
    if (/Công ty|TNHH|CP|cổ phần|DNTN/i.test(text) && text.length < 80) score += 25;

    // ── PENALTIES (likely boilerplate) ──

    // Starts with "Điều" + number (article title)
    if (/^Điều\s+\d+/i.test(text)) score -= 50;

    // Starts with numbered section (1., 2., I., II., a), b))
    if (/^(\d+\.|[IVX]+\.|[a-z]\))\s/i.test(text)) score -= 20;

    // Very long text (>60 chars = likely paragraph/clause)
    if (text.length > 60) score -= 25;
    if (text.length > 100) score -= 20;
    if (text.length > 200) score -= 15;

    // Contains legal/standard phrases
    const legalPhrases = [
        'quy định', 'theo quy định', 'căn cứ', 'phù hợp với',
        'tuân thủ', 'chịu trách nhiệm', 'có trách nhiệm', 'cam kết',
        'điều khoản', 'thỏa thuận', 'hợp đồng này', 'hai bên',
        'bên A', 'bên B', 'nghiệm thu', 'bàn giao', 'thanh toán',
        'chất lượng', 'tiến độ', 'bảo hành', 'bảo hiểm',
        'hiệu lực', 'tranh chấp', 'vi phạm', 'phạt vi phạm',
        'luật áp dụng', 'hồ sơ hợp đồng', 'điều kiện',
    ];
    const lower = text.toLowerCase();
    for (const phrase of legalPhrases) {
        if (lower.includes(phrase)) { score -= 10; break; }
    }

    // ALL CAPS text (likely heading)
    if (text === text.toUpperCase() && text.length > 5) score -= 20;

    return Math.max(0, Math.min(100, score));
}

/**
 * Extract meaningful sub-segments from a paragraph text.
 * Also collects context labels (text before ':' becomes the label for text after ':').
 */
function extractSubSegments(
    text: string, location: string,
    out: { text: string; location: string }[],
    contextLabels: Map<string, string>, // text → label mapping
) {
    // Split by colon to get "label: value" pairs
    const colonParts = text.split(/[:：]/);
    for (let i = 1; i < colonParts.length; i++) {
        // Extract the label (text before the colon)
        const rawLabel = colonParts[i - 1].trim();
        // Clean up label: take last meaningful phrase
        const labelWords = rawLabel.split(/[,;.\t]/).pop()?.trim() || rawLabel;
        const cleanLabel = labelWords.replace(/^\d+\.\s*/, '').trim(); // remove numbered prefix

        const val = colonParts[i].trim();
        const subParts = val.split(/[,;\t]/).map(s => s.trim()).filter(s => s.length >= 3);
        for (const sp of subParts) {
            if (sp.length >= 3 && !STOP_WORDS.has(sp) && !STOP_WORDS.has(sp.toLowerCase())) {
                if (!/^\d{1,2}$/.test(sp)) {
                    out.push({ text: sp, location });
                    // Store context label for this value
                    if (cleanLabel.length >= 2 && cleanLabel.length <= 30) {
                        contextLabels.set(sp, cleanLabel);
                    }
                }
            }
        }
        // Full value after colon
        const fullVal = val.split(/\s{3,}|\t/)[0].trim();
        if (fullVal.length >= 3 && fullVal !== val && !STOP_WORDS.has(fullVal)) {
            out.push({ text: fullVal, location });
            if (cleanLabel.length >= 2 && cleanLabel.length <= 30) {
                contextLabels.set(fullVal, cleanLabel);
            }
        }
    }

    // Extract specific patterns via regex
    const patterns: { re: RegExp; label?: string }[] = [
        { re: /(?:Ông|Bà|ông|bà)\s*:?\s*([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){1,4})/g, label: 'Đại diện' },
        { re: /^([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){1,4})$/gm },
        { re: /(0\d{2,3}[\s.-]?\d{3,4}[\s.-]?\d{3,4})/g, label: 'Điện thoại' },
        { re: /(\d{10,13})/g, label: 'Mã số' },
        { re: /(\d{4}[.\s]?\d{4}[.\s]?\d{4,})/g, label: 'Số tài khoản' },
    ];

    for (const { re, label } of patterns) {
        let m;
        while ((m = re.exec(text)) !== null) {
            const val = (m[1] || m[0]).trim();
            if (val.length >= 3 && !STOP_WORDS.has(val) && !STOP_WORDS.has(val.toLowerCase())) {
                out.push({ text: val, location });
                if (label && !contextLabels.has(val)) {
                    contextLabels.set(val, label);
                }
            }
        }
    }

    // Split by tab
    if (text.includes('\t')) {
        const tabParts = text.split('\t').map(s => s.trim()).filter(s => s.length >= 3);
        for (const tp of tabParts) {
            if (!STOP_WORDS.has(tp) && !STOP_WORDS.has(tp.toLowerCase())) {
                out.push({ text: tp, location });
            }
        }
    }
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
