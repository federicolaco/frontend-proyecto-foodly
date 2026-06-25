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
    nextIds: {
      user: 100,
      order: 1,
      dish: 10000,
      promotion: 100,
      localRequest: 1,
      restaurant: 100,
    },
  })
}

export function ensureMockDb() {
  if (!getDb()) seedMockDb()
}
