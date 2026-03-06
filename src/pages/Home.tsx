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
            <Link to="/goi-mau" className="tool-card">
              <div className="card-icon">📦</div>
              <h3>Gói mẫu nhiều file</h3>
              <p>
                Upload nhiều file Word → điền 1 lần → xuất tất cả. Hỗ trợ
                so sánh phiên, nhóm trường tự động, gợi ý thông minh.
              </p>
              <span className="card-link">Bắt đầu →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'linear-gradient(135deg, #f0f9ff, #ede9fe)' }}>
        <div className="container">
          <h2 className="section-title">🏆 Top 3 tính năng cho Quản lý Dự án</h2>
          <p className="section-subtitle">
            Những công cụ mạnh nhất giúp bạn quản lý hồ sơ hiệu quả hơn
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem', marginTop: '2rem',
          }}>
            {/* Tags */}
            <div style={{
              background: 'linear-gradient(135deg, #fff, #fef2f2)',
              borderRadius: 16, padding: '1.5rem',
              border: '2px solid #fecaca',
              boxShadow: '0 4px 20px rgba(220,38,38,0.08)',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏷️</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#dc2626', marginBottom: '0.5rem' }}>
                Gắn nhãn & Lọc dự án
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
                Đánh dấu dự án <strong style={{ color: '#dc2626' }}>Khẩn cấp</strong>,{' '}
                <strong style={{ color: '#7c3aed' }}>VIP</strong>,{' '}
                <strong style={{ color: '#d97706' }}>Chờ duyệt</strong> bằng nhãn màu.
                Lọc nhanh — không bao giờ bỏ sót.
              </p>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: 6 }}>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', background: '#fef2f2', color: '#dc2626', fontWeight: 700 }}>Khẩn cấp</span>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', background: '#f5f3ff', color: '#7c3aed', fontWeight: 700 }}>VIP</span>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', background: '#f0fdf4', color: '#059669', fontWeight: 700 }}>Hoàn tất</span>
              </div>
            </div>
            {/* Gantt */}
            <div style={{
              background: 'linear-gradient(135deg, #fff, #f0fdf4)',
              borderRadius: 16, padding: '1.5rem',
              border: '2px solid #bbf7d0',
              boxShadow: '0 4px 20px rgba(5,150,105,0.08)',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#059669', marginBottom: '0.5rem' }}>
                Biểu đồ Gantt & Timeline
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
                Xem tiến độ dự án trực quan. Theo dõi từ <strong>Ký HĐ</strong> →{' '}
                <strong>Khởi công</strong> → <strong>Nghiệm thu</strong> → <strong>Thanh toán</strong>.
              </p>
              <div style={{ marginTop: '0.75rem' }}>
                {['Ký HĐ', 'Khởi công', 'Nghiệm thu'].map((label, i) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', width: 55, textAlign: 'right' }}>{label}</span>
                    <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4 }}>
                      <div style={{ height: '100%', borderRadius: 4, width: `${30 + i * 30}%`, background: 'linear-gradient(90deg, #3b82f6, #059669)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Auto-suggest */}
            <div style={{
              background: 'linear-gradient(135deg, #fff, #eff6ff)',
              borderRadius: 16, padding: '1.5rem',
              border: '2px solid #bfdbfe',
              boxShadow: '0 4px 20px rgba(59,130,246,0.08)',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💡</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2563eb', marginBottom: '0.5rem' }}>
                Gợi ý thông minh
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
                Hệ thống tự gợi ý <strong>tên nhà thầu</strong>, <strong>địa chỉ</strong>,{' '}
                <strong>giá trị HĐ</strong> từ dữ liệu cũ. Tiết kiệm 80% thời gian nhập liệu.
              </p>
              <div style={{ marginTop: '0.75rem', background: '#f8fafc', borderRadius: 8, padding: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                <div style={{ color: '#94a3b8', marginBottom: 4 }}>💡 Gợi ý:</div>
                <div style={{ color: '#1e293b' }}>• Công ty TNHH ABC</div>
                <div style={{ color: '#1e293b' }}>• Cty CP Xây dựng XYZ</div>
              </div>
            </div>
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
