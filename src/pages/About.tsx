import { Link } from 'react-router-dom';
import { usePageT } from '../i18n/pageTranslations';

export default function About() {
    const p = usePageT();
    const isVi = p('home') === 'Trang chủ';

    return (
        <>
            <div className="page-header">
                <div className="container">
                    <h1>{isVi ? 'Giới thiệu về Tạo Hồ Sơ' : 'About DocMaker'}</h1>
                    <p>{isVi ? 'Làm thủ tục hành chính dễ dàng hơn cho mọi người' : 'Making document creation easier for everyone'}</p>
                </div>
            </div>

            <div className="about-content container">
                <p>
                    <strong>DocMaker</strong> {isVi
                        ? 'là nền tảng công cụ miễn phí giúp tạo các loại hồ sơ hành chính phổ biến một cách nhanh chóng, chính xác và bảo mật.'
                        : 'is a free platform for creating common administrative documents quickly, accurately, and securely.'}
                </p>

                <h2>🎯 {p('about_mission')}</h2>
                <p>{p('about_mission_desc')}</p>

                <h2>🔒 {p('about_security')}</h2>
                <p>{p('about_security_desc')}</p>

                <div className="about-features">
                    <div className="card">
                        <div className="card-icon">💰</div>
                        <div className="card-title">{isVi ? 'Hoàn toàn miễn phí' : 'Completely Free'}</div>
                        <div className="card-desc">{isVi ? 'Không ẩn phí, không giới hạn số lần sử dụng' : 'No hidden fees, no usage limits'}</div>
                    </div>
                    <div className="card">
                        <div className="card-icon">🔐</div>
                        <div className="card-title">{isVi ? 'Bảo mật tuyệt đối' : 'Absolute Security'}</div>
                        <div className="card-desc">{isVi ? 'Xử lý trên máy tính, không gửi dữ liệu lên server' : 'Processed locally, no data sent to servers'}</div>
                    </div>
                    <div className="card">
                        <div className="card-icon">⚡</div>
                        <div className="card-title">{isVi ? 'Nhanh chóng' : 'Fast'}</div>
                        <div className="card-desc">{isVi ? 'Tạo hồ sơ chỉ trong 5 phút với form thông minh' : 'Create documents in just 5 minutes with smart forms'}</div>
                    </div>
                    <div className="card">
                        <div className="card-icon">💻</div>
                        <div className="card-title">{isVi ? 'Hoạt động offline' : 'Works Offline'}</div>
                        <div className="card-desc">{isVi ? 'Không cần internet, chạy hoàn toàn trên máy tính' : 'No internet required, runs entirely on your computer'}</div>
                    </div>
                </div>

                <h2>📌 {isVi ? 'Các công cụ' : 'Tools'}</h2>
                <ul>
                    <li><Link to="/hop-dong-thue-nha"><strong>{p('rental_title')}</strong></Link></li>
                    <li><Link to="/dien-form-ct01"><strong>{p('ct01_title')}</strong></Link></li>
                    <li><Link to="/hoa-don-ban-hang"><strong>{p('invoice_title')}</strong></Link></li>
                    <li><Link to="/ho-so-sua-chua"><strong>{p('military_title')}</strong></Link></li>
                    <li><Link to="/goi-mau"><strong>{p('bundle_title')}</strong></Link></li>
                    <li><Link to="/kiem-tra-nd30"><strong>{isVi ? 'Kiểm tra NĐ30' : 'ND30 Checker'}</strong></Link></li>
                </ul>

                <h2>📞 {isVi ? 'Liên hệ' : 'Contact'}</h2>
                <p>
                    {isVi ? 'Nếu bạn có thắc mắc hoặc góp ý, vui lòng liên hệ qua email:' : 'For questions or feedback, contact us via email:'}
                    <a href="mailto:dangtrunghieu.dthvhc@gmail.com"> dangtrunghieu.dthvhc@gmail.com</a>
                </p>
            </div>
        </>
    );
}
