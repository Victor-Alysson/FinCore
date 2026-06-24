// Fincore-frontend/src/components/Sidebar/SidebarFooter.jsx

// Bibliotecas nativas do ecossistema React
import React from 'react';

// Bibliotecas de roteamento de terceiros
import { useNavigate } from 'react-router-dom';

// Bibliotecas de ícones vetoriais
import { LogOut, Settings } from 'lucide-react';

// Estilizações encapsuladas via CSS Modules
import styles from './Sidebar.module.css';

export default function SidebarFooter() {
  const navigate = useNavigate();

  /**
   * Executa o processo de encerramento de sessão.
   * NOTA TÉCNICA: Esta implementação é provisória. Requer futura integração com a remoção 
   * persistente do token de autenticação no armazenamento local (localStorage).
   */
  const handleLogout = () => {
    navigate('/');
  };

  /**
   * Direciona o usuário para o endpoint de configurações da aplicação.
   */
  const handleSettings = () => {
    navigate('/dashboard/configuracoes');
  };

  return (
    /* Container estrutural de rodapé do componente Sidebar.
       Agrupa elementos de navegação de controle de conta.
    */
    <div className={styles.footerContainer}>
      
      {/* Botão de acesso ao painel de configurações do perfil */}
      <button className={styles.footerItem} onClick={handleSettings}>
        <Settings size={18} /> Configurações
      </button>

      {/* Botão de ação para encerramento de sessão com estilo de alerta (logout) */}
      <button onClick={handleLogout} className={`${styles.footerItem} ${styles.logout}`}>
        <LogOut size={18} /> Sair
      </button>
      
    </div>
  );
}