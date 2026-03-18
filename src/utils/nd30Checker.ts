/**
 * ND30 Format Checker — Kiểm tra thể thức văn bản theo Nghị định 30/2020/NĐ-CP
 * 
 * Parses .docx XML and checks 15 formatting rules:
 * page size, margins, font, quốc hiệu, tiêu ngữ, tên cơ quan,
 * số/ký hiệu, địa danh, trích yếu, nội dung, nơi nhận,
 * chữ ký, gạch ngang, header table, line spacing
 */
import PizZip from 'pizzip';

/* ── Types ── */
export type RuleStatus = 'pass' | 'fail' | 'warn' | 'skip';

export interface RuleResult {
    id: string;
    group?: string;
    groupEn?: string;
    name: string;
    nameEn: string;
    status: RuleStatus;
    detail: string;
    detailEn: string;
}

const RULE_GROUP_MAP: Record<string, { group: string; groupEn: string }> = {
    page_size: { group: '📐 Khổ giấy & Lề', groupEn: '📐 Page & Margins' },
    margins: { group: '📐 Khổ giấy & Lề', groupEn: '📐 Page & Margins' },
    font: { group: '🔤 Phông chữ & Cỡ chữ', groupEn: '🔤 Font & Size' },
    noi_dung: { group: '🔤 Phông chữ & Cỡ chữ', groupEn: '🔤 Font & Size' },
    line_spacing: { group: '🔤 Phông chữ & Cỡ chữ', groupEn: '🔤 Font & Size' },
    quoc_hieu: { group: '🏛️ Tiêu đề văn bản', groupEn: '🏛️ Document Header' },
    tieu_ngu: { group: '🏛️ Tiêu đề văn bản', groupEn: '🏛️ Document Header' },
    ten_co_quan: { group: '🏛️ Tiêu đề văn bản', groupEn: '🏛️ Document Header' },
    header_table: { group: '🏛️ Tiêu đề văn bản', groupEn: '🏛️ Document Header' },
    so_ky_hieu: { group: '📝 Nội dung', groupEn: '📝 Content' },
    dia_danh_ngay: { group: '📝 Nội dung', groupEn: '📝 Content' },
    trich_yeu: { group: '📝 Nội dung', groupEn: '📝 Content' },
    justify: { group: '📝 Nội dung', groupEn: '📝 Content' },
    first_indent: { group: '📝 Nội dung', groupEn: '📝 Content' },
    para_spacing: { group: '📝 Nội dung', groupEn: '📝 Content' },
    capitalization: { group: '📝 Nội dung', groupEn: '📝 Content' },
    chu_ky: { group: '✍️ Chữ ký', groupEn: '✍️ Signature' },
    chuc_vu_ky: { group: '✍️ Chữ ký', groupEn: '✍️ Signature' },
    ho_ten_ky: { group: '✍️ Chữ ký', groupEn: '✍️ Signature' },
    ky_dau_label: { group: '✍️ Chữ ký', groupEn: '✍️ Signature' },
    noi_nhan: { group: '📬 Nơi nhận', groupEn: '📬 Recipients' },
    gach_ngang: { group: '📋 Khác', groupEn: '📋 Other' },
    page_number: { group: '📋 Khác', groupEn: '📋 Other' },
    do_khan: { group: '📋 Khác', groupEn: '📋 Other' },
    do_mat: { group: '📋 Khác', groupEn: '📋 Other' },
};

export interface CheckResult {
    score: number;
    total: number;
    results: RuleResult[];
}

export const RULE_GROUPS = [
    { id: 'page', name: '📐 Khổ giấy & Lề', nameEn: '📐 Page & Margins', ref: 'Điều 8' },
    { id: 'font', name: '🔤 Phông chữ & Cỡ chữ', nameEn: '🔤 Font & Size', ref: 'Điều 8' },
    { id: 'header', name: '🏛️ Tiêu đề văn bản', nameEn: '🏛️ Document Header', ref: 'Điều 9' },
    { id: 'body', name: '📝 Nội dung', nameEn: '📝 Content', ref: 'Điều 10-11' },
    { id: 'signature', name: '✍️ Chữ ký', nameEn: '✍️ Signature', ref: 'Điều 12' },
    { id: 'recipient', name: '📬 Nơi nhận', nameEn: '📬 Recipients', ref: 'Điều 13' },
    { id: 'other', name: '📋 Khác', nameEn: '📋 Other', ref: '' },
] as const;


/* ── Helpers ── */
function getXml(zip: PizZip, path: string): string {
    const f = zip.file(path);
    return f ? f.asText() : '';
}

/** Convert twips to cm */
function twipsToCm(tw: number): number {
    return tw / 567;
}

/** Convert half-points to pt */
function halfPtToPt(hp: number): number {
    return hp / 2;
}

/** Convert EMU to cm */
function emuToCm(emu: number): number {
    return emu / 914400 * 2.54;
}

/** Extract all text from an XML element string */
function extractText(xml: string): string {
    const texts: string[] = [];
    const re = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) texts.push(m[1]);
    return texts.join('');
}

/** Get all paragraphs from document body */
function getParagraphs(bodyXml: string): string[] {
    const paras: string[] = [];
    const re = /<w:p[\s>][\s\S]*?<\/w:p>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(bodyXml)) !== null) paras.push(m[0]);
    return paras;
}

/** Get font sizes (in pt) from runs in an element */
function getFontSizes(xml: string): number[] {
    const sizes: number[] = [];
    const re = /<w:sz\s+w:val="(\d+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) sizes.push(halfPtToPt(parseInt(m[1])));
    return sizes;
}

/** Get font names from runs */
function getFontNames(xml: string): string[] {
    const fonts: string[] = [];
    // rFonts ascii or eastAsia or hAnsi
    const re = /<w:rFonts[^>]*w:ascii="([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) fonts.push(m[1]);
    return fonts;
}

/** Check if text contains uppercase Vietnamese */
function isUpperCase(text: string): boolean {
    const cleaned = text.replace(/[^a-zA-ZÀ-ỹ]/g, '');
    if (!cleaned) return true;
    return cleaned === cleaned.toUpperCase();
}

/** Check if paragraph has bold formatting */
function isBold(paraXml: string): boolean {
    return /<w:b\s*\/>|<w:b\s+w:val="true"|<w:b\s+w:val="1"|<w:b>/.test(paraXml);
}

/** Check if paragraph has italic formatting */
function isItalic(paraXml: string): boolean {
    return /<w:i\s*\/>|<w:i\s+w:val="true"|<w:i\s+w:val="1"|<w:i>/.test(paraXml);
}

/** Check if paragraph is centered */
function isCentered(paraXml: string): boolean {
    return /<w:jc\s+w:val="center"/.test(paraXml);
}

