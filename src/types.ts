
export type Department = 'Aerospace Engineering' | 'Agricultural Engineering' | 'Anatomy' | 'Biology' | 'Biomedical Engineering' | 'Chemical Engineering' | 'Chemistry' | 'Civil Engineering' | 'Computer Engineering' | 'Computer Science' | 'Dentistry' | 'Electrical Engineering' | 'Material Science and Engineering' | 'Mathematics' | 'Mechanical Engineering' | 'Mechatronics Engineering' | 'Medical Laboratory Science' | 'Medicine and Surgery' | 'Nursing Science' | 'Petroleum Engineering' | 'Pharmacy' | 'Physics' | 'Physiology' | 'Public Health' | 'Software Engineering' | 'General Studies' | 'General Engineering Training' | 'Zoology' | 'Statistics';
export type Subject = 'Mathematics' | 'Statistics' | 'Biology' | 'Physics' | 'Chemistry' | 'Computer Science' | 'General Studies' | 'Engineering' | 'Zoology';
export type Level = '100' | '200' | '300' | '400' | '500' | '600';
export type Semester = '1st Semester' | '2nd Semester';

export type CourseId = 'MTH101' | 'MTH102' | 'MTH103' | 'STA112' | 'BIO101' | 'BIO102' | 'BIO107' | 'BIO108' | 'PHY101' | 'PHY102' | 'PHY103' | 'PHY104' | 'PHY107' | 'PHY108' | 'CHM101' | 'CHM102' | 'CHM107' | 'CHM108' | 'COS101' | 'COS102' | 'GST111' | 'GST112' | 'GET101' | 'GET102' | 'ZOO101' | 'ZOO102' | 'MAT201' | 'MAT202' | 'STA201' | 'PHY201' | 'CHM201';

export type CourseScope = 'GLOBAL' | 'FACULTY' | 'DEPARTMENT';

export interface Course {
  id: CourseId;
  title: string;
  description: string;
  syllabus: Module[];
  formulas?: Formula[];
  department: Department;
  objectives?: string[];
  departments?: Department[];
  faculties?: string[];
  scope?: CourseScope;
  level?: Level;
  semester?: Semester;
  deleted?: boolean;
  deletedAt?: string;
}

export type View = 'hub' | 'dashboard' | 'study' | 'past-questions' | 'quizzes' | 'module-topics' | 'course-syllabus' | 'mastery' | 'formulas' | 'ai-tutor' | 'notebook' | 'profile' | 'help-support' | 'admin-support' | 'admin-dashboard' | 'pricing' | 'flashcards' | 'arena' | 'concept-map' | 'study-plan';

export interface Assignment {
  id: string;
  courseId: CourseId;
  title: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: number;
}

export interface Flashcard {
  id: string;
  front: string; // Question or concept
  back: string; // Answer or explanation
  moduleId: string;
  subTopicId?: string;
}

export interface SRSData {
  cardId: string;
  interval: number; // Days until next review
  repetition: number; // Number of times reviewed
  efactor: number; // Easiness factor
  nextReviewDate: string; // ISO date string
}

export type AIPersonality = 'encouraging' | 'strict' | 'socratic' | 'humorous' | 'master' | 'debate';

export interface TimetableEntry {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  courseId: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'other';
}

export interface ExamDate {
  id: string;
  courseId: string;
  date: string; // ISO date
  time?: string;
}

export interface StudySession {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'prime' | 'consolidation' | 'deep_work' | 'review';
  courseId: string;
  moduleId?: string;
  status: 'pending' | 'completed' | 'missed';
}

export interface StudyPlan {
  id: string;
  userId: string;
  timetable: TimetableEntry[];
  exams: ExamDate[];
  sessions: StudySession[];
  lastGenerated: string;
}

export type PlanType = 'free' | 'exam_cram' | 'scholar' | 'semester';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'student' | 'admin' | 'tutor' | 'moderator';
  plan_type: PlanType;
  subscription_end_date?: string;
  created_at?: string;
  themeColor?: string;
  rank?: number;
  admin_pin_verified_until?: any;
  department?: string;
  faculty?: string;
  academic_level?: string;
  semester?: string;
}

export interface LearningProfile {
  strengths: string[];
  weaknesses: string[];
  lastUpdated: string;
}

export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  lastStudyDate: string | null;
  mastery: Record<string, number>; // topicId -> mastery percentage (0-100)
  achievements: Achievement[];
  studyTime: Record<string, number>; // topicId -> seconds spent
  topicLastStudied: Record<string, string>; // topicId -> ISO date string
  bookmarks: Bookmark[];
  enrolledCourses: CourseId[];
  assignments: Assignment[];
  srsData?: Record<string, SRSData>; // cardId -> SRSData
  aiPersonality?: AIPersonality;
  learningProfile?: LearningProfile;
}

export interface Bookmark {
  id: string;
  type: 'formula' | 'question';
  content: any; // Formula or QuizQuestion
  timestamp: string;
  note?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
}

export interface Formula {
  id: string;
  title: string;
  latex: string;
  description: string;
  category: string;
}

export interface SubTopic {
  id: string;
  title: string;
  content: string;
  relatedTo?: string[];
}

export interface Module {
  id: string;
  title: string;
  subTopics: SubTopic[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
  sources?: { title: string; uri: string }[];
  pdfContent?: string;
}

export type QuestionType = 'multiple-choice' | 'fill-in-the-blank';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
  explanation: string;
  hint: string;
  difficulty?: number; // 1 to 5
}

export interface Quiz {
  moduleId: string;
  questions: QuizQuestion[];
}

export interface BattlePlayer {
  uid: string;
  name: string;
  avatar: string;
  score: number;
  currentQuestionIndex: number;
  health: number; // 0-100
  status: 'ready' | 'playing' | 'finished';
}

export interface Battle {
  id: string;
  status: 'waiting' | 'active' | 'finished';
  player1: BattlePlayer;
  player2: BattlePlayer | null;
  questions: QuizQuestion[];
  winner: string | null; // uid or 'draw'
  createdAt: string;
  topicId: string; // e.g., 'MAT101'
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL: string;
  xp: number;
  rank: number;
  streak: number;
}

export interface Curriculum {
  id: string; // DEPT_LEVEL_SEM
  department: Department;
  level: Level;
  semester: Semester;
  courseIds: CourseId[];
  lastUpdated: string;
  updatedBy: string;
}

export type PipelineMetadata = Record<string, any>;
