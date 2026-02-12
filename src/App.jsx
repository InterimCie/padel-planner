import { useState } from 'react'
import NameEntry from './components/NameEntry'
import Calendar from './components/Calendar'
import DayView from './components/DayView'
import { useSlotData } from './hooks/useSlotData'

export default function App() {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('padel-player-name') || ''
  })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewingDay, setViewingDay] = useState(null)

  const {
    signups,
    comments,
    finalized,
    loading,
    toggleSignup,
    batchToggleSignup,
    setComment,
    toggleFinalized,
  } = useSlotData()

  function handleSelectDate(date) {
    setSelectedDate(date)
    setViewingDay(date)
  }

  function handleBack() {
    setViewingDay(null)
  }

  function handleChangeName() {
    localStorage.removeItem('padel-player-name')
    setPlayerName('')
  }

  if (!playerName) {
    return <NameEntry onNameSet={setPlayerName} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-padel-green border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-padel-blue text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎾</span>
          <h1 className="font-bold text-lg">Padel Planner</h1>
        </div>
        <button
          onClick={handleChangeName}
          className="flex items-center gap-1.5 text-sm bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors"
        >
          <span className="text-padel-green-light font-semibold">{playerName}</span>
          <span className="text-white/60 text-xs">wijzig</span>
        </button>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto p-4 pb-8">
        {viewingDay ? (
          <DayView
            date={viewingDay}
            currentPlayer={playerName}
            signups={signups}
            comments={comments}
            finalized={finalized}
            onBatchToggleSignup={batchToggleSignup}
            onSetComment={setComment}
            onToggleFinalized={toggleFinalized}
            onBack={handleBack}
          />
        ) : (
          <>
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              signups={signups}
            />

            {/* Legend */}
            <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Legenda</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-padel-green/20 ring-1 ring-padel-green/40" />
                  Match beschikbaar
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-padel-blue ring-1 ring-padel-blue" />
                  Geselecteerde dag
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full ring-2 ring-padel-green bg-white" />
                  Vandaag
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-padel-green-dark font-medium">3p</span>
                  Aantal spelers
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
