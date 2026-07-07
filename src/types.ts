export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface StudyGuide {
  summary: string;
  topics: string[];
  quiz: QuizQuestion[];
}

export interface Recommendation {
  title: string;
  href: string;
  body?: string;
}

export type Recommendations = Record<string, Recommendation[]>;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const CONTENT_TYPES = [
  'PDF Document',
  'YouTube Video',
  'Audio File',
  'Image',
  'ZIP Archive',
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export type TabId = 'guide' | 'quiz' | 'chat';

// Types that can be analyzed from a directly uploaded local file, in addition
// to a source URL. YouTube is a link by nature; ZIP stays URL-only for now.
export const UPLOADABLE_CONTENT_TYPES: ReadonlySet<ContentType> = new Set([
  'PDF Document',
  'Audio File',
  'Image',
]);

export const UPLOAD_ACCEPT: Partial<Record<ContentType, string>> = {
  'PDF Document': 'application/pdf,.pdf',
  'Audio File': 'audio/*',
  Image: 'image/*',
};
