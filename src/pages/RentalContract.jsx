import { useState, useEffect, useCallback } from 'react';
import { generateContractPDF } from '../utils/pdfGenerator';
import { FormInput, FormTextArea, FormSelect } from '../components/FormField';

const TEMPLATES = [
    { id: 'nha-nguyen-can', icon: '🏠', name: 'Nhà nguyên căn', desc: 'Thuê cả căn nhà riêng' },
    { id: 'phong-tro', icon: '🛏️', name: 'Phòng trọ', desc: 'Thuê phòng trọ, nhà trọ' },
    { id: 'van-phong', icon: '🏢', name: 'Văn phòng', desc: 'Thuê văn phòng làm việc' },
    { id: 'mat-bang', icon: '🏪', name: 'Mặt bằng KD', desc: 'Thuê mặt bằng kinh doanh' },
];

const STEP_LABELS = ['Chọn mẫu', 'Bên cho thuê', 'Bên thuê', 'Thông tin nhà', 'Xem trước'];
const STORAGE_KEY = 'taohoso_contract_draft';

const initialData = {
    template: '',
    // Landlord
    landlordName: '', landlordDob: '', landlordId: '', landlordIdDate: '', landlordIdPlace: '',
    landlordAddress: '', landlordPhone: '', landlordBank: '', landlordBankName: '',
    // Tenant
    tenantName: '', tenantDob: '', tenantId: '', tenantIdDate: '', tenantIdPlace: '',
    tenantAddress: '', tenantPhone: '',
    // Property
    propertyAddress: '', propertyArea: '', propertyFloors: '', propertyRooms: '',
    propertyDescription: '', propertyEquipment: '',
    // Financial
    rentAmount: '', rentAmountWords: '', depositAmount: '', depositAmountWords: '',
    paymentDay: '05', paymentMethod: 'Tiền mặt hoặc chuyển khoản',
    electricRate: '', waterRate: '', internetCost: '', otherCosts: '',
    // Lease
    leaseDuration: '12', startDate: '', endDate: '',
    noticePeriod: '30',
    // Terms
    additionalTerms: '', purpose: 'Để ở',
};

