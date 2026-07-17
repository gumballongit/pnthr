export interface User {
  username: string;
  credits: number;
  isSubscribed: boolean;
}

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  preview_url?: string;
  labels?: Record<string, string>;
}

export interface AudioHistoryItem {
  id: string;
  text: string;
  voiceName: string;
  url: string;
  timestamp: number;
}
