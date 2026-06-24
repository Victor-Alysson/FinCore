// Fincore-frontend/src/pages/dashboard/Dividas/Dividas.jsx

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
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import api from '../../../services/api';

import styles from './Dividas.module.css';

export default function Dividas() {
  // --- HOOKS DE CONTEXTO ---
  const { bancos } = useOutletContext();
  
  // --- ESTADOS DE DADOS ---
  const [dividas, setDividas] = useState([]);
  
  // --- ESTADOS DE CONTROLE DE INTERFACE (UI) ---
  const [modalAberto, setModalAberto] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [dividaDetalhada, setDividaDetalhada] = useState(null); 
  
  // --- ESTADOS DE FORMULÁRIO ---
  const [formData, setFormData] = useState({
    credor: "",
    tipo: "",
    taxa_juro: "",
    prestacao: "",
    valor_total: "",
    valor_pago: "",
    status: "Ativa",
    data_contraira: "",
    data_final: "",
    banco_id: ""
  });

  // Requisição de listagem de passivos e montagem do componente
  const carregarDividas = async () => {
    try {
      const response = await api.get('/dividas');
      setDividas(response.data);
    } catch (error) {
      console.error("Erro ao carregar dívidas:", error);
    }
  };

  useEffect(() => {
    carregarDividas();
  }, []);

  // --- COMPUTAÇÃO DE KPIS E FORMATAÇÃO ---
  const totalEmDivida = dividas.reduce((acumulador, d) => acumulador + (d.valor_total - d.valor_pago), 0);
  const proximasPrestacoes = dividas.filter(d => d.status === 'Ativa').reduce((acumulador, d) => acumulador + d.prestacao, 0);
  
  const dividasAtivas = dividas.filter(d => d.status === 'Ativa');
  const taxaMedia = dividasAtivas.length > 0 
    ? dividasAtivas.reduce((acc, d) => acc + d.taxa_juro, 0) / dividasAtivas.length 
    : 0;

  const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // --- MAPEAMENTO DE DADOS PARA GRÁFICOS (RECHARTS) ---
  const CORES_DIVIDAS = ['#FF5A5A', '#F5A623', '#FF8E8E', '#D97706', '#EF4444'];

  // Estruturação bidimensional para gráfico de barras empilhadas
  const dadosAmortizacao = dividas.map(d => ({
    name: d.credor,
    Amortizado: d.valor_pago,
    Restante: Math.max(0, d.valor_total - d.valor_pago)
  }));

  // Filtragem e mapeamento vetorial para gráfico de rosca (exclusão de dívidas liquidadas)
  const dadosComposicao = dividas.filter(d => d.valor_total - d.valor_pago > 0).map(d => ({
    name: d.credor,
    value: Math.max(0, d.valor_total - d.valor_pago)
  }));

  // --- MANIPULADORES DE ESTADO (MODAIS) ---
  const abrirModalNovo = (e) => {
    e.stopPropagation(); 
    setIdEditando(null);
    setFormData({
      credor: "",
      tipo: "",
      taxa_juro: "",
      prestacao: "",
      valor_total: "",
      valor_pago: "0",
      status: "Ativa",
      data_contraira: "",
      data_final: "",
      banco_id: bancos && bancos.length > 0 ? bancos[0].id.toString() : ""
    });
    setModalAberto(true);
  };

  const abrirModalEditar = (divida, e) => {
    e.stopPropagation(); 
    setIdEditando(divida.id);
    setFormData({
      credor: divida.credor,
      tipo: divida.tipo,
      taxa_juro: divida.taxa_juro.toString(),
      prestacao: divida.prestacao.toString(),
      valor_total: divida.valor_total.toString(),
      valor_pago: divida.valor_pago.toString(),
      status: divida.status,
      data_contraira: divida.data_contraira,
      data_final: divida.data_final || "",
      banco_id: divida.banco_id.toString()
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setIdEditando(null);
  };

  // --- LÓGICA DE MATEMÁTICA FINANCEIRA AVANÇADA ---
  // Computação de projeção baseada no Sistema de Amortização Francês (Tabela Price)
  const calcularMetricasDetalhadas = (d) => {
    const saldoDevedor = d.valor_total - d.valor_pago;
    if (saldoDevedor <= 0 || d.status === 'Quitada') {
      return { mesesRestantes: 0, jurosEstimadosRestantes: 0, custoTotalEstimado: d.valor_pago };
    }

    // Conversão de taxa de juros anual para taxa equivalente mensal
    const taxaMensal = Math.pow(1 + (d.taxa_juro / 100), 1 / 12) - 1;
    
    let mesesRestantes = 0;
    let jurosEstimadosRestantes = 0;

    if (taxaMensal > 0 && d.prestacao > (saldoDevedor * taxaMensal)) {
      // Cálculo do número de períodos restantes via logaritmo da razão de amortização
      mesesRestantes = -Math.log(1 - (saldoDevedor * taxaMensal) / d.prestacao) / Math.log(1 + taxaMensal);
      mesesRestantes = Math.ceil(mesesRestantes);
      
      // Projeção do custo financeiro residual
      jurosEstimadosRestantes = (d.prestacao * mesesRestantes) - saldoDevedor;
    } else {
      // Abordagem de aproximação linear para cenários de dívida perpétua (ex: rotativo de cartão)
      mesesRestantes = Math.ceil(saldoDevedor / d.prestacao);
      jurosEstimadosRestantes = (saldoDevedor * (d.taxa_juro / 100) * (mesesRestantes / 12)) / 2; 
    }

    return {
      mesesRestantes: isNaN(mesesRestantes) || !isFinite(mesesRestantes) ? Math.ceil(saldoDevedor / d.prestacao) : mesesRestantes,
      jurosEstimadosRestantes: jurosEstimadosRestantes < 0 ? 0 : jurosEstimadosRestantes,
      custoTotalEstimado: d.valor_total + (jurosEstimadosRestantes < 0 ? 0 : jurosEstimadosRestantes)
    };
  };

  // --- COMUNICAÇÃO DE REDE (API) ---
  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      const pacote = {
        credor: formData.credor,
        tipo: formData.tipo,
        taxa_juro: parseFloat(formData.taxa_juro),
        prestacao: parseFloat(formData.prestacao),
        valor_total: parseFloat(formData.valor_total),
        valor_pago: parseFloat(formData.valor_pago || 0),
        status: formData.status,
        data_contraira: formData.data_contraira,
        data_final: formData.data_final || null,
        banco_id: parseInt(formData.banco_id)
      };

      if (idEditando) {
        await api.put(`/dividas/${idEditando}`, pacote);
      } else {
        await api.post('/dividas', pacote);
      }

      fecharModal();
      carregarDividas();
      setDividaDetalhada(null); 
    } catch (error) {
      console.error("Erro ao salvar dívida:", error);
      alert(error.response?.data?.detail || "Erro ao salvar dívida.");
    }
  };

  const deletarDivida = async (idParaDeletar, e) => {
    e.stopPropagation();
    const confirmacao = window.confirm("Tem certeza que deseja apagar esta dívida?");
    if (!confirmacao) return;

    try {
      await api.delete(`/dividas/${idParaDeletar}`);
      carregarDividas();
      setDividaDetalhada(null);
    } catch (error) {
      console.error("Erro ao apagar dívida:", error);
      alert("Erro ao apagar dívida.");
    }
  };

  return (
    <div className={styles.dividasGrid}>
      
      <div className={styles.kpiCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className={styles.cardTitle}>Total em Dívida</h3>
          <button className={styles.btnPrimary} onClick={abrirModalNovo} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            + Nova Dívida
          </button>
        </div>
        <p className={styles.cardValue} style={{ color: '#FF5A5A', marginTop: '0.5rem' }}>
          {formatarMoeda(totalEmDivida)}
        </p>
      </div>
      <div className={styles.kpiCard}>
        <h3 className={styles.cardTitle}>Próximas Prestações (Mês)</h3>
        <p className={styles.cardValue}>{formatarMoeda(proximasPrestacoes)}</p>
      </div>
      <div className={styles.kpiCard}>
        <h3 className={styles.cardTitle}>Taxa de Juro Média</h3>
        <p className={styles.cardValue} style={{ color: '#F5A623' }}>
          {taxaMedia.toFixed(1)}%
        </p>
      </div>

      <div className={styles.chartsContainer}>
        <div className={styles.chartCardArea}>
          <h3 className={styles.cardTitle}>Projeção de Amortização</h3>
          <div style={{ width: '100%', height: '200px', marginTop: '1rem' }}>
            {dividas.length === 0 ? (
              <div className={styles.chartPlaceholder}>Sem dados para exibir</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosAmortizacao} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" vertical={false} />
                  <XAxis dataKey="name" stroke="#8A8A93" tick={{ fill: '#8A8A93', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#8A8A93" tick={{ fill: '#8A8A93', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1E', borderColor: '#2A2A2E', color: '#FFF' }} />
                  <Legend />
                  <Bar dataKey="Amortizado" stackId="a" fill="#00FF9D" />
                  <Bar dataKey="Restante" stackId="a" fill="#FF5A5A" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        <div className={styles.chartCardDonut}>
          <h3 className={styles.cardTitle}>Composição da Dívida</h3>
          <div style={{ width: '100%', height: '200px', marginTop: '1rem' }}>
            {dadosComposicao.length === 0 ? (
              <div className={styles.chartPlaceholder}>Sem dados para exibir</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosComposicao}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {dadosComposicao.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_DIVIDAS[index % CORES_DIVIDAS.length]} />
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
        <h3 className={styles.cardTitle}>Detalhamento de Passivos <span style={{fontSize: '0.8rem', color: '#666', textTransform: 'none'}}>(Clique na linha para ver a projeção detalhada)</span></h3>
        
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Credor</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Taxa</th>
                <th style={{ textAlign: 'right' }}>Parc. Mensal</th>
                <th style={{ textAlign: 'right' }}>Saldo Devedor</th>
                <th style={{ width: '180px' }}>Progresso</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {dividas.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Nenhuma dívida cadastrada.</td>
                </tr>
              ) : (
                dividas.map((divida) => {
                  const percentagemPaga = divida.valor_total > 0 ? (divida.valor_pago / divida.valor_total) * 100 : 0;
                  const saldoDevedor = divida.valor_total - divida.valor_pago;

                  return (
                    <tr 
                      key={divida.id} 
                      onClick={() => setDividaDetalhada(divida)}
                      className={styles.rowInterativa}
                      style={{ opacity: divida.status === 'Quitada' ? 0.6 : 1 }}
                    >
                      <td>
                        <div style={{ fontWeight: 'bold', color: '#FFF' }}>{divida.credor}</div>
                        <small style={{ color: '#aaa' }}>{divida.status}</small>
                      </td>
                      <td><span className={styles.tag}>{divida.tipo}</span></td>
                      <td style={{ textAlign: 'right', color: '#F5A623' }}>{divida.taxa_juro.toFixed(1)}%</td>
                      <td style={{ textAlign: 'right' }}>{formatarMoeda(divida.prestacao)}</td>
                      <td style={{ textAlign: 'right', color: '#FF5A5A', fontWeight: 'bold' }}>
                        {formatarMoeda(saldoDevedor)}
                      </td>
                      <td>
                        <div className={styles.progressContainer}>
                          <div className={styles.progressBarBg}>
                            <div className={styles.progressBarFill} style={{ width: `${Math.min(percentagemPaga, 100)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className={styles.btnIcon} onClick={(e) => abrirModalEditar(divida, e)}>✏️</button>
                        <button className={styles.btnIcon} onClick={(e) => deletarDivida(divida.id, e)}>🗑️</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {dividaDetalhada && (() => {
        const metricas = calcularMetricasDetalhadas(dividaDetalhada);
        const saldoDevedor = dividaDetalhada.valor_total - dividaDetalhada.valor_pago;
        const bancoNome = bancos.find(b => b.id === dividaDetalhada.banco_id)?.nome || "Não informado";

        return (
          <div className={styles.modalOverlay} onClick={() => setDividaDetalhada(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ width: '550px' }}>
              <h3>Análise de Passivo: {dividaDetalhada.credor}</h3>
              
              <div className={styles.detalhesGrid}>
                <div className={styles.detalheItem}><strong>Tipo:</strong> <span>{dividaDetalhada.tipo}</span></div>
                <div className={styles.detalheItem}><strong>Conta Associada:</strong> <span>{bancoNome}</span></div>
                <div className={styles.detalheItem}><strong>Status Atual:</strong> <span className={styles.tag}>{dividaDetalhada.status}</span></div>
                <div className={styles.detalheItem}><strong>Data de Contratação:</strong> <span>{dividaDetalhada.data_contraira}</span></div>
                
                <hr style={{ gridColumn: 'span 2', borderColor: '#2d2d2d', margin: '0.5rem 0' }} />
                
                <div className={styles.detalheItem}><strong>Montante Contratado:</strong> <span>{formatarMoeda(dividaDetalhada.valor_total)}</span></div>
                <div className={styles.detalheItem}><strong>Total Amortizado (Pago):</strong> <span style={{ color: '#00FF9D' }}>{formatarMoeda(dividaDetalhada.valor_pago)}</span></div>
                <div className={styles.detalheItem}><strong>Saldo Devedor Atual:</strong> <span style={{ color: '#FF5A5A', fontWeight: 'bold' }}>{formatarMoeda(saldoDevedor)}</span></div>
                <div className={styles.detalheItem}><strong>Mensalidade (Prestação):</strong> <span>{formatarMoeda(dividaDetalhada.prestacao)} / mês</span></div>
                <div className={styles.detalheItem}><strong style={{color: '#F5A623'}}>Taxa de Juros Contratual:</strong> <span>{dividaDetalhada.taxa_juro}% a.a.</span></div>
                
                <hr style={{ gridColumn: 'span 2', borderColor: '#2d2d2d', margin: '0.5rem 0' }} />
                
                <div className={styles.detalheItem} style={{ background: '#161616', padding: '0.5rem', borderRadius: '4px' }}>
                  <strong>Tempo Restante Estimado:</strong>
                  <span style={{ fontWeight: 'bold', color: '#4a90e2' }}>{metricas.mesesRestantes} meses</span>
                </div>
                <div className={styles.detalheItem} style={{ background: '#161616', padding: '0.5rem', borderRadius: '4px' }}>
                  <strong>Juros Futuros Projetados:</strong>
                  <span style={{ fontWeight: 'bold', color: '#F5A623' }}>{formatarMoeda(metricas.jurosEstimadosRestantes)}</span>
                </div>
              </div>

              <div className={styles.modalActions} style={{ marginTop: '1.5rem' }}>
                <button type="button" onClick={() => abrirModalEditar(dividaDetalhada, { stopPropagation: () => {} })} className={styles.btnPrimary}>Editar Cadastro</button>
                <button type="button" onClick={() => setDividaDetalhada(null)} className={styles.btnCancel}>Fechar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {modalAberto && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>{idEditando ? 'Editar Contrato' : 'Novo Contrato'}</h3>
            <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.85rem' }}>Conta/Banco</span>
                  <select required value={formData.banco_id} onChange={(e) => setFormData({...formData, banco_id: e.target.value})}>
                    <option value="">Selecione...</option>
                    {bancos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.85rem' }}>Status</span>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="Ativa">Ativa</option>
                    <option value="Quitada">Quitada</option>
                    <option value="Atrasada">Atrasada</option>
                  </select>
                </label>
              </div>

              <input type="text" required placeholder="Credor" value={formData.credor} onChange={(e) => setFormData({...formData, credor: e.target.value})} />
              <input type="text" required placeholder="Tipo de Dívida" value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input type="number" step="0.01" required placeholder="Taxa Juros (% a.a.)" value={formData.taxa_juro} onChange={(e) => setFormData({...formData, taxa_juro: e.target.value})} />
                <input type="number" step="0.01" required placeholder="Prestação Mensal (R$)" value={formData.prestacao} onChange={(e) => setFormData({...formData, prestacao: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input type="number" step="0.01" required placeholder="Valor Total Contrato" value={formData.valor_total} onChange={(e) => setFormData({...formData, valor_total: e.target.value})} />
                <input type="number" step="0.01" required placeholder="Valor Amortizado" value={formData.valor_pago} onChange={(e) => setFormData({...formData, valor_pago: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <label><span style={{ fontSize: '0.8rem' }}>Contratação</span><input type="date" required value={formData.data_contraira} onChange={(e) => setFormData({...formData, data_contraira: e.target.value})} /></label>
                <label><span style={{ fontSize: '0.8rem' }}>Previsão Término</span><input type="date" value={formData.data_final} onChange={(e) => setFormData({...formData, data_final: e.target.value})} /></label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={fecharModal} className={styles.btnCancel}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary}>{idEditando ? 'Atualizar' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}