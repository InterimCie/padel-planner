import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns'
import { nl } from 'date-fns/locale'
import { useRef, useCallback } from 'react'

const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

// Minimum movement in px before we consider it a scroll (not a tap)
const SCROLL_THRESHOLD = 8

export default function Calendar({ selectedDate, onSelectDate, onChangeMonth, signups }) {
  const today = new Date()
  const monthStart = startOfMonth(selectedDate || today)
  const monthEnd = endOfMonth(monthStart)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  // Track touch start position to distinguish tap vs scroll
  const touchStartRef = useRef(null)

  const days = []
  let day = calStart
  while (day <= calEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  function getSlotCountForDay(date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    let totalPlayers = 0
    for (const [key, players] of Object.entries(signups)) {
      if (key.startsWith(dateStr)) {
        totalPlayers += players.length
      }
    }
    return totalPlayers
  }

  function hasMatchOnDay(date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    for (const [key, players] of Object.entries(signups)) {
      if (key.startsWith(dateStr) && players.length >= 4) {
        return true
      }
    }
    return false
  }

  // Touch handlers to prevent accidental selection while scrolling
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchEnd = useCallback((e, date) => {
    if (!touchStartRef.current) return
    const touch = e.changedTouches[0]
    const dx = Math.abs(touch.clientX - touchStartRef.current.x)
    const dy = Math.abs(touch.clientY - touchStartRef.current.y)
    touchStartRef.current = null
    // Only select if finger didn't move (real tap, not scroll)
    if (dx < SCROLL_THRESHOLD && dy < SCROLL_THRESHOLD) {
      onSelectDate(date)
    }
  }, [onSelectDate])

  // For month nav, only change displayed month (not navigate to day)
  function handlePrevMonth() {
    const prev = subMonths(monthStart, 1)
    onChangeMonth(prev)
  }

  function handleNextMonth() {
    const next = addMonths(monthStart, 1)
    onChangeMonth(next)
  }

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 min-h-[calc(100vh-10rem)]">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 text-padel-blue font-bold text-xl transition-colors"
          >
            &larr;
          </button>
          <h2 className="text-xl font-bold text-padel-blue capitalize">
            {format(monthStart, 'MMM yyyy', { locale: nl })}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 text-padel-blue font-bold text-xl transition-colors"
          >
            &rarr;
          </button>
        </div>

        {/* Instruction */}
        <p className="text-center text-xs text-gray-400 mb-2">
          Tik op een datum
        </p>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-1">
          {WEEKDAYS.map(wd => (
            <div key={wd} className="text-center text-sm font-semibold text-gray-400 py-0.5">
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 flex-1">
          {days.map((d, i) => {
            const inMonth = isSameMonth(d, monthStart)
            const isPast = isBefore(d, startOfDay(today))
            const isActive = inMonth && !isPast
            const selected = selectedDate && isSameDay(d, selectedDate)
            const todayFlag = isToday(d)
            const playerCount = getSlotCountForDay(d)
            const hasMatch = hasMatchOnDay(d)

            return (
              <div
                key={i}
                className="flex items-center justify-center"
              >
                <button
                  onClick={(e) => {
                    if (e.detail > 0 && isActive) onSelectDate(d)
                  }}
                  onTouchStart={isActive ? handleTouchStart : undefined}
                  onTouchEnd={isActive ? (e) => { e.preventDefault(); handleTouchEnd(e, d) } : undefined}
                  disabled={!isActive}
                  className={`
                    w-full aspect-square flex flex-col items-center justify-center rounded-lg text-base font-semibold transition-all
                    ${!inMonth ? 'text-gray-200 cursor-default' : ''}
                    ${inMonth && isPast ? 'text-gray-300 cursor-default' : ''}
                    ${isActive && !selected ? 'text-padel-blue hover:bg-padel-green-light/30 active:scale-95 cursor-pointer border border-transparent hover:border-padel-green/40' : ''}
                    ${selected ? 'bg-padel-blue text-white shadow-md border border-padel-blue' : ''}
                    ${todayFlag && !selected ? 'ring-2 ring-padel-green ring-offset-1' : ''}
                    ${hasMatch && !selected ? 'bg-padel-green/20 border border-padel-green/40' : ''}
                  `}
                >
                  <span>{format(d, 'd')}</span>
                  {playerCount > 0 && inMonth && (
                    <span className={`text-[10px] leading-none mt-0.5 font-bold ${selected ? 'text-padel-green-light' : 'text-padel-green-dark'}`}>
                      {playerCount}p
                    </span>
                  )}
                  {hasMatch && !selected && (
                    <span className="text-[9px] leading-none text-padel-green-dark font-bold">
                      ✓
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
