import { Link } from 'react-router-dom';

export default function TemporaryResidence() {
    return (
        <>
            <div className="guide-hero">
                <div className="container">
                    <h1>🏠 Hướng dẫn đăng ký tạm trú</h1>
                    <p>Quy trình chi tiết, hồ sơ cần thiết và cách đăng ký tạm trú online từ A-Z</p>
                </div>
            </div>

            <div className="container">
                <div className="guide-content">
                    <div className="guide-main">
                        <h2>Tạm trú là gì?</h2>
                        <p>
                            Tạm trú là việc công dân sinh sống tại nơi <strong>không phải nơi đăng ký thường trú</strong> và
                            đã đăng ký tạm trú với cơ quan có thẩm quyền. Thời hạn tạm trú tối đa là <strong>2 năm</strong> và
                            có thể gia hạn.
                        </p>

                        <div className="info-box">
                            📌 Theo Luật Cư trú 2020, công dân Việt Nam sinh sống tại nơi không phải nơi thường trú
                            từ <strong>30 ngày trở lên</strong> phải đăng ký tạm trú.
                        </div>

                        <h2>Điều kiện đăng ký tạm trú</h2>
                        <ul>
                            <li>Công dân Việt Nam có nơi ở hợp pháp tại nơi đăng ký tạm trú</li>
                            <li>Có hợp đồng thuê nhà / cho ở nhờ / sổ hồng (chứng minh chỗ ở hợp pháp)</li>
                            <li>Có căn cước công dân (CCCD) còn hiệu lực</li>
                        </ul>

                        <h2>Hồ sơ cần chuẩn bị</h2>
                        <ol>
                            <li><strong>Tờ khai CT01</strong> — <Link to="/dien-form-ct01">Điền online tại đây →</Link></li>
                            <li><strong>Hợp đồng thuê nhà</strong> (bản sao có công chứng hoặc bản gốc) — <Link to="/hop-dong-thue-nha">Tạo hợp đồng →</Link></li>
                            <li><strong>Bản sao CCCD</strong> của người đăng ký</li>
                            <li><strong>Bản sao sổ hồng/sổ đỏ</strong> do chủ nhà cung cấp</li>
                            <li><strong>Giấy ủy quyền</strong> (nếu nhờ người khác nộp hộ)</li>
                        </ol>

                        <h2>Cách đăng ký tạm trú online</h2>
                        <h3>Bước 1: Chuẩn bị hồ sơ</h3>
                        <p>
                            Điền tờ khai CT01, chuẩn bị scan/chụp hợp đồng thuê nhà, CCCD và sổ hồng.
                        </p>

                        <h3>Bước 2: Truy cập Cổng dịch vụ công</h3>
                        <p>
                            Truy cập <a href="https://dichvucong.dancuquocgia.gov.vn" target="_blank" rel="noopener noreferrer">dichvucong.dancuquocgia.gov.vn</a> hoặc
                            sử dụng ứng dụng <strong>VNeID</strong> trên điện thoại.
                        </p>

                        <h3>Bước 3: Đăng nhập và nộp hồ sơ</h3>
                        <p>
                            Đăng nhập bằng tài khoản VNeID mức 2, chọn "Đăng ký tạm trú", điền thông tin
                            và upload các giấy tờ đã chuẩn bị.
                        </p>

                        <h3>Bước 4: Theo dõi và nhận kết quả</h3>
                        <p>
                            Thời gian xử lý: <strong>3-5 ngày làm việc</strong>. Kết quả sẽ được thông báo
                            qua ứng dụng VNeID hoặc tin nhắn SMS.
                        </p>

                        <div className="warning-box">
                            ⚠️ <strong>Lưu ý:</strong> Nếu nộp bản quét/chụp giấy tờ online không có ký số,
                            bạn cần xuất trình bản gốc khi cơ quan công an yêu cầu kiểm tra.
                        </div>

                        <h2>Câu hỏi thường gặp</h2>
                        <h3>Tạm trú bao lâu thì có CT07?</h3>
                        <p>Sau khi đăng ký tạm trú thành công, bạn có thể xin giấy xác nhận cư trú (CT07) ngay lập tức.</p>

                        <h3>Phí đăng ký tạm trú là bao nhiêu?</h3>
                        <p>Hiện tại, đăng ký tạm trú <strong>miễn phí</strong> hoàn toàn.</p>

                        <h3>Tạm trú có thời hạn bao lâu?</h3>
                        <p>Tối đa <strong>2 năm</strong>, có thể gia hạn trước khi hết hạn.</p>
                    </div>

                    <div className="guide-sidebar">
                        <div className="sidebar-card">
                            <h4>📋 Checklist hồ sơ</h4>
                            <ul className="checklist">
                                <li><span className="checklist-icon">☑</span> Tờ khai CT01</li>
                                <li><span className="checklist-icon">☑</span> Hợp đồng thuê nhà</li>
                                <li><span className="checklist-icon">☑</span> Bản sao CCCD</li>
                                <li><span className="checklist-icon">☑</span> Bản sao sổ hồng</li>
                            </ul>
                        </div>
                        <div className="sidebar-card">
                            <h4>⏱️ Thời gian xử lý</h4>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>3-5 ngày làm việc khi nộp online</p>
                        </div>
                        <div className="sidebar-card">
                            <h4>💰 Chi phí</h4>
                            <p style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 600 }}>Miễn phí</p>
                        </div>
                        <div className="sidebar-card">
                            <h4>🔗 Công cụ liên quan</h4>
                            <ul className="footer-links" style={{ marginTop: '0.5rem' }}>
                                <li><Link to="/dien-form-ct01">Điền tờ khai CT01</Link></li>
                                <li><Link to="/hop-dong-thue-nha">Tạo hợp đồng thuê nhà</Link></li>
                                <li><Link to="/huong-dan/ct07">Xin giấy CT07</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
