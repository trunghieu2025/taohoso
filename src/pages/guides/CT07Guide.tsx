import { Link } from 'react-router-dom';

export default function CT07Guide() {
    return (
        <>
            <div className="guide-hero">
                <div className="container">
                    <h1>📋 Hướng dẫn xin giấy CT07</h1>
                    <p>Giấy xác nhận thông tin cư trú CT07 là gì, khi nào cần và cách xin online</p>
                </div>
            </div>

            <div className="container">
                <div className="guide-content">
                    <div className="guide-main">
                        <h2>CT07 là gì?</h2>
                        <p>
                            <strong>CT07</strong> (hay Giấy xác nhận thông tin về cư trú) là loại giấy tờ xác nhận
                            nơi đăng ký cư trú (thường trú hoặc tạm trú) của công dân, do Công an cấp xã/phường ban hành
                            theo yêu cầu của công dân.
                        </p>

                        <div className="info-box">
                            📌 CT07 thay thế sổ hộ khẩu giấy (đã hết hiệu lực từ 01/01/2023) trong nhiều
                            thủ tục hành chính, giao dịch dân sự và ngân hàng.
                        </div>

                        <h2>Khi nào cần xin CT07?</h2>
                        <ul>
                            <li>Làm thủ tục hành chính (cấp CCCD, hộ chiếu, đăng ký xe...)</li>
                            <li>Vay vốn ngân hàng, mở tài khoản</li>
                            <li>Xin visa, du lịch nước ngoài</li>
                            <li>Đăng ký học cho con</li>
                            <li>Giao dịch bất động sản (mua bán, sang tên)</li>
                            <li>Các trường hợp cơ quan, tổ chức yêu cầu chứng minh cư trú</li>
                        </ul>

                        <h2>So sánh CT07 và CT08</h2>
                        <table className="comparison-table">
                            <thead>
                                <tr>
                                    <th>Tiêu chí</th>
                                    <th>CT07</th>
                                    <th>CT08</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>Loại giấy</td><td>Xác nhận thông tin cư trú</td><td>Thông báo kết quả đăng ký cư trú</td></tr>
                                <tr><td>Ai cấp</td><td>Theo yêu cầu công dân</td><td>Cơ quan công an cấp tự động</td></tr>
                                <tr><td>Khi nào</td><td>Bất cứ khi nào cần</td><td>Sau khi hoàn tất thủ tục cư trú</td></tr>
                                <tr><td>Thời hạn</td><td>Theo yêu cầu (thường 6 tháng)</td><td>1 năm</td></tr>
                                <tr><td>Mục đích</td><td>Chứng minh nơi cư trú</td><td>Xác nhận kết quả thủ tục</td></tr>
                            </tbody>
                        </table>

                        <h2>Cách xin CT07 online</h2>
                        <h3>Bước 1: Truy cập Cổng dịch vụ công</h3>
                        <p>
                            Vào <a href="https://dichvucong.dancuquocgia.gov.vn" target="_blank" rel="noopener noreferrer">dichvucong.dancuquocgia.gov.vn</a> hoặc
                            ứng dụng VNeID.
                        </p>

                        <h3>Bước 2: Chọn thủ tục</h3>
                        <p>Chọn "Xác nhận thông tin về cư trú" trong danh mục dịch vụ.</p>

                        <h3>Bước 3: Điền thông tin</h3>
                        <p>Nhập thông tin cá nhân và lý do xin xác nhận. Không cần nộp hồ sơ giấy.</p>

                        <h3>Bước 4: Nhận kết quả</h3>
                        <p>
                            Thời gian xử lý: <strong>3-5 ngày làm việc</strong>. Kết quả có thể nhận trực tiếp
                            hoặc qua bưu điện.
                        </p>

                        <div className="warning-box">
                            ⚠️ <strong>Lưu ý:</strong> Một số cơ quan, tổ chức hiện đã có thể tra cứu thông tin
                            cư trú qua CSDL quốc gia mà không cần CT07. Hãy hỏi trước nơi yêu cầu.
                        </div>
                    </div>

                    <div className="guide-sidebar">
                        <div className="sidebar-card">
                            <h4>📋 Thông tin nhanh</h4>
                            <ul className="checklist">
                                <li><span className="checklist-icon">📄</span> Không cần chuẩn bị hồ sơ giấy</li>
                                <li><span className="checklist-icon">⏱️</span> Xử lý 3-5 ngày</li>
                                <li><span className="checklist-icon">💰</span> Miễn phí</li>
                                <li><span className="checklist-icon">🌐</span> Xin online qua VNeID</li>
                            </ul>
                        </div>
                        <div className="sidebar-card">
                            <h4>🔗 Xem thêm</h4>
                            <ul className="footer-links" style={{ marginTop: '0.5rem' }}>
                                <li><Link to="/huong-dan/tam-tru">Đăng ký tạm trú</Link></li>
                                <li><Link to="/huong-dan/thuong-tru">Đăng ký thường trú</Link></li>
                                <li><Link to="/dien-form-ct01">Điền tờ khai CT01</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
