import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Activity colors for bar charts
const activityColors = [
  "hsl(222, 80%, 60%)",
  "hsl(280, 70%, 60%)",
  "hsl(330, 70%, 60%)",
  "hsl(170, 70%, 60%)",
  "hsl(140, 70%, 60%)",
]

export function getActivityColor(index: number): string {
  return activityColors[index % activityColors.length]
}

// Project colors with opacity variants
export function getProjectColor(index: number, opacity: number = 1): string {
  const baseColors = [
    "222 80% 60%", // Blue
    "280 70% 60%", // Purple
    "330 70% 60%", // Pink
    "170 70% 60%", // Teal
    "140 70% 60%", // Green
    "50 80% 60%",  // Yellow
    "25 80% 60%",  // Orange
    "0 80% 60%",   // Red
  ]
  const hsl = baseColors[index % baseColors.length]
  return `hsl(${hsl} / ${opacity})`
}
