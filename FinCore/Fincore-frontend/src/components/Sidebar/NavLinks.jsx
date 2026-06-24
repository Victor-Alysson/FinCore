// Fincore-frontend/src/components/Sidebar/NavLinks.jsx

// Bibliotecas nativas do ecossistema React
import React, { useState } from 'react';

// Bibliotecas de roteamento de terceiros
import { Link } from 'react-router-dom';

// Bibliotecas de ícones vetoriais
import { Ban, Receipt, Wallet } from 'lucide-react';

// Estilizações encapsuladas via CSS Modules
import styles from './Sidebar.module.css';

export default function NavLinks({ escopoAtual }) {
  // Estado local para gerenciamento da classe de estilo do item de navegação ativo
  const [activeLink, setActiveLink] = useState('');

  // Manipulador de estado para atualização do item selecionado na navegação
  const handleLinkClick = (link) => {
    setActiveLink(link);
  };

  return (
    /* Container semântico da barra de navegação (Navigation landmark) */
    <nav className={styles.navContainer}>
      <p className={styles.menuLabel}>Navegação</p>
      <ul className={styles.navLinks}>
        
        {/* Item de Navegação: Visão Geral */}
        <li>
          <Link 
            to={`/dashboard/${escopoAtual}/visaogeral`} 
            className={`${styles.link} ${activeLink === 'visaogeral' ? styles.opcaoAtiva : ''}`} 
            onClick={() => handleLinkClick('visaogeral')}
          >
            <Receipt size={18} /> Visão Geral
          </Link>
        </li>

        {/* Item de Navegação: Extrato */}
        <li>
          <Link 
            to={`/dashboard/${escopoAtual}/extrato`} 
            className={`${styles.link} ${activeLink === 'extrato' ? styles.opcaoAtiva : ''}`} 
            onClick={() => handleLinkClick('extrato')}
          >
            <Receipt size={18} /> Extrato
          </Link>
        </li>

        {/* Item de Navegação: Dívidas */}
        <li>
          <Link 
            to={`/dashboard/${escopoAtual}/dividas`} 
            className={`${styles.link} ${activeLink === 'dividas' ? styles.opcaoAtiva : ''}`} 
            onClick={() => handleLinkClick('dividas')}
          >
            <Ban size={18} /> Dívidas
          </Link>
        </li>

        {/* Item de Navegação: Investimentos */}
        <li>
          <Link 
            to={`/dashboard/${escopoAtual}/investimentos`} 
            className={`${styles.link} ${activeLink === 'investimentos' ? styles.opcaoAtiva : ''}`} 
            onClick={() => handleLinkClick('investimentos')}
          >
            <Wallet size={18} /> Investimentos
          </Link>
        </li>
      </ul>
    </nav>
  );
}