import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolverRef = useRef(null)

  const close = useCallback((result) => {
    setDialog(null)
    resolverRef.current?.(result)
    resolverRef.current = null
  }, [])

  const confirm = useCallback((messageOrOptions, maybeOptions) => {
    const options =
      typeof messageOrOptions === 'string' ? { message: messageOrOptions, ...maybeOptions } : messageOrOptions ?? {}

    return new Promise((resolve) => {
      resolverRef.current = resolve
      setDialog({
        title: options.title ?? 'Confirmar acción',
        message: options.message ?? '¿Confirma esta acción?',
        confirmText: options.confirmText ?? 'Aceptar',
        cancelText: options.cancelText ?? 'Cancelar',
        variant: options.variant ?? 'default',
      })
    })
  }, [])

  const value = useMemo(() => confirm, [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog?.title}
        message={dialog?.message}
        confirmText={dialog?.confirmText}
        cancelText={dialog?.cancelText}
        variant={dialog?.variant}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm debe usarse dentro de un <ConfirmProvider>')
  }
  return ctx
}
