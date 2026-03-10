import { Toaster } from 'react-hot-toast'

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      containerStyle={{ top: 20, right: 16 }}
      toastOptions={{
        duration: 3500,
        style: {
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 600,
          fontSize:   '0.875rem',
          borderRadius: '1rem',
          padding: '12px 16px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          maxWidth: '360px',
        },
        success: {
          style: {
            background: '#F0FDF4',
            color:      '#166534',
            border:     '1px solid #86EFAC',
          },
          iconTheme: { primary: '#22C55E', secondary: '#fff' },
        },
        error: {
          duration: 5000,
          style: {
            background: '#FEF2F2',
            color:      '#991B1B',
            border:     '1px solid #FCA5A5',
          },
          iconTheme: { primary: '#EF4444', secondary: '#fff' },
        },
        loading: {
          style: {
            background: '#EFF6FF',
            color:      '#1E40AF',
            border:     '1px solid #93C5FD',
          },
        },
      }}
    />
  )
}
