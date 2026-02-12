import { useState } from 'react'

export default function NameEntry({ onNameSet }) {
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) {
      localStorage.setItem('padel-player-name', trimmed)
      onNameSet(trimmed)
    }
  }

  return (
    <div className="min-h-screen bg-padel-blue flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center"
      >
        <div className="text-5xl mb-4">🎾</div>
        <h1 className="text-2xl font-bold text-padel-blue mb-2">
          Padel Planner
        </h1>
        <p className="text-gray-500 mb-6 text-sm">
          Vul je naam in om te beginnen
        </p>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Je naam..."
          autoFocus
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-padel-green focus:outline-none text-lg text-center transition-colors"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-4 w-full py-3 rounded-xl bg-padel-green text-white font-semibold text-lg hover:bg-padel-green-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Start
        </button>
      </form>
    </div>
  )
}
