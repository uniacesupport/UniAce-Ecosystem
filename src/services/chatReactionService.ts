import { 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { MessageReaction } from '../types';

export interface ReactionState {
  tallies: { [emoji: string]: number };
  userReactions: string[];
}

/**
 * Toggles a reaction for a given message and student.
 * Persists to Firestore doc: `message_reactions/${messageId}_${userId}_${encodeURIComponent(emoji)}`
 * And updates/syncs with backend API.
 */
export async function toggleMessageReaction(
  messageId: string,
  emoji: string,
  userId: string,
  courseId?: string
): Promise<{ active: boolean; tallies: { [emoji: string]: number }; userReactions: string[] }> {
  if (!messageId || !emoji || !userId) {
    throw new Error('Message ID, emoji, and User ID are required to react.');
  }

  // Sanitize doc ID for firestore
  const cleanEmojiCode = encodeURIComponent(emoji);
  const reactionDocId = `${messageId}_${userId}_${cleanEmojiCode}`;
  const reactionRef = doc(db, 'message_reactions', reactionDocId);

  try {
    const existingSnap = await getDoc(reactionRef);
    let isActive = false;

    if (existingSnap.exists()) {
      // Remove reaction
      await deleteDoc(reactionRef);
      isActive = false;
    } else {
      // Add reaction
      await setDoc(reactionRef, {
        messageId,
        userId,
        emoji,
        courseId: courseId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      isActive = true;
    }

    // Also notify server endpoint in background for analytics & cache sync
    if (auth.currentUser) {
      auth.currentUser.getIdToken().then(token => {
        fetch('/api/chat/reaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            messageId,
            emoji,
            action: isActive ? 'add' : 'remove',
            courseId
          })
        }).catch(err => console.warn('Server reaction sync notice:', err));
      }).catch(() => {});
    }

    // Fetch updated tallies
    const current = await getMessageReactions(messageId, userId);
    return {
      active: isActive,
      tallies: current.tallies,
      userReactions: current.userReactions
    };
  } catch (error) {
    console.error('Error in toggleMessageReaction:', error);
    // Fallback via server API
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/chat/reaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messageId,
          emoji,
          action: 'toggle',
          courseId
        })
      });
      if (res.ok) {
        const data = await res.json();
        return {
          active: data.active,
          tallies: data.tallies || {},
          userReactions: data.userReactions || []
        };
      }
    }
    throw error;
  }
}

/**
 * Retrieves all reactions for a given message ID and current user.
 */
export async function getMessageReactions(
  messageId: string, 
  userId?: string
): Promise<ReactionState> {
  if (!messageId) {
    return { tallies: {}, userReactions: [] };
  }

  try {
    const q = query(
      collection(db, 'message_reactions'), 
      where('messageId', '==', messageId)
    );
    const snap = await getDocs(q);

    const tallies: { [emoji: string]: number } = {};
    const userReactions: string[] = [];

    snap.forEach(docSnap => {
      const data = docSnap.data() as MessageReaction;
      const emoji = data.emoji;
      if (emoji) {
        tallies[emoji] = (tallies[emoji] || 0) + 1;
        if (userId && data.userId === userId && !userReactions.includes(emoji)) {
          userReactions.push(emoji);
        }
      }
    });

    return { tallies, userReactions };
  } catch (error) {
    console.warn('Error fetching message reactions from Firestore:', error);
    return { tallies: {}, userReactions: [] };
  }
}

/**
 * Real-time listener for reactions on a specific message.
 */
export function subscribeToMessageReactions(
  messageId: string,
  userId: string | undefined,
  callback: (state: ReactionState) => void
): () => void {
  if (!messageId) {
    callback({ tallies: {}, userReactions: [] });
    return () => {};
  }

  try {
    const q = query(
      collection(db, 'message_reactions'),
      where('messageId', '==', messageId)
    );

    return onSnapshot(q, (snapshot) => {
      const tallies: { [emoji: string]: number } = {};
      const userReactions: string[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data() as MessageReaction;
        const emoji = data.emoji;
        if (emoji) {
          tallies[emoji] = (tallies[emoji] || 0) + 1;
          if (userId && data.userId === userId && !userReactions.includes(emoji)) {
            userReactions.push(emoji);
          }
        }
      });

      callback({ tallies, userReactions });
    }, (err) => {
      console.warn('Message reactions onSnapshot error:', err);
    });
  } catch (err) {
    console.warn('Failed to subscribe to message reactions:', err);
    return () => {};
  }
}
