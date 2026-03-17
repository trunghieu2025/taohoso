import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function GuidePage() {
  const { section } = useParams<{ section?: string }>();
  const [tab, setTab] = useState<'tao-ho-so' | 'goi-mau'>(
    section === 'goi-mau' ? 'goi-mau' : 'tao-ho-so'
  );

  useEffect(() => {
    if (section === 'goi-mau') setTab('goi-mau');
    else if (section === 'tao-ho-so') setTab('tao-ho-so');
  }, [section]);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 900 }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '0.5rem' }}>
          📖 Hướng dẫn sử dụng
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Hướng dẫn chi tiết từng tính năng của phần mềm Tạo Hồ Sơ
        </p>
      </div>

      {/* Tab buttons */}
      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '2rem',
        background: '#f1f5f9', borderRadius: 12, padding: 4,
      }}>
        <button
          onClick={() => setTab('tao-ho-so')}
          style={{
            flex: 1, padding: '0.75rem', border: 'none', borderRadius: 10,
            background: tab === 'tao-ho-so' ? '#10b981' : 'transparent',
            color: tab === 'tao-ho-so' ? '#fff' : '#475569',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
            transition: 'all 0.2s',
          }}
        >
          🏗️ Tự động hóa hồ sơ
        </button>
        <button
          onClick={() => setTab('goi-mau')}
          style={{
            flex: 1, padding: '0.75rem', border: 'none', borderRadius: 10,
            background: tab === 'goi-mau' ? '#0ea5e9' : 'transparent',
            color: tab === 'goi-mau' ? '#fff' : '#475569',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
            transition: 'all 0.2s',
          }}
        >
          📦 Gói mẫu nhiều file
        </button>
      </div>

      {/* Content */}
      {tab === 'tao-ho-so' ? <TaoHoSoGuide /> : <GoiMauGuide />}

      {/* CTA */}
      <div style={{
        textAlign: 'center', marginTop: '2.5rem', padding: '2rem',
        background: 'linear-gradient(135deg, #f0fdf4, #ecfeff)',
        borderRadius: 16, border: '1px solid #d1fae5',
      }}>
        <h3 style={{ color: '#065f46', marginBottom: '0.75rem' }}>🚀 Bắt đầu ngay!</h3>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/ho-so-sua-chua" className="btn btn-primary">
            🏗️ Tự động hóa hồ sơ
          </Link>
          <Link to="/goi-mau" className="btn btn-outline">
            📦 Gói mẫu nhiều file
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Section component ── */
function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h3 style={{
        color: '#0f172a', fontSize: '1.1rem', marginBottom: '0.75rem',
        paddingBottom: '0.4rem', borderBottom: '2px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <span style={{ fontSize: '1.3rem' }}>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
      {steps.map((s, i) => <li key={i} style={{ marginBottom: '0.3rem' }} dangerouslySetInnerHTML={{ __html: s }} />)}
    </ol>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#eff6ff', borderLeft: '3px solid #3b82f6',
      padding: '0.6rem 0.8rem', margin: '0.5rem 0', fontSize: '0.85rem',
      borderRadius: '0 8px 8px 0',
    }}>
      💡 <b>Mẹo:</b> {children}
    </div>
  );
}

function Example({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#f0fdf4', borderLeft: '3px solid #10b981',
      padding: '0.6rem 0.8rem', margin: '0.5rem 0', fontSize: '0.85rem',
      borderRadius: '0 8px 8px 0',
    }}>
      📌 <b>Ví dụ:</b> {children}
    </div>
  );
}

