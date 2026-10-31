export type DocumentKind = 'memo' | 'email' | 'report' | 'expense' | 'calls' | 'calendar' | 'spreadsheet' | 'letter';
export interface Cell { value: string; comment?: string; clue?: boolean }
export interface Sheet { name: string; columns: string[]; rows: Cell[][]; hiddenRows?: number[] }
export interface ArchiveDocument {
  id: number; title: string; kind: DocumentKind; author: string; date: string;
  subject: string; pages: string[]; sheets?: Sheet[]; annotation?: string;
  story?: string; chapter?: number; evidence?: string; next?: number; fragment?: boolean;
}
export interface StoryChapter { title: string; kind?: DocumentKind; text: string; evidence: string; sheet?: Sheet }
export interface Story { id: string; title: string; description: string; chapters: StoryChapter[]; ending: string; reward: number }
export type UpgradeId = 'drawers' | 'browsing' | 'summaries' | 'bookmarks' | 'highlighter' | 'index';
export interface Settings { sensitivity: number; volume: number; textSize: number; quality: 'low' | 'medium' | 'high'; reducedMotion: boolean }
export interface Save {
  version: 1; seed: number; target: number; started: boolean; completed: boolean;
  position: [number, number, number]; rotation: [number, number];
  inspected: number[]; searched: number[]; bookmarks: number[]; clues: number[];
  claimedStories: string[]; claimedMilestones: number[]; credits: number;
  upgrades: UpgradeId[]; hintLevel: number; selectedFile: number | null;
  selectedPhrase: string; messages: string[]; settings: Settings; playSeconds: number;
}
