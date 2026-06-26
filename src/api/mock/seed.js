import { getDb, saveDb } from './db'
import { SEED_DISHES, SEED_PROMOTIONS, SEED_RESTAURANTS, SEED_USERS } from './seedData'

export function seedMockDb() {
  saveDb({
    users: SEED_USERS,
    localRequests: [],
    restaurants: SEED_RESTAURANTS,
    dishes: SEED_DISHES,
    promotions: SEED_PROMOTIONS,
    orders: [],
    claims: [],
    ratings: [],
    nextIds: {
      user: 100,
      order: 1,
      dish: 10000,
      promotion: 100,
      localRequest: 1,
      restaurant: 100,
      claim: 1,
      rating: 1,
    },
  })
}

export function ensureMockDb() {
  const db = getDb()
  if (!db) {
    seedMockDb()
    return
  }

  let changed = false
  if (!db.claims) { db.claims = []; changed = true }
  if (!db.ratings) { db.ratings = []; changed = true }
  if (!db.nextIds) db.nextIds = {}
  if (db.nextIds.claim == null) { db.nextIds.claim = 1; changed = true }
  if (db.nextIds.rating == null) { db.nextIds.rating = 1; changed = true }
  if (changed) saveDb(db)
}
