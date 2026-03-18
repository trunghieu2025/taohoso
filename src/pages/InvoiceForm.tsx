import { useState, ChangeEvent, useRef } from 'react';
import { FormInput, FormTextArea } from '../components/FormField';
import { InvoiceData, CustomColumn } from '../types';
import { useLanguage } from '../i18n/i18n';
import {
  INITIAL_INVOICE_DATA,
  emptySummaryRow,
} from './invoice-form/invoice-form-constants';
import InvoiceTableRows from './invoice-form/InvoiceTableRows';
import InvoicePreview from './invoice-form/InvoicePreview';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { resolveCustomFields } from '../utils/formulaEvaluator';

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

export type ScaleMode = 'default' | 'fit-page' | 'fit-width' | 'fit-height';

export default function InvoiceForm() {
  const [data, setData] = useState<InvoiceData>(INITIAL_INVOICE_DATA);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [scaleMode, setScaleMode] = useState<ScaleMode>('default');
  const { lang } = useLanguage();
  const isVi = lang === 'vi';

  // Custom column dialog state
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [newColType, setNewColType] = useState<'text' | 'formula'>('text');
  const [newColFormula, setNewColFormula] = useState('');

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

  // --- Custom column helpers ---
  const addCustomColumn = () => {
    if (!newColTitle.trim()) return;
    const col: CustomColumn = {
      id: `col_${Date.now()}`,
      title: newColTitle.trim(),
      type: newColType,
      formula: newColType === 'formula' ? newColFormula : '',
    };
    setData((prev) => ({
      ...prev,
      customColumns: [...prev.customColumns, col],
    }));
    setNewColTitle('');
    setNewColType('text');
    setNewColFormula('');
    setShowAddColumn(false);
  };

  const removeCustomColumn = (colId: string) => {
    setData((prev) => ({
      ...prev,
      customColumns: prev.customColumns.filter((c) => c.id !== colId),
      items: prev.items.map((item) => {
        const cf = { ...item.customFields };
        delete cf[colId];
        return { ...item, customFields: cf };
      }),
    }));
  };

  const updateCustomColumnTitle = (colId: string, title: string) => {
    setData((prev) => ({
      ...prev,
      customColumns: prev.customColumns.map((c) =>
        c.id === colId ? { ...c, title } : c,
      ),
    }));
  };

  // Resolve formula fields for preview/display
  const resolvedItems = data.items.map((item) => ({
    ...item,
    customFields: resolveCustomFields(item, data.customColumns),
  }));

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

  // Dialog overlay style
  const dialogOverlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 1100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  };
  const dialogBox: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>{isVi ? 'Hoá Đơn Bán Hàng' : 'Sales Invoice'}</h1>
          <p>{isVi ? 'Tạo hoá đơn bán hàng, xuất PDF in hoặc lưu trữ' : 'Create sales invoices, export PDF for printing or archiving'}</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="wizard">
            {/* Company info */}
            <div className="wizard-content">
              <h3 style={{ marginBottom: '1rem' }}>{isVi ? 'Thông tin công ty' : 'Company Information'}</h3>
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
                          {isVi ? 'Tải logo' : 'Upload logo'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Company fields */}
                <div style={{ flex: 1 }}>
                  <div className="form-row">
                    <FormInput
                      label={isVi ? 'Tên công ty' : 'Company Name'}
                      name="companyName"
                      value={data.companyName}
                      onChange={handleStr}
                    />
                    <FormInput
                      label={isVi ? 'Địa chỉ' : 'Address'}
                      name="companyAddress"
                      value={data.companyAddress}
                      onChange={handleStr}
                    />
                  </div>
                  <div className="form-row">
                    <FormInput
                      label={isVi ? 'Số điện thoại' : 'Phone'}
                      name="companyPhone"
                      value={data.companyPhone}
                      onChange={handleStr}
                    />
                    <FormInput
                      label={isVi ? 'Số tài khoản' : 'Bank Account'}
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
              <h3 style={{ marginBottom: '1rem' }}>{isVi ? 'Thông tin khách hàng' : 'Customer Information'}</h3>
              <div className="form-row">
                <FormInput
                  label={isVi ? 'Tên khách hàng' : 'Customer Name'}
                  name="customerName"
                  value={data.customerName}
                  onChange={handleStr}
                  placeholder={isVi ? 'Anh / Chị...' : 'Mr. / Ms...'}
                />
                <FormInput
                  label={isVi ? 'Địa chỉ' : 'Address'}
                  name="customerAddress"
                  value={data.customerAddress}
                  onChange={handleStr}
                  placeholder={isVi ? 'Địa chỉ giao hàng' : 'Shipping address'}
                />
              </div>
              <FormInput
                label={isVi ? 'Số điện thoại' : 'Phone'}
                name="customerPhone"
                value={data.customerPhone}
                onChange={handleStr}
                placeholder="09xx..."
              />
            </div>

            {/* Item table */}
            <div className="wizard-content" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>{isVi ? 'Danh sách hàng hoá' : 'Product List'}</h3>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowAddColumn(true)}
                  title={isVi ? 'Thêm cột tuỳ chỉnh' : 'Add custom column'}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> {isVi ? 'Thêm cột' : 'Add column'}
                </button>
              </div>
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
                      {(isVi ? [
                        'Ngày', 'Tên hàng hoá', 'ĐVT', 'Quy Cách', 'SL', 'Đơn giá', 'Thành tiền',
                      ] : [
                        'Date', 'Product', 'Unit', 'Spec', 'Qty', 'Price', 'Total',
                      ]).map((h) => (
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
                      {/* Custom column headers */}
                      {data.customColumns.map((col) => (
                        <th
                          key={col.id}
                          style={{
                            padding: '8px 6px',
                            textAlign: 'left',
                            whiteSpace: 'nowrap',
                            fontWeight: 600,
                            position: 'relative',
                            minWidth: '100px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              value={col.title}
                              onChange={(e) => updateCustomColumnTitle(col.id, e.target.value)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                padding: '0',
                                width: '100%',
                                minWidth: '60px',
                              }}
                              title="Nhấn để sửa tên cột"
                            />
                            {col.type === 'formula' && (
                              <span title={`Công thức: ${col.formula}`} style={{ fontSize: '0.7rem', color: 'var(--primary, #4f46e5)', cursor: 'help' }}>
                                ƒx
                              </span>
                            )}
                            <button
                              onClick={() => removeCustomColumn(col.id)}
                              title="Xóa cột"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--danger, #e53e3e)',
                                fontSize: '0.8rem',
                                lineHeight: 1,
                                padding: '0 2px',
                                flexShrink: 0,
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </th>
                      ))}
                      {/* Empty header for delete button column */}
                      <th style={{ padding: '8px 6px' }}></th>
                    </tr>
                  </thead>
                  <InvoiceTableRows
                    items={data.items}
                    customColumns={data.customColumns}
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
                <span style={summaryLabelStyle}>{isVi ? 'Thành tiền' : 'Subtotal'}</span>
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
                  + {isVi ? 'Thêm dòng' : 'Add row'}
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
                  {isVi ? 'Còn lại' : 'Remaining'}
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
                label={isVi ? 'Ghi chú' : 'Notes'}
                name="note"
                value={data.note}
                onChange={handleStr}
                placeholder={isVi ? 'Ghi chú thêm...' : 'Additional notes...'}
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
                    {isVi ? 'Xóa tất cả?' : 'Clear all?'}
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    {isVi ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      setData(INITIAL_INVOICE_DATA);
                      setShowClearConfirm(false);
                    }}
                  >
                    {isVi ? 'Xóa' : 'Delete'}
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowClearConfirm(true)}
                >
                  🗑️ {isVi ? 'Xóa tất cả' : 'Clear all'}
                </button>
              )}
              <button
                className="btn btn-outline"
                onClick={() => setShowPreview(true)}
              >
                👁️ {isVi ? 'Xem trước' : 'Preview'}
              </button>

              {/* Scale mode dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={scaleMode}
                  onChange={(e) => setScaleMode(e.target.value as ScaleMode)}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '0.85rem',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                  title="Tuỳ chọn kích thước khi in"
                >
                  <option value="default">{isVi ? 'Mặc định' : 'Default'}</option>
                  <option value="fit-page">{isVi ? 'Vừa 1 trang' : 'Fit page'}</option>
                  <option value="fit-width">{isVi ? 'Vừa chiều rộng' : 'Fit width'}</option>
                  <option value="fit-height">{isVi ? 'Vừa chiều cao' : 'Fit height'}</option>
                </select>
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    generateInvoicePDF(data, { subtotal, remaining }, logoDataUrl, scaleMode)
                  }
                >
                  📥 {isVi ? 'Xuất PDF' : 'Export PDF'}
                </button>
              </div>
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
              data={{ ...data, items: resolvedItems }}
              logoDataUrl={logoDataUrl}
              subtotal={subtotal}
              remaining={remaining}
              onClose={() => setShowPreview(false)}
            />
          </div>
        </div>
      )}

      {/* Add custom column dialog */}
      {showAddColumn && (
        <div style={dialogOverlay} onClick={() => setShowAddColumn(false)}>
          <div style={dialogBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>{isVi ? 'Thêm cột tuỳ chỉnh' : 'Add Custom Column'}</h3>

            <div style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.85rem' }}>{isVi ? 'Tên cột' : 'Column Name'}</label>
              <input
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                placeholder={isVi ? 'VD: Chiết khấu, Màu sắc...' : 'e.g. Discount, Color...'}
                autoFocus
                style={{
                  width: '100%',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.85rem' }}>{isVi ? 'Loại cột' : 'Column Type'}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`btn btn-sm ${newColType === 'text' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setNewColType('text')}
                >
                  📝 {isVi ? 'Nhập tay' : 'Manual'}
                </button>
                <button
                  className={`btn btn-sm ${newColType === 'formula' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setNewColType('formula')}
                >
                  ƒx {isVi ? 'Công thức' : 'Formula'}
                </button>
              </div>
            </div>

            {newColType === 'formula' && (
              <div style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.85rem' }}>{isVi ? 'Công thức' : 'Formula'}</label>
                <input
                  value={newColFormula}
                  onChange={(e) => setNewColFormula(e.target.value)}
                  placeholder="VD: SL * Đơn giá * 0.1"
                  style={{
                    width: '100%',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                  }}
                />
                <div style={{
                  marginTop: '6px',
                  padding: '8px 10px',
                  background: 'var(--bg-subtle, #f0f4ff)',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary, #555)',
                  lineHeight: 1.5,
                }}>
                  <strong>{isVi ? 'Biến có sẵn:' : 'Available variables:'}</strong> <code>SL</code>, <code>{isVi ? 'Đơn giá' : 'Price'}</code>, <code>{isVi ? 'Thành tiền' : 'Total'}</code>
                  {data.customColumns.length > 0 && (
                    <>
                      <br />
                      <strong>Cột custom:</strong>{' '}
                      {data.customColumns.map((c) => <code key={c.id} style={{ marginRight: '4px' }}>{c.title}</code>)}
                    </>
                  )}
                  <br />
                  <strong>Phép tính:</strong> <code>+</code> <code>-</code> <code>*</code> <code>/</code> <code>( )</code>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowAddColumn(false)}>{isVi ? 'Hủy' : 'Cancel'}</button>
              <button
                className="btn btn-sm btn-primary"
                onClick={addCustomColumn}
                disabled={!newColTitle.trim()}
              >
                ✓ {isVi ? 'Thêm cột' : 'Add column'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
