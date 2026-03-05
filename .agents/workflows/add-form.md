---
description: Cách thêm một form/trang mới cho loại hồ sơ mới
---

# Thêm Form Mới

## Bước 1: Tạo template

- Đặt file `.docx` hoặc `.xlsx` vào `public/templates/`
- File phải có `{TAG_NAME}` cho các giá trị cần thay đổi

## Bước 2: Tạo page component

- Tạo file mới trong `src/pages/`, ví dụ: `NewForm.tsx`
- Copy structure từ `MilitaryDocForm.tsx` làm mẫu
- Định nghĩa:
  - `TAG_LABELS` — nhãn tiếng Việt
  - `TAG_PLACEHOLDERS` — giá trị mẫu
  - `TAG_GROUPS` — layout nhóm form

## Bước 3: Thêm route

Mở `src/App.tsx`, thêm route mới:

```tsx
<Route path="/ten-form-moi" element={<NewForm />} />
```

## Bước 4: Thêm link trên trang chủ

Mở `src/pages/Home.tsx`, thêm card cho form mới trong danh sách

## Bước 5: Deploy

Theo workflow `/deploy`
