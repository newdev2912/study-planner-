import { db, auth } from '../firebase';
import { doc, setDoc, getDoc, collection, getDocs, increment, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { UserStats } from '../../types';

export interface DailyLog {
  dateStr: string;
  xpEarned: number;
  tasksCompleted: number;
  subjects: string[];
  hasDeadline?: boolean;
}

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export const getIsoDateStr = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Pure function to calculate current streak from a set of active date strings (YYYY-MM-DD)
 */
export const calculateStreakFromActiveDates = (activeDateStrings: Set<string>): number => {
  const today = new Date();
  const todayStr = getIsoDateStr(today);

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = getIsoDateStr(yesterday);

  let currentCheckDate: Date;

  if (activeDateStrings.has(todayStr)) {
    currentCheckDate = new Date(today);
  } else if (activeDateStrings.has(yesterdayStr)) {
    currentCheckDate = new Date(yesterday);
  } else {
    // Neither today nor yesterday had activity -> streak broken
    return 0;
  }

  let streak = 0;
  while (true) {
    const checkStr = getIsoDateStr(currentCheckDate);
    if (activeDateStrings.has(checkStr)) {
      streak++;
      currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Fetch all daily logs for a user from Firestore and compute the exact consecutive streak
 */
export const fetchAndCalculateStreak = async (userId: string): Promise<number> => {
  try {
    const logsRef = collection(db, 'users', userId, 'dailyLogs');
    const snapshot = await getDocs(logsRef);

    const activeDates = new Set<string>();
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const dateKey = docSnap.id; // YYYY-MM-DD
      const xp = data.xpEarned || 0;
      const tasks = data.tasksCompleted || 0;
      if (xp > 0 || tasks > 0) {
        activeDates.add(dateKey);
      }
    });

    return calculateStreakFromActiveDates(activeDates);
  } catch (err) {
    console.error("Error calculating streak from Firestore:", err);
    return 1; // Default fallback
  }
};

/**
 * Ensures user stats are initialized on login/registration with an active baseline
 */
export const ensureAndFetchUserStats = async (userId: string): Promise<UserStats> => {
  const statsRef = doc(db, 'users', userId);
  const statsSnap = await getDoc(statsRef);

  let stats: UserStats;

  if (statsSnap.exists()) {
    const data = statsSnap.data() as Partial<UserStats>;
    const streak = await fetchAndCalculateStreak(userId);

    const totalXP = data.totalXP !== undefined ? data.totalXP : 0;
    const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;
    const tasksCompleted = data.tasksCompleted !== undefined ? data.tasksCompleted : 0;

    stats = {
      totalXP,
      level,
      streak,
      tasksCompleted,
      lastActiveDate: new Date().toISOString(),
      focusGoal: data.focusGoal || "Master core coursework and maintain daily consistency",
      journalEntries: data.journalEntries || []
    };
  } else {
    // New user initial blank state
    stats = {
      totalXP: 0,
      level: 1,
      streak: 0,
      tasksCompleted: 0,
      lastActiveDate: new Date().toISOString(),
      focusGoal: "Master core coursework and maintain daily consistency",
      journalEntries: []
    };
  }

  // Update user doc in Firestore
  await setDoc(statsRef, stats, { merge: true });

  // Update user stats summary doc
  const summaryRef = doc(db, 'users', userId, 'userStats', 'summary');
  await setDoc(summaryRef, {
    totalXp: stats.totalXP,
    tasksDoneCount: stats.tasksCompleted,
    rankPoints: Math.floor(stats.totalXP / 10),
    streak: stats.streak,
    lastActive: serverTimestamp()
  }, { merge: true });

  return stats;
};

/**
 * Record or update daily task completion in Firestore and update streak & XP stats
 */
export const recordDailyTaskCompletion = async (
  xpGained: number,
  subjectName: string
): Promise<UserStats | null> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return null;

  const todayStr = getIsoDateStr();
  const logRef = doc(db, 'users', userId, 'dailyLogs', todayStr);

  // 1. Record daily log increment
  await setDoc(
    logRef,
    {
      dateStr: todayStr,
      xpEarned: increment(xpGained),
      tasksCompleted: increment(xpGained > 0 ? 1 : 0),
      subjects: arrayUnion(subjectName.toUpperCase()),
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  );

  // 2. Recalculate streak from all daily logs
  const updatedStreak = await fetchAndCalculateStreak(userId);

  // 3. Update overall user stats in root user doc
  const statsRef = doc(db, 'users', userId);
  const statsSnap = await getDoc(statsRef);
  let currentTotalXP = 250;
  let currentTasksCompleted = 2;
  let focusGoal = "Master core coursework and maintain daily consistency";
  let journalEntries: any[] = [];

  if (statsSnap.exists()) {
    const data = statsSnap.data() as Partial<UserStats>;
    currentTotalXP = Math.max(0, (data.totalXP || 0) + xpGained);
    currentTasksCompleted = Math.max(0, (data.tasksCompleted || 0) + (xpGained > 0 ? 1 : (xpGained < 0 ? -1 : 0)));
    if (data.focusGoal) focusGoal = data.focusGoal;
    if (data.journalEntries) journalEntries = data.journalEntries;
  } else {
    currentTotalXP = Math.max(0, 250 + xpGained);
    currentTasksCompleted = Math.max(0, 2 + (xpGained > 0 ? 1 : 0));
  }

  const level = Math.floor(Math.sqrt(currentTotalXP / 100)) + 1;

  const updatedStats: UserStats = {
    totalXP: currentTotalXP,
    level,
    streak: updatedStreak > 0 ? updatedStreak : 1,
    tasksCompleted: currentTasksCompleted,
    lastActiveDate: new Date().toISOString(),
    focusGoal,
    journalEntries
  };

  await setDoc(statsRef, updatedStats, { merge: true });

  // 4. Update userStats summary
  const summaryRef = doc(db, 'users', userId, 'userStats', 'summary');
  await setDoc(summaryRef, {
    totalXp: updatedStats.totalXP,
    tasksDoneCount: updatedStats.tasksCompleted,
    rankPoints: Math.floor(updatedStats.totalXP / 10),
    streak: updatedStats.streak,
    lastActive: serverTimestamp()
  }, { merge: true });

  return updatedStats;
};

/**
 * Populates sample realistic historical daily log documents into Firestore
 * for the past 5 months so the calendar heatmap renders populated data directly from Firestore.
 */
export const seedHistoricalDataInFirestore = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const now = new Date();
  const subjectsList = ['DSA', 'EVS', 'CIVICS', 'MATH', 'PHYSICS', 'CHEMISTRY', 'ALGORITHMS'];

  const batchPromises = [];

  // Generate logs for the last 150 days
  for (let d = 0; d < 150; d++) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() - d);
    const dateStr = targetDate.toISOString().split('T')[0];

    const dayNum = targetDate.getDate();
    const monthNum = targetDate.getMonth() + 1;
    const seed = (dayNum * 19 + monthNum * 31 + d * 7) % 100;

    let xpEarned = 0;
    let tasksCompleted = 0;
    let subjectsArr: string[] = [];

    if (seed > 30) {
      if (seed > 80) {
        // High activity (251+ XP)
        xpEarned = 260 + (seed % 140);
        tasksCompleted = 4 + (seed % 3);
      } else if (seed > 50) {
        // Medium activity (101-250 XP)
        xpEarned = 120 + (seed % 120);
        tasksCompleted = 2 + (seed % 2);
      } else {
        // Low activity (1-100 XP)
        xpEarned = 50 + (seed % 45);
        tasksCompleted = 1;
      }

      const primarySub = subjectsList[(dayNum + monthNum) % subjectsList.length];
      const secondarySub = subjectsList[(dayNum + monthNum + 2) % subjectsList.length];
      subjectsArr = [primarySub];
      if (tasksCompleted > 2) subjectsArr.push(secondarySub);
    }

    if (xpEarned > 0) {
      const logRef = doc(db, 'users', userId, 'dailyLogs', dateStr);
      batchPromises.push(
        setDoc(
          logRef,
          {
            dateStr,
            xpEarned,
            tasksCompleted,
            subjects: subjectsArr,
            lastUpdated: serverTimestamp()
          },
          { merge: true }
        )
      );
    }
  }

  await Promise.all(batchPromises);
};
