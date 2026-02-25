import { useState, ChangeEvent, useRef } from 'react';
import { FormInput, FormTextArea } from '../components/FormField';
import { InvoiceData } from '../types';
import {
  INITIAL_INVOICE_DATA,
  emptySummaryRow,
} from './invoice-form/invoice-form-constants';
import InvoiceTableRows from './invoice-form/InvoiceTableRows';
import InvoicePreview from './invoice-form/InvoicePreview';
import { generateInvoicePDF } from '../utils/pdfGenerator';

type StrField = keyof Pick<
  InvoiceData,
  | 'companyName'
  | 'companyAddress'
  | 'companyPhone'
  | 'companyBank'
  | 'customerName'
  | 'customerAddress'
  | 'customerPhone'
  | 'note'
>;

export default function InvoiceForm() {
  const [data, setData] = useState<InvoiceData>(INITIAL_INVOICE_DATA);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Derived totals
  const subtotal = data.items.reduce((s, i) => s + i.qty * i.price, 0);
  const remaining =
    subtotal + data.summaryRows.reduce((s, r) => s + r.value, 0);
  const fmt = (n: number) => n.toLocaleString('vi-VN');

  const updateSummaryRow = (
    idx: number,
    field: 'label' | 'value',
    val: string,
  ) => {
    const rows = [...data.summaryRows];
    rows[idx] = {
      ...rows[idx],
      [field]: field === 'value' ? parseFloat(val) || 0 : val,
    };
    setData((prev) => ({ ...prev, summaryRows: rows }));
  };

  const removeSummaryRow = (idx: number) =>
    setData((prev) => ({
      ...prev,
      summaryRows: prev.summaryRows.filter((_, i) => i !== idx),
    }));

  const handleStr = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name as StrField]: value }));
  };

  const summaryRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid var(--border)',
  };
  const summaryLabelStyle: React.CSSProperties = {
    fontWeight: 600,
    minWidth: '160px',
  };
  const summaryValueStyle: React.CSSProperties = {
    textAlign: 'right',
    fontWeight: 600,
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Hoá Đơn Bán Hàng</h1>
          <p>Tạo hoá đơn bán hàng, xuất PDF in hoặc lưu trữ</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="wizard">
            {/* Company info */}
            <div className="wizard-content">
              <h3 style={{ marginBottom: '1rem' }}>Thông tin công ty</h3>
              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'flex-start',
                }}
              >
                {/* Logo upload */}
                <div style={{ flexShrink: 0 }}>
                  <label className="form-label">Logo</label>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleLogoUpload}
                  />
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    style={{
                      width: '120px',
                      height: '120px',
                      border: '2px dashed var(--border)',
                      borderRadius: 'var(--radius, 8px)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                      background: 'var(--bg-subtle, #f7f7f7)',
                    }}
                  >
                    {logoDataUrl ? (
                      <>
                        <img
                          src={logoDataUrl}
                          alt="Logo"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLogoDataUrl('');
                            if (logoInputRef.current)
                              logoInputRef.current.value = '';
                          }}
                          title="Xóa logo"
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(0,0,0,0.5)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            lineHeight: 1,
                          }}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          style={{
                            fontSize: '1.8rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          +
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                          }}
                        >
                          Tải logo
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Company fields */}
                <div style={{ flex: 1 }}>
                  <div className="form-row">
                    <FormInput
                      label="Tên công ty"
                      name="companyName"
                      value={data.companyName}
                      onChange={handleStr}
                    />
                    <FormInput
                      label="Địa chỉ"
                      name="companyAddress"
                      value={data.companyAddress}
                      onChange={handleStr}
                    />
                  </div>
                  <div className="form-row">
                    <FormInput
                      label="Số điện thoại"
                      name="companyPhone"
                      value={data.companyPhone}
                      onChange={handleStr}
                    />
                    <FormInput
                      label="Số tài khoản"
                      name="companyBank"
                      value={data.companyBank}
                      onChange={handleStr}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Customer info */}
            <div className="wizard-content" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Thông tin khách hàng</h3>
              <div className="form-row">
                <FormInput
                  label="Tên khách hàng"
                  name="customerName"
                  value={data.customerName}
                  onChange={handleStr}
                  placeholder="Anh / Chị..."
                />
                <FormInput
                  label="Địa chỉ"
                  name="customerAddress"
                  value={data.customerAddress}
                  onChange={handleStr}
                  placeholder="Địa chỉ giao hàng"
                />
              </div>
              <FormInput
                label="Số điện thoại"
                name="customerPhone"
                value={data.customerPhone}
                onChange={handleStr}
                placeholder="09xx..."
              />
            </div>

            {/* Item table */}
            <div className="wizard-content" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Danh sách hàng hoá</h3>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.9rem',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: 'var(--bg-subtle, #f7f7f7)',
                        borderBottom: '2px solid var(--border)',
                      }}
                    >
                      {[
                        'Ngày',
                        'Tên hàng hoá',
                        'ĐVT',
                        'Quy Cách',
                        'SL',
                        'Đơn giá',
                        'Thành tiền',
                        '',
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '8px 6px',
                            textAlign: 'left',
                            whiteSpace: 'nowrap',
                            fontWeight: 600,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <InvoiceTableRows
                    items={data.items}
                    onChange={(items) =>
                      setData((prev) => ({ ...prev, items }))
                    }
                  />
                </table>
              </div>
            </div>

            {/* Summary */}
            <div
              className="wizard-content"
              style={{
                marginTop: '1.5rem',
                maxWidth: '480px',
                marginLeft: 'auto',
              }}
            >
              {/* Fixed: Thành tiền */}
              <div style={summaryRowStyle}>
                <span style={summaryLabelStyle}>Thành tiền</span>
                <span style={summaryValueStyle}>{fmt(subtotal)} ₫</span>
              </div>

              {/* Dynamic extra rows */}
              {data.summaryRows.map((row, idx) => (
                <div key={idx} style={{ ...summaryRowStyle, gap: '8px' }}>
                  <input
                    value={row.label}
                    onChange={(e) =>
                      updateSummaryRow(idx, 'label', e.target.value)
                    }
                    placeholder="Tên dòng..."
                    style={{
                      flex: 1,
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '0.9rem',
                    }}
                  />
                  <input
                    type="number"
                    value={row.value || ''}
                    onChange={(e) =>
                      updateSummaryRow(idx, 'value', e.target.value)
                    }
                    placeholder="0"
                    style={{
                      width: '120px',
                      textAlign: 'right',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                    }}
                  />
                  <span
                    style={{
                      minWidth: '16px',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    ₫
                  </span>
                  <button
                    onClick={() => removeSummaryRow(idx)}
                    title="Xóa dòng"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--danger, #e53e3e)',
                      fontSize: '1rem',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Add row button */}
              <div style={{ padding: '4px 0 8px' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      summaryRows: [...prev.summaryRows, emptySummaryRow()],
                    }))
                  }
                >
                  + Thêm dòng
                </button>
              </div>

              {/* Fixed: Còn lại */}
              <div
                style={{
                  ...summaryRowStyle,
                  borderBottom: 'none',
                  borderTop: '2px solid var(--border)',
                  paddingTop: '8px',
                }}
              >
                <span style={{ ...summaryLabelStyle, fontSize: '1.05rem' }}>
                  Còn lại
                </span>
                <span
                  style={{
                    ...summaryValueStyle,
                    fontSize: '1.1rem',
                    color:
                      remaining > 0
                        ? 'var(--danger, #e53e3e)'
                        : 'var(--success, #16a34a)',
                  }}
                >
                  {fmt(remaining)} ₫
                </span>
              </div>
            </div>

            {/* Note */}
            <div className="wizard-content" style={{ marginTop: '1rem' }}>
              <FormTextArea
                label="Ghi chú"
                name="note"
                value={data.note}
                onChange={handleStr}
                placeholder="Ghi chú thêm..."
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="wizard-actions" style={{ marginTop: '1.5rem' }}>
              {showClearConfirm ? (
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--danger, #e53e3e)',
                    }}
                  >
                    Xóa tất cả?
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Hủy
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      setData(INITIAL_INVOICE_DATA);
                      setShowClearConfirm(false);
                    }}
                  >
                    Xóa
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowClearConfirm(true)}
                >
                  🗑️ Xóa tất cả
                </button>
              )}
              <button
                className="btn btn-outline"
                onClick={() => setShowPreview(true)}
              >
                👁️ Xem trước
              </button>
              <button
                className="btn btn-primary"
                onClick={() =>
                  generateInvoicePDF(data, { subtotal, remaining }, logoDataUrl)
                }
              >
                📥 Xuất PDF
              </button>
            </div>
            {/* end actions */}
          </div>
          {/* end wizard */}
        </div>
        {/* end container */}
      </section>

      {/* Preview modal */}
      {showPreview && (
        <div
          onClick={() => setShowPreview(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '2rem 1rem',
            overflowY: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '720px' }}
          >
            <InvoicePreview
              data={data}
              logoDataUrl={logoDataUrl}
              subtotal={subtotal}
              remaining={remaining}
              onClose={() => setShowPreview(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
