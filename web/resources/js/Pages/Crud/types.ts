export type Value = string | number | boolean | null;
export interface Field { name: string; label: string; type: string; required: boolean; help?: string; max?: number; min?: number; options?: {value: string | number; label: string}[] }
export interface NavItem { key: string; label: string }
export interface ResourceProps { resource: string; label: string; singular: string; fields: Field[]; navigation: NavItem[] }
export function display(field: Field, value: Value): string {
    if (field.type === 'checkbox') return value ? 'Yes' : 'No';
    if (value === '' || value === null || value === undefined) return '—';
    return field.options?.find(option => String(option.value) === String(value))?.label ?? String(value);
}
export const linkClass = 'font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600';
export const buttonClass = 'inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50';