/** Get tables from body */
function getTables(bodyXml: string): string[] {
    const tables: string[] = [];
    const re = /<w:tbl>[\s\S]*?<\/w:tbl>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(bodyXml)) !== null) tables.push(m[0]);
    return tables;
}

/** Get rows from a table */
function getTableRows(tableXml: string): string[] {
    const rows: string[] = [];
    const re = /<w:tr[\s>][\s\S]*?<\/w:tr>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(tableXml)) !== null) rows.push(m[0]);
    return rows;
}

/** Get cells from a row */
function getTableCells(rowXml: string): string[] {
    const cells: string[] = [];
    const re = /<w:tc[\s>][\s\S]*?<\/w:tc>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rowXml)) !== null) cells.push(m[0]);
    return cells;
}

/** Check if underline is used (bad practice per ND30) */
function hasUnderline(xml: string): boolean {
    return /<w:u\s+w:val="single"/.test(xml);
}

/** Check if border top is used (good practice per ND30) */
function hasBorderTop(xml: string): boolean {
    return /<w:top\s+w:val="single"/.test(xml) || /<w:bdr[\s\S]*?w:val="single"/.test(xml);
}

/* ── Default font size from styles ── */
function getDefaultFontSize(stylesXml: string): number {
    // Look in docDefaults for default run properties
    const defMatch = /<w:rPrDefault>[\s\S]*?<\/w:rPrDefault>/.exec(stylesXml);
    if (defMatch) {
        const szMatch = /<w:sz\s+w:val="(\d+)"/.exec(defMatch[0]);
        if (szMatch) return halfPtToPt(parseInt(szMatch[1]));
    }
    return 12; // Word default
}