function FeatureTable({ features }: { features: { icon: string; name: string; desc: string }[] }) {
  return (
    <table style={{
      width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem',
      marginBottom: '1.5rem', borderRadius: 8, overflow: 'hidden',
    }}>
      <thead>
        <tr style={{ background: '#f0fdf4' }}>
          <th style={thStyle}>#</th>
          <th style={thStyle}>Tính năng</th>
          <th style={thStyle}>Mô tả</th>
        </tr>
      </thead>
      <tbody>
        {features.map((f, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
            <td style={tdStyle}>{i + 1}</td>
            <td style={tdStyle}>{f.icon} {f.name}</td>
            <td style={tdStyle}>{f.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const thStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #e2e8f0', textAlign: 'left', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '6px 10px', border: '1px solid #e2e8f0' };

/* ══════════════════════════════════════════════════════════
   TỰ ĐỘNG HÓA HỒ SƠ
   ══════════════════════════════════════════════════════════ */
function TaoHoSoGuide() {
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4, #ecfeff)',
        borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem',
        border: '1px solid #d1fae5',
      }}>
        <h3 style={{ color: '#065f46', margin: '0 0 0.5rem', fontSize: '1.05rem' }}>
          💡 Tính năng này dùng để làm gì?
        </h3>
        <p style={{ color: '#334155', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
          Upload <b>1 file Word/Excel mẫu</b> → phần mềm tự quét và tạo form nhập liệu
          → nhập thông tin <b>1 lần</b> → xuất file hoàn chỉnh. Hỗ trợ bảng dữ liệu,
          số tiền tự đổi sang chữ, lưu nhà thầu, xuất hàng loạt từ Excel.
        </p>
      </div>

      <FeatureTable features={[
        { icon: '📤', name: 'Tải mẫu', desc: 'Upload Word/Excel → tự quét trường' },
        { icon: '🔍', name: 'Quét bảng', desc: 'Nhận diện bảng → cấu hình cột → nhập liệu' },
        { icon: '📝', name: 'Điền form', desc: 'Nhập dữ liệu → preview realtime' },
        { icon: '💰', name: 'Số → Chữ', desc: '292.000.000 → "Hai trăm chín mươi hai triệu đồng"' },
        { icon: '🏢', name: 'Nhà thầu', desc: 'Lưu/chọn nhanh thông tin Bên B' },
        { icon: '💾', name: 'Auto-save', desc: 'Tự lưu liên tục, không mất dữ liệu' },
        { icon: '📋', name: 'Nhân bản', desc: 'Copy hồ sơ → sửa vài chi tiết' },
        { icon: '⚠️', name: 'Validation', desc: 'Kiểm tra trường bắt buộc trước khi xuất' },
        { icon: '📐', name: 'Dự toán', desc: 'Bảng tính KL × ĐG → tổng auto-fill' },
        { icon: '📥', name: 'Xuất Word', desc: 'File .docx giữ 100% format gốc' },
        { icon: '📄', name: 'Xuất PDF', desc: 'Tạo PDF khổ A4 từ preview' },
        { icon: '📦', name: 'Xuất hàng loạt', desc: 'N dòng Excel → ZIP chứa N file Word' },
        { icon: '📊', name: 'Import Excel', desc: '1 dòng Excel → điền vào form tự động' },
        { icon: '🧮', name: 'Công thức tính', desc: 'Tạo công thức cho trường: {A} * {B} / 100' },
      ]} />

      <Section icon="📤" title="Bước 1: Tải mẫu Word/Excel">
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Upload file mẫu có chứa <code>{'{TÊN_TRƯỜNG}'}</code> — hệ thống tự tạo form nhập liệu.
        </p>
        <StepList steps={[
          'Bấm <b>📤 Tải mẫu khác</b> hoặc chọn từ thư viện mẫu sẵn',
          'Chọn file <b>.docx</b> hoặc <b>.xlsx</b>',
          'Hệ thống quét tìm <code>{tag}</code> hoặc giá trị lặp lại → hiện modal chọn trường',
          'Tick ✅ trường muốn dùng → bấm <b>Xác nhận</b> → form tự tạo',
        ]} />
        <Example>
          File Word có <code>{'{CÔNG_TRÌNH}'}</code>, <code>{'{SỐ_TIỀN}'}</code>, <code>{'{NĂM}'}</code> → form hiện 3 ô nhập tương ứng
        </Example>
        <Tip>
          Dùng cú pháp <code>{'{TÊN_TRƯỜNG}'}</code> trong Word để đánh dấu.
          VD: <code>{'{ĐƠN_VỊ}'}</code>, <code>{'{NGÀY_THÁNG}'}</code>.
          Hoặc dùng dấu ngoặc vuông <code>[TÊN_TRƯỜNG]</code>.
        </Tip>
      </Section>

      <Section icon="🔍" title="Bước 2: Quét bảng tự động">
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Khi file Word có bảng (bảng khối lượng, dự toán...) → hệ thống nhận diện và cho phép nhập dữ liệu.
        </p>
        <StepList steps={[
          'Upload Word có bảng → modal <b>⚙️ Cấu hình cột</b> hiện ra',
          'Với mỗi cột, chọn chế độ:<br/>• <b>✏️ Nhập tay</b> — bạn gõ<br/>• <b>🔢 Tự đánh số</b> — STT tăng dần<br/>• <b>🧮 Tự tính</b> — nhập công thức',
          'Bấm <b>✅ Xác nhận</b> → bảng nhập liệu hiện ra',
          'Nhập dữ liệu → xuất file → bảng Word tự điền',
        ]} />
        <Example>
          Bảng 6 cột: TT | Danh mục | ĐVT | KL | ĐG | Thành tiền<br/>
          → Cấu hình: TT = 🔢 tự đánh | Thành tiền = 🧮 công thức <code>KL × ĐG</code>
        </Example>
        <Tip>
          Nhập <b>nhiều hơn</b> số dòng mẫu → tự thêm dòng.
          Nhập <b>ít hơn</b> → tự xóa dòng thừa.
          Font <b>Times New Roman</b> tự động.
        </Tip>
      </Section>

      <Section icon="📝" title="Bước 3: Điền form & Preview">
        <StepList steps={[
          'Nhập dữ liệu vào từng ô trên form bên trái',
          'Preview bên phải tự cập nhật khi bạn gõ',
          'Giãn/thu preview bằng nút <b>+ / −</b> zoom',
        ]} />
        <Example>
          Nhập ô "Công trình": <code>Nhà tập thể A</code> → preview hiện ngay ở đúng vị trí trong mẫu
        </Example>
      </Section>

      <Section icon="💰" title="Số tiền → Bằng chữ (tự động)">
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Tự động chuyển số tiền sang tiếng Việt. Không cần gõ tay.
        </p>
        <Example>
          Nhập: <code>292.000.000</code> → Kết quả: <b>"Hai trăm chín mươi hai triệu đồng"</b><br/>
          Nhập: <code>1.500.000</code> → <b>"Một triệu năm trăm nghìn đồng"</b>
        </Example>
        <Tip>Chỉ cần nhập số (có hoặc không có dấu chấm). Ô "Bằng chữ" tự cập nhật.</Tip>
      </Section>

      <Section icon="🏢" title="Quản lý nhà thầu">
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Lưu thông tin nhà thầu thường dùng, chọn nhanh khi cần — không cần gõ lại.
        </p>
        <StepList steps={[
          'Nhập đủ thông tin Bên B (tên, MST, đại diện, chức vụ, tài khoản, ngân hàng, địa chỉ)',
          'Bấm <b>💾 Lưu nhà thầu</b> → lưu vĩnh viễn trên máy',
          'Lần sau: bấm <b>📋 Chọn NT</b> → click tên → <b>7 trường tự điền</b>',
        ]} />
        <Example>
          Lưu "Công ty TNHH ABC" → lần sau 1 click để điền MST, TK ngân hàng, người đại diện...
        </Example>
      </Section>

      <Section icon="💾" title="Auto-save & Quản lý phiên">
        <StepList steps={[
          '<b>Auto-save</b>: tự lưu mỗi 2 giây. Đóng app → mở lại → dữ liệu còn nguyên',
          '<b>📂 Mẫu đã lưu</b>: xem danh sách tất cả phiên. Click để chuyển phiên',
          '<b>💾 Sao lưu</b>: tải file .json về máy (backup an toàn)',
          '<b>📂 Khôi phục</b>: chọn file .json để phục hồi dữ liệu',
          '<b>📋 Nhân bản</b>: copy toàn bộ hồ sơ → sửa vài chi tiết → xuất file mới',
        ]} />
        <Tip>
          Hoàn thành hồ sơ Nhà A → <b>Nhân bản</b> → chỉ sửa tên + số tiền → xuất hồ sơ Nhà B.
          <b> Nhanh gấp 10 lần!</b>
        </Tip>
      </Section>

      <Section icon="📦" title="Xuất hàng loạt từ Excel">
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Tạo hàng loạt file Word từ 1 file Excel — mỗi dòng = 1 hồ sơ.
        </p>
        <StepList steps={[
          'Bấm <b>📦 Xuất hàng loạt</b>',
          'Chọn file Excel — <b>mỗi dòng = 1 công trình</b>',
          'Preview danh sách N công trình',
          'Bấm <b>📦 Xuất tất cả</b> → tải 1 file ZIP chứa N file Word',
        ]} />
        <Example>
          File Excel 20 dòng (20 công trình) → bấm 1 nút → tải <code>HoSo_20_files.zip</code> chứa 20 file Word đã điền đầy đủ.
        </Example>
        <div style={{
          background: '#fef2f2', borderRadius: 8, padding: '0.6rem 0.8rem',
          fontSize: '0.85rem', borderLeft: '3px solid #ef4444', marginTop: '0.5rem',
        }}>
          ⚠️ <b>Yêu cầu Excel:</b> Hàng 1 = tiêu đề cột (Công trình, Số tiền, Năm...). Hàng 2+ = dữ liệu.
        </div>
      </Section>

      <Section icon="⌨️" title="Phím tắt">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <tbody>
            {[
              ['Ctrl + S', 'Lưu nhanh phiên làm việc'],
              ['Ctrl + Enter', 'Bắt đầu quét template'],
              ['+ / −', 'Zoom in/out preview'],
            ].map(([key, desc], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                <td style={{ ...tdStyle, width: '35%' }}><b>{key}</b></td>
                <td style={tdStyle}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   GÓI MẪU NHIỀU FILE
   ══════════════════════════════════════════════════════════ */
function GoiMauGuide() {
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #f0f9ff, #ede9fe)',
        borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem',
        border: '1px solid #bae6fd',
      }}>
        <h3 style={{ color: '#0369a1', margin: '0 0 0.5rem', fontSize: '1.05rem' }}>
          💡 Tính năng này dùng để làm gì?
        </h3>
        <p style={{ color: '#334155', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
          Khi làm hồ sơ dự án, bạn có <b>nhiều file Word</b> (HĐ giám sát, HĐ quản lý,
          BB thương thảo, QĐ, Bìa HĐ...) cùng chia sẻ <b>dữ liệu giống nhau</b> (tên công trình,
          nhà thầu, số tiền...). Thay vì mở từng file để sửa, bạn <b>điền 1 lần → xuất tất cả</b>.
        </p>
      </div>

      <Section icon="📁" title="Bước 1: Upload file">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          <tbody>
            <tr style={{ background: '#e0f2fe' }}>
              <td style={{ ...tdStyle, width: '40%' }}><b>📄 Thêm file lẻ</b></td>
              <td style={tdStyle}>Chọn file .docx, .xlsx, .xls</td>
            </tr>
            <tr>
              <td style={tdStyle}><b>📁 Thêm thư mục</b></td>
              <td style={tdStyle}>Chọn cả thư mục → tự lọc file .docx/.xlsx</td>
            </tr>
            <tr style={{ background: '#e0f2fe' }}>
              <td style={tdStyle}><b>🖱️ Kéo thả</b></td>
              <td style={tdStyle}>Kéo file/thư mục vào vùng upload</td>
            </tr>
          </tbody>
        </table>
        <Example>
          Bạn có 3 thư mục: <code>Giám Sát/</code>, <code>QLDA/</code>, <code>Xây Lắp/</code><br/>
          → Bấm 📁 Thêm thư mục 3 lần → hệ thống tự gộp tất cả file .docx (bỏ trùng tên)
        </Example>
      </Section>

      <Section icon="🔍" title="Bước 2: Quét & Tạo form">
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Khi có ≥2 file → bấm <b style={{ color: '#10b981' }}>🔍 Quét & tạo form</b>
        </p>
        <div style={{
          background: '#fef3c7', padding: '0.7rem', borderRadius: 8,
          fontSize: '0.85rem', marginBottom: '0.75rem',
        }}>
          Hệ thống tự tìm <b>2 loại trường</b>:<br/>
          • <b>Dữ liệu trùng lặp</b>: text xuất hiện ≥2 lần trong các file → tự tạo trường<br/>
          • <b>📌 Trường [BRACKET]</b>: text trong dấu <code>[...]</code> → <b>luôn lấy</b> dù chỉ 1 lần<br/>
          → Giảm nhiễu thông minh + gộp giá trị tương tự<br/>
          → Bạn chỉ cần tích ✅ các trường cần tự động hóa
        </div>
        <Tip>
          Bạn có thể đặt sẵn <code>[TÊN_CÔNG_TRÌNH]</code> trong file Word
          → hệ thống tự nhận diện mà không cần quét trùng lặp.
        </Tip>
      </Section>

      <Section icon="📝" title="Bước 3: Điền form">
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Nhập dữ liệu <b>1 lần</b> → áp dụng cho <b>TẤT CẢ</b> file cùng lúc.
        </p>
        <Example>
          • Tên công trình: <i>"Sửa chữa nhà kho K59"</i><br/>
          • Nhà thầu: <i>"Công ty TNHH ABC"</i><br/>
          • Giá trị HĐ: <i>"1.500.000.000"</i><br/>
          → Tất cả 8 file HĐ, BB, QĐ đều tự điền cùng lúc!
        </Example>
        <Tip>
          Trường có tên chứa "GIA_TRI", "SO_TIEN", "TONG"... sẽ tự động
          chuyển sang <b>"bằng chữ"</b> (tiếng Việt).
        </Tip>
      </Section>

      <Section icon="📊" title="Bước 4: Bảng dữ liệu (nếu có)">
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Nếu file Word chứa bảng (bảng khối lượng, bảng dự toán...) → tự quét và cấu hình.
        </p>
        <StepList steps={[
          'Hệ thống phát hiện bảng trong file → hiện nút <b>⚙️ Cấu hình bảng</b>',
          'Chọn cột: <b>Nhập tay / Tự đánh số / Tự tính (công thức)</b>',
          'Nhập dữ liệu vào bảng editor',
          '<b>📊 Nhập từ Excel</b> để paste dữ liệu bảng nhanh',
        ]} />
      </Section>

      <Section icon="👁️" title="Bước 5: Xem trước & Xuất">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          <tbody>
            {[
              ['👁️ Xem trước', 'Bấm tab tên file → preview. Dùng + / − để zoom', '#e0f2fe'],
              ['📦 Xuất ZIP', 'Tải tất cả file đã chọn → 1 file ZIP', '#fff'],
              ['⬇️ Xuất riêng', 'Xuất từng file Word riêng lẻ', '#e0f2fe'],
              ['📄 Xuất PDF', 'Xuất file đang preview thành PDF', '#fff'],
              ['📦 Xuất hàng loạt', 'Upload Excel → xuất N bộ file × M file = ZIP', '#e0f2fe'],
            ].map(([name, desc, bg], i) => (
              <tr key={i} style={{ background: bg }}>
                <td style={{ ...tdStyle, width: '35%' }}><b>{name}</b></td>
                <td style={tdStyle}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section icon="💾" title="Quản lý dữ liệu">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          <tbody>
            {[
              ['💾 Sao lưu', 'Xuất dữ liệu → file JSON (backup)', '#dcfce7'],
              ['📂 Khôi phục', 'Tải lại từ file JSON đã backup', '#fff'],
              ['📥 Nhập dữ liệu JSON', 'Import JSON → điền vào TẤT CẢ template', '#dcfce7'],
              ['📤 Xuất dữ liệu JSON', 'Export data → dùng cho bộ file mới', '#fff'],
              ['📊 Nhập từ Excel', 'Map dữ liệu Excel vào form tự động', '#dcfce7'],
              ['💿 Lưu phiên', 'Lưu session vào máy tính', '#fff'],
              ['📋 Nhân bản', 'Copy session → session mới', '#dcfce7'],
              ['🗑️ Xóa tất cả', 'Reset toàn bộ form', '#fff'],
            ].map(([name, desc, bg], i) => (
              <tr key={i} style={{ background: bg }}>
                <td style={{ ...tdStyle, width: '35%' }}><b>{name}</b></td>
                <td style={tdStyle}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section icon="⌨️" title="Phím tắt">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <tbody>
            {[
              ['Ctrl + S', 'Lưu nhanh phiên làm việc'],
              ['Ctrl + Enter', 'Bắt đầu quét (ở bước Upload)'],
            ].map(([key, desc], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                <td style={{ ...tdStyle, width: '35%' }}><b>{key}</b></td>
                <td style={tdStyle}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <div style={{
        background: '#fef2f2', borderRadius: 8, padding: '0.75rem',
        fontSize: '0.85rem', borderLeft: '3px solid #ef4444',
      }}>
        ⚠️ <b>Lưu ý quan trọng:</b><br/>
        • Hỗ trợ file <b>.docx</b> (Word 2007+) và <b>.xlsx/.xls</b> (Excel)<br/>
        • Trường trong dấu <b>[...]</b> được tự nhận dạng<br/>
        • Dữ liệu xử lý <b>100% trên máy tính</b> — không upload lên server<br/>
        • Nên <b>💾 Sao lưu</b> thường xuyên để không mất dữ liệu<br/>
        • Dữ liệu <b>tự lưu mỗi 2 giây</b>, đóng app mở lại vẫn còn
      </div>
    </div>
  );
}
