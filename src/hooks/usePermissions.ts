import { UserProfile } from '../types';

export const usePermissions = (user: UserProfile | null) => {
  const role = user?.role || 'student';

  return {
    role,
    isAdmin: role === 'admin',
    isTutor: role === 'tutor' || role === 'admin',
    isModerator: role === 'moderator' || role === 'admin',
    isStudent: role === 'student',
    
    canManageCourses: role === 'admin' || role === 'tutor',
    canUseAI: role === 'admin' || role === 'tutor',
    canManageUsers: role === 'admin' || role === 'moderator',
    canViewLogs: role === 'admin',
    canManageSystem: role === 'admin',
    canCommunicate: role === 'admin' || role === 'moderator',
    canManageCurriculum: role === 'admin' || role === 'tutor',
  };
};
