/**
 * Page-level translations for all form pages
 * Usage: const p = usePageT(); then p('key')
 */
import { useLanguage } from './i18n';

const PAGE_TRANSLATIONS: Record<string, Record<string, string>> = {
    // ── MilitaryDocForm ──
    'military_title': { vi: 'Tự động hóa hồ sơ', en: 'Document Automation', ja: '文書自動化', ko: '문서 자동화', zh: '文档自动化' },
    'military_desc': { vi: 'Nhập thông tin một lần — xuất file Word / Excel đầy đủ mẫu biểu', en: 'Enter info once — export complete Word / Excel templates', ja: '情報を1回入力 → Word/Excelテンプレートを出力', ko: '정보 1회 입력 → Word/Excel 템플릿 출력', zh: '输入一次信息 → 导出完整Word/Excel模板' },
    'using_template': { vi: 'Đang dùng mẫu:', en: 'Current template:', ja: '使用中テンプレート:', ko: '현재 템플릿:', zh: '当前模板:' },
    'default_template': { vi: 'Mẫu mặc định (Nhà tập thể)', en: 'Default Template (Housing)', ja: 'デフォルトテンプレート', ko: '기본 템플릿', zh: '默认模板' },
    'load_other': { vi: 'Tải mẫu khác', en: 'Load another', ja: '別テンプレート', ko: '다른 템플릿', zh: '加载其他' },
    'guide': { vi: 'Hướng dẫn', en: 'Guide', ja: 'ガイド', ko: '가이드', zh: '指南' },
    'data_mgmt': { vi: 'Quản lý dữ liệu', en: 'Data Management', ja: 'データ管理', ko: '데이터 관리', zh: '数据管理' },
    'backup': { vi: 'Sao lưu', en: 'Backup', ja: 'バックアップ', ko: '백업', zh: '备份' },
    'restore': { vi: 'Khôi phục', en: 'Restore', ja: '復元', ko: '복원', zh: '恢复' },
    'import_excel': { vi: 'Nhập từ Excel', en: 'Import from Excel', ja: 'Excelから読み込む', ko: 'Excel에서 가져오기', zh: '从Excel导入' },
    'saved_templates_count': { vi: 'Mẫu đã lưu', en: 'Saved templates', ja: '保存済みテンプレート', ko: '저장된 템플릿', zh: '已保存模板' },
    'records': { vi: 'hồ sơ', en: 'records', ja: '件', ko: '건', zh: '份' },
    'contractors': { vi: 'nhà thầu', en: 'contractors', ja: '業者', ko: '시공사', zh: '承包商' },
    'exports': { vi: 'lần xuất', en: 'exports', ja: '回出力', ko: '회 출력', zh: '次导出' },
    'estimate_detail': { vi: 'Dự toán chi tiết', en: 'Detailed Estimate', ja: '詳細見積', ko: '상세 견적', zh: '详细预算' },
    'expand': { vi: 'Mở rộng', en: 'Expand', ja: '展開', ko: '펼치기', zh: '展开' },
    'collapse': { vi: 'Thu gọn', en: 'Collapse', ja: '折りたたむ', ko: '접기', zh: '收起' },
    'preview': { vi: 'Xem trước', en: 'Preview', ja: 'プレビュー', ko: '미리보기', zh: '预览' },
    'export': { vi: 'Xuất', en: 'Export', ja: '出力', ko: '내보내기', zh: '导出' },
    'export_word': { vi: 'Xuất Word', en: 'Export Word', ja: 'Word出力', ko: 'Word 내보내기', zh: '导出Word' },
    'export_pdf': { vi: 'Xuất PDF', en: 'Export PDF', ja: 'PDF出力', ko: 'PDF 내보내기', zh: '导出PDF' },
    'save_session': { vi: 'Lưu phiên', en: 'Save Session', ja: 'セッション保存', ko: '세션 저장', zh: '保存会话' },
    'save_project': { vi: 'Lưu vào dự án', en: 'Save to Project', ja: 'プロジェクトに保存', ko: '프로젝트에 저장', zh: '保存到项目' },
    'loading_template': { vi: 'Đang tải mẫu...', en: 'Loading template...', ja: 'テンプレート読み込み中...', ko: '템플릿 로딩 중...', zh: '正在加载模板...' },
    'fill_info': { vi: 'Điền thông tin', en: 'Fill Information', ja: '情報入力', ko: '정보 입력', zh: '填写信息' },
    'fill_sample': { vi: 'Điền mẫu thử', en: 'Fill Sample', ja: 'サンプル入力', ko: '샘플 입력', zh: '填写示例' },
    'search_field': { vi: 'Tìm trường...', en: 'Search fields...', ja: 'フィールドを検索...', ko: '필드 검색...', zh: '搜索字段...' },
    'search_records': { vi: 'Tìm hồ sơ...', en: 'Search records...', ja: '記録を検索...', ko: '기록 검색...', zh: '搜索记录...' },
    'no_fields': { vi: 'Chưa có trường nào', en: 'No fields yet', ja: 'フィールドなし', ko: '필드 없음', zh: '暂无字段' },
    'upload_template': { vi: 'Upload mẫu Word/Excel để bắt đầu', en: 'Upload a Word/Excel template to start', ja: 'Word/Excelテンプレートをアップロード', ko: 'Word/Excel 템플릿을 업로드하세요', zh: '上传Word/Excel模板开始' },
    'choose_file': { vi: 'Chọn file', en: 'Choose file', ja: 'ファイル選択', ko: '파일 선택', zh: '选择文件' },
    'or_drag': { vi: 'hoặc kéo thả vào đây', en: 'or drag and drop here', ja: 'またはここにドラッグ', ko: '또는 여기에 드래그', zh: '或拖拽到这里' },
    'batch_export': { vi: 'Xuất hàng loạt', en: 'Batch Export', ja: '一括出力', ko: '일괄 내보내기', zh: '批量导出' },
    'scan_tables': { vi: 'Quét bảng', en: 'Scan Tables', ja: 'テーブルスキャン', ko: '테이블 스캔', zh: '扫描表格' },
    'table_data': { vi: 'Dữ liệu bảng', en: 'Table Data', ja: 'テーブルデータ', ko: '테이블 데이터', zh: '表格数据' },
    'select_contractor': { vi: 'Chọn nhà thầu', en: 'Select Contractor', ja: '業者選択', ko: '시공사 선택', zh: '选择承包商' },
    'save_contractor': { vi: 'Lưu nhà thầu', en: 'Save Contractor', ja: '業者保存', ko: '시공사 저장', zh: '保存承包商' },
    'auto_number_text': { vi: 'Số → Chữ', en: 'Number → Text', ja: '数字→テキスト', ko: '숫자→텍스트', zh: '数字→文字' },
    'formula_mode': { vi: 'Chế độ công thức', en: 'Formula mode', ja: '数式モード', ko: '수식 모드', zh: '公式模式' },
    'confirm_delete': { vi: 'Bạn có chắc muốn xóa?', en: 'Are you sure you want to delete?', ja: '本当に削除しますか？', ko: '정말 삭제하시겠습니까?', zh: '确定要删除吗？' },
    'session_name': { vi: 'Tên phiên:', en: 'Session name:', ja: 'セッション名:', ko: '세션 이름:', zh: '会话名称:' },
    'saved_list': { vi: 'Danh sách đã lưu', en: 'Saved list', ja: '保存リスト', ko: '저장 목록', zh: '已保存列表' },
    'delete': { vi: 'Xóa', en: 'Delete', ja: '削除', ko: '삭제', zh: '删除' },
    'delete_all': { vi: 'Xóa tất cả', en: 'Clear all', ja: 'すべて削除', ko: '모두 삭제', zh: '全部删除' },
    'delete_all_q': { vi: 'Xóa tất cả?', en: 'Clear all?', ja: 'すべて削除？', ko: '모두 삭제?', zh: '全部删除？' },
    'load': { vi: 'Tải', en: 'Load', ja: '読み込む', ko: '불러오기', zh: '加载' },
    'cancel': { vi: 'Hủy', en: 'Cancel', ja: 'キャンセル', ko: '취소', zh: '取消' },
    'ok': { vi: 'OK', en: 'OK', ja: 'OK', ko: '확인', zh: '确定' },
    'close': { vi: 'Đóng', en: 'Close', ja: '閉じる', ko: '닫기', zh: '关闭' },
    'confirm': { vi: 'Xác nhận', en: 'Confirm', ja: '確認', ko: '확인', zh: '确认' },
    'add_row': { vi: 'Thêm dòng', en: 'Add row', ja: '行追加', ko: '행 추가', zh: '添加行' },
    'remove_row': { vi: 'Xóa dòng', en: 'Remove row', ja: '行削除', ko: '행 삭제', zh: '删除行' },
    'total': { vi: 'Tổng cộng', en: 'Total', ja: '合計', ko: '합계', zh: '合计' },
    'subtotal': { vi: 'Thành tiền', en: 'Subtotal', ja: '小計', ko: '소계', zh: '小计' },
    'remaining': { vi: 'Còn lại', en: 'Remaining', ja: '残り', ko: '잔액', zh: '余额' },
    'required': { vi: 'Bắt buộc', en: 'Required', ja: '必須', ko: '필수', zh: '必填' },
    'optional': { vi: 'Tùy chọn', en: 'Optional', ja: '任意', ko: '선택', zh: '可选' },
    'tip': { vi: 'Mẹo', en: 'Tip', ja: 'ヒント', ko: '팁', zh: '提示' },
    'example': { vi: 'Ví dụ', en: 'Example', ja: '例', ko: '예시', zh: '示例' },
    'clone': { vi: 'Nhân bản', en: 'Clone', ja: '複製', ko: '복제', zh: '克隆' },
    'cloned': { vi: 'Đã nhân bản hồ sơ!', en: 'Record cloned!', ja: '記録を複製しました！', ko: '기록이 복제되었습니다!', zh: '记录已克隆！' },
    'default_tpl': { vi: 'Mẫu mặc định', en: 'Default Template', ja: 'デフォルトテンプレート', ko: '기본 템플릿', zh: '默认模板' },
    'export_sheets': { vi: 'Xuất Sheets', en: 'Export Sheets', ja: 'Sheets出力', ko: 'Sheets 내보내기', zh: '导出Sheets' },
    'exporting': { vi: 'Đang xuất...', en: 'Exporting...', ja: '出力中...', ko: '내보내는 중...', zh: '导出中...' },
    'export_file': { vi: 'Xuất file', en: 'Export file', ja: 'ファイル出力', ko: '파일 내보내기', zh: '导出文件' },
    'auto_saved': { vi: 'Đã lưu tự động', en: 'Auto-saved', ja: '自動保存済み', ko: '자동 저장됨', zh: '已自动保存' },
    'next': { vi: 'Tiếp theo', en: 'Next', ja: '次へ', ko: '다음', zh: '下一步' },
    'add_person': { vi: 'Thêm người', en: 'Add person', ja: '人を追加', ko: '사람 추가', zh: '添加人员' },
    'note': { vi: 'Ghi chú', en: 'Note', ja: 'メモ', ko: '메모', zh: '备注' },
    'add_col': { vi: 'Thêm cột', en: 'Add column', ja: '列追加', ko: '열 추가', zh: '添加列' },
    'col_name': { vi: 'Tên cột', en: 'Column name', ja: '列名', ko: '열 이름', zh: '列名' },
    'col_type': { vi: 'Loại cột', en: 'Column type', ja: '列タイプ', ko: '열 유형', zh: '列类型' },
    'manual_input': { vi: 'Nhập tay', en: 'Manual input', ja: '手入力', ko: '수동 입력', zh: '手动输入' },
    'formula': { vi: 'Công thức', en: 'Formula', ja: '数式', ko: '수식', zh: '公式' },
    'add_custom_col': { vi: 'Thêm cột tuỳ chỉnh', en: 'Add custom column', ja: 'カスタム列追加', ko: '사용자 정의 열 추가', zh: '添加自定义列' },
    'upload_logo': { vi: 'Tải logo', en: 'Upload logo', ja: 'ロゴアップロード', ko: '로고 업로드', zh: '上传logo' },

    // ── ScanReviewModal ──
    'scan_result': { vi: 'Kết quả quét', en: 'Scan Results', ja: 'スキャン結果', ko: '스캔 결과', zh: '扫描结果' },
    'duplicate_values': { vi: 'giá trị trùng lặp', en: 'duplicate values', ja: '重複値', ko: '중복 값', zh: '重复值' },
    'select_all': { vi: 'Chọn tất cả', en: 'Select all', ja: 'すべて選択', ko: '모두 선택', zh: '全选' },
    'deselect_all': { vi: 'Bỏ tất cả', en: 'Deselect all', ja: '全選択解除', ko: '모두 해제', zh: '取消全选' },
    'all': { vi: 'Tất cả', en: 'All', ja: 'すべて', ko: '전체', zh: '全部' },
    'data': { vi: 'Dữ liệu', en: 'Data', ja: 'データ', ko: '데이터', zh: '数据' },
    'boilerplate': { vi: 'VB cố định', en: 'Boilerplate', ja: '定型文', ko: '상용구', zh: '模板文' },
    'cross_file': { vi: 'Chỉ xuyên file', en: 'Cross-file only', ja: 'ファイル横断のみ', ko: '파일 간만', zh: '仅跨文件' },
    'group_by_role': { vi: 'Nhóm theo vai trò', en: 'Group by role', ja: '役割でグループ化', ko: '역할별 그룹', zh: '按角色分组' },
    'selected': { vi: 'Đã chọn', en: 'Selected', ja: '選択済み', ko: '선택됨', zh: '已选' },
    'save_template': { vi: 'Lưu template', en: 'Save template', ja: 'テンプレート保存', ko: '템플릿 저장', zh: '保存模板' },
    'load_template': { vi: 'Tải template', en: 'Load template', ja: 'テンプレート読み込み', ko: '템플릿 불러오기', zh: '加载模板' },
    'export_excel': { vi: 'Xuất Excel', en: 'Export Excel', ja: 'Excel出力', ko: 'Excel 내보내기', zh: '导出Excel' },
    'value_in_file': { vi: 'Giá trị trong file', en: 'Value in file', ja: 'ファイル内の値', ko: '파일 내 값', zh: '文件中的值' },
    'count': { vi: 'Lần', en: 'Count', ja: '回数', ko: '횟수', zh: '次数' },
    'field_name_tag': { vi: 'Tên trường (tag)', en: 'Field name (tag)', ja: 'フィールド名(タグ)', ko: '필드명(태그)', zh: '字段名(标签)' },
    'display_label': { vi: 'Nhãn hiển thị', en: 'Display label', ja: '表示ラベル', ko: '표시 라벨', zh: '显示标签' },
    'position': { vi: 'Vị trí', en: 'Position', ja: '位置', ko: '위치', zh: '位置' },
    'encoded_fields': { vi: 'Trường mã hóa', en: 'Encoded fields', ja: 'エンコードフィールド', ko: '인코딩 필드', zh: '编码字段' },
    'select_btn': { vi: 'Chọn', en: 'Select', ja: '選択', ko: '선택', zh: '选择' },
    'skip_btn': { vi: 'Bỏ', en: 'Skip', ja: 'スキップ', ko: '건너뛰기', zh: '跳过' },
    'confirm_fields': { vi: 'Xác nhận', en: 'Confirm', ja: '確認', ko: '확인', zh: '确认' },
    'fields': { vi: 'trường', en: 'fields', ja: 'フィールド', ko: '필드', zh: '字段' },
    'choose_values': { vi: 'Chọn các giá trị cần chuyển thành trường nhập liệu', en: 'Choose values to convert to input fields', ja: '入力フィールドに変換する値を選択', ko: '입력 필드로 변환할 값 선택', zh: '选择要转换为输入字段的值' },
    'click_row_preview': { vi: 'Click vào dòng khác để xem preview', en: 'Click a row to preview', ja: '行をクリックしてプレビュー', ko: '행을 클릭하여 미리보기', zh: '点击行预览' },
    'template_name': { vi: 'Tên template', en: 'Template name', ja: 'テンプレート名', ko: '템플릿 이름', zh: '模板名称' },
    'save_btn': { vi: 'Lưu', en: 'Save', ja: '保存', ko: '저장', zh: '保存' },

    // ── TableEditor ──
    'rows': { vi: 'dòng', en: 'rows', ja: '行', ko: '행', zh: '行' },

    // ── TableSetupModal ──
    'table_config': { vi: 'Cấu hình bảng dữ liệu', en: 'Table Data Configuration', ja: 'テーブルデータ設定', ko: '테이블 데이터 구성', zh: '表格数据配置' },
    'select_table': { vi: 'Chọn bảng', en: 'Select table', ja: 'テーブル選択', ko: '테이블 선택', zh: '选择表格' },
    'column': { vi: 'Cột', en: 'Column', ja: '列', ko: '열', zh: '列' },
    'type': { vi: 'Loại', en: 'Type', ja: 'タイプ', ko: '유형', zh: '类型' },
    'sample_data': { vi: 'Mẫu dữ liệu', en: 'Sample data', ja: 'サンプルデータ', ko: '샘플 데이터', zh: '样本数据' },
    'auto_number': { vi: 'Tự đánh số', en: 'Auto number', ja: '自動番号', ko: '자동 번호', zh: '自动编号' },
    'auto_calc': { vi: 'Tự tính', en: 'Auto calc', ja: '自動計算', ko: '자동 계산', zh: '自动计算' },

    // ── RentalContract ──
    'rental_title': { vi: 'Hợp đồng thuê nhà', en: 'Rental Contract', ja: '賃貸契約', ko: '임대 계약', zh: '租赁合同' },
    'rental_desc': { vi: 'Tạo hợp đồng thuê nhà chuyên nghiệp', en: 'Create professional rental contracts', ja: 'プロの賃貸契約を作成', ko: '전문 임대 계약서 작성', zh: '创建专业租赁合同' },
    'landlord_info': { vi: 'Thông tin bên cho thuê', en: 'Landlord Information', ja: '貸主情報', ko: '임대인 정보', zh: '出租方信息' },
    'tenant_info': { vi: 'Thông tin bên thuê', en: 'Tenant Information', ja: '借主情報', ko: '임차인 정보', zh: '承租方信息' },
    'property_info': { vi: 'Thông tin nhà cho thuê', en: 'Property Information', ja: '物件情報', ko: '물건 정보', zh: '物业信息' },
    'contract_terms': { vi: 'Điều khoản hợp đồng', en: 'Contract Terms', ja: '契約条件', ko: '계약 조건', zh: '合同条款' },
    'select_contract': { vi: 'Chọn loại hợp đồng', en: 'Select contract type', ja: '契約タイプを選択', ko: '계약 유형 선택', zh: '选择合同类型' },
    'delete_draft': { vi: 'Xóa nháp', en: 'Delete draft', ja: '下書き削除', ko: '초안 삭제', zh: '删除草稿' },
    'delete_draft_q': { vi: 'Xóa bản nháp?', en: 'Delete draft?', ja: '下書き削除？', ko: '초안 삭제?', zh: '删除草稿？' },

    // ── CT01 Form ──
    'ct01_title': { vi: 'Điền form CT01', en: 'Fill CT01 Form', ja: 'CT01フォーム記入', ko: 'CT01 양식 작성', zh: '填写CT01表单' },
    'ct01_desc': { vi: 'Tờ khai thay đổi nơi cư trú', en: 'Residence Change Declaration', ja: '住所変更届', ko: '주소 변경 신고서', zh: '住所变更申报' },

    // ── Invoice Form ──
    'invoice_title': { vi: 'Hóa đơn bán hàng', en: 'Sales Invoice', ja: '売上請求書', ko: '판매 청구서', zh: '销售发票' },
    'invoice_desc': { vi: 'Tạo hóa đơn, xuất PDF in hoặc lưu trữ', en: 'Create invoices, export PDF for printing or storage', ja: '請求書作成、PDF出力', ko: '청구서 작성, PDF 출력', zh: '创建发票，导出PDF' },
    'company_info': { vi: 'Thông tin công ty', en: 'Company Information', ja: '会社情報', ko: '회사 정보', zh: '公司信息' },
    'customer_info': { vi: 'Thông tin khách hàng', en: 'Customer Information', ja: '顧客情報', ko: '고객 정보', zh: '客户信息' },
    'item_list': { vi: 'Danh sách hàng hoá', en: 'Item List', ja: '商品リスト', ko: '상품 목록', zh: '商品列表' },

    // ── Bundle Form ──
    'bundle_title': { vi: 'Gói mẫu nhiều file', en: 'Multi-file Bundle', ja: '複数ファイルバンドル', ko: '다중 파일 번들', zh: '多文件打包' },
    'bundle_desc': { vi: 'Upload thư mục Word → điền 1 lần → xuất tất cả', en: 'Upload Word folder → fill once → export all', ja: 'Wordフォルダをアップロード → 1回入力 → すべて出力', ko: 'Word 폴더 업로드 → 1회 입력 → 전체 출력', zh: '上传Word文件夹 → 填写一次 → 导出全部' },

    // ── Invitation Form ──
    'invitation_title_page': { vi: 'Giấy mời & Danh sách', en: 'Invitations & Lists', ja: '招待状＆リスト', ko: '초대장 & 목록', zh: '邀请函和列表' },

    // ── Common page elements ──
    'home': { vi: 'Trang chủ', en: 'Home', ja: 'ホーム', ko: '홈', zh: '首页' },
    'back': { vi: 'Quay lại', en: 'Back', ja: '戻る', ko: '뒤로', zh: '返回' },
    'settings': { vi: 'Cài đặt', en: 'Settings', ja: '設定', ko: '설정', zh: '设置' },
    'about': { vi: 'Giới thiệu', en: 'About', ja: 'について', ko: '소개', zh: '关于' },
    'search': { vi: 'Tìm kiếm', en: 'Search', ja: '検索', ko: '검색', zh: '搜索' },
    'not_found': { vi: 'Không tìm thấy trang', en: 'Page Not Found', ja: 'ページが見つかりません', ko: '페이지를 찾을 수 없습니다', zh: '页面未找到' },
    'go_home': { vi: 'Về trang chủ', en: 'Go to Home', ja: 'ホームに戻る', ko: '홈으로 이동', zh: '回到首页' },
    'full_name': { vi: 'Họ và tên', en: 'Full name', ja: '氏名', ko: '성명', zh: '姓名' },
    'dob': { vi: 'Ngày sinh', en: 'Date of birth', ja: '生年月日', ko: '생년월일', zh: '出生日期' },
    'gender': { vi: 'Giới tính', en: 'Gender', ja: '性別', ko: '성별', zh: '性别' },
    'phone': { vi: 'Số điện thoại', en: 'Phone number', ja: '電話番号', ko: '전화번호', zh: '电话号码' },
    'id_number': { vi: 'Số CCCD/CMND', en: 'ID number', ja: '身分証番号', ko: '신분증 번호', zh: '身份证号' },
    'id_date': { vi: 'Ngày cấp', en: 'Issue date', ja: '発行日', ko: '발급일', zh: '签发日期' },
    'id_place': { vi: 'Nơi cấp', en: 'Place of issue', ja: '発行場所', ko: '발급처', zh: '签发地' },
    'address': { vi: 'Địa chỉ', en: 'Address', ja: '住所', ko: '주소', zh: '地址' },
    'perm_address': { vi: 'Địa chỉ thường trú', en: 'Permanent address', ja: '永住地', ko: '주민등록 주소', zh: '户籍地址' },
    'bank_account': { vi: 'Số tài khoản NH', en: 'Bank account', ja: '銀行口座', ko: '은행 계좌', zh: '银行账号' },
    'bank_name': { vi: 'Tên ngân hàng', en: 'Bank name', ja: '銀行名', ko: '은행명', zh: '银行名称' },
    'company_name': { vi: 'Tên công ty', en: 'Company name', ja: '会社名', ko: '회사명', zh: '公司名称' },
    'customer_name': { vi: 'Tên khách hàng', en: 'Customer name', ja: '顧客名', ko: '고객명', zh: '客户名称' },

    // ── About Page ──
    'about_title': { vi: 'Giới thiệu', en: 'About DocMaker', ja: 'DocMakerについて', ko: 'DocMaker 소개', zh: '关于DocMaker' },
    'about_mission': { vi: 'Sứ mệnh', en: 'Our Mission', ja: 'ミッション', ko: '미션', zh: '使命' },
    'about_mission_desc': { vi: 'Giúp cán bộ, công chức Việt Nam tạo hồ sơ nhanh hơn, chính xác hơn', en: 'Help create documents faster and more accurately', ja: 'より速く正確に文書を作成', ko: '더 빠르고 정확한 문서 작성', zh: '帮助更快更准确地创建文档' },
    'about_security': { vi: 'Bảo mật', en: 'Security', ja: 'セキュリティ', ko: '보안', zh: '安全' },
    'about_security_desc': { vi: 'Dữ liệu xử lý 100% trên máy tính của bạn. Không gửi lên mạng.', en: 'Data processed 100% on your computer. Never sent online.', ja: 'データは100%お使いのPCで処理。オンラインには送信しません。', ko: '데이터는 100% 컴퓨터에서 처리됩니다. 온라인으로 전송되지 않습니다.', zh: '数据100%在您的电脑上处理。不会发送到网上。' },

    // ── Settings Page ──
    'settings_title': { vi: 'Cài đặt', en: 'Settings', ja: '設定', ko: '설정', zh: '设置' },
    'settings_theme': { vi: 'Giao diện', en: 'Theme', ja: 'テーマ', ko: '테마', zh: '主题' },
    'settings_language': { vi: 'Ngôn ngữ', en: 'Language', ja: '言語', ko: '언어', zh: '语言' },
    'settings_storage': { vi: 'Lưu trữ', en: 'Storage', ja: 'ストレージ', ko: '저장소', zh: '存储' },
    'settings_clear': { vi: 'Xóa toàn bộ dữ liệu', en: 'Clear all data', ja: '全データ削除', ko: '모든 데이터 삭제', zh: '清除所有数据' },

    // ── Project Management ──
    'project_list': { vi: 'Danh sách dự án', en: 'Project List', ja: 'プロジェクト一覧', ko: '프로젝트 목록', zh: '项目列表' },
    'project_detail': { vi: 'Chi tiết dự án', en: 'Project Detail', ja: 'プロジェクト詳細', ko: '프로젝트 상세', zh: '项目详情' },
    'project_search': { vi: 'Tìm kiếm dự án', en: 'Search Projects', ja: 'プロジェクト検索', ko: '프로젝트 검색', zh: '搜索项目' },
    'project_compare': { vi: 'So sánh dự án', en: 'Compare Projects', ja: 'プロジェクト比較', ko: '프로젝트 비교', zh: '比较项目' },

    // ── Contractor ──
    'contractor_title': { vi: 'Danh bạ nhà thầu', en: 'Contractor Directory', ja: '業者ディレクトリ', ko: '시공사 디렉토리', zh: '承包商目录' },

    // ── File Diff ──
    'diff_title': { vi: 'So sánh file', en: 'Compare Files', ja: 'ファイル比較', ko: '파일 비교', zh: '比较文件' },

    // ── Dashboard ──
    'dashboard': { vi: 'Bảng điều khiển', en: 'Dashboard', ja: 'ダッシュボード', ko: '대시보드', zh: '仪表板' },

    // ── ND30 ──
    'nd30_title': { vi: 'Kiểm tra NĐ30', en: 'ND30 Checker', ja: 'NĐ30チェッカー', ko: 'NĐ30 검사기', zh: 'NĐ30检查器' },

    // ── Template Marketplace ──
    'marketplace_title': { vi: 'Thư viện mẫu', en: 'Template Library', ja: 'テンプレートライブラリ', ko: '템플릿 라이브러리', zh: '模板库' },

    // ── Guide Page ──
    'guide_title': { vi: 'Hướng dẫn sử dụng', en: 'User Guide', ja: '使用ガイド', ko: '사용 가이드', zh: '使用指南' },

    // ── Validation ──
    'please_enter': { vi: 'Vui lòng nhập', en: 'Please enter', ja: '入力してください', ko: '입력해 주세요', zh: '请输入' },
};

/**
 * Hook to get page-level translations.
 * Usage: const p = usePageT(); p('military_title')
 */
export function usePageT() {
    const { lang } = useLanguage();
    return (key: string): string => {
        const entry = PAGE_TRANSLATIONS[key];
        if (!entry) return key;
        return entry[lang] || entry['en'] || entry['vi'] || key;
    };
}
