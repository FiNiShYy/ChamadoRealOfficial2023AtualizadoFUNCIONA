import { Navigate, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Form from './components/Formulario/Form'
import ListaChamados from './components/ListaChamados/ListaChamados'

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Form />} />
        <Route path="/chamados" element={<ListaChamados />} />
        <Route path="/criar-chamado" element={<Form />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default App
