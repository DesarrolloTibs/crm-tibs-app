export interface Reminder {
  id: string;
  title: string;
  date: string; // Usamos string para mantener el formato ISO 8601
  opportunity_id: string;
}