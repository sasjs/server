import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import AppContextProvider from './context/appContext'

ReactDOM.render(
  <React.StrictMode>
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
