import { StudyJourney, Task, SubjectData } from './types';

export const DEFAULT_STARTER_SUBJECTS: SubjectData[] = [
  {
    id: "cs101",
    name: "Computer Science & Data Structures",
    priority: "high",
    taskType: "CODE",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    modules: [
      {
        id: "cs-m1",
        name: "Module 1: Linear Data Structures",
        topics: [
          { id: "cs-t1", title: "Implement Dynamic Array in C++", completed: false, selected: true },
          { id: "cs-t2", title: "Singly & Doubly Linked List Operations", completed: false, selected: true },
          { id: "cs-t3", title: "Stack & Queue Implementation using Arrays", completed: false, selected: true }
        ]
      },
      {
        id: "cs-m2",
        name: "Module 2: Trees & Graph Algorithms",
        topics: [
          { id: "cs-t4", title: "Binary Search Tree Insertion & Traversal", completed: false, selected: true },
          { id: "cs-t5", title: "Graph BFS & DFS Traversal Code", completed: false, selected: true }
        ]
      }
    ]
  },
  {
    id: "math201",
    name: "Calculus III & Linear Algebra",
    priority: "high",
    taskType: "STUDY",
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    modules: [
      {
        id: "math-m1",
        name: "Module 1: Partial Derivatives & Gradients",
        topics: [
          { id: "math-t1", title: "Partial Derivatives & Directional Derivative", completed: false, selected: true },
          { id: "math-t2", title: "Gradient Vector & Tangent Plane Equations", completed: false, selected: true },
          { id: "math-t3", title: "Lagrange Multipliers Optimization", completed: false, selected: true }
        ]
      }
    ]
  },
  {
    id: "bio101",
    name: "Cellular Biology & Genetics",
    priority: "medium",
    taskType: "STUDY",
    deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    modules: [
      {
        id: "bio-m1",
        name: "Module 1: Energetics & Metabolism",
        topics: [
          { id: "bio-t1", title: "Glycolysis & Citric Acid Cycle Pathways", completed: false, selected: true },
          { id: "bio-t2", title: "Oxidative Phosphorylation & ATP Synthase", completed: false, selected: true }
        ]
      }
    ]
  }
];

export const DEFAULT_STARTER_TASKS: Task[] = [
  {
    id: "task-start-1",
    subject: "Computer Science",
    task_title: "CS Lab 1: AVL Tree Balance Rotations",
    description: "Write C++ balance logic for AVL trees and test with 20 sample nodes.",
    estimated_minutes: 60,
    xp_reward: 250,
    category: "Boss Battle Project",
    tags: ["Code", "CS"],
    completed: false,
    priority: "high",
    taskType: "CODE",
    type: "subject",
    subTasks: [
      { id: "sub-1", title: "Write Left & Right Rotation Helper Functions", completed: false, selected: true },
      { id: "sub-2", title: "Implement Balance Factor Calculation", completed: false, selected: true },
      { id: "sub-3", title: "Run Test Suite and Memory Leak Diagnostics", completed: false, selected: true }
    ]
  },
  {
    id: "task-start-2",
    subject: "Calculus",
    task_title: "Math Problem Set 4: Multivariable Integrals",
    description: "Solve problems 1 to 12 in Chapter 15. Focus on polar coordinate transformations.",
    estimated_minutes: 45,
    xp_reward: 100,
    category: "Practical Application",
    tags: ["Math", "Study"],
    completed: false,
    priority: "medium",
    taskType: "STUDY",
    type: "subject",
    subTasks: [
      { id: "sub-4", title: "Double Integrals in Polar Coordinates (1-6)", completed: false, selected: true },
      { id: "sub-5", title: "Triple Integrals in Cylindrical Coordinates (7-12)", completed: false, selected: true }
    ]
  }
];

export const MOCK_JOURNEY: StudyJourney = {
  journey_title: "Fall Semester Mastery: Engineering & CS",
  current_milestone: "Midterm Season Preparation",
  total_estimated_days: 30,
  daily_tasks: DEFAULT_STARTER_TASKS
};

