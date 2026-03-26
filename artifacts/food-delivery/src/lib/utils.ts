import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

export function getCuisineEmoji(cuisine: string): string {
  const map: Record<string, string> = {
    'American': '🍔',
    'Japanese': '🍣',
    'Italian': '🍕',
    'Indian': '🍛',
    'Mexican': '🌮',
    'Chinese': '🥢',
    'Thai': '🍜',
    'Korean': '🍱',
    'Healthy': '🥗',
    'Dessert': '🍦',
    'Cafe': '☕',
    'Fast Food': '🍟'
  };
  return map[cuisine] || '🍽️';
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'out_for_delivery': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
