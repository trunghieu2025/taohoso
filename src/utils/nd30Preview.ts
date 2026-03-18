/**
 * ND30 Document Preview — renders .docx content as styled HTML
 * with error highlighting for ND30 compliance issues.
 * 
 * Used in split-screen view: Original (left) vs Fixed (right)
 */
import PizZip from 'pizzip';
import type { CheckResult } from './nd30Checker';

export interface PreviewParagraph {
    text: string;
    style: React.CSSProperties;
    issues: string[];   // list of issue IDs for this paragraph
    isTable?: boolean;
    cells?: PreviewParagraph[][];
}

/** Extract run properties */
function getRunStyle(runXml: string): React.CSSProperties {
    const style: React.CSSProperties = {};
    const sizeMatch = /<w:sz\s+w:val="(\d+)"/.exec(runXml);
    if (sizeMatch) style.fontSize = `${parseInt(sizeMatch[1]) / 2}pt`;

    if (/<w:b\s*\/>|<w:b\s+w:val="true"|<w:b\s+w:val="1"|<w:b>/.test(runXml)) style.fontWeight = 'bold';
    if (/<w:i\s*\/>|<w:i\s+w:val="true"|<w:i\s+w:val="1"|<w:i>/.test(runXml)) style.fontStyle = 'italic';
    if (/<w:u\s+w:val="single"/.test(runXml)) style.textDecoration = 'underline';

    const fontMatch = /<w:rFonts[^>]*w:ascii="([^"]+)"/.exec(runXml);
    if (fontMatch) style.fontFamily = fontMatch[1];

    return style;
}

/** Get paragraph alignment */
function getAlignment(paraXml: string): string {
    const jcMatch = /<w:jc\s+w:val="(\w+)"/.exec(paraXml);
    if (jcMatch) {
        const val = jcMatch[1];
        if (val === 'center') return 'center';
        if (val === 'right' || val === 'end') return 'right';
        if (val === 'both' || val === 'distribute') return 'justify';
    }
    return 'left';
}

/** Extract text with inline styles from a paragraph */
function extractRuns(paraXml: string): Array<{ text: string; style: React.CSSProperties }> {
    const runs: Array<{ text: string; style: React.CSSProperties }> = [];
    const runRe = /<w:r[\s>]([\s\S]*?)<\/w:r>/g;
    let m;
    while ((m = runRe.exec(paraXml)) !== null) {
        const runXml = m[1];
        const texts: string[] = [];
        const tRe = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
        let tm;
        while ((tm = tRe.exec(runXml)) !== null) texts.push(tm[1]);
        if (texts.length > 0) {
            runs.push({ text: texts.join(''), style: getRunStyle(runXml) });
        }
    }
    return runs;
}

