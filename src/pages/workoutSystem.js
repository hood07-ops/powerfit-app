function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const fighter = [
  "Heavy Bag",
  "Pull Up",
  "Burpees",
  "Sprint",
  "Shadow Boxing",
  "Push Up",
  "Footwork Drill",
  "Jump Rope",
];

const fuerza = [
  "Deadlift",
  "Front Squat",
  "Push Jerk",
  "Hip Thrust",
  "Thruster",
  "Bench Press",
  "Back Squat",
];

const cardio = [
  "Bike",
  "Remo",
  "Mountain Climbers",
  "High Knees",
  "Jumping Jacks",
];

const kettlebell = [
  "KB Swing",
  "KB Snatch",
  "KB Clean",
  "KB Press",
  "KB Front Rack",
];

export function generarEntrenamiento(objetivo, nivel) {

  let pool = [...fighter, ...cardio];

  if (objetivo === "fuerza") {
    pool = [...fuerza, ...kettlebell];
  }

  if (objetivo === "perdida_grasa") {
    pool = [...cardio, ...fighter];
  }

  if (objetivo === "fighter") {
    pool = [...fighter, ...cardio, ...kettlebell];
  }

  return {

    activacion: {
      metodo: "EMOM 8",
      ejercicios: [
        `5 ${random(pool)}`,
        `10 ${random(pool)}`,
        `15 Air Squat`,
      ],
    },

    bloque1: {
      metodo: "TABATA",
      ejercicios: [
        random(pool),
        random(pool),
        random(pool),
      ],
    },

    bloque2: {
      metodo: "FUERZA",
      ejercicios: [
        random(pool),
        random(pool),
        random(pool),
      ],
    },

    bloque3: {
      metodo: "AMRAP 15",
      ejercicios: [
        `10 ${random(pool)}`,
        `15 ${random(pool)}`,
        `20 ${random(pool)}`,
      ],
    },
  };
}