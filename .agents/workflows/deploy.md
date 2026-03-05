---
description: Cách deploy web lên Vercel qua GitHub
---

# Deploy lên Vercel

> ⚠️ **QUAN TRỌNG**: Web đang được khách hàng dùng thử.
> PHẢI HỎI USER XÁC NHẬN trước khi deploy. KHÔNG tự ý push lên `main`.

## Bước 1: Kiểm tra trước khi deploy

1. Chạy build local để đảm bảo không lỗi:
// turbo

```bash
npm run build
```

1. Nếu build lỗi → sửa lỗi trước, KHÔNG deploy

## Bước 2: Hỏi user xác nhận

**BẮT BUỘC** — Hỏi user:
> "Bạn có muốn deploy lên web cho khách dùng không? Thay đổi gồm: [liệt kê thay đổi]"

Chỉ tiếp tục khi user đồng ý.

## Bước 3: Commit và push

```bash
git add -A
git commit -m "feat: mô tả thay đổi"
git push origin hieu1
git push origin hieu1:main
```

> Nếu lỗi non-fast-forward:
>
> ```bash
> git push origin hieu1:main --force
> ```

## Bước 4: Xác nhận

- Đợi 2-3 phút để Vercel build
- Kiểm tra tại: <https://taohoso-six.vercel.app>