/** Build preview paragraphs from docx buffer */
export function buildPreview(buffer: ArrayBuffer, checkResult?: CheckResult): PreviewParagraph[] {
    const zip = new PizZip(buffer);
    const docXml = zip.file('word/document.xml')?.asText() || '';
    const bodyMatch = /<w:body>([\s\S]*)<\/w:body>/.exec(docXml);
    const bodyXml = bodyMatch ? bodyMatch[1] : docXml;
    const failedRules = new Set(checkResult?.results.filter(r => r.status === 'fail' || r.status === 'warn').map(r => r.id) || []);

    const output: PreviewParagraph[] = [];

    // Process tables and body-level paragraphs
    const elementRe = /(<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[\s>][\s\S]*?<\/w:p>)/g;
    let em;
    while ((em = elementRe.exec(bodyXml)) !== null) {
        const el = em[1];

        if (el.startsWith('<w:tbl>')) {
            // Table
            const rowRe = /<w:tr[\s>][\s\S]*?<\/w:tr>/g;
            const rows: PreviewParagraph[][] = [];
            let rm;
            while ((rm = rowRe.exec(el)) !== null) {
                const cellRe = /<w:tc[\s>][\s\S]*?<\/w:tc>/g;
                const cells: PreviewParagraph[] = [];
                let cm;
                while ((cm = cellRe.exec(rm[0])) !== null) {
                    const cellXml = cm[0];
                    const cellParaRe = /<w:p[\s>][\s\S]*?<\/w:p>/g;
                    let cellText = '';
                    let cellStyle: React.CSSProperties = {};
                    let cpm;
                    while ((cpm = cellParaRe.exec(cellXml)) !== null) {
                        const runs = extractRuns(cpm[0]);
                        cellText += runs.map(r => r.text).join('');
                        if (runs.length > 0) cellStyle = { ...cellStyle, ...runs[0].style };
                        const align = getAlignment(cpm[0]);
                        if (align !== 'left') cellStyle.textAlign = align as any;
                    }
                    // Detect issues
                    const issues: string[] = [];
                    const upperText = cellText.trim();
                    if (upperText.includes('CỘNG') && upperText.includes('VIỆT NAM') && failedRules.has('quoc_hieu')) issues.push('quoc_hieu');
                    if ((upperText.includes('Độc lập') || upperText.includes('ĐỘC LẬP')) && failedRules.has('tieu_ngu')) issues.push('tieu_ngu');
                    if (upperText && upperText === upperText.toUpperCase() && upperText.length > 3 && upperText.length < 80 &&
                        !upperText.includes('CỘNG') && !upperText.includes('VIỆT NAM') && failedRules.has('ten_co_quan')) issues.push('ten_co_quan');
                    if (/Số[:\s]*\d+/.test(upperText) && failedRules.has('so_ky_hieu')) issues.push('so_ky_hieu');
                    if (/ngày\s+\d+\s+tháng/i.test(upperText) && failedRules.has('dia_danh_ngay')) issues.push('dia_danh_ngay');

                    cells.push({ text: cellText, style: cellStyle, issues });
                }
                rows.push(cells);
            }
            output.push({ text: '', style: {}, issues: failedRules.has('header_table') ? ['header_table'] : [], isTable: true, cells: rows });
        } else {
            // Paragraph
            const runs = extractRuns(el);
            const fullText = runs.map(r => r.text).join('');
            if (!fullText.trim() && runs.length === 0) {
                output.push({ text: '', style: { minHeight: '0.8em' }, issues: [] });
                continue;
            }
            const mainStyle: React.CSSProperties = runs.length > 0 ? { ...runs[0].style } : {};
            const align = getAlignment(el);
            if (align !== 'left') mainStyle.textAlign = align as any;

            // Detect issues for this paragraph
            const issues: string[] = [];
            const t = fullText.trim();
            if (t.includes('CỘNG') && t.includes('VIỆT NAM') && failedRules.has('quoc_hieu')) issues.push('quoc_hieu');
            if ((t.includes('Độc lập') || t.includes('ĐỘC LẬP')) && failedRules.has('tieu_ngu')) issues.push('tieu_ngu');
            if (t && t === t.toUpperCase() && t.length > 3 && t.length < 80 &&
                !t.includes('CỘNG') && !t.includes('VIỆT NAM') && !t.includes('ĐỘC LẬP') && failedRules.has('ten_co_quan')) issues.push('ten_co_quan');
            if (/Số[:\s]*\d+/.test(t) && failedRules.has('so_ky_hieu')) issues.push('so_ky_hieu');
            if (/ngày\s+\d+\s+tháng/i.test(t) && failedRules.has('dia_danh_ngay')) issues.push('dia_danh_ngay');
            if (/V\/v|Về việc/i.test(t) && failedRules.has('trich_yeu')) issues.push('trich_yeu');
            if (/^(QUYẾT ĐỊNH|THÔNG BÁO|BÁO CÁO|NGHỊ QUYẾT)/i.test(t) && failedRules.has('trich_yeu')) issues.push('trich_yeu');
            if (/Nơi nhận/i.test(t) && failedRules.has('noi_nhan')) issues.push('noi_nhan');
            if (/^(TM\.|KT\.|TL\.|TUQ\.)|BỘ TRƯỞNG|GIÁM ĐỐC|CHỦ TỊCH|CỤC TRƯỞNG/.test(t) && failedRules.has('chu_ky')) issues.push('chu_ky');
            // Body content size issues
            if (t.length > 30 && failedRules.has('noi_dung') && !issues.length) issues.push('noi_dung');

            output.push({ text: fullText, style: mainStyle, issues });
        }
    }

    return output;
}
