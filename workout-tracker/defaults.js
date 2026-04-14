// Default workout templates. Weights are editable; these are starting-point suggestions.
// Each exercise defines target sets, reps, and a starter weight (kg or lb per user setting).
// weight unit is stored per-session; defaults are numeric values (assumed in kg by default, convertible).

export const DEFAULT_UNIT = "kg";

export const DEFAULT_WORKOUTS = [
  {
    id: "tpl-push",
    name: "Push Day",
    category: "Strength",
    note: "Chest, shoulders, triceps.",
    exercises: [
      { name: "Barbell Bench Press", sets: 4, reps: 6, weight: 70 },
      { name: "Overhead Press", sets: 3, reps: 8, weight: 40 },
      { name: "Incline Dumbbell Press", sets: 3, reps: 10, weight: 22 },
      { name: "Cable Tricep Pushdown", sets: 3, reps: 12, weight: 25 },
      { name: "Lateral Raise", sets: 3, reps: 15, weight: 8 },
    ],
  },
  {
    id: "tpl-pull",
    name: "Pull Day",
    category: "Strength",
    note: "Back and biceps.",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 5, weight: 100 },
      { name: "Pull-Up", sets: 4, reps: 8, weight: 0 },
      { name: "Barbell Row", sets: 3, reps: 8, weight: 60 },
      { name: "Lat Pulldown", sets: 3, reps: 10, weight: 50 },
      { name: "Barbell Curl", sets: 3, reps: 10, weight: 25 },
      { name: "Face Pull", sets: 3, reps: 15, weight: 18 },
    ],
  },
  {
    id: "tpl-legs",
    name: "Leg Day",
    category: "Strength",
    note: "Quads, hamstrings, glutes, calves.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 6, weight: 90 },
      { name: "Romanian Deadlift", sets: 3, reps: 8, weight: 70 },
      { name: "Leg Press", sets: 3, reps: 10, weight: 140 },
      { name: "Leg Curl", sets: 3, reps: 12, weight: 35 },
      { name: "Walking Lunge", sets: 3, reps: 12, weight: 16 },
      { name: "Standing Calf Raise", sets: 4, reps: 15, weight: 60 },
    ],
  },
  {
    id: "tpl-upper",
    name: "Upper Body",
    category: "Strength",
    note: "Balanced upper session.",
    exercises: [
      { name: "Barbell Bench Press", sets: 4, reps: 6, weight: 70 },
      { name: "Barbell Row", sets: 4, reps: 8, weight: 60 },
      { name: "Overhead Press", sets: 3, reps: 8, weight: 40 },
      { name: "Pull-Up", sets: 3, reps: 8, weight: 0 },
      { name: "Dumbbell Curl", sets: 3, reps: 10, weight: 12 },
      { name: "Tricep Rope Extension", sets: 3, reps: 12, weight: 22 },
    ],
  },
  {
    id: "tpl-lower",
    name: "Lower Body",
    category: "Strength",
    note: "Balanced lower session.",
    exercises: [
      { name: "Back Squat", sets: 4, reps: 6, weight: 90 },
      { name: "Romanian Deadlift", sets: 3, reps: 8, weight: 70 },
      { name: "Leg Press", sets: 3, reps: 10, weight: 140 },
      { name: "Seated Leg Curl", sets: 3, reps: 12, weight: 35 },
      { name: "Standing Calf Raise", sets: 4, reps: 15, weight: 60 },
    ],
  },
  {
    id: "tpl-fb-a",
    name: "Full Body A",
    category: "Full Body",
    note: "Compound-focused full body.",
    exercises: [
      { name: "Back Squat", sets: 3, reps: 5, weight: 90 },
      { name: "Barbell Bench Press", sets: 3, reps: 5, weight: 70 },
      { name: "Barbell Row", sets: 3, reps: 8, weight: 60 },
      { name: "Plank (seconds)", sets: 3, reps: 45, weight: 0 },
    ],
  },
  {
    id: "tpl-fb-b",
    name: "Full Body B",
    category: "Full Body",
    note: "Hinge and press emphasis.",
    exercises: [
      { name: "Deadlift", sets: 3, reps: 5, weight: 100 },
      { name: "Overhead Press", sets: 3, reps: 6, weight: 40 },
      { name: "Pull-Up", sets: 3, reps: 8, weight: 0 },
      { name: "Farmer's Carry (steps)", sets: 3, reps: 30, weight: 24 },
    ],
  },
];
