
import { Course, User, UserRole, Lesson, Module, Comment } from '../types';

// Default Placeholder Avatar
export const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

// Empty initial state - Application will fetch from Supabase
export let MOCK_COURSES: Course[] = [];

// Helper to get course by ID (now purely a utility for local state if needed)
export const getCourseById = (courses: Course[], id: string): Course | undefined => {
  return courses.find(c => c.id === id);
};

export const getFirstLesson = (course: Course): Lesson | null => {
  if (course.modules && course.modules.length > 0 && course.modules[0].lessons.length > 0) {
    return course.modules[0].lessons[0];
  }
  return null;
};

// Comments service placeholder - ideally moves to Supabase too
let LOCAL_COMMENTS: Comment[] = [];

export const CommentService = {
  getCommentsByLesson: (lessonId: string) => {
    return LOCAL_COMMENTS.filter(c => c.lessonId === lessonId);
  },
  getAllComments: () => {
    return LOCAL_COMMENTS;
  },
  addComment: (comment: Comment) => {
    LOCAL_COMMENTS = [...LOCAL_COMMENTS, comment];
  },
  updateCommentStatus: (id: string, status: 'approved' | 'rejected') => {
    LOCAL_COMMENTS = LOCAL_COMMENTS.map(c => c.id === id ? { ...c, status } : c);
  },
  toggleLike: (commentId: string, userId: string) => {
    LOCAL_COMMENTS = LOCAL_COMMENTS.map(c => {
      if (c.id === commentId) {
        const hasLiked = c.likedBy.includes(userId);
        return {
          ...c,
          likes: hasLiked ? c.likes - 1 : c.likes + 1,
          likedBy: hasLiked ? c.likedBy.filter(id => id !== userId) : [...c.likedBy, userId]
        };
      }
      return c;
    });
  }
};
