export const metodos = [
  "AMRAP",
  "TABATA",
  "EMOM",
  "21-15-9",
  "FUERZA",
  "PIRAMIDE",
]

export const ejercicios = {
  cardio: [
    "Bike",
    "Remo",
    "Saltar cuerda",
    "Trote",
    "Sprint",
    "Jumping Jacks",
  ],

  gimnasia: [
    "Pull Up",
    "Push Up",
    "Sit Up",
    "Burpees",
    "Hollow Rock",
    "Superman",
    "Box Jump",
  ],

  kettlebell: [
    "KB Swing",
    "KB Clean",
    "KB Snatch",
    "KB Press",
    "KB Front Rack",
    "KB Lateral",
  ],

  fuerza: [
    "Thruster",
    "Deadlift",
    "Push Jerk",
    "Front Squat",
    "Back Squat",
    "Overhead Squat",
    "Hip Thrust",
    "Press Banca",
  ],

  core: [
    "Plancha",
    "Oblicuos",
    "Russian Twist",
    "Rodilla al pecho",
    "Crunch",
  ],
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generarEntrenamiento() {
  return {
    activacion: {
      metodo: "EMOM 8",
      ejercicios: [
        `5 ${randomItem(ejercicios.gimnasia)}`,
        `10 ${randomItem(ejercicios.gimnasia)}`,
        `15 Air Squat`,
      ],
    },

    bloque1: {
      metodo: randomItem(metodos),
      ejercicios: [
        randomItem(ejercicios.kettlebell),
        randomItem(ejercicios.gimnasia),
        randomItem(ejercicios.cardio),
      ],
    },

    bloque2: {
      metodo: randomItem(metodos),
      ejercicios: [
        randomItem(ejercicios.fuerza),
        randomItem(ejercicios.kettlebell),
        randomItem(ejercicios.core),
      ],
    },

    bloque3: {
      metodo: "AMRAP 15",
      ejercicios: [
        `10 ${randomItem(ejercicios.cardio)}`,
        `10 ${randomItem(ejercicios.gimnasia)}`,
        `10 ${randomItem(ejercicios.kettlebell)}`,
      ],
    },
  }
}