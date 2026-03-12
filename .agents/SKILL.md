---
name: TaoHoSo - Công cụ tạo hồ sơ hành chính
description: Kiến trúc, cách hoạt động và hướng dẫn phát triển web app tạo hồ sơ hành chính quân đội Việt Nam
---

# TaoHoSo - Project Skill

## Tổng quan

Web app **tạo hồ sơ hành chính** cho quân đội Việt Nam. Người dùng upload template Word/Excel → điền thông tin qua form → xuất file hoàn chỉnh.

**Tech Stack**: React + TypeScript + Vite  
**Deploy**: Vercel (branch `main`)  
**Link**: <https://taohoso.vercel.app>  
**Repo**: <https://github.com/trunghieu2025/taohoso>

## Kiến trúc

```
src/
├── pages/              # Các trang chính
│   ├── Home.tsx           # Landing page
│   ├── MilitaryDocForm.tsx # Form hồ sơ sửa chữa (Word template)
│   ├── InvoiceForm.tsx    # Form hóa đơn
│   ├── CT01Form.tsx       # Form CT01
│   ├── RentalContract.tsx # Hợp đồng thuê
│   ├── SearchPage.tsx     # Trang tìm kiếm
│   └── About.tsx          # Giới thiệu
├── components/         # UI components
│   ├── Header.tsx         # Thanh điều hướng
│   ├── Footer.tsx         # Footer
│   ├── FormField.tsx      # Input field component
│   ├── ScanReviewModal.tsx # Modal review tags khi upload template mới
│   └── FAQ.tsx            # Câu hỏi thường gặp
├── utils/              # Logic xử lý
│   ├── militaryDocGenerator.ts  # Xử lý Word template (docx)
│   ├── excelTemplateGenerator.ts # Xử lý Excel template (xlsx)
│   ├── pdfGenerator.ts          # Xuất PDF
│   └── formulaEvaluator.ts      # Tính toán công thức Excel
├── data/               # Dữ liệu tĩnh
└── App.tsx             # Router chính
public/
└── templates/          # File template mặc định
    └── template_nha_tap_the.docx  # Mẫu hồ sơ nhà tập thể
```

## Cách hoạt động template Word

### Flow chính

1. **Load template** → đọc file `.docx` (ZIP chứa XML) bằng `PizZip`
2. **Scan tags** → tìm `{TAG_NAME}` trong XML → tạo form fields
3. **User nhập** → điền dữ liệu vào form
4. **Preview** → thay `{TAG}` bằng data → render bằng `docx-preview` (real-time)
5. **Export** → thay `{TAG}` → tạo file `.docx` download

### Hệ thống Tags

- Tags có dạng `{TÊN_TAG}` trong file Word
- `TAG_LABELS`: nhãn hiển thị tiếng Việt
- `TAG_PLACEHOLDERS`: giá trị gợi ý khi form rỗng
- `TAG_GROUPS`: phân nhóm tags cho layout form (icon, title, rows)

### Hai chế độ template

1. **Mẫu mặc định**: có `{tag}` sẵn → hiện form ngay
2. **Upload mới**: user upload file Word/Excel bất kỳ → scan tự động tìm giá trị trùng lặp → modal review → tạo tags

## Quy tắc khi chỉnh sửa

### Thêm/sửa tag trong template mặc định

1. Sửa file `public/templates/template_nha_tap_the.docx` (thêm `{TAG_MỚI}`)
2. Cập nhật `TAG_LABELS`, `TAG_PLACEHOLDERS`, `TAG_GROUPS` trong `MilitaryDocForm.tsx`
3. Commit → push `main` → Vercel auto-deploy

### Thêm form mới

1. Tạo page mới trong `src/pages/`
2. Thêm route trong `App.tsx`
3. Tạo template trong `public/templates/`
4. Thêm link trong `Home.tsx`

### Deploy

- Push code lên branch `main` → Vercel tự động build & deploy
- **KHÔNG** push lên `master` (Vercel không theo dõi)
- Link production: <https://taohoso.vercel.app>

## Lưu ý quan trọng

- File `.doc` (Word cũ) phải convert sang `.docx` trước khi dùng
- Word chia text thành nhiều `<w:t>` nodes → replace text phải cẩn thận
- Template có text bị split trong XML → một số tag không thể tự động thêm bằng script
- Git có 2 branch remote: `main` (Vercel) và `master` (cũ, không dùng)

## ⚠️ QUY TẮC AN TOÀN

> **Web đang được KHÁCH HÀNG dùng thử.**
>
> AI **BẮT BUỘC** phải hỏi user xác nhận trước khi:
>
> - Push code lên branch `main`
> - Deploy lên Vercel  
> - Sửa/xóa file template production
> - Thực hiện bất kỳ thao tác nào ảnh hưởng đến bản web khách đang dùng
>
> **KHÔNG BAO GIỜ** tự ý deploy mà không có sự đồng ý của user.
