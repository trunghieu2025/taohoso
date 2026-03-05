import { useState, useCallback, useEffect, useRef, ChangeEvent } from 'react';
import { FormInput } from '../components/FormField';
import ScanReviewModal from '../components/ScanReviewModal';
import {
  generateMilitaryDoc,
  renderDocxPreview,
  extractTags,
  scanDuplicateTexts,
  createTemplateWithTags,
} from '../utils/militaryDocGenerator';
import {
  scanExcelDuplicates,
  extractExcelTags,
  createExcelTemplate,
  renderExcelPreview,
  generateExcelDoc,
} from '../utils/excelTemplateGenerator';
import type { ScanResult } from '../utils/militaryDocGenerator';

/* ── Human-friendly labels for known MERGEFIELD tags ── */
const TAG_LABELS: Record<string, string> = {
  NĂM: 'Năm',
  SỐ_TIỀN: 'Số tiền (đồng)',
  ST_BẰNG_CHỮ: 'Số tiền bằng chữ',
  NGUỒN_KINH_PHÍ: 'Nguồn kinh phí',
  CHT: 'Chỉ huy trưởng (cấp bậc + họ tên)',
  CN_HCKT: 'CN HC-KT (cấp bậc + họ tên)',
  BTC: 'BTC (cấp bậc + họ tên)',
  BTC_2: 'BTC ghi sổ (cấp bậc + họ tên)',
  CÔNG_TRÌNH: 'Tên công trình',
  HẠNG_MỤC: 'Hạng mục sửa chữa',
  KLTH: 'Khối lượng thực hiện',
  TÊN_NHÀ_THẦU: 'Tên nhà thầu (Bên B)',
  ĐẠI_DIỆN_NHÀ_THẦU: 'Đại diện nhà thầu',
  CHỨC_VỤ_NHÀ_THẦU: 'Chức vụ đại diện',
  SĐT_NHÀ_THẦU: 'SĐT nhà thầu',
  MÃ_SỐ_THUẾ: 'Mã số thuế',
  STK_NHÀ_THẦU: 'Số tài khoản nhà thầu',
  NGÂN_HÀNG: 'Tại ngân hàng',
  ĐỊA_CHỈ: 'Địa chỉ (Quy Nhơn, Bình Định)',
};

/* ── Random generic placeholders (not real data) ── */
const TAG_PLACEHOLDERS: Record<string, string> = {
  NĂM: '2026',
  SỐ_TIỀN: '185.000.000',
  ST_BẰNG_CHỮ: 'Một trăm tám mươi lăm triệu đồng',
  NGUỒN_KINH_PHÍ: 'NSQP2026',
  CHT: 'Đại tá Nguyễn Văn A',
  CN_HCKT: 'Trung tá Trần Văn B',
  BTC: 'Trung úy Lê Văn C',
  BTC_2: 'Trung tá CN Phạm Thị D',
  CÔNG_TRÌNH: 'Sở Chỉ huy BĐBP tỉnh',
  HẠNG_MỤC: 'Sửa chữa hệ thống cửa, chống thấm',
  KLTH: 'Sửa chữa hệ thống cửa, chống thấm Nhà ở CBCS',
  TÊN_NHÀ_THẦU: 'Công ty TNHH Xây dựng ABC',
  ĐẠI_DIỆN_NHÀ_THẦU: 'Nguyễn Văn E',
  CHỨC_VỤ_NHÀ_THẦU: 'Giám đốc',
  SĐT_NHÀ_THẦU: '0912.345.678',
  MÃ_SỐ_THUẾ: '4101234567',
  STK_NHÀ_THẦU: '001234567890',
  NGÂN_HÀNG: 'Vietcombank chi nhánh Bình Định',
  ĐỊA_CHỈ: 'Quy Nhơn, Bình Định',
};

