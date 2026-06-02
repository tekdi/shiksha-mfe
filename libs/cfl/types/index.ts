export interface Trainer {
  id: string;
  name: string;
  avatarUrl?: string;
  currentLevel: string;
  location: string;
  progress: number; // overall percentage
  courses: CourseStats[];
}

export interface CourseStats {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'locked';
  completionPercentage?: number;
  completionCount: number;
  totalCount: number;
}

export interface CourseProgress {
  id: string;
  name: string;
  levels: LevelProgress[];
}

export interface LevelProgress {
  name: string;
  status: 'completed' | 'in-progress' | 'locked';
  modules: ModuleProgress[];
}

export interface ModuleProgress {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'locked';
  completionCount: number;
  totalCount: number;
  subtopics: SubtopicProgress[];
}

export interface SubtopicProgress {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'locked';
  completionCount: number;
  totalCount: number;
  lessons: LessonProgress[];
}

export interface LessonProgress {
  id: string;
  name: string;
  type: 'lesson' | 'quiz';
  status: 'completed' | 'in-progress' | 'locked';
}

export interface AlertFeedback {
  trainerId: string;
  actionType: 'feedback' | 'di';
  message: string;
}
