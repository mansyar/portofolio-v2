import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      theme="dark"
      richColors
      toastOptions={{
        style: {
          fontFamily: 'var(--font-mono)',
          background: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
        },
        classNames: {
          success: 'toast-success',
          error: 'toast-error',
          title: 'font-bold',
        },
      }}
    />
  );
}
