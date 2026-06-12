"use client";

import { useState, useCallback } from "react";

/**
 * Parse "HH:MM" to total minutes since midnight.
 */
function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Convert total minutes to "HH:MM".
 */
function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface UseTimePairOptions {
  initialStart?: string;
  initialEnd?: string;
}

interface UseTimePairResult {
  startTime: string;
  endTime: string;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
}

/**
 * Smart hook for start/end time pairs.
 *
 * Auto-fills endTime = startTime + 1h when:
 *   - endTime is empty, OR
 *   - endTime was exactly startTime + 1h (user hasn't manually changed it)
 *
 * startTime 23:30+ → endTime = 23:59 (no wrap).
 * Once the user manually edits endTime, auto-fill stops.
 */
export function useTimePair({
  initialStart = "10:00",
  initialEnd = "11:00",
}: UseTimePairOptions = {}): UseTimePairResult {
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const [userEditedEnd, setUserEditedEnd] = useState(false);

  const onStartChange = useCallback(
    (val: string) => {
      setStartTime(val);

      if (userEditedEnd) return;

      const startMin = parseTime(val);

      // If endTime is empty, always auto-fill
      if (!endTime) {
        if (startMin >= 23 * 60 + 30) {
          setEndTime("23:59");
        } else {
          setEndTime(minutesToTime(startMin + 60));
        }
        return;
      }

      // Check if endTime was exactly startTime + 1h
      const endMin = parseTime(endTime);
      if (endMin === startMin + 60 || endTime === minutesToTime(startMin + 60)) {
        // endTime was auto-generated, update it
        if (startMin >= 23 * 60 + 30) {
          setEndTime("23:59");
        } else {
          setEndTime(minutesToTime(startMin + 60));
        }
      }
    },
    [endTime, userEditedEnd]
  );

  const onEndChange = useCallback((val: string) => {
    setEndTime(val);
    setUserEditedEnd(true);
  }, []);

  return { startTime, endTime, onStartChange, onEndChange };
}