import { useState, useCallback, useEffect, useRef, ChangeEvent } from 'react';
import { showToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import { FormInput } from '../components/FormField';
import ScanReviewModal from '../components/ScanReviewModal';
import FieldSelectorModal from '../components/FieldSelectorModal';
import {
    generateMilitaryDoc,
    renderDocxPreview,
    extractTags,
    scanDuplicateTexts,
    createTemplateWithTags,
    fillTemplate,
    isLikelyNoise,
    groupSimilarValues,
    classifyFieldType,
    contextLabelToTag,

    FIELD_CATEGORY_INFO,
} from '../utils/militaryDocGenerator';
import DocxPreview from '../components/DocxPreview';
import OnboardingTour from '../components/OnboardingTour';
import { evaluateFormula, isValidFormula } from '../utils/formulaEvaluator';
import { hasGoogleApiKey, uploadToDrive, openSheetsWithData } from '../utils/googleApi';
import {
    scanExcelDuplicates,
    extractExcelTags,
    createExcelTemplate,
    renderExcelPreview,
    generateExcelDoc,
    readExcelData,
    mapExcelToTags,
} from '../utils/excelTemplateGenerator';
import type { ScanResult } from '../utils/militaryDocGenerator';
import { numberToVietnamese } from '../utils/numberToVietnamese';
import {
    saveSession, loadSession, listSessions, deleteSession,
    exportSessionToJSON, importFromJSON, getAutoSaveId, setAutoSaveId,
    type SavedSession,
} from '../utils/templateStorage';
import {
    saveContractor, listContractors, deleteContractor,
    contractorToFormData, formDataToContractor,
    type Contractor,
} from '../utils/contractorStorage';
import { saveProject, createProjectFromFormData } from '../utils/projectStorage';
import { scanWordTables, fillWordTable, calculateTableData, type TableInfo, type TableConfig, type TableColumn } from '../utils/wordTableUtils';
import TableSetupModal from '../components/TableSetupModal';
import TableEditor from '../components/TableEditor';
import html2pdf from 'html2pdf.js';
import BatchExportPanel from '../components/BatchExportPanel';

/* ── Template library ── */
const TEMPLATE_LIBRARY = [
    { name: 'Mẫu mặc định (Nhà tập thể)', file: 'template_nha_tap_the.docx', desc: 'Hồ sơ sửa chữa nhà tập thể' },
];

/* ── Guide HTML ── */
const S = 'style';
const H = (t: string) => `<h3 ${S}="color:#10b981;margin:1.5rem 0 0.5rem;border-bottom:2px solid #d1fae5;padding-bottom:0.3rem">${t}</h3>`;
const EX = (t: string) => `<div ${S}="background:#f0fdf4;border-left:3px solid #10b981;padding:0.5rem 0.8rem;margin:0.4rem 0;font-size:13px;border-radius:0 6px 6px 0"><b>📌 Ví dụ:</b> ${t}</div>`;
const TIP = (t: string) => `<div ${S}="background:#eff6ff;border-left:3px solid #3b82f6;padding:0.5rem 0.8rem;margin:0.4rem 0;font-size:13px;border-radius:0 6px 6px 0"><b>💡 Mẹo:</b> ${t}</div>`;
const STEPS = (...s: string[]) => `<ol ${S}="margin:0.3rem 0;padding-left:1.5rem;font-size:14px">${s.map(x => `<li ${S}="margin:0.2rem 0">${x}</li>`).join('')}</ol>`;

const GUIDE_HTML = `
<h2 ${S}="text-align:center;color:#10b981;margin-bottom:0.5rem">📖 Hướng dẫn sử dụng TạoHồSơ</h2>
<p ${S}="text-align:center;color:#64748b;font-size:14px;margin-bottom:1.5rem">Nhập thông tin một lần — xuất file Word / Excel đầy đủ mẫu biểu</p>

<table border="1" cellpadding="6" cellspacing="0" ${S}="border-collapse:collapse;width:100%;font-size:13px;border-color:#e2e8f0;margin-bottom:1.5rem">
<tr ${S}="background:#f0fdf4"><th>#</th><th>Tính năng</th><th>Mô tả ngắn</th></tr>
<tr><td>1</td><td>📤 Tải mẫu</td><td>Upload Word/Excel → tự quét trường</td></tr>
<tr><td>2</td><td>🔍 Quét bảng</td><td>Nhận diện bảng → cấu hình cột → nhập liệu</td></tr>
<tr><td>3</td><td>📝 Điền form</td><td>Nhập dữ liệu → preview realtime</td></tr>
<tr><td>4</td><td>💰 Số→Chữ</td><td>292.000.000 → "Hai trăm chín mươi hai triệu đồng"</td></tr>
<tr><td>5</td><td>🏢 Nhà thầu</td><td>Lưu/chọn nhanh thông tin Bên B</td></tr>
<tr><td>6</td><td>💾 Auto-save</td><td>Tự lưu liên tục, không mất data</td></tr>
<tr><td>7</td><td>✏️ Đổi tên</td><td>Sửa tên phiên đã lưu</td></tr>
<tr><td>8</td><td>📋 Nhân bản</td><td>Copy hồ sơ → sửa vài chi tiết</td></tr>
<tr><td>9</td><td>⚠️ Validation</td><td>Kiểm tra trường bắt buộc</td></tr>
<tr><td>10</td><td>📐 Dự toán</td><td>Bảng tính KL×ĐG → tổng auto-fill</td></tr>
<tr><td>11</td><td>📥 Xuất Word</td><td>File .docx giữ đúng format</td></tr>
<tr><td>12</td><td>📄 Xuất PDF</td><td>Tạo PDF từ preview</td></tr>
<tr><td>13</td><td>📦 Xuất hàng loạt</td><td>N dòng Excel → ZIP chứa N file Word</td></tr>
<tr><td>14</td><td>📊 Import Excel</td><td>1 dòng Excel → điền vào form</td></tr>
<tr><td>15</td><td>📱 PWA</td><td>Cài app, dùng offline</td></tr>
</table>

<hr ${S}="border:none;border-top:2px solid #e2e8f0;margin:1rem 0">
<h2 ${S}="color:#1e293b;text-align:center">📋 Chi tiết từng tính năng</h2>

${H('1. 📤 Tải mẫu Word/Excel')}
<p>Upload file mẫu có chứa <code>{TÊN_TRƯỜNG}</code> — hệ thống tự tạo form nhập liệu.</p>
${STEPS(
    'Bấm <b>📤 Tải mẫu khác</b>',
    'Chọn file <b>.docx</b> hoặc <b>.xlsx</b>',
    'Hệ thống quét tìm <code>{tag}</code> hoặc giá trị lặp lại → hiện modal chọn trường',
    'Tick ✅ trường muốn dùng → bấm <b>Xác nhận</b> → form tự tạo'
)}
${EX('File Word có <code>{CÔNG_TRÌNH}</code>, <code>{SỐ_TIỀN}</code>, <code>{NĂM}</code> → form hiện 3 ô nhập tương ứng')}
${TIP('Dùng cú pháp <code>{TÊN_TRƯỜNG}</code> trong Word để đánh dấu. VD: <code>{ĐƠN_VỊ}</code>, <code>{NGÀY_THÁNG}</code>')}

${H('2. 🔍 Quét bảng tự động')}
<p>Khi file Word có bảng → hệ thống nhận diện và cho phép nhập dữ liệu vào bảng.</p>
${STEPS(
    'Upload Word có bảng → modal <b>⚙️ Cấu hình cột</b> hiện ra',
    'Với mỗi cột, chọn chế độ:<br>• <b>✏️ Nhập tay</b> — bạn gõ<br>• <b>🔢 Tự đánh số</b> — STT tăng dần<br>• <b>🧮 Tự tính</b> — nhập công thức',
    'Bấm <b>✅ Xác nhận</b> → bảng nhập liệu hiện ra',
    'Nhập dữ liệu → xuất file → bảng Word tự điền'
)}
${EX('Bảng có cột: TT | Danh mục | ĐVT | KL | ĐG | Thành tiền<br>→ Cấu hình: TT=🔢 tự đánh | Thành tiền=🧮 công thức <code>KL * ĐG</code>')}
${TIP('Nếu nhập <b>nhiều hơn</b> số dòng mẫu → <b>tự thêm dòng</b>. Nhập <b>ít hơn</b> → <b>tự xóa dòng thừa</b>. Font <b>Times New Roman</b> tự động.')}

${H('3. 📝 Điền form & Preview')}
<p>Nhập dữ liệu vào các trường → preview bên phải cập nhật realtime.</p>
${STEPS(
    'Nhập vào từng ô trên form bên trái',
    'Preview bên phải tự cập nhật khi bạn gõ',
    'Giãn/thu preview bằng nút <b>+ / −</b> zoom'
)}
${EX('Nhập ô "Công trình": <code>Nhà tập thể A</code> → preview hiện ngay "Nhà tập thể A" ở đúng vị trí trong mẫu')}

${H('4. 💰 Số tiền → Bằng chữ')}
<p>Tự động chuyển số tiền sang tiếng Việt.</p>
${EX('Nhập: <code>292.000.000</code> → Kết quả: <b>"Hai trăm chín mươi hai triệu đồng"</b><br>Nhập: <code>1.500.000</code> → <b>"Một triệu năm trăm nghìn đồng"</b>')}
${TIP('Chỉ cần nhập số (có hoặc không có dấu chấm). Ô "Bằng chữ" tự động cập nhật.')}

${H('5. 🏢 Quản lý nhà thầu')}
<p>Lưu thông tin nhà thầu thường dùng, chọn nhanh khi cần.</p>
${STEPS(
    'Nhập đủ thông tin Bên B (tên, MST, đại diện, chức vụ, tài khoản, ngân hàng, địa chỉ)',
    'Bấm <b>💾 Lưu NT</b> → nhà thầu được lưu vĩnh viễn',
    'Lần sau: bấm <b>📋 Chọn NT</b> → click tên → <b>7 trường tự điền</b>',
    'Bấm <b>✕</b> để xóa nhà thầu không cần'
)}
${EX('Lưu "Công ty TNHH ABC" → lần sau chỉ cần 1 click để điền MST, TK ngân hàng, người đại diện...')}

${H('6. 💾 Auto-save & Quản lý phiên')}
<p>Không bao giờ mất dữ liệu.</p>
${STEPS(
    '<b>Auto-save</b>: tự lưu mỗi 2 giây. Đóng tab → mở lại → data còn nguyên',
    '<b>📂 Mẫu đã lưu</b>: xem danh sách tất cả phiên. Click để chuyển phiên',
    '<b>💾 Sao lưu</b>: tải file <code>.json</code> về máy (backup)',
    '<b>📂 Khôi phục</b>: chọn file <code>.json</code> để phục hồi dữ liệu'
)}
${TIP('Mỗi khi upload mẫu mới → tạo phiên mới. Các phiên cũ vẫn giữ nguyên.')}

${H('7. ✏️ Đổi tên phiên đã lưu')}
${STEPS(
    'Bấm <b>📂 Mẫu đã lưu</b> → danh sách hiện ra',
    'Bấm <b>✏️</b> bên phải tên phiên',
    'Nhập tên mới → OK → cập nhật ngay'
)}
${EX('"MUA SẮM DOANH CỤ gửi nhà thầu.docx (bản sao)" → đổi thành "MS Doanh cụ - CT XYZ"')}

${H('8. 📋 Nhân bản hồ sơ')}
<p>Copy toàn bộ hồ sơ hiện tại → sửa ít, xuất file mới.</p>
${STEPS(
    'Bấm <b>📋 Nhân bản</b> ở thanh hành động',
    'Bản sao tạo ra với tên <code>"... (bản sao)"</code>',
    'Sửa vài trường cần thay đổi → xuất file'
)}
${EX('Hoàn thành hồ sơ Nhà A → nhân bản → chỉ sửa tên công trình + số tiền → xuất hồ sơ Nhà B. <b>Nhanh gấp 10 lần!</b>')}

${H('9. ⚠️ Validation (Kiểm tra bắt buộc)')}
<p>Đảm bảo không quên điền trường quan trọng.</p>
${STEPS(
    'Bấm <b>📥 Xuất file</b> khi chưa điền đủ',
    'Hệ thống cảnh báo + <b>viền đỏ</b> trường thiếu',
    'Điền đủ → viền đỏ tự mất → xuất file bình thường'
)}
${EX('3 trường bắt buộc: <b>Công trình</b>, <b>Số tiền</b>, <b>Năm</b>. Quên điền 1 trường → viền đỏ nhấp nháy.')}

${H('10. 📐 Dự toán chi tiết')}
<p>Bảng tính nhỏ tích hợp — tự tính thành tiền và tổng.</p>
${STEPS(
    'Bấm <b>📐 Dự toán chi tiết</b> → mở bảng tính',
    'Nhập: Hạng mục | ĐVT | Khối lượng | Đơn giá',
    '<b>Thành tiền</b> = KL × ĐG (tự tính)',
    'Bấm <b>➕ Thêm dòng</b> nếu cần thêm',
    '<b>Tổng</b> tự điền vào ô "Số tiền" và "Bằng chữ"'
)}
${EX('Nhập: Bàn trợ lý | Cái | 2 | 7.500.000<br>→ Thành tiền tự tính: <b>15.000.000</b><br>→ Tổng tất cả hạng mục auto-fill vào ô "Số tiền"')}

${H('11. 📥 Xuất Word (.docx)')}
${STEPS(
    'Bấm <b>📥 Xuất file Word</b>',
    'File <code>.docx</code> tải về với dữ liệu đã điền',
    'Bảng: dòng thừa tự xóa, dòng thiếu tự thêm, font <b>Times New Roman</b>'
)}
${TIP('File xuất ra giữ <b>100% format</b> gốc (viền, màu, header, footer...)')}

${H('12. 📄 Xuất PDF')}
${STEPS(
    'Bấm <b>📄 Xuất PDF</b>',
    'Tạo file PDF từ preview hiện tại, khổ A4'
)}
${TIP('PDF có thể hơi khác Word về bảng/font. Nên ưu tiên xuất Word nếu cần chính xác 100%.')}

${H('13. 📦 Xuất hàng loạt (ZIP)')}
<p>Tạo hàng loạt file Word từ 1 file Excel.</p>
${STEPS(
    'Bấm <b>📦 Xuất hàng loạt</b>',
    'Chọn file Excel — <b>mỗi dòng = 1 công trình</b>',
    'Preview hiện danh sách N công trình',
    'Bấm <b>📦 Xuất tất cả</b> → tải 1 file <code>.zip</code> chứa N file Word'
)}
${EX('File Excel có 20 dòng (20 công trình) → bấm 1 nút → tải về <code>HoSo_HangLoat_20_files.zip</code> chứa 20 file Word đã điền đầy đủ.')}
<div ${S}="background:#fef3c7;border-left:3px solid #f59e0b;padding:0.5rem 0.8rem;margin:0.4rem 0;font-size:13px;border-radius:0 6px 6px 0">
<b>⚠️ Yêu cầu Excel:</b> Hàng 1 = tiêu đề cột (Công trình, Số tiền, Năm...). Hàng 2+ = dữ liệu.
</div>

${H('14. 📊 Import dữ liệu từ Excel')}
<p>Điền form nhanh từ file Excel (1 dòng).</p>
${STEPS(
    'Bấm <b>📊 Nhập từ Excel</b> trong panel "Quản lý dữ liệu"',
    'Chọn file Excel → hệ thống tự khớp cột → điền vào form'
)}
${EX('Excel có cột "Công trình" = "Nhà A", "Số tiền" = "150.000.000" → form tự điền 2 trường đó.')}
${TIP('Khác <b>Xuất hàng loạt</b>: Import chỉ điền 1 dòng vào form hiện tại, không tạo nhiều file.')}

${H('15. 📱 PWA — Cài app & Dùng offline')}
<p>Dùng web như app native, hoạt động cả khi mất mạng.</p>
${STEPS(
    '<b>Trên ĐT:</b> Mở Chrome → menu ⋮ → "Thêm vào màn hình chính"',
    '<b>Trên PC:</b> Thanh địa chỉ Chrome → icon 📥 → "Cài đặt"',
    'App hiện trên home/desktop, mở như app bình thường',
    '<b>Offline:</b> sau lần mở đầu, dùng được cả khi mất mạng'
)}
${TIP('Data lưu trong IndexedDB trên thiết bị → không mất khi offline.')}

<hr ${S}="border:none;border-top:2px solid #e2e8f0;margin:1.5rem 0 1rem">
<p ${S}="text-align:center;color:#64748b;font-size:13px">💡 Bấm <b>📝 Điền mẫu thử</b> trên form để xem nhanh các tính năng hoạt động.</p>
`;/* ── Estimate config (for dự toán chi tiết) ── */
const ESTIMATE_COLUMNS: TableColumn[] = [
    { index: 0, header: 'STT', type: 'auto_number' },
    { index: 1, header: 'Hạng mục', type: 'manual' },
    { index: 2, header: 'ĐVT', type: 'manual' },
    { index: 3, header: 'Khối lượng', type: 'manual' },
    { index: 4, header: 'Đơn giá', type: 'manual' },
    { index: 5, header: 'Thành tiền', type: 'auto_calc', formula: 'KHOI_LUONG * DON_GIA' },
];

/* ── Human-friendly labels for known MERGEFIELD tags ── */
const TAG_LABELS: Record<string, string> = {
    'NĂM': 'Năm',
    'SỐ_TIỀN': 'Số tiền (đồng)',
    'ST_BẰNG_CHỮ': 'Số tiền bằng chữ',
    'NGUỒN_KINH_PHÍ': 'Nguồn kinh phí',
    'CHT': 'Chỉ huy trưởng (cấp bậc + họ tên)',
    'CN_HCKT': 'CN HC-KT (cấp bậc + họ tên)',
    'BTC': 'BTC (cấp bậc + họ tên)',
    'BTC_2': 'BTC ghi sổ (cấp bậc + họ tên)',
    'CÔNG_TRÌNH': 'Tên công trình',
    'HẠNG_MỤC': 'Hạng mục sửa chữa',
    'KLTH': 'Khối lượng thực hiện',
    'TÊN_NHÀ_THẦU': 'Tên nhà thầu (Bên B)',
    'ĐẠI_DIỆN_NHÀ_THẦU': 'Đại diện nhà thầu',
    'CHỨC_VỤ_NHÀ_THẦU': 'Chức vụ đại diện',
    'SĐT_NHÀ_THẦU': 'SĐT nhà thầu',
    'MÃ_SỐ_THUẾ': 'Mã số thuế',
    'STK_NHÀ_THẦU': 'Số tài khoản nhà thầu',
    'NGÂN_HÀNG': 'Tại ngân hàng',
    'ĐỊA_CHỈ': 'Địa chỉ (Quy Nhơn, Bình Định)',
};

/* ── Random generic placeholders (not real data) ── */
const TAG_PLACEHOLDERS: Record<string, string> = {
    'NĂM': '2026',
    'SỐ_TIỀN': '185.000.000',
    'ST_BẰNG_CHỮ': 'Một trăm tám mươi lăm triệu đồng',
    'NGUỒN_KINH_PHÍ': 'NSQP2026',
    'CHT': 'Đại tá Nguyễn Văn A',
    'CN_HCKT': 'Trung tá Trần Văn B',
    'BTC': 'Trung úy Lê Văn C',
    'BTC_2': 'Trung tá CN Phạm Thị D',
    'CÔNG_TRÌNH': 'Sở Chỉ huy BĐBP tỉnh',
    'HẠNG_MỤC': 'Sửa chữa hệ thống cửa, chống thấm',
    'KLTH': 'Sửa chữa hệ thống cửa, chống thấm Nhà ở CBCS',
    'TÊN_NHÀ_THẦU': 'Công ty TNHH Xây dựng ABC',
    'ĐẠI_DIỆN_NHÀ_THẦU': 'Nguyễn Văn E',
    'CHỨC_VỤ_NHÀ_THẦU': 'Giám đốc',
    'SĐT_NHÀ_THẦU': '0912.345.678',
    'MÃ_SỐ_THUẾ': '4101234567',
    'STK_NHÀ_THẦU': '001234567890',
    'NGÂN_HÀNG': 'Vietcombank chi nhánh Bình Định',
    'ĐỊA_CHỈ': 'Quy Nhơn, Bình Định',
};

/* ── Group tags for layout ── */
const TAG_GROUPS = [
    {
        icon: '🏛️',
        title: 'Thông tin chung',
        tags: ['NĂM', 'CÔNG_TRÌNH', 'HẠNG_MỤC', 'KLTH', 'NGUỒN_KINH_PHÍ', 'ĐỊA_CHỈ'],
        rows: [
            ['NĂM', 'NGUỒN_KINH_PHÍ'],
            ['CÔNG_TRÌNH', 'HẠNG_MỤC'],
            ['KLTH', 'ĐỊA_CHỈ'],
        ],
    },
    {
        icon: '💰',
        title: 'Tài chính',
        tags: ['SỐ_TIỀN', 'ST_BẰNG_CHỮ'],
        rows: [['SỐ_TIỀN', 'ST_BẰNG_CHỮ']],
    },
    {
        icon: '👤',
        title: 'Nhân sự — Lãnh đạo ký',
        tags: ['CHT', 'CN_HCKT', 'BTC', 'BTC_2'],
        rows: [['CHT', 'CN_HCKT'], ['BTC', 'BTC_2']],
    },
    {
        icon: '🏢',
        title: 'Nhà thầu (Bên B)',
        tags: ['TÊN_NHÀ_THẦU', 'ĐẠI_DIỆN_NHÀ_THẦU', 'CHỨC_VỤ_NHÀ_THẦU', 'SĐT_NHÀ_THẦU', 'MÃ_SỐ_THUẾ', 'STK_NHÀ_THẦU', 'NGÂN_HÀNG'],
        rows: [
            ['TÊN_NHÀ_THẦU', 'ĐẠI_DIỆN_NHÀ_THẦU'],
            ['CHỨC_VỤ_NHÀ_THẦU', 'SĐT_NHÀ_THẦU'],
            ['MÃ_SỐ_THUẾ', 'STK_NHÀ_THẦU'],
            ['NGÂN_HÀNG'],
        ],
    },
];

type FormChangeEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

export default function MilitaryDocForm() {
    const navigate = useNavigate();
    const [data, setData] = useState<Record<string, string>>({ NĂM: '2026' });
    const [loading, setLoading] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Template state
    const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
    const [templateName, setTemplateName] = useState('Mẫu mặc định (Nhà tập thể)');
    const [templateTags, setTemplateTags] = useState<string[]>([]);
    const [isCustomTemplate, setIsCustomTemplate] = useState(false);
    const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
    const [fileType, setFileType] = useState<'word' | 'excel'>('word');

    // Scan modal state
    const [showScanModal, setShowScanModal] = useState(false);
    const [scanResults, setScanResults] = useState<ScanResult[]>([]);
    const [rawUploadBuffer, setRawUploadBuffer] = useState<ArrayBuffer | null>(null);
    const [rawUploadName, setRawUploadName] = useState('');
    const [hasBracketTags, setHasBracketTags] = useState(false);

    // Preview state
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewReady, setPreviewReady] = useState(false);
    const [zoom, setZoom] = useState(50);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const jsonInputRef = useRef<HTMLInputElement>(null);
    const excelDataInputRef = useRef<HTMLInputElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Auto-save & session state
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
    const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [showSessions, setShowSessions] = useState(false);
    const autoSaveRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Contractor state
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [showContractorPicker, setShowContractorPicker] = useState(false);

    // Export history
    const [exportHistory, setExportHistory] = useState<{ date: string; type: string }[]>([]);
    const [showBatchExport, setShowBatchExport] = useState(false);
    const [sessionSearch, setSessionSearch] = useState('');

    // New features
    const [previewBuffer, setPreviewBuffer] = useState<ArrayBuffer | null>(null);
    const [previewDocName, setPreviewDocName] = useState('');
    const [showTour, setShowTour] = useState(false);
    const [formulas, setFormulas] = useState<Record<string, string>>({});
    const [activeFormulaTag, setActiveFormulaTag] = useState<string | null>(null);
    const [fieldSearch, setFieldSearch] = useState('');

    // Validation
    const REQUIRED_TAGS = ['CÔNG_TRÌNH', 'SỐ_TIỀN', 'NĂM'];
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Estimate (dự toán chi tiết)
    const [showEstimate, setShowEstimate] = useState(false);
    const ESTIMATE_CONFIG: TableConfig = { tableIndex: -1, columns: ESTIMATE_COLUMNS };
    const [estimateData, setEstimateData] = useState<string[][]>([ESTIMATE_COLUMNS.map(() => '')]);

    // Table state (multi-table support)
    const [detectedTables, setDetectedTables] = useState<TableInfo[]>([]);
    const [showTableSetup, setShowTableSetup] = useState(false);
    const [tableConfigs, setTableConfigs] = useState<Record<number, TableConfig>>({});
    const [tableDataMap, setTableDataMap] = useState<Record<number, string[][]>>({});

    const zoomIn = () => setZoom(z => Math.min(z + 10, 150));
    const zoomOut = () => setZoom(z => Math.max(z - 10, 30));
    const zoomFit = () => setZoom(50);

    // Load saved session or default template on mount
    useEffect(() => {
        (async () => {
            // Try to restore auto-saved session
            const autoId = getAutoSaveId();
            if (autoId) {
                try {
                    const session = await loadSession(autoId);
                    if (session) {
                        setTemplateBuffer(session.templateBuffer);
                        setTemplateName(session.name);
                        setTemplateTags(session.tags);
                        setIsCustomTemplate(session.isCustomTemplate);
                        setCustomLabels(session.labels);
                        setFileType(session.fileType);
                        setData(session.data);
                        setCurrentSessionId(autoId);
                        setLastSaved(session.updatedAt);
                        // Load sessions list
                        setSavedSessions(await listSessions());
                        return;
                    }
                } catch { /* fall through to default */ }
            }
            // Load default template
            try {
                const res = await fetch('/templates/template_nha_tap_the.docx');
                if (!res.ok) return;
                const buf = await res.arrayBuffer();
                setTemplateBuffer(buf);
                const tags = extractTags(buf);
                setTemplateTags(tags);
            } catch { /* ignore */ }
            // Load sessions list
            try { setSavedSessions(await listSessions()); } catch { /* ignore */ }
            try { setContractors(await listContractors()); } catch { /* ignore */ }
        })();
    }, []);

    // Auto-save debounced
    useEffect(() => {
        if (!templateBuffer) return;
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        autoSaveRef.current = setTimeout(async () => {
            try {
                const id = await saveSession({
                    ...(currentSessionId ? { id: currentSessionId } : {}),
                    name: templateName,
                    templateBuffer,
                    tags: templateTags,
                    labels: customLabels,
                    data,
                    fileType,
                    isCustomTemplate,
                });
                setCurrentSessionId(id);
                setAutoSaveId(id);
                setLastSaved(new Date().toISOString());
                setSavedSessions(await listSessions());
            } catch (err) {
                console.error('[auto-save]', err);
            }
        }, 2000);
        return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
    }, [data, templateBuffer, templateName, templateTags, customLabels, fileType, isCustomTemplate]);

    // Debounced preview update
    useEffect(() => {
        if (!templateBuffer || !previewContainerRef.current) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setPreviewLoading(true);
            try {
                if (fileType === 'excel') {
                    // Excel: render HTML table
                    const html = renderExcelPreview(templateBuffer, data);
                    previewContainerRef.current!.innerHTML = html;
                    // Style the Excel preview tables
                    const tables = previewContainerRef.current!.querySelectorAll('table');
                    tables.forEach(t => {
                        t.style.borderCollapse = 'collapse';
                        t.style.width = '100%';
                        t.style.fontSize = '11px';
                    });
                    const cells = previewContainerRef.current!.querySelectorAll('td,th');
                    cells.forEach(c => {
                        (c as HTMLElement).style.border = '1px solid #d1d5db';
                        (c as HTMLElement).style.padding = '4px 6px';
                    });
                } else {
                    // Word: docx-preview (fill ALL configured tables)
                    let previewBuf = templateBuffer;
                    for (const [ti, cfg] of Object.entries(tableConfigs)) {
                        const tData = tableDataMap[Number(ti)];
                        if (tData && tData.length > 0) {
                            previewBuf = fillWordTable(previewBuf, cfg.tableIndex, tData, cfg.columns.map(c => c.header));
                        }
                    }
                    await renderDocxPreview(previewBuf, data, previewContainerRef.current!);
                }
                setPreviewReady(true);
            } catch (err) {
                console.error('[preview]', err);
                if (previewContainerRef.current) {
                    previewContainerRef.current.innerHTML = '<p style="color:red;text-align:center;padding:2rem">Không thể xem trước file này</p>';
                }
            } finally {
                setPreviewLoading(false);
            }
        }, 600);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [data, templateBuffer, fileType, tableDataMap, tableConfigs]);

    const handleChange = useCallback((e: FormChangeEvent) => {
        const { name, value } = e.target;
        setData((prev) => {
            const next = { ...prev, [name]: value };
            // Auto-fill ST_BẰNG_CHỮ when SỐ_TIỀN changes
            if (name === 'SỐ_TIỀN' && value) {
                const text = numberToVietnamese(value);
                if (text) next['ST_BẰNG_CHỮ'] = text;
            }
            return next;
        });
    }, []);

    const handleExport = async () => {
        if (!templateBuffer) return;
        // Validation
        if (!isCustomTemplate) {
            const errors: Record<string, string> = {};
            REQUIRED_TAGS.forEach(tag => {
                if (templateTags.includes(tag) && !data[tag]?.trim()) {
                    errors[tag] = 'Trường bắt buộc';
                }
            });
            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                showToast(`Vui lòng điền ${Object.keys(errors).length} trường bắt buộc (đánh dấu đỏ)`, 'warning');
                return;
            }
        }
        setFieldErrors({});
        setLoading(true);
        try {
            if (fileType === 'excel') {
                generateExcelDoc(data, templateBuffer);
            } else {
                // Fill ALL configured tables, then fill tags
                let buf = templateBuffer;
                for (const [ti, cfg] of Object.entries(tableConfigs)) {
                    const tData = tableDataMap[Number(ti)];
                    if (tData && tData.length > 0) {
                        buf = fillWordTable(buf, cfg.tableIndex, tData, cfg.columns.map(c => c.header));
                    }
                }
                await generateMilitaryDoc(data, buf);
            }
        } catch (err) {
            showToast('Lỗi khi xuất file: ' + (err as Error).message, 'error');
        } finally {
            setLoading(false);
        }
        // Track export
        setExportHistory(prev => [{ date: new Date().toISOString(), type: fileType }, ...prev].slice(0, 20));
    };

    // Table setup confirm — add ONE table config (can be called multiple times)
    const handleTableConfigConfirm = (config: TableConfig) => {
        setTableConfigs(prev => ({ ...prev, [config.tableIndex]: config }));
        setShowTableSetup(false);
        // Initialize table data from detected table
        const table = detectedTables.find(t => t.tableIndex === config.tableIndex);
        if (table) {
            const rows = Array.from({ length: table.dataRowCount }, () => config.columns.map(() => ''));
            table.allData.forEach((dataRow: string[], ri: number) => {
                if (ri < rows.length) {
                    dataRow.forEach((val: string, ci: number) => {
                        if (ci < rows[ri].length) rows[ri][ci] = val;
                    });
                }
            });
            setTableDataMap(prev => ({ ...prev, [config.tableIndex]: calculateTableData(rows, config.columns) }));
        }
    };

    const handleUploadTemplate = async (e: ChangeEvent<HTMLInputElement>) => {
        let file = e.target.files?.[0];
        if (!file) return;

        // Check for .doc (old format) — try auto-convert on desktop
        if (file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
            if ((window as any).electronAPI?.isDesktop) {
                showToast('Đang chuyển đổi .doc → .docx...', 'info');
                try {
                    const buf = await file.arrayBuffer();
                    const result = await (window as any).electronAPI.convertDoc(file.name, Array.from(new Uint8Array(buf)));
                    if (!result.success) {
                        showToast(result.error || 'Chuyển đổi thất bại.', 'error');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        return;
                    }
                    // Create a new File-like object from converted data
                    const convertedBuf = new Uint8Array(result.data).buffer;
                    const convertedFile = new File([convertedBuf], result.newFileName || file.name.replace(/\.doc$/i, '.docx'), { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                    showToast('✅ Đã chuyển đổi thành công!', 'success');
                    // Use the converted file from here on
                    file = convertedFile;
                } catch (err) {
                    showToast('Lỗi chuyển đổi: ' + (err as Error).message, 'error');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }
            } else {
                showToast('File .doc không đọc được. Vui lòng mở bằng Word → Save As → chọn .docx rồi upload lại.', 'warning');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
        }

        // Check for .xls (old Excel format) — try auto-convert on desktop
        if (file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.xlsx')) {
            if ((window as any).electronAPI?.isDesktop) {
                showToast('Đang chuyển đổi .xls → .xlsx...', 'info');
                try {
                    const buf = await file.arrayBuffer();
                    const result = await (window as any).electronAPI.convertDoc(file.name, Array.from(new Uint8Array(buf)));
                    if (!result.success) {
                        showToast(result.error || 'Chuyển đổi thất bại.', 'error');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        return;
                    }
                    const convertedBuf = new Uint8Array(result.data).buffer;
                    const convertedFile = new File([convertedBuf], result.newFileName || file.name.replace(/\.xls$/i, '.xlsx'), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    showToast('✅ Đã chuyển đổi thành công!', 'success');
                    file = convertedFile;
                } catch (err) {
                    showToast('Lỗi chuyển đổi: ' + (err as Error).message, 'error');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }
            } else {
                showToast('File .xls không đọc được. Vui lòng mở bằng Excel → Save As → chọn .xlsx rồi upload lại.', 'warning');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
        }

        // Detect file type
        const isExcel = /\.xlsx?$/i.test(file.name);

        const buf = await file.arrayBuffer();
        try {
            if (isExcel) {
                // Excel file
                const existingTags = extractExcelTags(buf);
                if (existingTags.length > 0) {
                    setTemplateBuffer(buf);
                    setTemplateName(file.name);
                    setTemplateTags(existingTags);
                    setIsCustomTemplate(true);
                    setFileType('excel');
                    setCustomLabels({});
                    setPreviewReady(false);
                    setData(() => {
                        const d: Record<string, string> = {};
                        existingTags.forEach(t => { d[t] = ''; });
                        return d;
                    });
                } else {
                    const results = scanExcelDuplicates(buf);
                    if (results.length === 0) {
                        showToast('Không tìm thấy giá trị trùng lặp nào trong file Excel.', 'warning');
                        return;
                    }
                    setRawUploadBuffer(buf);
                    setRawUploadName(file.name);
                    setFileType('excel');
                    setScanResults(results);
                    setShowScanModal(true);
                }
            } else {
                // Word file
                const existingTags = extractTags(buf);
                if (existingTags.length > 0) {
                    // Check if tags came from bracket patterns [text]
                    const zip = new (await import('pizzip')).default(buf);
                    const docXml = zip.file('word/document.xml')?.asText() || '';
                    const plainText = docXml.replace(/<[^>]+>/g, '');
                    const bracketMatches = plainText.match(/\[([^\]]{2,})\]/g) || [];
                    
                    if (bracketMatches.length > 0) {
                        // Has [text] brackets → show scan modal for renaming
                        const bracketResults: ScanResult[] = bracketMatches
                            .map(m => m.slice(1, -1).trim())
                            .filter(t => t.length >= 2 && !/^\d+$/.test(t) && t.length <= 200)
                            .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
                            .map(text => ({
                                text,
                                count: (plainText.match(new RegExp('\\[' + text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\]', 'g')) || []).length,
                                locations: ['Placeholder trong template'],
                                suggestedTag: text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_').toUpperCase().slice(0, 40),
                                suggestedLabel: text.length > 30 ? text.slice(0, 30) + '...' : text,
                                selected: true,
                                category: 'data' as const,
                                dataScore: 80,
                                fieldType: 'bracket' as const,
                            }));
                        
                        if (bracketResults.length > 0) {
                            setRawUploadBuffer(buf);
                            setRawUploadName(file.name);
                            setFileType('word');
                            setHasBracketTags(true);
                            setScanResults(bracketResults);
                            setShowScanModal(true);
                        } else {
                            // Curly-brace {tag} only → use directly
                            setTemplateBuffer(buf);
                            setTemplateName(file.name);
                            setTemplateTags(existingTags);
                            setIsCustomTemplate(true);
                            setFileType('word');
                            setCustomLabels({});
                            setData((prev) => {
                                const newData: Record<string, string> = {};
                                existingTags.forEach(tag => { newData[tag] = prev[tag] || ''; });
                                return newData;
                            });
                        }
                    } else {
                        // {tag} placeholders only → use directly (no renaming needed)
                        setTemplateBuffer(buf);
                        setTemplateName(file.name);
                        setTemplateTags(existingTags);
                        setIsCustomTemplate(true);
                        setFileType('word');
                        setCustomLabels({});
                        setData((prev) => {
                            const newData: Record<string, string> = {};
                            existingTags.forEach(tag => { newData[tag] = prev[tag] || ''; });
                            return newData;
                        });
                    }
                } else {
                    const results = scanDuplicateTexts(buf);
                    if (results.length === 0) {
                        showToast('Không tìm thấy giá trị trùng lặp nào trong file Word.', 'warning');
                        return;
                    }
                    setRawUploadBuffer(buf);
                    setRawUploadName(file.name);
                    setFileType('word');
                    setScanResults(results);
                    setShowScanModal(true);
                }
                // Scan for tables in Word file
                try {
                    const tables = scanWordTables(buf);
                    if (tables.length > 0) {
                        setDetectedTables(tables);
                        setShowTableSetup(true);
                    } else {
                        setDetectedTables([]);
                        setTableConfigs({});
                        setTableDataMap({});
                    }
                } catch { setDetectedTables([]); }
            }
        } catch (err) {
            showToast('Lỗi đọc file: ' + (err as Error).message, 'error');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleScanConfirm = (selected: { text: string; tag: string; label: string }[]) => {
        if (!rawUploadBuffer || selected.length === 0) return;

        if (hasBracketTags) {
            // Template already has [text] brackets — just map tags to labels
            // The fillTemplate function already handles [text] → data[TAG] replacement
            const tags = selected.map(s => s.tag);
            const labels: Record<string, string> = {};
            selected.forEach(s => { labels[s.tag] = s.label; });

            setTemplateBuffer(rawUploadBuffer);
            setTemplateName(rawUploadName);
            setTemplateTags(tags);
            setIsCustomTemplate(true);
            setCustomLabels(labels);
            setShowScanModal(false);
            setHasBracketTags(false);
            setPreviewReady(false);

            const newData: Record<string, string> = {};
            tags.forEach(tag => { newData[tag] = ''; });
            setData(newData);
            return;
        }

        // Create template with {tag} placeholders
        const replacements = selected.map(s => ({ text: s.text, tag: s.tag }));
        const newTemplate = fileType === 'excel'
            ? createExcelTemplate(rawUploadBuffer, replacements)
            : createTemplateWithTags(rawUploadBuffer, replacements);

        // Extract tags from the new template
        const tags = fileType === 'excel'
            ? extractExcelTags(newTemplate)
            : extractTags(newTemplate);

        // Save custom labels
        const labels: Record<string, string> = {};
        selected.forEach(s => { labels[s.tag] = s.label; });

        setTemplateBuffer(newTemplate);
        setTemplateName(rawUploadName);
        setTemplateTags(tags);
        setIsCustomTemplate(true);
        setCustomLabels(labels);
        setShowScanModal(false);
        // Keep rawUploadBuffer so user can re-open scan
        setPreviewReady(false);

        // Reset form data
        const newData: Record<string, string> = {};
        tags.forEach(tag => { newData[tag] = ''; });
        setData(newData);
    };

    const handleScanCancel = () => {
        setShowScanModal(false);
    };

    const handleReopenScan = () => {
        if (!rawUploadBuffer) return;
        const results = fileType === 'excel'
            ? scanExcelDuplicates(rawUploadBuffer)
            : scanDuplicateTexts(rawUploadBuffer);
        setScanResults(results);
        setShowScanModal(true);
    };

    const handleResetTemplate = async () => {
        try {
            const res = await fetch('/templates/template_nha_tap_the.docx');
            if (!res.ok) return;
            const buf = await res.arrayBuffer();
            setTemplateBuffer(buf);
            setTemplateName('Mẫu mặc định (Nhà tập thể)');
            setTemplateTags(extractTags(buf));
            setIsCustomTemplate(false);
            setFileType('word');
        } catch { /* ignore */ }
    };

    const handleClear = () => setShowClearConfirm(true);
    const confirmClear = () => {
        setData({ NĂM: '2026' });
        setShowClearConfirm(false);
    };

    // Fill demo data
    const handleFillDemo = () => {
        setData({ ...TAG_PLACEHOLDERS });
        setFieldErrors({});
    };

    // Clone session
    const handleClone = async () => {
        if (!templateBuffer) return;
        try {
            const id = await saveSession({
                name: templateName + ' (bản sao)',
                templateBuffer,
                tags: templateTags,
                labels: customLabels,
                data,
                fileType,
                isCustomTemplate,
            });
            setCurrentSessionId(id);
            setAutoSaveId(id);
            setSavedSessions(await listSessions());
            showToast('Đã nhân bản hồ sơ!', 'success');
        } catch { /* ignore */ }
    };

    // PDF export
    const handleExportPDF = async () => {
        const el = previewContainerRef.current;
        if (!el) return;
        setLoading(true);
        try {
            const filename = `HoSo_${(data['CÔNG_TRÌNH'] || 'document').replace(/\s+/g, '_')}.pdf`;
            await html2pdf().set({
                margin: 5,
                filename,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            }).from(el).save();
            setExportHistory(prev => [...prev, { date: new Date().toISOString(), type: 'PDF' }]);
        } catch (err) {
            showToast('Lỗi xuất PDF: ' + (err as Error).message, 'error');
        }
        setLoading(false);
    };

    // Save to project
    const [showFieldSelector, setShowFieldSelector] = useState(false);

    const handleSaveToProject = () => {
        setShowFieldSelector(true);
    };

    const handleFieldSelectConfirm = async (selectedKeys: string[], projectName: string) => {
        setShowFieldSelector(false);
        try {
            const labels: Record<string, string> = {};
            for (const key of Object.keys(data)) {
                labels[key] = TAG_LABELS[key] || customLabels[key] || key.replace(/_/g, ' ');
            }
            const projectData = createProjectFromFormData(data, currentSessionId ?? undefined, labels);
            projectData.name = projectName;
            projectData.selectedFields = selectedKeys;
            const projectId = await saveProject(projectData);
            showToast('Đã lưu vào dự án!', 'success');
            navigate(`/du-an/${projectId}`);
        } catch (err) {
            showToast('Lỗi: ' + (err as Error).message, 'error');
        }
    };

    // Template library
    const handleSelectTemplate = async (file: string, name: string) => {
        try {
            const res = await fetch(`/templates/${file}`);
            if (!res.ok) return;
            const buf = await res.arrayBuffer();
            setTemplateBuffer(buf);
            setTemplateName(name);
            setTemplateTags(extractTags(buf));
            setIsCustomTemplate(false);
            setFileType('word');
        } catch { /* ignore */ }
    };

    // Contractor management
    const handleSaveContractor = async () => {
        const c = formDataToContractor(data);
        if (!c.name) { showToast('Vui lòng nhập tên nhà thầu trước', 'warning'); return; }
        await saveContractor(c);
        setContractors(await listContractors());
        showToast('Đã lưu nhà thầu: ' + c.name, 'success');
    };

    const handleSelectContractor = (c: Contractor) => {
        setData(prev => ({ ...prev, ...contractorToFormData(c) }));
        setShowContractorPicker(false);
    };

    const handleDeleteContractor = async (id: number) => {
        await deleteContractor(id);
        setContractors(await listContractors());
    };

    // Excel data import
    const handleImportExcelData = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const buf = await file.arrayBuffer();
            const rows = readExcelData(buf);
            if (rows.length === 0) {
                showToast('Không tìm thấy dữ liệu trong file Excel.', 'warning');
                return;
            }
            const labels = isCustomTemplate ? customLabels : TAG_LABELS;
            const mapped = mapExcelToTags(rows[0], templateTags, labels);
            if (Object.keys(mapped).length === 0) {
                showToast('Không khớp được cột nào. Hàng 1 cần chứa tiêu đề khớp tên trường.', 'warning');
                return;
            }
            setData(prev => ({ ...prev, ...mapped }));
            showToast(`Đã nhập ${Object.keys(mapped).length} trường từ Excel!`, 'success');
        } catch (err) {
            alert('❌ Lỗi đọc file: ' + (err as Error).message);
        }
        if (excelDataInputRef.current) excelDataInputRef.current.value = '';
    };

    // JSON export
    const handleExportJSON = async () => {
        if (!currentSessionId) {
            // Save first
            try {
                const id = await saveSession({
                    name: templateName,
                    templateBuffer: templateBuffer!,
                    tags: templateTags,
                    labels: customLabels,
                    data,
                    fileType,
                    isCustomTemplate,
                });
                setCurrentSessionId(id);
                const session = await loadSession(id);
                if (session) exportSessionToJSON(session);
            } catch { /* ignore */ }
        } else {
            const session = await loadSession(currentSessionId);
            if (session) exportSessionToJSON(session);
        }
    };

    // JSON import
    const handleImportJSON = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const imported = await importFromJSON(file);
            setData(imported.data);
            if (imported.labels && Object.keys(imported.labels).length > 0) {
                setCustomLabels(imported.labels);
            }
            if (imported.tags.length > 0) {
                setTemplateTags(imported.tags);
            }
            showToast('Đã khôi phục dữ liệu thành công!', 'success');
        } catch (err) {
            alert('❌ Lỗi đọc file: ' + (err as Error).message);
        }
        if (jsonInputRef.current) jsonInputRef.current.value = '';
    };

    // Load saved session
    const handleLoadSession = async (session: SavedSession) => {
        setTemplateBuffer(session.templateBuffer);
        setTemplateName(session.name);
        setTemplateTags(session.tags);
        setIsCustomTemplate(session.isCustomTemplate);
        setCustomLabels(session.labels);
        setFileType(session.fileType);
        setData(session.data);
        setCurrentSessionId(session.id!);
        setAutoSaveId(session.id!);
        setLastSaved(session.updatedAt);
        setPreviewReady(false);
        setShowSessions(false);
    };

    // Delete saved session
    const handleDeleteSession = async (id: number) => {
        await deleteSession(id);
        setSavedSessions(await listSessions());
        if (currentSessionId === id) setCurrentSessionId(null);
    };

    const sectionStyle: React.CSSProperties = {
        marginBottom: '1.5rem',
        padding: '1.25rem',
        borderRadius: 'var(--radius, 8px)',
        border: '1px solid var(--border, #e2e8f0)',
        background: 'var(--bg, #fff)',
    };

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: '1.05rem',
        fontWeight: 600,
        marginBottom: '0.75rem',
        paddingBottom: '0.4rem',
        borderBottom: '2px solid var(--primary, #4f46e5)',
        color: 'var(--primary, #4f46e5)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    };

    /* ── Render form fields ── */
    const renderFormFields = () => {
        if (isCustomTemplate) {
            // Custom template: auto-generate simple list of fields
            return (
                <div style={sectionStyle}>
                    <div style={{ ...sectionTitleStyle, justifyContent: 'space-between' }}>
                        <span>📋 Trường dữ liệu ({templateTags.length})</span>
                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                            {templateTags.length > 5 && (
                                <input type="text" value={fieldSearch} onChange={e => setFieldSearch(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && fieldSearch) {
                                            const labels = { ...TAG_LABELS, ...customLabels };
                                            const match = templateTags.find(t => (labels[t] || t).toLowerCase().includes(fieldSearch.toLowerCase()));
                                            if (match) {
                                                const el = document.getElementById(`field-${match}`);
                                                if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.background = '#fef08a'; setTimeout(() => { el.style.background = ''; }, 1500); }
                                            }
                                        }
                                    }}
                                    placeholder="🔍 Tìm trường... (Enter)"
                                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid #c7d2fe', borderRadius: 4, width: 140, fontWeight: 400 }} />
                            )}
                        </div>
                    </div>
                    {/* Data score */}
                    {(() => {
                        const filled = templateTags.filter(t => data[t]?.trim()).length;
                        const score = templateTags.length > 0 ? Math.round((filled / templateTags.length) * 100) : 0;
                        return (
                            <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                                    <div style={{ height: '100%', borderRadius: 3, width: `${score}%`, background: score === 100 ? '#10b981' : '#3b82f6', transition: 'width 0.3s' }} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: score === 100 ? '#059669' : '#3b82f6' }}>{score}%</span>
                            </div>
                        );
                    })()}
                    {templateTags.filter(tag => {
                        if (!fieldSearch) return true;
                        const label = customLabels[tag] || TAG_LABELS[tag] || tag;
                        return label.toLowerCase().includes(fieldSearch.toLowerCase()) || tag.toLowerCase().includes(fieldSearch.toLowerCase());
                    }).map((tag) => {
                        const isListField = tag.startsWith('DANH_SACH_') || tag.startsWith('DS_');
                        if (isListField) {
                            // Parse JSON array or split by newline
                            let items: string[] = [];
                            try {
                                const parsed = JSON.parse(data[tag] || '[]');
                                items = Array.isArray(parsed) ? parsed : [data[tag] || ''];
                            } catch {
                                items = (data[tag] || '').split('\n').filter(Boolean);
                                if (items.length === 0) items = [''];
                            }
                            return (
                                <div key={tag} id={`field-${tag}`} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0369a1' }}>
                                            📋 {customLabels[tag] || tag.replace(/^(DANH_SACH_|DS_)/, '').replace(/_/g, ' ')}
                                            <span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#64748b', marginLeft: '0.3rem' }}>({items.filter(i => i.trim()).length} m\u1ee5c)</span>
                                        </label>
                                        <button
                                            className="btn btn-sm"
                                            onClick={() => {
                                                const newItems = [...items, ''];
                                                setData(prev => ({ ...prev, [tag]: JSON.stringify(newItems) }));
                                            }}
                                            style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: 4 }}
                                        >\u2795 Th\u00eam d\u00f2ng</button>
                                    </div>
                                    {items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.3rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', minWidth: 20 }}>{idx + 1}.</span>
                                            <input
                                                value={item}
                                                onChange={(e) => {
                                                    const newItems = [...items];
                                                    newItems[idx] = e.target.value;
                                                    setData(prev => ({ ...prev, [tag]: JSON.stringify(newItems) }));
                                                }}
                                                placeholder={`D\u00f2ng ${idx + 1}...`}
                                                style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: 4 }}
                                            />
                                            {items.length > 1 && (
                                                <button
                                                    onClick={() => {
                                                        const newItems = items.filter((_, i) => i !== idx);
                                                        setData(prev => ({ ...prev, [tag]: JSON.stringify(newItems) }));
                                                    }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.85rem', padding: '0 0.2rem' }}
                                                    title="X\u00f3a d\u00f2ng"
                                                >\u2715</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        }
                        return (
                            <div key={tag} id={`field-${tag}`}>
                                <FormInput
                                    label={customLabels[tag] || TAG_LABELS[tag] || tag.replace(/_/g, ' ')}
                                    name={tag}
                                    value={data[tag] || ''}
                                    onChange={handleChange}
                                    placeholder={TAG_PLACEHOLDERS[tag] || `Nh\u1eadp ${(customLabels[tag] || tag).replace(/_/g, ' ').toLowerCase()}`}
                                />
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Default template: grouped layout
        return TAG_GROUPS.map((group) => {
            // Only show tags that exist in the template
            const activeTags = group.tags.filter(t => templateTags.includes(t));
            if (activeTags.length === 0) return null;

            return (
                <div key={group.title} style={sectionStyle}>
                    <div style={{ ...sectionTitleStyle, justifyContent: 'space-between' }}>
                        <span>{group.icon} {group.title}</span>
                        {/* Contractor picker for Nhà thầu section */}
                        {group.title === 'Nhà thầu (Bên B)' && !isCustomTemplate && (
                            <div style={{ display: 'flex', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 400 }}>
                                <button className="btn btn-sm" onClick={handleSaveContractor}
                                    style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }} title="Lưu nhà thầu hiện tại">
                                    💾 Lưu NT
                                </button>
                                <div style={{ position: 'relative' }}>
                                    <button className="btn btn-sm" onClick={() => setShowContractorPicker(!showContractorPicker)}
                                        style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}
                                        title={contractors.length > 0 ? 'Chọn nhà thầu đã lưu' : 'Chưa có nhà thầu nào'}>
                                        📋 Chọn NT ({contractors.length})
                                    </button>
                                    {showContractorPicker && contractors.length > 0 && (
                                        <div style={{
                                            position: 'absolute', right: 0, top: '100%', zIndex: 100,
                                            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: 250, padding: '0.25rem',
                                        }}>
                                            {contractors.map(c => (
                                                <div key={c.id} style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '0.4rem 0.5rem', borderRadius: 6, cursor: 'pointer',
                                                }} onClick={() => handleSelectContractor(c)}
                                                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                    <div>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{c.name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>MST: {c.taxCode}</div>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteContractor(c.id!); }}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {group.rows ? (
                        group.rows.map((row, i) => {
                            const activeRowTags = row.filter(t => activeTags.includes(t));
                            if (activeRowTags.length === 0) return null;
                            if (activeRowTags.length === 1) {
                                const tag = activeRowTags[0];
                                return (
                                    <FormInput
                                        key={tag}
                                        label={TAG_LABELS[tag] || tag}
                                        name={tag}
                                        value={data[tag] || ''}
                                        onChange={handleChange}
                                        placeholder={TAG_PLACEHOLDERS[tag] || ''}
                                        error={fieldErrors[tag]}
                                        required={REQUIRED_TAGS.includes(tag)}
                                    />
                                );
                            }
                            return (
                                <div className="form-row" key={i}>
                                    {activeRowTags.map((tag) => (
                                        <FormInput
                                            key={tag}
                                            label={TAG_LABELS[tag] || tag}
                                            name={tag}
                                            value={data[tag] || ''}
                                            onChange={handleChange}
                                            placeholder={TAG_PLACEHOLDERS[tag] || ''}
                                            error={fieldErrors[tag]}
                                            required={REQUIRED_TAGS.includes(tag)}
                                        />
                                    ))}
                                </div>
                            );
                        })
                    ) : (
                        activeTags.map((tag) => (
                            <FormInput
                                key={tag}
                                label={TAG_LABELS[tag] || tag}
                                name={tag}
                                value={data[tag] || ''}
                                onChange={handleChange}
                                placeholder={TAG_PLACEHOLDERS[tag] || ''}
                                error={fieldErrors[tag]}
                                required={REQUIRED_TAGS.includes(tag)}
                            />
                        ))
                    )}
                    {/* Render any tags in this group not covered by rows */}
                    {group.rows && activeTags
                        .filter(t => !group.rows!.flat().includes(t))
                        .map(tag => (
                            <FormInput
                                key={tag}
                                label={TAG_LABELS[tag] || tag}
                                name={tag}
                                value={data[tag] || ''}
                                onChange={handleChange}
                                placeholder={TAG_PLACEHOLDERS[tag] || ''}
                                error={fieldErrors[tag]}
                                required={REQUIRED_TAGS.includes(tag)}
                            />
                        ))}
                </div>
            );
        });
    };

    // Render ALL table editor sections
    const renderTableEditors = () => {
        const cfgEntries = Object.entries(tableConfigs);
        if (cfgEntries.length === 0 || fileType !== 'word') return null;
        return cfgEntries.map(([tiStr, cfg]) => {
            const ti = Number(tiStr);
            const tData = tableDataMap[ti] || [];
            const tableLabel = cfgEntries.length > 1 ? ` (Bảng ${ti + 1})` : '';
            return (
                <div key={ti} style={sectionStyle}>
                    <div style={{ ...sectionTitleStyle, justifyContent: 'space-between' }}>
                        <span>📊 Bảng dữ liệu{tableLabel}</span>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                            {detectedTables.length > cfgEntries.length && (
                                <button className="btn btn-sm" onClick={() => setShowTableSetup(true)}
                                    style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>➕ Thêm bảng</button>
                            )}
                            <button className="btn btn-sm" onClick={() => setShowTableSetup(true)}
                                style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>⚙️ Cấu hình lại</button>
                            <button className="btn btn-sm" onClick={() => {
                                setTableConfigs(prev => { const next = { ...prev }; delete next[ti]; return next; });
                                setTableDataMap(prev => { const next = { ...prev }; delete next[ti]; return next; });
                            }}
                                style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem', color: '#ef4444' }}>✕ Xóa</button>
                        </div>
                    </div>
                    <TableEditor config={cfg} data={tData} onChange={(newData) => setTableDataMap(prev => ({ ...prev, [ti]: newData }))} />
                </div>
            );
        });
    };

    return (
        <>
            <div className="page-header">
                <div className="container">
                    <h1>Tự động hóa hồ sơ</h1>
                    <p>Nhập thông tin một lần — xuất file Word / Excel đầy đủ mẫu biểu</p>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    <div className="contract-layout">
                        {/* LEFT: FORM */}
                        <div className="wizard">
                            <div className="wizard-content">
                                {/* Template selector */}
                                <div style={{
                                    ...sectionStyle,
                                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                    borderColor: '#7dd3fc',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 2 }}>Đang dùng mẫu:</div>
                                            <div style={{ fontWeight: 600 }}>📄 {templateName}</div>
                                            {templateTags.length > 0 && (
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                                                    {templateTags.length} trường dữ liệu
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".docx,.doc,.xlsx,.xls"
                                                style={{ display: 'none' }}
                                                onChange={handleUploadTemplate}
                                            />
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                📤 Tải mẫu khác
                                            </button>
                                            {TEMPLATE_LIBRARY.length > 1 && (
                                                <select
                                                    onChange={e => {
                                                        const t = TEMPLATE_LIBRARY[Number(e.target.value)];
                                                        if (t) handleSelectTemplate(t.file, t.name);
                                                    }}
                                                    style={{ padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>📂 Chọn mẫu</option>
                                                    {TEMPLATE_LIBRARY.map((t, i) => (
                                                        <option key={i} value={i}>{t.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                            {isCustomTemplate && (
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={handleResetTemplate}
                                                >
                                                    ↩️ Mẫu mặc định
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-sm"
                                                onClick={() => navigate('/huong-dan/tao-ho-so')}
                                                style={{ background: '#dbeafe', color: '#1d4ed8' }}
                                            >
                                                📖 Hướng dẫn
                                            </button>
                                            {rawUploadBuffer && (
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={handleReopenScan}
                                                    title="Chọn lại các trường dữ liệu"
                                                >
                                                    ⚙️ Chỉnh trường
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Data management panel */}
                                <div style={{
                                    ...sectionStyle,
                                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                    borderColor: '#86efac',
                                    padding: '0.75rem 1rem',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534' }}>💾 Quản lý dữ liệu</div>
                                            {lastSaved && (
                                                <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: 2 }}>
                                                    ✅ Đã lưu tự động lúc {new Date(lastSaved).toLocaleTimeString('vi')}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                            <button className="btn btn-sm" onClick={handleExportJSON} title="Tải file JSON về máy để sao lưu">
                                                💾 Sao lưu
                                            </button>
                                            <input ref={jsonInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJSON} />
                                            <button className="btn btn-sm" onClick={() => jsonInputRef.current?.click()} title="Khôi phục dữ liệu từ file JSON">
                                                📂 Khôi phục
                                            </button>
                                            <input ref={excelDataInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImportExcelData} />
                                            <button className="btn btn-sm" onClick={() => excelDataInputRef.current?.click()} title="Nhập dữ liệu từ file Excel (hàng 1 = tiêu đề, hàng 2 = dữ liệu)">
                                                📊 Nhập từ Excel
                                            </button>
                                            <button className="btn btn-sm" onClick={() => setShowSessions(!showSessions)} title="Xem danh sách phiên đã lưu">
                                                📑 Mẫu đã lưu ({savedSessions.length})
                                            </button>
                                        </div>
                                    </div>
                                    {/* Saved sessions list */}
                                    {showSessions && savedSessions.length > 0 && (
                                        <div style={{ marginTop: '0.5rem', borderTop: '1px solid #bbf7d0', paddingTop: '0.5rem' }}>
                                            <input
                                                type="text"
                                                placeholder="🔍 Tìm hồ sơ..."
                                                value={sessionSearch}
                                                onChange={e => setSessionSearch(e.target.value)}
                                                style={{
                                                    width: '100%', padding: '0.4rem 0.6rem', borderRadius: 6,
                                                    border: '1px solid #bbf7d0', fontSize: '0.82rem',
                                                    marginBottom: '0.4rem', outline: 'none',
                                                    background: '#f0fdf4',
                                                }}
                                            />
                                            {savedSessions
                                                .filter(s => !sessionSearch || s.name.toLowerCase().includes(sessionSearch.toLowerCase()))
                                                .map(s => (
                                                    <div key={s.id} style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        padding: '0.35rem 0.5rem', borderRadius: 6,
                                                        background: currentSessionId === s.id ? '#bbf7d0' : 'transparent',
                                                        marginBottom: 2, cursor: 'pointer',
                                                    }} onClick={() => handleLoadSession(s)}>
                                                        <div>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>📄 {s.name}</div>
                                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                                {s.tags.length} trường · {new Date(s.updatedAt).toLocaleDateString('vi')}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                            <button className="btn btn-sm" onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newName = prompt('Đổi tên:', s.name);
                                                                if (newName && newName.trim() && newName !== s.name) {
                                                                    saveSession({ ...s, name: newName.trim(), id: s.id }).then(() => listSessions().then(setSavedSessions));
                                                                }
                                                            }} style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', color: '#3b82f6' }} title="Đổi tên">
                                                                ✏️
                                                            </button>
                                                            <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id!); }}
                                                                style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', color: '#ef4444' }} title="Xóa">
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                    {showSessions && savedSessions.length === 0 && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                                            Chưa có phiên nào được lưu
                                        </div>
                                    )}
                                    {/* Stats */}
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #bbf7d0', paddingTop: '0.5rem' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📑 {savedSessions.length} hồ sơ</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>🏢 {contractors.length} nhà thầu</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📥 {exportHistory.length} lần xuất</div>
                                    </div>
                                </div>

                                {/* Form fields */}
                                {renderFormFields()}

                                {/* Estimate section */}
                                {!isCustomTemplate && (
                                    <div style={{
                                        marginBottom: '1.5rem', padding: '1.25rem',
                                        borderRadius: 'var(--radius, 8px)', border: '1px solid var(--border, #e2e8f0)',
                                        background: 'var(--bg, #fff)',
                                    }}>
                                        <div style={{
                                            fontSize: '1.05rem', fontWeight: 600, marginBottom: showEstimate ? '0.75rem' : 0,
                                            paddingBottom: showEstimate ? '0.4rem' : 0,
                                            borderBottom: showEstimate ? '2px solid var(--primary, #4f46e5)' : 'none',
                                            color: 'var(--primary, #4f46e5)',
                                            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                                        }} onClick={() => setShowEstimate(!showEstimate)}>
                                            <span>📐 Dự toán chi tiết</span>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: 'auto' }}>
                                                {showEstimate ? '▲ Thu gọn' : '▼ Mở rộng'}
                                            </span>
                                        </div>
                                        {showEstimate && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <TableEditor
                                                    config={ESTIMATE_CONFIG}
                                                    data={estimateData}
                                                    onChange={(newData) => {
                                                        setEstimateData(newData);
                                                        // Sync total to SỐ_TIỀN
                                                        const totalCol = ESTIMATE_COLUMNS.findIndex(c => c.type === 'auto_calc');
                                                        if (totalCol >= 0) {
                                                            const total = newData.reduce((sum, row) => {
                                                                const val = parseFloat((row[totalCol] || '0').replace(/\./g, '').replace(',', '.'));
                                                                return sum + (isNaN(val) ? 0 : val);
                                                            }, 0);
                                                            if (total > 0) {
                                                                const formatted = total.toLocaleString('vi-VN');
                                                                const text = numberToVietnamese(formatted);
                                                                setData(prev => ({
                                                                    ...prev,
                                                                    'SỐ_TIỀN': formatted,
                                                                    ...(text ? { 'ST_BẰNG_CHỮ': text } : {}),
                                                                }));
                                                            }
                                                        }
                                                    }}
                                                />
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                                                    💡 Tổng thành tiền sẽ tự động điền vào trường "Số tiền"
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Table editors (multi-table) */}
                                {renderTableEditors()}
                                {/* Add more tables button */}
                                {detectedTables.length > Object.keys(tableConfigs).length && Object.keys(tableConfigs).length > 0 && fileType === 'word' && (
                                    <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                                        <button className="btn btn-sm" onClick={() => setShowTableSetup(true)}
                                            style={{ fontSize: '0.8rem' }}>➕ Cấu hình thêm bảng ({detectedTables.length - Object.keys(tableConfigs).length} bảng còn lại)</button>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="wizard-actions">
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {showClearConfirm ? (
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--danger)' }}>Xóa tất cả?</span>
                                                <button className="btn btn-sm" onClick={() => setShowClearConfirm(false)}>Hủy</button>
                                                <button className="btn btn-sm btn-danger" onClick={confirmClear}>Xóa</button>
                                            </div>
                                        ) : (
                                            <button className="btn btn-secondary" onClick={handleClear}>
                                                🗑️ Xóa tất cả
                                            </button>
                                        )}
                                        {!isCustomTemplate && (
                                            <button className="btn btn-secondary" onClick={handleFillDemo}>
                                                📝 Điền mẫu thử
                                            </button>
                                        )}
                                        <button className="btn btn-secondary" onClick={handleClone} disabled={!templateBuffer}>
                                            📋 Nhân bản
                                        </button>
                                        <button className="btn btn-secondary" onClick={() => setShowBatchExport(true)} disabled={!templateBuffer}>
                                            📦 Xuất hàng loạt
                                        </button>
                                    </div>
                                    <button className="btn btn-primary" onClick={handleExport} disabled={loading || !templateBuffer}>
                                        {loading ? '⏳ Đang xuất...' : `📥 Xuất file ${fileType === 'excel' ? 'Excel (.xlsx)' : 'Word (.docx)'}`}
                                    </button>
                                    <button className="btn btn-secondary" onClick={handleExportPDF} disabled={loading || !previewReady}
                                        style={{ fontSize: '0.85rem' }}>
                                        📄 Xuất PDF
                                    </button>
                                    {fileType === 'word' && templateBuffer && (
                                        <button className="btn btn-secondary" onClick={() => {
                                            const filled = fillTemplate(templateBuffer, data);
                                            setPreviewBuffer(filled);
                                            setPreviewDocName(templateName);
                                        }} style={{ fontSize: '0.85rem', background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
                                            👁️ Xem trước Word
                                        </button>
                                    )}
                                    <button className="btn btn-secondary" onClick={handleSaveToProject}
                                        style={{ fontSize: '0.85rem', background: '#eff6ff', borderColor: '#93c5fd', color: '#2563eb' }}>
                                        📊 Lưu vào dự án
                                    </button>
                                    {hasGoogleApiKey() && !(window as any).electronAPI?.isDesktop && fileType === 'word' && templateBuffer && (
                                        <>
                                            <button className="btn btn-secondary" onClick={async () => {
                                                try {
                                                    const filled = fillTemplate(templateBuffer, data);
                                                    const result = await uploadToDrive(templateName, filled);
                                                    alert(`✅ Đã upload lên Google Drive!\nFile ID: ${result.id}`);
                                                    if (result.webViewLink) window.open(result.webViewLink, '_blank');
                                                } catch (err) { alert('❌ ' + (err as Error).message); }
                                            }} style={{ fontSize: '0.85rem', background: '#fef3c7', borderColor: '#fbbf24', color: '#92400e' }}>
                                                ☁️ Lưu Drive
                                            </button>
                                            <button className="btn btn-secondary" onClick={() => openSheetsWithData(data)}
                                                style={{ fontSize: '0.85rem', background: '#dcfce7', borderColor: '#86efac', color: '#166534' }}>
                                                📊 Xuất Sheets
                                            </button>
                                        </>
                                    )}
                                    {!hasGoogleApiKey() && !(window as any).electronAPI?.isDesktop && (
                                        <a href="/cai-dat" className="btn btn-sm" style={{ fontSize: '0.75rem', color: '#64748b', textDecoration: 'none' }}>
                                            ☁️ Kết nối Google
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: LIVE PREVIEW */}
                        <div className="contract-preview">
                            <div className="contract-preview-header">
                                <span>📄 Xem trước {previewLoading && '⏳'}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <button onClick={zoomOut} className="btn btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem', minWidth: 28 }} title="Thu nhỏ">−</button>
                                    <span style={{ fontSize: '0.75rem', minWidth: 36, textAlign: 'center', color: '#64748b', userSelect: 'none', cursor: 'pointer' }} onClick={zoomFit}>{zoom}%</span>
                                    <button onClick={zoomIn} className="btn btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem', minWidth: 28 }} title="Phóng to">+</button>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={handleExport}
                                        disabled={loading || !templateBuffer}
                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', marginLeft: '0.25rem' }}
                                    >
                                        {loading ? '⏳' : '📥 Xuất'}
                                    </button>
                                </div>
                            </div>
                            <div className="contract-preview-body" style={{ overflow: 'auto' }}>
                                {!templateBuffer && (
                                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                                        Đang tải mẫu...
                                    </p>
                                )}
                                <div
                                    ref={previewContainerRef}
                                    style={{
                                        display: previewReady ? 'block' : 'none',
                                        transform: `scale(${zoom / 100})`,
                                        transformOrigin: 'top left',
                                        width: `${10000 / zoom}%`,
                                    }}
                                />
                                {templateBuffer && !previewReady && !previewLoading && (
                                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                                        Đang chuẩn bị xem trước...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* SCAN REVIEW MODAL */}
            {showScanModal && (
                <ScanReviewModal
                    results={scanResults}
                    onConfirm={handleScanConfirm}
                    onCancel={handleScanCancel}
                />
            )}
            {/* TABLE SETUP MODAL */}
            {showTableSetup && detectedTables.length > 0 && (
                <TableSetupModal
                    tables={detectedTables}
                    onConfirm={handleTableConfigConfirm}
                    onClose={() => setShowTableSetup(false)}
                />
            )}
            {/* BATCH EXPORT MODAL */}
            {showBatchExport && (
                <BatchExportPanel
                    templateBuffer={templateBuffer}
                    templateTags={templateTags}
                    onClose={() => setShowBatchExport(false)}
                />
            )}

            {/* FIELD SELECTOR MODAL */}
            {showFieldSelector && (
                <FieldSelectorModal
                    fields={Object.keys(data).filter(k => data[k]?.trim()).map(k => ({
                        key: k,
                        label: TAG_LABELS[k] || customLabels[k] || k.replace(/_/g, ' '),
                        value: data[k] || '',
                    }))}
                    defaultName={data['TÊN_CT'] || data['CÔNG_TRÌNH'] || data['TÊN_CÔNG_TRÌNH'] || ''}
                    onConfirm={handleFieldSelectConfirm}
                    onCancel={() => setShowFieldSelector(false)}
                />
            )}

            {/* DOCX PREVIEW MODAL */}
            {previewBuffer && (
                <DocxPreview
                    fileBuffer={previewBuffer}
                    fileName={previewDocName}
                    onClose={() => { setPreviewBuffer(null); setPreviewDocName(''); }}
                />
            )}

            {/* ONBOARDING TOUR */}
            <OnboardingTour page="military" forceShow={showTour} onClose={() => setShowTour(false)} />
        </>
    );
}
