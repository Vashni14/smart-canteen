import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'Nunito, sans-serif',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
          success: {
            style: { background: '#2ECC71', color: '#fff' },
            iconTheme: { primary: '#fff', secondary: '#2ECC71' },
          },
          error: {
            style: { background: '#E74C3C', color: '#fff' },
            iconTheme: { primary: '#fff', secondary: '#E74C3C' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
