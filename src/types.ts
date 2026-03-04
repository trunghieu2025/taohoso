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

// Military document types — maps to MERGEFIELD names in Word template
export interface MilitaryDocData {
  // Đơn vị & địa chỉ
  ĐƠN_VỊ: string;               // Tên phòng/đơn vị (VD: PHÒNG Y)
  Điạ_chỉ_bộ_chỉ_huy: string;   // Địa chỉ (VD: 99 Lý Thường Kiệt...)
  // Năm & thời gian
  NĂM: string;                   // Năm (VD: 2025)
  QUÝ: string;                   // Quý thực hiện (VD: Quý I/2025)
  ngày_khởi_công: string;
  tháng_khỏi_công: string;
  // Tài chính
  SỐ_TIỀN: string;               // Số tiền (VD: 292.000.000)
  ST_BẰNG_CHỮ: string;           // Bằng chữ
  TỔNG_CỘNG: string;
  ẤN_ĐỊNH_SỐ_TIỀN: string;
  KINH_PHÍ: string;              // Nguồn kinh phí
  KHOẢN: string;                 // Khoản chi
  Mục_: string;                  // Mục ngân sách (VD: 6900)
  Tiểu_mục: string;              // Tiểu mục (VD: 6907)
  SỐ: string;                    // Số văn bản
  // Nhân sự - Lãnh đạo
  CHT: string;                   // Chỉ huy trưởng (VD: Đại tá Nguyễn Văn D)
  CHỈ_HUY_ĐƠN_VỊ: string;       // Chỉ huy đơn vị
  PTCHI_TIÊU_NGÀNH: string;      // Phụ trách chi tiêu ngành
  PT_BTC: string;                // Phụ trách ban tài chính
  ĐƠN_VỊ_NỘI_DUNG: string;      // Đơn vị nội dung (phòng HC-KT)
  // Nhân sự - Người đề nghị
  TÊN_A_HIẾU: string;
  CẤP_BẬC_A_HIẾU: string;
  CHỨC_VỤ_A_HIẾU: string;
  // Công trình & gói thầu
  TÊN_GÓI_THẦU: string;         // Tên gói thầu/hạng mục
  NỘI_DUNG_CHI_TIÊU: string;
  Về_việc: string;               // Về việc (đề xuất)
  Căn_cứ_dự_toán_mua: string;
  Căn_cứ_hợp_đồng_số: string;
  Tờ_trình_phê_duyện_kh_lcnt_và_dự_toán: string;
  thương_thảo_hđ: string;
  // Nhà thầu (Bên B)
  Tên_công_ty_hoặc_cửa_hàng: string;
  Đại_điện_ÔNG: string;
  Chức_vụ_của_công_ty: string;
  Địa_chỉ_công_ty_hoặc_cửa_hàng: string;
  SĐT_CÔNG_TY_HOẶC_CỬA_HÀNG: string;
  mã_số_thuế: string;
  Chủ_stk: string;               // Chủ tài khoản
  stk: string;                   // Số tài khoản
  Tại_ngân_hàng_gì: string;
}
