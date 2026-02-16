import { useState, useCallback, memo } from 'react'

const TimeSlot = memo(function TimeSlot({
  slotKey,
  time,
  players,
  comment,
  finalizedInfo,
  currentPlayer,
  onSetComment,
  onToggleFinalized,
  isInSelection,
  registerRef,
  isLastSlot,
}) {
  const [expanded, setExpanded] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [commentText, setCommentText] = useState(comment || '')

  const playerCount = players.length
  const isMatch = playerCount >= 4
  const isFinalized = !!finalizedInfo
  const isSignedUp = players.includes(currentPlayer)
  const isHalfHour = time.endsWith(':30')

  // Callback ref for drag selection positioning
  const refCallback = useCallback((el) => {
    if (registerRef) registerRef(slotKey, el)
  }, [registerRef, slotKey])

  function handleCommentSave() {
    onSetComment(slotKey, commentText)
    setShowComment(false)
  }

  function handleFinalize(e) {
    e.stopPropagation()
    onToggleFinalized(slotKey, currentPlayer)
  }

  // Background / border styling
  let bgClass = 'bg-white border-gray-100'
  if (isInSelection) {
    bgClass = 'bg-padel-blue/15 border-padel-blue ring-2 ring-padel-blue/40'
  } else if (isFinalized) {
    bgClass = 'bg-padel-blue/10 border-padel-blue/40'
  } else if (isMatch) {
    bgClass = 'bg-padel-green/10 border-padel-green/40'
  } else if (isSignedUp) {
    bgClass = 'bg-padel-green/5 border-padel-green/20'
  } else if (playerCount > 0) {
    bgClass = 'bg-amber-50 border-amber-200/50'
  }

  // Truncate name to 15 chars
  function truncName(name) {
    return name.length > 15 ? name.slice(0, 15) + '\u2026' : name
  }

  return (
    <div
      ref={refCallback}
      data-slot-key={slotKey}
      className={`border rounded-lg transition-all ${bgClass} ${isHalfHour ? 'border-l-2 border-l-gray-200/60' : 'border-l-4 border-l-padel-blue/30'}`}
    >
      {/* Compact row: time | names stacked | badges */}
      <div className="flex items-start gap-1.5 px-2 py-1.5">
        {/* Time */}
        <span className={`font-mono text-[11px] w-10 shrink-0 pt-0.5 ${isHalfHour ? 'text-gray-400 font-normal' : 'text-padel-blue font-bold'}`}>
          {time}
        </span>

        {/* Names stacked vertically */}
        <div className="flex-1 min-w-0">
          {players.length > 0 ? (
            players.map(name => (
              <div
                key={name}
                className={`text-[11px] leading-tight truncate ${
                  name === currentPlayer
                    ? 'text-padel-green font-semibold'
                    : 'text-gray-600'
                }`}
              >
                {truncName(name)}
              </div>
            ))
          ) : (
            <span className="text-[11px] text-gray-300 italic leading-tight">{'\u2014'}</span>
          )}
        </div>

        {/* Minimal badges */}
        <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
          {comment && !expanded && (
            <span className="text-[9px]">💬</span>
          )}
          {isFinalized && (
            <span className="text-[7px] bg-padel-blue text-white px-1 py-px rounded-full font-bold leading-none">
              DEF
            </span>
          )}
          {isMatch && !isFinalized && (
            <span className="text-[7px] bg-padel-green text-white px-1 py-px rounded-full font-bold leading-none">
              ✓
            </span>
          )}
          <span className={`text-[9px] font-medium w-4 text-right ${playerCount >= 4 ? 'text-padel-green-dark' : 'text-gray-300'}`}>
            {playerCount}/4
          </span>

          {/* Expand toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className="text-gray-300 hover:text-gray-500 text-[9px] p-0.5 transition-colors"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-2 pb-2 pt-1 border-t border-gray-100">
          {isLastSlot && (
            <p className="text-[10px] text-amber-500 mb-1.5">⏱ Laatste slot</p>
          )}

          {comment && !showComment && (
            <p className="text-[10px] text-gray-500 italic mb-2 flex items-start gap-1">
              <span>💬</span> {comment}
            </p>
          )}

          {showComment && (
            <div className="flex gap-1.5 mb-2">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Opmerking..."
                className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-padel-green"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleCommentSave() }}
                className="text-xs px-2.5 py-1.5 bg-padel-blue text-white rounded-lg font-medium"
              >
                OK
              </button>
            </div>
          )}

          <div className="flex gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); setShowComment(!showComment) }}
              className="text-[10px] px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors font-medium"
            >
              💬 Opmerking
            </button>

            {isMatch && (
              <button
                onClick={handleFinalize}
                className={`
                  text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-colors
                  ${isFinalized
                    ? 'bg-padel-blue text-white hover:bg-padel-blue-light'
                    : 'bg-padel-blue/10 text-padel-blue hover:bg-padel-blue/20'
                  }
                `}
              >
                {isFinalized ? '✓ Definitief' : '🔒 Bevestig'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

export default TimeSlot
