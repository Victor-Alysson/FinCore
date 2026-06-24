// Fincore-frontend/src/pages/dashboard/ExtratoDashboard/ExtratoDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import api from '../../../services/api';

import styles from './ExtratoDashboard.module.css';

export default function ExtratoDashboard() {
  // --- HOOKS DE ROTEAMENTO E CONTEXTO ---
  const { bancos } = useOutletContext();
  const { banco } = useParams();

  // --- ESTADOS DE DADOS ---
  const [transacoes, setTransacoes] = useState([]);

  // --- ESTADOS DE CONTROLE DE INTERFACE (UI) ---
  const [modalAberto, setModalAberto] = useState(false);
  const [idEditando, setIdEditando] = useState(null); 

  // --- ESTADOS DE FORMULÁRIO ---
  const [formData, setFormData] = useState({
    banco_id: "",
    tipo: "Saída",
    valor: "",
    descricao: "",
    categoria: "",
    data: ""
  });

  // Requisição da listagem de lançamentos financeiros com invalidação de cache (timestamp)
  const carregarTransacoes = async () => {
    try {
      const response = await api.get(`/transacoes?_t=${Date.now()}`);
      setTransacoes(response.data);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
    }
  };

  useEffect(() => {
    carregarTransacoes();
  }, []);

  // --- COMPUTAÇÃO DE KPIS E FORMATAÇÃO ---
  
  // Derivação de escopo baseada no parâmetro de rota ativo (Visão Global vs. Conta Específica)
  const transacoesFiltradas = banco === 'overview' || !banco
    ? transacoes 
    : transacoes.filter(t => t.banco_id != null && t.banco_id.toString() === banco.toString());

  const totalEntradas = transacoesFiltradas
    .filter(t => t.tipo === 'Entrada')
    .reduce((acumulador, t) => acumulador + t.valor, 0);

  const totalSaidas = transacoesFiltradas
    .filter(t => t.tipo === 'Saída')
    .reduce((acumulador, t) => acumulador + t.valor, 0);

  const saldoAtual = totalEntradas - totalSaidas;

  const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // --- MAPEAMENTO DE DADOS PARA GRÁFICOS (RECHARTS) ---
  const CORES_CATEGORIAS = ['#FF5A5A', '#F5A623', '#9b5de5', '#4a90e2', '#00F0FF', '#FF8E8E'];

  // Agrupamento temporal bidimensional (entradas e saídas) formatado para o gráfico de barras
  const fluxoMap = transacoesFiltradas.reduce((acc, t) => {
    if (!t.data) return acc;
    
    const partes = t.data.split('-');
    const dataCurta = partes.length === 3 ? `${partes[2]}/${partes[1]}` : t.data;

    if (!acc[dataCurta]) {
      acc[dataCurta] = { name: dataCurta, dataOriginal: t.data, Entradas: 0, Saídas: 0 };
    }
    
    if (t.tipo === 'Entrada') acc[dataCurta].Entradas += t.valor;
    if (t.tipo === 'Saída') acc[dataCurta].Saídas += t.valor;
    
    return acc;
  }, {});

  // Ordenação cronológica ascendente do vetor temporal
  const dadosFluxo = Object.values(fluxoMap).sort((a, b) => a.dataOriginal.localeCompare(b.dataOriginal));

  // Mapeamento categórico e acumulação exclusiva de transações de passivo (saídas)
  const despesasMap = transacoesFiltradas
    .filter(t => t.tipo === 'Saída')
    .reduce((acc, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
      return acc;
    }, {});

  // Conversão estrutural do mapa categórico para vetor e ordenação por volume (gráfico de rosca)
  const dadosCategoria = Object.keys(despesasMap)
    .map(key => ({ name: key, value: despesasMap[key] }))
    .sort((a, b) => b.value - a.value); 

  // --- MANIPULADORES DE ESTADO (MODAIS) ---
  const abrirModalNovo = () => {
    setIdEditando(null); 
    setFormData({ 
      banco_id: banco && banco !== 'overview' ? banco : "", 
      tipo: "Saída", 
      valor: "", 
      descricao: "", 
      categoria: "", 
      data: "" 
    });
    setModalAberto(true);
  };

  const abrirModalEditar = (transacao) => {
    setIdEditando(transacao.id);
    setFormData({
      banco_id: transacao.banco_id || "",
      tipo: transacao.tipo,
      valor: transacao.valor,
      descricao: transacao.descricao,
      categoria: transacao.categoria,
      data: transacao.data 
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setIdEditando(null);
  };

  // --- COMUNICAÇÃO DE REDE (API) ---
  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      const pacote = {
        valor: parseFloat(formData.valor),
        tipo: formData.tipo,
        descricao: formData.descricao,
        categoria: formData.categoria,
        data: formData.data,
        banco_id: parseInt(formData.banco_id)
      };

      if (idEditando) {
        await api.put(`/transacoes/${idEditando}`, pacote);
      } else {
        await api.post('/transacoes', pacote);
      }
      
      fecharModal();
      carregarTransacoes();
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      alert(error.response?.data?.detail || "Erro ao salvar transação.");
    }
  };

  // Deleção de registro com estratégia de interface otimista para mitigação de latência
  const deletarTransacao = async (idParaDeletar) => {
    const confirmacao = window.confirm("Tem certeza que deseja apagar esta transação?");
    if (!confirmacao) return;

    const listaOtimista = transacoes.filter(t => t.id !== idParaDeletar);
    setTransacoes(listaOtimista);

    try {
      await api.delete(`/transacoes/${idParaDeletar}`);
      setTimeout(() => carregarTransacoes(), 300);
    } catch (error) {
      console.error("Erro ao deletar transação:", error);
      carregarTransacoes();
      alert("Erro ao apagar transação.");
    }
  };

  return (
    <div className={styles.extratoGrid}>
      
      <div className={styles.headerDashboard}>
        <h2>
          {banco === 'overview' ? 'Extrato: Visão Geral' : `Extrato: ${bancos.find(b => b.id.toString() === banco?.toString())?.nome || 'Carregando...'}`}
        </h2>
        <button className={styles.btnPrimary} onClick={abrirModalNovo}>
          + Nova Transação
        </button>
      </div>

      <div className={styles.kpiCard}>
        <h3 className={styles.cardTitle}>Saldo {banco === 'overview' ? 'Total' : 'da Conta'}</h3>
        <p className={styles.cardValue}>{formatarMoeda(saldoAtual)}</p>
      </div>
      <div className={styles.kpiCard}>
        <h3 className={styles.cardTitle}>Entradas</h3>
        <p className={styles.cardValue} style={{ color: '#00FF9D' }}>
          + {formatarMoeda(totalEntradas)}
        </p>
      </div>
      <div className={styles.kpiCard}>
        <h3 className={styles.cardTitle}>Saídas</h3>
        <p className={styles.cardValue} style={{ color: '#FF5A5A' }}>
          - {formatarMoeda(totalSaidas)}
        </p>
      </div>

      <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        <div style={{ backgroundColor: '#1A1A1E', border: '1px solid #2A2A2E', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 className={styles.cardTitle}>Fluxo de Caixa (Diário)</h3>
          <div style={{ width: '100%', height: '250px', marginTop: '1rem' }}>
            {dadosFluxo.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A4A52', border: '2px dashed #2A2A2E', borderRadius: '8px' }}>
                Sem transações registradas
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosFluxo} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" vertical={false} />
                  <XAxis dataKey="name" stroke="#8A8A93" tick={{ fill: '#8A8A93', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#8A8A93" tick={{ fill: '#8A8A93', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1E', borderColor: '#2A2A2E', color: '#FFF' }} formatter={(value) => formatarMoeda(value)} />
                  <Legend />
                  <Bar dataKey="Entradas" fill="#00FF9D" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Saídas" fill="#FF5A5A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={{ backgroundColor: '#1A1A1E', border: '1px solid #2A2A2E', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 className={styles.cardTitle}>Despesas por Categoria</h3>
          <div style={{ width: '100%', height: '250px', marginTop: '1rem' }}>
            {dadosCategoria.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A4A52', border: '2px dashed #2A2A2E', borderRadius: '8px' }}>
                Sem saídas registradas
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {dadosCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_CATEGORIAS[index % CORES_CATEGORIAS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1E', borderColor: '#2A2A2E', color: '#FFF' }} formatter={(value) => formatarMoeda(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <h3 className={styles.cardTitle}>Histórico de Transações</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {transacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nenhuma transação encontrada para esta conta.
                  </td>
                </tr>
              ) : (
                transacoesFiltradas.map((t) => (
                  <tr key={t.id}>
                    <td>{t.data}</td>
                    <td>{t.descricao}</td>
                    <td><span className={styles.tag}>{t.categoria}</span></td>
                    <td style={{ textAlign: 'right', color: t.tipo === 'Entrada' ? '#00FF9D' : '#FF5A5A' }}>
                      {t.tipo === 'Entrada' ? '+' : '-'} {formatarMoeda(t.valor)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className={styles.btnIcon} onClick={() => abrirModalEditar(t)}>✏️</button>
                      <button className={styles.btnIcon} onClick={() => deletarTransacao(t.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>{idEditando ? 'Editar Transação' : 'Nova Transação'}</h3>
            <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <select 
                required 
                value={formData.banco_id}
                onChange={(e) => setFormData({...formData, banco_id: e.target.value})}
                style={{ padding: '0.5rem', borderRadius: '4px' }}
              >
                <option value="">Selecione uma conta...</option>
                {bancos.map((b) => (
                  <option key={b.id} value={b.id}>{b.nome}</option>
                ))}
              </select>

              <select 
                required
                value={formData.tipo}
                onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                style={{ padding: '0.5rem', borderRadius: '4px' }}
              >
                <option value="Saída">Saída (Despesa)</option>
                <option value="Entrada">Entrada (Receita)</option>
              </select>

              <input type="number" step="0.01" required placeholder="Valor (R$)" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px' }} />
              <input type="text" required placeholder="Descrição" value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px' }} />
              <input type="text" required placeholder="Categoria" value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px' }} />
              <input type="date" required value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px' }} />

              <div className={styles.modalActions}>
                <button type="button" onClick={fecharModal} className={styles.btnCancel}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary}>{idEditando ? 'Atualizar' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}