import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Brain, Trophy, Rocket, CheckCircle2, ArrowRight, Play, X, Mail, Lock, Loader2, AlertCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LandingPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  
  // Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (isSignUp && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName.trim() || undefined);
        toast.success('Account created successfully! Welcome to UniAce.');
      } else {
        await signInWithEmail(email, password);
        toast.success('Successfully logged in!');
      }
      setIsLoginModalOpen(false);
    } catch (err: any) {
      console.error('Email auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMessage('Invalid email or password. If you don\'t have an account yet, switch to "Create Account".');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('An account with this email already exists. Please switch to "Sign In".');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Password is too weak. Please use at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email address.');
      } else {
        setErrorMessage(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      setIsLoginModalOpen(false);
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrorMessage(err.message || 'Google sign-in could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans selection:bg-emerald-100 selection:text-emerald-900 transition-colors">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-50 border-b border-slate-100 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-none text-2xl">
              🎓
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">UniAce</span>
          </div>
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="px-6 py-2.5 text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl transition-all"
          >
            Log In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              Ace Your Hardest Courses <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                with Premium AI Tutoring
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-500 dark:text-zinc-400 leading-relaxed max-w-lg">
              Master complex science formulas and theories in half the time. 
              Your personalized, 24/7 intelligent study companion is here.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full">
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-base sm:text-lg hover:bg-emerald-400 hover:scale-[1.02] transition-all shadow-xl shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2 group w-full"
              >
                Get 7-Day Premium Access
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400">No credit card required. Cancel anytime.</p>

            <div className="pt-8 grid grid-cols-3 gap-4 text-sm text-slate-600 dark:text-zinc-400 font-medium">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Brain size={24} />
                </div>
                <span>Personalized AI Tutoring</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Rocket size={24} />
                </div>
                <span>Smart Progress Tracking</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <span>Verified & Expert-Vetted Content</span>
              </div>
            </div>

            <div className="pt-8 flex items-center gap-4 text-sm text-slate-400 dark:text-zinc-500 font-medium">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-900 bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-lg font-black text-slate-900 dark:text-white">10k+ Learners</p>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl -z-10" />
            
            {/* Main App Preview Card */}
            <div className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-zinc-800 p-6 rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
              <div className="absolute -top-6 -right-6 bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-zinc-700 animate-bounce [animation-duration:3s]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase">Current Streak</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">12 Days 🔥</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-950 rounded-3xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                      <Brain size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">AI Tutor</h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-500">Online</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-zinc-800 max-w-[80%]">
                    <p className="text-sm text-slate-600 dark:text-zinc-300">Here's a practice problem for Calculus II. Ready to solve it?</p>
                  </div>
                  <div className="bg-slate-900 dark:bg-emerald-600 p-4 rounded-2xl rounded-tr-none shadow-sm text-white ml-auto max-w-[80%]">
                    <p className="text-sm">Yes, let's do it! 🚀</p>
                  </div>
                </div>

                <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-emerald-500 rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white dark:bg-zinc-900 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4">Everything you need to excel</h2>
            <p className="text-slate-500 dark:text-zinc-400 text-base sm:text-lg">Stop struggling with textbooks. Get an intelligent study companion that adapts to your learning style.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Powered Tutoring",
                desc: "Get instant answers, step-by-step explanations, and personalized study plans generated by advanced AI.",
                color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
              },
              {
                icon: Trophy,
                title: "Competitive Arena",
                desc: "Challenge friends or random opponents to real-time quiz battles. Climb the leaderboard and earn badges.",
                color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
              },
              {
                icon: Rocket,
                title: "Smart Progress Tracking",
                desc: "Visualize your mastery of every topic. Identify weak spots and focus your study time where it matters most.",
                color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 hover:shadow-xl hover:shadow-slate-100/50 dark:hover:shadow-none transition-all"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20" />
          
          <div className="relative z-10 space-y-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Ready to boost your grades?
            </h2>
            <p className="text-slate-400 text-lg sm:text-xl max-w-xl mx-auto">
              Join the community of students mastering their subjects with UniAce today. Claim your premium access.
            </p>
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="px-10 py-5 bg-emerald-500 text-white rounded-2xl font-bold text-lg sm:text-xl hover:bg-emerald-400 hover:scale-105 transition-all shadow-lg shadow-emerald-500/25"
            >
              Get 7-Day Premium Access
            </button>
            <p className="text-sm text-slate-500">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-xl">
              🎓
            </div>
            <span className="font-bold text-slate-900 dark:text-white">UniAce</span>
          </div>
          <p className="text-slate-400 dark:text-zinc-500 text-sm">© 2024 UniAce Mastery Hub. All rights reserved.</p>
        </div>
      </footer>

      {/* Unified Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-md p-8 border border-slate-200 dark:border-zinc-800 shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setErrorMessage('');
                }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                  🎓
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to UniAce</h3>
                <p className="text-slate-500 text-xs mt-1">Access your personalized university AI tutoring hub.</p>
              </div>

              {/* Social Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-60 shadow-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>

              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">or email</span>
                <div className="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 mb-4 bg-slate-100 dark:bg-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMessage('');
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    !isSignUp 
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm' 
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMessage('');
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    isSignUp 
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm' 
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3.5">
                {isSignUp && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@university.edu"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSignUp ? "At least 6 characters" : "Enter password"}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-xs font-semibold bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200 dark:border-red-900/40">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">{errorMessage}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                    </>
                  ) : (
                    <span>{isSignUp ? 'Create Scholar Account' : 'Sign In with Email'}</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
