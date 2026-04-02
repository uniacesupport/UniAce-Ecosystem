import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import ContentArea from './components/ContentArea';
import ChatBot from './components/ChatBot';
import Dashboard from './components/Dashboard';
import QuizHub from './components/QuizHub';
import FlashcardHub from './components/FlashcardHub';
import PastQuestions from './components/PastQuestions';
import ModuleTopics from './components/ModuleTopics';
import CourseSyllabus from './components/CourseSyllabus';
import MasteryCenter from './components/MasteryCenter';
import FormulaReference from './components/FormulaReference';
import CourseHub from './components/CourseHub';
import Notebook from './components/Notebook';
import PricingPage from './components/PricingPage';
import UserProfile from './components/UserProfile';
import HelpSupport from './components/HelpSupport';
import AdminSupport from './components/AdminSupport';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import Arena from './components/Arena';
import ConceptMap from './components/ConceptMap';
import StudyPlan from './components/StudyPlan';
import FirebaseSetup from './components/FirebaseSetup';
import LandingPage from './components/LandingPage';
import PushNotificationPrompt from './components/PushNotificationPrompt';
import GlobalNotification from './components/GlobalNotification';
import PaywallManager from './components/PaywallManager';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Calculator from './components/Calculator';
import VoiceTutor from './components/VoiceTutor';
import AcademicProfileModal from './components/AcademicProfileModal';
import { CalculatorProvider, useCalculator } from './context/CalculatorContext';
import { useUserProgress } from './hooks/useUserProgress';
import { useAuth } from './context/AuthContext';
import { useCourses } from './context/CourseContext';
import { Menu, Mic } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { View, ChatMessage, CourseId, Department, Semester } from './types';
import { generateModuleContent, generateCourseSkeleton } from './services/aiCourseGenerator';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from './lib/store';

const queryClient = new QueryClient();

