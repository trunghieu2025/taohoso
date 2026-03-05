/**
 * Chuyển chuỗi số Việt Nam (dùng dấu chấm phân cách) thành chữ tiếng Việt.
 * Ví dụ: "292.000.000" → "Hai trăm chín mươi hai triệu đồng"
 */

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readGroup(hundreds: number, tens: number, units: number, showZeroHundreds: boolean): string {
    const parts: string[] = [];

    if (hundreds > 0) {
        parts.push(DIGITS[hundreds] + ' trăm');
    } else if (showZeroHundreds) {
        parts.push('không trăm');
    }

    if (tens > 1) {
        parts.push(DIGITS[tens] + ' mươi');
        if (units === 1) parts.push('mốt');
        else if (units === 4) parts.push('tư');
        else if (units === 5) parts.push('lăm');
        else if (units > 0) parts.push(DIGITS[units]);
    } else if (tens === 1) {
        parts.push('mười');
        if (units === 1) parts.push('một');
        else if (units === 5) parts.push('lăm');
        else if (units > 0) parts.push(DIGITS[units]);
    } else if (units > 0) {
        if (hundreds > 0 || showZeroHundreds) parts.push('lẻ');
        parts.push(DIGITS[units]);
    }

    return parts.join(' ');
}

const UNITS = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

export function numberToVietnamese(input: string): string {
    // Remove dots (Vietnamese thousand separator) and trim
    const cleaned = input.replace(/\./g, '').replace(/,/g, '').trim();
    if (!cleaned || !/^\d+$/.test(cleaned)) return '';

    const num = parseInt(cleaned, 10);
    if (num === 0) return 'Không đồng';
    if (isNaN(num)) return '';

    // Split into groups of 3 from right
    const digits = cleaned.replace(/^0+/, '') || '0';
    const groups: number[][] = [];
    let i = digits.length;
    while (i > 0) {
        const start = Math.max(0, i - 3);
        const g = digits.slice(start, i);
        groups.unshift(g.split('').map(Number));
        i = start;
    }

    // Pad first group to 3 digits
    while (groups[0].length < 3) groups[0].unshift(0);

    const parts: string[] = [];
    for (let idx = 0; idx < groups.length; idx++) {
        const [h, t, u] = groups[idx];
        const unitIdx = groups.length - 1 - idx;
        // Skip groups that are all zeros
        if (h === 0 && t === 0 && u === 0) continue;
        const groupText = readGroup(h, t, u, idx > 0);
        if (groupText) {
            parts.push(groupText + (UNITS[unitIdx] ? ' ' + UNITS[unitIdx] : ''));
        }
    }

    if (parts.length === 0) return '';
    const result = parts.join(' ');
    // Capitalize first letter
    return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
}
