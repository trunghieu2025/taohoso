import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <Link to="/" className="header-logo" style={{ marginBottom: '0.5rem' }}>
                            <div className="header-logo-icon">📋</div>
                            Tạo Hồ Sơ
                        </Link>
                        <p>
                            Công cụ tạo hồ sơ hành chính miễn phí. Điền form CT01, tạo hợp đồng thuê nhà,
                            hướng dẫn thủ tục cư trú & sang tên sổ hồng. Bảo mật, xử lý trên trình duyệt.
                        </p>
                    </div>

                    <div>
                        <h4 className="footer-title">Công cụ</h4>
                        <ul className="footer-links">
                            <li><Link to="/hop-dong-thue-nha">Hợp đồng thuê nhà</Link></li>
                            <li><Link to="/dien-form-ct01">Điền form CT01</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="footer-title">Liên kết</h4>
                        <ul className="footer-links">
                            <li><Link to="/gioi-thieu">Giới thiệu</Link></li>
                            <li><a href="https://dichvucong.gov.vn" target="_blank" rel="noopener noreferrer">Dịch vụ công QG</a></li>
                            <li><a href="https://dichvucong.dancuquocgia.gov.vn" target="_blank" rel="noopener noreferrer">Cổng dân cư QG</a></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} Tạo Hồ Sơ. Miễn phí & mã nguồn mở. Dữ liệu được xử lý 100% trên trình duyệt của bạn.</p>
                </div>
            </div>
        </footer>
    );
}
