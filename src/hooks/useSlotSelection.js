import { useState, useRef, useCallback } from 'react'

export function useSlotSelection(allSlotKeys) {
  const [selectedRange, setSelectedRange] = useState(null) // { startIdx, endIdx }
  const [isDragging, setIsDragging] = useState(false)
  const startIdxRef = useRef(null)
  const slotElementsRef = useRef(new Map()) // slotKey -> DOM element

  // Called by each TimeSlot to register its DOM element
  const registerSlotRef = useCallback((slotKey, element) => {
    if (element) {
      slotElementsRef.current.set(slotKey, element)
    } else {
      slotElementsRef.current.delete(slotKey)
    }
  }, [])

  // Find which slot index a Y coordinate falls within
  const getSlotIndexAtY = useCallback((clientY) => {
    for (let i = 0; i < allSlotKeys.length; i++) {
      const el = slotElementsRef.current.get(allSlotKeys[i])
      if (el) {
        const rect = el.getBoundingClientRect()
        if (clientY >= rect.top && clientY <= rect.bottom) {
          return i
        }
      }
    }
    // Clamp: if above all slots, return first; if below, return last
    if (allSlotKeys.length === 0) return null
    const firstEl = slotElementsRef.current.get(allSlotKeys[0])
    if (firstEl && clientY < firstEl.getBoundingClientRect().top) return 0
    return allSlotKeys.length - 1
  }, [allSlotKeys])

  const handleDragStart = useCallback((slotKey, clientY) => {
    const idx = allSlotKeys.indexOf(slotKey)
    if (idx === -1) return
    startIdxRef.current = idx
    setSelectedRange({ startIdx: idx, endIdx: idx })
    setIsDragging(true)
  }, [allSlotKeys])

  const handleDragMove = useCallback((clientY) => {
    if (startIdxRef.current === null) return
    const currentIdx = getSlotIndexAtY(clientY)
    if (currentIdx !== null) {
      setSelectedRange({
        startIdx: Math.min(startIdxRef.current, currentIdx),
        endIdx: Math.max(startIdxRef.current, currentIdx),
      })
    }
  }, [getSlotIndexAtY])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    const range = selectedRange
    startIdxRef.current = null
    if (range) {
      const keys = allSlotKeys.slice(range.startIdx, range.endIdx + 1)
      setSelectedRange(null)
      return keys
    }
    setSelectedRange(null)
    return null
  }, [selectedRange, allSlotKeys])

  const cancelDrag = useCallback(() => {
    setIsDragging(false)
    setSelectedRange(null)
    startIdxRef.current = null
  }, [])

  // Check if a slot is currently in the drag selection
  const isInSelection = useCallback((slotKey) => {
    if (!selectedRange) return false
    const idx = allSlotKeys.indexOf(slotKey)
    return idx >= selectedRange.startIdx && idx <= selectedRange.endIdx
  }, [selectedRange, allSlotKeys])

  return {
    isDragging,
    selectedRange,
    isInSelection,
    registerSlotRef,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    cancelDrag,
  }
}
