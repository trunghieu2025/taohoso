---
description: Cách deploy web lên Vercel qua GitHub
---
// turbo-all

# Deploy lên Vercel

1. Thêm tất cả thay đổi vào git:

```bash
git add -A
```

1. Commit với message mô tả:

```bash
git commit -m "feat: mô tả thay đổi"
```

1. Push lên branch `main` (Vercel theo dõi branch này):

```bash
git push origin HEAD:main
```

> **Lưu ý**: Nếu bị lỗi non-fast-forward, dùng `--force`:
>
> ```bash
> git push origin HEAD:main --force
> ```

1. Đợi 2-3 phút để Vercel build xong

2. Kiểm tra tại: <https://taohoso-six.vercel.app>
