import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
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
  completed: boolean
): Promise<void> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const path = `users/${userId}/dailyFocusSessions/${date}`;
  try {
    const sessionRef = doc(db, path);
    // Fetch and update the item inside the array
    // To handle array update safely with onSnapshot, we first obtain or rely on snapshot,
    // or run a quick transaction/update. Since it's a small app, we can perform a transaction/update:
    // We will do a local read-then-write or update with standard fetch.
    // However, to prevent complex race conditions, we can update the items list.
    // Let's use a Firestore transaction or dynamic path update. Let's do a transaction:
    const { runTransaction } = await import('firebase/firestore');
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(sessionRef);
      if (!sfDoc.exists()) return;

      const data = sfDoc.data() as DailyFocusSession;
      const updatedItems = data.items.map(item => {
        if (item.id === itemId) {
          return { ...item, isCompleted: completed };
        }
        return item;
      });

      const totalTasks = updatedItems.length;
      const completedTasks = updatedItems.filter(i => i.isCompleted).length;

      transaction.update(sessionRef, {
        items: updatedItems,
        totalTasks,
        completedTasks
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Listen to the daily focus session in real-time
export const listenToDailySession = (
  date: string,
  onUpdate: (session: DailyFocusSession | null) => void
): (() => void) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    onUpdate(null);
    return () => {};
  }

  const path = `users/${userId}/dailyFocusSessions/${date}`;
  const sessionRef = doc(db, path);

  return onSnapshot(
    sessionRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as DailyFocusSession);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error("Error listening to daily focus session:", error);
    }
  );
};
