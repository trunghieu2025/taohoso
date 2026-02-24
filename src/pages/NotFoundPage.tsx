import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    return (
        <>
            <div className="page-header">
                <div className="container">
                    <h1>404 — Trang không tồn tại</h1>
                    <p>Xin lỗi, trang bạn tìm không tồn tại hoặc đã bị xóa.</p>
                </div>
            </div>
            <section className="section">
                <div className="container" style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗺️</p>
                    <Link to="/" className="btn btn-primary">Về trang chủ</Link>
                </div>
            </section>
        </>
    );
}
