import { supabase } from '../supabase'
import { useEffect, useState } from "react";

export default function RutinasPage() {
  const [selectedBlock, setSelectedBlock] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [lastTime, setLastTime] = useState(null);

  const bloques = [
    {
      id: 1,
      nombre: "Bloque 1",
      titulo: "Base Funcional",
      estado: "Desbloqueado",
      nivel: "Inicial",
      descripcion: "Funcional básico, cardio, movilidad y core.",
      ejercicios: [
        "Sentadillas x 20",
        "Flexiones x 10",
        "Abdominales x 20",
        "Burpees x 10",
        "Trote en el lugar 1 min",
      ],
    },
    {
      id: 2,
      nombre: "Bloque 2",
      titulo: "Fuerza y Resistencia",
      estado: "Bloqueado",
      nivel: "Medio",
      descripcion: "Trabajo de fuerza, pliometría y resistencia muscular.",
      ejercicios: [
        "Zancadas x 20",
        "Plancha 45 seg",
        "Saltos al cajón x 12",
        "Remo con mancuerna x 12",
        "Mountain climbers x 30",
      ],
    },
    {
      id: 3,
      nombre: "Bloque 3",
      titulo: "Combate PowerFit",
      estado: "Bloqueado",
      nivel: "Avanzado",
      descripcion: "Boxeo, kickboxing, desplazamientos y golpes combinados.",
      ejercicios: [
        "Jab cross x 2 min",
        "Low kick x 20",
        "Defensa + contraataque",
        "Sombra 3 rounds",
        "Core explosivo x 3 series",
      ],
    },
  ];

  const bloqueActivo = bloques.find((b) => b.id === selectedBlock);

  useEffect(() => {
    let timer;

    if (isRunning) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isRunning]);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  const startTraining = () => {
    setSeconds(0);
    setLastTime(null);
    setIsRunning(true);
  };

  const finishTraining = () => {
    setIsRunning(false);
    setLastTime(seconds);
  };

  const resetTraining = () => {
    setIsRunning(false);
    setSeconds(0);
    setLastTime(null);
  };

  const changeBlock = (id) => {
  setSelectedBlock(id);
  resetTraining();
};

const guardarTiempo = async (bloque, segundos) => {
  const user = await supabase.auth.getUser()

  const { error } = await supabase
    .from('tiempos_bloques')
    .insert([
      {
        user_id: user.data.user.id,
        bloque: bloque,
        tiempo_segundos: segundos
      }
    ])

  if (error) {
    console.log(error)
  } else {
    console.log('Tiempo guardado')
  }
}

return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white">
          Rutinas PowerFit 360
        </h1>
        <p className="text-gray-400 mt-2">
          Primero realiza tu activación. Cuando estés listo, presiona{" "}
          <span className="text-red-500 font-bold">Comenzar Bloque</span> para
          registrar solo el tiempo del trabajo principal.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-8">
        {bloques.map((bloque) => (
          <button
            key={bloque.id}
            onClick={() => changeBlock(bloque.id)}
            className={`text-left rounded-2xl p-5 border transition-all ${
              selectedBlock === bloque.id
                ? "bg-red-600 border-red-400 scale-105"
                : "bg-gray-900 border-gray-800 hover:bg-gray-800"
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-2xl font-black">{bloque.nombre}</h2>
              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  bloque.estado === "Desbloqueado"
                    ? "bg-green-600"
                    : "bg-gray-700"
                }`}
              >
                {bloque.estado}
              </span>
            </div>

            <h3 className="text-lg font-bold">{bloque.titulo}</h3>
            <p className="text-sm text-gray-300 mt-2">{bloque.descripcion}</p>

            <div className="mt-4">
              <p className="text-xs text-gray-400">Nivel</p>
              <p className="font-bold">{bloque.nivel}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-gray-950 border border-gray-800 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-black">
              {bloqueActivo.nombre}: {bloqueActivo.titulo}
            </h2>
            <p className="text-gray-400 mt-1">{bloqueActivo.descripcion}</p>
          </div>

          <div className="bg-black border border-red-700 rounded-2xl px-6 py-4 text-center">
            <p className="text-gray-400 text-sm">Tiempo del bloque</p>
            <p className="text-4xl font-black text-red-500">
              {formatTime(seconds)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={startTraining}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 px-6 py-3 rounded-xl font-bold"
          >
            Comenzar Bloque
          </button>

          <button
            onClick={finishTraining}
            disabled={!isRunning}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 px-6 py-3 rounded-xl font-bold"
          >
            Terminar Bloque
          </button>

          <button
            onClick={resetTraining}
            className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl font-bold"
          >
            Reiniciar
          </button>
        </div>

        {lastTime !== null && (
          <div className="mb-6 bg-green-950 border border-green-700 rounded-2xl p-4">
            <p className="text-green-400 font-bold">
              Bloque finalizado. Tiempo registrado: {formatTime(lastTime)}
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-black rounded-2xl p-5 border border-gray-800">
            <h3 className="text-xl font-black mb-4">Ejercicios</h3>

            <div className="space-y-3">
              {bloqueActivo.ejercicios.map((ejercicio, index) => (
                <div
                  key={index}
                  className="bg-gray-900 rounded-xl px-4 py-3 flex justify-between items-center"
                >
                  <span>{ejercicio}</span>
                  <span className="text-red-500 font-bold">{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black rounded-2xl p-5 border border-gray-800">
            <h3 className="text-xl font-black mb-4">Estado del entrenamiento</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-xl p-4">
                <p className="text-gray-400 text-sm">Estado</p>
                <p className="text-lg font-black">
                  {isRunning ? "En curso" : "Detenido"}
                </p>
              </div>

              <div className="bg-gray-900 rounded-xl p-4">
                <p className="text-gray-400 text-sm">Último tiempo</p>
                <p className="text-lg font-black">
                  {lastTime !== null ? formatTime(lastTime) : "Sin registro"}
                </p>
              </div>

              <div className="bg-gray-900 rounded-xl p-4">
                <p className="text-gray-400 text-sm">Bloque</p>
                <p className="text-lg font-black">{bloqueActivo.nombre}</p>
              </div>

              <div className="bg-gray-900 rounded-xl p-4">
                <p className="text-gray-400 text-sm">Nivel</p>
                <p className="text-lg font-black">{bloqueActivo.nivel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}