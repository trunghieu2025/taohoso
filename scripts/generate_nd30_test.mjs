/**
 * Generate a ND30-compliant test .docx file for testing the ND30 Checker
 * Run: node scripts/generate_nd30_test.mjs
 */
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
         WidthType, AlignmentType, BorderStyle, PageSize, convertMillimetersToTwip } from 'docx';
import fs from 'fs';

const doc = new Document({
    sections: [{
        properties: {
            page: {
                size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
                margin: {
                    top: convertMillimetersToTwip(20),
                    bottom: convertMillimetersToTwip(20),
                    left: convertMillimetersToTwip(30),
                    right: convertMillimetersToTwip(15),
                },
            },
        },
        children: [
            // Header table (2 columns, hidden borders)
            new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 3500, type: WidthType.DXA },
                                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [new TextRun({ text: "BỘ TÀI CHÍNH", bold: true, font: "Times New Roman", size: 26 })],
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [new TextRun({ text: "CỤC THUẾ TP. HÀ NỘI", bold: true, font: "Times New Roman", size: 26 })],
                                    }),
                                    // Border top line (underline substitute)
                                    new Paragraph({
                                        spacing: { before: 20, after: 0 },
                                        border: { top: { style: BorderStyle.SINGLE, size: 2, color: "000000", space: 1 } },
                                        indent: { left: 1350, right: 1350 },
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 5571, type: WidthType.DXA },
                                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, font: "Times New Roman", size: 26 })],
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, font: "Times New Roman", size: 28 })],
                                    }),
                                    new Paragraph({
                                        spacing: { before: 20, after: 0 },
                                        border: { top: { style: BorderStyle.SINGLE, size: 2, color: "000000", space: 1 } },
                                        indent: { left: 1100, right: 1100 },
                                    }),
                                ],
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [new TextRun({ text: "Số: 1234/CT-HNi", font: "Times New Roman", size: 26 })],
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [new TextRun({ text: "V/v hướng dẫn kê khai thuế TNCN năm 2026", font: "Times New Roman", size: 24 })],
                                    }),
                                ],
                            }),
                            new TableCell({
                                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [new TextRun({ text: "Hà Nội, ngày 15 tháng 3 năm 2026", italics: true, font: "Times New Roman", size: 28 })],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
                width: { size: 100, type: WidthType.PERCENTAGE },
            }),

            // Spacing
            new Paragraph({ spacing: { before: 200 } }),

            // Kính gửi
            new Paragraph({
                spacing: { line: 360 },
                children: [new TextRun({ text: "Kính gửi: Các Chi cục Thuế quận, huyện trên địa bàn TP. Hà Nội", bold: true, font: "Times New Roman", size: 28 })],
            }),

            // Body
            new Paragraph({
                spacing: { line: 360 },
                indent: { firstLine: 720 },
                children: [new TextRun({ text: "Căn cứ Luật Quản lý thuế số 38/2019/QH14 ngày 13/6/2019 và các văn bản hướng dẫn thi hành;", font: "Times New Roman", size: 28 })],
            }),
            new Paragraph({
                spacing: { line: 360 },
                indent: { firstLine: 720 },
                children: [new TextRun({ text: "Căn cứ Nghị định số 126/2020/NĐ-CP ngày 19/10/2020 của Chính phủ quy định chi tiết một số điều của Luật Quản lý thuế;", font: "Times New Roman", size: 28 })],
            }),
            new Paragraph({
                spacing: { line: 360 },
                indent: { firstLine: 720 },
                children: [new TextRun({ text: "Thực hiện chỉ đạo của Tổng cục Thuế tại Công văn số 5678/TCT-TNCN ngày 10/3/2026 về việc hướng dẫn quyết toán thuế thu nhập cá nhân năm 2025, Cục Thuế TP. Hà Nội hướng dẫn các Chi cục Thuế triển khai công tác hỗ trợ người nộp thuế kê khai quyết toán thuế TNCN năm 2025 như sau:", font: "Times New Roman", size: 28 })],
            }),
            new Paragraph({
                spacing: { line: 360 },
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "1. Đối tượng phải quyết toán thuế TNCN", bold: true, font: "Times New Roman", size: 28 }),
                ],
            }),
            new Paragraph({
                spacing: { line: 360 },
                indent: { firstLine: 720 },
                children: [new TextRun({ text: "Cá nhân cư trú có thu nhập từ tiền lương, tiền công thuộc diện phải quyết toán thuế TNCN theo quy định tại Điều 19 Thông tư số 80/2021/TT-BTC.", font: "Times New Roman", size: 28 })],
            }),
            new Paragraph({
                spacing: { line: 360 },
                indent: { firstLine: 720 },
                children: [
                    new TextRun({ text: "2. Thời hạn nộp hồ sơ quyết toán", bold: true, font: "Times New Roman", size: 28 }),
                ],
            }),
            new Paragraph({
                spacing: { line: 360 },
                indent: { firstLine: 720 },
                children: [new TextRun({ text: "Thời hạn nộp hồ sơ quyết toán thuế TNCN năm 2025 chậm nhất là ngày 31/3/2026 đối với tổ chức trả thu nhập và ngày 30/4/2026 đối với cá nhân tự quyết toán.", font: "Times New Roman", size: 28 })],
            }),

            // Spacing before signature
            new Paragraph({ spacing: { before: 200 } }),

            // Signature block
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "KT. CỤC TRƯỞNG", bold: true, font: "Times New Roman", size: 26 })],
            }),
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "PHÓ CỤC TRƯỞNG", bold: true, font: "Times New Roman", size: 28 })],
            }),
            new Paragraph({ spacing: { before: 100 } }),
            new Paragraph({ spacing: { before: 100 } }),
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "(Ký, ghi rõ họ tên)", italics: true, font: "Times New Roman", size: 28 })],
            }),
            new Paragraph({ spacing: { before: 100 } }),
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "Nguyễn Văn An", bold: true, font: "Times New Roman", size: 28 })],
            }),

            // Nơi nhận
            new Paragraph({
                children: [new TextRun({ text: "Nơi nhận:", bold: true, italics: true, font: "Times New Roman", size: 24 })],
            }),
            new Paragraph({
                children: [new TextRun({ text: "- Như trên;", font: "Times New Roman", size: 22 })],
            }),
            new Paragraph({
                children: [new TextRun({ text: "- Cục trưởng (để b/c);", font: "Times New Roman", size: 22 })],
            }),
            new Paragraph({
                children: [new TextRun({ text: "- Lưu: VT, TNCN (3b).", font: "Times New Roman", size: 22 })],
            }),
        ],
    }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync('public/test-nd30.docx', buffer);
console.log('✅ Created public/test-nd30.docx');
