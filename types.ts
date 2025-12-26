
export enum UserRole {
  STUDENT = 'STUDENT',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string; // URL or base64
  role: UserRole;
  status: 'active' | 'inactive';
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  siteName: string;
}

export type BlockType = 'hero_banner' | 'content_list';

export type DisplayStyle = 'carousel'; // Grid removed as per request
export type AspectRatio = 'video' | 'portrait' | 'square'; // 16:9, 3:4, 1:1

export interface BlockContent {
  title?: string;
  description?: string;
  imageUrl?: string; // For Hero
  showCta?: boolean; // New field to toggle CTA
  ctaText?: string; // For Hero
  ctaLink?: string; // For Hero
  
  // Content List Specifics
  sourceType?: 'all_courses' | 'specific_courses' | 'specific_module';
  selectedIds?: string[]; // IDs of courses or modules to show
  displayStyle?: DisplayStyle;
  aspectRatio?: AspectRatio;
}

export interface PageBlock {
  id: string;
  type: BlockType;
  content: BlockContent;
}

export type VideoProvider = 'youtube' | 'vimeo' | 'panda' | 'embed_url';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string; // Base64 or URL
  size?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string; // Rich Text
  duration: number; // in minutes (auto-calculated or default)
  
  // Content Types
  type: 'video' | 'text' | 'quiz';
  
  // Video Specific
  videoUrl?: string; // The final embed source URL
  provider?: VideoProvider; // The selected provider
  
  // Text Specific
  textContent?: string; // HTML/Rich text content

  // Common
  thumbnail: string;
  attachments: Attachment[]; // Supplementary materials
  
  // Progress
  isCompleted: boolean;
  progress: number; // 0-100
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  bannerImage: string;
  author: string;
  modules: Module[];
  totalDuration: number; // minutes
  progress: number; // 0-100
  tags: string[];
}

export type CommentStatus = 'pending' | 'approved' | 'rejected';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lessonId: string;
  text: string;
  timestamp: string; // ISO string
  status: CommentStatus;
  parentId?: string; // For threads
  likes: number;
  likedBy: string[]; // User IDs
}

// Navigation Types
export type ViewState = 'LOGIN' | 'HOME' | 'COURSE_DETAIL' | 'PLAYER' | 'ADMIN_DASHBOARD' | 'BUILDER' | 'USERS' | 'MY_PROFILE' | 'MODERATION' | 'INTEGRATIONS';

export interface NavContext {
  view: ViewState;
  activeCourseId?: string;
  activeLessonId?: string;
}
