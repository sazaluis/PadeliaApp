"use client";

import { useState, useCallback, useRef } from "react";

/**
 * Add minutes to a "HH:mm" string, clipping at 23:59.
 */
export function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const clipped = Math.min(total, 23 * 60 + 59);
  return `${String(Math.floor(clipped / 60)).padStart(2, "0")}:${String(clipped % 60).padStart(2, "0")}`;
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
 * When onStartChange is called:
 *   1. Updates startTime to the new value.
 *   2. If endTouchedByUser.current === false: calculates endTime = newStart + 90 min.
 *   3. If newStart >= "22:30": endTime = "23:59".
 *
 * endTouchedByUser is a useRef(false):
 *   - Set to true when onEndChange is called directly by the user.
 *   - Set to false when the system auto-updates endTime.
 */
export function useTimePair({
  initialStart = "10:00",
  initialEnd = "11:30",
}: UseTimePairOptions = {}): UseTimePairResult {
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const endTouchedByUser = useRef(false);

  const onStartChange = useCallback((val: string) => {
    setStartTime(val);

    if (endTouchedByUser.current) return;

    let autoEnd: string;
    if (val >= "22:30") {
      autoEnd = "23:59";
    } else {
      autoEnd = addMinutes(val, 90);
    }

    setEndTime(autoEnd);
    endTouchedByUser.current = false;
  }, []);

  const onEndChange = useCallback((val: string) => {
    setEndTime(val);
    endTouchedByUser.current = true;
  }, []);

  return { startTime, endTime, onStartChange, onEndChange };
}