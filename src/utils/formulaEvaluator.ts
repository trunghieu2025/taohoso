/**
 * Formula Evaluator for custom computed fields.
 * Supports: + - * / % with tag references like {GIA_TRI_HD}
 * Example: "{GIA_TRI_HD} * {THUE_VAT} / 100"
 */

import type { InvoiceItem, CustomColumn } from '../types';

/**
 * Evaluate a formula string, replacing {TAG} with values from data.
 * Returns the computed result as a formatted string, or error message.
 */
export function evaluateFormula(
    formula: string,
    data: Record<string, string>,
): string {
    try {
        // Replace {TAG} with numeric values
        let expr = formula.replace(/\{([^}]+)\}/g, (_, tag) => {
            const raw = data[tag] || '0';
            // Remove dots (VND thousands separator) and convert
            const num = parseFloat(raw.replace(/\./g, '').replace(/,/g, '.'));
            return isNaN(num) ? '0' : String(num);
        });

        // Only allow safe characters: digits, operators, spaces, parentheses, dots
        if (!/^[\d\s+\-*/().%]+$/.test(expr)) {
            return '⚠️ Công thức không hợp lệ';
        }

        // Handle % operator: convert "a % b" to "(a * b / 100)"
        expr = expr.replace(/(\d+(?:\.\d+)?)\s*%\s*(\d+(?:\.\d+)?)/g, '($1 * $2 / 100)');

        // Evaluate safely
        const result = new Function(`return (${expr})`)();

        if (typeof result !== 'number' || !isFinite(result)) {
            return '⚠️ Kết quả không hợp lệ';
        }

        // Format number with VND thousands separator
        return formatVND(result);
    } catch {
        return '⚠️ Lỗi công thức';
    }
}

/**
 * Format a number with Vietnamese thousands separator (dots).
 */
function formatVND(num: number): string {
    const rounded = Math.round(num);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Check if a formula string is valid.
 */
export function isValidFormula(formula: string): boolean {
    // Must contain at least one {TAG} reference
    if (!/\{[^}]+\}/.test(formula)) return false;
    // Must contain an operator
    if (!/[+\-*/%]/.test(formula)) return false;
    return true;
}

/**
 * Extract tag names referenced in a formula.
 */
export function extractFormulaTags(formula: string): string[] {
    const tags: string[] = [];
    const re = /\{([^}]+)\}/g;
    let match;
    while ((match = re.exec(formula)) !== null) {
        if (!tags.includes(match[1])) tags.push(match[1]);
    }
    return tags;
}

/* ── Invoice Custom Column Formula Resolution ── */

/**
 * Resolve formula columns for a single invoice item.
 * Built-in variables: SL (qty), Đơn giá (price), Thành tiền (qty*price)
 */
export function resolveCustomFields(
    item: InvoiceItem,
    columns: CustomColumn[],
): Record<string, string> {
    const result: Record<string, string> = { ...(item.customFields || {}) };

    // Built-in variables
    const vars: Record<string, number> = {
        'SL': item.qty || 0,
        'Đơn giá': item.price || 0,
        'Thành tiền': (item.qty || 0) * (item.price || 0),
    };

    // Add custom text column values as variables
    for (const col of columns) {
        if (col.type === 'text' && result[col.id]) {
            const num = parseFloat(result[col.id].replace(/\./g, '').replace(/,/g, '.'));
            if (!isNaN(num)) vars[col.title] = num;
        }
    }

    // Evaluate formula columns
    for (const col of columns) {
        if (col.type !== 'formula' || !col.formula) continue;
        try {
            let expr = col.formula;
            // Replace variable names with values (longest first to avoid partial matches)
            const sortedKeys = Object.keys(vars).sort((a, b) => b.length - a.length);
            for (const key of sortedKeys) {
                expr = expr.split(key).join(String(vars[key]));
            }
            // Also replace custom column values by title
            for (const c of columns) {
                if (c.id !== col.id && result[c.id]) {
                    const num = parseFloat(result[c.id].replace(/\./g, '').replace(/,/g, '.'));
                    if (!isNaN(num)) {
                        expr = expr.split(c.title).join(String(num));
                    }
                }
            }
            if (/^[\d\s+\-*/().]+$/.test(expr)) {
                const val = new Function(`return (${expr})`)();
                if (typeof val === 'number' && isFinite(val)) {
                    result[col.id] = String(Math.round(val));
                    vars[col.title] = Math.round(val);
                } else {
                    result[col.id] = 'Lỗi';
                }
            } else {
                result[col.id] = 'Lỗi';
            }
        } catch {
            result[col.id] = 'Lỗi';
        }
    }

    return result;
}

/**
 * Evaluate a single formula column for display in a table cell.
 * Returns formatted string result.
 */
export function evaluateFormulaForItem(
    formula: string,
    item: InvoiceItem,
    columns: CustomColumn[],
    currentColId: string,
): string {
    try {
        const vars: Record<string, number> = {
            'SL': item.qty || 0,
            'Đơn giá': item.price || 0,
            'Thành tiền': (item.qty || 0) * (item.price || 0),
        };
        // Add custom text fields as variables
        for (const col of columns) {
            if (col.id !== currentColId && col.type === 'text' && item.customFields[col.id]) {
                const num = parseFloat(item.customFields[col.id].replace(/\./g, '').replace(/,/g, '.'));
                if (!isNaN(num)) vars[col.title] = num;
            }
        }
        let expr = formula;
        const sortedKeys = Object.keys(vars).sort((a, b) => b.length - a.length);
        for (const key of sortedKeys) {
            expr = expr.split(key).join(String(vars[key]));
        }
        if (/^[\d\s+\-*/().]+$/.test(expr)) {
            const val = new Function(`return (${expr})`)();
            if (typeof val === 'number' && isFinite(val)) {
                return Math.round(val).toLocaleString('vi-VN');
            }
        }
        return 'Lỗi';
    } catch {
        return 'Lỗi';
    }
}