/* ── Group tags for layout ── */
const TAG_GROUPS = [
  {
    icon: '🏛️',
    title: 'Thông tin chung',
    tags: [
      'NĂM',
      'CÔNG_TRÌNH',
      'HẠNG_MỤC',
      'KLTH',
      'NGUỒN_KINH_PHÍ',
      'ĐỊA_CHỈ',
    ],
    rows: [
      ['NĂM', 'NGUỒN_KINH_PHÍ'],
      ['CÔNG_TRÌNH', 'HẠNG_MỤC'],
      ['KLTH', 'ĐỊA_CHỈ'],
    ],
  },
  {
    icon: '💰',
    title: 'Tài chính',
    tags: ['SỐ_TIỀN', 'ST_BẰNG_CHỮ'],
    rows: [['SỐ_TIỀN', 'ST_BẰNG_CHỮ']],
  },
  {
    icon: '👤',
    title: 'Nhân sự — Lãnh đạo ký',
    tags: ['CHT', 'CN_HCKT', 'BTC', 'BTC_2'],
    rows: [
      ['CHT', 'CN_HCKT'],
      ['BTC', 'BTC_2'],
    ],
  },
  {
    icon: '🏢',
    title: 'Nhà thầu (Bên B)',
    tags: [
      'TÊN_NHÀ_THẦU',
      'ĐẠI_DIỆN_NHÀ_THẦU',
      'CHỨC_VỤ_NHÀ_THẦU',
      'SĐT_NHÀ_THẦU',
      'MÃ_SỐ_THUẾ',
      'STK_NHÀ_THẦU',
      'NGÂN_HÀNG',
    ],
    rows: [
      ['TÊN_NHÀ_THẦU', 'ĐẠI_DIỆN_NHÀ_THẦU'],
      ['CHỨC_VỤ_NHÀ_THẦU', 'SĐT_NHÀ_THẦU'],
      ['MÃ_SỐ_THUẾ', 'STK_NHÀ_THẦU'],
      ['NGÂN_HÀNG'],
    ],
  },
];

type FormChangeEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

