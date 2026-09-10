import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { initTheme } from './lib/theme.js'
import './styles/global.css'
import './styles/app.css'
import './styles/phone.css'
import './styles/landing.css'
import './styles/contact.css'

initTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
