// Fincore-frontend/src/pages/auth/SignUp/SignUp.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { User, Mail, Lock, ArrowRight } from 'lucide-react';

import Header from '../../../components/Header/Header';

import api from '../../../services/api';

import styles from './SignUp.module.css';

export default function SignUp() {
  // --- HOOKS DE ROTEAMENTO ---
  const navigate = useNavigate();

  // --- ESTADOS DE FORMULÁRIO ---
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    pergunta1: '',
    pergunta2: '',
    pergunta3: ''
  });

  // Atualização dinâmica dos campos de formulário controlados
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submissão do payload de registro de novo usuário e validação de consistência de senha
  const handleCadastro = async (e) => {
    e.preventDefault();
    
    if (formData.senha !== formData.confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }

    try {
      await api.post('/usuarios', {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        pergunta1: formData.pergunta1,
        pergunta2: formData.pergunta2,
        pergunta3: formData.pergunta3
      });

      alert('Conta criada com sucesso!');
      navigate('/'); 
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Erro ao cadastrar usuário.");
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        
        <div className={styles.header}>
          <Header />
          <p className={styles.subtitle}>Crie sua conta e assuma o controle financeiro.</p>
        </div>

        <form onSubmit={handleCadastro} className={styles.form}>
  
          <div className={styles.inputGroup}>
            <User className={styles.inputIcon} size={20} />
            <input
              type="text"
              name="nome"
              placeholder="Nome completo"
              className={styles.input}
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <Mail className={styles.inputIcon} size={20} />
            <input
              type="email"
              name="email"
              placeholder="Seu melhor e-mail"
              className={styles.input}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <Lock className={styles.inputIcon} size={20} />
            <input
              type="password"
              name="senha"
              placeholder="Crie uma senha forte"
              className={styles.input}
              value={formData.senha}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <Lock className={styles.inputIcon} size={20} />
            <input
              type="password"
              name="confirmarSenha"
              placeholder="Confirme sua senha"
              className={styles.input}
              value={formData.confirmarSenha}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <User className={styles.inputIcon} size={20} />
            <input
              type="text"
              name="pergunta1"
              placeholder="Pergunta 1: Nome do seu pet?"
              className={styles.input}
              value={formData.pergunta1}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <User className={styles.inputIcon} size={20} />
            <input
              type="text"
              name="pergunta2"
              placeholder="Pergunta 2: Sua cidade natal?"
              className={styles.input}
              value={formData.pergunta2}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <User className={styles.inputIcon} size={20} />
            <input
              type="text"
              name="pergunta3"
              placeholder="Pergunta 3: Apelido de infância?"
              className={styles.input}
              value={formData.pergunta3}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className={styles.submitButton}>
            Criar minha conta <ArrowRight size={18} />
          </button>
        </form>

        <div className={styles.footer}>
          <p>Já tem uma conta? <Link to="/" className={styles.link}>Faça login aqui</Link></p>
        </div>

      </div>
    </div>
  );
}