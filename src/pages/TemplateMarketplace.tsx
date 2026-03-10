import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FieldCategory } from '../utils/militaryDocGenerator';
import { FIELD_CATEGORY_INFO } from '../utils/militaryDocGenerator';

/* ── Template definitions ── */
export interface TemplateField {
    tag: string;
    label: string;
    fieldType: FieldCategory;
    placeholder: string;
}

export interface TemplateSet {
    id: string;
    name: string;
    icon: string;
    description: string;
    files: string[];
    fields: TemplateField[];
}

export const TEMPLATE_SETS: TemplateSet[] = [
    {
        id: 'giam-sat',
        name: 'Hồ sơ giám sát',
        icon: '📋',
        description: 'HĐ giám sát, BB nghiệm thu, QĐ chỉ định — đầy đủ bộ GS xây dựng',
        files: ['HĐ Giám sát.docx', 'BB Nghiệm thu.docx', 'QĐ Chỉ định.docx', 'Bìa HĐ.docx'],
        fields: [
            { tag: 'TEN_CONG_TRINH', label: 'Tên công trình', fieldType: 'project', placeholder: 'VD: Sửa chữa nhà kho K59' },
            { tag: 'DIA_DIEM', label: 'Địa điểm', fieldType: 'project', placeholder: 'VD: Hà Nội' },
            { tag: 'HANG_MUC', label: 'Hạng mục', fieldType: 'project', placeholder: 'VD: Hạng mục sửa chữa mái' },
            { tag: 'CHU_DAU_TU', label: 'Chủ đầu tư', fieldType: 'party', placeholder: 'VD: Bộ CHQS TP Hà Nội' },
            { tag: 'DAI_DIEN_CDT', label: 'Đại diện CĐT', fieldType: 'party', placeholder: 'VD: Nguyễn Văn A' },
            { tag: 'CHUC_VU_CDT', label: 'Chức vụ CĐT', fieldType: 'party', placeholder: 'VD: Chỉ huy trưởng' },
            { tag: 'NHA_THAU_GS', label: 'Nhà thầu giám sát', fieldType: 'party', placeholder: 'VD: Công ty TNHH Tư vấn ABC' },
            { tag: 'DAI_DIEN_GS', label: 'Đại diện nhà thầu GS', fieldType: 'party', placeholder: 'VD: Trần Văn B' },
            { tag: 'MST_GS', label: 'MST nhà thầu GS', fieldType: 'party', placeholder: 'VD: 0123456789' },
            { tag: 'DIA_CHI_GS', label: 'Địa chỉ nhà thầu GS', fieldType: 'party', placeholder: 'VD: 123 Đường ABC, Q1' },
            { tag: 'GIA_TRI_HD', label: 'Giá trị hợp đồng', fieldType: 'finance', placeholder: 'VD: 150.000.000' },
            { tag: 'GIA_TRI_BANG_CHU', label: 'Giá trị bằng chữ', fieldType: 'finance', placeholder: 'VD: Một trăm năm mươi triệu đồng' },
            { tag: 'THUE_VAT', label: 'Thuế VAT (%)', fieldType: 'finance', placeholder: 'VD: 8' },
            { tag: 'NGAY_KY', label: 'Ngày ký', fieldType: 'date', placeholder: 'VD: 15/03/2026' },
            { tag: 'THOI_HAN', label: 'Thời hạn thi công', fieldType: 'date', placeholder: 'VD: 180 ngày' },
        ],
    },
    {
        id: 'xay-lap',
        name: 'Hồ sơ xây lắp',
        icon: '🏗️',
        description: 'HĐ thi công, bảng khối lượng, dự toán — bộ XL hoàn chỉnh',
        files: ['HĐ Thi công.docx', 'Bảng khối lượng.docx', 'Dự toán.docx', 'BB Thương thảo.docx'],
        fields: [
            { tag: 'TEN_CONG_TRINH', label: 'Tên công trình', fieldType: 'project', placeholder: 'VD: Xây mới nhà điều hành' },
            { tag: 'DIA_DIEM', label: 'Địa điểm xây dựng', fieldType: 'project', placeholder: 'VD: TP Hồ Chí Minh' },
            { tag: 'GOI_THAU', label: 'Gói thầu', fieldType: 'project', placeholder: 'VD: Gói thầu số 01' },
            { tag: 'CHU_DAU_TU', label: 'Chủ đầu tư', fieldType: 'party', placeholder: 'VD: Ban QLDA Quân khu 7' },
            { tag: 'DAI_DIEN_CDT', label: 'Đại diện CĐT', fieldType: 'party', placeholder: 'VD: Nguyễn Văn A' },
            { tag: 'NHA_THAU_XL', label: 'Nhà thầu xây lắp', fieldType: 'party', placeholder: 'VD: Công ty CP Xây dựng XYZ' },
            { tag: 'DAI_DIEN_XL', label: 'Đại diện nhà thầu XL', fieldType: 'party', placeholder: 'VD: Lê Văn C' },
            { tag: 'MST_XL', label: 'MST nhà thầu XL', fieldType: 'party', placeholder: 'VD: 0987654321' },
            { tag: 'DIA_CHI_XL', label: 'Địa chỉ nhà thầu XL', fieldType: 'party', placeholder: 'VD: 456 Đường DEF' },
            { tag: 'STK_XL', label: 'Số tài khoản nhà thầu', fieldType: 'party', placeholder: 'VD: 1234.5678.9012' },
            { tag: 'GIA_TRI_HD', label: 'Giá trị hợp đồng', fieldType: 'finance', placeholder: 'VD: 2.500.000.000' },
            { tag: 'GIA_TRI_TRUOC_THUE', label: 'Giá trị trước thuế', fieldType: 'finance', placeholder: 'VD: 2.314.814.815' },
            { tag: 'GIA_TRI_BANG_CHU', label: 'Giá trị bằng chữ', fieldType: 'finance', placeholder: 'VD: Hai tỷ năm trăm triệu' },
            { tag: 'TAM_UNG', label: 'Tạm ứng', fieldType: 'finance', placeholder: 'VD: 500.000.000' },
            { tag: 'NGAY_KY', label: 'Ngày ký HĐ', fieldType: 'date', placeholder: 'VD: 10/03/2026' },
            { tag: 'THOI_GIAN_THI_CONG', label: 'Thời gian thi công', fieldType: 'date', placeholder: 'VD: 240 ngày' },
            { tag: 'NGAY_KHOI_CONG', label: 'Ngày khởi công', fieldType: 'date', placeholder: 'VD: 01/04/2026' },
            { tag: 'NGAY_HOAN_THANH', label: 'Ngày hoàn thành', fieldType: 'date', placeholder: 'VD: 30/11/2026' },
        ],
    },
    {
        id: 'qlda',
        name: 'Hồ sơ QLDA',
        icon: '📊',
        description: 'HĐ quản lý dự án, tờ trình, biên bản — bộ QLDA chuẩn',
        files: ['HĐ Quản lý DA.docx', 'Tờ trình.docx', 'BB Họp.docx'],
        fields: [
            { tag: 'TEN_DU_AN', label: 'Tên dự án', fieldType: 'project', placeholder: 'VD: Dự án sửa chữa doanh trại' },
            { tag: 'DIA_DIEM', label: 'Địa điểm', fieldType: 'project', placeholder: 'VD: Đà Nẵng' },
            { tag: 'CHU_DAU_TU', label: 'Chủ đầu tư', fieldType: 'party', placeholder: 'VD: Bộ CHQS TP Đà Nẵng' },
            { tag: 'BAN_QLDA', label: 'Ban QLDA', fieldType: 'party', placeholder: 'VD: Ban QLDA Quân khu 5' },
            { tag: 'DAI_DIEN_QLDA', label: 'Đại diện Ban QLDA', fieldType: 'party', placeholder: 'VD: Phạm Văn D' },
            { tag: 'TU_VAN_THAM_TRA', label: 'Tư vấn thẩm tra', fieldType: 'party', placeholder: 'VD: Công ty Tư vấn ABC' },
            { tag: 'GIA_TRI_DA', label: 'Tổng mức đầu tư', fieldType: 'finance', placeholder: 'VD: 5.000.000.000' },
            { tag: 'GIA_TRI_QLDA', label: 'Chi phí QLDA', fieldType: 'finance', placeholder: 'VD: 200.000.000' },
            { tag: 'NGAY_PHE_DUYET', label: 'Ngày phê duyệt', fieldType: 'date', placeholder: 'VD: 01/02/2026' },
            { tag: 'SO_QD', label: 'Số QĐ phê duyệt', fieldType: 'other', placeholder: 'VD: 123/QĐ-BCH' },
            { tag: 'NGAY_KY', label: 'Ngày ký', fieldType: 'date', placeholder: 'VD: 15/03/2026' },
            { tag: 'THOI_GIAN_THUC_HIEN', label: 'Thời gian thực hiện', fieldType: 'date', placeholder: 'VD: 12 tháng' },
        ],
    },
    {
        id: 'hop-dong-co-ban',
        name: 'Bộ HĐ cơ bản',
        icon: '📄',
        description: 'HĐ mua bán, thanh lý, phụ lục — bộ hợp đồng đa năng',
        files: ['Hợp đồng.docx', 'Thanh lý HĐ.docx', 'Phụ lục HĐ.docx'],
        fields: [
            { tag: 'BEN_A', label: 'Bên A', fieldType: 'party', placeholder: 'VD: Công ty TNHH Alpha' },
            { tag: 'DAI_DIEN_A', label: 'Đại diện bên A', fieldType: 'party', placeholder: 'VD: Nguyễn Văn A' },
            { tag: 'CHUC_VU_A', label: 'Chức vụ bên A', fieldType: 'party', placeholder: 'VD: Giám đốc' },
            { tag: 'DIA_CHI_A', label: 'Địa chỉ bên A', fieldType: 'party', placeholder: 'VD: 123 Đường ABC' },
            { tag: 'BEN_B', label: 'Bên B', fieldType: 'party', placeholder: 'VD: Công ty CP Beta' },
            { tag: 'DAI_DIEN_B', label: 'Đại diện bên B', fieldType: 'party', placeholder: 'VD: Trần Văn B' },
            { tag: 'CHUC_VU_B', label: 'Chức vụ bên B', fieldType: 'party', placeholder: 'VD: Phó giám đốc' },
            { tag: 'GIA_TRI_HD', label: 'Giá trị hợp đồng', fieldType: 'finance', placeholder: 'VD: 500.000.000' },
            { tag: 'NGAY_KY', label: 'Ngày ký', fieldType: 'date', placeholder: 'VD: 15/03/2026' },
            { tag: 'NOI_DUNG_HD', label: 'Nội dung HĐ', fieldType: 'other', placeholder: 'VD: Cung cấp vật tư xây dựng' },
        ],
    },
    {
        id: 'sua-chua',
        name: 'Hồ sơ sửa chữa',
        icon: '🔧',
        description: 'QĐ, HĐ, BB, bảng KL, bảng vật tư — bộ SC đầy đủ nhất',
        files: ['QĐ Sửa chữa.docx', 'HĐ Thi công.docx', 'BB Nghiệm thu.docx', 'Bảng khối lượng.docx', 'Bảng vật tư.docx'],
        fields: [
            { tag: 'TEN_CONG_TRINH', label: 'Tên công trình', fieldType: 'project', placeholder: 'VD: Sửa chữa nhà kho K59' },
            { tag: 'DIA_DIEM', label: 'Địa điểm', fieldType: 'project', placeholder: 'VD: Đồng Nai' },
            { tag: 'HANG_MUC', label: 'Hạng mục sửa chữa', fieldType: 'project', placeholder: 'VD: Sửa chữa mái, tường, nền' },
            { tag: 'QUY_MO', label: 'Quy mô', fieldType: 'project', placeholder: 'VD: Cấp IV, 1 tầng, 200m2' },
            { tag: 'CHU_DAU_TU', label: 'Chủ đầu tư', fieldType: 'party', placeholder: 'VD: Bộ CHQS tỉnh Đồng Nai' },
            { tag: 'DAI_DIEN_CDT', label: 'Đại diện CĐT', fieldType: 'party', placeholder: 'VD: Nguyễn Văn A' },
            { tag: 'NHA_THAU', label: 'Nhà thầu thi công', fieldType: 'party', placeholder: 'VD: Công ty TNHH XD 123' },
            { tag: 'DAI_DIEN_NT', label: 'Đại diện nhà thầu', fieldType: 'party', placeholder: 'VD: Lê Văn B' },
            { tag: 'MST_NT', label: 'MST nhà thầu', fieldType: 'party', placeholder: 'VD: 3602345678' },
            { tag: 'DIA_CHI_NT', label: 'Địa chỉ nhà thầu', fieldType: 'party', placeholder: 'VD: 789 Đường GHI' },
            { tag: 'STK_NT', label: 'Số tài khoản', fieldType: 'party', placeholder: 'VD: 4567.8901.2345' },
            { tag: 'NGAN_HANG', label: 'Ngân hàng', fieldType: 'party', placeholder: 'VD: Vietcombank CN Đồng Nai' },
            { tag: 'GIA_TRI_HD', label: 'Giá trị hợp đồng', fieldType: 'finance', placeholder: 'VD: 800.000.000' },
            { tag: 'GIA_TRI_BANG_CHU', label: 'Giá trị bằng chữ', fieldType: 'finance', placeholder: 'VD: Tám trăm triệu đồng' },
            { tag: 'TAM_UNG', label: 'Tạm ứng', fieldType: 'finance', placeholder: 'VD: 200.000.000' },
            { tag: 'BAO_HANH', label: 'Bảo hành (%)', fieldType: 'finance', placeholder: 'VD: 5' },
            { tag: 'SO_QD', label: 'Số QĐ', fieldType: 'other', placeholder: 'VD: 56/QĐ-BCH' },
            { tag: 'NGAY_KY', label: 'Ngày ký', fieldType: 'date', placeholder: 'VD: 10/03/2026' },
            { tag: 'THOI_HAN', label: 'Thời hạn thi công', fieldType: 'date', placeholder: 'VD: 120 ngày' },
            { tag: 'NGAY_HOAN_THANH', label: 'Ngày hoàn thành', fieldType: 'date', placeholder: 'VD: 30/07/2026' },
        ],
    },
];

