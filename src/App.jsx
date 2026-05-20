import { useEffect, useState } from 'react'
import { supabase } from './supabase'

import RutinasPage from './pages/RutinasPage'
import GeneradorPage from './pages/GeneradorPage'

export default function App() {

  const [section, setSection] = useState('Rutinas')

  return (

    <div className="min-h-screen bg-black text-white p-6">

      <div className="flex gap-4 mb-10">

        <button
          onClick={() => setSection('Rutinas')}
          className="bg-zinc-800 px-6 py-4 rounded-2xl font-bold"
        >
          Rutinas
        </button>

        <button
          onClick={() => setSection('Generador')}
          className="bg-red-600 px-6 py-4 rounded-2xl font-bold"
        >
          Generador IA
        </button>

      </div>

      {section === 'Rutinas' && (
        <RutinasPage
          student={{
            id: 1,
            xp: 200,
            bloques_premium: 2,
          }}
        />
      )}

      {section === 'Generador' && (
        <GeneradorPage />
      )}

    </div>

  );
}