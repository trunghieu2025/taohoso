import { InvoiceItem, InvoiceData, SummaryRow } from '../../types';

// Pre-filled company defaults from invoice template
export const COMPANY_DEFAULTS = {
  companyName: 'CÔNG TY TNHH',
  companyAddress: 'Phường Quy Nhơn, Tỉnh Gia Lai',
  companyPhone: '0795 888 999 - 0905 888 999',
  companyBank: '5580161161 - BIDV - NGUYEN VAN A',
};

// Factory for a blank item row
export function emptyItem(): InvoiceItem {
  return { date: '', name: '', unit: '', spec: '', qty: 0, price: 0, customFields: {} };
}

// Factory for a blank summary row
export function emptySummaryRow(): SummaryRow {
  return { label: '', value: 0 };
}

// Initial form state — summary has no extra rows by default
export const INITIAL_INVOICE_DATA: InvoiceData = {
  ...COMPANY_DEFAULTS,
  customerName: '',
  customerAddress: '',
  customerPhone: '',
  items: [emptyItem()],
  customColumns: [],
  summaryRows: [],
  note: '',
};
