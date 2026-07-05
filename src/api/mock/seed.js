import { getDb, saveDb } from './db'
import {
  SEED_CATEGORIES,
  SEED_DISHES,
  SEED_PROMOTIONS,
  SEED_RESTAURANTS,
  SEED_USERS,
} from './seedData'

function normalizeCategoryName(value = '') {
  return String(value)
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function buildCategoryMigration(db) {
  const categories = []
  const keyToCategory = new Map()
  let nextCategoryId = Number(db.nextIds?.category ?? 1)

  const registerCategory = (localId, rawCategory) => {
    if (!localId || rawCategory == null) return null

    const rawId = typeof rawCategory === 'object' ? rawCategory.id : rawCategory
    const rawName =
      typeof rawCategory === 'object'
        ? rawCategory.name ?? rawCategory.nombre ?? rawCategory.label ?? rawCategory.id
        : rawCategory

    const name = normalizeCategoryName(rawName)
    if (!name) return null

    const key = `${localId}:${name.toLowerCase()}`
    const existing = keyToCategory.get(key)
    if (existing) return existing

    const numericId = Number(rawId)
    const id = Number.isInteger(numericId) && numericId > 0 ? numericId : nextCategoryId++
    const category = { id, localId: Number(localId), name }
    categories.push(category)
    keyToCategory.set(key, category)
    if (id >= nextCategoryId) nextCategoryId = id + 1
    return category
  }

  for (const restaurant of db.restaurants ?? []) {
    for (const category of restaurant.categories ?? []) {
      registerCategory(restaurant.id, category)
    }
  }

  for (const dish of db.dishes ?? []) {
    if (dish.categoryId == null || dish.categoryId === '') continue

    const alreadyNumeric = Number(dish.categoryId)
    if (Number.isInteger(alreadyNumeric) && alreadyNumeric > 0) {
      const existing = (db.categories ?? []).find((category) => category.id === alreadyNumeric)
      if (existing) {
        registerCategory(existing.localId ?? dish.restaurantId, existing.name ?? existing.nombre)
        dish.categoryId = existing.id
        continue
      }
    }

    const restaurant = (db.restaurants ?? []).find((entry) => entry.id === dish.restaurantId)
    const matchingLegacyCategory = restaurant?.categories?.find(
      (category) => String(category.id) === String(dish.categoryId),
    )
    const category = registerCategory(
      dish.restaurantId,
      matchingLegacyCategory ?? dish.categoryName ?? dish.categoryId,
    )
    dish.categoryId = category?.id ?? null
  }

  return { categories, nextCategoryId }
}

export function seedMockDb() {
  saveDb({
    users: SEED_USERS,
    localRequests: [],
    restaurants: SEED_RESTAURANTS,
    categories: SEED_CATEGORIES,
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
      category: 13,
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

  if (!db.claims) {
    db.claims = []
    changed = true
  }

  if (!db.ratings) {
    db.ratings = []
    changed = true
  }

  if (!db.nextIds) {
    db.nextIds = {}
    changed = true
  }

  if (db.nextIds.claim == null) {
    db.nextIds.claim = 1
    changed = true
  }

  if (db.nextIds.rating == null) {
    db.nextIds.rating = 1
    changed = true
  }

  if (!Array.isArray(db.categories) || db.categories.length === 0) {
    const { categories, nextCategoryId } = buildCategoryMigration(db)
    db.categories = categories
    db.nextIds.category = nextCategoryId
    changed = true
  } else {
    if (db.nextIds.category == null) {
      const maxCategoryId = db.categories.reduce(
        (maxValue, category) => Math.max(maxValue, Number(category.id) || 0),
        0,
      )
      db.nextIds.category = maxCategoryId + 1
      changed = true
    }

    for (const dish of db.dishes ?? []) {
      if (dish.categoryId == null || dish.categoryId === '') continue

      const numericCategoryId = Number(dish.categoryId)
      if (!Number.isInteger(numericCategoryId) || numericCategoryId <= 0) {
        const category = db.categories.find(
          (entry) => entry.localId === dish.restaurantId && entry.name.toLowerCase() === normalizeCategoryName(dish.categoryId).toLowerCase(),
        )
        if (category) {
          dish.categoryId = category.id
          changed = true
        }
      }
    }
  }

  if (changed) saveDb(db)
}
