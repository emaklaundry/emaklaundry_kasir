export interface MonthlyExpenseTemplate {
  id: string;
  storeId: string;
  name: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
  /** Nominal yang mengisi pop-up otomatis; null = kosong. */
  defaultAmount: number | null;
}

export const MIN_REMINDER_DAY = 1;
export const MAX_REMINDER_DAY = 28;

/** Tanggal muncul pop-up yang aman (1-28); nilai rusak/kosong kembali ke 1. */
export function normalizeReminderDay(day: number | null | undefined): number {
  if (typeof day !== 'number' || !Number.isFinite(day)) return MIN_REMINDER_DAY;
  return Math.min(MAX_REMINDER_DAY, Math.max(MIN_REMINDER_DAY, Math.trunc(day)));
}

/** Pop-up muncul bila aktif dan hari ini sudah mencapai tanggal yang diatur. */
export function isMonthlyReminderDue(
  date: Date,
  settings: { enabled?: boolean | null; day?: number | null },
): boolean {
  if (settings.enabled === false) return false;
  return date.getDate() >= normalizeReminderDay(settings.day);
}

export interface MonthlyExpenseRecordReference {
  storeId: string | null;
  templateId: string | null;
  period: string | null;
}

export function getMonthPeriod(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}-01`;
}

export function getLocalDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function getOutstandingMonthlyTemplates(
  templates: MonthlyExpenseTemplate[],
  records: MonthlyExpenseRecordReference[],
  storeId: string,
  period: string,
): MonthlyExpenseTemplate[] {
  const savedTemplateIds = new Set(
    records
      .filter((record) => record.storeId === storeId && record.period === period)
      .map((record) => record.templateId)
      .filter((id): id is string => id !== null),
  );

  return templates
    .filter(
      (template) =>
        template.storeId === storeId && template.isActive && !savedTemplateIds.has(template.id),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
