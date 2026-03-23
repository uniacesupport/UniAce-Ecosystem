import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Plus, CheckCircle, Loader2, BookOpen, AlertCircle, Settings, Trash2, Users, Activity, Database, Search, Zap, Trophy, Star, Bot, Shield, BarChart3, Globe, Edit2, RefreshCw, Clock } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { useCourses } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import { db, storage, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, query, where, limit, writeBatch, serverTimestamp, orderBy } from 'firebase/firestore';
import AdminSeeder from './AdminSeeder';
import CourseEditModal from './CourseEditModal';
import { AIService } from '../services/ai';
import { generateCourseContent, generateCourseSkeleton, generateModuleContent } from '../services/aiCourseGenerator';
import { CourseService } from '../services/courseService';
import { Course, UserProgress, Subject, CourseId } from '../types';
import { LogService, SystemLog } from '../services/logService';

export default function AdminDashboard() {
  const { courses, refreshCourses } = useCourses();
  const [archivedCourses, setArchivedCourses] = useState<Record<string, Course>>({});
  const [showArchived, setShowArchived] = useState(false);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);

  const fetchArchivedCourses = async () => {
    if (!db) return;
    setIsLoadingArchived(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'archived_courses'));
      const archived: Record<string, Course> = {};
      querySnapshot.forEach((doc) => {
        archived[doc.id] = doc.data() as Course;
      });
      setArchivedCourses(archived);
    } catch (error) {
      console.error("Error fetching archived courses:", error);
    } finally {
      setIsLoadingArchived(false);
    }
  };

  useEffect(() => {
    if (showArchived) {
      fetchArchivedCourses();
    }
  }, [showArchived]);
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Phase 2: Knowledge Base Ingestion State
  const [kbContent, setKbContent] = useState('');
  const [kbCourseCode, setKbCourseCode] = useState('');
  const [kbModuleName, setKbModuleName] = useState('');
  const [kbTopicName, setKbTopicName] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState('');
  const [kbStats, setKbStats] = useState({ totalChunks: 0 });
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'users' | 'rag' | 'communications' | 'settings' | 'logs'>('overview');
  const [notificationText, setNotificationText] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailFromName, setEmailFromName] = useState('UniAce Team');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [struggleAnalytics, setStruggleAnalytics] = useState<any[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [systemStats, setSystemStats] = useState({
    totalSparksConsumed: 0,
    totalQuestionsAsked: 0,
    averageMastery: 0,
    popularCourse: 'N/A'
  });
  const [aiProviderStatus, setAiProviderStatus] = useState({
    gemini: false,
    groq: false,
    mistral: false,
    openrouter: false
  });
  const [aiMetrics, setAiMetrics] = useState({
    groq: { requests: 1240, tokens: 450000, latency: '120ms', uptime: '99.9%' },
    mistral: { requests: 450, tokens: 890000, latency: '1.2s', uptime: '98.5%' },
    gemini: { requests: 89, tokens: 2100000, latency: '2.5s', uptime: '100%' },
    openrouter: { requests: 12, tokens: 5000, latency: '1.8s', uptime: '99.9%' }
  });
  const [routingConfig, setRoutingConfig] = useState({
    chat: 'groq',
    quiz: 'groq',
    lesson: 'mistral',
    rag: 'gemini',
    vision: 'gemini'
  });
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [isCheckingAI, setIsCheckingAI] = useState(false);

  // New state for manual input and review
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [subjectArea, setSubjectArea] = useState('');
  const [extractedCourse, setExtractedCourse] = useState<Course | null>(null);
  const [rawJsonText, setRawJsonText] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [overrideCourseId, setOverrideCourseId] = useState<string>('');
  const [isGeneratingQuick, setIsGeneratingQuick] = useState(false);
  const [isGeneratingSkeleton, setIsGeneratingSkeleton] = useState(false);
  const isCancelledRef = useRef(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<'input' | 'skeleton' | 'generating' | 'error'>('input');
  const [courseSkeleton, setCourseSkeleton] = useState<{ modules: any[] } | null>(null);
  const [quickCourseName, setQuickCourseName] = useState('');
  const [quickCourseCode, setQuickCourseCode] = useState('');
  const [quickSubject, setQuickSubject] = useState<Subject>('Mathematics');
  const [quickCourseOutline, setQuickCourseOutline] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'groq' | 'mistral'>('mistral');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [systemConfig, setSystemConfig] = useState({
    aiKillswitch: false,
    strictAcademicFilter: true,
    autoFallback: true
  });

  useEffect(() => {
    fetchUsers();
    fetchKbStats();
    fetchSystemStats();
    checkAIStatus();
    fetchStruggleAnalytics();
    fetchSystemConfig();
    fetchRoutingConfig();
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const fetchedLogs = await LogService.getLogs(100);
      setLogs(fetchedLogs);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchRoutingConfig = async () => {
    if (!db) return;
    try {
      const docRef = doc(db, 'system_config', 'routing');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRoutingConfig(docSnap.data() as any);
      }
    } catch (error) {
      console.error("Error fetching routing config:", error);
    }
  };

  const updateRoutingConfig = async (task: string, provider: string) => {
    const newConfig = { ...routingConfig, [task]: provider };
    setRoutingConfig(newConfig as any);
    try {
      await setDoc(doc(db, 'system_config', 'routing'), newConfig);
      showToast(`Routing for ${task} updated to ${provider}`, 'success');
      LogService.log('info', 'admin', `Updated AI routing for ${task} to ${provider}`);
    } catch (error) {
      console.error("Error updating routing config:", error);
      showToast("Failed to update routing", "error");
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/config', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSystemConfig(data);
      }
    } catch (error) {
      console.error("Error fetching system config:", error);
    }
  };

  const updateSystemConfig = async (updates: Partial<typeof systemConfig>) => {
    const newConfig = { ...systemConfig, ...updates };
    setSystemConfig(newConfig); // Optimistic update
    try {
      const idToken = await auth.currentUser?.getIdToken();
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error("Error updating system config:", error);
      fetchSystemConfig(); // Rollback
    }
  };

  const fetchStruggleAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const analytics = await AIService.getStruggleAnalytics();
      setStruggleAnalytics(analytics);
    } catch (error) {
      console.error("Error fetching struggle analytics:", error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const checkAIStatus = async () => {
    setIsCheckingAI(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        console.warn("No auth token available for AI status check");
        return;
      }
      
      const res = await fetch('/api/admin/ai-status', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setAiProviderStatus(data.status);
        } else {
          setAiProviderStatus(data);
        }
        if (data.metrics) {
          setAiMetrics(data.metrics);
        }
      } else {
        console.error("Failed to fetch AI status:", await res.text());
      }
    } catch (error) {
      console.error("Error checking AI status:", error);
    } finally {
      setIsCheckingAI(false);
    }
  };

  const handleGenerateSkeleton = async () => {
    if (!quickCourseName || !quickCourseCode) {
      showToast('Please provide both course code and name', 'error');
      return;
    }

    setIsGeneratingSkeleton(true);
    setStatusMessage('AI is brainstorming the course structure...');
    
    try {
      let skeleton = null;
      let retries = 2;

      while (retries > 0 && !skeleton) {
        try {
          skeleton = await generateCourseSkeleton(
            quickCourseName, 
            `A comprehensive course on ${quickCourseName} for university students.`,
            quickCourseOutline,
            aiProvider
          );
        } catch (err) {
          retries--;
          if (retries > 0) {
            setStatusMessage(`Retrying structure generation... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            throw err;
          }
        }
      }
      
      if (!skeleton || !skeleton.modules || !Array.isArray(skeleton.modules) || skeleton.modules.length === 0) {
        console.error("Invalid skeleton structure received:", skeleton);
        throw new Error("The AI failed to generate a valid course structure. This often happens if the AI response is truncated or malformed. Please try again or try a different AI provider.");
      }

      setCourseSkeleton(skeleton);
      setGenerationStep('skeleton');
      showToast('Course structure generated! Please review.', 'info');
    } catch (error: any) {
      console.error('Skeleton generation error:', error);
      showToast('Failed to generate structure: ' + error.message, 'error');
    } finally {
      setIsGeneratingSkeleton(false);
    }
  };

  const handleFinalizeGeneration = async () => {
    if (!courseSkeleton) return;

    setIsGeneratingQuick(true);
    isCancelledRef.current = false;
    setGenerationError(null);
    setGenerationStep('generating');
    setGenerationProgress(0);
    
    try {
      const courseId = quickCourseCode.replace(/\s+/g, '').toUpperCase();
      const totalModules = courseSkeleton.modules.length;
      let generatedModules: any[] = [];
      let startingIndex = 0;

      // Check for existing progress to resume
      const courseRef = doc(db, 'courses', courseId);
      const courseDoc = await getDoc(courseRef);
      
      if (courseDoc.exists() && courseDoc.data().modules) {
        generatedModules = courseDoc.data().modules;
        startingIndex = generatedModules.length;
        if (startingIndex > 0 && startingIndex < totalModules) {
          setStatusMessage(`Resuming from Module ${startingIndex + 1}...`);
        }
      }

      // Save initial course doc
      await setDoc(courseRef, {
        id: courseId,
        title: quickCourseName,
        description: `A comprehensive course on ${quickCourseName}.`,
        subject: quickSubject,
        isAIGenerated: true,
        createdAt: new Date().toISOString()
      }, { merge: true });

      const CONCURRENCY_LIMIT = 3;
      for (let i = startingIndex; i < totalModules; i += CONCURRENCY_LIMIT) {
        if (isCancelledRef.current) {
          throw new Error('Generation cancelled by user.');
        }

        const chunk = courseSkeleton.modules.slice(i, i + CONCURRENCY_LIMIT);
        const chunkEnd = Math.min(i + CONCURRENCY_LIMIT, totalModules);
        
        const baseProgress = Math.round((i / totalModules) * 90);
        setGenerationProgress(baseProgress);
        setStatusMessage(`Generating Modules ${i + 1}-${chunkEnd} of ${totalModules} in parallel...`);

        try {
          const chunkPromises = chunk.map(async (moduleSkeleton: any, idx: number) => {
            const moduleIndex = i + idx;
            let moduleContent = null;
            let retries = 2;
            
            while (retries > 0 && !moduleContent) {
              try {
                moduleContent = await generateModuleContent(quickCourseName, moduleSkeleton, aiProvider, (msg) => {
                  if (idx === 0) {
                    setStatusMessage(`Modules ${i + 1}-${chunkEnd}/${totalModules}: ${msg}`);
                  }
                }, () => isCancelledRef.current);
              } catch (err) {
                if (isCancelledRef.current) throw new Error('Generation cancelled by user.');
                retries--;
                if (retries > 0) {
                  if (idx === 0) setStatusMessage(`Retrying Module ${moduleIndex + 1}/${totalModules}... (${retries} attempts left)`);
                  await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                  throw err;
                }
              }
            }

            if (isCancelledRef.current) {
              throw new Error('Generation cancelled by user.');
            }

            return { index: moduleIndex, content: moduleContent };
          });

          const results = await Promise.all(chunkPromises);
          results.sort((a, b) => a.index - b.index);

          for (const res of results) {
            if (res.content) {
              generatedModules.push(res.content);
            }
          }
          
          await CourseService.saveGeneratedCourse(courseId, { modules: generatedModules });
          
        } catch (moduleError: any) {
          console.error(`Failed to generate a module in chunk ${i + 1}-${chunkEnd}:`, moduleError);
          throw new Error(`Failed during Modules ${i + 1}-${chunkEnd}: ${moduleError.message}`);
        }
      }

      // Final Ingestion
      setGenerationProgress(95);
      setStatusMessage('Step 2: Ingesting course into Knowledge Base...');
      const syllabus = generatedModules.map((m: any, mIdx: number) => ({
        id: `m${mIdx + 1}`,
        title: m.title || `Module ${mIdx + 1}`,
        subTopics: (m.lessons || []).map((l: any, lIdx: number) => ({
          id: `m${mIdx + 1}-l${lIdx + 1}`,
          title: l.title || `Lesson ${lIdx + 1}`,
          content: l.content || ''
        }))
      }));

      await ingestCourseToKB({
        id: courseId,
        syllabus: syllabus
      } as any);

      setGenerationProgress(100);
      setUploadSuccess(true);
      setStatusMessage('Course generated, published, and ingested successfully!');
      showToast('Course generated successfully!', 'success');
      refreshCourses();
      
      // Reset fields after a delay
      setTimeout(() => {
        setGenerationStep('input');
        setCourseSkeleton(null);
        setQuickCourseName('');
        setQuickCourseCode('');
        setQuickCourseOutline('');
        setGenerationProgress(0);
        setUploadSuccess(false);
      }, 3000);

    } catch (error: any) {
      console.error('Final generation error:', error);
      setGenerationError(error.message);
      setGenerationStep('error');
      showToast('Failed to complete generation: ' + error.message, 'error');
    } finally {
      setIsGeneratingQuick(false);
    }
  };

  const fetchSystemStats = async () => {
    if (!db) return;
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      let sparks = 0;
      let masterySum = 0;
      let topicCount = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sparks += (data.total_sparks_used || 0);
        if (data.mastery) {
          Object.values(data.mastery).forEach((m: any) => {
            masterySum += m;
            topicCount++;
          });
        }
      });

      setSystemStats({
        totalSparksConsumed: sparks,
        totalQuestionsAsked: Math.floor(sparks / 10),
        averageMastery: topicCount > 0 ? Math.round(masterySum / topicCount) : 0,
        popularCourse: 'GST 111' // More realistic for Nigerian context
      });
    } catch (error) {
      console.error("Error fetching system stats:", error);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationText || !db) return;
    setIsSendingNotification(true);
    try {
      const alertId = Date.now().toString();
      await setDoc(doc(collection(db, 'notifications'), 'global_alert'), {
        id: alertId,
        message: notificationText,
        whatsappLink: whatsappLink,
        timestamp: new Date().toISOString(),
        type: 'admin_alert',
        active: true
      });

      // Also send individual notifications for persistence in Notification Center
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const batch = writeBatch(db);
        usersSnapshot.docs.forEach(userDoc => {
          const notifRef = doc(collection(db, 'notifications'));
          batch.set(notifRef, {
            userId: userDoc.id,
            title: 'Admin Announcement',
            message: notificationText,
            link: whatsappLink,
            type: 'info',
            read: false,
            createdAt: serverTimestamp()
          });
        });
        await batch.commit();
      } catch (batchError) {
        console.error("Error sending batch notifications:", batchError);
      }

      // Phase 2: Secure WhatsApp Broadcast via Backend
      try {
        const idToken = await user?.getIdToken();
        fetch('/api/admin/broadcast-whatsapp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            message: notificationText,
            whatsappLink: whatsappLink
          })
        }).catch(e => console.error('WhatsApp broadcast error:', e));
      } catch (backendError) {
        console.error("Backend broadcast error:", backendError);
      }

      showToast("Global notification sent!", "success");
      LogService.log('info', 'admin', `Sent global notification: ${notificationText.substring(0, 50)}...`);
      setNotificationText('');
      setWhatsappLink('');
    } catch (error) {
      console.error("Error sending notification:", error);
      showToast("Failed to send notification.", "error");
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo || !emailSubject || !emailBody) {
      showToast("Please fill in all required email fields.", "error");
      return;
    }
    setIsSendingEmail(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          body: emailBody,
          fromName: emailFromName
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send email');

      showToast("Email sent successfully!", "success");
      LogService.log('info', 'admin', `Sent personal email to ${emailTo}: ${emailSubject}`);
      setEmailTo('');
      setEmailSubject('');
      setEmailBody('');
    } catch (error: any) {
      console.error("Email Error:", error);
      showToast(`Failed to send email: ${error.message}`, "error");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleResetSparks = async (userId: string) => {
    if (!db) return;
    setConfirmModal({
      title: "Reset Sparks",
      message: "Are you sure you want to reset this user's sparks to 10,000?",
      onConfirm: async () => {
        try {
          await setDoc(doc(db, 'users', userId), { ai_sparks: 10000 }, { merge: true });
          showToast("Sparks reset successfully!", "success");
          LogService.log('warning', 'admin', `Reset sparks for user ${userId} to 10,000`);
          fetchUsers();
        } catch (error) {
          console.error("Error resetting sparks:", error);
          showToast("Failed to reset sparks.", "error");
        }
        setConfirmModal(null);
      }
    });
  };

  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const res = await fetch('/api/admin/update-user-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUserId, newRole })
      });

      if (res.ok) {
        showToast(`User role updated to ${newRole}`, 'success');
        LogService.log('warning', 'admin', `Updated user role for ${targetUserId} to ${newRole}`);
        fetchUsers();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update role', 'error');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      showToast('An error occurred while updating role', 'error');
    }
  };

  const fetchKbStats = async () => {
    if (!db) return;
    try {
      const snapshot = await getDocs(query(collection(db, 'knowledge_base'), limit(1)));
      // This is a rough estimate, Firestore doesn't provide easy count for large collections
      setKbStats({ totalChunks: snapshot.empty ? 0 : 1000 }); // Placeholder
    } catch (error: any) {
      console.error("Error fetching KB stats:", error);
      if (error.message?.includes('permissions') || error.code === 'permission-denied') {
        setIngestionStatus("Note: Knowledge Base stats hidden due to Firestore rules. This is normal if you haven't set public read rules.");
      }
    }
  };

  const handleIngestKB = async () => {
    if (!kbContent || !kbCourseCode) {
      showToast("Please provide at least content and course code.", "error");
      return;
    }

    setIsIngesting(true);
    setIngestionStatus('Preparing ingestion...');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken();

      setIngestionStatus('Calling backend ingestion API...');
      const response = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          content: kbContent,
          course_code: kbCourseCode,
          module_name: kbModuleName,
          topic_name: kbTopicName
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ingestion failed');

      setIngestionStatus(`Success: ${data.message}`);
      showToast("Knowledge Base updated!", "success");
      LogService.log('success', 'admin', `Ingested content into Knowledge Base for ${kbCourseCode}`, { course: kbCourseCode, module: kbModuleName });
      setKbContent('');
      setKbCourseCode('');
      setKbModuleName('');
      setKbTopicName('');
      await fetchKbStats();
    } catch (error: any) {
      console.error("Ingestion Error:", error);
      setIngestionStatus(`Error: ${error.message}`);
      showToast(`Ingestion failed: ${error.message}`, "error");
    } finally {
      setIsIngesting(false);
    }
  };

  const ingestCourseToKB = async (course: Course) => {
    if (!course.syllabus || course.syllabus.length === 0) return;
    
    setStatusMessage('Step 2: Ingesting content into Knowledge Base...');
    
    const user = auth.currentUser;
    if (!user) return;
    const idToken = await user.getIdToken();

    let totalIngested = 0;
    const totalTopics = (course.syllabus || []).reduce((acc, mod) => acc + (mod.subTopics || []).length, 0);

    for (const module of course.syllabus) {
      for (const subTopic of module.subTopics) {
        try {
          totalIngested++;
          setStatusMessage(`Ingesting: ${subTopic.title} (${totalIngested}/${totalTopics})...`);
          
          await fetch('/api/admin/ingest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              content: subTopic.content,
              course_code: course.id,
              module_name: module.title,
              topic_name: subTopic.title
            })
          });
        } catch (error) {
          console.error(`Failed to ingest topic ${subTopic.title}:`, error);
        }
      }
    }
    
    await fetchKbStats();
  };

  const fetchUsers = async () => {
    if (!db) return;
    setIsLoadingUsers(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userList: any[] = [];
      querySnapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleRestoreCourse = async (courseId: string) => {
    try {
      if (!db) throw new Error("Firestore not initialized");
      const courseToRestore = archivedCourses[courseId];
      if (!courseToRestore) return;

      // Write back to courses
      await setDoc(doc(db, 'courses', courseId), courseToRestore);
      
      // Remove from archived_courses
      await deleteDoc(doc(db, 'archived_courses', courseId));
      
      await refreshCourses();
      await fetchArchivedCourses();
      showToast(`Course ${courseId} restored successfully.`, "success");
    } catch (error) {
      console.error("Error restoring course:", error);
      showToast("Failed to restore course.", "error");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    setConfirmModal({
      title: "Archive Course",
      message: `Are you sure you want to archive course ${courseId}? It will be moved to the Archived Courses tab and can be restored later.`,
      onConfirm: async () => {
        try {
          if (!db) throw new Error("Firestore not initialized");
          const courseToArchive = courses[courseId];
          if (courseToArchive) {
            await setDoc(doc(db, 'archived_courses', courseId), courseToArchive);
          }
          
          // Overwrite the course document with a tiny tombstone to prevent data leakage
          await setDoc(doc(db, 'courses', courseId), { 
            id: courseId,
            deleted: true,
            deletedAt: new Date().toISOString()
          });
          
          await refreshCourses();
          showToast(`Course ${courseId} archived successfully.`, "success");
        } catch (error) {
          console.error("Error archiving course:", error);
          showToast("Failed to archive course.", "error");
        }
        setConfirmModal(null);
      }
    });
  };

  const handlePermanentDeleteCourse = async (courseId: string) => {
    setConfirmModal({
      title: "Permanent Delete",
      message: `Are you sure you want to permanently delete course ${courseId}? This action CANNOT be undone.`,
      onConfirm: async () => {
        try {
          if (!db) throw new Error("Firestore not initialized");
          
          // Delete from archived_courses
          await deleteDoc(doc(db, 'archived_courses', courseId));
          
          // Delete the tombstone from courses
          // Note: This does not delete subcollections (modules, lessons, etc.).
          // In a production environment, a Cloud Function should be triggered to recursively delete subcollections.
          await deleteDoc(doc(db, 'courses', courseId));
          
          await fetchArchivedCourses();
          showToast(`Course ${courseId} permanently deleted.`, "success");
        } catch (error) {
          console.error("Error permanently deleting course:", error);
          showToast("Failed to permanently delete course.", "error");
        }
        setConfirmModal(null);
      }
    });
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleSyncWithConstants = async (courseId: string) => {
    const { COURSES } = await import('../constants');
    const defaultCourse = COURSES[courseId as CourseId];
    
    if (!defaultCourse) {
      showToast(`Course ${courseId} not found in default constants.`, "error");
      return;
    }

    setConfirmModal({
      title: "Sync with Constants",
      message: `Are you sure you want to overwrite ${courseId} in Firestore with the default version from constants.ts?`,
      onConfirm: async () => {
        setIsUploading(true);
        setStatusMessage(`Syncing ${courseId} with defaults...`);
        
        try {
          if (!db) throw new Error("Firestore not initialized");
          
          await setDoc(doc(db, 'courses', courseId), {
            ...defaultCourse,
            isAIGenerated: false,
            lastSynced: new Date().toISOString()
          });

          await refreshCourses();
          showToast(`Course ${courseId} synced successfully.`, "success");
        } catch (error: any) {
          console.error("Sync error:", error);
          showToast("Failed to sync course: " + error.message, "error");
        } finally {
          setIsUploading(false);
          setStatusMessage('');
          setConfirmModal(null);
        }
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadSuccess(false);
      setStatusMessage('');
    } else {
      showToast('Please select a valid PDF file.', 'error');
    }
  };

  const fileToGenerativePart = async (file: File) => {
    return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Data = base64String.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!subjectArea) {
      showToast('Please select a Subject Area before extracting.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setStatusMessage('Initializing upload...');

    try {
      // 1. Prepare for Gemini
      setStatusMessage('Processing PDF with Gemini 3.0 Flash Preview...');
      const pdfPart = await fileToGenerativePart(selectedFile);
      setUploadProgress(40);

      // 2. Call Gemini API
      setStatusMessage(`Analyzing with Gemini 3.0 Flash Preview...`);

      const prompt = `
        You are an expert curriculum designer and university professor.
        Analyze the attached PDF document, which is a university-level course note.
        Extract the full course syllabus and content into a structured JSON format.

        CRITICAL INSTRUCTIONS FOR DIAGRAMS AND IMAGES:
        1. If you encounter a flowchart, system architecture, graph, or structural diagram, convert it into valid Mermaid.js code and embed it in the markdown content using \`\`\`mermaid ... \`\`\`.
        2. If you encounter a complex photograph or highly detailed illustration (e.g., biology anatomy, real-world photos) that cannot be coded, simply ignore it or replace it with a descriptive placeholder like "[Complex Image: Admin to insert manually]".

        The output must strictly follow this JSON structure:
        {
          "id": "${courseCode || 'COURSE_CODE'}",
          "title": "${courseTitle || 'Course Title'}",
          "description": "A brief summary of the course",
          "subject": "${subjectArea || 'Subject Area'}",
          "syllabus": [
            {
              "id": "module_id",
              "title": "Module Title",
              "subTopics": [
                {
                  "id": "subtopic_id",
                  "title": "Subtopic Title",
                  "content": "The full educational content. Use Markdown. IMPORTANT: Wrap all math formulas in LaTeX using $ for inline (e.g., $x^2$) and $$ for block (e.g., $$ \\int x dx $$). Use Mermaid.js for flowcharts."
                }
              ]
            }
          ]
        }

        Ensure the content is comprehensive, university-level, and well-formatted.
        Do not truncate the content. Extract as much as possible.
        Output ONLY the JSON string. Do not include markdown code blocks like \`\`\`json.
      `;

      const response = await AIService.extractCourseFromPDF(
        pdfPart.inlineData.data,
        pdfPart.inlineData.mimeType,
        prompt,
        courseCode,
        courseTitle,
        subjectArea
      );

      setUploadProgress(70);
      setStatusMessage('Parsing AI response...');

      const responseText = response.text;
      if (!responseText) throw new Error("No response from AI");
      // Clean up the response if it contains markdown code blocks
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let courseData: Course;
      try {
        courseData = JSON.parse(cleanJson);
      } catch (e) {
        console.error("JSON Parse Error:", e);
        console.log("Raw Response:", responseText);
        throw new Error("Failed to parse AI response. The PDF might be too complex or the AI output was malformed.");
      }

      // 4. Enter Review Mode
      const finalCourse = {
        ...courseData,
        id: (courseData.id || `COURSE_${Date.now()}`) as any
      } as Course;
      setExtractedCourse(finalCourse);
      setRawJsonText(JSON.stringify(finalCourse, null, 2));
      setIsReviewing(true);
      setUploadProgress(100);
      setStatusMessage('Extraction complete. Ready for review.');

    } catch (error: any) {
      console.error("Upload/Extraction Error:", error);
      setStatusMessage(`Error: ${error.message}`);
      setUploadProgress(0);
      setIsUploading(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublishCourse = async () => {
    if (!selectedFile) return;
    
    let finalCourseData: Course;
    try {
      finalCourseData = JSON.parse(rawJsonText);
    } catch (e) {
      showToast("Invalid JSON format. Please fix any syntax errors before publishing.", "error");
      return;
    }

    setIsUploading(true);
    setStatusMessage('Saving course to database...');
    try {
      if (!db) throw new Error("Firestore not initialized");

      await setDoc(doc(db, 'courses', finalCourseData.id), {
        ...finalCourseData,
        createdAt: new Date().toISOString(),
        sourcePdf: selectedFile.name
      });

      LogService.log('success', 'admin', `Published new course: ${finalCourseData.title} (${finalCourseData.id})`);

      // Phase 2: Automatic Ingestion
      await ingestCourseToKB(finalCourseData);

      setUploadSuccess(true);
      setStatusMessage('Course published and ingested successfully!');
      showToast('Course published successfully!', 'success');
      setSelectedFile(null);
      setExtractedCourse(null);
      setRawJsonText('');
      setIsReviewing(false);
      setCourseCode('');
      setCourseTitle('');
      setSubjectArea('');
      
      await refreshCourses();
    } catch (error: any) {
      console.error("Publish Error:", error);
      showToast("Failed to publish course: " + error.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-12 pb-24 lg:pb-12 transition-colors min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              🎓 Admin Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Phase 3: The Command Center — Global Analytics & Content Control.
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                <Users size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{users.length}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Users</div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{Object.keys(courses).length}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Courses</div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 3 Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'courses', label: 'Courses & AI', icon: BookOpen },
            { id: 'rag', label: 'Knowledge Base', icon: Database },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'communications', label: 'Communications', icon: Globe },
            { id: 'logs', label: 'System Logs', icon: FileText },
            { id: 'settings', label: 'Command Center', icon: Shield }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                  : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Stat Card 1 */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap size={64} />
                </div>
                <div className="bg-amber-100 dark:bg-amber-900/30 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6">
                  <Zap size={24} fill="currentColor" />
                </div>
                <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{systemStats.totalSparksConsumed.toLocaleString()}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Sparks Consumed</div>
                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <Activity size={16} />
                  <span>+24% this week</span>
                </div>
              </div>

              {/* Stat Card 2 */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Bot size={64} />
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                  <Bot size={24} />
                </div>
                <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{systemStats.totalQuestionsAsked.toLocaleString()}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">AI Interactions</div>
                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <Activity size={16} />
                  <span>+12% this week</span>
                </div>
              </div>

              {/* Stat Card 3 */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Trophy size={64} />
                </div>
                <div className="bg-emerald-100 dark:bg-emerald-900/30 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                  <Trophy size={24} />
                </div>
                <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{systemStats.averageMastery}%</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Avg. Student Mastery</div>
                <div className="mt-6 h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${systemStats.averageMastery}%` }} />
                </div>
              </div>

              {/* Stat Card 4 */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Star size={64} />
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                  <Star size={24} />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate" title={systemStats.popularCourse}>{systemStats.popularCourse}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Trending Course</div>
                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                  <Users size={16} />
                  <span>High enrollment</span>
                </div>
              </div>
            </div>

            {/* Main Charts & Data Grid Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Global Charts Section */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="text-blue-500" size={24} />
                      AI Request Volume
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time token and request metrics across providers.</p>
                  </div>
                  <div className="flex flex-wrap gap-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-xs font-bold text-slate-600 dark:text-slate-300">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Groq
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-xs font-bold text-slate-600 dark:text-slate-300">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Mistral
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-xs font-bold text-slate-600 dark:text-slate-300">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Gemini
                    </div>
                  </div>
                </div>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { time: '00:00', groq: 45, mistral: 20, gemini: 10 },
                      { time: '04:00', groq: 30, mistral: 15, gemini: 8 },
                      { time: '08:00', groq: 85, mistral: 40, gemini: 25 },
                      { time: '12:00', groq: 120, mistral: 65, gemini: 45 },
                      { time: '16:00', groq: 150, mistral: 80, gemini: 55 },
                      { time: '20:00', groq: 110, mistral: 55, gemini: 35 },
                      { time: '23:59', groq: 65, mistral: 30, gemini: 15 },
                    ]}>
                      <defs>
                        <linearGradient id="colorGroq" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMistral" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorGemini" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)' }}
                        itemStyle={{ fontWeight: 600 }}
                      />
                      <Area type="monotone" dataKey="groq" stroke="#f97316" fillOpacity={1} fill="url(#colorGroq)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="mistral" stroke="#a855f7" fillOpacity={1} fill="url(#colorMistral)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="gemini" stroke="#3b82f6" fillOpacity={1} fill="url(#colorGemini)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Struggle Heatmap */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertCircle className="text-rose-500" size={24} />
                    Struggle Heatmap
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Topics requiring intervention.</p>
                </div>
                
                <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                  {struggleAnalytics.length > 0 ? (
                    struggleAnalytics.slice(0, 6).map((item, idx) => (
                      <div key={idx} className="group">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-bold text-slate-700 dark:text-slate-300 truncate pr-4">{item.subTopicTitle}</span>
                          <span className="text-rose-500 font-black whitespace-nowrap bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-md">{item.count} hits</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-1000 group-hover:opacity-80" 
                            style={{ width: `${Math.min((item.count / (struggleAnalytics[0]?.count || 1)) * 100, 100)}%` }} 
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                      <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <CheckCircle className="text-emerald-500" size={24} />
                      </div>
                      <p className="text-sm font-medium">No struggle data detected.</p>
                    </div>
                  )}
                </div>
                
                <button className="w-full mt-6 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2">
                  <BarChart3 size={18} />
                  Full Analytics Report
                </button>
              </div>
            </div>

            {/* System Health & Recent Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Health */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <Shield className="text-emerald-500" size={24} />
                  System Health
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                    <div className="text-sm font-bold text-slate-500 mb-1">API Latency</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                      124<span className="text-sm font-bold text-slate-400">ms</span>
                    </div>
                    <div className="mt-2 text-xs font-bold text-emerald-500 flex items-center gap-1"><Activity size={12}/> Optimal</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                    <div className="text-sm font-bold text-slate-500 mb-1">Uptime</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                      99.9<span className="text-sm font-bold text-slate-400">%</span>
                    </div>
                    <div className="mt-2 text-xs font-bold text-emerald-500 flex items-center gap-1"><CheckCircle size={12}/> All systems operational</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                    <div className="text-sm font-bold text-slate-500 mb-1">Active Users</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                      {Math.floor(users.length * 0.15) || 12}
                    </div>
                    <div className="mt-2 text-xs font-bold text-blue-500 flex items-center gap-1"><Users size={12}/> Currently online</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                    <div className="text-sm font-bold text-slate-500 mb-1">Database Load</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                      24<span className="text-sm font-bold text-slate-400">%</span>
                    </div>
                    <div className="mt-2 text-xs font-bold text-emerald-500 flex items-center gap-1"><Database size={12}/> Healthy</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="text-indigo-500" size={24} />
                    Recent Activity
                  </h3>
                  <button onClick={() => setActiveTab('logs')} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    View All
                  </button>
                </div>
                <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                  {logs.slice(0, 4).map((log, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        {log.level === 'error' ? <AlertCircle size={16} className="text-rose-500" /> : 
                         log.level === 'success' ? <CheckCircle size={16} className="text-emerald-500" /> : 
                         <Activity size={16} className="text-blue-500" />}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 dark:text-white text-sm capitalize">{log.category}</span>
                          <span className="text-[10px] font-bold text-slate-400">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{log.message}</p>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-sm font-medium text-slate-400">
                      No recent activity to display.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-8">
            {/* Database Migration Section */}
            <AdminSeeder onComplete={refreshCourses} />

            {/* Quick AI Generator Section */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-indigo-100 dark:bg-indigo-500/20 p-3 rounded-2xl">
                  <Zap className="text-indigo-600 dark:text-indigo-400" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Infinite Lesson Engine</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Iterative, high-fidelity university course generation.</p>
                </div>
              </div>

              {/* AI Provider Selection */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Bot size={16} className="text-indigo-500" />
                  Select AI Provider
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setAiProvider('gemini')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                      aiProvider === 'gemini'
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-500 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:border-blue-700'
                    }`}
                  >
                    <Shield size={16} />
                    Gemini (Pro)
                  </button>
                  <button
                    onClick={() => setAiProvider('groq')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                      aiProvider === 'groq'
                        ? 'bg-orange-100 text-orange-700 border-2 border-orange-500 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-orange-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:border-orange-700'
                    }`}
                  >
                    <Zap size={16} />
                    Groq (Turbo)
                  </button>
                  <button
                    onClick={() => setAiProvider('mistral')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                      aiProvider === 'mistral'
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-500 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-purple-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:border-purple-700'
                    }`}
                  >
                    <Star size={16} />
                    Mistral (Creative)
                  </button>
                </div>
              </div>

              {generationStep === 'input' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Course Code</label>
                      <input 
                        type="text" 
                        placeholder="e.g., PHY 102" 
                        value={quickCourseCode}
                        onChange={(e) => setQuickCourseCode(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Course Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Electricity and Magnetism" 
                        value={quickCourseName}
                        onChange={(e) => setQuickCourseName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                      <select 
                        value={quickSubject}
                        onChange={(e) => setQuickSubject(e.target.value as Subject)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Biology">Biology</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="General Studies">General Studies</option>
                        <option value="General Engineering Training">General Engineering Training</option>
                        <option value="Zoology">Zoology</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Course Outline / Syllabus (Optional)</label>
                    <textarea 
                      placeholder="Paste a course outline or syllabus here to guide the AI generation..." 
                      value={quickCourseOutline}
                      onChange={(e) => setQuickCourseOutline(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleGenerateSkeleton}
                    disabled={isGeneratingSkeleton}
                    className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                      isGeneratingSkeleton 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98]'
                    }`}
                  >
                    {isGeneratingSkeleton ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Brainstorming Structure...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={20} />
                        <span>Generate Course Structure</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {generationStep === 'skeleton' && courseSkeleton && (
                <div className="space-y-6">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                    <h3 className="font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                      <CheckCircle size={18} />
                      Course Structure Brainstormed
                    </h3>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                      Review the modules and lesson titles below. You can edit them manually if needed before generating full content.
                    </p>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {courseSkeleton.modules.map((module: any, mIdx: number) => (
                      <div key={mIdx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <input 
                          type="text" 
                          value={module.title}
                          onChange={(e) => {
                            const newSkeleton = { ...courseSkeleton };
                            newSkeleton.modules[mIdx].title = e.target.value;
                            setCourseSkeleton(newSkeleton);
                          }}
                          className="w-full bg-transparent font-bold text-slate-900 dark:text-white mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                        />
                        <div className="pl-4 space-y-1 border-l-2 border-slate-200 dark:border-slate-700">
                          {module.lessonTitles.map((lesson: string, lIdx: number) => (
                            <input 
                              key={lIdx}
                              type="text" 
                              value={lesson}
                              onChange={(e) => {
                                const newSkeleton = { ...courseSkeleton };
                                newSkeleton.modules[mIdx].lessonTitles[lIdx] = e.target.value;
                                setCourseSkeleton(newSkeleton);
                              }}
                              className="w-full bg-transparent text-sm text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setGenerationStep('input')}
                      className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Back to Input
                    </button>
                    <button
                      onClick={handleFinalizeGeneration}
                      className="flex-[2] py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Zap size={18} />
                      Generate Full Content
                    </button>
                  </div>
                </div>
              )}

              {generationStep === 'generating' && (
                <div className="py-8 text-center space-y-6">
                  <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900 rounded-full" />
                    <div 
                      className="absolute inset-0 border-4 border-indigo-600 rounded-full transition-all duration-500"
                      style={{ 
                        clipPath: `inset(${100 - generationProgress}% 0 0 0)`,
                        transform: 'rotate(-90deg)'
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{generationProgress}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{statusMessage}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      This process is mathematically rigorous. The AI is generating exhaustive lecture notes and quizzes for each module.
                    </p>
                  </div>

                  <div className="w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>

                  {!uploadSuccess && (
                    <button
                      onClick={() => isCancelledRef.current = true}
                      className="px-6 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Cancel Generation
                    </button>
                  )}
                </div>
              )}

              {generationStep === 'error' && (
                <div className="py-8 text-center space-y-6">
                  <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-3xl inline-block">
                    <AlertCircle size={48} className="text-red-600 dark:text-red-400 mx-auto" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Generation Failed</h3>
                    <p className="text-sm text-red-500 dark:text-red-400 max-w-md mx-auto">
                      {generationError}
                    </p>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setGenerationStep('input')}
                      className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Back to Start
                    </button>
                    <button
                      onClick={handleFinalizeGeneration}
                      className="px-6 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center gap-2"
                    >
                      <RefreshCw size={18} />
                      Retry Generation
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PDF Upload Section */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-amber-100 dark:bg-amber-500/20 p-3 rounded-2xl">
              <Upload className="text-amber-600 dark:text-amber-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">PDF-to-Course AI Pipeline</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Upload a PDF note to automatically generate a structured course syllabus.</p>
            </div>
          </div>

          {!isReviewing && !uploadSuccess && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Course Code</label>
                <input 
                  type="text" 
                  placeholder="e.g., BIO 101" 
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Course Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., General Biology I" 
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Subject Area</label>
                <select
                  value={subjectArea}
                  onChange={(e) => setSubjectArea(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select a subject...</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="General Studies">General Studies</option>
                  <option value="General Engineering Training">General Engineering Training</option>
                  <option value="Zoology">Zoology</option>
                </select>
              </div>
            </div>
          )}

          {!isReviewing && (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center transition-colors hover:border-amber-500 dark:hover:border-amber-400">
              <input 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
            
            {!selectedFile && !isUploading && !uploadSuccess && (
              <div className="flex flex-col items-center justify-center gap-4">
                <FileText size={48} className="text-slate-400" />
                <div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">Drag and drop your PDF here, or</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-amber-600 dark:text-amber-400 font-bold mt-1 hover:underline"
                  >
                    browse files
                  </button>
                </div>
                <p className="text-xs text-slate-500">Supports PDFs up to 500 pages (Gemini 3.0 Flash Preview)</p>
              </div>
            )}

            {selectedFile && !isUploading && !uploadSuccess && (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="bg-emerald-100 dark:bg-emerald-500/20 p-4 rounded-full">
                  <FileText size={32} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-bold">{selectedFile.name}</p>
                  <p className="text-sm text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="flex gap-3 mt-2">
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="px-4 py-2 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpload}
                    className="px-6 py-2 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 transition-all active:scale-95"
                  >
                    Extract with AI
                  </button>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="flex flex-col items-center justify-center gap-6 py-4">
                <Loader2 size={48} className="text-amber-500 animate-spin" />
                <div className="w-full max-w-md space-y-2">
                  <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span>{statusMessage}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-200 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="flex flex-col items-center justify-center gap-4 py-4">
                <div className="bg-emerald-100 dark:bg-emerald-500/20 p-4 rounded-full">
                  <CheckCircle size={48} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Extraction Complete!</h3>
                  <p className="text-slate-500 mt-1">The course has been successfully structured and saved to the database.</p>
                </div>
                <button 
                  onClick={() => setUploadSuccess(false)}
                  className="mt-4 px-6 py-2 rounded-xl font-bold text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
                >
                  Upload Another PDF
                </button>
              </div>
            )}

            {statusMessage.startsWith('Error') && !isUploading && (
               <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 justify-center">
                 <AlertCircle size={20} />
                 <span className="text-sm font-bold">{statusMessage}</span>
               </div>
            )}
          </div>
          )}

          {isReviewing && extractedCourse && (
            <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle className="text-emerald-500" size={20} />
                Review Extracted Content
              </h3>
              
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-6">
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Override Existing Course? (Optional)
                  </label>
                  <select 
                    value={overrideCourseId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setOverrideCourseId(newId);
                      if (newId) {
                        try {
                          const updated = JSON.parse(rawJsonText);
                          updated.id = newId;
                          const newJson = JSON.stringify(updated, null, 2);
                          setRawJsonText(newJson);
                          setExtractedCourse(updated);
                        } catch (err) {
                          console.error("Failed to update ID in JSON:", err);
                        }
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Create New Course --</option>
                    {Object.values(courses).map(c => (
                      <option key={c.id} value={c.id}>{c.id}: {c.title}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-2">
                    Selecting an existing course will set its ID in the JSON below, overwriting it when you publish.
                  </p>
                </div>

                <p className="text-sm text-slate-500 mb-4">
                  You can manually edit the JSON below to fix typos or replace image placeholders with real image URLs before publishing.
                </p>
                <textarea 
                  className="w-full h-[500px] bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono p-4 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={rawJsonText}
                  onChange={(e) => {
                    setRawJsonText(e.target.value);
                    try {
                      const updated = JSON.parse(e.target.value);
                      setExtractedCourse(updated);
                    } catch (err) {
                      // Ignore parse errors while typing
                    }
                  }}
                />
              </div>

              <div className="flex gap-4 justify-end">
                <button 
                  onClick={() => {
                    setIsReviewing(false);
                    setExtractedCourse(null);
                    setSelectedFile(null);
                  }}
                  className="px-6 py-2 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={handlePublishCourse}
                  disabled={isUploading}
                  className="px-6 py-2 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Publish Course
                </button>
              </div>
            </div>
          )}
        </div>

          {/* Existing Courses List */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="text-emerald-500" size={24} />
              {showArchived ? 'Archived Courses' : 'Active Courses'}
            </h2>
            <button 
              onClick={() => setShowArchived(!showArchived)}
              className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              {showArchived ? 'View Active' : 'View Archived'}
            </button>
          </div>

          {selectedCourse && (
            <CourseEditModal 
              course={selectedCourse} 
              onClose={() => setSelectedCourse(null)} 
              onSave={refreshCourses} 
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoadingArchived && showArchived ? (
              <div className="col-span-2 text-center py-8 text-slate-500">Loading archived courses...</div>
            ) : (
              (showArchived ? Object.values(archivedCourses) : Object.values(courses)).map((course) => (
                <div key={course.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors flex items-start justify-between group">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{course.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{course.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">
                        {course.syllabus?.length || 0} Modules
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${showArchived ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                        {showArchived ? 'Archived' : 'Published'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!showArchived && (
                      <>
                        <button 
                          onClick={() => handleSyncWithConstants(course.id)}
                          className="p-2 text-slate-400 hover:text-indigo-500"
                          title="Sync with Constants (Force 10 Modules)"
                        >
                          <Activity size={18} />
                        </button>
                        <button 
                          onClick={() => handleEditCourse(course)}
                          className="p-2 text-slate-400 hover:text-emerald-500"
                          title="Edit Course"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-2 text-slate-400 hover:text-red-500"
                          title="Archive Course"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                    {showArchived && (
                      <>
                        <button 
                          onClick={() => handleRestoreCourse(course.id)}
                          className="p-2 text-slate-400 hover:text-emerald-500"
                          title="Restore Course"
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button 
                          onClick={() => handlePermanentDeleteCourse(course.id)}
                          className="p-2 text-slate-400 hover:text-red-500"
                          title="Permanently Delete Course"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      )}

      {activeTab === 'rag' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-blue-100 dark:bg-blue-500/20 p-3 rounded-2xl">
              <Database className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Knowledge Base Ingestion (RAG)</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Paste syllabus text to chunk and embed it for the AI's semantic search.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Course Code</label>
                <input 
                  type="text" 
                  placeholder="e.g., GST 111" 
                  value={kbCourseCode}
                  onChange={(e) => setKbCourseCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Module Name (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g., Phonetics" 
                  value={kbModuleName}
                  onChange={(e) => setKbModuleName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Topic Name (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g., Vowels" 
                  value={kbTopicName}
                  onChange={(e) => setKbTopicName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Syllabus Content</label>
              <textarea 
                placeholder="Paste the full text content here..." 
                value={kbContent}
                onChange={(e) => setKbContent(e.target.value)}
                className="w-full h-64 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                {ingestionStatus && (
                  <p className={`font-bold ${ingestionStatus.startsWith('Error') ? 'text-red-500' : 'text-emerald-500'}`}>
                    {ingestionStatus}
                  </p>
                )}
              </div>
              <button 
                onClick={handleIngestKB}
                disabled={isIngesting || !kbContent || !kbCourseCode}
                className="px-8 py-3 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isIngesting ? <Loader2 size={20} className="animate-spin" /> : <Database size={20} />}
                Ingest to Knowledge Base
              </button>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="text-blue-500" size={24} />
              Registered Users
            </h2>
            <button onClick={fetchUsers} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Refresh List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">User ID</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Level</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">XP</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Streak</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Active</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">Loading users...</td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 font-mono text-xs text-slate-500">{user.id.substring(0, 8)}...</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300 font-medium">{user.email || 'No Email'}</td>
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{user.level || 1}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{user.xp || 0}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                          {user.streak || 0} 🔥
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 text-xs">
                        {user.lastStudyDate ? new Date(user.lastStudyDate).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-3">
                        <select 
                          value={user.role || 'student'} 
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          onClick={() => handleResetSparks(user.id)}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                        >
                          Reset Sparks
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="text-indigo-500" size={28} />
                System Audit Logs
              </h2>
              <p className="text-slate-500 mt-1">Review all user and administrative activities across the platform.</p>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Categories</option>
                <option value="user">User Activity</option>
                <option value="admin">Admin Actions</option>
                <option value="ai">AI Operations</option>
                <option value="system">System Events</option>
              </select>
              <button 
                onClick={fetchLogs}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
              >
                <RefreshCw size={20} className={isLoadingLogs ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Level</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Message</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoadingLogs ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                      Loading logs...
                    </td>
                  </tr>
                ) : logs.filter(l => logFilter === 'all' || l.category === logFilter).length > 0 ? (
                  logs.filter(l => logFilter === 'all' || l.category === logFilter).map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 text-xs text-slate-500 whitespace-nowrap">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          log.level === 'error' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                          log.level === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          log.level === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-bold text-slate-400 uppercase">{log.category}</span>
                      </td>
                      <td className="py-4">
                        <div className="text-slate-900 dark:text-white font-medium">{log.userEmail}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.userId?.substring(0, 8)}...</div>
                      </td>
                      <td className="py-4">
                        <div className="text-slate-600 dark:text-slate-300">{log.message}</div>
                        {log.details && (
                          <div className="mt-1 text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-900/50 p-1 rounded">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">No logs found for this criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-8">
          {/* AI Provider Status & Metrics */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bot className="text-blue-500" size={28} />
                  AI Intelligence Hub
                </h2>
                <p className="text-slate-500 mt-1">Real-time health monitoring and provider performance metrics.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  System Healthy
                </div>
                <button 
                  onClick={checkAIStatus}
                  disabled={isCheckingAI}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                >
                  <RefreshCw size={20} className={isCheckingAI ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Groq Card */}
              <div className={`p-6 rounded-3xl border-2 transition-all ${aiProviderStatus.groq ? 'border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    <Zap size={24} />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${aiProviderStatus.groq ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {aiProviderStatus.groq ? 'Active' : 'Offline'}
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Groq (Llama 3)</h3>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Latency</span>
                    <span className="text-emerald-500">{aiMetrics.groq.latency}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Requests</span>
                    <span className="text-slate-900 dark:text-white">{aiMetrics.groq.requests.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Uptime</span>
                    <span className="text-slate-900 dark:text-white">{aiMetrics.groq.uptime}</span>
                  </div>
                </div>
              </div>

              {/* Mistral Card */}
              <div className={`p-6 rounded-3xl border-2 transition-all ${aiProviderStatus.mistral ? 'border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    <Star size={24} />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${aiProviderStatus.mistral ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {aiProviderStatus.mistral ? 'Active' : 'Offline'}
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Mistral (Large)</h3>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Latency</span>
                    <span className="text-amber-500">{aiMetrics.mistral.latency}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Requests</span>
                    <span className="text-slate-900 dark:text-white">{aiMetrics.mistral.requests.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Uptime</span>
                    <span className="text-slate-900 dark:text-white">{aiMetrics.mistral.uptime}</span>
                  </div>
                </div>
              </div>

              {/* Gemini Card */}
              <div className={`p-6 rounded-3xl border-2 transition-all ${aiProviderStatus.gemini ? 'border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Shield size={24} />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${aiProviderStatus.gemini ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {aiProviderStatus.gemini ? 'Active' : 'Offline'}
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Gemini (Ultra)</h3>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Latency</span>
                    <span className="text-slate-500">{aiMetrics.gemini.latency}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Requests</span>
                    <span className="text-slate-900 dark:text-white">{aiMetrics.gemini.requests.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Uptime</span>
                    <span className="text-slate-900 dark:text-white">{aiMetrics.gemini.uptime}</span>
                  </div>
                </div>
              </div>

              {/* OpenRouter Card */}
              <div className={`p-6 rounded-3xl border-2 transition-all ${aiProviderStatus.openrouter ? 'border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                    <Globe size={24} />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${aiProviderStatus.openrouter ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {aiProviderStatus.openrouter ? 'Active' : 'Offline'}
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">OpenRouter</h3>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Latency</span>
                    <span className="text-slate-500">{aiMetrics.openrouter.latency}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Requests</span>
                    <span className="text-slate-900 dark:text-white">{aiMetrics.openrouter.requests.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Uptime</span>
                    <span className="text-slate-900 dark:text-white">{aiMetrics.openrouter.uptime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* System Event Logs */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Activity className="text-blue-500" size={24} />
                Recent Activity
              </h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        log.level === 'success' ? 'text-emerald-500' :
                        log.level === 'warning' ? 'text-amber-500' :
                        log.level === 'error' ? 'text-red-500' :
                        'text-blue-500'
                      }`}>
                        {log.level}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : 'Just now'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{log.message}</p>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm italic">
                    No recent activity logs found.
                  </div>
                )}
              </div>
              <button 
                onClick={() => setActiveTab('logs')}
                className="w-full mt-6 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
              >
                View Full Audit Trail
              </button>
            </div>
          </div>

          {/* Global AI Safety Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Shield className="text-red-500" size={24} />
              Safety & Compliance Controls
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Global AI Killswitch</div>
                  <div className="text-xs text-slate-500">Instantly disable all AI interactions.</div>
                </div>
                <div 
                  onClick={() => updateSystemConfig({ aiKillswitch: !systemConfig.aiKillswitch })}
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${systemConfig.aiKillswitch ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${systemConfig.aiKillswitch ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Strict Academic Filter</div>
                  <div className="text-xs text-slate-500">Block non-academic AI queries.</div>
                </div>
                <div 
                  onClick={() => updateSystemConfig({ strictAcademicFilter: !systemConfig.strictAcademicFilter })}
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${systemConfig.strictAcademicFilter ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${systemConfig.strictAcademicFilter ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Auto-Fallback Mode</div>
                  <div className="text-xs text-slate-500">Enable automatic provider switching.</div>
                </div>
                <div 
                  onClick={() => updateSystemConfig({ autoFallback: !systemConfig.autoFallback })}
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${systemConfig.autoFallback ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${systemConfig.autoFallback ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
            </div>

            {/* Task Routing Matrix */}
            <div className="mt-8 bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="text-amber-500" size={28} />
                    Task Routing Matrix
                  </h2>
                  <p className="text-slate-500 mt-1">Configure which AI provider handles specific system tasks.</p>
                </div>
                <div className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <Shield size={14} />
                  Admin Override Active
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'chat', label: 'Student Chat (Q&A)', icon: Bot, recommended: 'groq', desc: 'Real-time conversational assistance.' },
                  { id: 'quiz', label: 'Quiz Generation', icon: Trophy, recommended: 'groq', desc: 'Creating assessments and practice questions.' },
                  { id: 'lesson', label: 'Lesson Content', icon: BookOpen, recommended: 'mistral', desc: 'Writing detailed educational modules.' },
                  { id: 'rag', label: 'Knowledge Retrieval', icon: Database, recommended: 'gemini', desc: 'Searching and summarizing internal documents.' },
                  { id: 'vision', label: 'Vision Processing', icon: Search, recommended: 'gemini', desc: 'Analyzing images and handwritten notes.' }
                ].map((task) => (
                  <div key={task.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-sm">
                        <task.icon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white">{task.label}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                            Recommended: {task.recommended}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{task.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateRoutingConfig(task.id, task.recommended)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border border-indigo-200 dark:border-indigo-800"
                      >
                        Use Recommended
                      </button>
                      <div className="flex items-center gap-2">
                        {['gemini', 'groq', 'mistral'].map((provider) => (
                          <button
                            key={provider}
                            onClick={() => updateRoutingConfig(task.id, provider)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                              routingConfig[task.id as keyof typeof routingConfig] === provider
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                                : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {provider}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'communications' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Globe className="text-blue-500" size={24} />
                Global System Notification
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                This message will appear as a banner on the dashboard of every student currently using the platform.
              </p>
              <div className="space-y-4">
                <textarea 
                  placeholder="Type your global announcement here..." 
                  value={notificationText}
                  onChange={(e) => setNotificationText(e.target.value)}
                  className="w-full h-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Optional: WhatsApp Channel Link</label>
                  <input 
                    type="url"
                    placeholder="https://chat.whatsapp.com/..." 
                    value={whatsappLink}
                    onChange={(e) => setWhatsappLink(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={handleSendNotification}
                    disabled={isSendingNotification || !notificationText}
                    className="px-8 py-3 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSendingNotification ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                    Broadcast to All Students
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <FileText className="text-emerald-500" size={24} />
                Direct Email Communication
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Send a branded personal email to a specific student.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Email (Recipient)</label>
                    <input 
                      type="email"
                      placeholder="student@example.com" 
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sender Name (Branding)</label>
                    <input 
                      type="text"
                      placeholder="UniAce Team" 
                      value={emailFromName}
                      onChange={(e) => setEmailFromName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subject Line</label>
                  <input 
                    type="text"
                    placeholder="Important Update Regarding Your Account" 
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Body (HTML supported)</label>
                  <textarea 
                    placeholder="Hi student, we noticed you've been doing great in your courses..." 
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full h-48 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !emailTo || !emailSubject || !emailBody}
                    className="px-8 py-3 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSendingEmail ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                    Send Branded Email
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Clock className="text-amber-500" size={24} />
                Trial Expiration Reminder
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Send a pre-formatted reminder to students whose 7-day trial is ending.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Email</label>
                  <input 
                    type="email"
                    placeholder="student@example.com" 
                    id="reminder-email"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Name</label>
                  <input 
                    type="text"
                    placeholder="Scholar Name" 
                    id="reminder-name"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Days Left</label>
                  <select 
                    id="reminder-days"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="1">1 Day Left</option>
                    <option value="2">2 Days Left</option>
                    <option value="3">3 Days Left</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={async () => {
                    const email = (document.getElementById('reminder-email') as HTMLInputElement).value;
                    const name = (document.getElementById('reminder-name') as HTMLInputElement).value;
                    const days = (document.getElementById('reminder-days') as HTMLSelectElement).value;
                    
                    if (!email || !name) {
                      showToast('Please provide email and name', 'error');
                      return;
                    }

                    setIsSendingEmail(true);
                    try {
                      const idToken = await auth.currentUser?.getIdToken();
                      const res = await fetch('/api/admin/send-reminder', {
                        method: 'POST',
                        headers: { 
                          'Authorization': `Bearer ${idToken}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ to: email, displayName: name, daysLeft: parseInt(days) })
                      });
                      if (res.ok) {
                        showToast('Reminder sent successfully!', 'success');
                      } else {
                        showToast('Failed to send reminder', 'error');
                      }
                    } catch (err) {
                      showToast('Error sending reminder', 'error');
                    } finally {
                      setIsSendingEmail(false);
                    }
                  }}
                  disabled={isSendingEmail}
                  className="px-8 py-3 rounded-2xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSendingEmail ? <Loader2 size={20} className="animate-spin" /> : <Clock size={20} />}
                  Send Trial Reminder
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="text-purple-500" size={24} />
                  Struggle Analytics
                </h3>
                <button 
                  onClick={fetchStruggleAnalytics}
                  className="text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={14} className={isLoadingAnalytics ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                This tracks how many students click "Explain Simpler" on specific lessons. High counts indicate content that may be too difficult.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Lesson / Topic</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Module</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Struggle Count</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Triggered</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {isLoadingAnalytics ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">Loading analytics...</td>
                      </tr>
                    ) : struggleAnalytics.length > 0 ? (
                      struggleAnalytics.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="py-4">
                            <div className="font-bold text-slate-900 dark:text-white">{item.subTopicTitle}</div>
                            <div className="text-xs text-slate-400 font-mono">{item.subTopicId}</div>
                          </td>
                          <td className="py-4 text-slate-600 dark:text-slate-300">{item.moduleTitle}</td>
                          <td className="py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              item.count > 10 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                              item.count > 5 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {item.count} Requests
                            </span>
                          </td>
                          <td className="py-4 text-slate-500 text-xs">
                            {item.lastTriggered ? (
                              item.lastTriggered._seconds ? 
                                new Date(item.lastTriggered._seconds * 1000).toLocaleString() :
                                new Date(item.lastTriggered).toLocaleString()
                            ) : 'N/A'}
                          </td>
                          <td className="py-4 text-right">
                            <button 
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 justify-end ml-auto"
                              onClick={() => showToast(`AI Rewrite feature for ${item.subTopicTitle} coming soon!`, 'info')}
                            >
                              <Bot size={14} />
                              AI Rewrite
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">No struggle data recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Shield className="text-purple-500" size={24} />
                System Health & Logs
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
                    <div className="text-xs font-bold text-emerald-600 uppercase mb-1">Database</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Operational</div>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
                    <div className="text-xs font-bold text-emerald-600 uppercase mb-1">AI Engine</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Operational</div>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-2xl">
                    <div className="text-xs font-bold text-amber-600 uppercase mb-1">RAG Index</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Optimizing...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{confirmModal.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className="px-6 py-2 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce-in ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' :
          toast.type === 'error' ? 'bg-red-600 text-white' :
          'bg-slate-900 text-white'
        }`}>
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <AlertCircle size={20} />}
          <span className="font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
