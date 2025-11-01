import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext' // <--- Import
import App from './App.jsx'
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* <--- Wrap your app */}
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<App />} /> {/* <--- Simplified Route */}
        </Routes>
      </BrowserRouter>
    </AuthProvider> {/* <--- Close wrapper */}
  </React.StrictMode>,
)