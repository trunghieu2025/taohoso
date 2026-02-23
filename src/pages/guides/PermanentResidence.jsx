import { Link } from 'react-router-dom';

export default function PermanentResidence() {
    return (
        <>
            <div className="guide-hero">
                <div className="container">
                    <h1>🏡 Hướng dẫn đăng ký thường trú</h1>
                    <p>Điều kiện, thủ tục và giấy tờ cần chuẩn bị để đăng ký thường trú năm 2026</p>
                </div>
            </div>

            <div className="container">
                <div className="guide-content">
                    <div className="guide-main">
                        <h2>Thường trú là gì?</h2>
                        <p>
                            Thường trú là nơi cư trú <strong>cố định, không giới hạn thời gian</strong> của công dân,
                            gắn với địa chỉ hộ khẩu. Sau khi đăng ký thường trú, bạn chính thức có hộ khẩu tại địa chỉ đó.
                        </p>

                        <h2>So sánh tạm trú và thường trú</h2>
                        <table className="comparison-table">
                            <thead>
                                <tr>
                                    <th>Tiêu chí</th>
                                    <th>Tạm trú</th>
                                    <th>Thường trú</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>Thời hạn</td><td>Tối đa 2 năm</td><td>Vĩnh viễn</td></tr>
                                <tr><td>Gia hạn</td><td>Cần gia hạn</td><td>Không cần</td></tr>
                                <tr><td>Điều kiện chỗ ở</td><td>Hợp đồng thuê</td><td>Phải có nhà sở hữu</td></tr>
                                <tr><td>Quyền lợi</td><td>Hạn chế một số</td><td>Đầy đủ</td></tr>
                                <tr><td>Hộ khẩu</td><td>Không</td><td>Có</td></tr>
                            </tbody>
                        </table>

                        <h2>Điều kiện đăng ký thường trú</h2>
                        <ul>
                            <li>Có chỗ ở hợp pháp thuộc quyền sở hữu (sổ hồng/sổ đỏ đứng tên)</li>
                            <li>Được chủ hộ đồng ý cho đăng ký (nếu nhập hộ người khác)</li>
                            <li>Có quan hệ gia đình để nhập hộ (vợ chồng, cha mẹ, con cái...)</li>
                        </ul>

                        <div className="info-box">
                            📌 Từ ngày 01/01/2023, sổ hộ khẩu giấy đã hết hiệu lực và được thay thế bằng
                            cơ sở dữ liệu quốc gia về cư trú (quản lý điện tử).
                        </div>

                        <h2>Hồ sơ cần chuẩn bị</h2>
                        <ol>
                            <li><strong>Tờ khai CT01</strong> — <Link to="/dien-form-ct01">Điền online →</Link></li>
                            <li><strong>Giấy tờ chứng minh chỗ ở hợp pháp</strong>: Sổ hồng, sổ đỏ, giấy phép xây dựng</li>
                            <li><strong>CCCD</strong> của người đăng ký</li>
                            <li><strong>Giấy tờ chứng minh quan hệ</strong> (nếu nhập hộ): Giấy khai sinh, giấy kết hôn, quyết định nhận nuôi con...</li>
                            <li><strong>Văn bản đồng ý cho đăng ký thường trú</strong> của chủ hộ (nếu nhập hộ người khác)</li>
                        </ol>

                        <h2>Quy trình đăng ký</h2>
                        <h3>Cách 1: Nộp trực tiếp tại công an</h3>
                        <p>Mang hồ sơ đến Công an xã/phường/thị trấn nơi đăng ký thường trú. Thời gian xử lý 5-7 ngày.</p>

                        <h3>Cách 2: Nộp online qua Cổng dịch vụ công</h3>
                        <p>
                            Truy cập <a href="https://dichvucong.dancuquocgia.gov.vn" target="_blank" rel="noopener noreferrer">dichvucong.dancuquocgia.gov.vn</a>,
                            đăng nhập VNeID mức 2, chọn thủ tục "Đăng ký thường trú" và nộp hồ sơ số hóa.
                        </p>

                        <h2>Sau khi đăng ký thành công</h2>
                        <p>Bạn sẽ nhận được <strong>Thông báo CT08</strong> — xác nhận kết quả đăng ký thường trú (thay thế sổ hộ khẩu cũ). CT08 có giá trị 1 năm, sau đó thông tin được tra cứu qua CSDL quốc gia.</p>
                    </div>

                    <div className="guide-sidebar">
                        <div className="sidebar-card">
                            <h4>📋 Hồ sơ cần thiết</h4>
                            <ul className="checklist">
                                <li><span className="checklist-icon">☑</span> Tờ khai CT01</li>
                                <li><span className="checklist-icon">☑</span> Sổ hồng/sổ đỏ</li>
                                <li><span className="checklist-icon">☑</span> CCCD</li>
                                <li><span className="checklist-icon">☑</span> Giấy tờ chứng minh quan hệ</li>
                                <li><span className="checklist-icon">☑</span> Đồng ý của chủ hộ</li>
                            </ul>
                        </div>
                        <div className="sidebar-card">
                            <h4>⏱️ Thời gian xử lý</h4>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>5-7 ngày làm việc</p>
                        </div>
                        <div className="sidebar-card">
                            <h4>💰 Chi phí</h4>
                            <p style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 600 }}>Miễn phí</p>
                        </div>
                        <div className="sidebar-card">
                            <h4>🔗 Xem thêm</h4>
                            <ul className="footer-links" style={{ marginTop: '0.5rem' }}>
                                <li><Link to="/dien-form-ct01">Điền tờ khai CT01</Link></li>
                                <li><Link to="/huong-dan/tam-tru">Đăng ký tạm trú</Link></li>
                                <li><Link to="/huong-dan/ct07">Xin giấy CT07</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
