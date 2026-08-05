import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, query, orderBy, updateDoc } from 'firebase/firestore';
import { SubjectData, PriorityLevel } from '../../types';

const recordActivityHistory = (subject: SubjectData): SubjectData => {
  const today = new Date();
  const dateKey = `${today.getMonth() + 1}/${today.getDate()}`; // format 'M/D'
  const isoDate = today.toISOString().split('T')[0];

  const modules = subject.modules || [];
  
  // Count how many topics are currently completed
  const totalCompleted = modules.reduce((acc, mod) => 
    acc + (mod.topics?.filter(t => t.completed).length || 0), 0);

  // Count remaining modules
  const remainingModules = modules.filter(m => {
    if (!m.topics || m.topics.length === 0) return true;
    return m.topics.some(t => !t.completed);
  }).length;

  // Calculate days remaining
  let daysRemaining = 0;
  if (subject.deadline) {
    const targetDate = new Date(subject.deadline);
    if (!isNaN(targetDate.getTime())) {
      const todayZero = new Date();
      todayZero.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      const diffTime = targetDate.getTime() - todayZero.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
  }

  const existingHistory = subject.activityHistory ? [...subject.activityHistory] : [];
  
  // Find if we already have an entry for today (either by dateKey or isoDate)
  const todayEntryIndex = existingHistory.findIndex(h => h.date === dateKey || h.date === isoDate);

  const newEntry = {
    date: dateKey,
    topicsCovered: totalCompleted,
    remainingModules,
    daysRemaining
  };

  if (todayEntryIndex > -1) {
    existingHistory[todayEntryIndex] = {
      ...existingHistory[todayEntryIndex],
      ...newEntry
    };
  } else {
    existingHistory.push(newEntry);
  }

  // Keep only the last 10 days
  const trimmedHistory = existingHistory.slice(-10);

  return {
    ...subject,
    activityHistory: trimmedHistory
  };
};

export const syncSubjectToFirebase = async (subject: SubjectData) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.warn("Attempted to save subject, but no user is authenticated. Firebase Auth may still be initializing.");
    return;
  }

  // Automatically update 10-day activity history before syncing to Firestore
  const updatedSubject = recordActivityHistory(subject);

  // Sanitize the subject object to remove undefined properties which Firestore does not support
  const sanitizedSubject = JSON.parse(JSON.stringify(updatedSubject));

  const path = `users/${userId}/subjects/${updatedSubject.id}`;
  try {
    const subjectRef = doc(db, path);
    await setDoc(subjectRef, sanitizedSubject, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const updateSubjectPriority = async (subjectId: string, priority: PriorityLevel) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.warn("Attempted to update subject priority, but no user is authenticated.");
    return;
  }

  const path = `users/${userId}/subjects/${subjectId}`;
  try {
    const subjectRef = doc(db, path);
    await updateDoc(subjectRef, { priority });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const updateSubjectTaskType = async (subjectId: string, taskType: 'DAILY' | 'CODE' | 'STUDY') => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.warn("Attempted to update subject taskType, but no user is authenticated.");
    return;
  }

  const path = `users/${userId}/subjects/${subjectId}`;
  try {
    const subjectRef = doc(db, path);
    await updateDoc(subjectRef, { taskType });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteSubjectFromFirebase = async (subjectId: string) => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.warn("Attempted to delete subject, but no user is authenticated.");
    return;
  }

  const path = `users/${userId}/subjects/${subjectId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToSubjects = (callback: (subjects: SubjectData[]) => void) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return () => {};

  const subjectsRef = collection(db, `users/${userId}/subjects`);
  const q = query(subjectsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const subjects = snapshot.docs.map(doc => doc.data() as SubjectData);
    callback(subjects);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/subjects`);
  });
};
