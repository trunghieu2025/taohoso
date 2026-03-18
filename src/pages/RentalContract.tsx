import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { generateContractPDF } from '../utils/pdfGenerator';
import { FormInput, FormTextArea, FormSelect } from '../components/FormField';
import ContractPreview from './rental-contract/ContractPreview';
import { usePageT } from '../i18n/pageTranslations';
import {
  TEMPLATES,
  STEP_LABELS,
  STORAGE_KEY,
  initialData,
} from './rental-contract/rental-contract-constants';
import { ContractData } from '../types';

type FormChangeEvent = ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;

export default function RentalContract() {
  const p = usePageT();
  const isVi = p('home') === 'Trang chủ';
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ContractData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...initialData, ...JSON.parse(saved) } : initialData;
    } catch {
      return initialData;
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const handleChange = useCallback((e: FormChangeEvent) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (prev[name]) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return prev;
    });
  }, []);

  const validateStep = () => {
    const e: Record<string, string> = {};
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

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 4));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const exportPDF = () => generateContractPDF(data);

  // Inline confirm instead of window.confirm() (blocked on some mobile browsers)
  const clearDraft = () => setShowClearConfirm(true);
  const confirmClear = () => {
    setData(initialData);
    setStep(0);
    localStorage.removeItem(STORAGE_KEY);
    setShowClearConfirm(false);
  };

  const formatVND = (v: string): string =>
    v ? Number(v).toLocaleString('vi-VN') + ' VND' : '...';
  const templateName =
    TEMPLATES.find((t) => t.id === data.template)?.name || '...';

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>{p('rental_title')}</h1>
          <p>
            {isVi ? 'Điền thông tin theo từng bước, xem trước và xuất file PDF chuyên nghiệp' : 'Fill in step-by-step, preview and export professional PDF'}
          </p>
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
                    {i > 0 && (
                      <div
                        className={`wizard-line ${i <= step ? 'completed' : ''}`}
                      />
                    )}
                    <div
                      className={`wizard-step ${i === step ? 'active' : i < step ? 'completed' : ''}`}
                    >
                      <div className="wizard-step-circle">
                        {i < step ? '✓' : i + 1}
                      </div>
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
                    {errors.template && (
                      <div
                        className="form-error"
                        style={{ marginBottom: '1rem' }}
                      >
                        {errors.template}
                      </div>
                    )}
                    <div className="template-grid">
                      {TEMPLATES.map((t) => (
                        <div
                          key={t.id}
                          className={`template-card ${data.template === t.id ? 'selected' : ''}`}
                          onClick={() =>
                            setData((prev) => ({ ...prev, template: t.id }))
                          }
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
                    <h3 style={{ marginBottom: '1rem' }}>
                      Thông tin bên cho thuê (Bên A)
                    </h3>
                    <FormInput
                      label="Họ và tên"
                      name="landlordName"
                      value={data.landlordName}
                      onChange={handleChange}
                      required
                      placeholder="Nguyễn Văn A"
                      error={errors.landlordName}
                    />
                    <div className="form-row">
                      <FormInput
                        label="Ngày sinh"
                        name="landlordDob"
                        value={data.landlordDob}
                        onChange={handleChange}
                        type="date"
                      />
                      <FormInput
                        label="Số điện thoại"
                        name="landlordPhone"
                        value={data.landlordPhone}
                        onChange={handleChange}
                        required
                        placeholder="0901234567"
                        error={errors.landlordPhone}
                      />
                    </div>
                    <div className="form-row">
                      <FormInput
                        label="Số CCCD/CMND"
                        name="landlordId"
                        value={data.landlordId}
                        onChange={handleChange}
                        required
                        placeholder="001234567890"
                        error={errors.landlordId}
                      />
                      <FormInput
                        label="Ngày cấp"
                        name="landlordIdDate"
                        value={data.landlordIdDate}
                        onChange={handleChange}
                        type="date"
                      />
                    </div>
                    <FormInput
                      label="Nơi cấp"
                      name="landlordIdPlace"
                      value={data.landlordIdPlace}
                      onChange={handleChange}
                      placeholder="Cục CS QLHC về TTXH"
                    />
                    <FormInput
                      label="Địa chỉ thường trú"
                      name="landlordAddress"
                      value={data.landlordAddress}
                      onChange={handleChange}
                      placeholder="Số 1, Đường ABC, Phường XYZ, Quận 1, TP.HCM"
                    />
                    <div className="form-row">
                      <FormInput
                        label="Số tài khoản NH"
                        name="landlordBank"
                        value={data.landlordBank}
                        onChange={handleChange}
                        placeholder="1234567890"
                        hint="Không bắt buộc"
                      />
                      <FormInput
                        label="Tên ngân hàng"
                        name="landlordBankName"
                        value={data.landlordBankName}
                        onChange={handleChange}
                        placeholder="Vietcombank"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Tenant Info */}
                {step === 2 && (
                  <div>
                    <h3 style={{ marginBottom: '1rem' }}>
                      Thông tin bên thuê (Bên B)
                    </h3>
                    <FormInput
                      label="Họ và tên"
                      name="tenantName"
                      value={data.tenantName}
                      onChange={handleChange}
                      required
                      placeholder="Trần Thị B"
                      error={errors.tenantName}
                    />
                    <div className="form-row">
                      <FormInput
                        label="Ngày sinh"
                        name="tenantDob"
                        value={data.tenantDob}
                        onChange={handleChange}
                        type="date"
                      />
                      <FormInput
                        label="Số điện thoại"
                        name="tenantPhone"
                        value={data.tenantPhone}
                        onChange={handleChange}
                        required
                        placeholder="0987654321"
                        error={errors.tenantPhone}
                      />
                    </div>
                    <div className="form-row">
                      <FormInput
                        label="Số CCCD/CMND"
                        name="tenantId"
                        value={data.tenantId}
                        onChange={handleChange}
                        required
                        placeholder="001234567890"
                        error={errors.tenantId}
                      />
                      <FormInput
                        label="Ngày cấp"
                        name="tenantIdDate"
                        value={data.tenantIdDate}
                        onChange={handleChange}
                        type="date"
                      />
                    </div>
                    <FormInput
                      label="Nơi cấp"
                      name="tenantIdPlace"
                      value={data.tenantIdPlace}
                      onChange={handleChange}
                      placeholder="Cục CS QLHC về TTXH"
                    />
                    <FormInput
                      label="Địa chỉ thường trú"
                      name="tenantAddress"
                      value={data.tenantAddress}
                      onChange={handleChange}
                      placeholder="Số 2, Đường DEF, Phường UVW, Quận 3, TP.HCM"
                    />
                  </div>
                )}

                {/* Step 3: Property & Financial */}
                {step === 3 && (
                  <div>
                    <h3 style={{ marginBottom: '1rem' }}>
                      Thông tin nhà cho thuê
                    </h3>
                    <FormInput
                      label="Địa chỉ nhà cho thuê"
                      name="propertyAddress"
                      value={data.propertyAddress}
                      onChange={handleChange}
                      required
                      placeholder="Số 10, Đường GHI, Phường MNO, Quận 7, TP.HCM"
                      error={errors.propertyAddress}
                    />
                    <div className="form-row">
                      <FormInput
                        label="Diện tích sử dụng (m²)"
                        name="propertyArea"
                        value={data.propertyArea}
                        onChange={handleChange}
                        type="number"
                        placeholder="50"
                      />
                      <FormSelect
                        label="Mục đích thuê"
                        name="purpose"
                        value={data.purpose}
                        onChange={handleChange}
                        options={[
                          { value: 'Để ở', label: 'Để ở' },
                          { value: 'Kinh doanh', label: 'Kinh doanh' },
                          { value: 'Làm văn phòng', label: 'Làm văn phòng' },
                          {
                            value: 'Để ở và kinh doanh',
                            label: 'Để ở và kinh doanh',
                          },
                        ]}
                      />
                    </div>
                    <div className="form-row">
                      <FormInput
                        label="Số tầng"
                        name="propertyFloors"
                        value={data.propertyFloors}
                        onChange={handleChange}
                        placeholder="1"
                      />
                      <FormInput
                        label="Số phòng"
                        name="propertyRooms"
                        value={data.propertyRooms}
                        onChange={handleChange}
                        placeholder="2"
                      />
                    </div>
                    <FormTextArea
                      label="Mô tả tình trạng nhà"
                      name="propertyDescription"
                      value={data.propertyDescription}
                      onChange={handleChange}
                      placeholder="Nhà 1 trệt 1 lầu, 2 phòng ngủ, 1 phòng khách, 1 bếp, 2 WC. Tình trạng tốt."
                    />
                    <FormTextArea
                      label="Trang thiết bị bàn giao"
                      name="propertyEquipment"
                      value={data.propertyEquipment}
                      onChange={handleChange}
                      placeholder="Máy lạnh (2), bình nóng lạnh (1), tủ bếp, ..."
                      hint="Liệt kê các thiết bị bàn giao kèm số lượng"
                    />

                    <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                      💰 Giá thuê & thanh toán
                    </h3>
                    <div className="form-row">
                      <FormInput
                        label="Giá thuê (VND/tháng)"
                        name="rentAmount"
                        value={data.rentAmount}
                        onChange={handleChange}
                        required
                        type="number"
                        placeholder="5000000"
                        error={errors.rentAmount}
                      />
                      <FormInput
                        label="Bằng chữ"
                        name="rentAmountWords"
                        value={data.rentAmountWords}
                        onChange={handleChange}
                        placeholder="Năm triệu đồng"
                      />
                    </div>
                    <div className="form-row">
                      <FormInput
                        label="Tiền đặt cọc (VND)"
                        name="depositAmount"
                        value={data.depositAmount}
                        onChange={handleChange}
                        type="number"
                        placeholder="10000000"
                      />
                      <FormInput
                        label="Bằng chữ"
                        name="depositAmountWords"
                        value={data.depositAmountWords}
                        onChange={handleChange}
                        placeholder="Mười triệu đồng"
                      />
                    </div>
                    <div className="form-row">
                      <FormInput
                        label="Ngày thanh toán hàng tháng"
                        name="paymentDay"
                        value={data.paymentDay}
                        onChange={handleChange}
                        placeholder="05"
                        hint="Nhập ngày trong tháng"
                      />
                      <FormSelect
                        label="Phương thức thanh toán"
                        name="paymentMethod"
                        value={data.paymentMethod}
                        onChange={handleChange}
                        options={[
                          {
                            value: 'Tiền mặt hoặc chuyển khoản',
                            label: 'Tiền mặt hoặc chuyển khoản',
                          },
                          {
                            value: 'Chuyển khoản ngân hàng',
                            label: 'Chuyển khoản ngân hàng',
                          },
                          { value: 'Tiền mặt', label: 'Tiền mặt' },
                        ]}
                      />
                    </div>

                    <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                      Chi phí khác
                    </h4>
                    <div className="form-row">
                      <FormInput
                        label="Tiền điện (VND/kWh)"
                        name="electricRate"
                        value={data.electricRate}
                        onChange={handleChange}
                        placeholder="3500"
                        hint="Để trống nếu theo giá nhà nước"
                      />
                      <FormInput
                        label="Tiền nước (VND/m³)"
                        name="waterRate"
                        value={data.waterRate}
                        onChange={handleChange}
                        placeholder="20000"
                        hint="Để trống nếu theo giá nhà nước"
                      />
                    </div>
                    <div className="form-row">
                      <FormInput
                        label="Internet (VND/tháng)"
                        name="internetCost"
                        value={data.internetCost}
                        onChange={handleChange}
                        placeholder="200000"
                      />
                      <FormInput
                        label="Chi phí khác"
                        name="otherCosts"
                        value={data.otherCosts}
                        onChange={handleChange}
                        placeholder="Phí gửi xe, vệ sinh..."
                      />
                    </div>

                    <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                      📅 Thời hạn thuê
                    </h3>
                    <div className="form-row">
                      <FormInput
                        label="Thời hạn (tháng)"
                        name="leaseDuration"
                        value={data.leaseDuration}
                        onChange={handleChange}
                        placeholder="12"
                      />
                      <FormInput
                        label="Thời gian báo trước (ngày)"
                        name="noticePeriod"
                        value={data.noticePeriod}
                        onChange={handleChange}
                        placeholder="30"
                        hint="Khi muốn chấm dứt HĐ"
                      />
                    </div>
                    <div className="form-row">
                      <FormInput
                        label="Ngày bắt đầu"
                        name="startDate"
                        value={data.startDate}
                        onChange={handleChange}
                        type="date"
                      />
                      <FormInput
                        label="Ngày kết thúc"
                        name="endDate"
                        value={data.endDate}
                        onChange={handleChange}
                        type="date"
                      />
                    </div>

                    <FormTextArea
                      label="Điều khoản bổ sung"
                      name="additionalTerms"
                      value={data.additionalTerms}
                      onChange={handleChange}
                      placeholder="Ví dụ: Không nuôi thú cưng, không hút thuốc trong nhà..."
                      hint="Thêm các thỏa thuận riêng giữa hai bên (không bắt buộc)"
                    />
                  </div>
                )}

                {/* Step 4: Preview */}
                {step === 4 && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <h3>Xem trước hợp đồng</h3>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                        }}
                      >
                        {showClearConfirm ? (
                          <>
                            <span
                              style={{
                                fontSize: '0.85rem',
                                color: 'var(--danger)',
                              }}
                            >
                              Xóa bản nháp?
                            </span>
                            <button
                              className="btn btn-sm"
                              onClick={() => setShowClearConfirm(false)}
                            >
                              Hủy
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={confirmClear}
                            >
                              Xóa
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={clearDraft}
                          >
                            🗑️ Xóa nháp
                          </button>
                        )}
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={exportPDF}
                        >
                          📥 Xuất PDF
                        </button>
                      </div>
                    </div>
                    <div className="info-box">
                      💡 Kiểm tra kỹ thông tin trước khi xuất PDF. Bạn có thể
                      quay lại các bước trước để chỉnh sửa.
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="wizard-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={prev}
                    disabled={step === 0}
                    style={{ opacity: step === 0 ? 0.4 : 1 }}
                  >
                    ← {p('back')}
                  </button>
                  {step < 4 ? (
                    <button className="btn btn-primary" onClick={next}>
                      {isVi ? 'Tiếp theo' : 'Next'} →
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={exportPDF}>
                      📥 {p('export_pdf')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW */}
            <div className="contract-preview">
              <div className="contract-preview-header">
                <span>📄 {p('preview')}</span>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={exportPDF}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  📥 {p('export_pdf')}
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
