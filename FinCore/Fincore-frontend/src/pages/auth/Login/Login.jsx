// Fincore-frontend/src/pages/auth/Login/Login.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Header from '../../../components/Header/Header';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';

import api from '../../../services/api';

import styles from './Login.module.css';

export default function Login() {
  // --- HOOKS DE ROTEAMENTO ---
  const navigate = useNavigate();

  // --- ESTADOS DE FORMULÁRIO ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Autenticação de usuário e requisição de token JWT 
  const handleLogin = async (e) => {
    e.preventDefault(); 

    try {
      // Submissão de credenciais para validação no servidor
      const response = await api.post('/login', {
        email: email,
        senha: password,
      });

      // Persistência do token de acesso na API Storage do navegador 
      localStorage.setItem('token', response.data.access_token);
      
      console.log('Login efetuado com sucesso!');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Erro no login:', error);
      alert(error.response?.data?.detail || "E-mail ou senha incorretos.");
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <Header />

        <form className={styles.form} onSubmit={handleLogin}>
          <Input
            type="email"
            placeholder="Usuário ou E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit">Entrar</Button>
        </form>

        <div className={styles.footerLinks}>
          <Link to="/password-recovery" className={styles.linkSecondary}>
            Esqueci minha senha
          </Link>
          <Link to="/signup" className={styles.linkAccent}>
            Criar uma conta
          </Link>
        </div>
      </div>
    </div>
  );
}