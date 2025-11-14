
export function calculateNextDueDate(currentDueDate: Date, value: number, unit: 'days' | 'weeks' | 'months' | 'years'): Date {
    const newDate = new Date(currentDueDate);
    switch (unit) {
        case 'days': newDate.setDate(newDate.getDate() + value); break;
        case 'weeks': newDate.setDate(newDate.getDate() + value * 7); break;
        case 'months': newDate.setMonth(newDate.getMonth() + value); break;
        case 'years': newDate.setFullYear(newDate.getFullYear() + value); break;
    }
    return newDate;
}

export const formatRupiah = (number: number | string): string => {
    if (typeof number === 'string') {
        number = parseFloat(number.replace(/[^\d]/g, ''));
    }
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('id-ID').format(number);
};

export const parseRupiah = (formattedString: string): number => {
    return parseInt(formattedString.replace(/[^\d]/g, ''), 10) || 0;
};
