import { Link } from 'react-router-dom';
import { useT } from '../i18n/i18n';

export default function Footer() {
    const t = useT();
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <Link to="/" className="header-logo" style={{ marginBottom: '0.5rem' }}>
                            <div className="header-logo-icon">📋</div>
                            {t('app_name')}
                        </Link>
                        <p>{t('footer_desc')}</p>
                    </div>

                    <div>
                        <h4 className="footer-title">{t('footer_tools')}</h4>
                        <ul className="footer-links">
                            <li><Link to="/hop-dong-thue-nha">{t('tool_contract')}</Link></li>
                            <li><Link to="/dien-form-ct01">{t('tool_ct01')}</Link></li>
                            <li><Link to="/hoa-don-ban-hang">{t('tool_invoice')}</Link></li>
                            <li><Link to="/ho-so-sua-chua">{t('tool_military')}</Link></li>
                            <li><Link to="/goi-mau">{t('tool_bundle')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="footer-title">{t('footer_manage')}</h4>
                        <ul className="footer-links">
                            <li><Link to="/quan-ly-du-an">{t('footer_project_mgmt')}</Link></li>
                            <li><Link to="/danh-ba-nha-thau">{t('footer_contractor_dir')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="footer-title">{t('footer_links')}</h4>
                        <ul className="footer-links">
                            <li><Link to="/gioi-thieu">{t('footer_about')}</Link></li>
                            <li><Link to="/cai-dat">{t('footer_security')}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>{t('footer_copyright')}</p>
                </div>
            </div>
        </footer>
    );
}
