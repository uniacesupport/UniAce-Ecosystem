import { View } from '../types';

export interface DemoStep {
  id: string;
  view: View;
  durationMs: number;
  title: string;
  subtitle: string;
  badge: string;
  simulatedQuery?: string;
  highlightSelector?: string;
}

export interface DemoScenario {
  id: string;
  name: string;
  tagline: string;
  totalDurationSec: number;
  recommendedFor: string[];
  aspectRatioHint: '16:9 Landscape' | '9:16 Vertical Reel' | '1:1 Square';
  steps: DemoStep[];
  captions: {
    twitter: string;
    linkedin: string;
    tiktok: string;
    whatsapp: string;
  };
}

export const DEMO_SCENARIOS: Record<string, DemoScenario> = {
  full_ecosystem: {
    id: 'full_ecosystem',
    name: '🌟 Complete University Platform Tour',
    tagline: 'Comprehensive showcase of the entire academic ecosystem',
    totalDurationSec: 40,
    recommendedFor: ['YouTube', 'LinkedIn', 'Institutional Partners', 'Investor Pitch'],
    aspectRatioHint: '16:9 Landscape',
    steps: [
      {
        id: 'step_hub',
        view: 'hub',
        durationMs: 7000,
        title: 'Curriculum & Department Hub',
        subtitle: 'Dynamic navigation across departments, semesters & accredited courses',
        badge: 'Accredited STEM'
      },
      {
        id: 'step_dashboard',
        view: 'dashboard',
        durationMs: 6000,
        title: 'Student Performance & XP Engine',
        subtitle: 'Live study streaks, mastery radar, and adaptive difficulty tracking',
        badge: 'Adaptive Analytics'
      },
      {
        id: 'step_syllabus',
        view: 'course-syllabus',
        durationMs: 6000,
        title: 'Structured University Modules',
        subtitle: '10-module deep syllabus with self-healing curriculum integrity',
        badge: 'Curriculum Integrity'
      },
      {
        id: 'step_ai_tutor',
        view: 'ai-tutor',
        durationMs: 9000,
        title: 'AI Academic Companion with KaTeX',
        subtitle: 'Live interactive university tutor with rigorous math proofs & voice synthesis',
        badge: 'Multi-Model Fallback',
        simulatedQuery: 'Explain Maxwell\'s equations and derive electromagnetic wave velocity $c = \\frac{1}{\\sqrt{\\mu_0 \\epsilon_0}}$'
      },
      {
        id: 'step_quizzes',
        view: 'quizzes',
        durationMs: 7000,
        title: 'Smart Practice Quiz Engine',
        subtitle: 'Instant active-recall testing with dynamic difficulty scaling',
        badge: 'Active Recall'
      },
      {
        id: 'step_mastery',
        view: 'mastery',
        durationMs: 5000,
        title: 'Mastery Retention & Concept Map',
        subtitle: 'Visual retention tracking and personalized exam readiness scores',
        badge: 'Mastery Retention'
      }
    ],
    captions: {
      twitter: `🎓 Meet UniAce: The next-generation AI Academic Ecosystem for University Students!
✨ Real-time AI STEM Tutor with KaTeX mathematical proofs
⚡ Multi-provider AI fallback (NVIDIA NIM, Groq, Gemini)
📊 Adaptive course mastery & smart quizzes
🔗 Try it live: https://uniace.app #EdTech #AI #STEM #University #HigherEd`,
      linkedin: `Proud to showcase UniAce Mastery Hub — an end-to-end academic learning ecosystem built for university students and higher education institutions.

Key Capabilities:
🔹 Multi-Model AI Routing with circuit breakers (NVIDIA NIM, Groq Llama 3, Google Gemini)
🔹 Dynamic 10-Module Curriculums with KaTeX formula rendering
🔹 Real-Time Interactive Quizzes & Adaptive Retention Tracking
🔹 Zero-Latency Architecture built with React 18, Vite & Tailwind

#EdTech #ArtificialIntelligence #HigherEducation #STEMEducation #UniAce`,
      tiktok: `Studying university STEM just got 10x easier 🚀🤖 Watch how UniAce solves complex physics and math step-by-step with LaTeX formulas! #studentlife #collegehacks #aitools #studytok #stemmajor`,
      whatsapp: `🎓 Check out this demo of UniAce Mastery Hub! Real-time AI tutoring for university engineering and science courses with step-by-step solutions: https://uniace.app`
    }
  },
  ai_tutor_deepdive: {
    id: 'ai_tutor_deepdive',
    name: '🤖 AI Academic Tutor & Math Proofs',
    tagline: 'Spotlight on deep-reasoning AI tutoring with KaTeX LaTeX math',
    totalDurationSec: 22,
    recommendedFor: ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'X / Twitter'],
    aspectRatioHint: '9:16 Vertical Reel',
    steps: [
      {
        id: 'step_syllabus_intro',
        view: 'course-syllabus',
        durationMs: 4000,
        title: 'Select Complex Academic Topic',
        subtitle: 'Browsing University Engineering curriculum syllabus',
        badge: 'Syllabus Browser'
      },
      {
        id: 'step_ai_tutor_solve',
        view: 'ai-tutor',
        durationMs: 14000,
        title: 'Live Multi-Step Proof & Tutoring',
        subtitle: 'Generating step-by-step LaTeX derivation with conceptual analogies',
        badge: 'KaTeX & Multi-Model',
        simulatedQuery: 'Derive the time-dependent Schrödinger equation $\\hat{H}\\Psi = i\\hbar\\frac{\\partial}{\\partial t}\\Psi$ and explain its physical significance.'
      },
      {
        id: 'step_formulas',
        view: 'formulas',
        durationMs: 4000,
        title: 'Instant Formula Reference Library',
        subtitle: 'Verified academic equation reference for rapid problem solving',
        badge: 'KaTeX Formulas'
      }
    ],
    captions: {
      twitter: `Stuck on university math or physics? 🤯 Watch UniAce AI break down step-by-step derivations with LaTeX notation in seconds. 🚀 #MathTok #STEM #UniAce #College`,
      linkedin: `Accelerating STEM education through rigorous, interactive AI tutoring. UniAce generates verifiable step-by-step mathematical proofs with KaTeX typography. #EdTech #AI #Mathematics`,
      tiktok: `POV: You found the AI tutor that actually does college-level math and physics proofs with zero errors 🤯🔥 #collegelife #engineeringstudent #mathmajor #studytok #fyp`,
      whatsapp: `🚀 Watch this AI solve college-level math and physics step-by-step with formulas: https://uniace.app`
    }
  },
  quiz_sprint: {
    id: 'quiz_sprint',
    name: '⚡ Interactive Quiz & Mastery Sprint',
    tagline: 'High-energy active recall and exam readiness demo',
    totalDurationSec: 18,
    recommendedFor: ['TikTok', 'Instagram Stories', 'X / Twitter'],
    aspectRatioHint: '9:16 Vertical Reel',
    steps: [
      {
        id: 'step_quizzes_start',
        view: 'quizzes',
        durationMs: 9000,
        title: 'Smart Practice Quiz Engine',
        subtitle: 'Dynamic question bank with instant explanations & XP rewards',
        badge: 'Exam Prep'
      },
      {
        id: 'step_mastery_level',
        view: 'mastery',
        durationMs: 5000,
        title: 'Live Mastery Tracking',
        subtitle: 'Visual retention bars and concept mastery progression',
        badge: 'Adaptive Growth'
      },
      {
        id: 'step_arena',
        view: 'arena',
        durationMs: 4000,
        title: 'Student Arena & Daily Quests',
        subtitle: 'Gamified academic challenges and community leaderboards',
        badge: 'Gamification'
      }
    ],
    captions: {
      twitter: `Turn passive studying into active recall! ⚡ Practice with AI-generated university quizzes and track your mastery live on UniAce. 🎯 #StudyHacks #Student #EdTech`,
      linkedin: `Active recall and spaced repetition powered by AI. See how UniAce keeps university students engaged with smart quizzes and real-time mastery tracking. #LearningScience #EdTech`,
      tiktok: `Testing my knowledge before exams with AI-generated quizzes 📝⚡ +100 XP unlocked! #studymotivation #examszn #collegeexam #studytok`,
      whatsapp: `🎯 Practice university quizzes and track your mastery with UniAce: https://uniace.app`
    }
  },
  quick_social: {
    id: 'quick_social',
    name: '🚀 15-Second Viral Teaser',
    tagline: 'Ultra-fast snappy cut perfect for social feeds',
    totalDurationSec: 15,
    recommendedFor: ['Instagram Reels', 'TikTok', 'YouTube Shorts'],
    aspectRatioHint: '9:16 Vertical Reel',
    steps: [
      {
        id: 'step_hub_quick',
        view: 'hub',
        durationMs: 4000,
        title: 'University Learning Platform',
        subtitle: 'Full accredited course catalogue',
        badge: 'All Departments'
      },
      {
        id: 'step_ai_quick',
        view: 'ai-tutor',
        durationMs: 6000,
        title: 'Instant 24/7 AI STEM Tutor',
        subtitle: 'Step-by-step rigorous answers',
        badge: 'Instant AI'
      },
      {
        id: 'step_quiz_quick',
        view: 'quizzes',
        durationMs: 5000,
        title: 'Master Every Course',
        subtitle: 'Smart quizzes and XP leaderboard',
        badge: 'Get Ahead'
      }
    ],
    captions: {
      twitter: `Ace your university exams with UniAce 🎓 24/7 AI Tutor, smart quizzes & curated syllabi in one hub. Try now: https://uniace.app 🚀 #University #StudentTools`,
      linkedin: `Transforming university student success with personalized AI tutoring and continuous mastery feedback. Explore UniAce today. #EdTech #Innovation`,
      tiktok: `The ultimate university study hack you didn't know existed 🎓✨ Link in bio to try UniAce! #collegetips #freshmanadvice #aitools #studytok`,
      whatsapp: `🎓 Try UniAce Hub for free — your 24/7 university study companion: https://uniace.app`
    }
  }
};