export default function MilitaryDocForm() {
  const [data, setData] = useState<Record<string, string>>({ NĂM: '2026' });
  const [loading, setLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Template state
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(
    null,
  );
  const [templateName, setTemplateName] = useState(
    'Mẫu mặc định (Nhà tập thể)',
  );
  const [templateTags, setTemplateTags] = useState<string[]>([]);
  const [isCustomTemplate, setIsCustomTemplate] = useState(false);
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [fileType, setFileType] = useState<'word' | 'excel'>('word');

  // Scan modal state
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [rawUploadBuffer, setRawUploadBuffer] = useState<ArrayBuffer | null>(
    null,
  );
  const [rawUploadName, setRawUploadName] = useState('');

  // Preview state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [zoom, setZoom] = useState(50);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => setZoom((z) => Math.min(z + 10, 150));
  const zoomOut = () => setZoom((z) => Math.max(z - 10, 30));
  const zoomFit = () => setZoom(50);

  // Load default template on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/templates/template_nha_tap_the.docx');
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        setTemplateBuffer(buf);
        const tags = extractTags(buf);
        setTemplateTags(tags);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // Debounced preview update
  useEffect(() => {
    if (!templateBuffer || !previewContainerRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        if (fileType === 'excel') {
          // Excel: render HTML table
          const html = renderExcelPreview(templateBuffer, data);
          previewContainerRef.current!.innerHTML = html;
          // Style the Excel preview tables
          const tables = previewContainerRef.current!.querySelectorAll('table');
          tables.forEach((t) => {
            t.style.borderCollapse = 'collapse';
            t.style.width = '100%';
            t.style.fontSize = '11px';
          });
          const cells = previewContainerRef.current!.querySelectorAll('td,th');
          cells.forEach((c) => {
            (c as HTMLElement).style.border = '1px solid #d1d5db';
            (c as HTMLElement).style.padding = '4px 6px';
          });
        } else {
          // Word: docx-preview
          await renderDocxPreview(
            templateBuffer,
            data,
            previewContainerRef.current!,
          );
        }
        setPreviewReady(true);
      } catch (err) {
        console.error('[preview]', err);
        if (previewContainerRef.current) {
          previewContainerRef.current.innerHTML =
            '<p style="color:red;text-align:center;padding:2rem">Không thể xem trước file này</p>';
        }
      } finally {
        setPreviewLoading(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [data, templateBuffer, fileType]);

  const handleChange = useCallback((e: FormChangeEvent) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleExport = async () => {
    if (!templateBuffer) return;
    setLoading(true);
    try {
      if (fileType === 'excel') {
        generateExcelDoc(data, templateBuffer);
      } else {
        await generateMilitaryDoc(data, templateBuffer);
      }
    } catch (err) {
      alert('Lỗi khi xuất file: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadTemplate = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check for .doc (old format)
    if (
      file.name.toLowerCase().endsWith('.doc') &&
      !file.name.toLowerCase().endsWith('.docx')
    ) {
      alert(
        '⚠️ File .doc (Word cũ) không đọc được trên web.\n\n' +
          'Hướng dẫn chuyển sang .docx:\n' +
          '1. Mở file bằng Word\n' +
          '2. Vào File → Save As\n' +
          '3. Chọn định dạng "Word Document (.docx)"\n' +
          '4. Lưu và upload lại file .docx',
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check for .xls (old Excel format)
    if (
      file.name.toLowerCase().endsWith('.xls') &&
      !file.name.toLowerCase().endsWith('.xlsx')
    ) {
      alert(
        '⚠️ File .xls (Excel cũ) không đọc được đầy đủ trên web.\n\n' +
          'Hướng dẫn chuyển sang .xlsx:\n' +
          '1. Mở file bằng Excel\n' +
          '2. Vào File → Save As\n' +
          '3. Chọn định dạng "Excel Workbook (.xlsx)"\n' +
          '4. Lưu và upload lại file .xlsx',
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Detect file type
    const isExcel = /\.xlsx?$/i.test(file.name);

    const buf = await file.arrayBuffer();
    try {
      if (isExcel) {
        // Excel file
        const existingTags = extractExcelTags(buf);
        if (existingTags.length > 0) {
          setTemplateBuffer(buf);
          setTemplateName(file.name);
          setTemplateTags(existingTags);
          setIsCustomTemplate(true);
          setFileType('excel');
          setCustomLabels({});
          setPreviewReady(false);
          setData(() => {
            const d: Record<string, string> = {};
            existingTags.forEach((t) => {
              d[t] = '';
            });
            return d;
          });
        } else {
          const results = scanExcelDuplicates(buf);
          if (results.length === 0) {
            alert('Không tìm thấy giá trị trùng lặp nào trong file Excel.');
            return;
          }
          setRawUploadBuffer(buf);
          setRawUploadName(file.name);
          setFileType('excel');
          setScanResults(results);
          setShowScanModal(true);
        }
      } else {
        // Word file
        const existingTags = extractTags(buf);
        if (existingTags.length > 0) {
          setTemplateBuffer(buf);
          setTemplateName(file.name);
          setTemplateTags(existingTags);
          setIsCustomTemplate(true);
          setFileType('word');
          setCustomLabels({});
          setData((prev) => {
            const newData: Record<string, string> = {};
            existingTags.forEach((tag) => {
              newData[tag] = prev[tag] || '';
            });
            return newData;
          });
        } else {
          const results = scanDuplicateTexts(buf);
          if (results.length === 0) {
            alert('Không tìm thấy giá trị trùng lặp nào trong file Word.');
            return;
          }
          setRawUploadBuffer(buf);
          setRawUploadName(file.name);
          setFileType('word');
          setScanResults(results);
          setShowScanModal(true);
        }
      }
    } catch (err) {
      alert('Lỗi đọc file: ' + (err as Error).message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScanConfirm = (
    selected: { text: string; tag: string; label: string }[],
  ) => {
    if (!rawUploadBuffer || selected.length === 0) return;

    // Create template with {tag} placeholders
    const replacements = selected.map((s) => ({ text: s.text, tag: s.tag }));
    const newTemplate =
      fileType === 'excel'
        ? createExcelTemplate(rawUploadBuffer, replacements)
        : createTemplateWithTags(rawUploadBuffer, replacements);

    // Extract tags from the new template
    const tags =
      fileType === 'excel'
        ? extractExcelTags(newTemplate)
        : extractTags(newTemplate);

    // Save custom labels
    const labels: Record<string, string> = {};
    selected.forEach((s) => {
      labels[s.tag] = s.label;
    });

    setTemplateBuffer(newTemplate);
    setTemplateName(rawUploadName);
    setTemplateTags(tags);
    setIsCustomTemplate(true);
    setCustomLabels(labels);
    setShowScanModal(false);
    // Keep rawUploadBuffer so user can re-open scan
    setPreviewReady(false);

    // Reset form data
    const newData: Record<string, string> = {};
    tags.forEach((tag) => {
      newData[tag] = '';
    });
    setData(newData);
  };

  const handleScanCancel = () => {
    setShowScanModal(false);
  };

  const handleReopenScan = () => {
    if (!rawUploadBuffer) return;
    const results =
      fileType === 'excel'
        ? scanExcelDuplicates(rawUploadBuffer)
        : scanDuplicateTexts(rawUploadBuffer);
    setScanResults(results);
    setShowScanModal(true);
  };

  const handleResetTemplate = async () => {
    try {
      const res = await fetch('/templates/template_nha_tap_the.docx');
      if (!res.ok) return;
      const buf = await res.arrayBuffer();
      setTemplateBuffer(buf);
      ('Mẫu mặc định (Nhà tập thể)');
      const tags = extractTags(buf);
      console.log('tags :>> ', tags);
      setTemplateTags(tags);
      setIsCustomTemplate(false);
      setFileType('word');
    } catch {
      /* ignore */
    }
  };

  const handleClear = () => setShowClearConfirm(true);
  const confirmClear = () => {
    setData({ NĂM: '2026' });
    setShowClearConfirm(false);
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
    padding: '1.25rem',
    borderRadius: 'var(--radius, 8px)',
    border: '1px solid var(--border, #e2e8f0)',
    background: 'var(--bg, #fff)',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.05rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
    paddingBottom: '0.4rem',
    borderBottom: '2px solid var(--primary, #4f46e5)',
    color: 'var(--primary, #4f46e5)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  /* ── Render form fields ── */
  const renderFormFields = () => {
    if (isCustomTemplate) {
      // Custom template: auto-generate simple list of fields
      return (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            📋 Trường dữ liệu ({templateTags.length})
          </div>
          {templateTags.map((tag) => (
            <FormInput
              key={tag}
              label={
                customLabels[tag] || TAG_LABELS[tag] || tag.replace(/_/g, ' ')
              }
              name={tag}
              value={data[tag] || ''}
              onChange={handleChange}
              placeholder={
                TAG_PLACEHOLDERS[tag] ||
                `Nhập ${(customLabels[tag] || tag).replace(/_/g, ' ').toLowerCase()}`
              }
            />
          ))}
        </div>
      );
    }

    // Default template: grouped layout
    return TAG_GROUPS.map((group) => {
      // Only show tags that exist in the template
      const activeTags = group.tags.filter((t) => templateTags.includes(t));
      if (activeTags.length === 0) return null;

      return (
        <div key={group.title} style={sectionStyle}>
          <div style={sectionTitleStyle}>
            {group.icon} {group.title}
          </div>
          {group.rows
            ? group.rows.map((row, i) => {
                const activeRowTags = row.filter((t) => activeTags.includes(t));
                if (activeRowTags.length === 0) return null;
                if (activeRowTags.length === 1) {
                  const tag = activeRowTags[0];
                  return (
                    <FormInput
                      key={tag}
                      label={TAG_LABELS[tag] || tag}
                      name={tag}
                      value={data[tag] || ''}
                      onChange={handleChange}
                      placeholder={TAG_PLACEHOLDERS[tag] || ''}
                    />
                  );
                }
                return (
                  <div className="form-row" key={i}>
                    {activeRowTags.map((tag) => (
                      <FormInput
                        key={tag}
                        label={TAG_LABELS[tag] || tag}
                        name={tag}
                        value={data[tag] || ''}
                        onChange={handleChange}
                        placeholder={TAG_PLACEHOLDERS[tag] || ''}
                      />
                    ))}
                  </div>
                );
              })
            : activeTags.map((tag) => (
                <FormInput
                  key={tag}
                  label={TAG_LABELS[tag] || tag}
                  name={tag}
                  value={data[tag] || ''}
                  onChange={handleChange}
                  placeholder={TAG_PLACEHOLDERS[tag] || ''}
                />
              ))}
          {/* Render any tags in this group not covered by rows */}
          {group.rows &&
            activeTags
              .filter((t) => !group.rows!.flat().includes(t))
              .map((tag) => (
                <FormInput
                  key={tag}
                  label={TAG_LABELS[tag] || tag}
                  name={tag}
                  value={data[tag] || ''}
                  onChange={handleChange}
                  placeholder={TAG_PLACEHOLDERS[tag] || ''}
                />
              ))}
        </div>
      );
    });
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>Hồ sơ sửa chữa công trình</h1>
          <p>Nhập thông tin một lần — xuất file Word / Excel đầy đủ mẫu biểu</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="contract-layout">
            {/* LEFT: FORM */}
            <div className="wizard">
              <div className="wizard-content">
                {/* Template selector */}
                <div
                  style={{
                    ...sectionStyle,
                    background:
                      'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    borderColor: '#7dd3fc',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          color: '#64748b',
                          marginBottom: 2,
                        }}
                      >
                        Đang dùng mẫu:
                      </div>
                      <div style={{ fontWeight: 600 }}>📄 {templateName}</div>
                      {templateTags.length > 0 && (
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: '#64748b',
                            marginTop: 2,
                          }}
                        >
                          {templateTags.length} trường dữ liệu
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".docx,.doc,.xlsx,.xls"
                        style={{ display: 'none' }}
                        onChange={handleUploadTemplate}
                      />
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        📤 Tải mẫu khác
                      </button>
                      {isCustomTemplate && (
                        <button
                          className="btn btn-sm"
                          onClick={handleResetTemplate}
                        >
                          ↩️ Mẫu mặc định
                        </button>
                      )}
                      {rawUploadBuffer && (
                        <button
                          className="btn btn-sm"
                          onClick={handleReopenScan}
                          title="Chọn lại các trường dữ liệu"
                        >
                          ⚙️ Chỉnh trường
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                {renderFormFields()}

                {/* Actions */}
                <div className="wizard-actions">
                  {showClearConfirm ? (
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{ fontSize: '0.9rem', color: 'var(--danger)' }}
                      >
                        Xóa tất cả?
                      </span>
                      <button
                        className="btn btn-sm"
                        onClick={() => setShowClearConfirm(false)}
                      >
                        Hủy
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={confirmClear}
                      >
                        Xóa
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-secondary" onClick={handleClear}>
                      🗑️ Xóa tất cả
                    </button>
                  )}
                  <button
                    className="btn btn-primary"
                    onClick={handleExport}
                    disabled={loading || !templateBuffer}
                  >
                    {loading
                      ? '⏳ Đang xuất...'
                      : `📥 Xuất file ${fileType === 'excel' ? 'Excel (.xlsx)' : 'Word (.docx)'}`}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: LIVE PREVIEW */}
            <div className="contract-preview">
              <div className="contract-preview-header">
                <span>📄 Xem trước {previewLoading && '⏳'}</span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <button
                    onClick={zoomOut}
                    className="btn btn-sm"
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.85rem',
                      minWidth: 28,
                    }}
                    title="Thu nhỏ"
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      minWidth: 36,
                      textAlign: 'center',
                      color: '#64748b',
                      userSelect: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={zoomFit}
                  >
                    {zoom}%
                  </span>
                  <button
                    onClick={zoomIn}
                    className="btn btn-sm"
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.85rem',
                      minWidth: 28,
                    }}
                    title="Phóng to"
                  >
                    +
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleExport}
                    disabled={loading || !templateBuffer}
                    style={{
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.75rem',
                      marginLeft: '0.25rem',
                    }}
                  >
                    {loading ? '⏳' : '📥 Xuất'}
                  </button>
                </div>
              </div>
              <div
                className="contract-preview-body"
                style={{ overflow: 'auto' }}
              >
                {!templateBuffer && (
                  <p
                    style={{
                      color: '#94a3b8',
                      textAlign: 'center',
                      padding: '2rem',
                    }}
                  >
                    Đang tải mẫu...
                  </p>
                )}
                <div
                  ref={previewContainerRef}
                  style={{
                    display: previewReady ? 'block' : 'none',
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top left',
                    width: `${10000 / zoom}%`,
                  }}
                />
                {templateBuffer && !previewReady && !previewLoading && (
                  <p
                    style={{
                      color: '#94a3b8',
                      textAlign: 'center',
                      padding: '2rem',
                    }}
                  >
                    Đang chuẩn bị xem trước...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* SCAN REVIEW MODAL */}
      {showScanModal && (
        <ScanReviewModal
          results={scanResults}
          onConfirm={handleScanConfirm}
          onCancel={handleScanCancel}
        />
      )}
    </>
  );
}
