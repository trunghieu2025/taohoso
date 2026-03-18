import { useState, useCallback, ChangeEvent } from 'react';
import { generateCT01PDF } from '../utils/pdfGenerator';
import { FormInput, FormSelect } from '../components/FormField';
import { CT01Data } from '../types';
import { useLanguage } from '../i18n/i18n';

const initialData: CT01Data = {
  fullName: '',
  dob: '',
  gender: 'Nam',
  nationality: 'Việt Nam',
  idNumber: '',
  phone: '',
  email: '',
  currentAddress: '',
  newAddress: '',
  district: '',
  reason: 'Thay đổi nơi cư trú',
  moveDate: '',
  relationship: '',
  additionalPeople: [],
};

type FormChangeEvent = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

export default function CT01Form() {
  const [data, setData] = useState<CT01Data>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { lang } = useLanguage();
  const isVi = lang === 'vi';

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

  const addPerson = () => {
    setData((prev) => ({
      ...prev,
      additionalPeople: [
        ...prev.additionalPeople,
        { name: '', idNumber: '', relationship: '' },
      ],
    }));
  };

  const updatePerson = (idx: number, field: string, value: string) => {
    setData((prev) => {
      const people = [...prev.additionalPeople];
      people[idx] = { ...people[idx], [field]: value };
      return { ...prev, additionalPeople: people };
    });
  };

  const removePerson = (idx: number) => {
    setData((prev) => ({
      ...prev,
      additionalPeople: prev.additionalPeople.filter((_, i) => i !== idx),
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.fullName) e.fullName = isVi ? 'Vui lòng nhập họ tên' : 'Please enter full name';
    if (!data.idNumber) e.idNumber = isVi ? 'Vui lòng nhập số CCCD' : 'Please enter ID number';
    if (!data.currentAddress)
      e.currentAddress = isVi ? 'Vui lòng nhập nơi cư trú hiện tại' : 'Please enter current address';
    if (!data.newAddress) e.newAddress = isVi ? 'Vui lòng nhập nơi cư trú mới' : 'Please enter new address';
    if (!data.district) e.district = isVi ? 'Vui lòng nhập tên cơ quan công an' : 'Please enter police office name';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleExport = () => {
    if (validate()) generateCT01PDF(data);
  };

  const handleClear = () => setShowClearConfirm(true);
  const confirmClear = () => {
    setData(initialData);
    setShowClearConfirm(false);
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>{isVi ? 'Điền tờ khai CT01' : 'Fill CT01 Form'}</h1>
          <p>{isVi ? 'Tờ khai thay đổi thông tin cư trú theo Thông tư 55/2021/TT-BCA' : 'Residence change declaration form per Circular 55/2021/TT-BCA'}</p>
        </div>
      </div>

      <section className="section">
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="info-box">
            💡 <strong>{isVi ? 'Mẫu CT01' : 'CT01 Form'}</strong> {isVi
              ? 'dùng để đăng ký tạm trú, thường trú hoặc thay đổi thông tin cư trú. Điền thông tin bên dưới và xuất PDF để nộp tại cơ quan công an hoặc qua Cổng dịch vụ công quốc gia.'
              : 'is used for temporary/permanent residence registration or residence info change. Fill in the details below and export PDF to submit to the police office or through the National Public Service Portal.'}
          </div>

          <div className="wizard-content" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>{isVi ? 'Kính gửi' : 'To'}</h3>
            <FormInput
              label={isVi ? 'Công an (Quận/Huyện/TP)' : 'Police Office (District/City)'}
              name="district"
              value={data.district}
              onChange={handleChange}
              required
              placeholder={isVi ? 'Quận 1, TP. Hồ Chí Minh' : 'District 1, Ho Chi Minh City'}
              error={errors.district}
            />

            <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
              {isVi ? 'Thông tin người kê khai' : 'Declarant Information'}
            </h3>
            <FormInput
              label={isVi ? 'Họ và tên' : 'Full Name'}
              name="fullName"
              value={data.fullName}
              onChange={handleChange}
              required
              placeholder={isVi ? 'Nguyễn Văn A' : 'John Doe'}
              error={errors.fullName}
            />
            <div className="form-row">
              <FormInput
                label={isVi ? 'Ngày sinh' : 'Date of Birth'}
                name="dob"
                value={data.dob}
                onChange={handleChange}
                type="date"
              />
              <FormSelect
                label={isVi ? 'Giới tính' : 'Gender'}
                name="gender"
                value={data.gender}
                onChange={handleChange}
                options={isVi ? [
                  { value: 'Nam', label: 'Nam' },
                  { value: 'Nữ', label: 'Nữ' },
                ] : [
                  { value: 'Nam', label: 'Male' },
                  { value: 'Nữ', label: 'Female' },
                ]}
              />
            </div>
            <div className="form-row">
              <FormInput
                label={isVi ? 'Số CCCD/CMND' : 'ID Number'}
                name="idNumber"
                value={data.idNumber}
                onChange={handleChange}
                required
                placeholder="001234567890"
                error={errors.idNumber}
              />
              <FormInput
                label={isVi ? 'Quốc tịch' : 'Nationality'}
                name="nationality"
                value={data.nationality}
                onChange={handleChange}
                placeholder={isVi ? 'Việt Nam' : 'Vietnamese'}
              />
            </div>
            <div className="form-row">
              <FormInput
                label={isVi ? 'Số điện thoại' : 'Phone Number'}
                name="phone"
                value={data.phone}
                onChange={handleChange}
                placeholder="0901234567"
              />
              <FormInput
                label="Email"
                name="email"
                value={data.email}
                onChange={handleChange}
                type="email"
                placeholder="email@example.com"
              />
            </div>

            <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
              {isVi ? 'Thông tin cư trú' : 'Residence Information'}
            </h3>
            <FormInput
              label={isVi ? 'Nơi cư trú hiện tại' : 'Current Address'}
              name="currentAddress"
              value={data.currentAddress}
              onChange={handleChange}
              required
              placeholder={isVi ? 'Số 1, Đường ABC, Phường XYZ, Quận 1, TP.HCM' : '123 Main Street, District 1'}
              error={errors.currentAddress}
            />
            <FormInput
              label={isVi ? 'Nơi đăng ký cư trú mới' : 'New Residence Address'}
              name="newAddress"
              value={data.newAddress}
              onChange={handleChange}
              required
              placeholder={isVi ? 'Số 2, Đường DEF, Phường UVW, Quận 3, TP.HCM' : '456 Oak Avenue, District 3'}
              error={errors.newAddress}
            />
            <div className="form-row">
              <FormInput
                label={isVi ? 'Ngày bắt đầu cư trú mới' : 'New Residence Start Date'}
                name="moveDate"
                value={data.moveDate}
                onChange={handleChange}
                type="date"
              />
              <FormInput
                label={isVi ? 'Quan hệ với chủ hộ' : 'Relationship to Household Head'}
                name="relationship"
                value={data.relationship}
                onChange={handleChange}
                placeholder={isVi ? 'Bản thân / Con / Vợ / Chồng...' : 'Self / Child / Spouse...'}
              />
            </div>
            <FormSelect
              label={isVi ? 'Lý do thay đổi' : 'Reason for Change'}
              name="reason"
              value={data.reason}
              onChange={handleChange}
              options={isVi ? [
                { value: 'Thay đổi nơi cư trú', label: 'Thay đổi nơi cư trú' },
                { value: 'Đăng ký tạm trú', label: 'Đăng ký tạm trú' },
                { value: 'Đăng ký thường trú', label: 'Đăng ký thường trú' },
                { value: 'Tách hộ', label: 'Tách hộ' },
                { value: 'Nhập hộ', label: 'Nhập hộ' },
                { value: 'Điều chỉnh thông tin cư trú', label: 'Điều chỉnh thông tin cư trú' },
                { value: 'Xóa đăng ký tạm trú', label: 'Xóa đăng ký tạm trú' },
              ] : [
                { value: 'Thay đổi nơi cư trú', label: 'Change of residence' },
                { value: 'Đăng ký tạm trú', label: 'Temporary residence registration' },
                { value: 'Đăng ký thường trú', label: 'Permanent residence registration' },
                { value: 'Tách hộ', label: 'Household separation' },
                { value: 'Nhập hộ', label: 'Household merge' },
                { value: 'Điều chỉnh thông tin cư trú', label: 'Residence info adjustment' },
                { value: 'Xóa đăng ký tạm trú', label: 'Remove temporary registration' },
              ]}
            />

            {/* Additional people */}
            <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
              {isVi ? 'Người cùng đăng ký' : 'Co-registrants'}
              <span
                style={{
                  fontWeight: 400,
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  marginLeft: '0.5rem',
                }}
              >
                ({isVi ? 'không bắt buộc' : 'optional'})
              </span>
            </h3>
            {data.additionalPeople.map((person, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  position: 'relative',
                }}
              >
                <button
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.75rem',
                    background: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '1.2rem',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => removePerson(idx)}
                  title={isVi ? 'Xóa' : 'Remove'}
                >
                  ✕
                </button>
                <div className="form-group">
                  <label className="form-label">{isVi ? 'Họ tên' : 'Full Name'}</label>
                  <input
                    className="form-input"
                    value={person.name}
                    onChange={(e) => updatePerson(idx, 'name', e.target.value)}
                    placeholder={isVi ? 'Họ tên' : 'Full name'}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{isVi ? 'Số CCCD' : 'ID Number'}</label>
                    <input
                      className="form-input"
                      value={person.idNumber}
                      onChange={(e) =>
                        updatePerson(idx, 'idNumber', e.target.value)
                      }
                      placeholder="CCCD"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isVi ? 'Quan hệ với chủ hộ' : 'Relationship'}</label>
                    <input
                      className="form-input"
                      value={person.relationship}
                      onChange={(e) =>
                        updatePerson(idx, 'relationship', e.target.value)
                      }
                      placeholder={isVi ? 'Con / Vợ / Chồng...' : 'Child / Spouse...'}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              className="btn btn-outline btn-sm"
              onClick={addPerson}
              style={{ marginBottom: '1rem' }}
            >
              + {isVi ? 'Thêm người' : 'Add person'}
            </button>

            {/* Actions */}
            <div className="wizard-actions">
              {showClearConfirm ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--danger)' }}>{isVi ? 'Xóa tất cả?' : 'Clear all?'}</span>
                  <button className="btn btn-sm" onClick={() => setShowClearConfirm(false)}>{isVi ? 'Hủy' : 'Cancel'}</button>
                  <button className="btn btn-sm btn-danger" onClick={confirmClear}>{isVi ? 'Xóa' : 'Delete'}</button>
                </div>
              ) : (
                <button className="btn btn-secondary" onClick={handleClear}>
                  🗑️ {isVi ? 'Xóa tất cả' : 'Clear all'}
                </button>
              )}
              <button className="btn btn-primary" onClick={handleExport}>
                📥 {isVi ? 'Xuất PDF tờ khai CT01' : 'Export CT01 PDF'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
