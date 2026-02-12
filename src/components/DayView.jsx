import { useRef, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
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

export default function DayView({
  date,
  currentPlayer,
  signups,
  comments,
  finalized,
  onBatchToggleSignup,
  onSetComment,
  onToggleFinalized,
  onBack,
}) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const slotKeys = TIME_SLOTS.map(t => `${dateStr}_${t}`)

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
        e.preventDefault() // prevent page scroll during drag selection
      }
      handleDragMove(touch.clientY)
    }

    el.addEventListener('touchmove', handler, { passive: false })
    return () => el.removeEventListener('touchmove', handler)
  }, [handleDragMove])

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
      // Tap: apply 1-hour minimum booking
      handleSingleSlotTap(touchStartSlotRef.current)
      cancelDrag()
    } else {
      // Drag: apply range selection
      const selectedKeys = handleDragEnd()
      if (selectedKeys && selectedKeys.length > 0) {
        const bookableKeys = selectedKeys.filter(key => !finalized[key])
        if (bookableKeys.length > 0) {
          onBatchToggleSignup(bookableKeys, currentPlayer)
        }
      }
    }
    touchStartYRef.current = null
    touchStartSlotRef.current = null
  }

  // Mouse support for desktop
  function onMouseDown(e) {
    // Ignore clicks on buttons/inputs inside slots
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
        const bookableKeys = selectedKeys.filter(key => !finalized[key])
        if (bookableKeys.length > 0) {
          onBatchToggleSignup(bookableKeys, currentPlayer)
        }
      }
    }
    touchStartYRef.current = null
    touchStartSlotRef.current = null
  }

  // Tap on a single slot: book 1 hour (this + next 30-min slot)
  function handleSingleSlotTap(slotKey) {
    if (finalized[slotKey]) return
    const idx = slotKeys.indexOf(slotKey)
    if (idx === -1) return
    const keysToToggle = [slotKey]
    // Auto-pair with next slot for 1-hour minimum (except last slot 21:30)
    if (idx < slotKeys.length - 1 && !finalized[slotKeys[idx + 1]]) {
      keysToToggle.push(slotKeys[idx + 1])
    }
    onBatchToggleSignup(keysToToggle, currentPlayer)
  }

  // Quick-select a preset time range
  function handleQuickSelect(preset) {
    const startIdx = TIME_SLOTS.indexOf(preset.startTime)
    const endIdx = TIME_SLOTS.indexOf(preset.endTime)
    if (startIdx === -1 || endIdx === -1) return
    const keys = slotKeys.slice(startIdx, endIdx + 1)
    const bookableKeys = keys.filter(key => !finalized[key])
    if (bookableKeys.length > 0) {
      onBatchToggleSignup(bookableKeys, currentPlayer)
    }
  }

  return (
    <div>
      {/* Day header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-white/50 text-padel-blue font-bold text-xl transition-colors"
        >
          &larr;
        </button>
        <div>
          <h2 className="text-lg font-bold text-padel-blue capitalize">
            {format(date, 'EEEE d MMMM', { locale: nl })}
          </h2>
          <p className="text-xs text-gray-400">
            Tik = 1 uur boeken · Sleep = meerdere slots
          </p>
        </div>
      </div>

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

      {/* Time slots container with touch/mouse handlers */}
      <div
        ref={containerRef}
        className="space-y-1 select-none"
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
    </div>
  )
}
