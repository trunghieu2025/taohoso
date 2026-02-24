import { Link, useSearchParams } from 'react-router-dom';
import { searchIndex } from '../data/search-index';
import { removeTones } from '../utils/remove-vietnamese-tones';

// Badge label and color per result type
const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    guide: { label: 'Hướng dẫn', color: 'var(--primary)' },
    tool: { label: 'Công cụ', color: 'var(--success, #16a34a)' },
    faq: { label: 'FAQ', color: 'var(--text-muted)' },
};

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const normalizedQuery = removeTones(query);

    const results = normalizedQuery
        ? searchIndex.filter(item => item.searchText.includes(normalizedQuery))
        : [];

    return (
        <>
            <div className="page-header">
                <div className="container">
                    <h1>Kết quả tìm kiếm</h1>
                    {query && (
                        <p>
                            {results.length > 0
                                ? `Tìm thấy ${results.length} kết quả cho "${query}"`
                                : `Không tìm thấy kết quả nào cho "${query}"`}
                        </p>
                    )}
                </div>
            </div>

            <section className="section">
                <div className="container" style={{ maxWidth: '760px' }}>
                    {!query && (
                        <div className="info-box">
                            💡 Nhập từ khóa vào ô tìm kiếm trên thanh điều hướng để bắt đầu.
                        </div>
                    )}

                    {query && results.length === 0 && (
                        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</p>
                            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Không có kết quả</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Thử từ khóa khác như "tạm trú", "CT07", "hợp đồng thuê nhà"
                            </p>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {results.map((item, i) => {
                                const badge = TYPE_LABELS[item.type] || TYPE_LABELS.faq;
                                return (
                                    <Link
                                        key={i}
                                        to={item.url}
                                        className="card"
                                        style={{ padding: '1rem 1.25rem', textDecoration: 'none', display: 'block' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <span style={{
                                                fontSize: '0.72rem',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                color: badge.color,
                                                border: `1px solid ${badge.color}`,
                                                borderRadius: '4px',
                                                padding: '1px 6px',
                                            }}>
                                                {badge.label}
                                            </span>
                                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{item.title}</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                                            {item.content.slice(0, 120)}…
                                        </p>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
