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

const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

export default function Calendar({ selectedDate, onSelectDate, signups }) {
  const today = new Date()
  const monthStart = startOfMonth(selectedDate || today)
  const monthEnd = endOfMonth(monthStart)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

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

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onSelectDate(subMonths(selectedDate || today, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-padel-blue font-bold text-xl transition-colors"
        >
          &larr;
        </button>
        <h2 className="text-lg font-bold text-padel-blue capitalize">
          {format(monthStart, 'MMMM yyyy', { locale: nl })}
        </h2>
        <button
          onClick={() => onSelectDate(addMonths(selectedDate || today, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-padel-blue font-bold text-xl transition-colors"
        >
          &rarr;
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(wd => (
          <div key={wd} className="text-center text-xs font-semibold text-gray-400 py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const inMonth = isSameMonth(d, monthStart)
          const isPast = isBefore(d, startOfDay(today))
          const selected = selectedDate && isSameDay(d, selectedDate)
          const todayFlag = isToday(d)
          const playerCount = getSlotCountForDay(d)
          const hasMatch = hasMatchOnDay(d)

          return (
            <button
              key={i}
              onClick={() => !isPast && inMonth && onSelectDate(d)}
              disabled={isPast || !inMonth}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all
                ${!inMonth ? 'text-gray-200 cursor-default' : ''}
                ${inMonth && isPast ? 'text-gray-300 cursor-default' : ''}
                ${inMonth && !isPast && !selected ? 'text-padel-blue hover:bg-padel-green-light/30 cursor-pointer' : ''}
                ${selected ? 'bg-padel-blue text-white shadow-md' : ''}
                ${todayFlag && !selected ? 'ring-2 ring-padel-green' : ''}
                ${hasMatch && !selected ? 'bg-padel-green/20' : ''}
              `}
            >
              <span>{format(d, 'd')}</span>
              {playerCount > 0 && inMonth && (
                <span className={`text-[10px] leading-none mt-0.5 ${selected ? 'text-padel-green-light' : 'text-padel-green-dark'}`}>
                  {playerCount}p
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
