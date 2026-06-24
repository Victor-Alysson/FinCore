// Fincore-frontend/src/layouts/Logado/Logado.jsx

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';

import Header from '../../components/Header/Header';
import DropdownButton from '../../components/Sidebar/DropdownButton';
import DropdownMenu from '../../components/Sidebar/DropdownMenu';
import NavLinks from '../../components/Sidebar/NavLinks';
import SidebarFooter from '../../components/Sidebar/SidebarFooter';

import api from '../../services/api'; 

import styles from './Logado.module.css';

export default function Logado() {
  // --- HOOKS DE ROTEAMENTO ---
  const navigate = useNavigate();
  const location = useLocation();

  // --- ESTADOS DE DADOS ---
  const [bancos, setBancos] = useState([]); 

  // --- ESTADOS DE CONTROLE DE INTERFACE (UI) ---
  const [escopoAtual, setEscopoAtual] = useState('overview');
  const [dropdownAberto, setDropdownAberto] = useState(false);

  // --- ESTADOS DO MODAL ---
  const [modalBancoAberto, setModalBancoAberto] = useState(false);
  const [novoNomeBanco, setNovoNomeBanco] = useState('');

  // Sincronização do estado global com os parâmetros da URL ativa
  useEffect(() => {
    const partesDaUrl = location.pathname.split('/'); 
    if (partesDaUrl.length >= 3) {
      const escopoDaUrl = partesDaUrl[2];
      if (escopoDaUrl !== 'configuracoes') {
        setEscopoAtual(escopoDaUrl);
      }
    }
  }, [location.pathname]);

  // Carregamento inicial da lista de instituições bancárias
  useEffect(() => {
    carregarBancos();
  }, []);

  // Requisição de listagem de bancos com cache-busting via timestamp
  const carregarBancos = async () => {
    try {
      const response = await api.get(`/bancos?_t=${Date.now()}`);
      setBancos(response.data);
    } catch (error) {
      console.error("Erro ao carregar bancos na sidebar:", error);
    }
  };

  // Submissão do formulário de criação de nova entidade bancária
  const handleAdicionarBanco = async (e) => {
    e.preventDefault();
    if (!novoNomeBanco.trim()) {
      alert("Preencha o Nome do banco!");
      return;
    }

    try {
      await api.post('/bancos', {
        nome: novoNomeBanco.trim()
      });

      setNovoNomeBanco('');
      setModalBancoAberto(false);
      carregarBancos(); 
    } catch (error) {
      console.error("Erro ao salvar banco:", error);
      alert(error.response?.data?.detail || "Erro ao salvar no banco de dados.");
    }
  };

  // Exclusão de instituição bancária e remoção de vínculos
  const handleDeletarBanco = async (idParaDeletar) => {
    const confirmacao = window.confirm("Tem a certeza de que deseja apagar este banco? Todas as transações, dívidas e investimentos vinculados serão removidos permanentemente.");
    if (!confirmacao) return;

    try {
      await api.delete(`/bancos/${idParaDeletar}`);
      
      setEscopoAtual('overview');
      navigate('/dashboard/overview');
      
      carregarBancos(); 
    } catch (error) {
      console.error("Erro ao apagar banco:", error);
      alert(error.response?.data?.detail || "Erro ao eliminar o banco no servidor.");
    }
  };

  // Transição de rotas ao selecionar um banco específico no Dropdown
  const handleEscolhaBanco = (novoEscopo) => {
    setEscopoAtual(novoEscopo);
    setDropdownAberto(false);
    navigate(`/dashboard/${novoEscopo}`);
  };

  // Derivação de estados para renderização condicional do Dropdown
  const bancoAtualObjeto = bancos.find(b => b.id.toString() === escopoAtual.toString());
  const textoBotao = escopoAtual === 'overview' ? ' Visão Geral (Todos)' : ` ${bancoAtualObjeto?.nome || 'Carregando...'}`;

  return (
    <div className={styles.container}>
      
      <aside className={styles.sidebar}>
        <Header/>
        
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#8A8A93', fontWeight: 600, textTransform: 'uppercase' }}>
              Conta atual:
            </span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              
              {escopoAtual !== 'overview' && (
                <button 
                  className={styles.btnDeleteBanco} 
                  onClick={() => handleDeletarBanco(escopoAtual)}
                  title="Apagar este banco e os seus dados"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              )}

              <button 
                className={styles.btnAddBanco} 
                onClick={() => setModalBancoAberto(true)}
                title="Adicionar nova conta ou banco"
              >
                <Plus size={14} /> Nova
              </button>
            </div>
          </div>
          
          <DropdownButton 
            texto={textoBotao} 
            aberto={dropdownAberto} 
            onClick={() => setDropdownAberto(!dropdownAberto)} 
          />

          {dropdownAberto && (
            <DropdownMenu 
              listaBancos={bancos} 
              escopoAtual={escopoAtual} 
              onEscolher={handleEscolhaBanco} 
            />
          )}
        </div>

        <NavLinks escopoAtual={escopoAtual} />
        <SidebarFooter />
      </aside>

      <main className={styles.mainContent}>
        <Outlet context={{ bancos, setBancos, carregarBancos }} />
      </main>

      {modalBancoAberto && (
        <div className={styles.modalOverlay} onClick={() => setModalBancoAberto(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#FFF', fontSize: '1.5rem' }}>Novo Banco/Conta</h3>
            
            <form onSubmit={handleAdicionarBanco} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#8A8A93', fontWeight: 500 }}>Nome da Instituição ou Carteira</span>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Nubank, Itaú, Carteira Física" 
                  value={novoNomeBanco} 
                  onChange={(e) => setNovoNomeBanco(e.target.value)} 
                  className={styles.inputModal}
                  autoFocus
                />
              </label>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setModalBancoAberto(false)} className={styles.btnCancel}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary}>Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}