// Live invoice preview panel — mirrors the PDF layout in a readable format
import { InvoiceData } from '../../types';

interface Props {
  data: InvoiceData;
  logoDataUrl: string;
  subtotal: number;
  remaining: number;
  onClose?: () => void;
}

export default function InvoicePreview({
  data,
  logoDataUrl,
  subtotal,
  remaining,
  onClose,
}: Props) {
  const fmt = (n: number) => n.toLocaleString('vi-VN');
  const today = new Date();

  const visibleItems = data.items.filter((i) => i.name || i.qty || i.price);
  const customCols = data.customColumns || [];

  // Fixed headers + custom column headers
  const fixedHeaders = ['Ngày', 'Tên hàng', 'ĐVT', 'SL', 'Đơn giá', 'Thành tiền'];

  return (
    <div className="contract-preview">
      <div className="contract-preview-header">
        <span>Xem trước hoá đơn</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              fontWeight: 400,
            }}
          >
            {today.getDate()}/{today.getMonth() + 1}/{today.getFullYear()}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: 'var(--text-muted)',
                lineHeight: 1,
                padding: '0 2px',
              }}
              title="Đóng"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="contract-preview-body">
        {/* Company header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          {logoDataUrl && (
            <img
              src={logoDataUrl}
              alt="Logo"
              style={{
                maxWidth: '60px',
                maxHeight: '60px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ textAlign: logoDataUrl ? 'left' : 'center', flex: 1 }}>
            <p
              style={{
                fontWeight: 700,
                textTransform: 'uppercase',
                fontSize: '0.95rem',
                margin: '0 0 2px',
              }}
            >
              {data.companyName || 'Tên công ty'}
            </p>
            {data.companyAddress && (
              <p style={{ margin: '1px 0', fontSize: '0.78rem' }}>
                Đ/C: {data.companyAddress}
              </p>
            )}
            {data.companyPhone && (
              <p style={{ margin: '1px 0', fontSize: '0.78rem' }}>
                SĐT: {data.companyPhone}
              </p>
            )}
            {data.companyBank && (
              <p style={{ margin: '1px 0', fontSize: '0.78rem' }}>
                STK: {data.companyBank}
              </p>
            )}
          </div>
        </div>

        <h2 style={{ fontSize: '1rem', margin: '0 0 8px' }}>
          HOÁ ĐƠN BÁN HÀNG
        </h2>

        {/* Customer */}
        <p style={{ margin: '2px 0' }}>
          <strong>Khách hàng:</strong>{' '}
          <span className="contract-highlight">
            {data.customerName || '...'}
          </span>
        </p>
        {data.customerAddress && (
          <p style={{ margin: '2px 0' }}>Địa chỉ: {data.customerAddress}</p>
        )}
        {data.customerPhone && (
          <p style={{ margin: '2px 0 10px' }}>SĐT: {data.customerPhone}</p>
        )}

        {/* Item table */}
        {visibleItems.length > 0 && (
          <div style={{ overflowX: 'auto', marginBottom: '10px' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.78rem',
              }}
            >
              <thead>
                <tr style={{ background: 'var(--bg-secondary, #f5f5f5)' }}>
                  {fixedHeaders.map((h) => (
                    <th
                      key={h}
                      style={{
                        border: '1px solid var(--border)',
                        padding: '3px 5px',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                  {customCols.map((col) => (
                    <th
                      key={col.id}
                      style={{
                        border: '1px solid var(--border)',
                        padding: '3px 5px',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col.title}
                      {col.type === 'formula' && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--primary, #4f46e5)', marginLeft: '3px' }}>ƒx</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item, idx) => {
                  const resolvedFields = item.customFields || {};
                  return (
                    <tr key={idx}>
                      <td
                        style={{
                          border: '1px solid var(--border)',
                          padding: '3px 5px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.date}
                      </td>
                      <td
                        style={{
                          border: '1px solid var(--border)',
                          padding: '3px 5px',
                        }}
                      >
                        {item.name}
                      </td>
                      <td
                        style={{
                          border: '1px solid var(--border)',
                          padding: '3px 5px',
                          textAlign: 'center',
                        }}
                      >
                        {item.unit}
                      </td>
                      <td
                        style={{
                          border: '1px solid var(--border)',
                          padding: '3px 5px',
                          textAlign: 'center',
                        }}
                      >
                        {item.qty || ''}
                      </td>
                      <td
                        style={{
                          border: '1px solid var(--border)',
                          padding: '3px 5px',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.price ? fmt(item.price) : ''}
                      </td>
                      <td
                        style={{
                          border: '1px solid var(--border)',
                          padding: '3px 5px',
                          textAlign: 'right',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.qty && item.price ? fmt(item.qty * item.price) : ''}
                      </td>
                      {customCols.map((col) => {
                        const val = resolvedFields[col.id] || '';
                        const numVal = parseFloat(val);
                        const displayVal = !isNaN(numVal) && val !== 'Lỗi'
                          ? numVal.toLocaleString('vi-VN')
                          : val;
                        return (
                          <td
                            key={col.id}
                            style={{
                              border: '1px solid var(--border)',
                              padding: '3px 5px',
                              textAlign: col.type === 'formula' ? 'right' : 'left',
                              fontWeight: col.type === 'formula' ? 500 : 400,
                              whiteSpace: 'nowrap',
                              color: col.type === 'formula' ? 'var(--primary, #4f46e5)' : undefined,
                            }}
                          >
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div style={{ marginLeft: 'auto', maxWidth: '220px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '3px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span style={{ fontWeight: 600 }}>Thành tiền</span>
            <span style={{ fontWeight: 600 }}>{fmt(subtotal)} ₫</span>
          </div>
          {data.summaryRows
            .filter((r) => r.label || r.value)
            .map((row, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span>{row.label || '—'}</span>
                <span
                  style={{
                    color:
                      row.value < 0 ? 'var(--success, #16a34a)' : undefined,
                  }}
                >
                  {fmt(row.value)} ₫
                </span>
              </div>
            ))}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '5px 0',
              borderTop: '2px solid var(--border)',
              marginTop: '2px',
            }}
          >
            <span style={{ fontWeight: 700 }}>Còn lại</span>
            <span
              style={{
                fontWeight: 700,
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
        {data.note && (
          <p
            style={{
              marginTop: '10px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
            }}
          >
            Ghi chú: {data.note}
          </p>
        )}

        {/* Signature section */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '24px',
            textAlign: 'center',
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>NGƯỜI MUA</p>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              (Ký, ghi rõ họ tên)
            </p>
            <div
              style={{
                marginTop: '48px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              {data.customerName || ''}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>NGƯỜI BÁN</p>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              (Ký, ghi rõ họ tên)
            </p>
            <div
              style={{
                marginTop: '48px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              {data.companyName || ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
