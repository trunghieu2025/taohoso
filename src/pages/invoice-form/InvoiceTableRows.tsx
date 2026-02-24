import { InvoiceItem } from '../../types';
import { emptyItem } from './invoice-form-constants';

interface Props {
  items: InvoiceItem[];
  onChange: (items: InvoiceItem[]) => void;
}

// Formats a number as Vietnamese currency (e.g. 1.700.000)
function fmtMoney(n: number): string {
  return n > 0 ? n.toLocaleString('vi-VN') : '';
}

// Updates a single field in one row and propagates the change up
function updateItem(
  items: InvoiceItem[],
  idx: number,
  field: keyof InvoiceItem,
  value: string,
): InvoiceItem[] {
  const updated = [...items];
  const item = { ...updated[idx] };
  if (field === 'qty' || field === 'price') {
    (item[field] as number) = parseFloat(value) || 0;
  } else {
    (item[field] as string) = value;
  }
  updated[idx] = item;
  return updated;
}

export default function InvoiceTableRows({ items, onChange }: Props) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '4px 6px',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
  };

  return (
    <>
      <tbody>
        {items.map((item, idx) => {
          const amount = item.qty * item.price;
          return (
            <tr key={idx}>
              <td style={{ padding: '4px' }}>
                <input
                  type="date"
                  style={inputStyle}
                  value={item.date}
                  onChange={(e) =>
                    onChange(updateItem(items, idx, 'date', e.target.value))
                  }
                />
              </td>
              <td style={{ padding: '4px' }}>
                <input
                  style={{ ...inputStyle, minWidth: '120px' }}
                  value={item.name}
                  placeholder="Tên hàng"
                  onChange={(e) =>
                    onChange(updateItem(items, idx, 'name', e.target.value))
                  }
                />
              </td>
              <td style={{ padding: '4px' }}>
                <input
                  style={{ ...inputStyle, width: '60px' }}
                  value={item.unit}
                  placeholder="ĐVT"
                  onChange={(e) =>
                    onChange(updateItem(items, idx, 'unit', e.target.value))
                  }
                />
              </td>
              <td style={{ padding: '4px' }}>
                <input
                  style={{ ...inputStyle, width: '90px' }}
                  value={item.spec}
                  placeholder="Quy cách"
                  onChange={(e) =>
                    onChange(updateItem(items, idx, 'spec', e.target.value))
                  }
                />
              </td>
              <td style={{ padding: '4px' }}>
                <input
                  type="number"
                  min="0"
                  style={{ ...inputStyle, width: '60px' }}
                  value={item.qty || ''}
                  placeholder="0"
                  onChange={(e) =>
                    onChange(updateItem(items, idx, 'qty', e.target.value))
                  }
                />
              </td>
              <td style={{ padding: '4px' }}>
                <input
                  type="number"
                  min="0"
                  style={{ ...inputStyle, width: '100px' }}
                  value={item.price || ''}
                  placeholder="0"
                  onChange={(e) =>
                    onChange(updateItem(items, idx, 'price', e.target.value))
                  }
                />
              </td>
              <td
                style={{
                  padding: '4px',
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                  minWidth: '90px',
                }}
              >
                {fmtMoney(amount)}
              </td>
              <td style={{ padding: '4px', textAlign: 'center' }}>
                <button
                  title="Xóa dòng"
                  disabled={items.length === 1}
                  onClick={() => onChange(items.filter((_, i) => i !== idx))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                    color:
                      items.length === 1
                        ? 'var(--text-muted)'
                        : 'var(--danger, #e53e3e)',
                    fontSize: '1rem',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={8} style={{ padding: '6px 4px' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onChange([...items, emptyItem()])}
            >
              + Thêm dòng
            </button>
          </td>
        </tr>
      </tfoot>
    </>
  );
}
