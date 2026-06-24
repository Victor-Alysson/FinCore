// Caminho: Fincore-frontend/src/components/Header/Header.jsx

import React from 'react';
import { Zap } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brandWrapper}>
        <h1 className={styles.title}>
          <span className={styles.brandAccent}>Fin</span>Core
        </h1>
        <Zap className={styles.icon} />
      </div>
      <p className={styles.subtitle}>
        Gerencie suas finanças de forma inteligente.
      </p>
    </header>
  );
}