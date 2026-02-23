import jsPDF from 'jspdf';

const TEMPLATE_NAMES = {
    'nha-nguyen-can': 'HỢP ĐỒNG THUÊ NHÀ NGUYÊN CĂN',
    'phong-tro': 'HỢP ĐỒNG THUÊ PHÒNG TRỌ',
    'van-phong': 'HỢP ĐỒNG THUÊ VĂN PHÒNG',
    'mat-bang': 'HỢP ĐỒNG THUÊ MẶT BẰNG KINH DOANH',
};

export function generateContractPDF(data) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const addText = (text, x, currentY, options = {}) => {
        const { fontSize = 11, fontStyle = 'normal', align = 'left', maxWidth = contentWidth } = options;
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        const lines = doc.splitTextToSize(text, maxWidth);
        if (currentY + lines.length * (fontSize * 0.5) > 280) {
            doc.addPage();
            currentY = 20;
        }
        doc.text(lines, x, currentY, { align });
        return currentY + lines.length * (fontSize * 0.45) + 2;
    };

    const addLine = (currentY) => {
        doc.setDrawColor(200);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        return currentY + 5;
    };

    // Header
    y = addText('CONG HOA XA HOI CHU NGHIA VIET NAM', pageWidth / 2, y, { fontSize: 13, fontStyle: 'bold', align: 'center' });
    y = addText('Doc lap - Tu do - Hanh phuc', pageWidth / 2, y, { fontSize: 11, fontStyle: 'italic', align: 'center' });
    y = addLine(y);
    y += 5;

    // Title
    const templateName = TEMPLATE_NAMES[data.template] || 'HOP DONG THUE NHA';
    y = addText(templateName, pageWidth / 2, y, { fontSize: 15, fontStyle: 'bold', align: 'center' });
    y += 3;

    // Date info
    const today = new Date();
    const dateStr = `Hom nay, ngay ${today.getDate()} thang ${today.getMonth() + 1} nam ${today.getFullYear()}`;
    y = addText(dateStr, margin, y, { fontSize: 10, fontStyle: 'italic' });
    y = addText(`Tai: ${data.propertyAddress || '...............'}`, margin, y, { fontSize: 10, fontStyle: 'italic' });
    y += 5;

    // BEN CHO THUE
    y = addText('BEN CHO THUE (Ben A):', margin, y, { fontSize: 12, fontStyle: 'bold' });
    y += 2;
    y = addText(`Ho va ten: ${data.landlordName || '...............'}`, margin, y);
    y = addText(`So CCCD/CMND: ${data.landlordId || '...............'}`, margin, y);
    y = addText(`Ngay cap: ${data.landlordIdDate || '...'} - Noi cap: ${data.landlordIdPlace || '...'}`, margin, y);
    y = addText(`Dia chi: ${data.landlordAddress || '...............'}`, margin, y);
    y = addText(`So dien thoai: ${data.landlordPhone || '...............'}`, margin, y);
    if (data.landlordBank) {
        y = addText(`Tai khoan ngan hang: ${data.landlordBank} - ${data.landlordBankName || ''}`, margin, y);
    }
    y += 5;

    // BEN THUE
    y = addText('BEN THUE (Ben B):', margin, y, { fontSize: 12, fontStyle: 'bold' });
    y += 2;
    y = addText(`Ho va ten: ${data.tenantName || '...............'}`, margin, y);
    y = addText(`So CCCD/CMND: ${data.tenantId || '...............'}`, margin, y);
    y = addText(`Ngay cap: ${data.tenantIdDate || '...'} - Noi cap: ${data.tenantIdPlace || '...'}`, margin, y);
    y = addText(`Dia chi: ${data.tenantAddress || '...............'}`, margin, y);
    y = addText(`So dien thoai: ${data.tenantPhone || '...............'}`, margin, y);
    y += 5;

    // DIEU 1
    y = addText('DIEU 1: THONG TIN NHA CHO THUE', margin, y, { fontSize: 12, fontStyle: 'bold' });
    y += 2;
    y = addText(`Dia chi: ${data.propertyAddress || '...............'}`, margin, y);
    y = addText(`Dien tich: ${data.propertyArea || '...'} m2`, margin, y);
    if (data.propertyDescription) {
        y = addText(`Mo ta: ${data.propertyDescription}`, margin, y);
    }
    y += 5;

    // DIEU 2
    y = addText('DIEU 2: GIA THUE VA PHUONG THUC THANH TOAN', margin, y, { fontSize: 12, fontStyle: 'bold' });
    y += 2;
    const rentFormatted = data.rentAmount ? Number(data.rentAmount).toLocaleString('vi-VN') : '...';
    y = addText(`Gia thue: ${rentFormatted} VND/thang`, margin, y);
    y = addText(`Tien coc: ${data.depositAmount ? Number(data.depositAmount).toLocaleString('vi-VN') : '...'} VND`, margin, y);
    y = addText(`Thanh toan: Hang thang, truoc ngay ${data.paymentDay || '05'} moi thang`, margin, y);
    y += 5;

    // DIEU 3
    y = addText('DIEU 3: THOI HAN THUE', margin, y, { fontSize: 12, fontStyle: 'bold' });
    y += 2;
    y = addText(`Thoi han: ${data.leaseDuration || '12'} thang`, margin, y);
    y = addText(`Tu ngay: ${data.startDate || '...............'}`, margin, y);
    y += 5;

    // DIEU 4
    y = addText('DIEU 4: QUYEN VA NGHIA VU CUA BEN A', margin, y, { fontSize: 12, fontStyle: 'bold' });
    y += 2;
    y = addText('- Ban giao nha dung thoi gian va tinh trang da thoa thuan.', margin, y);
    y = addText('- Dam bao quyen su dung nha hop phap cho Ben B.', margin, y);
    y = addText('- Ho tro Ben B dang ky tam tru tai dia chi thue.', margin, y);
    y = addText('- Khong tang gia thue trong thoi han hop dong.', margin, y);
    y += 5;

    // DIEU 5
    y = addText('DIEU 5: QUYEN VA NGHIA VU CUA BEN B', margin, y, { fontSize: 12, fontStyle: 'bold' });
    y += 2;
    y = addText('- Su dung nha dung muc dich da thoa thuan.', margin, y);
    y = addText('- Thanh toan tien thue day du va dung han.', margin, y);
    y = addText('- Giu gin va bao quan nha o, trang thiet bi.', margin, y);
    y = addText('- Khong duoc cho nguoi khac thue lai khi chua co su dong y cua Ben A.', margin, y);
    y += 5;

    // Check for page break
    if (y > 240) {
        doc.addPage();
        y = 20;
    }

    // DIEU 6
    y = addText('DIEU 6: DIEU KHOAN CHUNG', margin, y, { fontSize: 12, fontStyle: 'bold' });
    y += 2;
    y = addText('- Hai ben cam ket thuc hien dung cac dieu khoan da thoa thuan.', margin, y);
    y = addText('- Moi tranh chap phat sinh se giai quyet thong qua thuong luong.', margin, y);
    y = addText('- Hop dong duoc lap thanh 02 ban, moi ben giu 01 ban co gia tri phap ly nhu nhau.', margin, y);

    if (data.additionalTerms) {
        y += 3;
        y = addText(`Dieu khoan bo sung: ${data.additionalTerms}`, margin, y);
    }
    y += 15;

    // Signatures
    const midX = pageWidth / 2;
    y = addText('BEN CHO THUE (Ben A)', margin + 15, y, { fontSize: 11, fontStyle: 'bold', align: 'center' });
    addText('BEN THUE (Ben B)', midX + 25, y - 7, { fontSize: 11, fontStyle: 'bold', align: 'center' });
    y += 5;
    y = addText('(Ky va ghi ro ho ten)', margin + 15, y, { fontSize: 9, fontStyle: 'italic', align: 'center' });
    addText('(Ky va ghi ro ho ten)', midX + 25, y - 6, { fontSize: 9, fontStyle: 'italic', align: 'center' });

    doc.save(`hop-dong-thue-nha-${Date.now()}.pdf`);
}

