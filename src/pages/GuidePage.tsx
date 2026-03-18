import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/i18n';

export default function GuidePage() {
  const { section } = useParams<{ section?: string }>();
  const { lang } = useLanguage();
  const isVi = lang === 'vi';
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
          📖 {isVi ? 'Hướng dẫn sử dụng' : 'User Guide'}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          {isVi ? 'Hướng dẫn chi tiết từng tính năng của phần mềm Tạo Hồ Sơ' : 'Detailed guide for every feature of DocMaker'}
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
          🏗️ {isVi ? 'Tự động hóa hồ sơ' : 'Document Automation'}
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
          📦 {isVi ? 'Gói mẫu nhiều file' : 'Multi-file Bundle'}
        </button>
      </div>

      {/* Content */}
      {tab === 'tao-ho-so' ? <TaoHoSoGuide isVi={isVi} /> : <GoiMauGuide isVi={isVi} />}

      {/* CTA */}
      <div style={{
        textAlign: 'center', marginTop: '2.5rem', padding: '2rem',
        background: 'linear-gradient(135deg, #f0fdf4, #ecfeff)',
        borderRadius: 16, border: '1px solid #d1fae5',
      }}>
        <h3 style={{ color: '#065f46', marginBottom: '0.75rem' }}>🚀 {isVi ? 'Bắt đầu ngay!' : 'Get Started!'}</h3>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/ho-so-sua-chua" className="btn btn-primary">
            🏗️ {isVi ? 'Tự động hóa hồ sơ' : 'Document Automation'}
          </Link>
          <Link to="/goi-mau" className="btn btn-outline">
            📦 {isVi ? 'Gói mẫu nhiều file' : 'Multi-file Bundle'}
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

function Tip({ children, isVi }: { children: React.ReactNode; isVi: boolean }) {
  return (
    <div style={{
      background: '#eff6ff', borderLeft: '3px solid #3b82f6',
      padding: '0.6rem 0.8rem', margin: '0.5rem 0', fontSize: '0.85rem',
      borderRadius: '0 8px 8px 0',
    }}>
      💡 <b>{isVi ? 'Mẹo:' : 'Tip:'}</b> {children}
    </div>
  );
}

function Example({ children, isVi }: { children: React.ReactNode; isVi: boolean }) {
  return (
    <div style={{
      background: '#f0fdf4', borderLeft: '3px solid #10b981',
      padding: '0.6rem 0.8rem', margin: '0.5rem 0', fontSize: '0.85rem',
      borderRadius: '0 8px 8px 0',
    }}>
      📌 <b>{isVi ? 'Ví dụ:' : 'Example:'}</b> {children}
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
          <th style={thStyle}>Feature</th>
          <th style={thStyle}>Description</th>
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
   DOCUMENT AUTOMATION GUIDE
   ══════════════════════════════════════════════════════════ */
function TaoHoSoGuide({ isVi }: { isVi: boolean }) {
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4, #ecfeff)',
        borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem',
        border: '1px solid #d1fae5',
      }}>
        <h3 style={{ color: '#065f46', margin: '0 0 0.5rem', fontSize: '1.05rem' }}>
          💡 {isVi ? 'Tính năng này dùng để làm gì?' : 'What is this feature for?'}
        </h3>
        <p style={{ color: '#334155', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
          {isVi
            ? <>Upload <b>1 file Word/Excel mẫu</b> → phần mềm tự quét và tạo form nhập liệu → nhập thông tin <b>1 lần</b> → xuất file hoàn chỉnh. Hỗ trợ bảng dữ liệu, số tiền tự đổi sang chữ, lưu nhà thầu, xuất hàng loạt từ Excel.</>
            : <>Upload <b>1 Word/Excel template</b> → auto-scan and create input form → fill once → export completed file. Supports data tables, auto number-to-text conversion, contractor management, batch export from Excel.</>
          }
        </p>
      </div>

      <FeatureTable features={isVi ? [
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
        { icon: '🧮', name: 'Công thức tính', desc: 'Tạo công thức: {A} * {B} / 100' },
      ] : [
        { icon: '📤', name: 'Upload Template', desc: 'Upload Word/Excel → auto-scan fields' },
        { icon: '🔍', name: 'Scan Tables', desc: 'Detect tables → configure columns → enter data' },
        { icon: '📝', name: 'Fill Form', desc: 'Enter data → real-time preview' },
        { icon: '💰', name: 'Number → Text', desc: 'Auto-convert numbers to words' },
        { icon: '🏢', name: 'Contractors', desc: 'Save/select contractor info quickly' },
        { icon: '💾', name: 'Auto-save', desc: 'Continuous auto-save, never lose data' },
        { icon: '📋', name: 'Clone', desc: 'Copy record → edit few details' },
        { icon: '⚠️', name: 'Validation', desc: 'Check required fields before export' },
        { icon: '📐', name: 'Estimate', desc: 'Table: Qty × Price → auto-fill total' },
        { icon: '📥', name: 'Export Word', desc: '.docx keeps 100% original format' },
        { icon: '📄', name: 'Export PDF', desc: 'Create A4 PDF from preview' },
        { icon: '📦', name: 'Batch Export', desc: 'N Excel rows → ZIP with N Word files' },
        { icon: '📊', name: 'Import Excel', desc: '1 Excel row → auto-fill form' },
        { icon: '🧮', name: 'Formulas', desc: 'Create formulas: {A} * {B} / 100' },
      ]} />

      <Section icon="📤" title={isVi ? 'Bước 1: Tải mẫu Word/Excel' : 'Step 1: Upload Word/Excel Template'}>
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          {isVi
            ? <>Upload file mẫu có chứa <code>{'{TÊN_TRƯỜNG}'}</code> — hệ thống tự tạo form nhập liệu.</>
            : <>Upload a template file containing <code>{'{FIELD_NAME}'}</code> — the system auto-creates an input form.</>
          }
        </p>
        <StepList steps={isVi ? [
          'Bấm <b>📤 Tải mẫu khác</b> hoặc chọn từ thư viện mẫu sẵn',
          'Chọn file <b>.docx</b> hoặc <b>.xlsx</b>',
          'Hệ thống quét tìm <code>{tag}</code> hoặc giá trị lặp lại → hiện modal chọn trường',
          'Tick ✅ trường muốn dùng → bấm <b>Xác nhận</b> → form tự tạo',
        ] : [
          'Click <b>📤 Load another</b> or select from template library',
          'Choose a <b>.docx</b> or <b>.xlsx</b> file',
          'System scans for <code>{tags}</code> or repeated values → shows field selection modal',
          'Check ✅ fields to use → click <b>Confirm</b> → form is auto-created',
        ]} />
      </Section>

      <Section icon="🔍" title={isVi ? 'Bước 2: Quét bảng tự động' : 'Step 2: Auto Table Scan'}>
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          {isVi
            ? 'Khi file Word có bảng (bảng khối lượng, dự toán...) → hệ thống nhận diện và cho phép nhập dữ liệu.'
            : 'When the Word file contains tables (quantity sheets, estimates...) → the system detects and lets you enter data.'
          }
        </p>
        <StepList steps={isVi ? [
          'Upload Word có bảng → modal <b>⚙️ Cấu hình cột</b> hiện ra',
          'Với mỗi cột, chọn chế độ:<br/>• <b>✏️ Nhập tay</b><br/>• <b>🔢 Tự đánh số</b><br/>• <b>🧮 Tự tính</b>',
          'Bấm <b>✅ Xác nhận</b> → bảng nhập liệu hiện ra',
          'Nhập dữ liệu → xuất file → bảng Word tự điền',
        ] : [
          'Upload Word with table → <b>⚙️ Column config</b> modal appears',
          'For each column, select mode:<br/>• <b>✏️ Manual input</b><br/>• <b>🔢 Auto numbering</b><br/>• <b>🧮 Auto calculate</b>',
          'Click <b>✅ Confirm</b> → data entry table appears',
          'Enter data → export → Word table auto-fills',
        ]} />
      </Section>

      <Section icon="📝" title={isVi ? 'Bước 3: Điền form & Preview' : 'Step 3: Fill Form & Preview'}>
        <StepList steps={isVi ? [
          'Nhập dữ liệu vào từng ô trên form bên trái',
          'Preview bên phải tự cập nhật khi bạn gõ',
          'Giãn/thu preview bằng nút <b>+ / −</b> zoom',
        ] : [
          'Enter data into each field on the left panel',
          'Preview on the right auto-updates as you type',
          'Zoom preview using <b>+ / −</b> buttons',
        ]} />
      </Section>

      <Section icon="💰" title={isVi ? 'Số tiền → Bằng chữ (tự động)' : 'Number → Text (auto)'}>
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          {isVi ? 'Tự động chuyển số tiền sang tiếng Việt. Không cần gõ tay.' : 'Automatically converts numbers to words. No manual typing needed.'}
        </p>
      </Section>

      <Section icon="🏢" title={isVi ? 'Quản lý nhà thầu' : 'Contractor Management'}>
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          {isVi ? 'Lưu thông tin nhà thầu thường dùng, chọn nhanh khi cần.' : 'Save frequently used contractor info, select quickly when needed.'}
        </p>
        <StepList steps={isVi ? [
          'Nhập đủ thông tin Bên B (tên, MST, đại diện, tài khoản, ngân hàng)',
          'Bấm <b>💾 Lưu nhà thầu</b> → lưu vĩnh viễn trên máy',
          'Lần sau: bấm <b>📋 Chọn NT</b> → click tên → <b>7 trường tự điền</b>',
        ] : [
          'Enter contractor info (name, tax ID, representative, bank account)',
          'Click <b>💾 Save Contractor</b> → saved permanently on your device',
          'Next time: click <b>📋 Select Contractor</b> → pick name → <b>7 fields auto-fill</b>',
        ]} />
      </Section>

      <Section icon="💾" title={isVi ? 'Auto-save & Quản lý phiên' : 'Auto-save & Session Management'}>
        <StepList steps={isVi ? [
          '<b>Auto-save</b>: tự lưu mỗi 2 giây. Đóng app → mở lại → dữ liệu còn nguyên',
          '<b>📂 Mẫu đã lưu</b>: xem danh sách tất cả phiên. Click để chuyển phiên',
          '<b>💾 Sao lưu</b>: tải file .json về máy (backup an toàn)',
          '<b>📂 Khôi phục</b>: chọn file .json để phục hồi dữ liệu',
          '<b>📋 Nhân bản</b>: copy toàn bộ hồ sơ → sửa vài chi tiết → xuất file mới',
        ] : [
          '<b>Auto-save</b>: saves every 2 seconds. Close app → reopen → data intact',
          '<b>📂 Saved templates</b>: view all sessions. Click to switch',
          '<b>💾 Backup</b>: download .json file (safe backup)',
          '<b>📂 Restore</b>: select .json file to restore data',
          '<b>📋 Clone</b>: copy entire record → edit few details → export new file',
        ]} />
      </Section>

      <Section icon="📦" title={isVi ? 'Xuất hàng loạt từ Excel' : 'Batch Export from Excel'}>
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          {isVi ? 'Tạo hàng loạt file Word từ 1 file Excel — mỗi dòng = 1 hồ sơ.' : 'Create multiple Word files from 1 Excel file — each row = 1 record.'}
        </p>
        <StepList steps={isVi ? [
          'Bấm <b>📦 Xuất hàng loạt</b>',
          'Chọn file Excel — <b>mỗi dòng = 1 công trình</b>',
          'Preview danh sách N công trình',
          'Bấm <b>📦 Xuất tất cả</b> → tải 1 file ZIP chứa N file Word',
        ] : [
          'Click <b>📦 Batch Export</b>',
          'Choose Excel file — <b>each row = 1 project</b>',
          'Preview the list of N projects',
          'Click <b>📦 Export All</b> → download 1 ZIP file with N Word files',
        ]} />
      </Section>

      <Section icon="⌨️" title={isVi ? 'Phím tắt' : 'Keyboard Shortcuts'}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <tbody>
            {(isVi ? [
              ['Ctrl + S', 'Lưu nhanh phiên làm việc'],
              ['Ctrl + Enter', 'Bắt đầu quét template'],
              ['+ / −', 'Zoom in/out preview'],
            ] : [
              ['Ctrl + S', 'Quick save session'],
              ['Ctrl + Enter', 'Start template scan'],
              ['+ / −', 'Zoom in/out preview'],
            ]).map(([key, desc], i) => (
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
   MULTI-FILE BUNDLE GUIDE
   ══════════════════════════════════════════════════════════ */
function GoiMauGuide({ isVi }: { isVi: boolean }) {
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #f0f9ff, #ede9fe)',
        borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem',
        border: '1px solid #bae6fd',
      }}>
        <h3 style={{ color: '#0369a1', margin: '0 0 0.5rem', fontSize: '1.05rem' }}>
          💡 {isVi ? 'Tính năng này dùng để làm gì?' : 'What is this feature for?'}
        </h3>
        <p style={{ color: '#334155', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
          {isVi
            ? <>Khi làm hồ sơ dự án, bạn có <b>nhiều file Word</b> cùng chia sẻ <b>dữ liệu giống nhau</b> (tên công trình, nhà thầu, số tiền...). Thay vì mở từng file để sửa, bạn <b>điền 1 lần → xuất tất cả</b>.</>
            : <>When working on project documents, you have <b>multiple Word files</b> that share <b>the same data</b> (project name, contractor, amount...). Instead of editing each file, you <b>fill once → export all</b>.</>
          }
        </p>
      </div>

      <Section icon="📁" title={isVi ? 'Bước 1: Upload file' : 'Step 1: Upload Files'}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          <tbody>
            <tr style={{ background: '#e0f2fe' }}>
              <td style={{ ...tdStyle, width: '40%' }}><b>📄 {isVi ? 'Thêm file lẻ' : 'Add files'}</b></td>
              <td style={tdStyle}>{isVi ? 'Chọn file .docx, .xlsx, .xls' : 'Select .docx, .xlsx, .xls files'}</td>
            </tr>
            <tr>
              <td style={tdStyle}><b>📁 {isVi ? 'Thêm thư mục' : 'Add folder'}</b></td>
              <td style={tdStyle}>{isVi ? 'Chọn cả thư mục → tự lọc file .docx/.xlsx' : 'Select entire folder → auto-filter .docx/.xlsx'}</td>
            </tr>
            <tr style={{ background: '#e0f2fe' }}>
              <td style={tdStyle}><b>🖱️ {isVi ? 'Kéo thả' : 'Drag & drop'}</b></td>
              <td style={tdStyle}>{isVi ? 'Kéo file/thư mục vào vùng upload' : 'Drag files/folders into upload area'}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section icon="🔍" title={isVi ? 'Bước 2: Quét & Tạo form' : 'Step 2: Scan & Create Form'}>
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          {isVi
            ? <>Khi có ≥2 file → bấm <b style={{ color: '#10b981' }}>🔍 Quét & tạo form</b></>
            : <>With ≥2 files → click <b style={{ color: '#10b981' }}>🔍 Scan & Create Form</b></>
          }
        </p>
        <div style={{
          background: '#fef3c7', padding: '0.7rem', borderRadius: 8,
          fontSize: '0.85rem', marginBottom: '0.75rem',
        }}>
          {isVi
            ? <>
                Hệ thống tự tìm <b>2 loại trường</b>:<br/>
                • <b>Dữ liệu trùng lặp</b>: text xuất hiện ≥2 lần trong các file → tự tạo trường<br/>
                • <b>📌 Trường [BRACKET]</b>: text trong dấu <code>[...]</code> → <b>luôn lấy</b> dù chỉ 1 lần<br/>
                → Bạn chỉ cần tích ✅ các trường cần tự động hóa
              </>
            : <>
                The system finds <b>2 types of fields</b>:<br/>
                • <b>Duplicate data</b>: text appearing ≥2 times across files → auto-create field<br/>
                • <b>📌 [BRACKET] fields</b>: text in <code>[...]</code> → <b>always captured</b> even if only once<br/>
                → Just check ✅ the fields you want to automate
              </>
          }
        </div>
        <Tip isVi={isVi}>
          {isVi
            ? <>Bạn có thể đặt sẵn <code>[TÊN_CÔNG_TRÌNH]</code> trong file Word → hệ thống tự nhận diện.</>
            : <>You can pre-mark <code>[PROJECT_NAME]</code> in your Word files → the system auto-detects them.</>
          }
        </Tip>
      </Section>

      <Section icon="📝" title={isVi ? 'Bước 3: Điền form' : 'Step 3: Fill Form'}>
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          {isVi ? <>Nhập dữ liệu <b>1 lần</b> → áp dụng cho <b>TẤT CẢ</b> file cùng lúc.</> : <>Enter data <b>once</b> → apply to <b>ALL</b> files simultaneously.</>}
        </p>
      </Section>

      <Section icon="👁️" title={isVi ? 'Bước 4: Xem trước & Xuất' : 'Step 4: Preview & Export'}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          <tbody>
            {(isVi ? [
              ['👁️ Xem trước', 'Bấm tab tên file → preview. Dùng + / − để zoom', '#e0f2fe'],
              ['📦 Xuất ZIP', 'Tải tất cả file đã chọn → 1 file ZIP', '#fff'],
              ['⬇️ Xuất riêng', 'Xuất từng file Word riêng lẻ', '#e0f2fe'],
              ['📄 Xuất PDF', 'Xuất file đang preview thành PDF', '#fff'],
            ] : [
              ['👁️ Preview', 'Click file tab → preview. Use + / − to zoom', '#e0f2fe'],
              ['📦 Export ZIP', 'Download all selected files → 1 ZIP file', '#fff'],
              ['⬇️ Export Single', 'Export individual Word files', '#e0f2fe'],
              ['📄 Export PDF', 'Export current preview as PDF', '#fff'],
            ]).map(([name, desc, bg], i) => (
              <tr key={i} style={{ background: bg }}>
                <td style={{ ...tdStyle, width: '35%' }}><b>{name}</b></td>
                <td style={tdStyle}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section icon="💾" title={isVi ? 'Quản lý dữ liệu' : 'Data Management'}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          <tbody>
            {(isVi ? [
              ['💾 Sao lưu', 'Xuất dữ liệu → file JSON', '#dcfce7'],
              ['📂 Khôi phục', 'Tải lại từ file JSON', '#fff'],
              ['📥 Nhập dữ liệu', 'Import JSON → điền vào template', '#dcfce7'],
              ['📤 Xuất dữ liệu', 'Export data → dùng cho bộ file mới', '#fff'],
              ['💿 Lưu phiên', 'Lưu session vào máy tính', '#dcfce7'],
              ['📋 Nhân bản', 'Copy session → session mới', '#fff'],
              ['🗑️ Xóa tất cả', 'Reset toàn bộ form', '#dcfce7'],
            ] : [
              ['💾 Backup', 'Export data → JSON file', '#dcfce7'],
              ['📂 Restore', 'Reload from JSON file', '#fff'],
              ['📥 Import Data', 'Import JSON → fill into templates', '#dcfce7'],
              ['📤 Export Data', 'Export data → use with new file set', '#fff'],
              ['💿 Save Session', 'Save session to your device', '#dcfce7'],
              ['📋 Clone', 'Copy session → new session', '#fff'],
              ['🗑️ Clear All', 'Reset entire form', '#dcfce7'],
            ]).map(([name, desc, bg], i) => (
              <tr key={i} style={{ background: bg }}>
                <td style={{ ...tdStyle, width: '35%' }}><b>{name}</b></td>
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
        {isVi
          ? <>⚠️ <b>Lưu ý quan trọng:</b><br/>
            • Hỗ trợ file <b>.docx</b> (Word 2007+) và <b>.xlsx/.xls</b> (Excel)<br/>
            • Trường trong dấu <b>[...]</b> được tự nhận dạng<br/>
            • Dữ liệu xử lý <b>100% trên máy tính</b> — không upload lên server<br/>
            • Nên <b>💾 Sao lưu</b> thường xuyên</>
          : <>⚠️ <b>Important notes:</b><br/>
            • Supports <b>.docx</b> (Word 2007+) and <b>.xlsx/.xls</b> (Excel)<br/>
            • Fields in <b>[...]</b> brackets are auto-detected<br/>
            • Data processed <b>100% locally</b> — never uploaded to any server<br/>
            • <b>💾 Backup</b> regularly to prevent data loss</>
        }
      </div>
    </div>
  );
}
