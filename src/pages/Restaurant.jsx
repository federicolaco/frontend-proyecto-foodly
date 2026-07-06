import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getUserDeliveryAddress } from '../api/backend/helpers'
import { getLocalPublicComments, getMyLocalRating, rateLocal } from '../api/ratings'
import { fetchRestaurant } from '../api/restaurant'
import { OrdersNavbar } from '../components/OrdersNavbar'
import { StarRating } from '../components/StarRating'
import { CartSidebar } from '../components/restaurant/CartSidebar'
import { MenuProductList } from '../components/restaurant/MenuProductList'
import { RestaurantBanner } from '../components/restaurant/RestaurantBanner'
import { RestaurantDeliveryBar } from '../components/restaurant/RestaurantDeliveryBar'
/* import { RestaurantInfoModal } from '../components/restaurant/RestaurantInfoModal' */
import { useCart } from '../context/CartContext'
import { getStoredUser } from '../lib/auth'
import { formatDateTime } from '../lib/format'
import './Restaurant.css'

export function Restaurant() {
  const { restaurantId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState(() =>
    getUserDeliveryAddress(getStoredUser()),
  )
  const [currentRating, setCurrentRating] = useState(null)
  const [ratingLoading, setRatingLoading] = useState(true)
  const [ratingFormOpen, setRatingFormOpen] = useState(false)
  const [ratingScore, setRatingScore] = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingSaving, setRatingSaving] = useState(false)
  const [ratingError, setRatingError] = useState(null)
  const [ratingMessage, setRatingMessage] = useState(null)

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError, setCommentsError] = useState(null)
  const [photosOpen, setPhotosOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadRestaurant() {
      setLoading(true)
      setError(null)
      setRatingLoading(true)
      setRatingError(null)

      try {
        const [restaurantData, ratingData] = await Promise.all([
          fetchRestaurant(restaurantId),
          getMyLocalRating(restaurantId).catch(() => null),
        ])

        if (!cancelled) {
          setRestaurant(restaurantData)
          setCurrentRating(ratingData)
          setRatingScore(ratingData?.score ?? 5)
          setRatingComment(ratingData?.comment ?? '')
        }
      } catch {
        if (!cancelled) {
          setError('No pudimos cargar el local.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setRatingLoading(false)
        }
      }
    }

    loadRestaurant()

    return () => {
      cancelled = true
    }
  }, [restaurantId])

  useEffect(() => {
    if (location.state?.openRating) {
      setRatingFormOpen(true)
    }
  }, [location.state?.openRating, restaurantId])

  const handleAddProduct = (product) => {
    if (!restaurant) return

    addToCart(
      { id: restaurant.id, name: restaurant.name },
      { ...product, price: product.precioFinal ?? product.price },
      1,
    )
  }

  const handleOpenRatingForm = () => {
    setRatingError(null)
    setRatingMessage(null)
    setRatingScore(currentRating?.score ?? 5)
    setRatingComment(currentRating?.comment ?? '')
    setRatingFormOpen(true)
  }

  const handleCancelRating = () => {
    setRatingError(null)
    setRatingScore(currentRating?.score ?? 5)
    setRatingComment(currentRating?.comment ?? '')
    setRatingFormOpen(false)
  }

  const handleSaveRating = async () => {
    if (!restaurant) return

    const wasEditing = Boolean(currentRating)

    setRatingSaving(true)
    setRatingError(null)
    setRatingMessage(null)

    try {
      await rateLocal({
        localId: restaurant.id,
        score: ratingScore,
        comment: ratingComment,
      })

      const refreshedRating = await getMyLocalRating(restaurant.id).catch(() => null)
      const nextRating = refreshedRating ?? {
        id: currentRating?.id ?? restaurant.id,
        score: Number(ratingScore),
        comment: ratingComment.trim(),
        createdAt: new Date().toISOString(),
      }

      setCurrentRating(nextRating)
      setRatingScore(nextRating.score)
      setRatingComment(nextRating.comment)
      setRatingFormOpen(false)
      setRatingMessage(wasEditing ? 'Calificación actualizada.' : 'Calificación registrada.')
    } catch (err) {
      setRatingError(err.message ?? 'No pudimos guardar tu calificación.')
    } finally {
      setRatingSaving(false)
    }
  }

  const handleShowComments = async () => {
    setCommentsOpen(true)
    setCommentsError(null)
    setCommentsLoading(true)

    try {
      const data = await getLocalPublicComments(restaurant.id)
      setComments(data)
    } catch {
      setCommentsError('No pudimos cargar los comentarios de este local.')
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleShowPhotos = () => {
    setPhotosOpen(true)
  }

  if (loading) {
    return (
      <div className="restaurant-page">
        <OrdersNavbar />
        <main className="restaurant-page__main contenedor">
          <p className="restaurant-page__status">Cargando menú...</p>
        </main>
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="restaurant-page">
        <OrdersNavbar />
        <main className="restaurant-page__main contenedor">
          <p className="restaurant-page__status restaurant-page__status--error">{error}</p>
          <button type="button" className="restaurant-page__back" onClick={() => navigate('/pedidos')}>
            Volver a pedidos
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="restaurant-page">
      <OrdersNavbar />

      <main className="restaurant-page__main contenedor">
        <div className="restaurant-page__delivery-bar">
          <RestaurantDeliveryBar
            address={deliveryAddress}
            onAddressChange={setDeliveryAddress}
          />
          {!restaurant.isOpen && (
            <p className="restaurant-page__closed-banner" role="alert">
              Este local está cerrado y no acepta pedidos por el momento.
            </p>
          )}
        </div>

        <div className="restaurant-page__layout">
          <div className="restaurant-page__menu-column">
            <RestaurantBanner
              restaurant={restaurant}
              onShowComments={handleShowComments}
              onShowPhotos={handleShowPhotos}
            />

            <section className="restaurant-page__rating-card">
              <div className="restaurant-page__rating-header">
                <div>
                  <p className="restaurant-page__rating-eyebrow">Tu vínculo con este local</p>
                  <h2 className="restaurant-page__rating-title">Calificación del local</h2>
                  <p className="restaurant-page__rating-copy">
                    {ratingLoading
                      ? 'Estamos consultando si ya tenías una calificación previa.'
                      : currentRating
                        ? 'Ya calificaste este local. Puedes editar tu puntaje y comentario desde aquí.'
                        : 'Si ya realizaste al menos un pedido confirmado en este local, puedes dejar tu calificación desde esta pantalla.'}
                  </p>
                  {currentRating?.createdAt && (
                    <p className="restaurant-page__rating-meta">
                      Última actualización:{' '}
                      {formatDateTime(currentRating.createdAt)}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className="restaurant-page__rating-trigger"
                  onClick={handleOpenRatingForm}
                  disabled={ratingLoading}
                >
                  {currentRating ? 'Editar calificación' : 'Calificar local'}
                </button>
              </div>

              {ratingMessage && <p className="restaurant-page__rating-success">{ratingMessage}</p>}
              {ratingError && <p className="restaurant-page__rating-error" role="alert">{ratingError}</p>}

              {ratingFormOpen && (
                <div className="restaurant-page__rating-form">
                  <StarRating value={ratingScore} onChange={setRatingScore} />
                  <textarea
                    className="restaurant-page__rating-textarea"
                    rows={3}
                    placeholder="Comentario (opcional)"
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                  />
                  <div className="restaurant-page__rating-actions">
                    <button
                      type="button"
                      className="restaurant-page__rating-submit"
                      onClick={handleSaveRating}
                      disabled={ratingSaving}
                    >
                      {ratingSaving
                        ? 'Guardando...'
                        : currentRating
                          ? 'Guardar cambios'
                          : 'Enviar calificación'}
                    </button>
                    <button
                      type="button"
                      className="restaurant-page__rating-cancel"
                      onClick={handleCancelRating}
                      disabled={ratingSaving}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </section>

            <div className="restaurant-page__menu-panel">
              <MenuProductList
                categoryLabel="Menu"
                products={restaurant.products}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddProduct={handleAddProduct}
              />
            </div>
          </div>

          <CartSidebar
            restaurantOpen={restaurant.isOpen !== false}
            deliveryAddress={deliveryAddress}
          />
        </div>
      </main>
    </div>
  )
}