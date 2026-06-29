export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string | null;
  read: boolean;
  createdAt: string;
}
