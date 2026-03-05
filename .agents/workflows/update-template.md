---
description: Cách cập nhật file template Word mặc định và đồng bộ code
---

# Cập nhật Template Word

## Khi user chỉnh sửa template

1. User lưu file Word mới vào:
   `public/templates/template_nha_tap_the.docx`

   > Nếu file nguồn là `.doc` (Word cũ), phải Save As → `.docx` trước

2. Scan tags trong template mới:

```bash
node -e "
const fs=require('fs'), PizZip=require('./node_modules/pizzip');
const z=new PizZip(fs.readFileSync('public/templates/template_nha_tap_the.docx'));
const x=z.file('word/document.xml').asText();
const t=new Set(); let m; const r=/\{([^}]+)\}/g;
while((m=r.exec(x))!==null) t.add(m[1]);
console.log([...t].sort().join('\n'));
console.log('Total:', t.size);
"
```

1. Nếu template không có `{tag}`, cần thêm bằng script hoặc user chỉnh trong Word

2. Cập nhật 3 nơi trong `src/pages/MilitaryDocForm.tsx`:
   - `TAG_LABELS` — nhãn hiển thị
   - `TAG_PLACEHOLDERS` — giá trị gợi ý
   - `TAG_GROUPS` — phân nhóm layout

3. Deploy theo workflow `/deploy`

## Lưu ý quan trọng

- Word chia text thành nhiều `<w:t>` XML nodes → thay thế text bằng script có thể không khớp
- KHÔNG dùng script gộp text nodes (sẽ phá nội dung template)
- Cách an toàn nhất: user tự thêm `{TAG}` trực tiếp trong Word
