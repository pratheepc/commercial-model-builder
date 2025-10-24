import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { SUPPORTED_CURRENCIES } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  // Use appropriate locale based on currency
  let locale = 'en-US';
  if (currency === 'INR') {
    locale = 'en-IN'; // Indian number formatting (lakhs, crores)
  } else if (currency === 'EUR') {
    locale = 'en-GB'; // European formatting
  } else if (currency === 'GBP') {
    locale = 'en-GB'; // British formatting
  } else if (currency === 'JPY') {
    locale = 'ja-JP'; // Japanese formatting
  } else if (currency === 'CNY') {
    locale = 'zh-CN'; // Chinese formatting
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number, currency?: string): string {
  // Use appropriate locale based on currency if provided
  let locale = 'en-US';
  if (currency === 'INR') {
    locale = 'en-IN'; // Indian number formatting (lakhs, crores)
  } else if (currency === 'EUR') {
    locale = 'en-GB'; // European formatting
  } else if (currency === 'GBP') {
    locale = 'en-GB'; // British formatting
  } else if (currency === 'JPY') {
    locale = 'ja-JP'; // Japanese formatting
  } else if (currency === 'CNY') {
    locale = 'zh-CN'; // Chinese formatting
  }
  
  return new Intl.NumberFormat(locale).format(num);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || '$';
}
