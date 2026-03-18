/**
 * ND30 Auto-Fixer — Automatically fix formatting issues per NĐ30/2020
 * 
 * Takes the original .docx buffer + check results, modifies XML in-memory,
 * returns fixed buffer + list of changes made.
 */
import PizZip from 'pizzip';
import type { CheckResult } from './nd30Checker';

export interface FixChange {
    rule: string;
    ruleEn: string;
    before: string;
    after: string;
}

export interface FixResult {
    fixedBuffer: ArrayBuffer;
    changes: FixChange[];
}

/** Convert cm to twips */
function cmToTwips(cm: number): number {
    return Math.round(cm * 567);
}

/** Convert pt to half-points */
function ptToHalfPt(pt: number): number {
    return pt * 2;
}

export async function fixND30(buffer: ArrayBuffer, checkResult: CheckResult): Promise<FixResult> {
    const zip = new PizZip(buffer);
    let docXml = zip.file('word/document.xml')?.asText() || '';
    let stylesXml = zip.file('word/styles.xml')?.asText() || '';
    const changes: FixChange[] = [];

    const failedRules = new Set(
        checkResult.results.filter(r => r.status === 'fail' || r.status === 'warn').map(r => r.id)
    );

    // ── FIX 1: Margins ──
    if (failedRules.has('margins')) {
        const mgMatch = /<w:pgMar[^/]*\/?>/.exec(docXml);
        if (mgMatch) {
            const oldMargin = mgMatch[0];
            const newMargin = `<w:pgMar w:top="${cmToTwips(2)}" w:right="${cmToTwips(1.5)}" w:bottom="${cmToTwips(2)}" w:left="${cmToTwips(3)}" w:header="720" w:footer="720" w:gutter="0"/>`;
            docXml = docXml.replace(oldMargin, newMargin);
            changes.push({
                rule: 'Lề trang', ruleEn: 'Page Margins',
                before: 'Lề không đúng chuẩn / Non-standard margins',
                after: 'T2.0 B2.0 L3.0 R1.5 cm',
            });
        }
    }

    // ── FIX 2: Font — set default to Times New Roman ──
    if (failedRules.has('font')) {
        // Update default font in styles.xml
        if (stylesXml) {
            stylesXml = stylesXml.replace(
                /(<w:rFonts[^>]*w:ascii=")([^"]+)(")/g,
                '$1Times New Roman$3'
            );
            changes.push({
                rule: 'Phông chữ', ruleEn: 'Font',
                before: 'Font khác Times New Roman / Non-TNR font',
                after: 'Times New Roman',
            });
        }
    }

    // ── FIX 3: Quốc hiệu — set bold, uppercase, size 13 ──
    if (failedRules.has('quoc_hieu')) {
        const quocHieuRe = /(<w:p[\s>][\s\S]*?)(CỘNG[\s\S]*?VIỆT\s*NAM)([\s\S]*?<\/w:p>)/;
        const qhMatch = quocHieuRe.exec(docXml);
        if (qhMatch) {
            const paraXml = qhMatch[0];
            let fixed = paraXml;

            // Ensure bold on all runs
            fixed = fixed.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/g, (match, inner) => {
                let newInner = inner;
                if (!/<w:b[\s/>]/.test(inner)) {
                    newInner = '<w:b/>' + newInner;
                }
                // Fix font size to 13pt (26 half-pt)
                newInner = newInner.replace(/<w:sz\s+w:val="\d+"/, `<w:sz w:val="${ptToHalfPt(13)}"`);
                newInner = newInner.replace(/<w:szCs\s+w:val="\d+"/, `<w:szCs w:val="${ptToHalfPt(13)}"`);
                return `<w:rPr>${newInner}</w:rPr>`;
            });

            docXml = docXml.replace(paraXml, fixed);
            changes.push({
                rule: 'Quốc hiệu', ruleEn: 'National Emblem',
                before: 'Thiếu đậm hoặc sai cỡ chữ / Missing bold or wrong size',
                after: 'Đậm, 13pt / Bold, 13pt',
            });
        }
    }

    // ── FIX 4: Tiêu ngữ — set bold, size 14 ──
    if (failedRules.has('tieu_ngu')) {
        const tieuNguRe = /(<w:p[\s>][\s\S]*?)(Độc\s*lập|ĐỘC\s*LẬP)([\s\S]*?<\/w:p>)/;
        const tnMatch = tieuNguRe.exec(docXml);
        if (tnMatch) {
            const paraXml = tnMatch[0];
            let fixed = paraXml;

            fixed = fixed.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/g, (match, inner) => {
                let newInner = inner;
                if (!/<w:b[\s/>]/.test(inner)) newInner = '<w:b/>' + newInner;
                newInner = newInner.replace(/<w:sz\s+w:val="\d+"/, `<w:sz w:val="${ptToHalfPt(14)}"`);
                newInner = newInner.replace(/<w:szCs\s+w:val="\d+"/, `<w:szCs w:val="${ptToHalfPt(14)}"`);
                return `<w:rPr>${newInner}</w:rPr>`;
            });

            docXml = docXml.replace(paraXml, fixed);
            changes.push({
                rule: 'Tiêu ngữ', ruleEn: 'Motto',
                before: 'Thiếu đậm hoặc sai cỡ / Missing bold or wrong size',
                after: 'Đậm, 14pt / Bold, 14pt',
            });
        }
    }

    // ── FIX 5: Tên cơ quan — set bold ──
    if (failedRules.has('ten_co_quan')) {
        // Find uppercase paragraphs in first 15 paras that are agency names
        const parasRe = /<w:p[\s>][\s\S]*?<\/w:p>/g;
        let paraMatch;
        let count = 0;
        while ((paraMatch = parasRe.exec(docXml)) !== null && count < 15) {
            count++;
            const paraXml = paraMatch[0];
            const textRe = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
            let texts = '';
            let tm;
            while ((tm = textRe.exec(paraXml)) !== null) texts += tm[1];
            texts = texts.trim();

            if (texts.length > 3 && texts.length < 100 &&
                texts === texts.toUpperCase() &&
                !texts.includes('CỘNG HÒA') && !texts.includes('VIỆT NAM') &&
                !texts.includes('ĐỘC LẬP')) {

                // Add bold to runs
                let fixed = paraXml;
                fixed = fixed.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/g, (match, inner) => {
                    if (!/<w:b[\s/>]/.test(inner)) {
                        return `<w:rPr><w:b/>${inner}</w:rPr>`;
                    }
                    return match;
                });
                // If no rPr exists, add one
                fixed = fixed.replace(/<w:r>((?!<w:rPr>)[\s\S]*?<w:t)/g, '<w:r><w:rPr><w:b/></w:rPr>$1');

                if (fixed !== paraXml) {
                    docXml = docXml.replace(paraXml, fixed);
                    changes.push({
                        rule: 'Tên cơ quan', ruleEn: 'Agency Name',
                        before: `"${texts.substring(0, 40)}" — không đậm / not bold`,
                        after: `"${texts.substring(0, 40)}" — đậm / bold`,
                    });
                }
                break;
            }
        }
    }

    // ── FIX 6: Địa danh — set italic, size 14 ──
    if (failedRules.has('dia_danh_ngay')) {
        const dateRe = /(<w:p[\s>][\s\S]*?)(ngày\s+\d+\s+tháng\s+\d+\s+năm\s+\d+)([\s\S]*?<\/w:p>)/i;
        const dateMatch = dateRe.exec(docXml);
        if (dateMatch) {
            const paraXml = dateMatch[0];
            let fixed = paraXml;

            fixed = fixed.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/g, (match, inner) => {
                let newInner = inner;
                if (!/<w:i[\s/>]/.test(inner)) newInner = '<w:i/>' + newInner;
                newInner = newInner.replace(/<w:sz\s+w:val="\d+"/, `<w:sz w:val="${ptToHalfPt(14)}"`);
                newInner = newInner.replace(/<w:szCs\s+w:val="\d+"/, `<w:szCs w:val="${ptToHalfPt(14)}"`);
                return `<w:rPr>${newInner}</w:rPr>`;
            });
            // Add italic to runs without rPr
            fixed = fixed.replace(/<w:r>((?!<w:rPr>)[\s\S]*?<w:t)/g, '<w:r><w:rPr><w:i/></w:rPr>$1');

            docXml = docXml.replace(paraXml, fixed);
            changes.push({
                rule: 'Địa danh, ngày tháng', ruleEn: 'Location & Date',
                before: 'Thiếu nghiêng / Not italic',
                after: 'Nghiêng, 14pt / Italic, 14pt',
            });
        }
    }

    // ── FIX 7: Nội dung font size — normalize to 14pt ──
    if (failedRules.has('noi_dung')) {
        // Fix all body text sizes to 14pt (28 half-pt)
        let fixCount = 0;
        docXml = docXml.replace(/<w:sz\s+w:val="(\d+)"/g, (match, val) => {
            const pt = parseInt(val) / 2;
            // Only fix body text sizes (not headers or footnotes)
            if (pt >= 10 && pt <= 12) {
                fixCount++;
                return `<w:sz w:val="${ptToHalfPt(14)}"`;
            }
            return match;
        });
        if (fixCount > 0) {
            changes.push({
                rule: 'Cỡ chữ nội dung', ruleEn: 'Body Font Size',
                before: `${fixCount} chỗ sai cỡ / ${fixCount} size errors`,
                after: '14pt',
            });
        }
    }

    // ── FIX 8: Nơi nhận label — bold+italic, size 12 ──
    if (failedRules.has('noi_nhan')) {
        const noiNhanRe = /(<w:p[\s>][\s\S]*?)(Nơi nhận)([\s\S]*?<\/w:p>)/i;
        const nnMatch = noiNhanRe.exec(docXml);
        if (nnMatch) {
            const paraXml = nnMatch[0];
            let fixed = paraXml;

            fixed = fixed.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/g, (match, inner) => {
                let newInner = inner;
                if (!/<w:b[\s/>]/.test(inner)) newInner = '<w:b/>' + newInner;
                if (!/<w:i[\s/>]/.test(inner)) newInner = '<w:i/>' + newInner;
                newInner = newInner.replace(/<w:sz\s+w:val="\d+"/, `<w:sz w:val="${ptToHalfPt(12)}"`);
                newInner = newInner.replace(/<w:szCs\s+w:val="\d+"/, `<w:szCs w:val="${ptToHalfPt(12)}"`);
                return `<w:rPr>${newInner}</w:rPr>`;
            });

            docXml = docXml.replace(paraXml, fixed);
            changes.push({
                rule: 'Nơi nhận', ruleEn: 'Recipients',
                before: 'Label thiếu đậm/nghiêng / Label not bold/italic',
                after: 'Đậm+Nghiêng, 12pt / Bold+Italic, 12pt',
            });
        }
    }

    // ── FIX 9: Chữ ký — bold, size 13 ──
    if (failedRules.has('chu_ky')) {
        const sigRe = /(<w:p[\s>][\s\S]*?)(TM\.|KT\.|TL\.|TUQ\.|BỘ TRƯỞNG|GIÁM ĐỐC|CHỦ TỊCH|CỤC TRƯỞNG|VỤ TRƯỞNG)([\s\S]*?<\/w:p>)/;
        const sigMatch = sigRe.exec(docXml);
        if (sigMatch) {
            const paraXml = sigMatch[0];
            let fixed = paraXml;

            fixed = fixed.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/g, (match, inner) => {
                let newInner = inner;
                if (!/<w:b[\s/>]/.test(inner)) newInner = '<w:b/>' + newInner;
                newInner = newInner.replace(/<w:sz\s+w:val="\d+"/, `<w:sz w:val="${ptToHalfPt(13)}"`);
                newInner = newInner.replace(/<w:szCs\s+w:val="\d+"/, `<w:szCs w:val="${ptToHalfPt(13)}"`);
                return `<w:rPr>${newInner}</w:rPr>`;
            });

            docXml = docXml.replace(paraXml, fixed);
            changes.push({
                rule: 'Khối chữ ký', ruleEn: 'Signature Block',
                before: 'Thiếu đậm hoặc sai cỡ / Missing bold or wrong size',
                after: 'Đậm, 13pt / Bold, 13pt',
            });
        }
    }

    // ── FIX 10: Số/ký hiệu — size 13pt ──
    if (failedRules.has('so_ky_hieu')) {
        const soRe = /(<w:p[\s>][\s\S]*?)(Số[\s:]*\d+)([\s\S]*?<\/w:p>)/;
        const soMatch = soRe.exec(docXml);
        if (soMatch) {
            const paraXml = soMatch[0];
            let fixed = paraXml;
            fixed = fixed.replace(/<w:sz\s+w:val="\d+"/g, `<w:sz w:val="${ptToHalfPt(13)}"`);
            fixed = fixed.replace(/<w:szCs\s+w:val="\d+"/g, `<w:szCs w:val="${ptToHalfPt(13)}"`);
            if (fixed !== paraXml) {
                docXml = docXml.replace(paraXml, fixed);
                changes.push({
                    rule: 'Số/ký hiệu', ruleEn: 'Document Number',
                    before: 'Sai cỡ chữ / Wrong size',
                    after: '13pt',
                });
            }
        }
    }

    // ── FIX 11: Trích yếu — bold + size 13-14pt ──
    if (failedRules.has('trich_yeu')) {
        const tyRe = /(<w:p[\s>][\s\S]*?)(V\/v|Về việc|QUYẾT ĐỊNH|THÔNG BÁO|BÁO CÁO|KẾ HOẠCH)([\s\S]*?<\/w:p>)/i;
        const tyMatch = tyRe.exec(docXml);
        if (tyMatch) {
            const paraXml = tyMatch[0];
            let fixed = paraXml;
            fixed = fixed.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/g, (match, inner) => {
                let newInner = inner;
                if (!/w:b[\s/>]/.test(inner)) newInner = '<w:b/>' + newInner;
                newInner = newInner.replace(/<w:sz\s+w:val="\d+"/, `<w:sz w:val="${ptToHalfPt(14)}"`);
                newInner = newInner.replace(/<w:szCs\s+w:val="\d+"/, `<w:szCs w:val="${ptToHalfPt(14)}"`);
                return `<w:rPr>${newInner}</w:rPr>`;
            });
            if (fixed !== paraXml) {
                docXml = docXml.replace(paraXml, fixed);
                changes.push({
                    rule: 'Trích yếu', ruleEn: 'Summary/Title',
                    before: 'Thiếu đậm hoặc sai cỡ / Missing bold or wrong size',
                    after: 'Đậm, 14pt / Bold, 14pt',
                });
            }
        }
    }

    // ── FIX 12: Giãn dòng — set to 1.5 (360 twips) ──
    if (failedRules.has('line_spacing')) {
        let fixCount = 0;
        docXml = docXml.replace(/<w:spacing([^>]*)w:line="(\d+)"/g, (match, attrs, val) => {
            const lineVal = parseInt(val);
            if (lineVal < 220) {
                fixCount++;
                return `<w:spacing${attrs}w:line="360"`;
            }
            return match;
        });
        if (fixCount > 0) {
            changes.push({
                rule: 'Giãn dòng', ruleEn: 'Line Spacing',
                before: `${fixCount} chỗ giãn dòng quá hẹp / ${fixCount} instances too narrow`,
                after: '1.5 lines (360 twips)',
            });
        }
    }

    // ── FIX 13: Justify alignment — set body paragraphs to both ──
    if (failedRules.has('justify')) {
        let fixCount = 0;
        // Add justify to paragraphs that have left alignment or no alignment
        docXml = docXml.replace(/<w:jc\s+w:val="left"/g, () => {
            fixCount++;
            return '<w:jc w:val="both"';
        });
        if (fixCount > 0) {
            changes.push({
                rule: 'Căn lề 2 bên', ruleEn: 'Justify Alignment',
                before: `${fixCount} đoạn căn trái / ${fixCount} left-aligned paragraphs`,
                after: 'Căn đều 2 bên / Justified',
            });
        }
    }

    // ── FIX 14: First-line indent — set to 1.27cm (720 twips) ──
    if (failedRules.has('first_indent')) {
        // This is harder to auto-fix without breaking existing layout
        // Only add indent where pPr exists but no firstLine
        let fixCount = 0;
        docXml = docXml.replace(/<w:pPr>([\s\S]*?)<\/w:pPr>/g, (match, inner) => {
            // Don't add indent to centered, right-aligned, or already-indented paragraphs
            if (/w:jc\s+w:val="center"/.test(inner) || /w:jc\s+w:val="right"/.test(inner)) return match;
            if (/w:firstLine/.test(inner)) return match;
            if (/w:ind/.test(inner)) {
                // Has ind but no firstLine — add firstLine
                const newInner = inner.replace(/<w:ind([^/]*)\/?>/, '<w:ind$1 w:firstLine="720"/>');
                if (newInner !== inner) { fixCount++; return `<w:pPr>${newInner}</w:pPr>`; }
            }
            return match;
        });
        if (fixCount > 0) {
            changes.push({
                rule: 'Thụt đầu dòng', ruleEn: 'First-line Indent',
                before: `${fixCount} đoạn thiếu thụt / ${fixCount} paragraphs missing indent`,
                after: '1.27cm (720 twips)',
            });
        }
    }

    // ── FIX 15: Ghi chú ký tên — set italic ──
    if (failedRules.has('ky_dau_label')) {
        const kyRe = /(<w:p[\s>][\s\S]*?)(\(Ký|ghi rõ họ tên|đóng dấu)([\s\S]*?<\/w:p>)/;
        const kyMatch = kyRe.exec(docXml);
        if (kyMatch) {
            const paraXml = kyMatch[0];
            let fixed = paraXml;
            fixed = fixed.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/g, (match, inner) => {
                let newInner = inner;
                if (!/w:i[\s/>]/.test(inner)) newInner = '<w:i/>' + newInner;
                return `<w:rPr>${newInner}</w:rPr>`;
            });
            if (fixed !== paraXml) {
                docXml = docXml.replace(paraXml, fixed);
                changes.push({
                    rule: 'Ghi chú ký tên', ruleEn: 'Signature Note',
                    before: 'Thiếu nghiêng / Not italic',
                    after: 'Nghiêng / Italic',
                });
            }
        }
    }

    // ── Save modified XML back ──
    zip.file('word/document.xml', docXml);
    if (stylesXml) zip.file('word/styles.xml', stylesXml);

    const fixedContent = zip.generate({ type: 'arraybuffer' });

    return {
        fixedBuffer: fixedContent,
        changes,
    };
}
