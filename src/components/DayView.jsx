import { useState, useRef, useEffect } from 'react'
import { format, addDays, subDays, isToday, isBefore, startOfDay } from 'date-fns'
import { nl } from 'date-fns/locale'
import TimeSlot from './TimeSlot'
import { useSlotSelection } from '../hooks/useSlotSelection'

// Generate 30-min time slots from 08:00 to 22:00
function generateTimeSlots() {
  const slots = []
  for (let h = 8; h < 22; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

// Quick-select presets
const QUICK_PRESETS = [
  { label: 'Ochtend', icon: '🌅', startTime: '08:00', endTime: '11:30' },
  { label: 'Middag', icon: '☀️', startTime: '12:00', endTime: '16:30' },
  { label: 'Avond', icon: '🌙', startTime: '17:00', endTime: '21:30' },
]

// Extract time from slotKey "2026-02-12_09:30" → "09:30"
function timeFromKey(key) {
  return key.split('_')[1] || ''
}

export default function DayView({
  date,
  currentPlayer,
  signups,
  comments,
  finalized,
  onBatchToggleSignup,
  onSetComment,
  onBatchSetComment,
  onToggleFinalized,
  onBack,
  onNavigateDay,
}) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const slotKeys = TIME_SLOTS.map(t => `${dateStr}_${t}`)

  // State for the comment bar shown after booking multiple slots
  const [lastBookedSlots, setLastBookedSlots] = useState([])
  const [blockComment, setBlockComment] = useState('')
  const commentBarRef = useRef(null)

  const today = new Date()
  const canGoPrev = !isBefore(subDays(date, 1), startOfDay(today))

  const {
    isDragging,
    isInSelection,
    registerSlotRef,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    cancelDrag,
  } = useSlotSelection(slotKeys)

  const containerRef = useRef(null)
  const touchStartYRef = useRef(null)
  const touchStartSlotRef = useRef(null)
  const movedRef = useRef(false)

  // Non-passive touchmove listener for preventDefault() during drag
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handler = (e) => {
      if (touchStartSlotRef.current === null) return
      const touch = e.touches[0]
      const deltaY = Math.abs(touch.clientY - (touchStartYRef.current || 0))
      if (deltaY > 10) {
        movedRef.current = true
        e.preventDefault()
      }
      handleDragMove(touch.clientY)
    }

    el.addEventListener('touchmove', handler, { passive: false })
    return () => el.removeEventListener('touchmove', handler)
  }, [handleDragMove])

  // Scroll comment bar into view
  useEffect(() => {
    if (lastBookedSlots.length > 0 && commentBarRef.current) {
      commentBarRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [lastBookedSlots])

  // Clear comment bar when navigating to a different day
  useEffect(() => {
    setLastBookedSlots([])
    setBlockComment('')
  }, [date])

  // --- Direct booking helpers ---
  function bookSlots(keys) {
    const bookableKeys = keys.filter(key => !finalized[key])
    if (bookableKeys.length > 0) {
      onBatchToggleSignup(bookableKeys, currentPlayer)
      // Show comment bar for multi-slot bookings (only when adding, not removing)
      const isAdding = !(signups[bookableKeys[0]] || []).includes(currentPlayer)
      if (isAdding && bookableKeys.length > 1) {
        setLastBookedSlots(bookableKeys)
        setBlockComment('')
      } else {
        setLastBookedSlots([])
      }
    }
  }

  function handleSaveBlockComment() {
    if (blockComment.trim() && lastBookedSlots.length > 0) {
      onBatchSetComment(lastBookedSlots, blockComment.trim())
    }
    setLastBookedSlots([])
    setBlockComment('')
  }

  function handleDismissCommentBar() {
    setLastBookedSlots([])
    setBlockComment('')
  }

  // --- Touch handlers ---
  function onTouchStart(e) {
    const touch = e.touches[0]
    touchStartYRef.current = touch.clientY
    movedRef.current = false
    const slotEl = e.target.closest('[data-slot-key]')
    if (slotEl) {
      const key = slotEl.dataset.slotKey
      touchStartSlotRef.current = key
      handleDragStart(key, touch.clientY)
    }
  }

  function onTouchEnd() {
    if (!movedRef.current && touchStartSlotRef.current) {
      handleSingleSlotTap(touchStartSlotRef.current)
      cancelDrag()
    } else {
      const selectedKeys = handleDragEnd()
      if (selectedKeys && selectedKeys.length > 0) {
        bookSlots(selectedKeys)
      }
    }
    touchStartYRef.current = null
    touchStartSlotRef.current = null
  }

  // --- Mouse handlers ---
  function onMouseDown(e) {
    if (e.target.closest('button') || e.target.closest('input')) return
    const slotEl = e.target.closest('[data-slot-key]')
    if (slotEl) {
      const key = slotEl.dataset.slotKey
      touchStartSlotRef.current = key
      touchStartYRef.current = e.clientY
      movedRef.current = false
      handleDragStart(key, e.clientY)
    }
  }

  function onMouseMove(e) {
    if (touchStartSlotRef.current === null) return
    const deltaY = Math.abs(e.clientY - (touchStartYRef.current || 0))
    if (deltaY > 10) movedRef.current = true
    handleDragMove(e.clientY)
  }

  function onMouseUp() {
    if (touchStartSlotRef.current === null) return
    if (!movedRef.current && touchStartSlotRef.current) {
      handleSingleSlotTap(touchStartSlotRef.current)
      cancelDrag()
    } else {
      const selectedKeys = handleDragEnd()
      if (selectedKeys && selectedKeys.length > 0) {
        bookSlots(selectedKeys)
      }
    }
    touchStartYRef.current = null
    touchStartSlotRef.current = null
  }

  // Tap = book 1 hour (this + next 30-min slot)
  function handleSingleSlotTap(slotKey) {
    if (finalized[slotKey]) return
    const idx = slotKeys.indexOf(slotKey)
    if (idx === -1) return
    const keysToToggle = [slotKey]
    if (idx < slotKeys.length - 1 && !finalized[slotKeys[idx + 1]]) {
      keysToToggle.push(slotKeys[idx + 1])
    }
    bookSlots(keysToToggle)
  }

  // Quick-select a preset time range
  function handleQuickSelect(preset) {
    const startIdx = TIME_SLOTS.indexOf(preset.startTime)
    const endIdx = TIME_SLOTS.indexOf(preset.endTime)
    if (startIdx === -1 || endIdx === -1) return
    const keys = slotKeys.slice(startIdx, endIdx + 1)
    bookSlots(keys)
  }

  return (
    <div>
      {/* Day header with prev/next navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => canGoPrev && onNavigateDay(subDays(date, 1))}
          disabled={!canGoPrev}
          className={`p-2 rounded-lg font-bold text-xl transition-colors ${
            canGoPrev
              ? 'text-padel-blue hover:bg-padel-blue/10'
              : 'text-gray-200 cursor-default'
          }`}
        >
          &larr;
        </button>

        <div className="text-center flex-1">
          <h2 className="text-lg font-bold text-padel-blue capitalize">
            {format(date, 'EEEE d MMMM', { locale: nl })}
          </h2>
          <p className="text-xs text-gray-400">
            {isToday(date) ? 'Vandaag' : 'Tik = 1 uur · Sleep = meerdere slots'}
          </p>
        </div>

        <button
          onClick={() => onNavigateDay(addDays(date, 1))}
          className="p-2 rounded-lg text-padel-blue hover:bg-padel-blue/10 font-bold text-xl transition-colors"
        >
          &rarr;
        </button>
      </div>

      {/* Back to calendar link */}
      <button
        onClick={onBack}
        className="text-xs text-padel-blue/60 hover:text-padel-blue mb-3 flex items-center gap-1 transition-colors"
      >
        📅 Terug naar kalender
      </button>

      {/* Quick-select buttons */}
      <div className="flex gap-2 mb-3">
        {QUICK_PRESETS.map(preset => (
          <button
            key={preset.label}
            onClick={() => handleQuickSelect(preset)}
            className="flex-1 text-xs py-2.5 rounded-xl bg-padel-blue/10 text-padel-blue font-semibold hover:bg-padel-blue/20 active:bg-padel-blue/30 transition-colors"
          >
            {preset.icon} {preset.label}
          </button>
        ))}
      </div>

      {/* Drag selection indicator */}
      {isDragging && (
        <div className="text-center text-xs text-padel-blue font-medium bg-padel-blue/5 rounded-lg py-1.5 mb-2 animate-pulse">
          Sleep om te selecteren...
        </div>
      )}

      {/* Time slots container */}
      <div
        ref={containerRef}
        className="space-y-1 select-none w-1/2"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => {
          if (touchStartSlotRef.current) {
            cancelDrag()
            touchStartSlotRef.current = null
          }
        }}
        style={{ touchAction: 'pan-x' }}
      >
        {TIME_SLOTS.map((time, idx) => {
          const slotKey = slotKeys[idx]
          return (
            <TimeSlot
              key={slotKey}
              slotKey={slotKey}
              time={time}
              players={signups[slotKey] || []}
              comment={comments[slotKey] || ''}
              finalizedInfo={finalized[slotKey]}
              currentPlayer={currentPlayer}
              onSetComment={onSetComment}
              onToggleFinalized={onToggleFinalized}
              isInSelection={isInSelection(slotKey)}
              registerRef={registerSlotRef}
              isLastSlot={idx === slotKeys.length - 1}
            />
          )
        })}
      </div>

      {/* Comment bar - appears after booking multiple slots */}
      {lastBookedSlots.length > 0 && (
        <div
          ref={commentBarRef}
          className="sticky bottom-0 left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-padel-green/30 p-4 z-20"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">
              💬 Opmerking voor {timeFromKey(lastBookedSlots[0])} – {timeFromKey(lastBookedSlots[lastBookedSlots.length - 1])}
            </p>
            <button
              onClick={handleDismissCommentBar}
              className="text-gray-300 hover:text-gray-500 text-sm p-0.5 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={blockComment}
              onChange={e => setBlockComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveBlockComment()}
              placeholder="bijv. onder voorbehoud..."
              className="flex-1 text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-padel-green"
              autoFocus
            />
            <button
              onClick={handleSaveBlockComment}
              className="px-4 py-2.5 rounded-xl bg-padel-green text-white font-semibold text-sm hover:bg-padel-green-dark transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
