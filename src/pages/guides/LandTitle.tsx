import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LandTitle() {
    const [propertyValue, setPropertyValue] = useState('');

    const value = Number(propertyValue) || 0;
    const notaryFee = value * 0.003; // 0.3% avg
    const registrationTax = value * 0.005; // 0.5%
    const incomeTax = value * 0.02; // 2%
    const total = notaryFee + registrationTax + incomeTax;

    const formatVND = (v: number) => v.toLocaleString('vi-VN') + ' VND';

    return (
        <>
            <div className="guide-hero">
                <div className="container">
                    <h1>🏘️ Hướng dẫn sang tên sổ hồng 2026</h1>
                    <p>Chi phí, quy trình và bộ hồ sơ cần thiết để sang tên sổ hồng</p>
                </div>
            </div>

            <div className="container">
                <div className="guide-content">
                    <div className="guide-main">
                        <h2>Sang tên sổ hồng là gì?</h2>
                        <p>
                            Sang tên sổ hồng (chuyển nhượng quyền sử dụng đất và sở hữu nhà) là thủ tục
                            đăng ký biến động quyền sử dụng đất khi có sự thay đổi chủ sở hữu thông qua
                            mua bán, tặng cho, thừa kế hoặc các hình thức chuyển nhượng khác.
                        </p>

                        <h2>💰 Tính chi phí sang tên sổ hồng</h2>
                        <div className="calculator">
                            <div className="form-group">
                                <label className="form-label">Giá trị bất động sản (VND)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={propertyValue}
                                    onChange={e => setPropertyValue(e.target.value)}
                                    placeholder="Nhập giá trị BĐS, ví dụ: 3000000000"
                                />
                                <div className="form-hint">Nhập giá trị trên hợp đồng mua bán (đơn vị: VND)</div>
                            </div>

                            {value > 0 && (
                                <div className="calculator-result">
                                    <h4 style={{ marginBottom: '0.75rem' }}>📊 Ước tính chi phí</h4>
                                    <div className="calculator-row">
                                        <span>Phí công chứng (~0.3%)</span>
                                        <span>{formatVND(notaryFee)}</span>
                                    </div>
                                    <div className="calculator-row">
                                        <span>Lệ phí trước bạ (0.5%)</span>
                                        <span>{formatVND(registrationTax)}</span>
                                    </div>
                                    <div className="calculator-row">
                                        <span>Thuế TNCN (2%)</span>
                                        <span>{formatVND(incomeTax)}</span>
                                    </div>
                                    <div className="calculator-row">
                                        <span>Tổng ước tính</span>
                                        <span>{formatVND(total)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="info-box">
                            📌 Chi phí trên chỉ mang tính tham khảo. Thực tế có thể thay đổi tùy tỉnh/thành phố,
                            loại BĐS, thời gian sở hữu và các yếu tố khác.
                        </div>

                        <h2>Hồ sơ cần chuẩn bị</h2>
                        <ol>
                            <li><strong>Hợp đồng mua bán</strong> (có công chứng)</li>
                            <li><strong>Sổ hồng/sổ đỏ</strong> bản gốc</li>
                            <li><strong>CCCD</strong> của bên bán và bên mua</li>
                            <li><strong>Giấy kết hôn</strong> (nếu BĐS thuộc tài sản chung vợ chồng)</li>
                            <li><strong>Tờ khai đăng ký biến động đất đai</strong></li>
                            <li><strong>Tờ khai thuế TNCN</strong> (nếu có)</li>
                            <li><strong>Biên lai nộp thuế</strong></li>
                        </ol>

                        <h2>Quy trình sang tên sổ hồng</h2>
                        <h3>Bước 1: Công chứng hợp đồng mua bán</h3>
                        <p>Hai bên đến văn phòng công chứng để công chứng hợp đồng chuyển nhượng. Phí: 0.1-0.5% giá trị.</p>

                        <h3>Bước 2: Nộp thuế</h3>
                        <p>Nộp thuế TNCN (2%) và lệ phí trước bạ (0.5%) tại cơ quan thuế. Có thể nộp online qua eTax.</p>

                        <h3>Bước 3: Nộp hồ sơ tại Chi nhánh VPĐK đất đai</h3>
                        <p>Nộp bộ hồ sơ đầy đủ tại Chi nhánh Văn phòng đăng ký đất đai quận/huyện. Thời gian: 10-15 ngày.</p>

                        <h3>Bước 4: Nhận sổ hồng mới</h3>
                        <p>Nhận sổ hồng đã đổi tên theo ngày hẹn.</p>

                        <div className="warning-box">
                            ⚠️ <strong>Lưu ý:</strong> Kiểm tra kỹ thông tin quy hoạch, tranh chấp, thế chấp
                            của BĐS trước khi tiến hành giao dịch. Nên sử dụng dịch vụ luật sư nếu cần.
                        </div>
                    </div>

                    <div className="guide-sidebar">
                        <div className="sidebar-card">
                            <h4>📋 Hồ sơ cần thiết</h4>
                            <ul className="checklist">
                                <li><span className="checklist-icon">☑</span> Hợp đồng mua bán (công chứng)</li>
                                <li><span className="checklist-icon">☑</span> Sổ hồng bản gốc</li>
                                <li><span className="checklist-icon">☑</span> CCCD hai bên</li>
                                <li><span className="checklist-icon">☑</span> Giấy kết hôn (nếu có)</li>
                                <li><span className="checklist-icon">☑</span> Biên lai nộp thuế</li>
                            </ul>
                        </div>
                        <div className="sidebar-card">
                            <h4>⏱️ Thời gian</h4>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>10-15 ngày làm việc</p>
                        </div>
                        <div className="sidebar-card">
                            <h4>💰 Chi phí chính</h4>
                            <ul className="checklist">
                                <li><span className="checklist-icon">💵</span> Công chứng: 0.1-0.5%</li>
                                <li><span className="checklist-icon">💵</span> Trước bạ: 0.5%</li>
                                <li><span className="checklist-icon">💵</span> Thuế TNCN: 2%</li>
                            </ul>
                        </div>
                        <div className="sidebar-card">
                            <h4>🔗 Xem thêm</h4>
                            <ul className="footer-links" style={{ marginTop: '0.5rem' }}>
                                <li><Link to="/huong-dan/thuong-tru">Đăng ký thường trú</Link></li>
                                <li><Link to="/huong-dan/ct07">Xin giấy CT07</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
