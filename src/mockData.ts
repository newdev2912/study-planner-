import { StudyJourney, Task } from './types';

export const MOCK_JOURNEY: StudyJourney = {
  journey_title: "Fall Semester Mastery: Engineering & CS",
  current_milestone: "Midterm Season Preparation",
  total_estimated_days: 30,
  daily_tasks: [
    {
      id: "1",
      day_number: 1,
      subject: "Calculus",
      task_title: "Master Partial Derivatives",
      description: "Read Section 14.3 of Stewart's Calculus. Solve problems 1-15 odd. Focus on the geometric interpretation.",
      estimated_minutes: 60,
      xp_reward: 100,
      category: 'Practical Application',
      ai_daily_summary: "Today's focus is on multi-variable changes. Calculus is the foundation for your Physics simulations later this week.",
      journal_prompt: "What was the most challenging part of visualizing partial derivatives today?",
      completed: false
    },
    {
      id: "2",
      day_number: 1,
      subject: "Computer Science",
      task_title: "Implement AVL Tree Rotations",
      description: "Code the left and right rotation logic in C++. Test with a set of 10 random integers to ensure balance.",
      estimated_minutes: 90,
      xp_reward: 250,
      category: 'Boss Battle Project',
      ai_daily_summary: "CS tasks today transition from theory to hard implementation. Balance is key in trees and in your study schedule.",
      journal_prompt: "Explain how AVL rotations maintain O(log n) height in your own words.",
      completed: false
    },
    {
      id: "3",
      day_number: 1,
      subject: "Biology",
      task_title: "Summarize Cellular Respiration",
      description: "Create a flowchart for Glycolysis and the Krebs Cycle. Focus on ATP yield per glucose molecule.",
      estimated_minutes: 45,
      xp_reward: 50,
      category: 'Theory',
      ai_daily_summary: "Bio is your recovery subject today. High-level conceptual flowcharts will help you memorize the energy cycles.",
      journal_prompt: "Which step in the Krebs cycle do you find most difficult to recall?",
      completed: false
    }
  ]
};
