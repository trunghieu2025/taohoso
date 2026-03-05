import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">✨ Miễn phí & bảo mật 100%</div>
            <h1>
              Làm thủ tục hành chính
              <br />
              <span>dễ dàng hơn bao giờ hết</span>
            </h1>
            <p>
              Tạo hợp đồng thuê nhà, điền tờ khai CT01, hướng dẫn đăng ký tạm
              trú & thường trú. Tất cả miễn phí, xử lý trực tiếp trên trình
              duyệt, không cần đăng nhập.
            </p>
            <div className="hero-actions">
              <Link to="/hop-dong-thue-nha" className="btn btn-primary btn-lg">
                📄 Tạo hợp đồng thuê nhà
              </Link>
              <Link to="/dien-form-ct01" className="btn btn-outline btn-lg">
                📝 Điền form CT01
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container">
        <div className="stats">
          <div className="stat-card animate-in">
            <div className="stat-value">100%</div>
            <div className="stat-label">Miễn phí, không ẩn phí</div>
          </div>
          <div className="stat-card animate-in delay-100">
            <div className="stat-value">🔒</div>
            <div className="stat-label">
              Xử lý trên trình duyệt, bảo mật tuyệt đối
            </div>
          </div>
          <div className="stat-card animate-in delay-200">
            <div className="stat-value">⚡</div>
            <div className="stat-label">Tạo hồ sơ chỉ trong 5 phút</div>
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Công cụ tạo hồ sơ</h2>
          <p className="section-subtitle">
            Chọn loại hồ sơ bạn cần tạo. Điền thông tin, xem trước và xuất file
            PDF chuyên nghiệp.
          </p>
          <div className="tools-grid">
            <Link to="/hop-dong-thue-nha" className="tool-card">
              <div className="card-icon">📄</div>
              <h3>Hợp đồng thuê nhà</h3>
              <p>
                Tạo hợp đồng thuê nhà chuyên nghiệp với 4 mẫu: nhà nguyên căn,
                phòng trọ, văn phòng, mặt bằng kinh doanh. Xuất PDF chuẩn pháp
                lý.
              </p>
              <span className="card-link">Tạo ngay →</span>
            </Link>
            <Link to="/dien-form-ct01" className="tool-card">
              <div className="card-icon">📝</div>
              <h3>Điền tờ khai CT01</h3>
              <p>
                Điền tờ khai thay đổi thông tin cư trú CT01 online. Hỗ trợ đăng
                ký tạm trú và thường trú. Xuất PDF đúng mẫu quy định.
              </p>
              <span className="card-link">Điền ngay →</span>
            </Link>
            <Link to="/hoa-don-ban-hang" className="tool-card">
              <div className="card-icon">🧾</div>
              <h3>Hoá đơn bán hàng</h3>
              <p>
                Tạo hoá đơn bán hàng chuyên nghiệp. Nhập thông tin công ty,
                khách hàng, danh sách hàng hoá và xuất PDF in hoặc lưu trữ.
              </p>
              <span className="card-link">Tạo ngay →</span>
            </Link>
            <Link to="/ho-so-sua-chua" className="tool-card">
              <div className="card-icon">🏗️</div>
              <h3>Tự động hóa hồ sơ</h3>
              <p>
                Tạo bộ hồ sơ sửa chữa quân đội đầy đủ 6 mẫu biểu. Nhập thông
                tin một lần, xuất file Word giữ nguyên 100% format.
              </p>
              <span className="card-link">Tạo ngay →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>Bắt đầu tạo hồ sơ ngay</h2>
          <p>Miễn phí, nhanh chóng và bảo mật. Không cần đăng ký tài khoản.</p>
          <div className="hero-actions">
            <Link to="/hop-dong-thue-nha" className="btn btn-lg">
              📄 Tạo hợp đồng thuê nhà
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
