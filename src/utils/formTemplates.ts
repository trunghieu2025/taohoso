/**
 * Form template presets for BundleForm.
 * Each preset = list of common tags + labels for a project type.
 */

export interface FormTemplate {
    id: string;
    name: string;
    icon: string;
    description: string;
    tags: string[];
    labels: Record<string, string>;
}

export const FORM_TEMPLATES: FormTemplate[] = [
    {
        id: 'sua-chua',
        name: 'Sửa chữa nhỏ',
        icon: '🔧',
        description: 'Hồ sơ sửa chữa công trình nhỏ (< 500 triệu)',
        tags: [
            'TÊN_CT', 'ĐỊA_CHỈ', 'NĂM', 'CHỦ_ĐẦU_TƯ', 'ĐẠI_DIỆN_CĐT',
            'TÊN_NHÀ_THẦU', 'ĐẠI_DIỆN_NT', 'ĐỊA_CHỈ_NT', 'MÃ_SỐ_THUẾ',
            'SỐ_HĐ', 'NGÀY_HĐ', 'GIÁ_TRỊ_HĐ', 'NGUỒN_KP',
            'NGÀY_KHOÁN', 'NGÀY_NGHIỆM_THU',
        ],
        labels: {
            'TÊN_CT': 'Tên công trình', 'ĐỊA_CHỈ': 'Địa chỉ', 'NĂM': 'Năm',
            'CHỦ_ĐẦU_TƯ': 'Chủ đầu tư', 'ĐẠI_DIỆN_CĐT': 'Đại diện CĐT',
            'TÊN_NHÀ_THẦU': 'Tên nhà thầu', 'ĐẠI_DIỆN_NT': 'Đại diện NT',
            'ĐỊA_CHỈ_NT': 'Địa chỉ nhà thầu', 'MÃ_SỐ_THUẾ': 'Mã số thuế',
            'SỐ_HĐ': 'Số hợp đồng', 'NGÀY_HĐ': 'Ngày ký HĐ',
            'GIÁ_TRỊ_HĐ': 'Giá trị hợp đồng', 'NGUỒN_KP': 'Nguồn kinh phí',
            'NGÀY_KHOÁN': 'Ngày khoán', 'NGÀY_NGHIỆM_THU': 'Ngày nghiệm thu',
        },
    },
    {
        id: 'xay-moi',
        name: 'Xây mới',
        icon: '🏗️',
        description: 'Hồ sơ xây dựng công trình mới',
        tags: [
            'TÊN_CT', 'ĐỊA_CHỈ', 'NĂM', 'CHỦ_ĐẦU_TƯ', 'ĐẠI_DIỆN_CĐT',
            'CƠ_QUAN_QUYẾT_ĐỊNH', 'SỐ_QĐ', 'NGÀY_QĐ',
            'TÊN_NHÀ_THẦU', 'ĐẠI_DIỆN_NT', 'ĐỊA_CHỈ_NT', 'MÃ_SỐ_THUẾ', 'TÀI_KHOẢN',
            'TƯ_VẤN_GIÁM_SÁT', 'ĐẠI_DIỆN_TVGS',
            'TƯ_VẤN_THIẾT_KẾ', 'ĐẠI_DIỆN_TVTK',
            'SỐ_HĐ', 'NGÀY_HĐ', 'GIÁ_TRỊ_HĐ', 'GIÁ_TRỊ_DỰ_TOÁN',
            'NGUỒN_KP', 'THỜI_GIAN_THI_CÔNG',
            'NGÀY_KHỞI_CÔNG', 'NGÀY_HOÀN_THÀNH', 'NGÀY_NGHIỆM_THU',
        ],
        labels: {
            'TÊN_CT': 'Tên công trình', 'ĐỊA_CHỈ': 'Địa chỉ', 'NĂM': 'Năm',
            'CHỦ_ĐẦU_TƯ': 'Chủ đầu tư', 'ĐẠI_DIỆN_CĐT': 'Đại diện CĐT',
            'CƠ_QUAN_QUYẾT_ĐỊNH': 'Cơ quan quyết định', 'SỐ_QĐ': 'Số quyết định', 'NGÀY_QĐ': 'Ngày quyết định',
            'TÊN_NHÀ_THẦU': 'Tên nhà thầu', 'ĐẠI_DIỆN_NT': 'Đại diện NT',
            'ĐỊA_CHỈ_NT': 'Địa chỉ nhà thầu', 'MÃ_SỐ_THUẾ': 'Mã số thuế', 'TÀI_KHOẢN': 'Số tài khoản',
            'TƯ_VẤN_GIÁM_SÁT': 'Tư vấn giám sát', 'ĐẠI_DIỆN_TVGS': 'Đại diện TVGS',
            'TƯ_VẤN_THIẾT_KẾ': 'Tư vấn thiết kế', 'ĐẠI_DIỆN_TVTK': 'Đại diện TVTK',
            'SỐ_HĐ': 'Số hợp đồng', 'NGÀY_HĐ': 'Ngày ký HĐ',
            'GIÁ_TRỊ_HĐ': 'Giá trị HĐ', 'GIÁ_TRỊ_DỰ_TOÁN': 'Giá trị dự toán',
            'NGUỒN_KP': 'Nguồn kinh phí', 'THỜI_GIAN_THI_CÔNG': 'Thời gian thi công',
            'NGÀY_KHỞI_CÔNG': 'Ngày khởi công', 'NGÀY_HOÀN_THÀNH': 'Ngày hoàn thành',
            'NGÀY_NGHIỆM_THU': 'Ngày nghiệm thu',
        },
    },
    {
        id: 'bao-tri',
        name: 'Bảo trì định kỳ',
        icon: '🔩',
        description: 'Hồ sơ bảo trì, bảo dưỡng định kỳ',
        tags: [
            'TÊN_CT', 'ĐỊA_CHỈ', 'NĂM', 'ĐƠN_VỊ_QUẢN_LÝ',
            'TÊN_NHÀ_THẦU', 'ĐẠI_DIỆN_NT',
            'SỐ_HĐ', 'NGÀY_HĐ', 'GIÁ_TRỊ_HĐ',
            'NỘI_DUNG_BẢO_TRÌ', 'CHU_KỲ', 'NGÀY_THỰC_HIỆN',
        ],
        labels: {
            'TÊN_CT': 'Tên công trình', 'ĐỊA_CHỈ': 'Địa chỉ', 'NĂM': 'Năm',
            'ĐƠN_VỊ_QUẢN_LÝ': 'Đơn vị quản lý',
            'TÊN_NHÀ_THẦU': 'Tên nhà thầu', 'ĐẠI_DIỆN_NT': 'Đại diện NT',
            'SỐ_HĐ': 'Số hợp đồng', 'NGÀY_HĐ': 'Ngày ký HĐ', 'GIÁ_TRỊ_HĐ': 'Giá trị HĐ',
            'NỘI_DUNG_BẢO_TRÌ': 'Nội dung bảo trì', 'CHU_KỲ': 'Chu kỳ bảo trì',
            'NGÀY_THỰC_HIỆN': 'Ngày thực hiện',
        },
    },
];
