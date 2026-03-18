import { Link } from 'react-router-dom';
import { usePageT } from '../i18n/pageTranslations';

export default function NotFoundPage() {
    const p = usePageT();
    return (
        <>
            <div className="page-header">
                <div className="container">
                    <h1>404 — {p('not_found')}</h1>
                    <p>{p('home') === 'Trang chủ' ? 'Xin lỗi, trang bạn tìm không tồn tại hoặc đã bị xóa.' : 'Sorry, the page you are looking for does not exist or has been removed.'}</p>
                </div>
            </div>
            <section className="section">
                <div className="container" style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗺️</p>
                    <Link to="/" className="btn btn-primary">{p('go_home')}</Link>
                </div>
            </section>
        </>
    );
}
