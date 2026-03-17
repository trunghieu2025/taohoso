// Script to generate a sample invitation letter template (.docx)
// Matches the customer's actual format with individual bracket fields for delegates

const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

// Helper: create a paragraph
function p(text, opts = {}) {
    const { bold, center, size, underline, italic, indent } = opts;
    const rPrParts = [];
    if (bold) rPrParts.push('<w:b/>');
    if (italic) rPrParts.push('<w:i/>');
    if (underline) rPrParts.push('<w:u w:val="single"/>');
    if (size) rPrParts.push(`<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`);
    const rPr = rPrParts.length ? `<w:rPr>${rPrParts.join('')}</w:rPr>` : '';

    const pPrParts = [];
    if (center) pPrParts.push('<w:jc w:val="center"/>');
    if (indent) pPrParts.push(`<w:ind w:left="${indent}"/>`);
    if (rPrParts.length) pPrParts.push(`<w:rPr>${rPrParts.join('')}</w:rPr>`);
    const pPr = pPrParts.length ? `<w:pPr>${pPrParts.join('')}</w:pPr>` : '';

    return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function escapeXml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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
    ${p('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { bold: true, center: true, size: 26 })}
    ${p('Độc lập - Tự do - Hạnh phúc', { bold: true, center: true, size: 26, underline: true })}
    ${p('')}
    ${p('Số:    /GM-UBND', { size: 24 })}
    ${p('Kỳ Xuân, ngày [NGÀY] tháng [THÁNG] năm [NĂM]', { italic: true, size: 24 })}
    ${p('')}
    ${p('GIẤY MỜI', { bold: true, center: true, size: 28 })}
    ${p('[Về việc thống nhất một số nội dung chuẩn bị cho Đại hội Điền kinh]', { center: true, size: 24 })}
    ${p('')}
    ${p('Nhằm đảm bảo tốt cho công tác tham gia [Đại hội Điền kinh – Thể thao học sinh phổ thông cấp tỉnh năm học 2025 – 2026];', { size: 24, indent: 360 })}
    ${p('Ủy ban nhân dân xã Kỳ Xuân tổ chức hội nghị thống nhất một số nội dung liên quan đến công tác chuẩn bị và tham gia Đại hội.', { size: 24, indent: 360 })}
    ${p('1. Thời gian Hội nghị: [½ ngày, từ 15h00 ngày 17/3/2026.]', { size: 24, indent: 360 })}
    ${p('2. Địa điểm: [Tại Hội trường tầng 2, Trụ sở UBND xã Kỳ Xuân.]', { size: 24, indent: 360 })}
    ${p('3. Thành phần tham dự trân trọng kính mời:', { bold: true, size: 24, indent: 360 })}
    ${p('* Đại biểu xã:', { bold: true, size: 24, indent: 720 })}
    ${p('- [Đồng chí Nguyễn Thành Chung, Phó Chủ tịch UBND xã (mời Chủ trì);]', { size: 24, indent: 720 })}
    ${p('- [Đồng chí Nguyễn Đình Tương, Trưởng phòng Phòng Văn hoá - Xã hội.]', { size: 24, indent: 720 })}
    ${p('- [Công chức phòng Văn hóa – Xã hội, phụ trách lĩnh vực Giáo dục.]', { size: 24, indent: 720 })}
    ${p('* Đại biểu trường học:', { bold: true, size: 24, indent: 720 })}
    ${p('- [Ban giám hiệu các trường Tiểu học, Trung học cơ sở trên địa bàn.]', { size: 24, indent: 720 })}
    ${p('4. Phân công nhiệm vụ:', { bold: true, size: 24, indent: 360 })}
    ${p('- [Phòng Văn hóa - Xã hội chuẩn bị các tài liệu phục vụ cho hội nghị;]', { size: 24, indent: 720 })}
    ${p('- [Văn Phòng HĐND&UBND chuẩn bị các điều kiện phục vụ hội nghị.]', { size: 24, indent: 720 })}
    ${p('Đề nghị các đại biểu tham dự kỳ họp đầy đủ và đúng thời gian quy định./.', { size: 24, indent: 360 })}
    ${p('')}
    ${p('Kính mời.', { size: 24 })}
    ${p('')}
    ${p('Nơi nhận:', { bold: true, italic: true, size: 20 })}
    ${p('- Như thành phần mời;', { size: 20 })}
    ${p('- Lãnh đạo UBND xã;', { size: 20 })}
    ${p('- VP HĐND và UBND xã;', { size: 20 })}
    ${p('- Phòng Văn hóa – Xã hội;', { size: 20 })}
    ${p('- Lưu VT./.', { size: 20 })}
    ${p('')}
    ${p('TL. CHỦ TỊCH', { bold: true, center: true, size: 24 })}
    ${p('CHÁNH VĂN PHÒNG', { bold: true, center: true, size: 24 })}
    ${p('')}
    ${p('')}
    ${p('[Nguyễn Văn Yên]', { center: true, size: 24 })}
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
