import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function EstadisticasPage() {
  const [alumnos, setAlumnos] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [tiempos, setTiempos] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const { data: alumnosData } = await supabase
      .from("alumnos")
      .select("*");

    const { data: asistenciasData } = await supabase
      .from("asistencias")
      .select("*");

    const { data: tiemposData } = await supabase
      .from("tiempos_bloques")
      .select("*");

    setAlumnos(alumnosData || []);
    setAsistencias(asistenciasData || []);
    setTiempos(tiemposData || []);
  };

  const totalAlumnos = alumnos.length;
  const totalAsistencias = asistencias.length;
  const bloquesCompletados = tiempos.length;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black">
          Estadísticas PowerFit 360
        </h1>
        <p className="text-gray-400 mt-2">
          Datos reales conectados a Supabase.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-5 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-400 text-sm">Alumnos activos</p>
          <h2 className="text-4xl font-black text-red-500">
            {totalAlumnos}
          </h2>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-400 text-sm">Asistencias</p>
          <h2 className="text-4xl font-black text-green-500">
            {totalAsistencias}
          </h2>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-400 text-sm">Bloques completados</p>
          <h2 className="text-4xl font-black text-yellow-500">
            {bloquesCompletados}
          </h2>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-400 text-sm">Pagos pendientes</p>
          <h2 className="text-4xl font-black text-orange-500">
            0
          </h2>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-950 border border-gray-800 rounded-3xl p-6">
          <h2 className="text-2xl font-black mb-4">
            Resumen de alumnos
          </h2>

          <div className="space-y-3">
            {alumnos.length === 0 ? (
              <div className="bg-gray-900 rounded-xl p-4 text-gray-400">
                No hay alumnos registrados.
              </div>
            ) : (
              alumnos.map((alumno) => {
                const asistenciasAlumno = asistencias.filter(
                  (a) => a.alumno_id === alumno.id
                ).length;

                return (
                  <div
                    key={alumno.id}
                    className="bg-gray-900 rounded-xl p-4 flex justify-between"
                  >
                    <span>{alumno.nombre}</span>
                    <span className="text-green-500 font-bold">
                      {asistenciasAlumno} asistencias
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-gray-950 border border-gray-800 rounded-3xl p-6">
          <h2 className="text-2xl font-black mb-4">
            Tiempos registrados
          </h2>

          <div className="space-y-3">
            {tiempos.length === 0 ? (
              <div className="bg-gray-900 rounded-xl p-4 text-gray-400">
                Todavía no hay tiempos guardados.
              </div>
            ) : (
              tiempos.map((tiempo) => (
                <div
                  key={tiempo.id}
                  className="bg-gray-900 rounded-xl p-4 flex justify-between"
                >
                  <span>{tiempo.bloque_nombre}</span>
                  <span className="text-red-500 font-bold">
                    {tiempo.tiempo_segundos}s
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
