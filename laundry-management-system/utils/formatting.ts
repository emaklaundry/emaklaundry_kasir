
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
