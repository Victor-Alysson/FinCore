// Fincore-frontend/src/components/Button/Button.jsx

// Bibliotecas nativas do ecossistema React
import React from 'react';

// Estilizações encapsuladas via CSS Modules
import styles from './Button.module.css';

export default function Button({ children, type = 'button', onClick, ...props }) {
  return (
    /* Elemento semântico de botão com repasse de atributos nativos (...props).
       Garante flexibilidade estrutural permitindo desativação (disabled), 
       classes acessórias ou aria-attributes injetados no escopo do componente pai.
    */
    <button 
      type={type} 
      onClick={onClick} 
      className={styles.btn} 
      {...props}
    >
      {children}
    </button>
  );
}