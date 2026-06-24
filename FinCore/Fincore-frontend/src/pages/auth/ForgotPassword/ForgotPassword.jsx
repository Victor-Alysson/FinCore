// Fincore-frontend/src/pages/auth/ForgotPassword/ForgotPassword.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { Lock, ArrowLeft, ArrowRight, CheckCircle, User } from 'lucide-react';

import api from '../../../services/api'; 

import styles from './ForgotPassword.module.css';

export default function ForgotPassword() {
  // --- ESTADOS DE CONTROLE DE INTERFACE (UI) ---
  const [passo, setPasso] = useState(1);
  const [loading, setLoading] = useState(false);

  // --- ESTADOS DE FORMULÁRIO ---
  const [formData, setFormData] = useState({
    usuario: '', 
    pergunta1: '',
    pergunta2: '',
    pergunta3: '',
    novaSenha: '',
    confirmarSenha: ''
  });

  // Atualização dinâmica dos campos de formulário controlados
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submissão das respostas de segurança para validação da identidade
  const handleVerificarRespostas = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/usuarios/verificar-recuperacao', {
        email: formData.usuario,
        pergunta1: formData.pergunta1,
        pergunta2: formData.pergunta2,
        pergunta3: formData.pergunta3,
      });

      setPasso(2); 
    } catch (error) {
      alert(error.response?.data?.detail || "Erro ao verificar respostas. Verifique o e-mail e as respostas.");
    } finally {
      setLoading(false);
    }
  };

  // Envio do payload para sobreposição da credencial (senha) do usuário
  const handleSalvarNovaSenha = async (e) => {
    e.preventDefault();
    
    if (formData.novaSenha !== formData.confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }

    setLoading(true);
    try {
      await api.post('/usuarios/redefinir-senha', {
        email: formData.usuario,
        pergunta1: formData.pergunta1,
        pergunta2: formData.pergunta2,
        pergunta3: formData.pergunta3,
        nova_senha: formData.novaSenha
      });

      setPasso(3); 
    } catch (error) {
      alert(error.response?.data?.detail || "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        
        {/* --- PASSO 1: PERGUNTAS DE SEGURANÇA --- */}
        {passo === 1 && (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Recuperar Acesso</h1>
              <p className={styles.subtitle}>Responda às suas perguntas de segurança.</p>
            </div>

            <form onSubmit={handleVerificarRespostas} className={styles.form}>
              <div className={styles.inputGroup}>
                <User className={styles.inputIcon} size={20} />
                <input
                  type="email"
                  name="usuario"
                  placeholder="Seu e-mail cadastrado"
                  className={styles.input}
                  value={formData.usuario}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.questionGroup}>
                <label className={styles.label}>Pergunta 1: Nome do seu pet?</label>
                <input type="text" name="pergunta1" placeholder="Resposta..." className={styles.inputPura} value={formData.pergunta1} onChange={handleChange} required />
              </div>

              <div className={styles.questionGroup}>
                <label className={styles.label}>Pergunta 2: Sua cidade natal?</label>
                <input type="text" name="pergunta2" placeholder="Resposta..." className={styles.inputPura} value={formData.pergunta2} onChange={handleChange} required />
              </div>

              <div className={styles.questionGroup}>
                <label className={styles.label}>Pergunta 3: Apelido de infância?</label>
                <input type="text" name="pergunta3" placeholder="Resposta..." className={styles.inputPura} value={formData.pergunta3} onChange={handleChange} required />
              </div>

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Verificando...' : 'Verificar Respostas'} <ArrowRight size={18} />
              </button>
            </form>
          </>
        )}

        {/* --- PASSO 2: REDEFINIR SENHA --- */}
        {passo === 2 && (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Nova Senha</h1>
              <p className={styles.subtitle}>Digite sua nova senha de acesso.</p>
            </div>

            <form onSubmit={handleSalvarNovaSenha} className={styles.form}>
              <div className={styles.inputGroup}>
                <Lock className={styles.inputIcon} size={20} />
                <input type="password" name="novaSenha" placeholder="Nova senha" className={styles.input} value={formData.novaSenha} onChange={handleChange} required />
              </div>

              <div className={styles.inputGroup}>
                <Lock className={styles.inputIcon} size={20} />
                <input type="password" name="confirmarSenha" placeholder="Confirme a senha" className={styles.input} value={formData.confirmarSenha} onChange={handleChange} required />
              </div>

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </form>
          </>
        )}

        {/* --- PASSO 3: SUCESSO --- */}
        {passo === 3 && (
          <div className={styles.successState}>
            <CheckCircle size={64} className={styles.successIcon} />
            <h2 className={styles.title}>Sucesso!</h2>
            <p className={styles.subtitle}>Sua senha foi alterada. Você já pode fazer login.</p>
          </div>
)}

        <div className={styles.footer}>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={16} /> Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}