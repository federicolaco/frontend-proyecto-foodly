import { apiFetch, apiFetchSafe, isApiConfigured } from './client'

function mapNotification(notification) {
  return {
    id: notification.id,
    type: notification.tipo,
    message: notification.mensaje,
    read: Boolean(notification.leida),
    date: notification.fecha,
    orderId: notification.dtPedido?.id ?? null,
    claimId: notification.dtReclamo?.id ?? null,
  }
}

export async function getMyNotifications() {
  if (isApiConfigured()) {
    const data = await apiFetchSafe('/notificaciones/mias')
    return (data ?? []).map(mapNotification)
  }

  return []
}

export async function markNotificationAsRead(notificationId) {
  if (isApiConfigured()) {
    await apiFetch(`/notificaciones/${notificationId}/leida`, { method: 'PUT' })
  }
}