// Fincore-frontend/src/components/FormTransacao/FormTransacao.jsx

// Bibliotecas nativas do ecossistema React
import React, { useState, useEffect } from 'react';

// Estilizações encapsuladas via CSS Modules
import styles from './FormTransacao.module.css';

export default function FormTransacao({ transacaoEditando, aoSalvar, aoCancelar }) {
  // Configuração do estado inicial estático do formulário
  const formInicial = {
    descricao: '',
    valor: '',
    tipo: 'Entrada',
    categoria: '',
    data: ''
  };

  // Estados locais do componente
  const [formData, setFormData] = useState(formInicial);

  // Efeito colateral para sincronização de propriedades externas de edição (Prop Sync)
  useEffect(() => {
    if (transacaoEditando) {
      setFormData({
        descricao: transacaoEditando.descricao || '',
        // Tipagem forçada para string para compatibilidade com elementos de entrada de texto HTML
        valor: transacaoEditando.valor ? transacaoEditando.valor.toString() : '',
        tipo: transacaoEditando.tipo || 'Entrada',
        categoria: transacaoEditando.categoria || '',
        data: transacaoEditando.data || ''
      });
    } else {
      setFormData(formInicial);
    }
  }, [transacaoEditando]);

  // Manipulador genérico de alteração de estados com base no atributo "name" do elemento target
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Processador de submissão do formulário com parsing de dados para o contrato da API
  const handleSubmeter = (e) => {
    e.preventDefault();
    
    // Casting de tipos e acoplamento do payload antes da chamada do callback
    const pacote = {
      ...formData,
      valor: parseFloat(formData.valor),
      banco_id: 1 
    };

    // Despacho dos dados tratados para o manipulador do escopo pai
    aoSalvar(pacote);
  };

  return (
    <form onSubmit={handleSubmeter} className={styles.formTransacao}>
      
      <div className={styles.formRow}>
        <div className={styles.inputGroup}>
          <label>Tipo</label>
          <select name="tipo" value={formData.tipo} onChange={handleChange} required>
            <option value="Entrada">Entrada</option>
            <option value="Saída">Saída</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>Valor (R$)</label>
          <input 
            type="number" 
            step="0.01" 
            name="valor" 
            placeholder="0.00"
            value={formData.valor} 
            onChange={handleChange} 
            required 
          />
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label>Descrição</label>
        <input 
          type="text" 
          name="descricao" 
          placeholder="Ex: Conta de Luz"
          value={formData.descricao} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.inputGroup}>
          <label>Categoria</label>
          <input 
            type="text" 
            name="categoria" 
            placeholder="Ex: Moradia"
            value={formData.categoria} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Data</label>
          <input 
            type="date" 
            name="data" 
            value={formData.data} 
            onChange={handleChange} 
            required 
          />
        </div>
      </div>

      <div className={styles.modalActions}>
        <button type="button" onClick={aoCancelar} className={styles.btnCancel}>Cancelar</button>
        <button type="submit" className={styles.btnPrimary}>Salvar</button>
      </div>
    </form>
  );
}