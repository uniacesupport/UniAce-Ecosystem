import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, browserPopupRedirectResolver, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import toast from "react-hot-toast";
import { auth, db, messaging } from "../firebase";
import { LogService } from "../services/logService";
import { PlanType } from "../types";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  bio?: string;
  photoURL: string;
  role: 'student' | 'admin' | 'tutor' | 'moderator';
  fcmToken?: string;
  plan_type: PlanType;
  subscription_expiry?: string;
  subscription_start_date?: string;
  subscription_status?: 'active' | 'expired' | 'none';
  ai_sparks: number;
  xp: number;
  level: number;
  streak: number;
  themeColor?: string;
  rank?: number;
  created_at?: string;
  sessionId?: string;
  admin_pin_verified_until?: any;
  department?: string;
  faculty?: string;
  academic_level?: string;
  semester?: string;
  learningProfile?: {
    strengths: string[];
    weaknesses: string[];
    lastUpdated: string;
    fastMode?: boolean;
  };
  has_seen_whatsapp?: boolean;
  referralCode?: string;
  referredBy?: string;
  referral_count?: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [currentSessionId] = useState(() => Math.random().toString(36).substring(2, 15));
  const activeSessionIdRef = React.useRef<string | null>(null);
  const userIdRef = React.useRef<string | null>(null);

  const syncUserProfile = async (currentUser: User) => {
    if (!db) return;
    console.log("AuthContext: Syncing user profile for", currentUser.uid);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      
      // Use a timeout for getDoc to prevent hanging
      const userDocPromise = getDoc(userRef);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Firestore getDoc timeout")), 8000)
      );
      
      const userDoc = await Promise.race([userDocPromise, timeoutPromise]) as any;

      let userRole: 'student' | 'admin' | 'editor' = 'student';
      
      // Default admin emails
      const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',');
      if (currentUser.email && adminEmails.includes(currentUser.email)) {
        userRole = 'admin';
      }

      let plan_type = userDoc.exists() 
        ? (userDoc.data().plan_type || (userRole === 'admin' ? 'scholar' : 'free')) 
        : (userRole === 'admin' ? 'scholar' : 'free');

      let ai_sparks = userDoc.exists() ? (userDoc.data().ai_sparks ?? 0) : 0;
      let subscription_expiry = userDoc.exists() ? userDoc.data().subscription_expiry : undefined;
      let subscription_status = userDoc.exists() ? userDoc.data().subscription_status : 'none';
      let subscription_start_date = userDoc.exists() ? userDoc.data().subscription_start_date : undefined;

      // Fetch accurate quota from backend (Single Source of Truth)
      const fetchQuota = async (retries = 2) => {
        try {
          const token = await currentUser.getIdToken();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const response = await fetch('/api/user/quota', {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            ai_sparks = data.sparks;
            plan_type = data.plan;
            userRole = data.role;
            if (data.subscription_expiry) subscription_expiry = data.subscription_expiry;
            if (data.subscription_status) subscription_status = data.subscription_status;
            if (data.subscription_start_date) subscription_start_date = data.subscription_start_date;
            return true;
          } else if (retries > 0) {
            console.warn(`Quota fetch failed with status ${response.status}, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchQuota(retries - 1);
          }
          return false;
        } catch (err) {
          if (retries > 0) {
            console.warn("Quota fetch error, retrying...", err);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchQuota(retries - 1);
          }
          console.error("Failed to fetch quota from backend after retries", err);
          return false;
        }
      };

      await fetchQuota();

      let referralCode = userDoc.exists() ? userDoc.data().referralCode : undefined;
      let referredBy = userDoc.exists() ? userDoc.data().referredBy : undefined;

      if (!referralCode) {
        // Generate a 6-character referral code based on UID
        referralCode = currentUser.uid.substring(0, 6).toUpperCase();
      }

      if (!userDoc.exists() && !referredBy) {
        const storedRef = sessionStorage.getItem('ref_code');
        if (storedRef) {
          referredBy = storedRef;
          // Increment the affiliate refer code signups blindly via backend
          try {
            await fetch('/api/track-signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refCode: storedRef, newUserId: currentUser.uid })
            });
          } catch (e) {
            console.warn('Failed to increment referral count', e);
          }
        }
      }

      const profileData: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || "",
        displayName: currentUser.displayName || "Scholar",
        bio: userDoc.exists() ? userDoc.data().bio : undefined,
        photoURL: currentUser.photoURL || "",
        role: userRole,
        plan_type,
        subscription_expiry,
        subscription_status,
        subscription_start_date,
        ai_sparks,
        xp: userDoc.exists() ? (userDoc.data().xp || 0) : 0,
        level: userDoc.exists() ? (userDoc.data().level || 1) : 1,
        streak: userDoc.exists() ? (userDoc.data().streak || 0) : 0,
        themeColor: userDoc.exists() ? userDoc.data().themeColor : undefined,
        rank: userDoc.exists() ? userDoc.data().rank : undefined,
        created_at: userDoc.exists() ? (
          userDoc.data().createdAt?.toDate ? userDoc.data().createdAt.toDate().toISOString() : 
          (userDoc.data().createdAt || userDoc.data().created_at || new Date().toISOString())
        ) : new Date().toISOString(),
        sessionId: currentSessionId,
        admin_pin_verified_until: userDoc.exists() ? userDoc.data().admin_pin_verified_until : undefined,
        department: userDoc.exists() ? userDoc.data().department : undefined,
        academic_level: userDoc.exists() ? userDoc.data().academic_level : undefined,
        semester: userDoc.exists() ? userDoc.data().semester : undefined,
        learningProfile: userDoc.exists() ? userDoc.data().learningProfile : undefined,
        has_seen_whatsapp: userDoc.exists() ? userDoc.data().has_seen_whatsapp : false,
        referralCode,
        referredBy,
      };

      const dataToSave: any = {
        ...profileData,
        lastActive: serverTimestamp(),
        sessionId: currentSessionId,
      };
      
      // Ensure UID is present
      dataToSave.uid = currentUser.uid;
      
      // Do not overwrite backend-managed fields
      const protectedFields = [
        'ai_sparks', 
        'plan_type', 
        'role', 
        'subscription_expiry', 
        'subscription_status', 
        'subscription_start_date',
        'last_spark_reset',
        'last_payment_ref',
        'xp',
        'level'
      ];
      protectedFields.forEach(field => delete dataToSave[field]);
      
      // Remove undefined values to prevent Firebase errors
      Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]);

      // Await setDoc to ensure the sessionId is updated before onSnapshot is attached
      try {
        await setDoc(userRef, dataToSave, { merge: true });
        activeSessionIdRef.current = currentSessionId;
        console.log("AuthContext: User active status updated in Firestore");
      } catch (err) {
        console.error("Error updating user active status:", err);
      }

      LogService.log('info', 'user', `User logged in: ${profileData.displayName}`, { uid: profileData.uid, email: profileData.email }).catch(console.error);

      setProfile(profileData);
      console.log("AuthContext: Profile synced successfully");
      
      // Handle FCM Token in background
      (async () => {
        try {
          if ('Notification' in window && Notification.permission === 'granted') {
            const msg = await messaging();
            if (msg) {
              const token = await getToken(msg, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_PUBLIC_VAPID_KEY'
              });
              if (token) {
                await setDoc(userRef, { fcmToken: token }, { merge: true });
              }
            }
          }
        } catch (err) {
          console.log("FCM not supported or permission denied", err);
        }
      })();
    } catch (error) {
      console.error("Error syncing user profile:", error);
      // Even if sync fails, we should set a basic profile so the app can load
      if (!profile) {
        setProfile({
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || "Scholar",
          photoURL: currentUser.photoURL || "",
          role: 'student',
          plan_type: 'free',
          ai_sparks: 0,
          xp: 0,
          level: 1,
          streak: 0
        });
      }
    }
  };

  useEffect(() => {
    console.log("AuthContext: Initializing...");
    if (!auth) {
      console.warn("AuthContext: Firebase Auth not initialized");
      setLoading(false);
      return;
    }
    
    let profileUnsubscribe: () => void;
    let isMounted = true;

    // Safety timeout: Ensure loading is set to false even if Firebase hangs
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("AuthContext: Safety timeout reached, forcing loading to false");
        setLoading(false);
      }
    }, 20000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("AuthContext: Auth state changed", currentUser?.uid || "No user");
      if (!isMounted) return;

      // Only proceed if the user actually changed to avoid redundant syncs
      if (currentUser?.uid === userIdRef.current && currentUser !== null) {
        console.log("AuthContext: User unchanged, skipping sync");
        return;
      }
      userIdRef.current = currentUser?.uid || null;

      // Clear any existing profile listener before setting up a new one
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }

      setUser(currentUser);
      if (currentUser) {
        try {
          await syncUserProfile(currentUser);
          
          // Listen for real-time profile updates
          if (isMounted) {
            profileUnsubscribe = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
              if (docSnap.exists() && isMounted) {
                const data = docSnap.data() as UserProfile;
                
                // Single Session Enforcement: Check if another device logged in
                // Only enforce if we have already successfully set our own sessionId in Firestore
                // AND we are not currently in the middle of a sync
                if (activeSessionIdRef.current === currentSessionId && 
                    data.sessionId && 
                    data.sessionId !== currentSessionId) {
                  console.warn("AuthContext: New session detected elsewhere. Logging out...");
                  toast.error("Logged out: Your account is being used on another device.", {
                    duration: 6000,
                    icon: '🔒'
                  });
                  logout();
                  return;
                }

                setProfile((prev) => {
                  if (!prev) return prev;
                  return { ...prev, ...data } as UserProfile;
                });
              }
            }, (err) => {
              console.error("AuthContext: Profile snapshot error", err);
            });
          }
        } catch (err) {
          console.error("AuthContext: Error during auth state change handling", err);
        }
      } else {
        setProfile(null);
        if (profileUnsubscribe) profileUnsubscribe();
      }
      
      if (isMounted) {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(safetyTimeout);
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user || !profile || !db) return;
    try {
      const userRef = doc(db, "users", user.uid);
      
      const dataToSave = { ...data };
      Object.keys(dataToSave).forEach(key => (dataToSave as any)[key] === undefined && delete (dataToSave as any)[key]);
      
      await setDoc(userRef, dataToSave, { merge: true });
      setProfile({ ...profile, ...data });
    } catch (error) {
      console.error("Error updating profile data:", error);
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) {
      alert("Firebase is not configured. Please check your environment variables.");
      return;
    }
    if (isSigningIn) return; // Prevent multiple clicks

    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      console.log("AuthContext: Starting signInWithPopup...");
      await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      console.log("AuthContext: signInWithPopup completed successfully.");
    } catch (error: any) {
      console.error("Error signing in with Google", error);
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, ignore
        console.log('User closed the sign-in popup.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Another popup was opened, ignore
        console.log('Popup request cancelled.');
      } else if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        alert(
          `Unauthorized Domain: ${domain}\n\n` +
          `To fix this, you must add this domain to your Firebase project's "Authorized domains" list:\n\n` +
          `1. Go to Firebase Console > Authentication > Settings > Authorized domains\n` +
          `2. Add "${domain}" to the list.\n\n` +
          `Also add the shared URL domain if you plan to share the app.`
        );
      } else {
        alert(`Error signing in: ${error.message}`);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) {
      alert("Firebase is not configured. Please check your environment variables.");
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (!auth) return;
    try {
      const userEmail = user?.email;
      const userDisplayName = profile?.displayName;
      await signOut(auth);
      LogService.log('info', 'user', `User logged out: ${userDisplayName || userEmail || 'Unknown'}`).catch(console.error);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isConfigured: !!auth, signInWithGoogle, signInWithEmail, logout, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
