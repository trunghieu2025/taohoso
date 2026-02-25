// Shared domain types used across components, pages, and utilities

export interface ContractData {
  template: string;
  // Landlord (Bên A)
  landlordName: string;
  landlordDob: string;
  landlordId: string;
  landlordIdDate: string;
  landlordIdPlace: string;
  landlordAddress: string;
  landlordPhone: string;
  landlordBank: string;
  landlordBankName: string;
  // Tenant (Bên B)
  tenantName: string;
  tenantDob: string;
  tenantId: string;
  tenantIdDate: string;
  tenantIdPlace: string;
  tenantAddress: string;
  tenantPhone: string;
  // Property
  propertyAddress: string;
  propertyArea: string;
  propertyFloors: string;
  propertyRooms: string;
  propertyDescription: string;
  propertyEquipment: string;
  // Financial
  rentAmount: string;
  rentAmountWords: string;
  depositAmount: string;
  depositAmountWords: string;
  paymentDay: string;
  paymentMethod: string;
  electricRate: string;
  waterRate: string;
  internetCost: string;
  otherCosts: string;
  // Lease
  leaseDuration: string;
  startDate: string;
  endDate: string;
  noticePeriod: string;
  // Terms
  additionalTerms: string;
  purpose: string;
}

export interface CT01Person {
  name: string;
  idNumber: string;
  relationship: string;
}

export interface CT01Data {
  fullName: string;
  dob: string;
  gender: string;
  nationality: string;
  idNumber: string;
  phone: string;
  email: string;
  currentAddress: string;
  newAddress: string;
  district: string;
  reason: string;
  moveDate: string;
  relationship: string;
  additionalPeople: CT01Person[];
}

export interface SearchItem {
  title: string;
  url: string;
  content: string;
  type: string;
  searchText: string;
}

// Invoice form types
export interface CustomColumn {
  id: string;
  title: string;
  type: 'text' | 'formula';
  formula: string; // only used when type === 'formula'
}

export interface SummaryRow {
  label: string;
  value: number; // positive = add, negative = deduct
}

export interface InvoiceItem {
  date: string;
  name: string;
  unit: string; // ĐVT
  spec: string; // Quy Cách
  qty: number; // SL
  price: number; // Đơn giá
  customFields: Record<string, string>; // columnId → value
}

export interface InvoiceData {
  // Company info
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyBank: string;
  // Customer
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  // Items
  items: InvoiceItem[];
  // Custom columns
  customColumns: CustomColumn[];
  // Summary — extra rows between Thành tiền and Còn lại
  summaryRows: SummaryRow[];
  note: string;
}
