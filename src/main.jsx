import { StrictMode } from 'react';
import ReactDOM from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/app.jsx';
import * as S from './styles/app.jsx';
import GlobalStyle from "./styles/GlobalStyles.jsx";

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <S.Container>
      <GlobalStyle />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </S.Container>
  </StrictMode>,
)
