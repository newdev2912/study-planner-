import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { doc, setDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { DailyFocusSession, StagedFocusItem } from '../../types';

// Commit/overwrite daily focus session inside users/{userId}/dailyFocusSessions/{date}
export const commitDailySession = async (date: string, items: StagedFocusItem[]): Promise<void> => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.warn("Attempted to commit daily session, but no user is authenticated.");
    return;
  }

  const path = `users/${userId}/dailyFocusSessions/${date}`;
  try {
    const sessionRef = doc(db, path);
    const totalTasks = items.length;
    const completedTasks = items.filter(i => i.isCompleted).length;

    const sessionData: DailyFocusSession = {
      date,
      items,
      isActive: totalTasks > 0,
      totalTasks,
      completedTasks
    };

    await setDoc(sessionRef, sessionData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Toggle completed status of an item inside the daily focus session
export const toggleCompletedStagedItem = async (
  date: string,
  itemId: string,
  completed: boolean,
  itemToAdd?: StagedFocusItem
): Promise<void> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const path = `users/${userId}/dailyFocusSessions/${date}`;
  try {
    const sessionRef = doc(db, path);
    const snapshot = await getDoc(sessionRef);
    
    let updatedItems: StagedFocusItem[] = [];
    if (snapshot.exists()) {
      const data = snapshot.data() as DailyFocusSession;
      let found = false;
      updatedItems = (data.items || []).map(item => {
        if (item.id === itemId) {
          found = true;
          return { ...item, isCompleted: completed, isStaged: true };
        }
        return item;
      });

      if (!found && itemToAdd) {
        updatedItems.push({ ...itemToAdd, isCompleted: completed, isStaged: true });
      }
    } else if (itemToAdd) {
      updatedItems = [{ ...itemToAdd, isCompleted: completed, isStaged: true }];
    }

    const totalTasks = updatedItems.length;
    const completedTasks = updatedItems.filter(i => i.isCompleted).length;

    await setDoc(sessionRef, {
      items: updatedItems,
      totalTasks,
      completedTasks,
      date,
      isActive: totalTasks > 0
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Toggle completed status of multiple items inside the daily focus session in batch
export const toggleMultipleStagedItems = async (
  date: string,
  itemIds: string[],
  completed: boolean,
  fallbackItems?: StagedFocusItem[]
): Promise<void> => {
  const userId = auth.currentUser?.uid;
  if (!userId || (itemIds.length === 0 && (!fallbackItems || fallbackItems.length === 0))) return;

  const path = `users/${userId}/dailyFocusSessions/${date}`;
  try {
    const sessionRef = doc(db, path);
    const snapshot = await getDoc(sessionRef);
    let updatedItems: StagedFocusItem[] = [];

    if (snapshot.exists()) {
      const data = snapshot.data() as DailyFocusSession;
      updatedItems = (data.items || []).map(item => {
        if (itemIds.includes(item.id)) {
          return { ...item, isCompleted: completed, isStaged: true };
        }
        return item;
      });
    }

    if (fallbackItems && fallbackItems.length > 0) {
      fallbackItems.forEach(fi => {
        if (!updatedItems.find(i => i.id === fi.id)) {
          updatedItems.push({ ...fi, isCompleted: completed, isStaged: true });
        }
      });
    }

    if (updatedItems.length === 0) return;

    const totalTasks = updatedItems.length;
    const completedTasks = updatedItems.filter(i => i.isCompleted).length;

    await setDoc(sessionRef, {
      items: updatedItems,
      totalTasks,
      completedTasks,
      date,
      isActive: totalTasks > 0
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Listen to the daily focus session in real-time
export const listenToDailySession = (
  date: string,
  onUpdate: (session: DailyFocusSession | null) => void
): (() => void) => {
  let unsubscribeSnapshot: (() => void) | null = null;

  const unsubscribeAuth = auth.onAuthStateChanged((user) => {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }

    if (!user) {
      onUpdate(null);
      return;
    }

    const path = `users/${user.uid}/dailyFocusSessions/${date}`;
    const sessionRef = doc(db, path);

    unsubscribeSnapshot = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as DailyFocusSession);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        if (error.code === 'permission-denied') {
          console.warn("Daily focus session listener permission pending auth sync.");
        } else {
          console.error("Error listening to daily focus session:", error);
        }
      }
    );
  });

  return () => {
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    unsubscribeAuth();
  };
};
