// Fincore-frontend/src/services/api.js

// Bibliotecas de terceiros (Cliente HTTP)
import axios from 'axios';

/**
 * Instância customizada do Axios configurada como um serviço centralizado de comunicação.
 * Define a URL base para o ambiente de desenvolvimento local.
 */
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// ==========================================
// INTERCEPTORS (Middleware de Requisição e Resposta)
// ==========================================

/**
 * Interceptor de Request: Injeta o token JWT de autorização no cabeçalho 
 * Authorization de cada requisição outbound, garantindo a autenticação contínua.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * Interceptor de Response: Monitora o ciclo de vida das respostas da API.
 * Gerencia a expiração de sessão (401 Unauthorized), procedendo com a limpeza 
 * dos artefatos de autenticação e redirecionamento de segurança.
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratamento centralizado de erros de autorização (Token expirado ou inválido)
    if (error.response && error.response.status === 401) {
      console.warn("Sessão expirada. Iniciando fluxo de redirecionamento para o login...");
      
      // Limpeza da persistência local
      localStorage.removeItem('token');
      
      // Redirecionamento forçado para a rota de autenticação
      window.location.href = '/'; 
    }
    
    // Repasse do erro para tratamento local no nível de componente
    return Promise.reject(error);
  }
);

export default api;