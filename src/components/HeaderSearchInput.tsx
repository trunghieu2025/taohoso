import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Search input rendered inside the Header — navigates to /tim-kiem?q=<query>
export default function HeaderSearchInput() {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed) {
            navigate('/tim-kiem?q=' + encodeURIComponent(trimmed));
            setQuery('');
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <input
                className="form-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                aria-label="Tìm kiếm"
                style={{ fontSize: '0.85rem', padding: '0.3rem 0.6rem', width: '160px', height: 'auto' }}
            />
            <button
                type="submit"
                className="btn btn-primary btn-sm"
                aria-label="Tìm"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
            >
                🔍
            </button>
        </form>
    );
}
