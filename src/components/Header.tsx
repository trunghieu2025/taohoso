import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import HeaderSearchInput from './HeaderSearchInput';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path ? 'active' : '';

  return (
    <header className="header">
      <div className="header-inner">
        <Link
          to="/"
          className="header-logo"
          onClick={() => setMobileOpen(false)}
        >
          <div className="header-logo-icon">📋</div>
          Tạo Hồ Sơ
        </Link>

        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>

        <nav className={`header-nav ${mobileOpen ? 'open' : ''}`}>
          <Link
            to="/"
            className={`nav-link ${isActive('/')}`}
            onClick={() => setMobileOpen(false)}
          >
            Trang chủ
          </Link>

          <div className="nav-item">
            <span className="nav-link">Công cụ ▾</span>
            <div className="nav-dropdown">
              <Link
                to="/hop-dong-thue-nha"
                onClick={() => setMobileOpen(false)}
              >
                📄 Hợp đồng thuê nhà
              </Link>
              <Link to="/dien-form-ct01" onClick={() => setMobileOpen(false)}>
                📝 Điền form CT01
              </Link>
              <Link to="/hoa-don-ban-hang" onClick={() => setMobileOpen(false)}>
                🧾 Hoá đơn bán hàng
              </Link>
            </div>
          </div>

          {/* <div className="nav-item">
            <span className="nav-link">Hướng dẫn ▾</span>
            <div className="nav-dropdown">
              <Link
                to="/huong-dan/tam-tru"
                onClick={() => setMobileOpen(false)}
              >
                🏠 Đăng ký tạm trú
              </Link>
              <Link
                to="/huong-dan/thuong-tru"
                onClick={() => setMobileOpen(false)}
              >
                🏡 Đăng ký thường trú
              </Link>
              <Link to="/huong-dan/ct07" onClick={() => setMobileOpen(false)}>
                📋 Xin giấy CT07
              </Link>
              <Link
                to="/huong-dan/sang-ten-so-hong"
                onClick={() => setMobileOpen(false)}
              >
                🏘️ Sang tên sổ hồng
              </Link>
            </div>
          </div> */}

          <Link
            to="/gioi-thieu"
            className={`nav-link ${isActive('/gioi-thieu')}`}
            onClick={() => setMobileOpen(false)}
          >
            Giới thiệu
          </Link>

          <HeaderSearchInput />
        </nav>
      </div>
    </header>
  );
}
