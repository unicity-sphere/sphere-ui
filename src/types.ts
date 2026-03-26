/** Shared types for quest/track/achievement forms */

export interface QuestData {
  _id?: string;
  title: string;
  description: string;
  points: number;
  projectPoints?: number;
  tags: string[];
  platform: string | null;
  action: string;
  actionConfig: Record<string, unknown>;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  maxCompletions?: number | null;
  sortOrder?: number;
  imageUrl?: string | null;
  backgroundUrl?: string | null;
  trackId?: string | null;
  isRepeatable?: boolean;
  repeatInterval?: string | null;
  prerequisites?: string[];
  unlockRules?: unknown[];
  questType?: string;
  verificationType?: string;
  autoApproveAfterHours?: number | null;
  chains?: Record<string, number>;
  [key: string]: unknown;
}

export interface TrackData {
  _id?: string;
  title: string;
  description: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  sortOrder?: number;
  imageUrl?: string | null;
  accentHex?: string | null;
  glowColor?: string | null;
  borderColor?: string | null;
  gradient?: string | null;
  coreColor?: string | null;
  [key: string]: unknown;
}

export interface AchievementData {
  _id?: string;
  title: string;
  description: string;
  points: number;
  source: string;
  dataSource: string;
  action: string;
  actionConfig: Record<string, unknown>;
  target: number;
  status: string;
  trackId?: string | null;
  imageUrl?: string | null;
  backgroundUrl?: string | null;
  sortOrder?: number;
  chains?: Record<string, number>;
  [key: string]: unknown;
}

/** API callbacks injected by consumers */
export interface QuestFormApi {
  createQuest: (data: Record<string, unknown>) => Promise<unknown>;
  updateQuest: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  createTrack: (data: Record<string, unknown>) => Promise<unknown>;
  getExternalApis?: () => Promise<{ _id: string; name: string; slug: string }[]>;
}

export interface TrackFormApi {
  createTrack: (data: Record<string, unknown>) => Promise<unknown>;
  updateTrack: (id: string, data: Record<string, unknown>) => Promise<unknown>;
}

export interface AchievementFormApi {
  createAchievement: (data: Record<string, unknown>) => Promise<unknown>;
  updateAchievement: (id: string, data: Record<string, unknown>) => Promise<unknown>;
}

/** Query key factory — consumers provide their own prefix */
export interface QueryKeys {
  quests: readonly unknown[];
  tracks: readonly unknown[];
  achievements: readonly unknown[];
}
