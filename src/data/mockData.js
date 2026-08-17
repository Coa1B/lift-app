// Local demo / library data. Personal progress lives in device storage only.

export const weekStats = {
  sessionsThisWeek: 0,
  volumeThisWeekLbs: 0,
  streakWeeks: 0,
  newPRsThisWeek: 0,
};

export const recentWorkouts = [];

export const PR_EXERCISE_IDS = ["chest-bench-barbell", "legs-squat-barbell", "back-deadlift"];

/** Empty big-3 PR slots for a fresh local device (no shared seed progress). */
export const emptyPersonalRecords = [
  {
    id: "pr1",
    exerciseId: "chest-bench-barbell",
    name: "Bench Press (Barbell)",
    muscle: "Chest",
    weight: null,
    date: null,
    history: [],
  },
  {
    id: "pr2",
    exerciseId: "legs-squat-barbell",
    name: "Squat (Barbell)",
    muscle: "Legs",
    weight: null,
    date: null,
    history: [],
  },
  {
    id: "pr3",
    exerciseId: "back-deadlift",
    name: "Deadlift",
    muscle: "Back",
    weight: null,
    date: null,
    history: [],
  },
];

/** @deprecated demo seed — not used for new local profiles */
export const personalRecords = emptyPersonalRecords;

export const activeWorkout = {
  title: "Push day A",
  exercises: [
    {
      id: "ex1",
      name: "Bench press",
      muscle: "Chest",
      equipment: "Barbell",
      prPace: true,
      sets: [
        {
          id: "s1",
          prevWeight: 185,
          prevReps: 8,
          weight: 185,
          reps: 10,
          done: true,
        },
        {
          id: "s2",
          prevWeight: 205,
          prevReps: 5,
          weight: 205,
          reps: 6,
          done: true,
        },
        {
          id: "s3",
          prevWeight: 215,
          prevReps: 3,
          weight: 215,
          reps: null,
          done: false,
        },
      ],
      overloadSuggestion: {
        lastWeight: 215,
        lastReps: 3,
        suggestedWeight: 220,
        suggestedReps: 3,
        percentIncrease: 2.3,
      },
    },
    {
      id: "ex2",
      name: "Incline DB press",
      muscle: "Chest",
      equipment: "Dumbbell",
      prPace: false,
      sets: [
        {
          id: "s4",
          prevWeight: 70,
          prevReps: 10,
          weight: 70,
          reps: 10,
          done: true,
        },
        {
          id: "s5",
          prevWeight: 70,
          prevReps: 10,
          weight: 70,
          reps: null,
          done: false,
        },
      ],
      overloadSuggestion: null,
    },
  ],
};

