import axios from 'axios'
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Form from './components/Formulario/Form'
import ListaChamados from './components/ListaChamados/ListaChamados'
import Login from './components/Login/Login'

function App() {
  const [authToken, setAuthToken] = useState(() => {
    const token = localStorage.getItem('authToken')
    return token || null
  })
  const [userEmail, setUserEmail] = useState(() => {
    const email = localStorage.getItem('userEmail')
    return email || null
  })

  useEffect(() => {
    if (authToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('authToken')
      localStorage.removeItem('userEmail')
    }
  }, [authToken])

  return (
    <Routes>
      <Route path="/" element={
        !authToken ? <Login setAuthToken={setAuthToken} setUserEmail={setUserEmail} /> : <Navigate to="/chamados" />
      } />
      <Route path="/chamados" element={
        authToken ? <ListaChamados /> : <Navigate to="/" />
      } />
      <Route path="/criar-chamado" element={
        authToken ? <Form /> : <Navigate to="/" />
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
