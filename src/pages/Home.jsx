import { Link } from 'react-router-dom';
import FAQ from '../components/FAQ';

export default function Home() {
    return (
        <>
            {/* HERO */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge">✨ Miễn phí & bảo mật 100%</div>
                        <h1>
                            Làm thủ tục hành chính<br />
                            <span>dễ dàng hơn bao giờ hết</span>
                        </h1>
                        <p>
                            Tạo hợp đồng thuê nhà, điền tờ khai CT01, hướng dẫn đăng ký tạm trú & thường trú.
                            Tất cả miễn phí, xử lý trực tiếp trên trình duyệt, không cần đăng nhập.
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
                        <div className="stat-label">Xử lý trên trình duyệt, bảo mật tuyệt đối</div>
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
                        Chọn loại hồ sơ bạn cần tạo. Điền thông tin, xem trước và xuất file PDF chuyên nghiệp.
                    </p>
                    <div className="tools-grid">
                        <Link to="/hop-dong-thue-nha" className="tool-card">
                            <div className="card-icon">📄</div>
                            <h3>Hợp đồng thuê nhà</h3>
                            <p>
                                Tạo hợp đồng thuê nhà chuyên nghiệp với 4 mẫu: nhà nguyên căn, phòng trọ,
                                văn phòng, mặt bằng kinh doanh. Xuất PDF chuẩn pháp lý.
                            </p>
                            <span className="card-link">Tạo ngay →</span>
                        </Link>
                        <Link to="/dien-form-ct01" className="tool-card">
                            <div className="card-icon">📝</div>
                            <h3>Điền tờ khai CT01</h3>
                            <p>
                                Điền tờ khai thay đổi thông tin cư trú CT01 online. Hỗ trợ đăng ký tạm trú
                                và thường trú. Xuất PDF đúng mẫu quy định.
                            </p>
                            <span className="card-link">Điền ngay →</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* GUIDES */}
            <section className="section" style={{ background: 'var(--bg-secondary)' }}>
                <div className="container">
                    <h2 className="section-title">Hướng dẫn thủ tục</h2>
                    <p className="section-subtitle">
                        Hướng dẫn chi tiết từng bước cho các thủ tục hành chính phổ biến nhất
                    </p>
                    <div className="guides-grid">
                        <Link to="/huong-dan/tam-tru" className="card" style={{ textDecoration: 'none', color: 'var(--text)' }}>
                            <div className="card-icon">🏠</div>
                            <div className="card-title">Đăng ký tạm trú</div>
                            <div className="card-desc">Hướng dẫn đầy đủ quy trình, hồ sơ cần thiết và cách nộp online</div>
                        </Link>
                        <Link to="/huong-dan/thuong-tru" className="card" style={{ textDecoration: 'none', color: 'var(--text)' }}>
                            <div className="card-icon">🏡</div>
                            <div className="card-title">Đăng ký thường trú</div>
                            <div className="card-desc">Điều kiện, thủ tục và giấy tờ cần chuẩn bị để đăng ký thường trú</div>
                        </Link>
                        <Link to="/huong-dan/ct07" className="card" style={{ textDecoration: 'none', color: 'var(--text)' }}>
                            <div className="card-icon">📋</div>
                            <div className="card-title">Xin giấy CT07</div>
                            <div className="card-desc">Giấy xác nhận cư trú CT07 là gì, khi nào cần và cách xin online</div>
                        </Link>
                        <Link to="/huong-dan/sang-ten-so-hong" className="card" style={{ textDecoration: 'none', color: 'var(--text)' }}>
                            <div className="card-icon">🏘️</div>
                            <div className="card-title">Sang tên sổ hồng</div>
                            <div className="card-desc">Chi phí, quy trình và bộ hồ sơ sang tên sổ hồng năm 2026</div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="section">
                <div className="container">
                    <h2 className="section-title">Câu hỏi thường gặp</h2>
                    <p className="section-subtitle">Giải đáp các thắc mắc phổ biến về thủ tục cư trú và hồ sơ hành chính</p>
                    <FAQ />
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
