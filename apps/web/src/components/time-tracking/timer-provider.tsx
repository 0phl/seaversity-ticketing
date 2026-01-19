"use client";

import { ActiveTimerBar } from "./active-timer-bar";

/**
 * Client-side wrapper for the active timer bar
 * Used in server components to render the timer bar
 */
export function TimerProvider() {
  return <ActiveTimerBar />;
}
