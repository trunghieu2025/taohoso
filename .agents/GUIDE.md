# 📘 Hướng dẫn thực hiện — TaoHoSo

## 1. Cấu trúc dự án

```
taohoso/
├── .agents/             ← Skill & workflow cho AI
├── public/templates/    ← File template Word/Excel mặc định
├── src/pages/           ← Các trang form
├── src/components/      ← UI components
├── src/utils/           ← Logic xử lý template
└── dist/                ← Build output (tự động)
```

## 2. Link quan trọng

| Mục | Link |
|---|---|
| **Web cho khách** | <https://taohoso-six.vercel.app> |
| **GitHub** | <https://github.com/trunghieu2025/taohoso> |
| **Vercel dashboard** | <https://vercel.com> → project taohoso |

## 3. Cách phát triển an toàn

```
main ──────────────── bản ổn định cho khách
  │
  └── hieu1 ────────── bạn dev ở đây (thoải mái sửa)
```

| Hành động | Ảnh hưởng khách? | Cách làm |
|---|---|---|
| Sửa code trên `hieu1` | ❌ Không | Sửa thoải mái |
| Chạy `npm run dev` | ❌ Không | Test local tại `localhost:5173` |
| Push lên `hieu1` | ❌ Không | `git push origin hieu1` |
| Push lên `main` | ✅ **CÓ** | `/deploy` (AI sẽ hỏi xác nhận) |

## 4. Các lệnh cơ bản

### Chạy web local (dev)

```bash
npm run dev
```

→ Mở <http://localhost:5173> để xem

### Kiểm tra build trước khi deploy

```bash
npm run build
```

### Lưu thay đổi (commit)

```bash
git add -A
git commit -m "mô tả thay đổi"
git push origin hieu1
```

### Deploy lên web cho khách

Gõ lệnh trong chat:

```
/deploy
```

AI sẽ **hỏi xác nhận** trước khi deploy.

## 5. Các workflow có sẵn

| Lệnh | Mô tả |
|---|---|
| `/deploy` | Deploy lên Vercel (có hỏi xác nhận) |
| `/update-template` | Cập nhật file template Word |
| `/add-form` | Thêm form hồ sơ mới |

## 6. Quy tắc cho AI

> **AI KHÔNG ĐƯỢC tự ý:**
>
> - Push code lên branch `main`
> - Deploy lên Vercel
> - Sửa file template production
>
> **AI PHẢI hỏi user trước khi** thực hiện bất kỳ hành động nào ảnh hưởng đến bản web khách đang dùng.
