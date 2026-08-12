// types/planner.ts

export interface PlannerEvent {
  id: string;
  title: string;
  type: 'class' | 'event' | 'reminder' | 'task';  // adjust as needed
  date: string;         // ISO date
  startTime?: string;   // HH:mm
  endTime?: string;
  location?: string;
}

export interface TodayPlanner {
  date: string;
  events: PlannerEvent[];
}

export interface WeeklyPlanner {
  weekStart: string;
  weekEnd: string;
  days: {
    date: string;
    events: PlannerEvent[];
  }[];
}