/* ── Component ── */
export default function TemplateMarketplace() {
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selectedTemplate = TEMPLATE_SETS.find(t => t.id === selectedId);

    const handleUseTemplate = (template: TemplateSet) => {
        // Save selected template to localStorage so BundleForm can pick it up
        localStorage.setItem('taohoso_active_template', JSON.stringify(template));
        navigate('/goi-mau');
    };

    // Group fields by category for preview
    const groupedFields = (fields: TemplateField[]) => {
        const groups = new Map<FieldCategory, TemplateField[]>();
        for (const f of fields) {
            if (!groups.has(f.fieldType)) groups.set(f.fieldType, []);
            groups.get(f.fieldType)!.push(f);
        }
        return [...groups.entries()].sort(
            ([a], [b]) => FIELD_CATEGORY_INFO[a].order - FIELD_CATEGORY_INFO[b].order
        );
    };

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                📚 Thư viện mẫu hồ sơ
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Chọn bộ mẫu sẵn → hệ thống tự tạo form với các trường đã định nghĩa.<br />
                Bạn chỉ cần upload file Word & điền dữ liệu.
            </p>

            {/* Template cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {TEMPLATE_SETS.map(t => (
                    <div
                        key={t.id}
                        onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
                        style={{
                            background: selectedId === t.id ? '#f0fdf4' : '#fff',
                            border: selectedId === t.id ? '2px solid #10b981' : '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: '1.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: selectedId === t.id ? '0 4px 12px rgba(16,185,129,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
                        }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{t.icon}</div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.3rem', color: '#1e293b' }}>
                            {t.name}
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                            {t.description}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                            <span style={badgeStyle('#dbeafe', '#1d4ed8')}>{t.fields.length} trường</span>
                            <span style={badgeStyle('#fce7f3', '#be185d')}>{t.files.length} file mẫu</span>
                        </div>
                        {selectedId === t.id && (
                            <button
                                className="btn btn-primary"
                                onClick={(e) => { e.stopPropagation(); handleUseTemplate(t); }}
                                style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.9rem' }}
                            >
                                🚀 Sử dụng bộ mẫu này
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Selected template detail */}
            {selectedTemplate && (
                <div style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                    padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {selectedTemplate.icon} {selectedTemplate.name} — Chi tiết trường
                    </h3>

                    {/* File list */}
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.3rem' }}>
                            📁 File mẫu bao gồm:
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {selectedTemplate.files.map((f, i) => (
                                <span key={i} style={badgeStyle('#f1f5f9', '#475569')}>{f}</span>
                            ))}
                        </div>
                    </div>

                    {/* Grouped fields */}
                    {groupedFields(selectedTemplate.fields).map(([cat, fields]) => {
                        const info = FIELD_CATEGORY_INFO[cat];
                        return (
                            <div key={cat} style={{ marginBottom: '0.75rem' }}>
                                <div style={{
                                    fontWeight: 700, fontSize: '0.85rem', color: '#334155',
                                    padding: '0.3rem 0.5rem', background: '#f8fafc',
                                    borderBottom: '2px solid #e2e8f0', marginBottom: '0.3rem',
                                }}>
                                    {info.icon} {info.label}
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <tbody>
                                        {fields.map((f, i) => (
                                            <tr key={i} style={{ background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                                                <td style={{ padding: '0.3rem 0.5rem', fontWeight: 600, width: '30%', color: '#1e293b' }}>
                                                    {f.label}
                                                </td>
                                                <td style={{ padding: '0.3rem 0.5rem', fontFamily: 'monospace', color: '#7c3aed', fontSize: '0.75rem' }}>
                                                    {'{' + f.tag + '}'}
                                                </td>
                                                <td style={{ padding: '0.3rem 0.5rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                                    {f.placeholder}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => handleUseTemplate(selectedTemplate)}
                            style={{ fontSize: '1rem', padding: '0.6rem 2rem' }}
                        >
                            🚀 Sử dụng bộ mẫu "{selectedTemplate.name}"
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Styles ── */
function badgeStyle(bg: string, color: string): React.CSSProperties {
    return {
        display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: 12,
        fontSize: '0.72rem', fontWeight: 600, background: bg, color,
    };
}
