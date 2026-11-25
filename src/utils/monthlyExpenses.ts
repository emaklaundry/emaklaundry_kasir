export interface MonthlyExpenseTemplate {
  id: string;
  storeId: string;
  name: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
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
