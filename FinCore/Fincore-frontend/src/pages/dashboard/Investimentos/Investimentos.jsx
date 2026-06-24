// Fincore-frontend/src/pages/dashboard/Investimentos/Investimentos.jsx

import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import api from '../../../services/api';

import styles from './Investimentos.module.css';

export default function Investimentos() {
  // --- HOOKS DE CONTEXTO ---
  const { bancos } = useOutletContext();
  
  // --- ESTADOS DE DADOS ---
  const [ativos, setAtivos] = useState([]);
  
  // --- ESTADOS DE CONTROLE DE INTERFACE (UI) ---
  const [modalAberto, setModalAberto] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [ativoDetalhado, setAtivoDetalhado] = useState(null);
  
  // --- ESTADOS DE FORMULÁRIO ---
  const [formData, setFormData] = useState({
    ticker: "",
    nome: "",
    tipo: "Ações",
    quantidade: "",
    preco_medio: "",
    preco_atual: "",
    corretora: "",
    data_adquirido: "",
    data_final: "",
    banco_id: ""
  });

  // Requisição de listagem de ativos financeiros na carteira do usuário
  const carregarInvestimentos = async () => {
    try {
      const response = await api.get('/investimentos');
      setAtivos(response.data);
    } catch (error) {
      console.error("Erro ao carregar investimentos:", error);
    }
  };

  useEffect(() => {
    carregarInvestimentos();
  }, []);

  // --- COMPUTAÇÃO DE KPIS E MÉTRICAS FINANCEIRAS ---
  const patrimonioTotal = ativos.reduce((acc, a) => acc + (a.quantidade * a.preco_atual), 0);
  const custoTotal = ativos.reduce((acc, a) => acc + (a.quantidade * a.preco_medio), 0);
  const lucroPrejuizoTotal = patrimonioTotal - custoTotal;
  const rentabilidadeGeral = custoTotal > 0 ? (lucroPrejuizoTotal / custoTotal) * 100 : 0;

  const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // --- MAPEAMENTO DE DADOS PARA GRÁFICOS (RECHARTS) ---
  const CORES_INVESTIMENTOS = ['#00FF9D', '#00F0FF', '#4a90e2', '#F5A623', '#9b5de5'];

  // Mapeamento bidimensional para o gráfico de barras de patrimônio por ativo
  const dadosPatrimonioAtivos = ativos.map(a => ({
    name: a.ticker,
    Valor: a.quantidade * a.preco_atual
  }));

  // Agrupamento categórico de patrimônio alocado por classe de ativo
  const alocacaoClassesMap = ativos.reduce((acc, a) => {
    const valorAtivo = a.quantidade * a.preco_atual;
    if (acc[a.tipo]) {
      acc[a.tipo] += valorAtivo;
    } else {
      acc[a.tipo] = valorAtivo;
    }
    return acc;
  }, {});

  // Conversão do mapa estrutural de alocação para vetor iterável (gráfico de rosca)
  const dadosAlocacaoClasses = Object.keys(alocacaoClassesMap).map(key => ({
    name: key,
    value: alocacaoClassesMap[key]
  }));

  // --- MANIPULADORES DE ESTADO (MODAIS) ---
  const abrirModalNovo = (e) => {
    e.stopPropagation();
    setIdEditando(null);
    setFormData({
      ticker: "",
      nome: "",
      tipo: "Ações",
      quantidade: "",
      preco_medio: "",
      preco_atual: "",
      corretora: "",
      data_adquirido: "",
      data_final: "",
      banco_id: bancos && bancos.length > 0 ? bancos[0].id.toString() : ""
    });
    setModalAberto(true);
  };

  const abrirModalEditar = (ativo, e) => {
    e.stopPropagation();
    setIdEditando(ativo.id);
    setFormData({
      ticker: ativo.ticker,
      nome: ativo.nome,
      tipo: ativo.tipo,
      quantidade: ativo.quantidade.toString(),
      preco_medio: ativo.preco_medio.toString(),
      preco_atual: ativo.preco_atual.toString(),
      corretora: ativo.corretora,
      data_adquirido: ativo.data_adquirido,
      data_final: ativo.data_final || "",
      banco_id: ativo.banco_id.toString()
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setIdEditando(null);
  };

  // --- COMUNICAÇÃO DE REDE (API) ---
  
  // Submissão do payload de registro ou atualização de ativo financeiro
  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      const pacote = {
        ticker: formData.ticker.toUpperCase(),
        nome: formData.nome,
        tipo: formData.tipo,
        quantidade: parseFloat(formData.quantidade),
        preco_medio: parseFloat(formData.preco_medio),
        preco_atual: parseFloat(formData.preco_atual),
        corretora: formData.corretora,
        data_adquirido: formData.data_adquirido,
        data_final: formData.data_final || null,
        banco_id: parseInt(formData.banco_id)
      };

      if (idEditando) {
        await api.put(`/investimentos/${idEditando}`, pacote);
      } else {
        await api.post('/investimentos', pacote);
      }

      fecharModal();
      carregarInvestimentos();
      setAtivoDetalhado(null);
    } catch (error) {
      console.error("Erro ao salvar investimento:", error);
      alert("Erro ao salvar investimento.");
    }
  };

  // Requisição de exclusão de ativo financeiro com validação de intenção prévia
  const deletarInvestimento = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Deseja remover este ativo da sua carteira?")) return;
    try {
      await api.delete(`/investimentos/${id}`);
      carregarInvestimentos();
      setAtivoDetalhado(null);
    } catch (error) {
      console.error("Erro ao deletar investimento:", error);
    }
  };

  return (
    <div className={styles.investGrid}>
      
      <div className={styles.kpiCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className={styles.cardTitle}>Patrimônio Atual</h3>
          <button className={styles.btnPrimary} onClick={abrirModalNovo}>
            + Novo Ativo
          </button>
        </div>
        <p className={styles.cardValue} style={{ color: '#00FF9D' }}>{formatarMoeda(patrimonioTotal)}</p>
      </div>
      <div className={styles.kpiCard}>
        <h3 className={styles.cardTitle}>Total Investido</h3>
        <p className={styles.cardValue}>{formatarMoeda(custoTotal)}</p>
      </div>
      <div className={styles.kpiCard}>
        <h3 className={styles.cardTitle}>Rentabilidade</h3>
        <p className={styles.cardValue} style={{ color: lucroPrejuizoTotal >= 0 ? '#00FF9D' : '#FF5A5A' }}>
          {lucroPrejuizoTotal >= 0 ? '+' : ''}{rentabilidadeGeral.toFixed(2)}%
        </p>
      </div>

      <div className={styles.chartsContainer}>
        <div className={styles.chartCardArea}>
          <h3 className={styles.cardTitle}>Evolução do Patrimônio</h3>
          <div style={{ width: '100%', height: '200px', marginTop: '1rem' }}>
            {ativos.length === 0 ? (
              <div className={styles.chartPlaceholder}>Sem ativos na carteira</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPatrimonioAtivos} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" vertical={false} />
                  <XAxis dataKey="name" stroke="#8A8A93" tick={{ fill: '#8A8A93', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#8A8A93" tick={{ fill: '#8A8A93', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1E', borderColor: '#2A2A2E', color: '#FFF' }} formatter={(value) => formatarMoeda(value)} />
                  <Bar dataKey="Valor" fill="#00FF9D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        <div className={styles.chartCardDonut}>
          <h3 className={styles.cardTitle}>Alocação da Carteira</h3>
          <div style={{ width: '100%', height: '200px', marginTop: '1rem' }}>
            {ativos.length === 0 ? (
              <div className={styles.chartPlaceholder}>Sem ativos na carteira</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosAlocacaoClasses}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {dadosAlocacaoClasses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_INVESTIMENTOS[index % CORES_INVESTIMENTOS.length]} />
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
        <h3 className={styles.cardTitle}>Minhas Posições</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ativo</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Qtd.</th>
                <th style={{ textAlign: 'right' }}>Preço Médio</th>
                <th style={{ textAlign: 'right' }}>Cotação Atual</th>
                <th style={{ textAlign: 'right' }}>Variação</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ativos.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Nenhum ativo registrado.</td>
                </tr>
              ) : (
                ativos.map((ativo) => {
                  const variacao = ((ativo.preco_atual - ativo.preco_medio) / ativo.preco_medio) * 100;
                  const corVariacao = variacao >= 0 ? '#00FF9D' : '#FF5A5A';

                  return (
                    <tr key={ativo.id} onClick={() => setAtivoDetalhado(ativo)} className={styles.rowInterativa}>
                      <td>
                        <div style={{ fontWeight: 'bold', color: '#FFF' }}>{ativo.ticker}</div>
                        <div style={{ fontSize: '0.8rem', color: '#8A8A93' }}>{ativo.nome}</div>
                      </td>
                      <td><span className={styles.tag}>{ativo.tipo}</span></td>
                      <td style={{ textAlign: 'right' }}>{ativo.quantidade}</td>
                      <td style={{ textAlign: 'right' }}>{formatarMoeda(ativo.preco_medio)}</td>
                      <td style={{ textAlign: 'right' }}>{formatarMoeda(ativo.preco_atual)}</td>
                      <td style={{ textAlign: 'right', color: corVariacao, fontWeight: 'bold' }}>
                        {variacao >= 0 ? '+' : ''}{variacao.toFixed(2)}%
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className={styles.btnIcon} onClick={(e) => abrirModalEditar(ativo, e)}>✏️</button>
                        <button className={styles.btnIcon} onClick={(e) => deletarInvestimento(ativo.id, e)}>🗑️</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {ativoDetalhado && (() => {
        const aplicado = ativoDetalhado.quantidade * ativoDetalhado.preco_medio;
        const atual = ativoDetalhado.quantidade * ativoDetalhado.preco_atual;
        const ganho = atual - aplicado;
        const pct = aplicado > 0 ? (ganho / aplicado) * 100 : 0;
        const banco = bancos.find(b => b.id === ativoDetalhado.banco_id)?.nome || "Não informado";

        return (
          <div className={styles.modalOverlay} onClick={() => setAtivoDetalhado(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3>Análise de Posição: {ativoDetalhado.ticker}</h3>
              <div className={styles.detalhesGrid}>
                <div className={styles.detalheItem}><strong>Nome:</strong> <span>{ativoDetalhado.nome}</span></div>
                <div className={styles.detalheItem}><strong>Tipo:</strong> <span>{ativoDetalhado.tipo}</span></div>
                <div className={styles.detalheItem}><strong>Corretora:</strong> <span>{ativoDetalhado.corretora}</span></div>
                <div className={styles.detalheItem}><strong>Instituição Vinculada:</strong> <span>{banco}</span></div>
                <hr style={{ gridColumn: 'span 2', borderColor: '#2A2A2E', margin: '0.5rem 0' }} />
                <div className={styles.detalheItem}><strong>Quantidade:</strong> <span>{ativoDetalhado.quantidade}</span></div>
                <div className={styles.detalheItem}><strong>Data da Compra:</strong> <span>{ativoDetalhado.data_adquirido}</span></div>
                <div className={styles.detalheItem}><strong>Preço Médio:</strong> <span>{formatarMoeda(ativoDetalhado.preco_medio)}</span></div>
                <div className={styles.detalheItem}><strong>Cotação:</strong> <span>{formatarMoeda(ativoDetalhado.preco_atual)}</span></div>
                <hr style={{ gridColumn: 'span 2', borderColor: '#2A2A2E', margin: '0.5rem 0' }} />
                <div className={styles.detalheItem} style={{ background: '#111', padding: '0.5rem', borderRadius: '4px' }}>
                  <strong>Custo Total:</strong> <span>{formatarMoeda(aplicado)}</span>
                </div>
                <div className={styles.detalheItem} style={{ background: '#111', padding: '0.5rem', borderRadius: '4px' }}>
                  <strong>Valor de Mercado:</strong> <span>{formatarMoeda(atual)}</span>
                </div>
                <div className={styles.detalheItem} style={{ background: '#111', padding: '0.5rem', borderRadius: '4px', gridColumn: 'span 2' }}>
                  <strong>Resultado acumulado:</strong>
                  <span style={{ fontWeight: 'bold', color: ganho >= 0 ? '#00FF9D' : '#FF5A5A' }}>
                    {formatarMoeda(ganho)} ({ganho >= 0 ? '+' : ''}{pct.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => abrirModalEditar(ativoDetalhado, { stopPropagation: () => {} })} className={styles.btnPrimary}>Editar Cadastro</button>
                <button type="button" onClick={() => setAtivoDetalhado(null)} className={styles.btnCancel}>Fechar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {modalAberto && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>{idEditando ? 'Editar Ativo' : 'Novo Ativo'}</h3>
            <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#8A8A93' }}>Conta/Banco</span>
                  <select required value={formData.banco_id} onChange={(e) => setFormData({...formData, banco_id: e.target.value})}>
                    <option value="">Selecione...</option>
                    {bancos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#8A8A93' }}>Classe</span>
                  <select value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})}>
                    <option value="Ações">Ações</option>
                    <option value="Cripto">Cripto</option>
                    <option value="ETF">ETF</option>
                    <option value="Renda Fixa">Renda Fixa</option>
                    <option value="FIIs">FIIs</option>
                  </select>
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                <input type="text" required placeholder="Ticker (PETR4)" value={formData.ticker} onChange={(e) => setFormData({...formData, ticker: e.target.value})} />
                <input type="text" required placeholder="Nome do Ativo" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
              </div>
              <input type="text" required placeholder="Corretora" value={formData.corretora} onChange={(e) => setFormData({...formData, corretora: e.target.value})} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <input type="number" step="0.00001" required placeholder="Qtd." value={formData.quantidade} onChange={(e) => setFormData({...formData, quantidade: e.target.value})} />
                <input type="number" step="0.01" required placeholder="P. Médio (R$)" value={formData.preco_medio} onChange={(e) => setFormData({...formData, preco_medio: e.target.value})} />
                <input type="number" step="0.01" required placeholder="P. Atual (R$)" value={formData.preco_atual} onChange={(e) => setFormData({...formData, preco_atual: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <label><span style={{ fontSize: '0.8rem', color: '#8A8A93' }}>Aquisição</span><input type="date" required value={formData.data_adquirido} onChange={(e) => setFormData({...formData, data_adquirido: e.target.value})} /></label>
                <label><span style={{ fontSize: '0.8rem', color: '#8A8A93' }}>Vencimento</span><input type="date" value={formData.data_final} onChange={(e) => setFormData({...formData, data_final: e.target.value})} /></label>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={fecharModal} className={styles.btnCancel}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary}>{idEditando ? 'Atualizar' : 'Adicionar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}