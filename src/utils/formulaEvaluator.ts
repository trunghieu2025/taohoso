// Simple formula evaluator for custom invoice columns.
// Supports: +, -, *, /, (), numbers, and named variables.
// Variables are resolved from built-in fields (SL, Đơn giá, Thành tiền)
// plus any custom column values.

import { InvoiceItem, CustomColumn } from '../types';

/** Built-in variable aliases (Vietnamese + ASCII) */
const BUILTIN_ALIASES: Record<string, (item: InvoiceItem) => number> = {
    'SL': (i) => i.qty,
    'sl': (i) => i.qty,
    'Đơn giá': (i) => i.price,
    'dongia': (i) => i.price,
    'Don gia': (i) => i.price,
    'Thành tiền': (i) => i.qty * i.price,
    'thanhtien': (i) => i.qty * i.price,
    'Thanh tien': (i) => i.qty * i.price,
};

/**
 * Build a variables map for a single row.
 * Includes built-in aliases + values from other custom columns.
 */
function buildVars(
    item: InvoiceItem,
    allColumns: CustomColumn[],
    currentColId: string,
): Record<string, number> {
    const vars: Record<string, number> = {};

    // Built-in variables
    for (const [name, fn] of Object.entries(BUILTIN_ALIASES)) {
        vars[name] = fn(item);
    }

    // Custom column values (only non-formula or already-computed formula columns)
    for (const col of allColumns) {
        if (col.id === currentColId) continue; // skip self to prevent circular reference
        const raw = item.customFields[col.id];
        if (raw !== undefined && raw !== '') {
            const num = parseFloat(raw);
            if (!isNaN(num)) {
                vars[col.title] = num;
            }
        }
    }

    return vars;
}

/**
 * Evaluate a formula string with the given variables.
 * Only allows numbers, basic operators, parentheses, and variable names.
 * Returns the numeric result or NaN on error.
 */
function evaluateExpression(formula: string, vars: Record<string, number>): number {
    if (!formula.trim()) return 0;

    // Sort variable names by length (descending) to replace longer names first
    const sortedNames = Object.keys(vars).sort((a, b) => b.length - a.length);

    let expr = formula;
    for (const name of sortedNames) {
        // Replace all occurrences of the variable name with its numeric value
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        expr = expr.replace(new RegExp(escaped, 'g'), String(vars[name]));
    }

    // Validate: only allow digits, dots, operators, parentheses, spaces
    if (!/^[\d\s.+\-*/()]+$/.test(expr)) {
        return NaN;
    }

    try {
        // Safe evaluation using Function constructor (no access to global scope)
        const fn = new Function(`"use strict"; return (${expr});`);
        const result = fn();
        return typeof result === 'number' && isFinite(result) ? result : NaN;
    } catch {
        return NaN;
    }
}

/**
 * Evaluate a formula column for a specific item row.
 * Returns the formatted result string, or '' on error.
 */
export function evaluateFormulaForItem(
    formula: string,
    item: InvoiceItem,
    allColumns: CustomColumn[],
    currentColId: string,
): string {
    const vars = buildVars(item, allColumns, currentColId);
    const result = evaluateExpression(formula, vars);
    if (isNaN(result)) return 'Lỗi';
    return result.toLocaleString('vi-VN');
}

/**
 * Evaluate a formula column for a specific item row — returns raw number.
 */
export function evaluateFormulaForItemRaw(
    formula: string,
    item: InvoiceItem,
    allColumns: CustomColumn[],
    currentColId: string,
): number {
    const vars = buildVars(item, allColumns, currentColId);
    return evaluateExpression(formula, vars);
}

/**
 * Resolve ALL custom column values for a single item.
 * Formula columns are evaluated in order, and their results
 * are injected into the item's customFields so later formulas
 * can reference them.
 * Returns a new customFields record with formula results filled in.
 */
export function resolveCustomFields(
    item: InvoiceItem,
    columns: CustomColumn[],
): Record<string, string> {
    // Clone item so we can inject computed values as we go
    const resolved: Record<string, string> = { ...item.customFields };
    const tempItem: InvoiceItem = { ...item, customFields: resolved };

    for (const col of columns) {
        if (col.type === 'formula' && col.formula) {
            const val = evaluateFormulaForItemRaw(col.formula, tempItem, columns, col.id);
            resolved[col.id] = isNaN(val) ? 'Lỗi' : String(val);
        }
    }

    return resolved;
}
