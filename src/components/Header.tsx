import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import HeaderSearchInput from './HeaderSearchInput';
import { useT, useLanguage, LANGUAGES } from '../i18n/i18n';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const location = useLocation();
  const t = useT();
  const { lang, setLang } = useLanguage();

  const isActive = (path: string) =>
    location.pathname === path ? 'active' : '';

  const currentFlag = LANGUAGES.find(l => l.code === lang)?.flag || '🌐';

  return (
    <header className="header">
      <div className="header-inner">
        <Link
          to="/"
          className="header-logo"
          onClick={() => setMobileOpen(false)}
        >
          <div className="header-logo-icon">📋</div>
          {t('app_name')}
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
            {t('nav_home')}
          </Link>

          <div className="nav-item">
            <span className="nav-link">{t('nav_tools')} ▾</span>
            <div className="nav-dropdown">
              <Link
                to="/hop-dong-thue-nha"
                onClick={() => setMobileOpen(false)}
              >
                {t('nav_contract')}
              </Link>
              <Link to="/dien-form-ct01" onClick={() => setMobileOpen(false)}>
                {t('nav_ct01')}
              </Link>
              <Link to="/hoa-don-ban-hang" onClick={() => setMobileOpen(false)}>
                {t('nav_invoice')}
              </Link>
              <Link to="/ho-so-sua-chua" onClick={() => setMobileOpen(false)}>
                {t('nav_military')}
              </Link>
              <Link to="/goi-mau" onClick={() => setMobileOpen(false)}>
                {t('nav_bundle')}
              </Link>
              <Link to="/thu-vien-mau" onClick={() => setMobileOpen(false)}>
                📚 {lang === 'vi' ? 'Thư viện mẫu' : 'Template Library'}
              </Link>
              <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.25rem 0' }} />
              <Link to="/quan-ly-du-an" onClick={() => setMobileOpen(false)}>
                {t('nav_project')}
              </Link>
              <Link to="/danh-ba-nha-thau" onClick={() => setMobileOpen(false)}>
                {t('nav_contractor')}
              </Link>
              <Link to="/tra-cuu-du-an" onClick={() => setMobileOpen(false)}>
                🔍 {lang === 'vi' ? 'Tra cứu dự án' : 'Search Projects'}
              </Link>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                📊 Dashboard
              </Link>
              <Link to="/so-sanh-file" onClick={() => setMobileOpen(false)}>
                ⚖️ {lang === 'vi' ? 'So sánh file' : 'Compare Files'}
              </Link>
              <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.25rem 0' }} />
              <Link to="/cai-dat" onClick={() => setMobileOpen(false)}>
                {t('footer_security')}
              </Link>
              <Link to="/huong-dan" onClick={() => setMobileOpen(false)}>
                📖 {lang === 'vi' ? 'Hướng dẫn sử dụng' : 'User Guide'}
              </Link>
            </div>
          </div>


          <Link
            to="/gioi-thieu"
            className={`nav-link ${isActive('/gioi-thieu')}`}
            onClick={() => setMobileOpen(false)}
          >
            {t('nav_about')}
          </Link>

          {/* Language switcher */}
          <div className="nav-item" style={{ position: 'relative' }}>
            <button
              className="nav-link"
              onClick={() => setLangOpen(!langOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '0.4rem 0.6rem' }}
              title={t('language')}
            >
              {currentFlag}
            </button>
            {langOpen && (
              <div className="nav-dropdown" style={{ display: 'block', minWidth: 140, right: 0, left: 'auto' }}>
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setLangOpen(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '0.4rem 0.75rem', border: 'none', cursor: 'pointer',
                      background: lang === l.code ? '#eff6ff' : 'transparent',
                      fontWeight: lang === l.code ? 600 : 400,
                      fontSize: '0.85rem', color: '#334155',
                    }}
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <HeaderSearchInput />
        </nav>
      </div>
    </header>
  );
}