/* ── Main Checker ── */
export async function checkND30(buffer: ArrayBuffer): Promise<CheckResult> {
    const zip = new PizZip(buffer);
    const docXml = getXml(zip, 'word/document.xml');
    const stylesXml = getXml(zip, 'word/styles.xml');
    const defaultFontSize = getDefaultFontSize(stylesXml);

    const results: RuleResult[] = [];

    // Extract body
    const bodyMatch = /<w:body>([\s\S]*)<\/w:body>/.exec(docXml);
    const bodyXml = bodyMatch ? bodyMatch[1] : docXml;
    const paragraphs = getParagraphs(bodyXml);
    const allText = paragraphs.map(p => extractText(p)).filter(t => t.trim());
    const tables = getTables(bodyXml);

    // ────────────────────────────────────────────────
    // RULE 1: Page Size (A4)
    // ────────────────────────────────────────────────
    {
        const pgSzMatch = /<w:pgSz[^>]*w:w="(\d+)"[^>]*w:h="(\d+)"/.exec(docXml) ||
                          /<w:pgSz[^>]*w:h="(\d+)"[^>]*w:w="(\d+)"/.exec(docXml);
        if (pgSzMatch) {
            const w = parseInt(pgSzMatch[1]);
            const h = parseInt(pgSzMatch[2]);
            const wCm = twipsToCm(w);
            const hCm = twipsToCm(h);
            const isA4 = (Math.abs(wCm - 21.0) < 0.5 && Math.abs(hCm - 29.7) < 0.5) ||
                         (Math.abs(hCm - 21.0) < 0.5 && Math.abs(wCm - 29.7) < 0.5);
            results.push({
                id: 'page_size', name: 'Khổ giấy', nameEn: 'Page Size',
                status: isA4 ? 'pass' : 'fail',
                detail: isA4 ? `A4 (${wCm.toFixed(1)} × ${hCm.toFixed(1)} cm)` : `Không phải A4: ${wCm.toFixed(1)} × ${hCm.toFixed(1)} cm`,
                detailEn: isA4 ? `A4 (${wCm.toFixed(1)} × ${hCm.toFixed(1)} cm)` : `Not A4: ${wCm.toFixed(1)} × ${hCm.toFixed(1)} cm`,
            });
        } else {
            results.push({
                id: 'page_size', name: 'Khổ giấy', nameEn: 'Page Size',
                status: 'skip', detail: 'Không tìm thấy thông tin khổ giấy', detailEn: 'Page size info not found',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 2: Margins (Top 2-2.5, Bot 2-2.5, Left 3-3.5, Right 1.5-2)
    // ────────────────────────────────────────────────
    {
        const mgMatch = /<w:pgMar[^>]*/.exec(docXml);
        if (mgMatch) {
            const attr = mgMatch[0];
            const top = twipsToCm(parseInt(attr.match(/w:top="(\d+)"/)?.[1] || '0'));
            const bottom = twipsToCm(parseInt(attr.match(/w:bottom="(\d+)"/)?.[1] || '0'));
            const left = twipsToCm(parseInt(attr.match(/w:left="(\d+)"/)?.[1] || '0'));
            const right = twipsToCm(parseInt(attr.match(/w:right="(\d+)"/)?.[1] || '0'));

            const issues: string[] = [];
            const issuesEn: string[] = [];
            if (top < 1.8 || top > 2.7) { issues.push(`Trên: ${top.toFixed(1)}cm (chuẩn 2-2.5)`); issuesEn.push(`Top: ${top.toFixed(1)}cm (std 2-2.5)`); }
            if (bottom < 1.8 || bottom > 2.7) { issues.push(`Dưới: ${bottom.toFixed(1)}cm (chuẩn 2-2.5)`); issuesEn.push(`Bottom: ${bottom.toFixed(1)}cm (std 2-2.5)`); }
            if (left < 2.8 || left > 3.7) { issues.push(`Trái: ${left.toFixed(1)}cm (chuẩn 3-3.5)`); issuesEn.push(`Left: ${left.toFixed(1)}cm (std 3-3.5)`); }
            if (right < 1.3 || right > 2.2) { issues.push(`Phải: ${right.toFixed(1)}cm (chuẩn 1.5-2)`); issuesEn.push(`Right: ${right.toFixed(1)}cm (std 1.5-2)`); }

            results.push({
                id: 'margins', name: 'Lề trang', nameEn: 'Page Margins',
                status: issues.length === 0 ? 'pass' : 'fail',
                detail: issues.length === 0 ? `T${top.toFixed(1)} D${bottom.toFixed(1)} L${left.toFixed(1)} R${right.toFixed(1)} cm ✓` : issues.join('; '),
                detailEn: issuesEn.length === 0 ? `T${top.toFixed(1)} B${bottom.toFixed(1)} L${left.toFixed(1)} R${right.toFixed(1)} cm ✓` : issuesEn.join('; '),
            });
        } else {
            results.push({
                id: 'margins', name: 'Lề trang', nameEn: 'Page Margins',
                status: 'skip', detail: 'Không tìm thấy', detailEn: 'Not found',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 3: Font — Times New Roman
    // ────────────────────────────────────────────────
    {
        const allFonts = getFontNames(bodyXml);
        // Also check default font in styles
        const defaultFontMatch = /<w:rFonts[^>]*w:ascii="([^"]+)"/.exec(stylesXml);
        const defaultFont = defaultFontMatch?.[1] || '';
        
        const uniqueFonts = [...new Set(allFonts)];
        const tnr = uniqueFonts.filter(f => f.toLowerCase().includes('times'));
        const nonTnr = uniqueFonts.filter(f => !f.toLowerCase().includes('times') && f !== 'Symbol' && f !== 'Wingdings');

        let status: RuleStatus = 'pass';
        let detail = 'Times New Roman ✓';
        let detailEn = 'Times New Roman ✓';

        if (allFonts.length === 0 && defaultFont.toLowerCase().includes('times')) {
            status = 'pass';
        } else if (allFonts.length === 0) {
            status = 'warn';
            detail = `Font mặc định: ${defaultFont || 'không xác định'}`;
            detailEn = `Default font: ${defaultFont || 'unknown'}`;
        } else if (nonTnr.length > 0) {
            status = 'warn';
            detail = `Phát hiện font khác: ${nonTnr.slice(0, 3).join(', ')}`;
            detailEn = `Other fonts detected: ${nonTnr.slice(0, 3).join(', ')}`;
        }

        results.push({
            id: 'font', name: 'Phông chữ', nameEn: 'Font',
            status, detail, detailEn,
        });
    }

    // ────────────────────────────────────────────────
    // RULE 4: Quốc hiệu (CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM)
    // ────────────────────────────────────────────────
    {
        const quocHieuPara = paragraphs.find(p => {
            const text = extractText(p);
            return text.includes('CỘNG') && text.includes('HÒA') && text.includes('VIỆT NAM');
        });
        if (quocHieuPara) {
            const sizes = getFontSizes(quocHieuPara);
            const text = extractText(quocHieuPara);
            const bold = isBold(quocHieuPara);
            const upper = isUpperCase(text);
            const issues: string[] = [];
            const issuesEn: string[] = [];

            const effectiveSize = sizes.length > 0 ? sizes[0] : defaultFontSize;
            if (effectiveSize < 12 || effectiveSize > 14) { 
                issues.push(`Cỡ chữ ${effectiveSize}pt (chuẩn 12-13)`); 
                issuesEn.push(`Size ${effectiveSize}pt (std 12-13)`); 
            }
            if (!bold) { issues.push('Thiếu đậm'); issuesEn.push('Not bold'); }
            if (!upper) { issues.push('Chưa IN HOA'); issuesEn.push('Not uppercase'); }

            results.push({
                id: 'quoc_hieu', name: 'Quốc hiệu', nameEn: 'National Emblem',
                status: issues.length === 0 ? 'pass' : 'fail',
                detail: issues.length === 0 ? `"${text.substring(0, 30)}..." — ${effectiveSize}pt, đậm, IN HOA ✓` : issues.join('; '),
                detailEn: issuesEn.length === 0 ? `"${text.substring(0, 30)}..." — ${effectiveSize}pt, bold, CAPS ✓` : issuesEn.join('; '),
            });
        } else {
            results.push({
                id: 'quoc_hieu', name: 'Quốc hiệu', nameEn: 'National Emblem',
                status: 'fail', detail: 'Không tìm thấy quốc hiệu', detailEn: 'National emblem not found',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 5: Tiêu ngữ (Độc lập - Tự do - Hạnh phúc)
    // ────────────────────────────────────────────────
    {
        const tieuNguPara = paragraphs.find(p => {
            const text = extractText(p);
            return text.includes('Độc lập') || text.includes('ĐỘC LẬP') || 
                   (text.includes('Tự do') && text.includes('Hạnh phúc'));
        });
        if (tieuNguPara) {
            const sizes = getFontSizes(tieuNguPara);
            const bold = isBold(tieuNguPara);
            const effectiveSize = sizes.length > 0 ? sizes[0] : defaultFontSize;
            const issues: string[] = [];
            const issuesEn: string[] = [];

            if (effectiveSize < 13 || effectiveSize > 15) { 
                issues.push(`Cỡ chữ ${effectiveSize}pt (chuẩn 13-14)`); 
                issuesEn.push(`Size ${effectiveSize}pt (std 13-14)`); 
            }
            if (!bold) { issues.push('Thiếu đậm'); issuesEn.push('Not bold'); }

            results.push({
                id: 'tieu_ngu', name: 'Tiêu ngữ', nameEn: 'Motto',
                status: issues.length === 0 ? 'pass' : 'fail',
                detail: issues.length === 0 ? `${effectiveSize}pt, đậm ✓` : issues.join('; '),
                detailEn: issuesEn.length === 0 ? `${effectiveSize}pt, bold ✓` : issuesEn.join('; '),
            });
        } else {
            results.push({
                id: 'tieu_ngu', name: 'Tiêu ngữ', nameEn: 'Motto',
                status: 'fail', detail: 'Không tìm thấy tiêu ngữ', detailEn: 'Motto not found',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 6: Tên cơ quan (uppercase, bold, size 12-13)
    // ────────────────────────────────────────────────
    {
        // Look for uppercase paragraphs in the first 10 paragraphs that could be agency names
        const firstParas = paragraphs.slice(0, 15);
        const agencyParas = firstParas.filter(p => {
            const text = extractText(p).trim();
            return text.length > 3 && text.length < 100 && isUpperCase(text) &&
                   !text.includes('CỘNG HÒA') && !text.includes('VIỆT NAM') &&
                   !text.includes('ĐỘC LẬP') && !text.includes('QUYẾT ĐỊNH') &&
                   !text.includes('Số:');
        });

        if (agencyParas.length > 0) {
            const para = agencyParas[0];
            const sizes = getFontSizes(para);
            const bold = isBold(para);
            const effectiveSize = sizes.length > 0 ? sizes[0] : defaultFontSize;
            const text = extractText(para).trim();
            const issues: string[] = [];
            const issuesEn: string[] = [];

            if (effectiveSize < 12 || effectiveSize > 14) { 
                issues.push(`Cỡ chữ ${effectiveSize}pt (chuẩn 12-13)`); 
                issuesEn.push(`Size ${effectiveSize}pt (std 12-13)`); 
            }
            if (!bold) { issues.push('Thiếu đậm'); issuesEn.push('Not bold'); }

            results.push({
                id: 'ten_co_quan', name: 'Tên cơ quan', nameEn: 'Agency Name',
                status: issues.length === 0 ? 'pass' : 'fail',
                detail: issues.length === 0 ? `"${text.substring(0, 40)}" — ${effectiveSize}pt ✓` : `"${text.substring(0, 30)}" — ${issues.join('; ')}`,
                detailEn: issuesEn.length === 0 ? `"${text.substring(0, 40)}" — ${effectiveSize}pt ✓` : `"${text.substring(0, 30)}" — ${issuesEn.join('; ')}`,
            });
        } else {
            results.push({
                id: 'ten_co_quan', name: 'Tên cơ quan', nameEn: 'Agency Name',
                status: 'warn', detail: 'Không phát hiện tên cơ quan IN HOA', detailEn: 'Uppercase agency name not detected',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 7: Số/ký hiệu (size 13)
    // ────────────────────────────────────────────────
    {
        const soKhPara = paragraphs.find(p => {
            const text = extractText(p);
            return /Số[:\s]*\d+/.test(text) || /số[:\s]*\d+/.test(text);
        });
        if (soKhPara) {
            const sizes = getFontSizes(soKhPara);
            const effectiveSize = sizes.length > 0 ? sizes[0] : defaultFontSize;
            const text = extractText(soKhPara).trim();

            results.push({
                id: 'so_ky_hieu', name: 'Số, ký hiệu', nameEn: 'Document Number',
                status: (effectiveSize >= 12 && effectiveSize <= 14) ? 'pass' : 'fail',
                detail: `"${text.substring(0, 40)}" — ${effectiveSize}pt`,
                detailEn: `"${text.substring(0, 40)}" — ${effectiveSize}pt`,
            });
        } else {
            results.push({
                id: 'so_ky_hieu', name: 'Số, ký hiệu', nameEn: 'Document Number',
                status: 'warn', detail: 'Không tìm thấy số/ký hiệu', detailEn: 'Document number not found',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 8: Địa danh + ngày tháng (italic, size 13-14)
    // ────────────────────────────────────────────────
    {
        const datePara = paragraphs.find(p => {
            const text = extractText(p);
            return /ngày\s+\d+\s+tháng\s+\d+\s+năm\s+\d+/i.test(text);
        });
        if (datePara) {
            const sizes = getFontSizes(datePara);
            const italic = isItalic(datePara);
            const effectiveSize = sizes.length > 0 ? sizes[0] : defaultFontSize;
            const issues: string[] = [];
            const issuesEn: string[] = [];

            if (effectiveSize < 13 || effectiveSize > 15) { 
                issues.push(`Cỡ chữ ${effectiveSize}pt (chuẩn 13-14)`); 
                issuesEn.push(`Size ${effectiveSize}pt (std 13-14)`); 
            }
            if (!italic) { issues.push('Thiếu nghiêng'); issuesEn.push('Not italic'); }

            results.push({
                id: 'dia_danh_ngay', name: 'Địa danh, ngày tháng', nameEn: 'Location & Date',
                status: issues.length === 0 ? 'pass' : 'fail',
                detail: issues.length === 0 ? `${effectiveSize}pt, nghiêng ✓` : issues.join('; '),
                detailEn: issuesEn.length === 0 ? `${effectiveSize}pt, italic ✓` : issuesEn.join('; '),
            });
        } else {
            results.push({
                id: 'dia_danh_ngay', name: 'Địa danh, ngày tháng', nameEn: 'Location & Date',
                status: 'warn', detail: 'Không tìm thấy địa danh/ngày', detailEn: 'Location/date not found',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 9: Trích yếu / V/v (size 12-14)
    // ────────────────────────────────────────────────
    {
        const trichYeuPara = paragraphs.find(p => {
            const text = extractText(p);
            return /V\/v[:\s]/i.test(text) || /Về việc/i.test(text);
        });
        // Also check for document title (QUYẾT ĐỊNH, THÔNG BÁO, etc.)
        const titlePara = paragraphs.find(p => {
            const text = extractText(p).trim();
            return /^(QUYẾT ĐỊNH|THÔNG BÁO|BÁO CÁO|KẾ HOẠCH|BIÊN BẢN|NGHỊ QUYẾT)$/i.test(text);
        });

        const target = trichYeuPara || titlePara;
        if (target) {
            const sizes = getFontSizes(target);
            const effectiveSize = sizes.length > 0 ? sizes[0] : defaultFontSize;
            const text = extractText(target).trim();
            const bold = isBold(target);

            const issues: string[] = [];
            const issuesEn: string[] = [];
            if (effectiveSize < 12 || effectiveSize > 15) { 
                issues.push(`Cỡ chữ ${effectiveSize}pt`); 
                issuesEn.push(`Size ${effectiveSize}pt`); 
            }
            if (titlePara && !bold) { issues.push('Tiêu đề cần đậm'); issuesEn.push('Title should be bold'); }

            results.push({
                id: 'trich_yeu', name: 'Trích yếu / Tên loại', nameEn: 'Summary / Title',
                status: issues.length === 0 ? 'pass' : 'fail',
                detail: issues.length === 0 ? `"${text.substring(0, 50)}" — ${effectiveSize}pt ✓` : issues.join('; '),
                detailEn: issuesEn.length === 0 ? `"${text.substring(0, 50)}" — ${effectiveSize}pt ✓` : issuesEn.join('; '),
            });
        } else {
            results.push({
                id: 'trich_yeu', name: 'Trích yếu / Tên loại', nameEn: 'Summary / Title',
                status: 'warn', detail: 'Không tìm thấy trích yếu hoặc tên loại', detailEn: 'Summary or title not found',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 10: Nội dung (size 13-14)
    // ────────────────────────────────────────────────
    {
        // Look at body paragraphs (skip header area ~first 10 and last 10)
        const bodyParas = paragraphs.length > 20 ? paragraphs.slice(10, -10) : paragraphs.slice(5);
        const bodySizes: number[] = [];
        for (const p of bodyParas) {
            const text = extractText(p).trim();
            if (text.length < 20) continue; // skip short lines
            const sizes = getFontSizes(p);
            if (sizes.length > 0) bodySizes.push(...sizes);
        }

        if (bodySizes.length > 0) {
            const avgSize = bodySizes.reduce((a, b) => a + b, 0) / bodySizes.length;
            const outOfRange = bodySizes.filter(s => s < 13 || s > 14).length;
            const pct = ((bodySizes.length - outOfRange) / bodySizes.length * 100).toFixed(0);

            results.push({
                id: 'noi_dung', name: 'Cỡ chữ nội dung', nameEn: 'Body Font Size',
                status: outOfRange / bodySizes.length < 0.3 ? 'pass' : 'fail',
                detail: `Trung bình ${avgSize.toFixed(1)}pt — ${pct}% trong khoảng 13-14pt`,
                detailEn: `Average ${avgSize.toFixed(1)}pt — ${pct}% within 13-14pt range`,
            });
        } else {
            results.push({
                id: 'noi_dung', name: 'Cỡ chữ nội dung', nameEn: 'Body Font Size',
                status: 'warn', detail: `Font mặc định: ${defaultFontSize}pt`, detailEn: `Default: ${defaultFontSize}pt`,
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 11: Nơi nhận (label: bold+italic size 12, items: size 11)
    // ────────────────────────────────────────────────
    {
        const noiNhanIdx = paragraphs.findIndex(p => {
            const text = extractText(p);
            return /Nơi nhận/i.test(text);
        });
        if (noiNhanIdx >= 0) {
            const labelPara = paragraphs[noiNhanIdx];
            const bold = isBold(labelPara);
            const italic = isItalic(labelPara);
            const sizes = getFontSizes(labelPara);
            const effectiveSize = sizes.length > 0 ? sizes[0] : defaultFontSize;
            const issues: string[] = [];
            const issuesEn: string[] = [];

            if (!bold) { issues.push('Label thiếu đậm'); issuesEn.push('Label not bold'); }
            if (!italic) { issues.push('Label thiếu nghiêng'); issuesEn.push('Label not italic'); }
            if (effectiveSize > 13) { issues.push(`Label cỡ ${effectiveSize}pt (chuẩn 12)`); issuesEn.push(`Label ${effectiveSize}pt (std 12)`); }

            results.push({
                id: 'noi_nhan', name: 'Nơi nhận', nameEn: 'Recipients',
                status: issues.length === 0 ? 'pass' : 'fail',
                detail: issues.length === 0 ? `${effectiveSize}pt, đậm+nghiêng ✓` : issues.join('; '),
                detailEn: issuesEn.length === 0 ? `${effectiveSize}pt, bold+italic ✓` : issuesEn.join('; '),
            });
        } else {
            results.push({
                id: 'noi_nhan', name: 'Nơi nhận', nameEn: 'Recipients',
                status: 'warn', detail: 'Không tìm thấy phần "Nơi nhận"', detailEn: '"Recipients" section not found',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 12: Khối chữ ký (authority label: uppercase, bold, size 13)
    // ────────────────────────────────────────────────
    {
        const sigPara = paragraphs.find(p => {
            const text = extractText(p);
            return /^(TM\.|KT\.|TL\.|TUQ\.)/.test(text.trim()) ||
                   /BỘ TRƯỞNG|GIÁM ĐỐC|CHỦ TỊCH|TRƯỞNG PHÒNG|CỤC TRƯỞNG|VỤ TRƯỞNG/.test(text);
        });
        const signNamePara = paragraphs.find(p => {
            const text = extractText(p);
            return /\(Ký/.test(text) || /ghi rõ họ tên/.test(text);
        });

        if (sigPara) {
            const sizes = getFontSizes(sigPara);
            const bold = isBold(sigPara);
            const effectiveSize = sizes.length > 0 ? sizes[0] : defaultFontSize;
            const text = extractText(sigPara).trim();
            const issues: string[] = [];
            const issuesEn: string[] = [];

            if (!bold) { issues.push('Thiếu đậm'); issuesEn.push('Not bold'); }
            if (effectiveSize < 12 || effectiveSize > 15) { 
                issues.push(`Cỡ ${effectiveSize}pt (chuẩn 13-14)`); 
                issuesEn.push(`Size ${effectiveSize}pt (std 13-14)`); 
            }

            results.push({
                id: 'chu_ky', name: 'Khối chữ ký', nameEn: 'Signature Block',
                status: issues.length === 0 ? 'pass' : 'fail',
                detail: issues.length === 0 ? `"${text.substring(0, 40)}" — ${effectiveSize}pt ✓` : issues.join('; '),
                detailEn: issuesEn.length === 0 ? `"${text.substring(0, 40)}" — ${effectiveSize}pt ✓` : issuesEn.join('; '),
            });
        } else {
            results.push({
                id: 'chu_ky', name: 'Khối chữ ký', nameEn: 'Signature Block',
                status: 'warn', detail: 'Không phát hiện khối chữ ký', detailEn: 'Signature block not detected',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 13: Gạch ngang (should use Border Top, not Underline)
    // ────────────────────────────────────────────────
    {
        const underlineCount = (bodyXml.match(/<w:u\s+w:val="single"/g) || []).length;
        const borderTopCount = (bodyXml.match(/<w:top\s+w:val="single"/g) || []).length;

        let status: RuleStatus = 'pass';
        let detail = '';
        let detailEn = '';
        if (underlineCount > 0 && borderTopCount === 0) {
            status = 'warn';
            detail = `Dùng Underline (${underlineCount} chỗ)  — nên dùng Border Top`;
            detailEn = `Uses Underline (${underlineCount} instances) — should use Border Top`;
        } else if (borderTopCount > 0) {
            detail = `Border Top: ${borderTopCount} chỗ ✓`;
            detailEn = `Border Top: ${borderTopCount} instances ✓`;
        } else {
            detail = 'Không có gạch ngang';
            detailEn = 'No horizontal lines detected';
        }

        results.push({
            id: 'gach_ngang', name: 'Gạch ngang', nameEn: 'Horizontal Lines',
            status, detail, detailEn,
        });
    }

    // ────────────────────────────────────────────────
    // RULE 14: Header table (2 columns, hidden borders)
    // ────────────────────────────────────────────────
    {
        if (tables.length > 0) {
            const headerTable = tables[0]; // First table is typically header
            const rows = getTableRows(headerTable);
            const firstRowCells = rows.length > 0 ? getTableCells(rows[0]) : [];

            const is2Col = firstRowCells.length === 2;
            // Check hidden borders (border "none" or "nil")
            const hiddenBorder = /w:val="none"|w:val="nil"|w:sz="0"/.test(headerTable);

            const issues: string[] = [];
            const issuesEn: string[] = [];
            if (!is2Col) { issues.push(`${firstRowCells.length} cột (chuẩn 2)`); issuesEn.push(`${firstRowCells.length} cols (std 2)`); }
            if (!hiddenBorder) { issues.push('Viền có thể không ẩn'); issuesEn.push('Borders may not be hidden'); }

            results.push({
                id: 'header_table', name: 'Bảng header', nameEn: 'Header Table',
                status: issues.length === 0 ? 'pass' : is2Col ? 'warn' : 'fail',
                detail: issues.length === 0 ? `2 cột, ${rows.length} dòng, viền ẩn ✓` : issues.join('; '),
                detailEn: issuesEn.length === 0 ? `2 cols, ${rows.length} rows, hidden borders ✓` : issuesEn.join('; '),
            });
        } else {
            results.push({
                id: 'header_table', name: 'Bảng header', nameEn: 'Header Table',
                status: 'warn', detail: 'Không tìm thấy bảng header', detailEn: 'Header table not found',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 15: Line spacing (body ≥ 1.0)
    // ────────────────────────────────────────────────
    {
        const spacingMatches = bodyXml.match(/<w:spacing[^>]*w:line="(\d+)"/g) || [];
        const lineValues: number[] = [];
        for (const s of spacingMatches) {
            const m = /w:line="(\d+)"/.exec(s);
            if (m) lineValues.push(parseInt(m[1]));
        }

        if (lineValues.length > 0) {
            const avgLine = lineValues.reduce((a, b) => a + b, 0) / lineValues.length;
            // 240 twips = single spacing, 360 = 1.5, 480 = double
            const singleSpacing = avgLine >= 220;

            results.push({
                id: 'line_spacing', name: 'Giãn dòng', nameEn: 'Line Spacing',
                status: singleSpacing ? 'pass' : 'fail',
                detail: `Trung bình: ${(avgLine / 240).toFixed(1)} lines (${avgLine} twips)`,
                detailEn: `Average: ${(avgLine / 240).toFixed(1)} lines (${avgLine} twips)`,
            });
        } else {
            results.push({
                id: 'line_spacing', name: 'Giãn dòng', nameEn: 'Line Spacing',
                status: 'pass', detail: 'Mặc định (single)', detailEn: 'Default (single)',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 16: Căn lề nội dung (Justify)
    // ────────────────────────────────────────────────
    {
        const bodyParas = paragraphs.length > 20 ? paragraphs.slice(10, -10) : paragraphs.slice(5);
        let justifyCount = 0;
        let totalBodyParas = 0;
        for (const p of bodyParas) {
            const text = extractText(p).trim();
            if (text.length < 20) continue;
            totalBodyParas++;
            if (/w:jc\s+w:val="both"/.test(p) || /w:jc\s+w:val="distribute"/.test(p)) {
                justifyCount++;
            }
        }

        if (totalBodyParas > 0) {
            const pct = Math.round(justifyCount / totalBodyParas * 100);
            results.push({
                id: 'justify', name: 'Căn lề 2 bên', nameEn: 'Justify Alignment',
                status: pct >= 70 ? 'pass' : pct >= 40 ? 'warn' : 'fail',
                detail: `${pct}% đoạn văn căn đều (${justifyCount}/${totalBodyParas})`,
                detailEn: `${pct}% paragraphs justified (${justifyCount}/${totalBodyParas})`,
            });
        } else {
            results.push({
                id: 'justify', name: 'Căn lề 2 bên', nameEn: 'Justify Alignment',
                status: 'skip', detail: 'Không đủ đoạn văn để kiểm tra', detailEn: 'Not enough paragraphs to check',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 17: Thụt đầu dòng (First-line indent ~1-1.27cm)
    // ────────────────────────────────────────────────
    {
        const bodyParas = paragraphs.length > 20 ? paragraphs.slice(10, -10) : paragraphs.slice(5);
        let indentCount = 0;
        let totalBodyParas = 0;
        for (const p of bodyParas) {
            const text = extractText(p).trim();
            if (text.length < 30) continue;
            totalBodyParas++;
            const indMatch = /w:firstLine="(\d+)"/.exec(p);
            if (indMatch) {
                const indCm = twipsToCm(parseInt(indMatch[1]));
                if (indCm >= 0.8 && indCm <= 1.5) indentCount++;
            }
        }

        if (totalBodyParas > 0) {
            const pct = Math.round(indentCount / totalBodyParas * 100);
            results.push({
                id: 'first_indent', name: 'Thụt đầu dòng', nameEn: 'First-line Indent',
                status: pct >= 50 ? 'pass' : pct >= 20 ? 'warn' : 'fail',
                detail: `${pct}% đoạn có thụt 1-1.27cm (${indentCount}/${totalBodyParas})`,
                detailEn: `${pct}% paragraphs with 1-1.27cm indent (${indentCount}/${totalBodyParas})`,
            });
        } else {
            results.push({
                id: 'first_indent', name: 'Thụt đầu dòng', nameEn: 'First-line Indent',
                status: 'skip', detail: 'Không đủ đoạn văn', detailEn: 'Not enough paragraphs',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 18: Đánh số trang
    // ────────────────────────────────────────────────
    {
        const headerXml = getXml(zip, 'word/header1.xml') || getXml(zip, 'word/header2.xml') || getXml(zip, 'word/header3.xml');
        const footerXml = getXml(zip, 'word/footer1.xml') || getXml(zip, 'word/footer2.xml') || getXml(zip, 'word/footer3.xml');
        const hasPageNum = /w:fldChar.*PAGE|PAGE\s*\\/.test(headerXml) || /w:fldChar.*PAGE|PAGE\s*\\/.test(footerXml) ||
                          /NUMPAGES|PAGE/.test(headerXml) || /NUMPAGES|PAGE/.test(footerXml) ||
                          /w:pgNum/.test(headerXml) || /w:pgNum/.test(footerXml);
        
        // Also check in doc body for inline page numbers
        const hasInlinePageNum = /w:pgNum/.test(docXml) || /PAGE\s*\\/.test(docXml);

        results.push({
            id: 'page_number', name: 'Đánh số trang', nameEn: 'Page Numbering',
            status: (hasPageNum || hasInlinePageNum) ? 'pass' : 'warn',
            detail: (hasPageNum || hasInlinePageNum) ? 'Có đánh số trang ✓' : 'Không phát hiện số trang (cần từ trang 2)',
            detailEn: (hasPageNum || hasInlinePageNum) ? 'Page numbering found ✓' : 'Page numbering not detected (required from page 2)',
        });
    }

    // ────────────────────────────────────────────────
    // RULE 19: Chức vụ người ký (bold, uppercase, 13-14pt)
    // ────────────────────────────────────────────────
    {
        const sigIdx = paragraphs.findIndex(p => {
            const text = extractText(p);
            return /^(TM\.|KT\.|TL\.|TUQ\.)/.test(text.trim()) ||
                   /BỘ TRƯỞNG|GIÁM ĐỐC|CHỦ TỊCH|TRƯỞNG PHÒNG|CỤC TRƯỞNG|VỤ TRƯỞNG|PHÓ GIÁM ĐỐC/.test(text);
        });
        if (sigIdx >= 0) {
            // Look for position title below the authority line
            const positionParas = paragraphs.slice(sigIdx, Math.min(sigIdx + 4, paragraphs.length));
            const posPara = positionParas.find(p => {
                const text = extractText(p).trim();
                return text.length > 3 && (
                    /GIÁM ĐỐC|PHÓ GIÁM ĐỐC|CHỦ TỊCH|TRƯỞNG PHÒNG|CỤC TRƯỞNG|VỤ TRƯỞNG|BỘ TRƯỞNG/.test(text)
                );
            });
            if (posPara) {
                const bold = isBold(posPara);
                const upper = isUpperCase(extractText(posPara).trim());
                const sizes = getFontSizes(posPara);
                const effectiveSize = sizes.length > 0 ? sizes[0] : defaultFontSize;
                const issues: string[] = [];
                const issuesEn: string[] = [];
                if (!bold) { issues.push('Thiếu đậm'); issuesEn.push('Not bold'); }
                if (!upper) { issues.push('Chưa IN HOA'); issuesEn.push('Not uppercase'); }
                if (effectiveSize < 13 || effectiveSize > 15) { issues.push(`Cỡ ${effectiveSize}pt (chuẩn 13-14)`); issuesEn.push(`Size ${effectiveSize}pt (std 13-14)`); }
                results.push({
                    id: 'chuc_vu_ky', name: 'Chức vụ người ký', nameEn: 'Signer Position',
                    status: issues.length === 0 ? 'pass' : 'fail',
                    detail: issues.length === 0 ? `"${extractText(posPara).trim().substring(0, 40)}" — ${effectiveSize}pt, đậm ✓` : issues.join('; '),
                    detailEn: issuesEn.length === 0 ? `"${extractText(posPara).trim().substring(0, 40)}" — ${effectiveSize}pt, bold ✓` : issuesEn.join('; '),
                });
            } else {
                results.push({
                    id: 'chuc_vu_ky', name: 'Chức vụ người ký', nameEn: 'Signer Position',
                    status: 'warn', detail: 'Không tách rõ chức vụ người ký', detailEn: 'Signer position not clearly identified',
                });
            }
        } else {
            results.push({
                id: 'chuc_vu_ky', name: 'Chức vụ người ký', nameEn: 'Signer Position',
                status: 'skip', detail: 'Không tìm thấy khối chữ ký', detailEn: 'Signature block not found',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 20: Họ tên người ký (bold, 14pt)
    // ────────────────────────────────────────────────
    {
        // Look for signer name: typically last bold paragraph near end
        const lastParas = paragraphs.slice(-15);
        const namePara = lastParas.find(p => {
            const text = extractText(p).trim();
            // Vietnamese person name pattern: 2-4 words, first letter caps, no special chars
            return text.length > 5 && text.length < 50 && 
                   /^[A-ZÀ-Ỹ][a-zà-ỹ]+(\s[A-ZÀ-Ỹ][a-zà-ỹ]+){1,4}$/.test(text) &&
                   isBold(p);
        });
        if (namePara) {
            const sizes = getFontSizes(namePara);
            const effectiveSize = sizes.length > 0 ? sizes[0] : defaultFontSize;
            const text = extractText(namePara).trim();
            const issues: string[] = [];
            const issuesEn: string[] = [];
            if (effectiveSize < 13 || effectiveSize > 15) { issues.push(`Cỡ ${effectiveSize}pt (chuẩn 14)`); issuesEn.push(`Size ${effectiveSize}pt (std 14)`); }

            results.push({
                id: 'ho_ten_ky', name: 'Họ tên người ký', nameEn: 'Signer Name',
                status: issues.length === 0 ? 'pass' : 'fail',
                detail: issues.length === 0 ? `"${text}" — đậm, ${effectiveSize}pt ✓` : `"${text}" — ${issues.join('; ')}`,
                detailEn: issuesEn.length === 0 ? `"${text}" — bold, ${effectiveSize}pt ✓` : `"${text}" — ${issuesEn.join('; ')}`,
            });
        } else {
            results.push({
                id: 'ho_ten_ky', name: 'Họ tên người ký', nameEn: 'Signer Name',
                status: 'warn', detail: 'Không phát hiện họ tên người ký', detailEn: 'Signer name not detected',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 21: Ký hiệu "(Ký, đóng dấu)" hoặc "(Ký và ghi rõ họ tên)"
    // ────────────────────────────────────────────────
    {
        const kyDauPara = paragraphs.find(p => {
            const text = extractText(p);
            return /\(Ký/.test(text) || /ghi rõ họ tên/.test(text) || /đóng dấu/.test(text);
        });
        if (kyDauPara) {
            const italic = isItalic(kyDauPara);
            const sizes = getFontSizes(kyDauPara);
            const effectiveSize = sizes.length > 0 ? sizes[0] : defaultFontSize;
            const issues: string[] = [];
            const issuesEn: string[] = [];
            if (!italic) { issues.push('Thiếu nghiêng'); issuesEn.push('Not italic'); }
            if (effectiveSize < 12 || effectiveSize > 14) { issues.push(`Cỡ ${effectiveSize}pt (chuẩn 13)`); issuesEn.push(`Size ${effectiveSize}pt (std 13)`); }

            results.push({
                id: 'ky_dau_label', name: 'Ghi chú ký tên', nameEn: 'Signature Note',
                status: issues.length === 0 ? 'pass' : 'fail',
                detail: issues.length === 0 ? `Nghiêng, ${effectiveSize}pt ✓` : issues.join('; '),
                detailEn: issuesEn.length === 0 ? `Italic, ${effectiveSize}pt ✓` : issuesEn.join('; '),
            });
        } else {
            results.push({
                id: 'ky_dau_label', name: 'Ghi chú ký tên', nameEn: 'Signature Note',
                status: 'warn', detail: 'Không tìm thấy "(Ký, đóng dấu)" hoặc "(Ký và ghi rõ họ tên)"',
                detailEn: '"Sign & seal" or "Sign & full name" note not found',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 22: Dấu chỉ mức độ khẩn (nếu có)
    // ────────────────────────────────────────────────
    {
        const urgencyPara = paragraphs.find(p => {
            const text = extractText(p).trim();
            return /^(HỎA TỐC|THƯỢNG KHẨN|KHẨN)$/.test(text);
        });
        if (urgencyPara) {
            const bold = isBold(urgencyPara);
            const upper = isUpperCase(extractText(urgencyPara).trim());
            const sizes = getFontSizes(urgencyPara);
            const effectiveSize = sizes.length > 0 ? sizes[0] : defaultFontSize;
            const issues: string[] = [];
            const issuesEn: string[] = [];
            if (!bold) { issues.push('Thiếu đậm'); issuesEn.push('Not bold'); }
            if (!upper) { issues.push('Chưa IN HOA'); issuesEn.push('Not uppercase'); }
            if (effectiveSize < 13 || effectiveSize > 15) { issues.push(`Cỡ ${effectiveSize}pt (chuẩn 13-14)`); issuesEn.push(`Size ${effectiveSize}pt (std 13-14)`); }

            results.push({
                id: 'do_khan', name: 'Mức độ khẩn', nameEn: 'Urgency Mark',
                status: issues.length === 0 ? 'pass' : 'fail',
                detail: issues.length === 0 ? `"${extractText(urgencyPara).trim()}" — đậm, IN HOA ✓` : issues.join('; '),
                detailEn: issuesEn.length === 0 ? `"${extractText(urgencyPara).trim()}" — bold, CAPS ✓` : issuesEn.join('; '),
            });
        } else {
            results.push({
                id: 'do_khan', name: 'Mức độ khẩn', nameEn: 'Urgency Mark',
                status: 'skip', detail: 'Không có dấu chỉ mức độ khẩn', detailEn: 'No urgency mark present',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 23: Dấu chỉ mức độ mật (nếu có)
    // ────────────────────────────────────────────────
    {
        const secretPara = paragraphs.find(p => {
            const text = extractText(p).trim();
            return /^(MẬT|TUYỆT MẬT|TỐI MẬT)$/.test(text);
        });
        if (secretPara) {
            const bold = isBold(secretPara);
            const sizes = getFontSizes(secretPara);
            const effectiveSize = sizes.length > 0 ? sizes[0] : defaultFontSize;
            const issues: string[] = [];
            const issuesEn: string[] = [];
            if (!bold) { issues.push('Thiếu đậm'); issuesEn.push('Not bold'); }
            if (effectiveSize < 13 || effectiveSize > 15) { issues.push(`Cỡ ${effectiveSize}pt (chuẩn 13-14)`); issuesEn.push(`Size ${effectiveSize}pt (std 13-14)`); }

            results.push({
                id: 'do_mat', name: 'Mức độ mật', nameEn: 'Confidentiality Mark',
                status: issues.length === 0 ? 'pass' : 'fail',
                detail: issues.length === 0 ? `"${extractText(secretPara).trim()}" — đậm ✓` : issues.join('; '),
                detailEn: issuesEn.length === 0 ? `"${extractText(secretPara).trim()}" — bold ✓` : issuesEn.join('; '),
            });
        } else {
            results.push({
                id: 'do_mat', name: 'Mức độ mật', nameEn: 'Confidentiality Mark',
                status: 'skip', detail: 'Không có dấu chỉ mức độ mật', detailEn: 'No confidentiality mark present',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 24: Khoảng cách giữa các thành phần (paragraph spacing)
    // ────────────────────────────────────────────────
    {
        // Check spacing between key document elements
        const spacingAfterValues: number[] = [];
        const spacingBeforeValues: number[] = [];
        for (const p of paragraphs) {
            const afterMatch = /w:after="(\d+)"/.exec(p);
            const beforeMatch = /w:before="(\d+)"/.exec(p);
            if (afterMatch) spacingAfterValues.push(parseInt(afterMatch[1]));
            if (beforeMatch) spacingBeforeValues.push(parseInt(beforeMatch[1]));
        }

        if (spacingAfterValues.length > 0 || spacingBeforeValues.length > 0) {
            const avgAfter = spacingAfterValues.length > 0 ? spacingAfterValues.reduce((a, b) => a + b, 0) / spacingAfterValues.length : 0;
            const avgBefore = spacingBeforeValues.length > 0 ? spacingBeforeValues.reduce((a, b) => a + b, 0) / spacingBeforeValues.length : 0;
            // Standard: before 6pt (120 twips), after 6pt (120 twips) — acceptable range 0-12pt
            const reasonable = avgAfter <= 360 && avgBefore <= 360; // up to 18pt is okay

            results.push({
                id: 'para_spacing', name: 'Khoảng cách đoạn', nameEn: 'Paragraph Spacing',
                status: reasonable ? 'pass' : 'warn',
                detail: `Trước: ${(avgBefore / 20).toFixed(1)}pt, Sau: ${(avgAfter / 20).toFixed(1)}pt`,
                detailEn: `Before: ${(avgBefore / 20).toFixed(1)}pt, After: ${(avgAfter / 20).toFixed(1)}pt`,
            });
        } else {
            results.push({
                id: 'para_spacing', name: 'Khoảng cách đoạn', nameEn: 'Paragraph Spacing',
                status: 'pass', detail: 'Mặc định (0pt)', detailEn: 'Default (0pt)',
            });
        }
    }

    // ────────────────────────────────────────────────
    // RULE 25: Viết hoa (kiểm tra cơ bản)
    // ────────────────────────────────────────────────
    {
        // Check basic capitalization rules: first letter after ".", start of paragraphs
        const issues: string[] = [];
        const issuesEn: string[] = [];
        
        // Check if "Điều" items are properly capitalized
        const dieuParas = paragraphs.filter(p => /Điều\s+\d+/.test(extractText(p)));
        let dieuBoldCount = 0;
        for (const p of dieuParas) {
            if (isBold(p)) dieuBoldCount++;
        }
        if (dieuParas.length > 0 && dieuBoldCount < dieuParas.length) {
            issues.push(`${dieuParas.length - dieuBoldCount}/${dieuParas.length} "Điều" thiếu đậm`);
            issuesEn.push(`${dieuParas.length - dieuBoldCount}/${dieuParas.length} "Điều" not bold`);
        }

        // Check if "Khoản" numbered items exist
        const khoanParas = paragraphs.filter(p => /^\d+\.\s/.test(extractText(p).trim()));
        
        results.push({
            id: 'capitalization', name: 'Viết hoa & "Điều/Khoản"', nameEn: 'Capitalization & Articles',
            status: issues.length === 0 ? 'pass' : 'warn',
            detail: issues.length === 0 
                ? `${dieuParas.length > 0 ? `${dieuParas.length} "Điều" đúng đậm` : 'Không có "Điều"'}${khoanParas.length > 0 ? `, ${khoanParas.length} khoản` : ''} ✓`
                : issues.join('; '),
            detailEn: issuesEn.length === 0 
                ? `${dieuParas.length > 0 ? `${dieuParas.length} "Điều" properly bold` : 'No "Điều" found'}${khoanParas.length > 0 ? `, ${khoanParas.length} clauses` : ''} ✓`
                : issuesEn.join('; '),
        });
    }

    // ── Auto-populate group fields ──
    for (const r of results) {
        const gm = RULE_GROUP_MAP[r.id];
        if (gm) { r.group = gm.group; r.groupEn = gm.groupEn; }
        else { r.group = '📋 Khác'; r.groupEn = '📋 Other'; }
    }

    // ── Calculate score ──
    const score = results.filter(r => r.status === 'pass').length;
    const total = results.filter(r => r.status !== 'skip').length;

    return { score, total, results };
}
