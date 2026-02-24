// PDF generation via browser print window — renders HTML with native fonts,
// so Vietnamese diacritics work correctly without embedding custom font files.
import { ContractData, CT01Data, CT01Person } from '../types';

function openPrintWindow(htmlContent: string, title: string): void {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12.5pt;
      line-height: 1.65;
      color: #000;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .italic { font-style: italic; }
    .underline { text-decoration: underline; }
    .upper { text-transform: uppercase; }
    h1 { font-size: 14pt; text-align: center; text-transform: uppercase; margin: 8pt 0 4pt; }
    h2 { font-size: 12pt; font-weight: bold; margin: 10pt 0 4pt; }
    p { margin: 3pt 0; }
    .separator { border: none; border-top: 1px solid #000; margin: 6pt 0; }
    .section-heading {
      font-weight: bold;
      margin: 10pt 0 4pt;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 30pt;
      text-align: center;
    }
    .sig-block { width: 44%; }
    .sig-label { font-weight: bold; }
    .sig-hint { font-style: italic; font-size: 10pt; color: #333; margin-top: 2pt; }
    .sig-name { margin-top: 40pt; }
  </style>
</head>
<body>
${htmlContent}
<script>
  window.onload = function() {
    window.print();
    window.addEventListener('afterprint', function() { window.close(); });
  };
</script>
</body>
</html>`);
    win.document.close();
}

export function generateContractPDF(data: ContractData): void {
    const TEMPLATE_NAMES: Record<string, string> = {
        'nha-nguyen-can': 'Hợp Đồng Thuê Nhà Nguyên Căn',
        'phong-tro': 'Hợp Đồng Thuê Phòng Trọ',
        'van-phong': 'Hợp Đồng Thuê Văn Phòng',
        'mat-bang': 'Hợp Đồng Thuê Mặt Bằng Kinh Doanh',
    };
    const title = TEMPLATE_NAMES[data.template] || 'Hợp Đồng Thuê Nhà';
    const today = new Date();
    const fmtMoney = (v: string): string => v ? Number(v).toLocaleString('vi-VN') + ' đồng' : '...';

    const html = `
<p class="center bold upper">Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam</p>
<p class="center italic underline">Độc lập - Tự do - Hạnh phúc</p>
<h1>${title}</h1>
<p class="center italic" style="margin-bottom:6pt;">Số: ......../${today.getFullYear()}/HĐTN</p>

<p class="italic">
  Hôm nay, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()},
  tại ${data.propertyAddress || '...............'},
  chúng tôi gồm có:
</p>

<h2>Bên Cho Thuê (Bên A):</h2>
<p>Họ và tên: <strong>${data.landlordName || '...............'}</strong>
  ${data.landlordDob ? `&nbsp;&nbsp;Năm sinh: ${data.landlordDob}` : ''}</p>
<p>CCCD/CMND số: ${data.landlordId || '...'}
  ${data.landlordIdDate ? ` — Ngày cấp: ${data.landlordIdDate}` : ''}
  ${data.landlordIdPlace ? ` — Nơi cấp: ${data.landlordIdPlace}` : ''}</p>
<p>Thường trú: ${data.landlordAddress || '...............'}</p>
<p>Điện thoại: ${data.landlordPhone || '...............'}
  ${data.landlordBank ? `&nbsp;&nbsp;STK: ${data.landlordBank} — ${data.landlordBankName || ''}` : ''}</p>

<h2>Bên Thuê (Bên B):</h2>
<p>Họ và tên: <strong>${data.tenantName || '...............'}</strong>
  ${data.tenantDob ? `&nbsp;&nbsp;Năm sinh: ${data.tenantDob}` : ''}</p>
<p>CCCD/CMND số: ${data.tenantId || '...'}
  ${data.tenantIdDate ? ` — Ngày cấp: ${data.tenantIdDate}` : ''}
  ${data.tenantIdPlace ? ` — Nơi cấp: ${data.tenantIdPlace}` : ''}</p>
<p>Thường trú: ${data.tenantAddress || '...............'}</p>
<p>Điện thoại: ${data.tenantPhone || '...............'}</p>

<p class="italic" style="margin:8pt 0;">
  Hai bên thỏa thuận ký kết hợp đồng thuê nhà với các điều khoản sau:
</p>

<hr class="separator"/>

<p class="section-heading">Điều 1: Đối tượng hợp đồng</p>
<p>Bên A đồng ý cho Bên B thuê tài sản tại địa chỉ: <strong>${data.propertyAddress || '...'}</strong></p>
<p>• Diện tích: ${data.propertyArea || '...'} m²${data.propertyFloors ? ` &nbsp;• Số tầng: ${data.propertyFloors}` : ''}${data.propertyRooms ? ` &nbsp;• Số phòng: ${data.propertyRooms}` : ''}</p>
<p>• Mục đích sử dụng: ${data.purpose || 'Để ở'}</p>
${data.propertyDescription ? `<p>• Tình trạng: ${data.propertyDescription}</p>` : ''}
${data.propertyEquipment ? `<p>• Trang thiết bị bàn giao: ${data.propertyEquipment}</p>` : ''}

<p class="section-heading">Điều 2: Giá thuê và phương thức thanh toán</p>
<p>• Giá thuê: <strong>${fmtMoney(data.rentAmount)}</strong>/tháng${data.rentAmountWords ? ` (${data.rentAmountWords})` : ''}</p>
<p>• Tiền đặt cọc: ${fmtMoney(data.depositAmount)}${data.depositAmountWords ? ` (${data.depositAmountWords})` : ''}</p>
<p>• Thanh toán: ${data.paymentMethod || 'Tiền mặt hoặc chuyển khoản'}, trước ngày ${data.paymentDay || '05'} mỗi tháng</p>
<p>• Tiền đặt cọc được hoàn trả khi Bên B trả nhà đúng hạn và không vi phạm hợp đồng</p>
${data.electricRate || data.waterRate ? `
<p>• Chi phí khác:${data.electricRate ? ` Điện ${Number(data.electricRate).toLocaleString('vi-VN')} VND/kWh;` : ''}${data.waterRate ? ` Nước ${Number(data.waterRate).toLocaleString('vi-VN')} VND/m³;` : ''}${data.internetCost ? ` Internet ${Number(data.internetCost).toLocaleString('vi-VN')} VND/tháng;` : ''}${data.otherCosts ? ` Khác: ${data.otherCosts}` : ''}</p>` : ''}

<p class="section-heading">Điều 3: Thời hạn thuê</p>
<p>• Thời hạn: ${data.leaseDuration || '12'} tháng, từ ngày ${data.startDate || '...'} đến ngày ${data.endDate || '...'}</p>
<p>• Chấm dứt trước hạn: thông báo bằng văn bản trước ít nhất ${data.noticePeriod || '30'} ngày</p>

<p class="section-heading">Điều 4: Quyền và nghĩa vụ của Bên A</p>
<p>4.1. Giao nhà cho Bên B đúng thời gian và tình trạng đã thỏa thuận</p>
<p>4.2. Đảm bảo quyền sử dụng nhà hợp pháp, ổn định cho Bên B trong suốt thời hạn hợp đồng</p>
<p>4.3. Hỗ trợ Bên B đăng ký tạm trú tại địa chỉ thuê</p>
<p>4.4. Không tăng giá thuê trong thời hạn hợp đồng</p>
<p>4.5. Thực hiện nghĩa vụ tài chính với Nhà nước theo quy định pháp luật</p>

<p class="section-heading">Điều 5: Quyền và nghĩa vụ của Bên B</p>
<p>5.1. Sử dụng nhà đúng mục đích đã thỏa thuận (${data.purpose || 'Để ở'})</p>
<p>5.2. Thanh toán đầy đủ tiền thuê và các chi phí khác đúng hạn</p>
<p>5.3. Giữ gìn, bảo quản nhà và trang thiết bị; bồi thường nếu làm hư hỏng</p>
<p>5.4. Không tự ý sửa chữa, cải tạo khi chưa có sự đồng ý bằng văn bản của Bên A</p>
<p>5.5. Không cho thuê lại, chuyển nhượng hợp đồng khi chưa có sự đồng ý của Bên A</p>
<p>5.6. Trả lại nhà khi hết hạn hoặc chấm dứt hợp đồng đúng tình trạng ban đầu</p>

<p class="section-heading">Điều 6: Điều khoản chung</p>
<p>6.1. Hai bên cam kết thực hiện đúng các điều khoản đã thỏa thuận</p>
<p>6.2. Mọi tranh chấp giải quyết thông qua thương lượng; nếu không thống nhất sẽ đưa ra Tòa án nhân dân có thẩm quyền</p>
<p>6.3. Hợp đồng được lập thành 02 bản, mỗi bên giữ 01 bản, có giá trị pháp lý như nhau</p>
<p>6.4. Hợp đồng có hiệu lực kể từ ngày ${data.startDate || '...'}</p>
${data.additionalTerms ? `
<p class="section-heading">Điều khoản bổ sung</p>
<p>${data.additionalTerms}</p>` : ''}

<div class="signatures">
  <div class="sig-block">
    <p class="sig-label">BÊN CHO THUÊ (Bên A)</p>
    <p class="sig-hint">(Ký và ghi rõ họ tên)</p>
    <p class="sig-name">${data.landlordName || ''}</p>
  </div>
  <div class="sig-block">
    <p class="sig-label">BÊN THUÊ (Bên B)</p>
    <p class="sig-hint">(Ký và ghi rõ họ tên)</p>
    <p class="sig-name">${data.tenantName || ''}</p>
  </div>
</div>`;

    openPrintWindow(html, title);
}

export function generateCT01PDF(data: CT01Data): void {
    const title = 'Tờ Khai Thay Đổi Thông Tin Cư Trú (CT01)';
    const today = new Date();

    const additionalPeopleHtml = data.additionalPeople && data.additionalPeople.length > 0
        ? `<p class="section-heading">Người cùng đăng ký:</p>
           ${data.additionalPeople.map((p: CT01Person, i: number) =>
               `<p>${i + 1}. ${p.name || '...'} — CCCD: ${p.idNumber || '...'} — Quan hệ: ${p.relationship || '...'}</p>`
           ).join('')}`
        : '';

    const html = `
<p class="center italic" style="font-size:10pt;">Mẫu CT01</p>
<p class="center italic" style="font-size:9pt;">(Ban hành kèm theo Thông tư 55/2021/TT-BCA)</p>
<br>
<p class="center bold upper">Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam</p>
<p class="center italic underline">Độc lập - Tự do - Hạnh phúc</p>
<h1>Tờ Khai Thay Đổi Thông Tin Cư Trú</h1>
<br>
<p><strong>Kính gửi:</strong> Công an ${data.district || '...............'}</p>
<br>
<p class="section-heading">Thông Tin Người Kê Khai:</p>
<p>1. Họ và tên: <strong>${data.fullName || '...............'}</strong></p>
<p>2. Ngày sinh: ${data.dob || '...............'}
   &nbsp;&nbsp; Giới tính: ${data.gender || '...'}
   &nbsp;&nbsp; Quốc tịch: ${data.nationality || 'Việt Nam'}</p>
<p>3. Số CCCD/CMND: ${data.idNumber || '...............'}</p>
<p>4. Số điện thoại: ${data.phone || '...............'}
   ${data.email ? `&nbsp;&nbsp; Email: ${data.email}` : ''}</p>
<br>
<p>5. Nơi cư trú hiện tại: ${data.currentAddress || '...............'}</p>
<p>6. Nơi đăng ký cư trú mới: <strong>${data.newAddress || '...............'}</strong></p>
<p>7. Lý do thay đổi: ${data.reason || 'Thay đổi nơi cư trú'}</p>
<p>8. Ngày bắt đầu cư trú mới: ${data.moveDate || '...............'}</p>
<p>9. Quan hệ với chủ hộ: ${data.relationship || '...............'}</p>
${additionalPeopleHtml}
<br>
<p class="center" style="margin-top:8pt;">
  ........, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}
</p>
<div class="signatures" style="justify-content:flex-end;">
  <div class="sig-block">
    <p class="sig-label">Người Kê Khai</p>
    <p class="sig-hint">(Ký và ghi rõ họ tên)</p>
    <p class="sig-name">${data.fullName || ''}</p>
  </div>
</div>`;

    openPrintWindow(html, title);
}
