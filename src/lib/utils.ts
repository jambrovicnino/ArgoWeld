import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("sl-SI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("sl-SI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(firstName: string, lastName: string): string {
  return ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase();
}

export function daysUntilExpiry(
  dateStr: string | null | undefined
): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function validityColor(days: number | null): string {
  if (days === null) return "text-gray-400";
  if (days < 0) return "text-red-600";
  if (days <= 30) return "text-red-500";
  if (days <= 90) return "text-amber-500";
  return "text-emerald-600";
}

export function validityBg(days: number | null): string {
  if (days === null) return "bg-gray-100";
  if (days < 0) return "bg-red-50";
  if (days <= 30) return "bg-red-50";
  if (days <= 90) return "bg-amber-50";
  return "bg-emerald-50";
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export function totalBudget(b: {
  delo: number;
  transport: number;
  nastanitev: number;
  orodje: number;
  dnevnice: number;
  drugo: number;
}): number {
  return (
    b.delo + b.transport + b.nastanitev + b.orodje + b.dnevnice + b.drugo
  );
}
