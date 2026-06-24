// Fincore-frontend/src/components/Sidebar/DropdownMenu.jsx

// Bibliotecas nativas do ecossistema React
import React from 'react';

// Estilizações encapsuladas via CSS Modules
import styles from './Sidebar.module.css';

export default function DropdownMenu({ listaBancos, escopoAtual, onEscolher }) {
  return (
    /* Container estrutural do menu dropdown para renderização dos escopos bancários.
       Gerencia o estado de seleção ativo para filtragem contextual dos dados.
    */
    <div className={styles.dropdownMenu}>
      
      {/* Opção estática para exibição do escopo consolidado (Visão Geral Global) */}
      <button 
        className={`${styles.dropdownOption} ${escopoAtual === 'overview' ? styles.opcaoAtiva : ''}`}
        onClick={() => onEscolher('overview')}
      >
        Visão Geral (Todos)
      </button>
      
      {/* Renderização iterativa (Mapping) dos registros de instituições bancárias recuperadas.
          Aplica o seletor de classe "opcaoAtiva" condicionalmente baseando-se no ID do recurso.
      */}
      {listaBancos.map((banco) => (
        <button
          key={banco.id}
          className={`${styles.dropdownOption} ${escopoAtual === banco.id ? styles.opcaoAtiva : ''}`}
          onClick={() => onEscolher(banco.id)}
        >
          {banco.nome}
        </button>
      ))}
    </div>
  );
}