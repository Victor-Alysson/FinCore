// Fincore-frontend/src/components/Input/Input.jsx

// Bibliotecas nativas do ecossistema React
import React from 'react';

// Estilizações encapsuladas via CSS Modules
import styles from './Input.module.css';

export default function Input({ type = 'text', placeholder, value, onChange, ...props }) {
  return (
    /* Container estrutural de encapsulamento para isolamento de escopo visual e alinhamento layout-driven */
    <div className={styles.inputContainer}>
      {/* Elemento nativo de captura de dados com repasse de propriedades remanescentes (...props).
          Garante a preservação de propriedades nativas (required, disabled, min, max) e acessibilidade (aria-labels).
      */}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={styles.inputField}
        {...props}
      />
    </div>
  );
}