// Fincore-frontend/src/components/Sidebar/DropdownButton.jsx

// Bibliotecas nativas do ecossistema React
import React from 'react';

// Bibliotecas de terceiros (Ícones vetoriais)
import { ChevronDown } from 'lucide-react';

// Estilizações encapsuladas via CSS Modules
import styles from './Sidebar.module.css';

export default function DropdownButton({ texto, aberto, onClick }) {
  return (
    /* Elemento nativo de acionamento (Button) para controle de colapso/expansão do menu lateral.
       Suporta eventos de clique delegados pelo componente pai para manipulação de estado.
    */
    <button className={styles.dropdownButton} onClick={onClick}>
      {/* Renderização do rótulo textual dinâmico passado via propriedade */}
      {texto}
      
      {/* Ícone vetorial indicativo de estado colapsável.
          Aplica concatenação de strings via Template Literals para alternância de classes CSS
          baseada no estado booleano de abertura ("aberto"), acionando a rotação via CSS Transition.
      */}
      <ChevronDown 
        size={16} 
        className={`${styles.seta} ${aberto ? styles.setaAberta : ''}`} 
      />
    </button>
  );
}