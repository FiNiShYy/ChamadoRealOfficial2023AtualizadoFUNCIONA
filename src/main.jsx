import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import GlobalStyle from "./styles/GlobalStyles.jsx";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import * as S from './styles/app.jsx'
import './styles/app.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <S.Container>
      <GlobalStyle />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
        </Routes>
      </BrowserRouter>
    </S.Container>
  </StrictMode>,
)