export default function App() {
  console.log('App.tsx: Rendering...');
  return (
    <QueryClientProvider client={queryClient}>
      <CalculatorProvider>
        <AppContent />
      </CalculatorProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { isConfigured, user, profile, loading, signInWithGoogle } = useAuth();
  const { theme } = useAppStore();
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  const { courses, refreshCourses } = useCourses();
  const { progress, addXp, updateMastery, recordStudyTime, addBookmark, removeBookmark, enrollCourse, unenrollCourse, updateAIPersonality, isOnline, checkAndUpdateStreak } = useUserProgress();
  const [activeCourseId, setActiveCourseId] = useState<CourseId | null>(null);
  const [activeView, setActiveView] = useState<View>('hub');
  const [activeDepartment, setActiveDepartment] = useState<Department>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeDepartment');
      if (saved) return saved as Department;
    }
    return 'Mathematics';
  });

  const [activeSemester, setActiveSemester] = useState<Semester>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeSemester');
      if (saved) return saved as Semester;
    }
    return '1st Semester';
  });

  useEffect(() => {
    if (profile?.department) {
      setActiveDepartment(profile.department as Department);
      localStorage.setItem('activeDepartment', profile.department);
    }
  }, [profile?.department]);

  useEffect(() => {
    if (profile?.semester) {
      setActiveSemester(profile.semester as Semester);
      localStorage.setItem('activeSemester', profile.semester);
    }
  }, [profile?.semester]);
  
  const activeCourse = activeCourseId ? courses[activeCourseId] : null;

  useEffect(() => {
    if (user) {
      checkAndUpdateStreak();
    }
  }, [user]);
  const syllabus = activeCourse?.syllabus || [];

  const [activeModuleId, setActiveModuleId] = useState('');
  const [activeSubTopicId, setActiveSubTopicId] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [autoStartQuiz, setAutoStartQuiz] = useState(false);
  const [regenerationProgress, setRegenerationProgress] = useState(0);
  const [regenerationStatus, setRegenerationStatus] = useState('');
  const { isCalculatorOpen, setIsCalculatorOpen } = useCalculator();
  const [isVoiceTutorOpen, setIsVoiceTutorOpen] = useState(false);
  const [activePdfText, setActivePdfText] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    const handleCustomNavigate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        handleViewSelect(customEvent.detail);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('navigate', handleCustomNavigate);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('navigate', handleCustomNavigate);
    };
  }, []);

  const activeModule = syllabus.find(m => m.id === activeModuleId) || syllabus[0];
  const activeSubTopicContent = activeModule?.subTopics.find(s => s.id === activeSubTopicId)?.content;

  const handleCourseSelect = (id: CourseId) => {
    setActiveCourseId(id);
    const course = courses[id];
    setActiveModuleId(course.syllabus[0].id);
    setActiveSubTopicId(course.syllabus[0].subTopics[0].id);
    setActiveView('course-syllabus');
  };

  const handleModuleSelect = (id: string) => {
    setActiveModuleId(id);
    setActiveView('module-topics');
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleSubTopicSelect = (subTopicId: string) => {
    setActiveSubTopicId(subTopicId);
    setActiveView('study');
    setAutoStartQuiz(false);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleTakeQuiz = (subTopicId: string) => {
    setActiveSubTopicId(subTopicId);
    setActiveView('study');
    setAutoStartQuiz(true);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleViewSelect = (view: View) => {
    setActiveView(view);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    // Check backend connectivity on mount
    fetch('/api/debug')
      .then(res => res.json())
      .then(data => console.log('Backend connectivity check:', data))
      .catch(err => console.error('Backend connectivity check failed:', err));
  }, []);

  useEffect(() => {
    if (user && chatMessages.length === 0) {
      user.getIdToken().then(token => {
        fetch('/api/chat/nudge', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data.message) {
            setChatMessages([{
              role: 'model',
              text: data.message
            }]);
          }
        })
        .catch(err => console.error('Failed to fetch nudge:', err));
      });
    }
  }, [user]);

  if (!isConfigured) {
    return <FirebaseSetup />;
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    if (window.location.pathname === '/admin/login' || window.location.pathname === '/admin/dashboard') {
      return <AdminLogin requireGoogleLogin={true} />;
    }
    return <LandingPage />;
  }

  if (window.location.pathname === '/admin/login') {
    const isAdmin = profile?.role === 'admin' || user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';
    if (!isAdmin) {
      window.location.href = '/';
      return null;
    }
    
    const verifiedUntil = profile?.admin_pin_verified_until;
    const isVerified = verifiedUntil && new Date(verifiedUntil.toDate ? verifiedUntil.toDate() : verifiedUntil).getTime() > Date.now();
    
    if (isVerified) {
      window.location.href = '/admin/dashboard';
      return null;
    }
    
    return <AdminLogin />;
  }

  if (window.location.pathname === '/admin/dashboard') {
    const isAdmin = profile?.role === 'admin' || user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';
    if (!isAdmin) {
      window.location.href = '/';
      return null;
    }
    
    // Check if PIN verified recently (within last 2 hours)
    const verifiedUntil = profile?.admin_pin_verified_until;
    const isVerified = verifiedUntil && new Date(verifiedUntil.toDate ? verifiedUntil.toDate() : verifiedUntil).getTime() > Date.now();
    
    if (!isVerified) {
      window.location.href = '/admin/login';
      return null;
    }

    return <AdminDashboard />;
  }

  const needsAcademicProfile = user && profile && (!profile.department || !profile.academic_level || !profile.semester);

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-zinc-950 font-sans overflow-hidden relative transition-colors duration-300">
      {needsAcademicProfile && <AcademicProfileModal />}
      {user && (
        <PaywallManager onUpgrade={() => setActiveView('pricing')} />
      )}
      {/* Sidebar Navigation (Desktop) */}
      <Sidebar 
        activeModuleId={activeModuleId} 
        onModuleSelect={(id) => {
          setActiveModuleId(id);
          setActiveView('study');
          const module = syllabus.find(m => m.id === id);
          if (module) setActiveSubTopicId(module.subTopics[0].id);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }} 
        activeView={activeView}
        onViewSelect={handleViewSelect}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        progress={progress}
        activeCourseId={activeCourseId}
        syllabus={syllabus}
        isOnline={isOnline}
        onToggleCalculator={() => setIsCalculatorOpen(!isCalculatorOpen)}
      />

      <AnimatePresence>
        {isCalculatorOpen && (
          <Calculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col h-full overflow-y-auto relative ${activeView === 'ai-tutor' ? '' : 'pb-16 lg:pb-0'}`}>
        {/* Toggle Button for Sidebar (Visible when sidebar is closed on Desktop) */}
        {!isSidebarOpen && activeView !== 'study' && (
          <div className="hidden lg:block absolute top-4 left-4 z-40">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600 hover:text-slate-900 transition-all hover:scale-105 active:scale-95"
            >
              <Menu size={20} />
            </button>
          </div>
        )}

        {/* View Switcher */}
        {activeView === 'hub' && (
          <CourseHub 
            onSelectCourse={handleCourseSelect} 
            onProfileClick={() => setActiveView('profile')}
            onViewSelect={handleViewSelect}
            enrolledCourses={progress.enrolledCourses || []}
            progress={progress}
            activeSemester={activeSemester}
            setActiveSemester={setActiveSemester}
          />
        )}

        {activeView === 'dashboard' && (
          <Dashboard 
            activeDepartment={activeDepartment}
            activeSemester={activeSemester}
            setActiveSemester={setActiveSemester}
            onModuleSelect={handleModuleSelect} 
            onSubTopicSelect={handleSubTopicSelect}
            onViewSelect={handleViewSelect}
            onProfileClick={() => setActiveView('profile')}
            onCourseSelect={handleCourseSelect}
            progress={progress}
            activeCourseId={activeCourseId}
            syllabus={syllabus}
            onToggleCalculator={() => setIsCalculatorOpen(!isCalculatorOpen)}
          />
        )}

        {activeView === 'profile' && (
          <UserProfile 
            onBack={() => setActiveView(activeCourseId ? 'dashboard' : 'hub')}
            onNavigate={handleViewSelect}
          />
        )}

        {activeView === 'course-syllabus' && (
          <CourseSyllabus 
            onModuleSelect={handleModuleSelect}
            onBack={() => setActiveView('dashboard')}
            onViewSelect={handleViewSelect}
            activeCourseId={activeCourseId}
            syllabus={syllabus}
            isEnrolled={activeCourseId ? (progress.enrolledCourses || []).includes(activeCourseId) : false}
            onEnroll={() => {
              if (activeCourseId && activeCourse) {
                enrollCourse(activeCourseId, activeCourse.title, activeCourse.description);
              }
            }}
            onUnenroll={() => {
              if (activeCourseId) {
                unenrollCourse(activeCourseId);
                setActiveCourseId(null);
                setActiveView('hub');
              }
            }}
            onRegenerate={async () => {
              if (!activeCourseId || !activeCourse || regenerationProgress > 0) return;
              
              setRegenerationProgress(5);
              setRegenerationStatus("Scanning structure...");

              try {
                // 1. Generate full skeleton (10 modules)
                const existingTitlesForAI = syllabus.map(m => m.title);
                const fullSkeleton = await generateCourseSkeleton(activeCourse.title, activeCourse.description, undefined, 'mistral', existingTitlesForAI);
                setRegenerationProgress(15);
                
                // 2. Identify tasks: New modules or Repairs
                const tasks: { type: 'new' | 'repair', skeleton: any, id?: string }[] = [];
                const existingTitles = syllabus.map(m => m.title.toLowerCase().trim());
                
                // Check each module from the new skeleton
                fullSkeleton.modules.forEach((moduleSkeleton: any) => {
                  const title = moduleSkeleton.title.toLowerCase().trim();
                  const existing = syllabus.find(m => m.title.toLowerCase().trim() === title);
                  
                  if (!existing) {
                    tasks.push({ type: 'new', skeleton: moduleSkeleton });
                  } else {
                    // Check if existing module needs repair (missing content)
                    const isIncomplete = existing.subTopics.some(st => !st.content || st.content.trim() === '');
                    if (isIncomplete) {
                      tasks.push({ type: 'repair', skeleton: moduleSkeleton, id: existing.id });
                    }
                  }
                });

                if (tasks.length === 0) {
                  setRegenerationProgress(100);
                  setRegenerationStatus("Syllabus is already complete and healthy!");
                  setTimeout(() => {
                    setRegenerationProgress(0);
                    setRegenerationStatus("");
                  }, 3000);
                  return;
                }

                const totalTasks = tasks.length;
                let completedTasks = 0;

                setRegenerationStatus(`Processing ${totalTasks} updates...`);

                const { db } = await import('./firebase');
                const { doc, setDoc, collection, getDocs } = await import('firebase/firestore');

                for (const task of tasks) {
                  try {
                    const isNew = task.type === 'new';
                    setRegenerationStatus(`${isNew ? 'Generating' : 'Repairing'}: ${task.skeleton.title}`);
                    
                    const regeneratedModule = await generateModuleContent(activeCourse.title, task.skeleton, 'gemini', (msg) => console.log(msg));
                    
                    if (isNew) {
                      // Add new module document with a fresh ID
                      // We calculate the next ID based on current count
                      const newModuleId = `m${syllabus.length + completedTasks + 1}`;
                      await setDoc(doc(db, `courses/${activeCourseId}/modules`, newModuleId), {
                        ...regeneratedModule,
                        createdAt: new Date().toISOString()
                      });
                    } else if (task.id) {
                      // Update existing module
                      await setDoc(doc(db, `courses/${activeCourseId}/modules`, task.id), {
                        ...regeneratedModule,
                        updatedAt: new Date().toISOString()
                      }, { merge: true });
                    }
                    
                    completedTasks++;
                    setRegenerationProgress(15 + (completedTasks / totalTasks) * 80);
                  } catch (error) {
                    console.error(`Failed to process task for ${task.skeleton.title}:`, error);
                  }
                }
                
                setRegenerationProgress(100);
                setRegenerationStatus("All tasks complete!");
                refreshCourses();
                
                setTimeout(() => {
                  setRegenerationProgress(0);
                  setRegenerationStatus("");
                }, 5000);

              } catch (error) {
                console.error("Regeneration failed:", error);
                setRegenerationStatus("Error occurred");
                setRegenerationProgress(0);
              }
            }}
            regenerationProgress={regenerationProgress}
            regenerationStatus={regenerationStatus}
          />
        )}

        {activeView === 'module-topics' && activeModule && (
          <ModuleTopics 
            module={activeModule}
            onBack={() => setActiveView('course-syllabus')}
            onSubTopicSelect={handleSubTopicSelect}
            onTakeQuiz={handleTakeQuiz}
            onOpenChat={() => setActiveView('ai-tutor')}
            progress={progress}
          />
        )}
        
        {activeView === 'study' && (
          <ContentArea 
            courseId={activeCourseId}
            courseTitle={activeCourse?.title || 'Course'}
            module={activeModule}
            activeSubTopicId={activeSubTopicId}
            onSubTopicSelect={handleSubTopicSelect}
            onBackToSyllabus={() => setActiveView('module-topics')}
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onQuizComplete={(topicId, score) => {
              updateMastery(topicId, score);
              addXp(score * 2); // 2 XP per percentage point
            }}
            onQuickCheckComplete={(topicId) => {
              addXp(20); // Bonus XP for quick check
              updateMastery(topicId, 100); // Mark as mastered if correct
            }}
            autoStartQuiz={autoStartQuiz}
            onViewSelect={handleViewSelect}
            progress={progress}
            onToggleCalculator={() => setIsCalculatorOpen(!isCalculatorOpen)}
          />
        )}

        {activeView === 'quizzes' && (
          <QuizHub 
            courseId={activeCourseId || undefined}
            onQuizComplete={(topicId, score) => {
              updateMastery(topicId, score);
              addXp(score * 2);
            }}
            syllabus={syllabus}
          />
        )}

        {activeView === 'flashcards' && (
          <FlashcardHub syllabus={syllabus} />
        )}

        {activeView === 'past-questions' && (
          <PastQuestions activeCourseId={activeCourseId} />
        )}

        {activeView === 'mastery' && (
          <MasteryCenter 
            progress={progress}
            onBack={() => setActiveView('dashboard')}
            activeCourseId={activeCourseId}
            syllabus={syllabus}
          />
        )}

        {activeView === 'notebook' && (
          <Notebook 
            bookmarks={progress.bookmarks}
            onRemoveBookmark={removeBookmark}
          />
        )}

        {activeView === 'formulas' && (
          <FormulaReference 
            onBack={() => setActiveView('dashboard')}
            activeCourseId={activeCourseId}
            formulas={activeCourse?.formulas || []}
            onBookmark={(item) => addBookmark(item, 'formula')}
          />
        )}

        {activeView === 'pricing' && (
          <PricingPage />
        )}

        {activeView === 'help-support' && (
          <HelpSupport 
            onBack={() => setActiveView('profile')}
          />
        )}

        {activeView === 'admin-support' && (
          <AdminSupport 
            onBack={() => setActiveView('profile')}
          />
        )}

        {activeView === 'arena' && (
          <Arena 
            activeCourseId={activeCourseId}
          />
        )}

        {activeView === 'concept-map' && (
          <ConceptMap 
            syllabus={syllabus}
            onSubTopicSelect={handleSubTopicSelect}
            onClose={() => setActiveView('dashboard')}
          />
        )}

        {activeView === 'study-plan' && (
          <StudyPlan progress={progress} syllabus={syllabus} />
        )}

        {activeView === 'admin-dashboard' && (
          (() => {
            const isAdmin = profile?.role === 'admin' || user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';
            
            if (!isAdmin) {
              return <Dashboard 
                activeDepartment={activeDepartment}
                activeSemester={activeSemester}
                setActiveSemester={setActiveSemester}
                onModuleSelect={handleModuleSelect} 
                onSubTopicSelect={handleSubTopicSelect}
                onViewSelect={handleViewSelect}
                onProfileClick={() => setActiveView('profile')}
                onCourseSelect={handleCourseSelect}
                progress={progress}
                activeCourseId={activeCourseId}
                syllabus={syllabus}
                onToggleCalculator={() => setIsCalculatorOpen(!isCalculatorOpen)}
              />;
            }
            
            return <AdminDashboard />;
          })()
        )}

        {activeView === 'ai-tutor' && (
          <ChatBot 
            isFullPage={true} 
            onToggleFullPage={() => setActiveView('dashboard')} 
            messages={chatMessages}
            setMessages={setChatMessages}
            activeCourseId={activeCourseId}
            activeModule={activeModule?.title}
            activeSubTopic={activeModule?.subTopics.find(s => s.id === activeSubTopicId)?.title}
            subTopicContent={activeSubTopicContent}
            progress={progress}
            profile={profile}
            onUpdatePersonality={updateAIPersonality}
            onToggleCalculator={() => setIsCalculatorOpen(!isCalculatorOpen)}
            onOpenVoiceTutor={() => setIsVoiceTutorOpen(true)}
            onPdfTextChange={setActivePdfText}
          />
        )}
      </div>

      {/* AI Chatbot Overlay */}
      {activeView !== 'ai-tutor' && (
        <>
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsVoiceTutorOpen(true)}
            className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center z-40 lg:bottom-24 lg:right-8"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Mic className="w-6 h-6" />
            </motion.div>
          </motion.button>
          
          <ChatBot 
            onToggleFullPage={() => setActiveView('ai-tutor')} 
            messages={chatMessages}
            setMessages={setChatMessages}
            activeCourseId={activeCourseId}
            activeModule={activeModule?.title}
            activeSubTopic={activeModule?.subTopics.find(s => s.id === activeSubTopicId)?.title}
            subTopicContent={activeSubTopicContent}
            progress={progress}
            profile={profile}
            onUpdatePersonality={updateAIPersonality}
            onToggleCalculator={() => setIsCalculatorOpen(!isCalculatorOpen)}
            onOpenVoiceTutor={() => setIsVoiceTutorOpen(true)}
            onPdfTextChange={setActivePdfText}
          />
        </>
      )}

      {/* Bottom Navigation (Mobile) */}
      <BottomNav activeView={activeView} onViewSelect={handleViewSelect} />

      {/* Push Notification Prompt */}
      <PushNotificationPrompt />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Voice Tutor */}
      <VoiceTutor 
        isOpen={isVoiceTutorOpen} 
        onClose={() => setIsVoiceTutorOpen(false)} 
        pdfContent={activePdfText || undefined}
        systemInstruction={`You are a Senior AI Tutor specializing in the Nigerian University System (NUC/CCMAS).
Your teaching strategy (The UniAce Hybrid Approach):
1. NUC ALIGNMENT: Ensure the core content covers exactly what is required by the NUC/CCMAS syllabus for this topic.
2. INTERNATIONAL DEPTH: Do not just list facts. Provide deep, step-by-step explanations, clear derivations, and multiple worked examples.
3. UNIACE TUTOR STYLE: 
   - Use simple, relatable language for complex parts.
   - Include a "Pro-Tip: Common Exam Pitfalls" section highlighting where students usually lose marks.
   - Add a "Step-by-Step Breakdown" for any calculation or complex process.
   - Include 2-3 "Self-Check Questions" at the end of the content.`}
      />

      {/* Global Admin Alert */}
      <GlobalNotification />

      {/* Toaster for notifications */}
      <Toaster position="top-center" />
    </div>
  );
}
