---
description: Lưu và đồng bộ code an toàn trước khi tắt máy hoặc kết thúc phiên
---

# Lưu code an toàn

## Bước 1: Kiểm tra thay đổi

// turbo

```
git status
```

## Bước 2: Commit tất cả

```
git add -A; git commit -m "save: [mô tả ngắn những gì đã làm]"
```

## Bước 3: Push lên GitHub (KHÔNG dùng --force)

```
git push origin hieu1
```

## Bước 4: Xác nhận

// turbo

```
git log --oneline -3
```

> [!CAUTION]
> KHÔNG BAO GIỜ dùng `git push --force` hoặc `git rebase` trừ khi user yêu cầu rõ ràng.
