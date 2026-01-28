export interface FriendSummary {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface DayAvailability {
  date: string;   // ISO date string
  isUp: boolean;  // true if friend is up (GENERAL or SPECIFIC) on that day
}

export interface TimelineFriend {
  id: string;
  name: string;
  avatarUrl?: string | null;
  days: DayAvailability[];
}

export interface CalendarTimelineResponse {
  start: string;             // ISO date string for the first day in timeline
  friends: TimelineFriend[]; // timeline grid data
}
