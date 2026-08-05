import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, doc, setDoc, deleteDoc, writeBatch, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Task } from '../../types';

export const syncTaskToFirebase = async (task: Task) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.warn("Attempted to save task, but no user is authenticated.");
    return;
  }

  // Sanitize the task object to remove undefined properties which Firestore does not support
  const sanitizedTask = JSON.parse(JSON.stringify(task));

  const path = `users/${userId}/tasks/${task.id}`;
  try {
    const taskRef = doc(db, path);
    await setDoc(taskRef, sanitizedTask, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const removeTaskFromFirebase = async (taskId: string) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.warn("Attempted to remove task, but no user is authenticated.");
    return;
  }

  const path = `users/${userId}/tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToTasks = (callback: (tasks: Task[]) => void) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.warn("Attempted to subscribe to tasks, but no user is authenticated.");
    return () => {};
  }

  const tasksRef = collection(db, `users/${userId}/tasks`);
  const q = query(tasksRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => doc.data() as Task);
    callback(tasks);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/tasks`);
  });
};

export const resetDailyRegularTasks = async (tasks: Task[]) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.warn("Attempted to reset daily tasks, but no user is authenticated.");
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const batch = writeBatch(db);
  let hasChanges = false;

  tasks.forEach(task => {
    if (task.type === 'regular' && task.lastResetDate !== todayStr) {
      const taskRef = doc(db, `users/${userId}/tasks`, task.id);
      batch.update(taskRef, { 
        completed: false, 
        isCompleted: false, 
        count: 0, 
        currentCount: 0, 
        lastResetDate: todayStr 
      });
      hasChanges = true;
    }
  });

  if (hasChanges) {
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/tasks (batch reset)`);
    }
  }
};
