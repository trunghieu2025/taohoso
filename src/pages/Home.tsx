import { Link } from 'react-router-dom';
import { useT } from '../i18n/i18n';

export default function Home() {
  const t = useT();
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">{t('hero_badge')}</div>
            <h1>
              {t('hero_title_1')}
              <br />
              <span>{t('hero_title_2')}</span>
            </h1>
            <p>{t('hero_desc')}</p>
            <div className="hero-actions">
              <Link to="/hop-dong-thue-nha" className="btn btn-primary btn-lg">
                {t('hero_btn_contract')}
              </Link>
              <Link to="/dien-form-ct01" className="btn btn-outline btn-lg">
                {t('hero_btn_ct01')}
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
            <div className="stat-label">{t('stat_free')}</div>
          </div>
          <div className="stat-card animate-in delay-100">
            <div className="stat-value">🔒</div>
            <div className="stat-label">{t('stat_secure')}</div>
          </div>
          <div className="stat-card animate-in delay-200">
            <div className="stat-value">⚡</div>
            <div className="stat-label">{t('stat_fast')}</div>
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">{t('section_tools')}</h2>
          <p className="section-subtitle">{t('section_tools_desc')}</p>
          <div className="tools-grid">
            <Link to="/hop-dong-thue-nha" className="tool-card">
              <div className="card-icon">📄</div>
              <h3>{t('tool_contract')}</h3>
              <p>{t('tool_contract_desc')}</p>
              <span className="card-link">{t('start_now')}</span>
            </Link>
            <Link to="/dien-form-ct01" className="tool-card">
              <div className="card-icon">📝</div>
              <h3>{t('tool_ct01')}</h3>
              <p>{t('tool_ct01_desc')}</p>
              <span className="card-link">{t('fill_now')}</span>
            </Link>
            <Link to="/hoa-don-ban-hang" className="tool-card">
              <div className="card-icon">🧾</div>
              <h3>{t('tool_invoice')}</h3>
              <p>{t('tool_invoice_desc')}</p>
              <span className="card-link">{t('start_now')}</span>
            </Link>
            <Link to="/ho-so-sua-chua" className="tool-card">
              <div className="card-icon">🏗️</div>
              <h3>{t('tool_military')}</h3>
              <p>{t('tool_military_desc')}</p>
              <span className="card-link">{t('start_now')}</span>
            </Link>
            <Link to="/goi-mau" className="tool-card">
              <div className="card-icon">📦</div>
              <h3>{t('tool_bundle')}</h3>
              <p>{t('tool_bundle_desc')}</p>
              <span className="card-link">{t('start_now')}</span>
            </Link>
            <Link to="/giay-moi" className="tool-card">
              <div className="card-icon">📨</div>
              <h3>{t('tool_invitation')}</h3>
              <p>{t('tool_invitation_desc')}</p>
              <span className="card-link">{t('start_now')}</span>
            </Link>
            <Link to="/kiem-tra-nd30" className="tool-card">
              <div className="card-icon">📋</div>
              <h3>{t('tool_nd30')}</h3>
              <p>{t('tool_nd30_desc')}</p>
              <span className="card-link">{t('start_now')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'linear-gradient(135deg, #f0f9ff, #ede9fe)' }}>
        <div className="container">
          <h2 className="section-title">{t('top3_title')}</h2>
          <p className="section-subtitle">{t('top3_subtitle')}</p>
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
                {t('top3_tags_title')}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
                {t('top3_tags_desc')}
              </p>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: 6 }}>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', background: '#fef2f2', color: '#dc2626', fontWeight: 700 }}>{t('tag_urgent')}</span>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', background: '#f5f3ff', color: '#7c3aed', fontWeight: 700 }}>VIP</span>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', background: '#f0fdf4', color: '#059669', fontWeight: 700 }}>{t('tag_done')}</span>
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
                {t('top3_gantt_title')}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
                {t('top3_gantt_desc')}
              </p>
              <div style={{ marginTop: '0.75rem' }}>
                {[t('gantt_sign'), t('gantt_start'), t('gantt_inspect')].map((label, i) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', width: 65, textAlign: 'right' }}>{label}</span>
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
                {t('top3_suggest_title')}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
                {t('top3_suggest_desc')}
              </p>
              <div style={{ marginTop: '0.75rem', background: '#f8fafc', borderRadius: 8, padding: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                <div style={{ color: '#94a3b8', marginBottom: 4 }}>💡 {t('top3_suggest_hint')}</div>
                <div style={{ color: '#1e293b' }}>• ABC Company Ltd</div>
                <div style={{ color: '#1e293b' }}>• XYZ Construction Corp</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW FEATURES v2.7 */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">{t('v27_title')}</h2>
          <p className="section-subtitle">{t('v27_subtitle')}</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem', marginTop: '1.5rem',
          }}>
            {[
              { icon: '💾', title: t('v27_storage'), desc: t('v27_storage_desc'), color: '#0ea5e9', bg: '#f0f9ff' },
              { icon: '🧮', title: t('v27_formula'), desc: t('v27_formula_desc'), color: '#7c3aed', bg: '#faf5ff' },
              { icon: '👁️', title: t('v27_preview'), desc: t('v27_preview_desc'), color: '#059669', bg: '#f0fdf4' },
              { icon: '🔒', title: t('v27_pin'), desc: t('v27_pin_desc'), color: '#dc2626', bg: '#fef2f2' },
              { icon: '🎯', title: t('v27_tour'), desc: t('v27_tour_desc'), color: '#2563eb', bg: '#eff6ff' },
              { icon: '📦', title: t('v27_batch'), desc: t('v27_batch_desc'), color: '#0891b2', bg: '#ecfeff' },
            ].map(f => (
              <div key={f.title} style={{
                background: f.bg, borderRadius: 12, padding: '1.2rem',
                border: `1px solid ${f.color}22`, transition: 'transform 0.2s',
              }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{f.icon}</div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: f.color, marginBottom: '0.3rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/goi-mau" className="btn btn-primary">
              📦 {t('cta_try_now')}
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>{t('cta_title')}</h2>
          <p>{t('cta_desc')}</p>
          <div className="hero-actions">
            <Link to="/hop-dong-thue-nha" className="btn btn-lg">
              {t('hero_btn_contract')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
