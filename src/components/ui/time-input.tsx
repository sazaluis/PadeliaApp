"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Parse "HH:MM" string to total minutes since midnight.
 */
function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Convert total minutes to "HH:MM" string with rollover (mod 1440).
 */
function minutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Round minutes to nearest 15-minute multiple.
 */
function roundTo15(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

export interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TimeInput({ value, onChange, disabled, className }: TimeInputProps) {
  const handleChange = (deltaMinutes: number) => {
    const rawMinutes = parseTime(value);
    const currentMinutes = roundTo15(rawMinutes);
    const newMinutes = currentMinutes + deltaMinutes;
    onChange(minutesToTime(newMinutes));
  };

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-1 rounded-md border border-input bg-background px-1",
        className ?? ""
      )}
    >
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex h-9 min-w-0 flex-1 border-0 bg-transparent px-1 py-1 text-center text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ WebkitAppearance: "none", MozAppearance: "textfield" }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => handleChange(15)}
        disabled={disabled}
        tabIndex={-1}
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => handleChange(-15)}
        disabled={disabled}
        tabIndex={-1}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

/**
 * Calculate end time by adding 1h30 to start time.
 * Kept for backward compatibility.
 */
export function addHourAndHalf(time: string): string {
  const minutes = parseTime(time);
  return minutesToTime(minutes + 90);
}