// Script to generate a sample invitation letter template (.docx)
// Uses PizZip to create a minimal Word XML document with [DANH_SACH_*] fields

const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

// Minimal Word document XML structure
const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

// Helper: create a paragraph with optional bold, center, size
function p(text, opts = {}) {
    const { bold, center, size, underline } = opts;
    let rPr = '';
    const rPrParts = [];
    if (bold) rPrParts.push('<w:b/>');
    if (underline) rPrParts.push('<w:u w:val="single"/>');
    if (size) rPrParts.push(`<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`);
    if (rPrParts.length) rPr = `<w:rPr>${rPrParts.join('')}</w:rPr>`;

    let pPr = '';
    const pPrParts = [];
    if (center) pPrParts.push('<w:jc w:val="center"/>');
    if (rPrParts.length) pPrParts.push(`<w:rPr>${rPrParts.join('')}</w:rPr>`);
    if (pPrParts.length) pPr = `<w:pPr>${pPrParts.join('')}</w:pPr>`;

    return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function escapeXml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
            xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:wp="http://schemas.openxmlformats.org/drawingDocument/2006/wordprocessingDrawing"
            xmlns:w10="urn:schemas-microsoft-com:office:word"
            xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml">
  <w:body>
    ${p('ỦY BAN NHÂN DÂN', { bold: true, center: true, size: 26 })}
    ${p('XÃ KỲ XUÂN', { bold: true, center: true, size: 26, underline: true })}
    ${p('')}
    ${p('Số:    /GM-UBND', { size: 24 })}
    ${p('Kỳ Xuân, ngày [NGÀY] tháng [THÁNG] năm [NĂM]', { size: 24 })}
    ${p('')}
    ${p('GIẤY MỜI', { bold: true, center: true, size: 28 })}
    ${p('')}
    ${p('[VỀ VIỆC]', { center: true, size: 24 })}
    ${p('')}
    ${p('Ủy ban nhân dân xã Kỳ Xuân tổ chức hội nghị thống nhất một số nội dung. Kính mời các đại biểu tham dự:', { size: 24 })}
    ${p('')}
    ${p('1. Thời gian Hội nghị: [THỜI GIAN]', { size: 24 })}
    ${p('2. Địa điểm: [ĐỊA ĐIỂM]', { size: 24 })}
    ${p('')}
    ${p('3. Thành phần tham dự trân trọng kính mời:', { bold: true, size: 24 })}
    ${p('* Đại biểu xã:', { bold: true, size: 24 })}
    ${p('[DANH_SACH_DAI_BIEU_XA]', { size: 24 })}
    ${p('* Đại biểu trường học:', { bold: true, size: 24 })}
    ${p('[DANH_SACH_DAI_BIEU_TRUONG]', { size: 24 })}
    ${p('')}
    ${p('4. Phân công nhiệm vụ:', { bold: true, size: 24 })}
    ${p('[DANH_SACH_PHAN_CONG]', { size: 24 })}
    ${p('')}
    ${p('Kính mời.', { size: 24 })}
    ${p('')}
    ${p('Nơi nhận:', { bold: true, size: 20 })}
    ${p('- Như thành phần mời;', { size: 20 })}
    ${p('- Lãnh đạo UBND xã;', { size: 20 })}
    ${p('- VP HĐND và UBND xã;', { size: 20 })}
    ${p('- Phòng Văn hóa - XH;', { size: 20 })}
    ${p('- Lưu VT.', { size: 20 })}
    ${p('')}
    ${p('TL. CHỦ TỊCH', { bold: true, center: true, size: 24 })}
    ${p('CHÁNH VĂN PHÒNG', { bold: true, center: true, size: 24 })}
    ${p('')}
    ${p('')}
    ${p('[NGƯỜI KÝ]', { center: true, size: 24 })}
  </w:body>
</w:document>`;

// Build the .docx zip
const zip = new PizZip();
zip.file('[Content_Types].xml', contentTypesXml);
zip.file('_rels/.rels', relsXml);
zip.file('word/_rels/document.xml.rels', wordRelsXml);
zip.file('word/document.xml', documentXml);

const outputPath = path.join(__dirname, '..', 'public', 'templates', 'mau-giay-moi.docx');
const dirPath = path.dirname(outputPath);
if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(outputPath, buf);
console.log('✅ Created template:', outputPath);
console.log('Size:', buf.length, 'bytes');