export const exerciseLibrary = [
  // Chest
  { id: "chest-bench-barbell", name: "Bench Press (Barbell)", muscle: "Chest", equipment: "Barbell", type: "Compound", pr: "155 lb" },
  { id: "chest-bench-dumbbell", name: "Bench Press (Dumbbell)", muscle: "Chest", equipment: "Dumbbell", type: "Compound" },
  { id: "chest-incline-barbell", name: "Incline Bench Press (Barbell)", muscle: "Chest", equipment: "Barbell", type: "Compound" },
  { id: "chest-incline-dumbbell", name: "Incline Bench Press (Dumbbell)", muscle: "Chest", equipment: "Dumbbell", type: "Compound" },
  { id: "chest-press-machine", name: "Chest Press (Machine)", muscle: "Chest", equipment: "Machine", type: "Compound" },
  { id: "chest-fly-cable", name: "Chest Fly (Cable)", muscle: "Chest", equipment: "Cable", type: "Isolation" },
  { id: "chest-fly-machine", name: "Chest Fly (Machine)", muscle: "Chest", equipment: "Machine", type: "Isolation" },
  { id: "chest-pushup", name: "Push-Up", muscle: "Chest", equipment: "Bodyweight", type: "Compound" },
  { id: "chest-pushup-weighted", name: "Push-Up (Weighted)", muscle: "Chest", equipment: "Bodyweight", type: "Compound" },
  { id: "chest-dips", name: "Dips", muscle: "Chest", equipment: "Bodyweight", type: "Compound" },

  // Back
  { id: "back-pullup", name: "Pull-Up", muscle: "Back", equipment: "Bodyweight", type: "Compound" },
  { id: "back-lat-pulldown", name: "Lat Pulldown", muscle: "Back", equipment: "Cable", type: "Compound" },
  { id: "back-seated-row-cable", name: "Seated Row (Cable)", muscle: "Back", equipment: "Cable", type: "Compound" },
  { id: "back-seated-row-wide", name: "Seated Row (Wide Grip)", muscle: "Back", equipment: "Cable", type: "Compound" },
  { id: "back-seated-row-close", name: "Seated Row (Close Grip)", muscle: "Back", equipment: "Cable", type: "Compound" },
  { id: "back-seated-row-machine", name: "Seated Row (Machine)", muscle: "Back", equipment: "Machine", type: "Compound" },
  { id: "back-row-barbell", name: "Row (Barbell)", muscle: "Back", equipment: "Barbell", type: "Compound" },
  { id: "back-row-chest-supported", name: "Row (Chest Supported)", muscle: "Back", equipment: "Machine", type: "Compound" },
  { id: "back-row-machine", name: "Row (Machine)", muscle: "Back", equipment: "Machine", type: "Compound" },
  { id: "back-row-dumbbell", name: "Row (Single Arm Dumbbell)", muscle: "Back", equipment: "Dumbbell", type: "Compound" },
  { id: "back-deadlift", name: "Deadlift", muscle: "Back", equipment: "Barbell", type: "Compound", pr: "225 lb", isPR: true },
  { id: "back-lat-pullover", name: "Lat Pullover (Cable)", muscle: "Back", equipment: "Cable", type: "Isolation" },

  // Shoulders
  { id: "shoulders-press-dumbbell", name: "Shoulder Press (Dumbbell)", muscle: "Shoulders", equipment: "Dumbbell", type: "Compound" },
  { id: "shoulders-press-machine", name: "Shoulder Press (Machine)", muscle: "Shoulders", equipment: "Machine", type: "Compound" },
  { id: "shoulders-arnold", name: "Arnold Press", muscle: "Shoulders", equipment: "Dumbbell", type: "Compound" },
  { id: "shoulders-front-raise-dumbbell", name: "Front Raise (Dumbbell)", muscle: "Shoulders", equipment: "Dumbbell", type: "Isolation" },
  { id: "shoulders-front-raise-cable", name: "Front Raise (Cable)", muscle: "Shoulders", equipment: "Cable", type: "Isolation" },
  { id: "shoulders-lateral-dumbbell", name: "Lateral Raise (Dumbbell)", muscle: "Shoulders", equipment: "Dumbbell", type: "Isolation" },
  { id: "shoulders-lateral-cable", name: "Lateral Raise (Cable)", muscle: "Shoulders", equipment: "Cable", type: "Isolation" },
  { id: "shoulders-lateral-machine", name: "Lateral Raise (Machine)", muscle: "Shoulders", equipment: "Machine", type: "Isolation" },
  { id: "shoulders-upright-row", name: "Upright Row (Barbell)", muscle: "Shoulders", equipment: "Barbell", type: "Compound" },
  { id: "shoulders-rear-delt-machine", name: "Rear Delt Fly (Machine)", muscle: "Shoulders", equipment: "Machine", type: "Isolation" },
  { id: "shoulders-rear-delt-cable", name: "Rear Delt Fly (Cable)", muscle: "Shoulders", equipment: "Cable", type: "Isolation" },
  { id: "shoulders-face-pulls", name: "Face Pulls", muscle: "Shoulders", equipment: "Cable", type: "Isolation" },

  // Biceps
  { id: "biceps-curl", name: "Biceps Curl", muscle: "Biceps", equipment: "Dumbbell", type: "Isolation" },
  { id: "biceps-preacher", name: "Preacher Curl", muscle: "Biceps", equipment: "Machine", type: "Isolation" },
  { id: "biceps-hammer", name: "Hammer Curl", muscle: "Biceps", equipment: "Dumbbell", type: "Isolation" },
  { id: "biceps-reverse", name: "Reverse Curl", muscle: "Biceps", equipment: "Barbell", type: "Isolation" },
  { id: "forearms-wrist-curl", name: "Wrist Curl", muscle: "Biceps", equipment: "Barbell", type: "Isolation", region: "Forearms" },
  { id: "forearms-reverse-wrist", name: "Reverse Wrist Curl", muscle: "Biceps", equipment: "Barbell", type: "Isolation", region: "Forearms" },

  // Triceps
  { id: "triceps-pushdown", name: "Triceps Pushdown", muscle: "Triceps", equipment: "Cable", type: "Isolation" },
  { id: "triceps-overhead", name: "Overhead Extension", muscle: "Triceps", equipment: "Dumbbell", type: "Isolation" },
  { id: "triceps-skull-crusher", name: "Skull Crusher", muscle: "Triceps", equipment: "Barbell", type: "Isolation" },
  { id: "triceps-jm-press", name: "JM Press", muscle: "Triceps", equipment: "Barbell", type: "Compound" },

  // Legs — Quads
  { id: "legs-squat-barbell", name: "Squat (Barbell)", muscle: "Legs", equipment: "Barbell", type: "Compound", region: "Quads", pr: "185 lb" },
  { id: "legs-squat-smith", name: "Squat (Smith Machine)", muscle: "Legs", equipment: "Smith Machine", type: "Compound", region: "Quads" },
  { id: "legs-hack-squat", name: "Hack Squat", muscle: "Legs", equipment: "Machine", type: "Compound", region: "Quads" },
  { id: "legs-leg-press", name: "Leg Press", muscle: "Legs", equipment: "Machine", type: "Compound", region: "Quads" },
  { id: "legs-extension", name: "Leg Extension (Machine)", muscle: "Legs", equipment: "Machine", type: "Isolation", region: "Quads" },
  { id: "legs-bulgarian", name: "Bulgarian Split Squat", muscle: "Legs", equipment: "Dumbbell", type: "Compound", region: "Quads" },

  // Legs — Hamstrings
  { id: "legs-rdl-barbell", name: "Romanian Deadlift (Barbell)", muscle: "Legs", equipment: "Barbell", type: "Compound", region: "Hamstrings" },
  { id: "legs-rdl-dumbbell", name: "Romanian Deadlift (Dumbbell)", muscle: "Legs", equipment: "Dumbbell", type: "Compound", region: "Hamstrings" },
  { id: "legs-curl-lying", name: "Leg Curl (Lying Machine)", muscle: "Legs", equipment: "Machine", type: "Isolation", region: "Hamstrings" },
  { id: "legs-curl-seated", name: "Leg Curl (Seated Machine)", muscle: "Legs", equipment: "Machine", type: "Isolation", region: "Hamstrings" },

  // Legs — Glutes
  { id: "legs-hip-thrust-barbell", name: "Hip Thrust (Barbell)", muscle: "Legs", equipment: "Barbell", type: "Compound", region: "Glutes" },
  { id: "legs-hip-thrust-smith", name: "Hip Thrust (Smith Machine)", muscle: "Legs", equipment: "Smith Machine", type: "Compound", region: "Glutes" },
  { id: "legs-hip-thrust-machine", name: "Hip Thrust (Machine)", muscle: "Legs", equipment: "Machine", type: "Compound", region: "Glutes" },
  { id: "legs-glute-bridge", name: "Glute Bridge", muscle: "Legs", equipment: "Bodyweight", type: "Isolation", region: "Glutes" },
  { id: "legs-kickback-cable", name: "Kickback (Cable)", muscle: "Legs", equipment: "Cable", type: "Isolation", region: "Glutes" },
  { id: "legs-kickback-machine", name: "Kickback (Machine)", muscle: "Legs", equipment: "Machine", type: "Isolation", region: "Glutes" },

  // Legs — Calves
  { id: "legs-calf-standing", name: "Calf Raise (Standing Machine)", muscle: "Legs", equipment: "Machine", type: "Isolation", region: "Calves" },
  { id: "legs-calf-seated", name: "Calf Raise (Seated Machine)", muscle: "Legs", equipment: "Machine", type: "Isolation", region: "Calves" },
  { id: "legs-calf-leg-press", name: "Calf Raise (Leg Press)", muscle: "Legs", equipment: "Machine", type: "Isolation", region: "Calves" },
  { id: "legs-calf-smith", name: "Calf Raise (Smith Machine)", muscle: "Legs", equipment: "Smith Machine", type: "Isolation", region: "Calves" },

  // Abs
  { id: "abs-crunch", name: "Crunch", muscle: "Abs", equipment: "Bodyweight", type: "Isolation" },
  { id: "abs-crunch-cable", name: "Crunch (Cable)", muscle: "Abs", equipment: "Cable", type: "Isolation" },
  { id: "abs-crunch-machine", name: "Crunch (Machine)", muscle: "Abs", equipment: "Machine", type: "Isolation" },
  { id: "abs-hanging-leg-raise", name: "Hanging Leg Raise", muscle: "Abs", equipment: "Bodyweight", type: "Isolation" },
  { id: "abs-hanging-knee-raise", name: "Hanging Knee Raise", muscle: "Abs", equipment: "Bodyweight", type: "Isolation" },
  { id: "abs-reverse-crunch", name: "Reverse Crunch", muscle: "Abs", equipment: "Bodyweight", type: "Isolation" },
  { id: "abs-bicycle", name: "Bicycle Crunch", muscle: "Abs", equipment: "Bodyweight", type: "Isolation" },
  { id: "abs-russian-twist", name: "Russian Twist", muscle: "Abs", equipment: "Bodyweight", type: "Isolation" },
  { id: "abs-plank", name: "Plank", muscle: "Abs", equipment: "Bodyweight", type: "Isolation" },
  { id: "abs-side-plank", name: "Side Plank", muscle: "Abs", equipment: "Bodyweight", type: "Isolation" },
  { id: "abs-ab-wheel", name: "Ab Wheel Rollout", muscle: "Abs", equipment: "Ab Wheel", type: "Isolation" },
  { id: "abs-mountain-climber", name: "Mountain Climber", muscle: "Abs", equipment: "Bodyweight", type: "Isolation" },
  { id: "abs-woodchopper", name: "Woodchopper (Cable)", muscle: "Abs", equipment: "Cable", type: "Isolation" },
];

