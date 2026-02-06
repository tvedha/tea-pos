import { format, parse, startOfDay, endOfDay, parseISO } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

const TIMEZONE = 'Asia/Kolkata';

export const formatDateIST = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = utcToZonedTime(d, TIMEZONE);
  return format(zonedDate, 'dd MMM yyyy, HH:mm');
};

export const formatTimeIST = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = utcToZonedTime(d, TIMEZONE);
  return format(zonedDate, 'HH:mm');
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = utcToZonedTime(d, TIMEZONE);
  return format(zonedDate, 'dd MMM yyyy');
};

export const getTodayStartEnd = () => {
  const now = new Date();
  const zonedNow = utcToZonedTime(now, TIMEZONE);
  const start = startOfDay(zonedNow);
  const end = endOfDay(zonedNow);
  return {
    start: zonedTimeToUtc(start, TIMEZONE).toISOString(),
    end: zonedTimeToUtc(end, TIMEZONE).toISOString(),
  };
};

export const formatCurrency = (amount: number, symbol = '₹'): string => {
  return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export const calculateTotal = (items: { quantity: number; rate: number }[]): number => {
  return items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
};

export const parseCurrencyInput = (input: string): number => {
  const cleaned = input.replace(/[^\d.]/g, '');
  return parseFloat(cleaned) || 0;
};
