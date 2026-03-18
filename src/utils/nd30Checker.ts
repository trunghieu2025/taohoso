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
    name: string;
    nameEn: string;
    status: RuleStatus;
    detail: string;
    detailEn: string;
}

export interface CheckResult {
    score: number;
    total: number;
    results: RuleResult[];
}

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

    // ── Calculate score ──
    const score = results.filter(r => r.status === 'pass').length;
    const total = results.length;

    return { score, total, results };
}
