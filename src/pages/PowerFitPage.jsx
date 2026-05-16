import { useEffect, useState } from "react";
import { supabase } from "../supabase";
const guardarTiempo = async (bloque, segundos, userId) => {
  const { error } = await supabase
    .from('tiempos_bloques')
    .insert([
      {
        user_id: userId,
        bloque,
        tiempo_segundos: segundos
      }
    ])

  if (error) {
    console.log('Error guardando tiempo:', error)
  } else {
    console.log('Tiempo guardado')
  }
}

export default function PowerFitPage() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const getStudents = async () => {
    const { data, error } = await supabase
      .from("alumnos")
      .select("*");

    if (!error) {
      setStudents(data);
    }
  };

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from("asistencias")
      .select("*");

    if (!error) {
      setAttendance(data);
    }
  };

  const markAttendance = async (studentId) => {
    const { error } = await supabase
      .from("asistencias")
      .insert([
        {
          alumno_id: studentId,
        },
      ]);

    if (!error) {
      fetchAttendance();
    }
  };

  useEffect(() => {
    getStudents();
    fetchAttendance();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">
        PowerFit 360
      </h1>

      <div className="grid gap-4">
        {students.map((student) => {
          const studentAttendance = attendance.filter(
            (a) => a.alumno_id === student.id
          ).length;

          return (
            <div
              key={student.id}
              className="bg-gray-900 p-4 rounded-xl"
            >
              <h2 className="text-xl font-bold">
                {student.nombre}
              </h2>

              <p>{student.edad} años</p>

              <button
                onClick={() =>
                  markAttendance(student.id)
                }
                className="bg-green-600 px-4 py-2 rounded mt-3"
              >
                Marcar Asistencia
              </button>
              <button
  onClick={() => {
    guardarTiempo(
      'Bloque 1',
      120,
      student.id
    )
  }}
  className="bg-blue-600 px-4 py-2 rounded mt-3 ml-2"
>
  Guardar Tiempo
</button>

              <p className="mt-2">
                Asistencias: {studentAttendance}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}