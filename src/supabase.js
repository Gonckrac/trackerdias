import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fsjhceaditsixbeglzmi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzamhjZWFkaXRzaXhiZWdsem1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODUyMzMsImV4cCI6MjA5MzA2MTIzM30.fcaG2JKDKEmXd8NMbd2t1xKKrIWaA1E_9L1BwrrKgO8'
)

function getUserId() {
  let id = localStorage.getItem('rutina-user-id')
  if (!id) {
    id = 'user_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
    localStorage.setItem('rutina-user-id', id)
  }
  return id
}

export async function loadData() {
  try {
    const userId = getUserId()
    const { data, error } = await supabase
      .from('rutina_data')
      .select('value')
      .eq('user_id', userId)
      .eq('key', 'tracker')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase load error:', error)
      const local = localStorage.getItem('rutina-backup')
      return local ? JSON.parse(local) : null
    }
    return data ? JSON.parse(data.value) : null
  } catch (e) {
    console.error('Load error:', e)
    const local = localStorage.getItem('rutina-backup')
    return local ? JSON.parse(local) : null
  }
}

export async function saveData(value) {
  const jsonValue = JSON.stringify(value)
  localStorage.setItem('rutina-backup', jsonValue)

  try {
    const userId = getUserId()
    const { error } = await supabase
      .from('rutina_data')
      .upsert(
        { user_id: userId, key: 'tracker', value: jsonValue, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' }
      )
    if (error) console.error('Supabase save error:', error)
  } catch (e) {
    console.error('Save error:', e)
  }
}