export default function RentalContract() {
    const [step, setStep] = useState(0);
    const [data, setData] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? { ...initialData, ...JSON.parse(saved) } : initialData;
        } catch { return initialData; }
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [data]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => {
            if (prev[name]) {
                const next = { ...prev };
                delete next[name];
                return next;
            }
            return prev;
        });
    }, []);

    const validateStep = () => {
        const e = {};
        if (step === 0 && !data.template) e.template = 'Vui lòng chọn mẫu hợp đồng';
        if (step === 1) {
            if (!data.landlordName) e.landlordName = 'Vui lòng nhập họ tên';
            if (!data.landlordId) e.landlordId = 'Vui lòng nhập số CCCD';
            if (!data.landlordPhone) e.landlordPhone = 'Vui lòng nhập số điện thoại';
        }
        if (step === 2) {
            if (!data.tenantName) e.tenantName = 'Vui lòng nhập họ tên';
            if (!data.tenantId) e.tenantId = 'Vui lòng nhập số CCCD';
            if (!data.tenantPhone) e.tenantPhone = 'Vui lòng nhập số điện thoại';
        }
        if (step === 3) {
            if (!data.propertyAddress) e.propertyAddress = 'Vui lòng nhập địa chỉ';
            if (!data.rentAmount) e.rentAmount = 'Vui lòng nhập giá thuê';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (validateStep()) setStep(s => Math.min(s + 1, 4)); };
    const prev = () => setStep(s => Math.max(s - 1, 0));
    const exportPDF = () => generateContractPDF(data);
    const clearDraft = () => {
        if (confirm('Bạn có chắc muốn xóa bản nháp?')) {
            setData(initialData);
            setStep(0);
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    const formatVND = (v) => v ? Number(v).toLocaleString('vi-VN') + ' VND' : '...';
    const templateName = TEMPLATES.find(t => t.id === data.template)?.name || '...';

    return (
        <>
            <div className="page-header">
                <div className="container">
                    <h1>Tạo hợp đồng thuê nhà</h1>
                    <p>Điền thông tin theo từng bước, xem trước và xuất file PDF chuyên nghiệp</p>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    <div className="contract-layout">
                        {/* WIZARD FORM */}
                        <div className="wizard">
                            {/* Steps indicator */}
                            <div className="wizard-steps">
                                {STEP_LABELS.map((label, i) => (
                                    <div key={i} style={{ display: 'contents' }}>
                                        {i > 0 && <div className={`wizard-line ${i <= step ? 'completed' : ''}`} />}
                                        <div className={`wizard-step ${i === step ? 'active' : i < step ? 'completed' : ''}`}>
                                            <div className="wizard-step-circle">{i < step ? '✓' : i + 1}</div>
                                            <div className="wizard-step-label">{label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="wizard-content">
                                {/* Step 0: Template Selection */}
                                {step === 0 && (
                                    <div>
                                        <h3 style={{ marginBottom: '1rem' }}>Chọn loại hợp đồng</h3>
                                        {errors.template && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.template}</div>}
                                        <div className="template-grid">
                                            {TEMPLATES.map(t => (
                                                <div
                                                    key={t.id}
                                                    className={`template-card ${data.template === t.id ? 'selected' : ''}`}
                                                    onClick={() => setData(prev => ({ ...prev, template: t.id }))}
                                                >
                                                    <div className="template-card-icon">{t.icon}</div>
                                                    <h4>{t.name}</h4>
                                                    <p>{t.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 1: Landlord Info */}
                                {step === 1 && (
                                    <div>
                                        <h3 style={{ marginBottom: '1rem' }}>Thông tin bên cho thuê (Bên A)</h3>
                                        <FormInput label="Họ và tên" name="landlordName" value={data.landlordName} onChange={handleChange} required placeholder="Nguyễn Văn A" error={errors.landlordName} />
                                        <div className="form-row">
                                            <FormInput label="Ngày sinh" name="landlordDob" value={data.landlordDob} onChange={handleChange} type="date" />
                                            <FormInput label="Số điện thoại" name="landlordPhone" value={data.landlordPhone} onChange={handleChange} required placeholder="0901234567" error={errors.landlordPhone} />
                                        </div>
                                        <div className="form-row">
                                            <FormInput label="Số CCCD/CMND" name="landlordId" value={data.landlordId} onChange={handleChange} required placeholder="001234567890" error={errors.landlordId} />
                                            <FormInput label="Ngày cấp" name="landlordIdDate" value={data.landlordIdDate} onChange={handleChange} type="date" />
                                        </div>
                                        <FormInput label="Nơi cấp" name="landlordIdPlace" value={data.landlordIdPlace} onChange={handleChange} placeholder="Cục CS QLHC về TTXH" />
                                        <FormInput label="Địa chỉ thường trú" name="landlordAddress" value={data.landlordAddress} onChange={handleChange} placeholder="Số 1, Đường ABC, Phường XYZ, Quận 1, TP.HCM" />
                                        <div className="form-row">
                                            <FormInput label="Số tài khoản NH" name="landlordBank" value={data.landlordBank} onChange={handleChange} placeholder="1234567890" hint="Không bắt buộc" />
                                            <FormInput label="Tên ngân hàng" name="landlordBankName" value={data.landlordBankName} onChange={handleChange} placeholder="Vietcombank" />
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Tenant Info */}
                                {step === 2 && (
                                    <div>
                                        <h3 style={{ marginBottom: '1rem' }}>Thông tin bên thuê (Bên B)</h3>
                                        <FormInput label="Họ và tên" name="tenantName" value={data.tenantName} onChange={handleChange} required placeholder="Trần Thị B" error={errors.tenantName} />
                                        <div className="form-row">
                                            <FormInput label="Ngày sinh" name="tenantDob" value={data.tenantDob} onChange={handleChange} type="date" />
                                            <FormInput label="Số điện thoại" name="tenantPhone" value={data.tenantPhone} onChange={handleChange} required placeholder="0987654321" error={errors.tenantPhone} />
                                        </div>
                                        <div className="form-row">
                                            <FormInput label="Số CCCD/CMND" name="tenantId" value={data.tenantId} onChange={handleChange} required placeholder="001234567890" error={errors.tenantId} />
                                            <FormInput label="Ngày cấp" name="tenantIdDate" value={data.tenantIdDate} onChange={handleChange} type="date" />
                                        </div>
                                        <FormInput label="Nơi cấp" name="tenantIdPlace" value={data.tenantIdPlace} onChange={handleChange} placeholder="Cục CS QLHC về TTXH" />
                                        <FormInput label="Địa chỉ thường trú" name="tenantAddress" value={data.tenantAddress} onChange={handleChange} placeholder="Số 2, Đường DEF, Phường UVW, Quận 3, TP.HCM" />
                                    </div>
                                )}

                                {/* Step 3: Property & Financial */}
                                {step === 3 && (
                                    <div>
                                        <h3 style={{ marginBottom: '1rem' }}>Thông tin nhà cho thuê</h3>
                                        <FormInput label="Địa chỉ nhà cho thuê" name="propertyAddress" value={data.propertyAddress} onChange={handleChange} required placeholder="Số 10, Đường GHI, Phường MNO, Quận 7, TP.HCM" error={errors.propertyAddress} />
                                        <div className="form-row">
                                            <FormInput label="Diện tích sử dụng (m²)" name="propertyArea" value={data.propertyArea} onChange={handleChange} type="number" placeholder="50" />
                                            <FormSelect label="Mục đích thuê" name="purpose" value={data.purpose} onChange={handleChange}
                                                options={[
                                                    { value: 'Để ở', label: 'Để ở' },
                                                    { value: 'Kinh doanh', label: 'Kinh doanh' },
                                                    { value: 'Làm văn phòng', label: 'Làm văn phòng' },
                                                    { value: 'Để ở và kinh doanh', label: 'Để ở và kinh doanh' },
                                                ]}
                                            />
                                        </div>
                                        <div className="form-row">
                                            <FormInput label="Số tầng" name="propertyFloors" value={data.propertyFloors} onChange={handleChange} placeholder="1" />
                                            <FormInput label="Số phòng" name="propertyRooms" value={data.propertyRooms} onChange={handleChange} placeholder="2" />
                                        </div>
                                        <FormTextArea label="Mô tả tình trạng nhà" name="propertyDescription" value={data.propertyDescription} onChange={handleChange} placeholder="Nhà 1 trệt 1 lầu, 2 phòng ngủ, 1 phòng khách, 1 bếp, 2 WC. Tình trạng tốt." />
                                        <FormTextArea label="Trang thiết bị bàn giao" name="propertyEquipment" value={data.propertyEquipment} onChange={handleChange} placeholder="Máy lạnh (2), bình nóng lạnh (1), tủ bếp, ..." hint="Liệt kê các thiết bị bàn giao kèm số lượng" />

                                        <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>💰 Giá thuê & thanh toán</h3>
                                        <div className="form-row">
                                            <FormInput label="Giá thuê (VND/tháng)" name="rentAmount" value={data.rentAmount} onChange={handleChange} required type="number" placeholder="5000000" error={errors.rentAmount} />
                                            <FormInput label="Bằng chữ" name="rentAmountWords" value={data.rentAmountWords} onChange={handleChange} placeholder="Năm triệu đồng" />
                                        </div>
                                        <div className="form-row">
                                            <FormInput label="Tiền đặt cọc (VND)" name="depositAmount" value={data.depositAmount} onChange={handleChange} type="number" placeholder="10000000" />
                                            <FormInput label="Bằng chữ" name="depositAmountWords" value={data.depositAmountWords} onChange={handleChange} placeholder="Mười triệu đồng" />
                                        </div>
                                        <div className="form-row">
                                            <FormInput label="Ngày thanh toán hàng tháng" name="paymentDay" value={data.paymentDay} onChange={handleChange} placeholder="05" hint="Nhập ngày trong tháng" />
                                            <FormSelect label="Phương thức thanh toán" name="paymentMethod" value={data.paymentMethod} onChange={handleChange}
                                                options={[
                                                    { value: 'Tiền mặt hoặc chuyển khoản', label: 'Tiền mặt hoặc chuyển khoản' },
                                                    { value: 'Chuyển khoản ngân hàng', label: 'Chuyển khoản ngân hàng' },
                                                    { value: 'Tiền mặt', label: 'Tiền mặt' },
                                                ]}
                                            />
                                        </div>

                                        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Chi phí khác</h4>
                                        <div className="form-row">
                                            <FormInput label="Tiền điện (VND/kWh)" name="electricRate" value={data.electricRate} onChange={handleChange} placeholder="3500" hint="Để trống nếu theo giá nhà nước" />
                                            <FormInput label="Tiền nước (VND/m³)" name="waterRate" value={data.waterRate} onChange={handleChange} placeholder="20000" hint="Để trống nếu theo giá nhà nước" />
                                        </div>
                                        <div className="form-row">
                                            <FormInput label="Internet (VND/tháng)" name="internetCost" value={data.internetCost} onChange={handleChange} placeholder="200000" />
                                            <FormInput label="Chi phí khác" name="otherCosts" value={data.otherCosts} onChange={handleChange} placeholder="Phí gửi xe, vệ sinh..." />
                                        </div>

                                        <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>📅 Thời hạn thuê</h3>
                                        <div className="form-row">
                                            <FormInput label="Thời hạn (tháng)" name="leaseDuration" value={data.leaseDuration} onChange={handleChange} placeholder="12" />
                                            <FormInput label="Thời gian báo trước (ngày)" name="noticePeriod" value={data.noticePeriod} onChange={handleChange} placeholder="30" hint="Khi muốn chấm dứt HĐ" />
                                        </div>
                                        <div className="form-row">
                                            <FormInput label="Ngày bắt đầu" name="startDate" value={data.startDate} onChange={handleChange} type="date" />
                                            <FormInput label="Ngày kết thúc" name="endDate" value={data.endDate} onChange={handleChange} type="date" />
                                        </div>

                                        <FormTextArea label="Điều khoản bổ sung" name="additionalTerms" value={data.additionalTerms} onChange={handleChange} placeholder="Ví dụ: Không nuôi thú cưng, không hút thuốc trong nhà..." hint="Thêm các thỏa thuận riêng giữa hai bên (không bắt buộc)" />
                                    </div>
                                )}

                                {/* Step 4: Preview */}
                                {step === 4 && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <h3>Xem trước hợp đồng</h3>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={clearDraft}>🗑️ Xóa nháp</button>
                                                <button className="btn btn-primary btn-sm" onClick={exportPDF}>📥 Xuất PDF</button>
                                            </div>
                                        </div>
                                        <div className="info-box">
                                            💡 Kiểm tra kỹ thông tin trước khi xuất PDF. Bạn có thể quay lại các bước trước để chỉnh sửa.
                                        </div>
                                    </div>
                                )}

                                {/* Navigation */}
                                <div className="wizard-actions">
                                    <button className="btn btn-secondary" onClick={prev} disabled={step === 0} style={{ opacity: step === 0 ? 0.4 : 1 }}>
                                        ← Quay lại
                                    </button>
                                    {step < 4 ? (
                                        <button className="btn btn-primary" onClick={next}>
                                            Tiếp theo →
                                        </button>
                                    ) : (
                                        <button className="btn btn-primary" onClick={exportPDF}>
                                            📥 Xuất file PDF
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* LIVE PREVIEW */}
                        <div className="contract-preview">
                            <div className="contract-preview-header">
                                <span>📄 Xem trước hợp đồng</span>
                                <button className="btn btn-sm btn-primary" onClick={exportPDF} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                                    📥 Xuất PDF
                                </button>
                            </div>
                            <div className="contract-preview-body">
                                <ContractPreview data={data} formatVND={formatVND} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

/* ============================
   CONTRACT PREVIEW COMPONENT
   ============================ */
function ContractPreview({ data, formatVND }) {
    const templateTitle = {
        'nha-nguyen-can': 'HỢP ĐỒNG THUÊ NHÀ NGUYÊN CĂN',
        'phong-tro': 'HỢP ĐỒNG THUÊ PHÒNG TRỌ',
        'van-phong': 'HỢP ĐỒNG THUÊ VĂN PHÒNG',
        'mat-bang': 'HỢP ĐỒNG THUÊ MẶT BẰNG KINH DOANH',
    }[data.template] || 'HỢP ĐỒNG THUÊ NHÀ';

    const today = new Date();

    return (
        <>
            <h2>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
            <h3>Độc lập — Tự do — Hạnh phúc</h3>
            <p style={{ textAlign: 'center', margin: '0.5rem 0' }}>———————</p>
            <h2 style={{ fontSize: '1.05rem', margin: '1rem 0 0.5rem' }}>{templateTitle}</h2>
            <p style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '0.82rem', marginBottom: '1rem' }}>
                Số: ......../{today.getFullYear()}/HĐTN
            </p>

            <p style={{ fontStyle: 'italic', fontSize: '0.82rem' }}>
                Hôm nay, ngày {today.getDate()} tháng {today.getMonth() + 1} năm {today.getFullYear()}, tại {data.propertyAddress || '...............'},
                chúng tôi gồm có:
            </p>

            <h4>BÊN CHO THUÊ (Bên A):</h4>
            <p>Họ và tên: <span className="contract-highlight">{data.landlordName || '...............'}</span></p>
            {data.landlordDob && <p>Ngày sinh: {data.landlordDob}</p>}
            <p>CCCD/CMND số: <span className="contract-highlight">{data.landlordId || '...'}</span>
                {data.landlordIdDate && <> — Ngày cấp: {data.landlordIdDate}</>}
                {data.landlordIdPlace && <> — Nơi cấp: {data.landlordIdPlace}</>}
            </p>
            <p>Địa chỉ thường trú: {data.landlordAddress || '...'}</p>
            <p>Điện thoại: {data.landlordPhone || '...'}</p>
            {data.landlordBank && <p>STK ngân hàng: {data.landlordBank} — {data.landlordBankName || ''}</p>}

            <h4>BÊN THUÊ (Bên B):</h4>
            <p>Họ và tên: <span className="contract-highlight">{data.tenantName || '...............'}</span></p>
            {data.tenantDob && <p>Ngày sinh: {data.tenantDob}</p>}
            <p>CCCD/CMND số: <span className="contract-highlight">{data.tenantId || '...'}</span>
                {data.tenantIdDate && <> — Ngày cấp: {data.tenantIdDate}</>}
                {data.tenantIdPlace && <> — Nơi cấp: {data.tenantIdPlace}</>}
            </p>
            <p>Địa chỉ thường trú: {data.tenantAddress || '...'}</p>
            <p>Điện thoại: {data.tenantPhone || '...'}</p>

            <p style={{ fontStyle: 'italic', margin: '0.75rem 0', fontSize: '0.82rem' }}>
                Hai bên thỏa thuận ký kết hợp đồng thuê nhà với các điều khoản sau:
            </p>

            <h4>Điều 1: Đối tượng hợp đồng</h4>
            <p>Bên A đồng ý cho Bên B thuê và Bên B đồng ý thuê:</p>
            <p>• Địa chỉ: <span className="contract-highlight">{data.propertyAddress || '...'}</span></p>
            <p>• Diện tích: {data.propertyArea || '...'} m²</p>
            {data.propertyFloors && <p>• Số tầng: {data.propertyFloors}</p>}
            {data.propertyRooms && <p>• Số phòng: {data.propertyRooms}</p>}
            <p>• Mục đích sử dụng: {data.purpose}</p>
            {data.propertyDescription && <p>• Tình trạng: {data.propertyDescription}</p>}
            {data.propertyEquipment && <p>• Trang thiết bị: {data.propertyEquipment}</p>}

            <h4>Điều 2: Giá thuê và phương thức thanh toán</h4>
            <p>• Giá thuê: <span className="contract-highlight">{formatVND(data.rentAmount)}</span>/tháng
                {data.rentAmountWords && <> ({data.rentAmountWords})</>}
            </p>
            <p>• Tiền đặt cọc: {formatVND(data.depositAmount)}
                {data.depositAmountWords && <> ({data.depositAmountWords})</>}
            </p>
            <p>• Thanh toán: {data.paymentMethod}, trước ngày {data.paymentDay || '05'} mỗi tháng</p>
            <p>• Tiền đặt cọc được hoàn trả khi Bên B trả nhà đúng hạn và không vi phạm hợp đồng</p>
            {(data.electricRate || data.waterRate) && (
                <>
                    <p style={{ fontWeight: 500, marginTop: '0.25rem' }}>Chi phí khác:</p>
                    {data.electricRate && <p>• Tiền điện: {Number(data.electricRate).toLocaleString('vi-VN')} VND/kWh</p>}
                    {data.waterRate && <p>• Tiền nước: {Number(data.waterRate).toLocaleString('vi-VN')} VND/m³</p>}
                    {data.internetCost && <p>• Internet: {Number(data.internetCost).toLocaleString('vi-VN')} VND/tháng</p>}
                    {data.otherCosts && <p>• Khác: {data.otherCosts}</p>}
                </>
            )}

            <h4>Điều 3: Thời hạn thuê</h4>
            <p>• Thời hạn: {data.leaseDuration || '12'} tháng</p>
            <p>• Từ ngày: {data.startDate || '...'} đến ngày: {data.endDate || '...'}</p>
            <p>• Hết hạn, nếu Bên B có nhu cầu tiếp tục thuê thì phải thông báo cho Bên A trước ít nhất 02 tháng</p>

            <h4>Điều 4: Quyền và nghĩa vụ của Bên A</h4>
            <p>4.1. Giao nhà cho Bên B đúng thời gian và tình trạng đã thỏa thuận</p>
            <p>4.2. Đảm bảo quyền sử dụng nhà hợp pháp, ổn định cho Bên B trong suốt thời hạn hợp đồng</p>
            <p>4.3. Bảo dưỡng, sửa chữa nhà định kỳ hoặc theo thỏa thuận (trừ hư hỏng do Bên B gây ra)</p>
            <p>4.4. Hỗ trợ Bên B đăng ký tạm trú tại địa chỉ thuê</p>
            <p>4.5. Không tăng giá thuê trong thời hạn hợp đồng</p>
            <p>4.6. Không đơn phương chấm dứt HĐ nếu Bên B thực hiện đúng nghĩa vụ</p>
            <p>4.7. Thực hiện nghĩa vụ tài chính với Nhà nước theo quy định pháp luật</p>

            <h4>Điều 5: Quyền và nghĩa vụ của Bên B</h4>
            <p>5.1. Sử dụng nhà đúng mục đích đã thỏa thuận ({data.purpose})</p>
            <p>5.2. Thanh toán đầy đủ tiền thuê và các chi phí khác đúng hạn</p>
            <p>5.3. Giữ gìn, bảo quản nhà và trang thiết bị; bồi thường nếu làm hư hỏng</p>
            <p>5.4. Không được tự ý sửa chữa, cải tạo, thay đổi kết cấu khi chưa có sự đồng ý bằng văn bản của Bên A</p>
            <p>5.5. Không được cho thuê lại, chuyển nhượng HĐ khi chưa có sự đồng ý của Bên A</p>
            <p>5.6. Tuân thủ quy định pháp luật, nội quy khu dân cư, giữ gìn vệ sinh và trật tự</p>
            <p>5.7. Trả lại nhà khi hết hạn hoặc chấm dứt HĐ đúng tình trạng ban đầu (trừ hao mòn tự nhiên)</p>

            <h4>Điều 6: Chấm dứt hợp đồng</h4>
            <p>6.1. Hợp đồng chấm dứt khi hết thời hạn mà không gia hạn</p>
            <p>6.2. Một bên muốn chấm dứt trước hạn phải thông báo bằng văn bản trước ít nhất {data.noticePeriod || '30'} ngày</p>
            <p>6.3. Bên A được đơn phương chấm dứt nếu Bên B: không trả tiền thuê quá 30 ngày, sử dụng sai mục đích, vi phạm pháp luật, hoặc gây thiệt hại nghiêm trọng</p>
            <p>6.4. Bên vi phạm phải bồi thường thiệt hại cho bên còn lại</p>
            <p>6.5. Khi chấm dứt HĐ, hai bên lập biên bản bàn giao nhà và thanh lý hợp đồng</p>

            <h4>Điều 7: Điều khoản chung</h4>
            <p>7.1. Hai bên cam kết thực hiện đúng các điều khoản đã thỏa thuận</p>
            <p>7.2. Mọi tranh chấp phát sinh được giải quyết thông qua thương lượng; nếu không thống nhất sẽ đưa ra Tòa án nhân dân có thẩm quyền</p>
            <p>7.3. Mọi sửa đổi, bổ sung phải được lập thành phụ lục hợp đồng bằng văn bản có chữ ký của hai bên</p>
            <p>7.4. Hợp đồng được lập thành 02 bản, mỗi bên giữ 01 bản, có giá trị pháp lý như nhau</p>
            <p>7.5. Hợp đồng có hiệu lực kể từ ngày {data.startDate || '...'}</p>

            {data.additionalTerms && (
                <>
                    <h4>Điều khoản bổ sung</h4>
                    <p>{data.additionalTerms}</p>
                </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', textAlign: 'center' }}>
                <div>
                    <p style={{ fontWeight: 600 }}>BÊN CHO THUÊ (Bên A)</p>
                    <p style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Ký và ghi rõ họ tên)</p>
                </div>
                <div>
                    <p style={{ fontWeight: 600 }}>BÊN THUÊ (Bên B)</p>
                    <p style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Ký và ghi rõ họ tên)</p>
                </div>
            </div>
        </>
    );
}