export const muscleGroups = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Abs",
];

// Per-exercise detail data, keyed by exercise id from exerciseLibrary.
export const exerciseDetails = {
  "chest-bench-barbell": {
    personalBest: { weight: 155, reps: 1, date: "Sep 24, 25", e1rm: 155 },
    nextTarget: {
      weight: 160,
      reps: 1,
      note: "Build volume at 145–150 before chasing 160.",
    },
    progress: [
      { date: "Jan 1", weight: 125 },
      { date: "May 25", weight: 135 },
      { date: "Jul 14", weight: 145 },
      { date: "Sep 24", weight: 155 },
    ],
    history: [
      {
        date: "Sep 24, 25",
        sets: [
          { weight: 150, reps: 1 },
          { weight: 155, reps: 1 },
        ],
      },
      {
        date: "Jul 14, 25",
        sets: [{ weight: 145, reps: 1 }],
      },
      {
        date: "May 25, 25",
        sets: [{ weight: 135, reps: 1 }],
      },
    ],
  },
  "back-deadlift": {
    personalBest: { weight: 225, reps: 1, date: "Aug 9, 25", e1rm: 225 },
    nextTarget: {
      weight: 235,
      reps: 1,
      note: "Solid doubles at 205–215 before a new max.",
    },
    progress: [
      { date: "Jan 1", weight: 195 },
      { date: "Jul 4", weight: 205 },
      { date: "Aug 9", weight: 225 },
    ],
    history: [
      {
        date: "Aug 9, 25",
        sets: [{ weight: 225, reps: 1 }],
      },
      {
        date: "Jul 4, 25",
        sets: [{ weight: 205, reps: 1 }],
      },
      {
        date: "Jan 1, 25",
        sets: [{ weight: 195, reps: 1 }],
      },
    ],
  },
  "legs-squat-barbell": {
    personalBest: { weight: 185, reps: 1, date: "Mar 23, 25", e1rm: 185 },
    nextTarget: {
      weight: 195,
      reps: 1,
      note: "Build sets of 5 at 165–175 before pushing higher.",
    },
    progress: [
      { date: "Jan 1", weight: 145 },
      { date: "Mar 23", weight: 185 },
    ],
    history: [
      {
        date: "Mar 23, 25",
        sets: [{ weight: 185, reps: 1 }],
      },
      {
        date: "Jan 1, 25",
        sets: [{ weight: 145, reps: 1 }],
      },
    ],
  },
};