export function generateCT01PDF(data) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 15;

    const addText = (text, x, currentY, options = {}) => {
        const { fontSize = 10, fontStyle = 'normal', align = 'left', maxWidth = contentWidth } = options;
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, currentY, { align });
        return currentY + lines.length * (fontSize * 0.45) + 1.5;
    };

    // Header
    y = addText('MAU CT01', pageWidth / 2, y, { fontSize: 10, fontStyle: 'italic', align: 'center' });
    y = addText('(Ban hanh kem theo Thong tu 55/2021/TT-BCA)', pageWidth / 2, y, { fontSize: 8, fontStyle: 'italic', align: 'center' });
    y += 5;
    y = addText('CONG HOA XA HOI CHU NGHIA VIET NAM', pageWidth / 2, y, { fontSize: 13, fontStyle: 'bold', align: 'center' });
    y = addText('Doc lap - Tu do - Hanh phuc', pageWidth / 2, y, { fontSize: 11, fontStyle: 'italic', align: 'center' });
    y += 8;
    y = addText('TO KHAI THAY DOI THONG TIN CU TRU', pageWidth / 2, y, { fontSize: 14, fontStyle: 'bold', align: 'center' });
    y += 8;

    y = addText('Kinh gui: Cong an ' + (data.district || '..............'), margin, y, { fontSize: 11, fontStyle: 'bold' });
    y += 5;

    y = addText('THONG TIN NGUOI KE KHAI:', margin, y, { fontSize: 11, fontStyle: 'bold' });
    y += 3;
    y = addText(`1. Ho va ten: ${data.fullName || '...............'}`, margin, y);
    y = addText(`2. Ngay sinh: ${data.dob || '...............'}`, margin, y);
    y = addText(`3. Gioi tinh: ${data.gender || '...'}      Quoc tich: ${data.nationality || 'Viet Nam'}`, margin, y);
    y = addText(`4. So CCCD/CMND: ${data.idNumber || '...............'}`, margin, y);
    y = addText(`5. So dien thoai: ${data.phone || '...............'}`, margin, y);
    y = addText(`6. Email: ${data.email || '...............'}`, margin, y);
    y += 5;

    y = addText(`7. Noi cu tru hien tai: ${data.currentAddress || '...............'}`, margin, y);
    y = addText(`8. Noi dang ky cu tru moi: ${data.newAddress || '...............'}`, margin, y);
    y += 5;

    y = addText(`9. Ly do thay doi: ${data.reason || 'Thay doi noi cu tru'}`, margin, y);
    y = addText(`10. Ngay bat dau cu tru moi: ${data.moveDate || '...............'}`, margin, y);
    y = addText(`11. Quan he voi chu ho: ${data.relationship || '...............'}`, margin, y);
    y += 5;

    // Additional people
    if (data.additionalPeople && data.additionalPeople.length > 0) {
        y = addText('THONG TIN NGUOI CUNG DANG KY:', margin, y, { fontSize: 11, fontStyle: 'bold' });
        y += 3;
        data.additionalPeople.forEach((p, i) => {
            y = addText(`${i + 1}. ${p.name || '...'} - CCCD: ${p.idNumber || '...'} - Quan he: ${p.relationship || '...'}`, margin, y);
        });
        y += 5;
    }

    y += 10;
    const today = new Date();
    y = addText(`........, ngay ${today.getDate()} thang ${today.getMonth() + 1} nam ${today.getFullYear()}`, pageWidth / 2 + 10, y, { align: 'center' });
    y += 3;
    y = addText('NGUOI KE KHAI', pageWidth / 2 + 10, y, { fontSize: 11, fontStyle: 'bold', align: 'center' });
    y = addText('(Ky va ghi ro ho ten)', pageWidth / 2 + 10, y, { fontSize: 9, fontStyle: 'italic', align: 'center' });

    doc.save(`to-khai-ct01-${Date.now()}.pdf`);
}
