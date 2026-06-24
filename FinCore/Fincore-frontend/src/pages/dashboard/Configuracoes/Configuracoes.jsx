// Fincore-frontend/src/pages/dashboard/Configuracoes/Configuracoes.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { User, Shield, Lock, Save, AlertCircle, AlertTriangle, Trash2, Download } from 'lucide-react';

import api from '../../../services/api';

import styles from './Configuracoes.module.css';

export default function Configuracoes() {
  // --- HOOKS DE ROTEAMENTO ---
  const navigate = useNavigate();

  // --- ESTADOS DE CONTROLE DE INTERFACE (UI) ---
  const [loading, setLoading] = useState(true);
  
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  
  const [modalDeletarAberto, setModalDeletarAberto] = useState(false);
  const [senhaDeletar, setSenhaDeletar] = useState('');

  // --- ESTADOS DE FORMULÁRIO ---
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    novaSenha: '',
    confirmarSenha: '',
    pergunta1: '',
    pergunta2: '',
    pergunta3: ''
  });

  // Requisição inicial para pré-preenchimento dos dados do perfil do usuário
  useEffect(() => {
    const carregarPerfil = async () => {
      try {
        const response = await api.get('/usuarios/me/perfil');
        setFormData(prev => ({
          ...prev,
          nome: response.data.nome || '',
          email: response.data.email || ''
        }));
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    carregarPerfil();
  }, []);

  // Atualização dinâmica dos campos do formulário controlado
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Processamento e conversão de stream binário (Blob) para forçar o download do arquivo Excel localmente
  const handleExportarDados = async () => {
    try {
      const response = await api.get('/usuarios/me/exportar', {
        responseType: 'blob', 
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Backup_FinCore.xlsx'); 
      document.body.appendChild(link);
      link.click(); 
      link.remove(); 
      
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      alert("Não foi possível gerar o seu relatório. Tente novamente.");
    }
  };

  // Interceptação da submissão para validação local das senhas antes da autorização
  const prepararSalvamento = (e) => {
    e.preventDefault();
    if (formData.novaSenha && formData.novaSenha !== formData.confirmarSenha) {
      alert("As novas senhas não coincidem!");
      return;
    }
    setSenhaAtual('');
    setModalSenhaAberto(true);
  };

  // Submissão do payload de atualização contendo a chave de confirmação de segurança
  const handleSalvarAlteracoes = async (e) => {
    e.preventDefault();
    if (!senhaAtual) {
      alert("Digite sua senha atual para autorizar a alteração.");
      return;
    }

    try {
      const pacote = {
        senha_atual: senhaAtual,
        novo_nome: formData.nome || null,
        nova_senha: formData.novaSenha || null,
        pergunta1: formData.pergunta1 || null,
        pergunta2: formData.pergunta2 || null,
        pergunta3: formData.pergunta3 || null
      };

      await api.put('/usuarios/me/perfil', pacote);
      
      alert("Perfil atualizado com sucesso!");
      setModalSenhaAberto(false);
      
      setFormData(prev => ({
        ...prev, novaSenha: '', confirmarSenha: '', pergunta1: '', pergunta2: '', pergunta3: ''
      }));

    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      alert(error.response?.data?.detail || "Erro ao atualizar perfil.");
    }
  };

  // Submissão da requisição de encerramento da conta e expurgo dos tokens locais
  const handleDeletarConta = async (e) => {
    e.preventDefault();
    if (!senhaDeletar) {
      alert("Digite sua senha para confirmar a exclusão.");
      return;
    }

    const confirmacaoExtra = window.confirm("ÚLTIMO AVISO: Tem certeza ABSOLUTA de que deseja encerrar sua conta? Isso apagará bancos, transações, dívidas e investimentos para sempre.");
    if (!confirmacaoExtra) return;

    try {
      await api.post('/usuarios/me/encerrar', { 
        senha_atual: senhaDeletar 
      });

      alert("Sua conta foi encerrada com sucesso. Sentiremos sua falta!");
      localStorage.removeItem('token'); 
      navigate('/'); 
    } catch (error) {
      console.error("Erro ao encerrar conta:", error);
      alert(error.response?.data?.detail || "Erro ao encerrar conta. Verifique sua senha.");
    }
  };

  if (loading) return <div className={styles.loading}>Carregando perfil...</div>;

  return (
    <div className={styles.configContainer}>
      
      <div className={styles.headerDashboard}>
        <div>
          <h1 className={styles.pageTitle}>Configurações de Conta</h1>
          <p className={styles.pageSubtitle}>Gerencie suas informações pessoais e de segurança.</p>
        </div>
        <button className={styles.btnPrimary} onClick={prepararSalvamento}>
          <Save size={18} /> Salvar Alterações
        </button>
      </div>

      <div className={styles.cardsGrid}>
        
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <User className={styles.headerIcon} size={20} />
            <h2 className={styles.cardTitle}>Dados Pessoais</h2>
          </div>
          <div className={styles.formGroup}>
            <label>E-mail de Acesso (Não alterável)</label>
            <input type="email" value={formData.email} disabled className={styles.inputDisabled} />
          </div>
          <div className={styles.formGroup}>
            <label>Nome de Exibição</label>
            <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Como deseja ser chamado?" />
          </div>
        </div>

        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <Lock className={styles.headerIcon} size={20} />
            <h2 className={styles.cardTitle}>Alterar Senha</h2>
          </div>
          <p className={styles.helpText}>Deixe em branco se não quiser alterar sua senha.</p>
          <div className={styles.formGroup}>
            <label>Nova Senha</label>
            <input type="password" name="novaSenha" value={formData.novaSenha} onChange={handleChange} placeholder="Digite a nova senha" />
          </div>
          <div className={styles.formGroup}>
            <label>Confirmar Nova Senha</label>
            <input type="password" name="confirmarSenha" value={formData.confirmarSenha} onChange={handleChange} placeholder="Repita a nova senha" />
          </div>
        </div>

        <div className={styles.settingsCard} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.cardHeader}>
            <Shield className={styles.headerIcon} size={20} />
            <h2 className={styles.cardTitle}>Redefinir Perguntas de Segurança</h2>
          </div>
          <p className={styles.helpText}>Preencha apenas se desejar substituir as perguntas atuais de recuperação de conta.</p>
          
          <div className={styles.questionsGrid}>
            <div className={styles.formGroup}>
              <label>1. Qual o nome do seu primeiro animal de estimação?</label>
              <input type="text" name="pergunta1" value={formData.pergunta1} onChange={handleChange} placeholder="Nova resposta..." />
            </div>
            <div className={styles.formGroup}>
              <label>2. Em qual cidade sua mãe nasceu?</label>
              <input type="text" name="pergunta2" value={formData.pergunta2} onChange={handleChange} placeholder="Nova resposta..." />
            </div>
            <div className={styles.formGroup}>
              <label>3. Qual o seu filme favorito?</label>
              <input type="text" name="pergunta3" value={formData.pergunta3} onChange={handleChange} placeholder="Nova resposta..." />
            </div>
          </div>
        </div>

        <div className={styles.settingsCard} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.cardHeader}>
            <Download className={styles.headerIcon} size={20} />
            <h2 className={styles.cardTitle}>Exportar Meus Dados</h2>
          </div>
          <p className={styles.helpText}>
            Baixe um backup completo de toda a sua vida financeira (transações, ativos e passivos) formatado em planilha Excel (.xlsx).
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button type="button" className={styles.btnPrimary} onClick={handleExportarDados}>
              <Download size={18} style={{ marginRight: '8px' }} /> Gerar Planilha Excel
            </button>
          </div>
        </div>

        <div className={styles.settingsCard} style={{ gridColumn: '1 / -1', borderColor: 'rgba(255, 90, 90, 0.4)' }}>
          <div className={styles.cardHeader} style={{ borderBottomColor: 'rgba(255, 90, 90, 0.2)' }}>
            <AlertTriangle color="#FF5A5A" size={20} />
            <h2 className={styles.cardTitle} style={{ color: '#FF5A5A' }}>Zona de Perigo</h2>
          </div>
          <p className={styles.helpText}>
            Ao encerrar sua conta, todos os seus dados e registros vinculados serão apagados <strong>permanentemente</strong>. Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button type="button" className={styles.btnDanger} onClick={() => setModalDeletarAberto(true)}>
              <Trash2 size={18} /> Encerrar Minha Conta
            </button>
          </div>
        </div>

      </div>

      {modalSenhaAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <AlertCircle color="#00FF9D" size={28} />
              <h3>Confirmação de Segurança</h3>
            </div>
            <p className={styles.modalDescription}>
              Para aplicar as alterações no seu perfil, por favor, confirme sua <strong>senha atual</strong>.
            </p>
            <form onSubmit={handleSalvarAlteracoes} className={styles.modalForm}>
              <input 
                type="password" autoFocus placeholder="Digite sua senha atual" 
                value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required 
              />
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setModalSenhaAberto(false)}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary}>Autorizar e Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalDeletarAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ borderTop: '4px solid #FF5A5A' }}>
            <div className={styles.modalHeader}>
              <AlertTriangle color="#FF5A5A" size={28} />
              <h3>Exclusão Definitiva</h3>
            </div>
            <p className={styles.modalDescription}>
              Para prosseguir com o <strong>encerramento da sua conta</strong>, digite sua senha atual como confirmação de identidade:
            </p>
            <form onSubmit={handleDeletarConta} className={styles.modalForm}>
              <input 
                type="password" autoFocus placeholder="Digite sua senha atual" 
                value={senhaDeletar} onChange={(e) => setSenhaDeletar(e.target.value)} required 
                style={{ borderColor: senhaDeletar ? '#FF5A5A' : '#2A2A2E' }}
              />
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => { setModalDeletarAberto(false); setSenhaDeletar(''); }}>Cancelar</button>
                <button type="submit" className={styles.btnDanger}>Confirmar Exclusão</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}