// Fallback generator so any exercise without hand-authored data still renders sensibly.
export function getExerciseDetail(exercise) {
  if (exerciseDetails[exercise.id]) return exerciseDetails[exercise.id];
  const baseWeight = parseInt(exercise.pr) || 100;
  return {
    personalBest: {
      weight: baseWeight,
      reps: 6,
      date: "Jun 10, 26",
      e1rm: Math.round(baseWeight * 1.2),
    },
    nextTarget: {
      weight: baseWeight,
      reps: 7,
      note: `Hold ${baseWeight} lbs. Push every set to 7+ reps before adding weight.`,
    },
    progress: [
      { date: "Apr 1", weight: Math.round(baseWeight * 0.85) },
      { date: "Apr 20", weight: Math.round(baseWeight * 0.9) },
      { date: "May 10", weight: Math.round(baseWeight * 0.95) },
      { date: "Jun 1", weight: baseWeight },
    ],
    history: [{ date: "Jun 10, 26", sets: [{ weight: baseWeight, reps: 6 }] }],
  };
}

export const defaultPlans = [
  {
    id: "p1",
    name: "Push Day A",
    tag: "PPL",
    restTimerSecs: 0,
    exercises: [
      { exerciseId: "chest-bench-barbell", sets: 3, reps: 8, restSecs: 0 },
      { exerciseId: "chest-incline-dumbbell", sets: 3, reps: 10, restSecs: 0 },
      { exerciseId: "shoulders-press-dumbbell", sets: 3, reps: 8, restSecs: 0 },
      { exerciseId: "triceps-pushdown", sets: 3, reps: 12, restSecs: 0 },
    ],
  },
  {
    id: "p2",
    name: "Pull Day A",
    tag: "PPL",
    restTimerSecs: 0,
    exercises: [
      { exerciseId: "back-deadlift", sets: 3, reps: 5, restSecs: 0 },
      { exerciseId: "back-row-barbell", sets: 3, reps: 8, restSecs: 0 },
      { exerciseId: "back-lat-pulldown", sets: 3, reps: 10, restSecs: 0 },
      { exerciseId: "biceps-curl", sets: 3, reps: 12, restSecs: 0 },
    ],
  },
  {
    id: "p3",
    name: "Leg Day",
    tag: "PPL",
    restTimerSecs: 0,
    exercises: [
      { exerciseId: "legs-squat-barbell", sets: 4, reps: 6, restSecs: 0 },
      { exerciseId: "legs-rdl-barbell", sets: 3, reps: 10, restSecs: 0 },
      { exerciseId: "legs-leg-press", sets: 3, reps: 12, restSecs: 0 },
      { exerciseId: "legs-calf-standing", sets: 3, reps: 15, restSecs: 0 },
    ],
  },
];

