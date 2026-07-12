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
import { RestaurantInfoModal } from '../components/restaurant/RestaurantInfoModal'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { getStoredUser } from '../lib/auth'
import { formatDate, formatDateTime } from '../lib/format'
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

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [photosOpen, setPhotosOpen] = useState(false)
  const toast = useToast()

  useEffect(() => {
    let cancelled = false

    async function loadRestaurant() {
      setLoading(true)
      setError(null)
      setRatingLoading(true)

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
    setRatingScore(currentRating?.score ?? 5)
    setRatingComment(currentRating?.comment ?? '')
    setRatingFormOpen(true)
  }

  const handleCancelRating = () => {
    setRatingScore(currentRating?.score ?? 5)
    setRatingComment(currentRating?.comment ?? '')
    setRatingFormOpen(false)
  }

  const handleSaveRating = async () => {
    if (!restaurant) return

    const wasEditing = Boolean(currentRating)

    setRatingSaving(true)

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
      toast.success(wasEditing ? 'Calificación actualizada.' : 'Calificación registrada.')
    } catch (err) {
      toast.error(err.message ?? 'No pudimos guardar tu calificación.')
    } finally {
      setRatingSaving(false)
    }
  }

  const handleShowComments = async () => {
    setCommentsOpen(true)
    setCommentsLoading(true)

    try {
      const data = await getLocalPublicComments(restaurant.id)
      setComments(data)
    } catch {
      toast.error('No pudimos cargar los comentarios de este local.')
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
                      {formatDate(currentRating.createdAt)}
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

      <RestaurantInfoModal
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        title={`Comentarios de ${restaurant.name}`}
      >
        {commentsLoading && <p className="restaurant-info-modal__empty">Cargando comentarios...</p>}

        {!commentsLoading && comments.length === 0 && (
          <p className="restaurant-info-modal__empty">Este local todavía no tiene comentarios.</p>
        )}

        {!commentsLoading && comments.length > 0 && (
          <div className="restaurant-comments">
            {comments.map((comment, index) => (
              <div key={comment.clientId ?? index} className="restaurant-comments__item">
                <div className="restaurant-comments__header">
                  <span className="restaurant-comments__author">{comment.clientName ?? 'Cliente'}</span>
                  {comment.createdAt && (
                    <span className="restaurant-comments__date">{formatDateTime(comment.createdAt)}</span>
                  )}
                </div>
                <div className="restaurant-comments__stars">
                  <StarRating value={comment.score ?? 0} readOnly />
                </div>
                {comment.comment && <p className="restaurant-comments__text">{comment.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </RestaurantInfoModal>

      <RestaurantInfoModal
        open={photosOpen}
        onClose={() => setPhotosOpen(false)}
        title={`Fotos de ${restaurant.name}`}
      >
        {(!restaurant.images || restaurant.images.length === 0) && (
          <p className="restaurant-info-modal__empty">Este local todavía no cargó fotos.</p>
        )}

        {restaurant.images && restaurant.images.length > 0 && (
          <div className="restaurant-photos">
            {restaurant.images.map((image, index) => (
              <div key={image ?? index} className="restaurant-photos__item">
                <img
                  src={image}
                  alt={`Foto ${index + 1} de ${restaurant.name}`}
                  className="restaurant-photos__image"
                />
              </div>
            ))}
          </div>
        )}
      </RestaurantInfoModal>
    </div>
  )
}