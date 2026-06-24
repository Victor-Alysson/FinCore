// Fincore-frontend/src/App.jsx

// Bibliotecas nativas e do ecossistema React
import React from 'react';

// Bibliotecas de terceiros (Roteamento de interface)
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

// Componentes Locais: Layout Base
import Logado from './layouts/Logado/Logado';

// Componentes Locais: Fluxo Público (Autenticação e Recuperação)
import ForgotPassword from './pages/auth/ForgotPassword/ForgotPassword';
import Login from './pages/auth/Login/Login';
import SignUp from './pages/auth/SignUp/SignUp';

// Componentes Locais: Fluxo Privado (Painéis Analíticos e Gestão)
import Configuracoes from './pages/dashboard/Configuracoes/Configuracoes';
import Dividas from './pages/dashboard/Dividas/Dividas';
import ExtratoDashboard from './pages/dashboard/ExtratoDashboard/ExtratoDashboard';
import Investimentos from './pages/dashboard/Investimentos/Investimentos';
import Dashboard from './pages/dashboard/MainDashboard/MainDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Definição de Rotas Públicas (Acesso não autenticado) */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/password-recovery" element={<ForgotPassword />} />  
        
        {/* Definição de Rotas Privadas e Aninhamento de Componentes */}
        {/* O componente <Logado /> atua como um wrapper arquitetural, renderizando os filhos acoplados através de um <Outlet /> interno */}
        <Route path="/dashboard" element={<Logado/>}>
          <Route path="" element={<Dashboard />} />
          <Route path=":banco/visaogeral" element={<Dashboard />} />
          <Route path=":banco" element={<Dashboard />} />
          <Route path=":banco/extrato" element={<ExtratoDashboard />} />
          <Route path=":banco/investimentos" element={<Investimentos />} />
          <Route path=":banco/dividas" element={<Dividas />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
        
        {/* Rota de Fallback: Redirecionamento imperativo mitigando acessos diretos a URIs órfãs no cliente */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;