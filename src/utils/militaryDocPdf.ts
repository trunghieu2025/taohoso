/**
 * Military doc → PDF via browser print.
 * Captures the preview HTML and opens a print-ready window.
 */

export function generateMilitaryDocPDF(previewContainer: HTMLElement | null, projectName?: string): void {
    if (!previewContainer) {
        alert('Không tìm thấy preview để xuất PDF');
        return;
    }

    const html = previewContainer.innerHTML;
    const title = projectName || 'Hồ sơ sửa chữa';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Trình duyệt đã chặn popup. Vui lòng cho phép popup để xuất PDF.');
        return;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        @page { size: A4; margin: 10mm; }
        body { margin: 0; padding: 0; }
        .docx-wrapper { 
            box-shadow: none !important; 
            padding: 0 !important;
            background: white !important;
        }
        .docx-wrapper > section.docx {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 15mm 20mm !important;
            min-height: auto !important;
            width: auto !important;
        }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    ${html}
    <script>
        setTimeout(function() { window.print(); }, 500);
    </script>
</body>
</html>`);
    printWindow.document.close();
}
