export default function MetodosPage() {
  const metodos = [
    ['ATR', 'Acumulación, Transformación y Realización. Ordena el proceso de entrenamiento por fases.'],
    ['AMRAP', 'Hacer la mayor cantidad de rondas o repeticiones posibles en un tiempo definido. Record: vueltas + reps.'],
    ['TABATA', 'Intervalos de trabajo y descanso. Record: repeticiones totales.'],
    ['EMOM', 'Cada minuto comienza una tarea nueva. Record: completado, rondas o carga.'],
    ['RM', 'Repetición máxima. Sirve para calcular cargas por porcentaje.'],
    ['21-15-9', 'Formato descendente de repeticiones. Record: tiempo total.'],
    ['FOR TIME', 'Completar el trabajo lo más rápido posible. Record: tiempo.'],
    ['Halterofilia', 'Trabajo técnico de barra: clean, snatch, jerk, squat, pull.'],
    ['Kettlebell', 'Trabajo con pesas rusas: swing, clean, snatch, press, farmer walk.'],
    ['Fighter Conditioning', 'Acondicionamiento aplicado a deportes de combate.'],
  ]

  return (
    <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
      <h2 className="text-4xl font-black text-yellow-400 mb-6">
        Métodos de entrenamiento
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        {metodos.map(([nombre, descripcion]) => (
          <div key={nombre} className="bg-zinc-800 p-5 rounded-2xl">
            <h3 className="text-2xl font-black text-red-400">{nombre}</h3>
            <p className="text-zinc-300 mt-2">{descripcion}</p>
          </div>
        ))}
      </div>
    </div>
  )
}