export const activeWorkoutTemplate = {
  title: "Push day A",
  exercises: [
    {
      id: "ex1",
      name: "Bench Press (Barbell)",
      muscle: "Chest",
      equipment: "Barbell",
      prPace: true,
      defaultRestSecs: 120,
      sets: [
        {
          id: "s1",
          prevWeight: 185,
          prevReps: 8,
          weight: 185,
          reps: 10,
          done: true,
        },
        {
          id: "s2",
          prevWeight: 205,
          prevReps: 5,
          weight: 205,
          reps: 6,
          done: true,
        },
        {
          id: "s3",
          prevWeight: 215,
          prevReps: 3,
          weight: 215,
          reps: null,
          done: false,
        },
      ],
      overloadSuggestion: {
        lastWeight: 215,
        lastReps: 3,
        suggestedWeight: 220,
        suggestedReps: 3,
        percentIncrease: 2.3,
      },
    },
    {
      id: "ex2",
      name: "Incline Bench Press (Dumbbell)",
      muscle: "Chest",
      equipment: "Dumbbell",
      prPace: false,
      defaultRestSecs: 90,
      sets: [
        {
          id: "s4",
          prevWeight: 70,
          prevReps: 10,
          weight: 70,
          reps: 10,
          done: true,
        },
        {
          id: "s5",
          prevWeight: 70,
          prevReps: 10,
          weight: 70,
          reps: null,
          done: false,
        },
      ],
      overloadSuggestion: null,
    },
  ],
};
