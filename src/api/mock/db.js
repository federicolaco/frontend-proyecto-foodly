const DB_KEY = 'foodly_mock_db'

export function getDb() {
  const raw = localStorage.getItem(DB_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

export function updateDb(updater) {
  const db = getDb()
  if (!db) throw new Error('Base de datos no inicializada')
  const clone = structuredClone(db)
  const result = updater(clone)
  saveDb(clone)
  return result !== undefined ? result : clone
}

export function nextId(db, key) {
  const id = db.nextIds[key] ?? 1
  db.nextIds[key] = id + 1
  return id
}
