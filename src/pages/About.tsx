import { Link } from 'react-router-dom';

export default function About() {
    return (
        <>
            <div className="page-header">
                <div className="container">
                    <h1>Giới thiệu về Tạo Hồ Sơ</h1>
                    <p>Làm thủ tục hành chính dễ dàng hơn cho mọi người</p>
                </div>
            </div>

            <div className="about-content container">
                <p>
                    <strong>Tạo Hồ Sơ</strong> là nền tảng công cụ miễn phí giúp người dân Việt Nam tạo các
                    loại hồ sơ hành chính phổ biến một cách nhanh chóng, chính xác và bảo mật.
                </p>

                <h2>🎯 Sứ mệnh</h2>
                <p>
                    Chúng tôi tin rằng việc làm thủ tục hành chính nên được đơn giản hóa tối đa.
                    Mọi người đều có quyền tiếp cận các công cụ hỗ trợ miễn phí để tạo hồ sơ
                    đúng chuẩn mà không cần phải tốn thời gian hay chi phí.
                </p>

                <h2>🔒 Bảo mật</h2>
                <p>
                    Tất cả dữ liệu của bạn được xử lý <strong>100% trên máy tính</strong>.
                    Chúng tôi không thu thập, không lưu trữ và không gửi bất kỳ thông tin cá nhân nào
                    lên máy chủ. Dữ liệu của bạn chỉ tồn tại trên thiết bị của bạn.
                </p>

                <div className="about-features">
                    <div className="card">
                        <div className="card-icon">💰</div>
                        <div className="card-title">Hoàn toàn miễn phí</div>
                        <div className="card-desc">Không ẩn phí, không giới hạn số lần sử dụng</div>
                    </div>
                    <div className="card">
                        <div className="card-icon">🔐</div>
                        <div className="card-title">Bảo mật tuyệt đối</div>
                        <div className="card-desc">Xử lý trên máy tính, không gửi dữ liệu lên server</div>
                    </div>
                    <div className="card">
                        <div className="card-icon">⚡</div>
                        <div className="card-title">Nhanh chóng</div>
                        <div className="card-desc">Tạo hồ sơ chỉ trong 5 phút với form thông minh</div>
                    </div>
                    <div className="card">
                        <div className="card-icon">💻</div>
                        <div className="card-title">Hoạt động offline</div>
                        <div className="card-desc">Không cần internet, chạy hoàn toàn trên máy tính</div>
                    </div>
                </div>

                <h2>📌 Các công cụ</h2>
                <p>Hiện tại, Tạo Hồ Sơ cung cấp các công cụ và hướng dẫn sau:</p>
                <ul>
                    <li><Link to="/hop-dong-thue-nha"><strong>Tạo hợp đồng thuê nhà</strong></Link> — 4 mẫu hợp đồng: nhà nguyên căn, phòng trọ, văn phòng, mặt bằng kinh doanh</li>
                    <li><Link to="/dien-form-ct01"><strong>Điền tờ khai CT01</strong></Link> — Tờ khai thay đổi thông tin cư trú online</li>
                    <li><Link to="/hoa-don-ban-hang"><strong>Hoá đơn bán hàng</strong></Link> — Tạo hoá đơn chuyên nghiệp, xuất PDF</li>
                    <li><Link to="/goi-mau"><strong>Gói mẫu nhiều file</strong></Link> — Upload nhiều Word → điền 1 lần → xuất ZIP</li>
                    <li><Link to="/quan-ly-du-an"><strong>Quản lý dự án</strong></Link> — Theo dõi tiến độ, gắn nhãn, so sánh phiên</li>
                    <li><Link to="/thu-vien-mau"><strong>Thư viện mẫu</strong></Link> — Bộ mẫu hồ sơ sẵn cho giám sát, xây lắp, QLDA</li>

                </ul>

                <h2>🆕 Tính năng nổi bật</h2>
                <ul>
                    <li><strong>💾 Lưu trữ an toàn</strong> — Dữ liệu lưu 100% trên máy tính, không qua internet</li>
                    <li><strong>🧮 Công thức tính</strong> — Tự tạo công thức cho trường dữ liệu (% thuế, chiết khấu)</li>
                    <li><strong>👁️ Xem trước Word</strong> — Preview file Word đã điền ngay trước khi tải</li>
                    <li><strong>🔒 Bảo mật PIN</strong> — Đặt PIN bảo vệ dữ liệu khi mở ứng dụng</li>
                    <li><strong>🎯 Hướng dẫn tương tác</strong> — Tour 4 bước cho người mới sử dụng</li>
                    <li><strong>📦 Xuất hàng loạt</strong> — Upload JSON/Excel → xuất nhiều bộ hồ sơ trong 1 file ZIP</li>
                </ul>

                <h2>📞 Liên hệ</h2>
                <p>
                    Nếu bạn có thắc mắc hoặc góp ý, vui lòng liên hệ qua email:
                    <a href="mailto:dangtrunghieu.dthvhc@gmail.com"> dangtrunghieu.dthvhc@gmail.com</a>
                </p>
            </div>
        </>
    );
}
