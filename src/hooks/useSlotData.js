import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const LOCAL_STORAGE_KEY = 'padel-planner-data'

function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { signups: {}, comments: {}, finalized: {} }
}

function saveLocal(data) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
}

export function useSlotData() {
  // signups: { [slotKey]: string[] }
  // comments: { [slotKey]: string }
  // finalized: { [slotKey]: { by: string, at: string } }
  const [signups, setSignups] = useState({})
  const [comments, setComments] = useState({})
  const [finalized, setFinalized] = useState({})
  const [loading, setLoading] = useState(true)
  const subscriptionsRef = useRef([])

  // Initial load
  useEffect(() => {
    if (supabase) {
      loadFromSupabase()
      setupRealtimeSubscriptions()
    } else {
      const data = loadLocal()
      setSignups(data.signups)
      setComments(data.comments)
      setFinalized(data.finalized)
      setLoading(false)
    }

    return () => {
      subscriptionsRef.current.forEach(sub => sub.unsubscribe())
    }
  }, [])

  // Persist locally as backup
  useEffect(() => {
    if (!loading) {
      saveLocal({ signups, comments, finalized })
    }
  }, [signups, comments, finalized, loading])

  async function loadFromSupabase() {
    try {
      const [signupsRes, commentsRes, finalizedRes] = await Promise.all([
        supabase.from('slot_signups').select('*'),
        supabase.from('slot_comments').select('*'),
        supabase.from('slot_finalized').select('*'),
      ])

      const signupsMap = {}
      for (const row of signupsRes.data || []) {
        if (!signupsMap[row.slot_key]) signupsMap[row.slot_key] = []
        signupsMap[row.slot_key].push(row.player_name)
      }

      const commentsMap = {}
      for (const row of commentsRes.data || []) {
        commentsMap[row.slot_key] = row.comment
      }

      const finalizedMap = {}
      for (const row of finalizedRes.data || []) {
        finalizedMap[row.slot_key] = { by: row.finalized_by, at: row.finalized_at }
      }

      setSignups(signupsMap)
      setComments(commentsMap)
      setFinalized(finalizedMap)
    } catch (err) {
      console.error('Failed to load from Supabase:', err)
      const data = loadLocal()
      setSignups(data.signups)
      setComments(data.comments)
      setFinalized(data.finalized)
    }
    setLoading(false)
  }

  function setupRealtimeSubscriptions() {
    const channel = supabase
      .channel('padel-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slot_signups' }, () => {
        loadFromSupabase()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slot_comments' }, () => {
        loadFromSupabase()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slot_finalized' }, () => {
        loadFromSupabase()
      })
      .subscribe()

    subscriptionsRef.current.push(channel)
  }

  const toggleSignup = useCallback(async (slotKey, playerName) => {
    if (!playerName?.trim()) return

    const current = signups[slotKey] || []
    const isSignedUp = current.includes(playerName)

    if (isSignedUp) {
      // Remove
      setSignups(prev => {
        const updated = { ...prev }
        updated[slotKey] = (updated[slotKey] || []).filter(n => n !== playerName)
        if (updated[slotKey].length === 0) delete updated[slotKey]
        return updated
      })

      if (supabase) {
        await supabase
          .from('slot_signups')
          .delete()
          .eq('slot_key', slotKey)
          .eq('player_name', playerName)
      }
    } else {
      // Add
      setSignups(prev => {
        const updated = { ...prev }
        updated[slotKey] = [...(updated[slotKey] || []), playerName]
        return updated
      })

      if (supabase) {
        await supabase
          .from('slot_signups')
          .insert({ slot_key: slotKey, player_name: playerName })
      }
    }
  }, [signups])

  const setComment = useCallback(async (slotKey, comment) => {
    setComments(prev => ({ ...prev, [slotKey]: comment }))

    if (supabase) {
      await supabase
        .from('slot_comments')
        .upsert({ slot_key: slotKey, comment, updated_at: new Date().toISOString() })
    }
  }, [])

  const toggleFinalized = useCallback(async (slotKey, playerName) => {
    const isFinalized = !!finalized[slotKey]

    if (isFinalized) {
      setFinalized(prev => {
        const updated = { ...prev }
        delete updated[slotKey]
        return updated
      })

      if (supabase) {
        await supabase.from('slot_finalized').delete().eq('slot_key', slotKey)
      }
    } else {
      const entry = { by: playerName, at: new Date().toISOString() }
      setFinalized(prev => ({ ...prev, [slotKey]: entry }))

      if (supabase) {
        await supabase
          .from('slot_finalized')
          .upsert({ slot_key: slotKey, finalized_by: playerName, finalized_at: entry.at })
      }
    }
  }, [finalized])

  const batchToggleSignup = useCallback(async (slotKeys, playerName) => {
    if (!playerName?.trim() || slotKeys.length === 0) return

    // Determine action based on the first slot's state
    const firstSlotPlayers = signups[slotKeys[0]] || []
    const action = firstSlotPlayers.includes(playerName) ? 'remove' : 'add'

    if (action === 'remove') {
      // Optimistic UI: remove player from all slots at once
      setSignups(prev => {
        const updated = { ...prev }
        for (const key of slotKeys) {
          updated[key] = (updated[key] || []).filter(n => n !== playerName)
          if (updated[key].length === 0) delete updated[key]
        }
        return updated
      })

      if (supabase) {
        await Promise.all(
          slotKeys.map(key =>
            supabase
              .from('slot_signups')
              .delete()
              .eq('slot_key', key)
              .eq('player_name', playerName)
          )
        )
      }
    } else {
      // Optimistic UI: add player to all slots at once
      setSignups(prev => {
        const updated = { ...prev }
        for (const key of slotKeys) {
          const current = updated[key] || []
          if (!current.includes(playerName)) {
            updated[key] = [...current, playerName]
          }
        }
        return updated
      })

      if (supabase) {
        const rows = slotKeys.map(key => ({ slot_key: key, player_name: playerName }))
        await supabase
          .from('slot_signups')
          .upsert(rows, { onConflict: 'slot_key,player_name', ignoreDuplicates: true })
      }
    }
  }, [signups])

  const setBatchComment = useCallback(async (slotKeys, comment) => {
    if (!slotKeys.length || !comment?.trim()) return

    // Optimistic UI: set comment on all slots at once
    setComments(prev => {
      const updated = { ...prev }
      for (const key of slotKeys) {
        updated[key] = comment
      }
      return updated
    })

    if (supabase) {
      const rows = slotKeys.map(key => ({
        slot_key: key,
        comment,
        updated_at: new Date().toISOString(),
      }))
      await supabase.from('slot_comments').upsert(rows)
    }
  }, [])

  return {
    signups,
    comments,
    finalized,
    loading,
    toggleSignup,
    batchToggleSignup,
    setComment,
    setBatchComment,
    toggleFinalized,
  }
}
