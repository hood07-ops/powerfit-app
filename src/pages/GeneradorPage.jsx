import React, { useState } from "react";
import { generarEntrenamiento } from "./workoutSystem";

export default function GeneradorPage() {

  const [objetivo, setObjetivo] = useState("fighter");
  const [nivel, setNivel] = useState("intermedio");
  const [entrenamiento, setEntrenamiento] = useState(null);

  function crearEntrenamiento() {
    const nuevo = generarEntrenamiento(objetivo, nivel);
    setEntrenamiento(nuevo);
  }

  return (
    <div className="space-y-8">

      <div className="bg-zinc-900 rounded-3xl p-6 border border-red-600">
        <h1 className="text-5xl font-black text-red-500">
          GENERADOR POWERFIT 360
        </h1>

        <p className="text-zinc-400 mt-3">
          Generador automático ATR fighter
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        <div className="bg-zinc-900 rounded-3xl p-6">

          <label className="text-xl font-black text-yellow-400">
            Objetivo
          </label>

          <select
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            className="w-full mt-3 bg-zinc-800 p-4 rounded-2xl"
          >
            <option value="fighter">Fighter</option>
            <option value="fuerza">Fuerza</option>
            <option value="perdida_grasa">Pérdida grasa</option>
            <option value="cardio">Cardio</option>
          </select>

          <label className="text-xl font-black text-blue-400 mt-6 block">
            Nivel
          </label>

          <select
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            className="w-full mt-3 bg-zinc-800 p-4 rounded-2xl"
          >
            <option value="basico">Básico</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>

          <button
            onClick={crearEntrenamiento}
            className="w-full mt-8 bg-red-600 hover:bg-red-700 transition rounded-2xl py-4 text-2xl font-black"
          >
            GENERAR ENTRENAMIENTO
          </button>

        </div>

        <div className="bg-zinc-900 rounded-3xl p-6">

          <h2 className="text-3xl font-black text-green-400">
            Parámetros
          </h2>

          <ul className="mt-6 space-y-4 text-zinc-300">
            <li>• Método ATR</li>
            <li>• Activación + 3 bloques</li>
            <li>• Progresión fighter</li>
            <li>• Duración 8-15 min</li>
            <li>• Descanso automático 2 min</li>
            <li>• Mezcla fuerza/cardio/potencia</li>
          </ul>

        </div>

      </div>

      {entrenamiento && (

        <div className="space-y-6">

          <Bloque
            titulo="ACTIVACIÓN"
            data={entrenamiento.activacion}
          />

          <Bloque
            titulo="BLOQUE PRINCIPAL 1"
            data={entrenamiento.bloque1}
          />

          <Bloque
            titulo="BLOQUE PRINCIPAL 2"
            data={entrenamiento.bloque2}
          />

          <Bloque
            titulo="BLOQUE FINAL"
            data={entrenamiento.bloque3}
          />

        </div>

      )}

    </div>
  );
}

function Bloque({ titulo, data }) {

  return (

    <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">

      <div className="flex justify-between items-center">

        <h2 className="text-3xl font-black text-yellow-400">
          {titulo}
        </h2>

        <span className="bg-purple-600 px-4 py-2 rounded-full font-black">
          {data.metodo}
        </span>

      </div>

      <ul className="mt-6 space-y-3">

        {data.ejercicios.map((e, i) => (

          <li
            key={i}
            className="bg-zinc-800 p-4 rounded-2xl"
          >
            • {e}
          </li>

        ))}

      </ul>

      <div className="mt-5 text-zinc-400 font-bold">
        Descanso: 2 min
      </div>

    </div>

  );
}