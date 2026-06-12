"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}

export function TimeInput({ value, onChange, id, className }: TimeInputProps) {
  const handleChange = (deltaMinutes: number) => {
    const currentMinutes = parseTime(value);
    const newMinutes = currentMinutes + deltaMinutes;
    onChange(minutesToTime(newMinutes));
  };

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="flex flex-col">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => handleChange(15)}
          tabIndex={-1}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => handleChange(-15)}
          tabIndex={-1}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Calculate end time by adding 1h30 to start time.
 */
export function addHourAndHalf(time: string): string {
  const minutes = parseTime(time);
  return minutesToTime(minutes + 90);
}