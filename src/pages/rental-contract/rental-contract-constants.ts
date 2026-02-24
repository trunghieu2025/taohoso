// Constants and initial data for RentalContract wizard
import { ContractData } from '../../types';

export const TEMPLATES = [
    { id: 'nha-nguyen-can', icon: '🏠', name: 'Nhà nguyên căn', desc: 'Thuê cả căn nhà riêng' },
    { id: 'phong-tro', icon: '🛏️', name: 'Phòng trọ', desc: 'Thuê phòng trọ, nhà trọ' },
    { id: 'van-phong', icon: '🏢', name: 'Văn phòng', desc: 'Thuê văn phòng làm việc' },
    { id: 'mat-bang', icon: '🏪', name: 'Mặt bằng KD', desc: 'Thuê mặt bằng kinh doanh' },
];

export const STEP_LABELS = ['Chọn mẫu', 'Bên cho thuê', 'Bên thuê', 'Thông tin nhà', 'Xem trước'];

export const STORAGE_KEY = 'taohoso_contract_draft';

export const initialData: ContractData = {
    template: '',
    // Landlord
    landlordName: '', landlordDob: '', landlordId: '', landlordIdDate: '', landlordIdPlace: '',
    landlordAddress: '', landlordPhone: '', landlordBank: '', landlordBankName: '',
    // Tenant
    tenantName: '', tenantDob: '', tenantId: '', tenantIdDate: '', tenantIdPlace: '',
    tenantAddress: '', tenantPhone: '',
    // Property
    propertyAddress: '', propertyArea: '', propertyFloors: '', propertyRooms: '',
    propertyDescription: '', propertyEquipment: '',
    // Financial
    rentAmount: '', rentAmountWords: '', depositAmount: '', depositAmountWords: '',
    paymentDay: '05', paymentMethod: 'Tiền mặt hoặc chuyển khoản',
    electricRate: '', waterRate: '', internetCost: '', otherCosts: '',
    // Lease
    leaseDuration: '12', startDate: '', endDate: '',
    noticePeriod: '30',
    // Terms
    additionalTerms: '', purpose: 'Để ở',
};
