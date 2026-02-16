import { useState, useCallback } from 'react'
import NameEntry from './components/NameEntry'
import HomePage from './components/HomePage'
import Calendar from './components/Calendar'
import DayView from './components/DayView'
import { useSlotData } from './hooks/useSlotData'

// Views: 'home' | 'calendar' | 'day'
export default function App() {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('padel-player-name') || ''
  })
  const [view, setView] = useState('home')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewingDay, setViewingDay] = useState(null)

  const {
    signups,
    comments,
    finalized,
    loading,
    batchToggleSignup,
    setComment,
    setBatchComment,
    toggleFinalized,
    clearAllSignups,
  } = useSlotData()

  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const isAdmin = playerName.toLowerCase() === 'angele'

  const handleClearAll = useCallback(async () => {
    await clearAllSignups()
    setShowClearConfirm(false)
  }, [clearAllSignups])

  function handleGoToCalendar() {
    setView('calendar')
  }

  function handleSelectDate(date) {
    setSelectedDate(date)
    setViewingDay(date)
    setView('day')
  }

  function handleChangeMonth(date) {
    setSelectedDate(date)
  }

  function handleBackToCalendar() {
    setView('calendar')
    setViewingDay(null)
  }

  function handleNavigateDay(date) {
    setViewingDay(date)
    setSelectedDate(date)
  }

  function handleChangeName() {
    localStorage.removeItem('padel-player-name')
    setPlayerName('')
    setView('home')
  }

  if (!playerName) {
    return <NameEntry onNameSet={(name) => { setPlayerName(name); setView('home') }} />
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
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-xl">🎾</span>
          <h1 className="font-bold text-lg">Padel Planner</h1>
        </button>
        <button
          onClick={handleChangeName}
          className="flex items-center gap-1.5 text-sm bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors"
        >
          <span className="text-padel-green-light font-semibold">{playerName}</span>
          <span className="text-white/60 text-xs">wijzig</span>
        </button>
      </header>

      {/* Admin: clear all button */}
      {isAdmin && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100">
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-red-500 font-medium hover:text-red-700 transition-colors"
            >
              🗑 Alle boekingen wissen
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-medium">Weet je het zeker?</span>
              <button
                onClick={handleClearAll}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
              >
                Ja, alles wissen
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-200 text-gray-600 font-medium hover:bg-gray-300 transition-colors"
              >
                Annuleren
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <main className="px-2 py-4 pb-8">
        {view === 'home' && (
          <HomePage
            playerName={playerName}
            onGoToCalendar={handleGoToCalendar}
          />
        )}

        {view === 'calendar' && (
          <Calendar
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onChangeMonth={handleChangeMonth}
            signups={signups}
          />
        )}

        {view === 'day' && viewingDay && (
          <DayView
            date={viewingDay}
            currentPlayer={playerName}
            signups={signups}
            comments={comments}
            finalized={finalized}
            onBatchToggleSignup={batchToggleSignup}
            onSetComment={setComment}
            onBatchSetComment={setBatchComment}
            onToggleFinalized={toggleFinalized}
            onBack={handleBackToCalendar}
            onNavigateDay={handleNavigateDay}
          />
        )}
      </main>
    </div>
  )
}
