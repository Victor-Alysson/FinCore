// Fincore-frontend/src/main.jsx

// Bibliotecas nativas do ecossistema React
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Componentes locais de roteamento e raiz da aplicação
import App from './App.jsx';

// Folha de estilos global e reset CSS
import './index.css';

// Inicialização da árvore virtual do React (Virtual DOM) e acoplamento ao nó raiz do HTML (Real DOM).
// O modo StrictMode impõe dupla renderização exclusiva em ambiente de desenvolvimento para detecção de side-effects impuros.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);