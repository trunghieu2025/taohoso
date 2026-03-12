import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchItem {
  icon: string;
  title: string;
  desc: string;
  path: string;
}

const PAGES: SearchItem[] = [
  { icon: '🏠', title: 'Trang chủ', desc: 'Trang chính của TạoHồSơ', path: '/' },
  { icon: '📄', title: 'Hợp đồng thuê nhà', desc: 'Tạo hợp đồng thuê nhà 4 mẫu', path: '/hop-dong-thue-nha' },
  { icon: '📝', title: 'Điền form CT01', desc: 'Tờ khai thay đổi cư trú', path: '/dien-form-ct01' },
  { icon: '🧾', title: 'Hóa đơn bán hàng', desc: 'Tạo hóa đơn chuyên nghiệp', path: '/hoa-don-ban-hang' },
  { icon: '🏗️', title: 'Hồ sơ sửa chữa', desc: 'Tự động hóa hồ sơ quân đội', path: '/ho-so-sua-chua' },
  { icon: '📦', title: 'Gói mẫu nhiều file', desc: 'Upload nhiều file, điền 1 lần', path: '/goi-mau' },
  { icon: '📋', title: 'Quản lý dự án', desc: 'Danh sách dự án đã tạo', path: '/quan-ly-du-an' },
  { icon: '🏢', title: 'Danh bạ nhà thầu', desc: 'Quản lý thông tin nhà thầu', path: '/danh-ba-nha-thau' },
  { icon: '🔍', title: 'Tra cứu dự án', desc: 'Tìm kiếm dự án nhanh', path: '/tra-cuu-du-an' },
  { icon: '⚖️', title: 'So sánh dự án', desc: 'So sánh 2 dự án song song', path: '/so-sanh-du-an' },
  { icon: '📊', title: 'Dashboard', desc: 'Thống kê, lịch sử, đánh số VB', path: '/dashboard' },
  { icon: '📂', title: 'So sánh file', desc: 'So sánh 2 file Word khác biệt', path: '/so-sanh-file' },
  { icon: '🛒', title: 'Thư viện mẫu', desc: 'Kho template có sẵn', path: '/thu-vien-mau' },
  { icon: '⚙️', title: 'Cài đặt', desc: 'Google API, tùy chọn', path: '/cai-dat' },
  { icon: '📖', title: 'Hướng dẫn tạm trú', desc: 'Đăng ký tạm trú chi tiết', path: '/huong-dan/tam-tru' },
  { icon: '📖', title: 'Hướng dẫn thường trú', desc: 'Đăng ký thường trú', path: '/huong-dan/thuong-tru' },
  { icon: '📖', title: 'Hướng dẫn CT07', desc: 'Xin xác nhận cư trú CT07', path: '/huong-dan/ct07' },
  { icon: '📖', title: 'Sang tên sổ hồng', desc: 'Hướng dẫn chuyển nhượng BĐS', path: '/huong-dan/sang-ten-so-hong' },
  { icon: 'ℹ️', title: 'Giới thiệu', desc: 'Về TạoHồSơ', path: '/gioi-thieu' },
];

export default function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Ctrl+K or / to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setQuery('');
        setActiveIdx(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = query.trim()
    ? PAGES.filter(p => {
        const q = query.toLowerCase();
        return p.title.toLowerCase().includes(q) ||
               p.desc.toLowerCase().includes(q) ||
               p.path.toLowerCase().includes(q);
      })
    : PAGES;

  const handleSelect = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIdx]) {
      handleSelect(filtered[activeIdx].path);
    }
  };

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={() => setOpen(false)}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Tìm trang, tính năng... (Esc để đóng)"
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
          onKeyDown={handleKeyDown}
        />
        <div className="search-results">
          {filtered.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
              Không tìm thấy kết quả
            </div>
          ) : (
            filtered.map((item, i) => (
              <div
                key={item.path}
                className={`search-result-item ${i === activeIdx ? 'active' : ''}`}
                onClick={() => handleSelect(item.path)}
                onMouseEnter={() => setActiveIdx(i)}
              >
                <span className="search-result-icon">{item.icon}</span>
                <div>
                  <div className="search-result-title">{item.title}</div>
                  <div className="search-result-desc">{item.desc}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="search-hint">
          ↑↓ để chọn · Enter để mở · Esc để đóng
        </div>
      </div>
    </div>
  );
}
