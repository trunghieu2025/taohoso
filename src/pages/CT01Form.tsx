import { useState, useCallback, ChangeEvent } from 'react';
import { generateCT01PDF } from '../utils/pdfGenerator';
import { FormInput, FormSelect } from '../components/FormField';
import { CT01Data } from '../types';

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
    if (!data.fullName) e.fullName = 'Vui lòng nhập họ tên';
    if (!data.idNumber) e.idNumber = 'Vui lòng nhập số CCCD';
    if (!data.currentAddress)
      e.currentAddress = 'Vui lòng nhập nơi cư trú hiện tại';
    if (!data.newAddress) e.newAddress = 'Vui lòng nhập nơi cư trú mới';
    if (!data.district) e.district = 'Vui lòng nhập tên cơ quan công an';
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
          <h1>Điền tờ khai CT01</h1>
          <p>Tờ khai thay đổi thông tin cư trú theo Thông tư 55/2021/TT-BCA</p>
        </div>
      </div>

      <section className="section">
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="info-box">
            💡 <strong>Mẫu CT01</strong> dùng để đăng ký tạm trú, thường trú
            hoặc thay đổi thông tin cư trú. Điền thông tin bên dưới và xuất PDF
            để nộp tại cơ quan công an hoặc qua Cổng dịch vụ công quốc gia.
          </div>

          <div className="wizard-content" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Kính gửi</h3>
            <FormInput
              label="Công an (Quận/Huyện/TP)"
              name="district"
              value={data.district}
              onChange={handleChange}
              required
              placeholder="Quận 1, TP. Hồ Chí Minh"
              error={errors.district}
            />

            <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
              Thông tin người kê khai
            </h3>
            <FormInput
              label="Họ và tên"
              name="fullName"
              value={data.fullName}
              onChange={handleChange}
              required
              placeholder="Nguyễn Văn A"
              error={errors.fullName}
            />
            <div className="form-row">
              <FormInput
                label="Ngày sinh"
                name="dob"
                value={data.dob}
                onChange={handleChange}
                type="date"
              />
              <FormSelect
                label="Giới tính"
                name="gender"
                value={data.gender}
                onChange={handleChange}
                options={[
                  { value: 'Nam', label: 'Nam' },
                  { value: 'Nữ', label: 'Nữ' },
                ]}
              />
            </div>
            <div className="form-row">
              <FormInput
                label="Số CCCD/CMND"
                name="idNumber"
                value={data.idNumber}
                onChange={handleChange}
                required
                placeholder="001234567890"
                error={errors.idNumber}
              />
              <FormInput
                label="Quốc tịch"
                name="nationality"
                value={data.nationality}
                onChange={handleChange}
                placeholder="Việt Nam"
              />
            </div>
            <div className="form-row">
              <FormInput
                label="Số điện thoại"
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
              Thông tin cư trú
            </h3>
            <FormInput
              label="Nơi cư trú hiện tại"
              name="currentAddress"
              value={data.currentAddress}
              onChange={handleChange}
              required
              placeholder="Số 1, Đường ABC, Phường XYZ, Quận 1, TP.HCM"
              error={errors.currentAddress}
            />
            <FormInput
              label="Nơi đăng ký cư trú mới"
              name="newAddress"
              value={data.newAddress}
              onChange={handleChange}
              required
              placeholder="Số 2, Đường DEF, Phường UVW, Quận 3, TP.HCM"
              error={errors.newAddress}
            />
            <div className="form-row">
              <FormInput
                label="Ngày bắt đầu cư trú mới"
                name="moveDate"
                value={data.moveDate}
                onChange={handleChange}
                type="date"
              />
              <FormInput
                label="Quan hệ với chủ hộ"
                name="relationship"
                value={data.relationship}
                onChange={handleChange}
                placeholder="Bản thân / Con / Vợ / Chồng..."
              />
            </div>
            <FormSelect
              label="Lý do thay đổi"
              name="reason"
              value={data.reason}
              onChange={handleChange}
              options={[
                { value: 'Thay đổi nơi cư trú', label: 'Thay đổi nơi cư trú' },
                { value: 'Đăng ký tạm trú', label: 'Đăng ký tạm trú' },
                { value: 'Đăng ký thường trú', label: 'Đăng ký thường trú' },
                { value: 'Tách hộ', label: 'Tách hộ' },
                { value: 'Nhập hộ', label: 'Nhập hộ' },
                {
                  value: 'Điều chỉnh thông tin cư trú',
                  label: 'Điều chỉnh thông tin cư trú',
                },
                { value: 'Xóa đăng ký tạm trú', label: 'Xóa đăng ký tạm trú' },
              ]}
            />

            {/* Additional people */}
            <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
              Người cùng đăng ký
              <span
                style={{
                  fontWeight: 400,
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  marginLeft: '0.5rem',
                }}
              >
                (không bắt buộc)
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
                  title="Xóa"
                >
                  ✕
                </button>
                <div className="form-group">
                  <label className="form-label">Họ tên</label>
                  <input
                    className="form-input"
                    value={person.name}
                    onChange={(e) => updatePerson(idx, 'name', e.target.value)}
                    placeholder="Họ tên"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Số CCCD</label>
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
                    <label className="form-label">Quan hệ với chủ hộ</label>
                    <input
                      className="form-input"
                      value={person.relationship}
                      onChange={(e) =>
                        updatePerson(idx, 'relationship', e.target.value)
                      }
                      placeholder="Con / Vợ / Chồng..."
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
              + Thêm người
            </button>

            {/* Actions */}
            <div className="wizard-actions">
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
              <button className="btn btn-primary" onClick={handleExport}>
                📥 Xuất PDF tờ khai CT01
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
