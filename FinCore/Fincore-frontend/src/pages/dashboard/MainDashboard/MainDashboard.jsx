// Fincore-frontend/src/pages/dashboard/MainDashboard/MainDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import api from '../../../services/api';

import styles from './MainDashboard.module.css';

export default function MainDashboard() {
  // --- HOOKS DE ROTEAMENTO ---
  const { banco } = useParams();

  // --- ESTADOS DE CONTROLE E DADOS ---
  const [loading, setLoading] = useState(true);
  const [transacoes, setTransacoes] = useState([]);
  const [investimentos, setInvestimentos] = useState([]);
  const [dividas, setDividas] = useState([]);

  // Requisição paralela das coleções de dados financeiros para mitigação de bloqueio de rede
  const carregarDadosDashboard = async () => {
    try {
      const [resTransacoes, resInvestimentos, resDividas] = await Promise.all([
        api.get('/transacoes'),
        api.get('/investimentos'),
        api.get('/dividas')
      ]);

      setTransacoes(resTransacoes.data);
      setInvestimentos(resInvestimentos.data);
      setDividas(resDividas.data);
    } catch (error) {
      console.error("Erro ao carregar os dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosDashboard();
  }, []);

  // --- FILTRAGEM DE CONTEXTO (ROTAS) ---
  
  // Derivação de escopo baseada no parâmetro de rota ativo
  const ehVisaoGeral = banco === 'overview' || !banco;

  const transacoesFiltradas = ehVisaoGeral
    ? transacoes
    : transacoes.filter(t => t.banco_id?.toString() === banco?.toString());

  const investimentosFiltrados = ehVisaoGeral
    ? investimentos
    : investimentos.filter(i => i.banco_id?.toString() === banco?.toString());

  const dividasFiltradas = ehVisaoGeral
    ? dividas
    : dividas.filter(d => d.banco_id?.toString() === banco?.toString());

  // --- COMPUTAÇÃO DE MÉTRICAS (KPIS) ---
  const entradas = transacoesFiltradas.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
  const saidas = transacoesFiltradas.filter(t => t.tipo === 'Saída').reduce((acc, t) => acc + t.valor, 0);
  const saldoConta = entradas - saidas;

  const totalInvestimentos = investimentosFiltrados.reduce((acc, i) => acc + (i.quantidade * i.preco_atual), 0);
  const totalDividas = dividasFiltradas.reduce((acc, d) => acc + (d.valor_total - d.valor_pago), 0);

  // --- MAPEAMENTO TEMPORAL PARA GRÁFICOS (RECHARTS) ---
  
  // Agrupamento de fluxo de caixa por janelas mensais e projeção de resultado
  const prepararDadosGrafico = (listaTransacoes) => {
    const agrupado = listaTransacoes.reduce((acc, t) => {
      if (!t.data) return acc;
      
      // Extração de formato ISO para chave de agrupamento (YYYY-MM)
      const mesAno = t.data.substring(0, 7);

      if (!acc[mesAno]) {
        acc[mesAno] = { name: mesAno, Entradas: 0, Saídas: 0, Resultado: 0 };
      }

      if (t.tipo === 'Entrada') {
        acc[mesAno].Entradas += t.valor;
      } else if (t.tipo === 'Saída') {
        acc[mesAno].Saídas += t.valor;
      }

      acc[mesAno].Resultado = acc[mesAno].Entradas - acc[mesAno].Saídas;
      return acc;
    }, {});

    // Conversão do mapa estrutural, ordenação cronológica ascendente e formatação de rótulos
    const mesesAbreviados = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    return Object.values(agrupado)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(item => {
        const [ano, mes] = item.name.split('-');
        return {
          ...item,
          name: `${mesesAbreviados[parseInt(mes) - 1]}/${ano.substring(2)}` 
        };
      });
  };

  const dadosGrafico = prepararDadosGrafico(transacoesFiltradas);

  const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Sobrescrita do componente nativo Tooltip para customização de interface
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#1A1A1E', border: '1px solid #2A2A2E', padding: '1rem', borderRadius: '8px' }}>
          <p style={{ color: '#8A8A93', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color, margin: '0.25rem 0' }}>
              {entry.name}: {formatarMoeda(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#00FF9D' }}>
        Calculando patrimônio...
      </div>
    );
  }

  return (
    <div className={styles.dashboardGrid}>
      
      <div className={styles.kpiCard}>
        <h3 className={styles.cardTitle}>Saldo em Conta</h3>
        <p className={styles.cardValue} style={{ color: saldoConta < 0 ? '#FF5A5A' : '#FFF' }}>
          {formatarMoeda(saldoConta)}
        </p>
      </div>
      
      <div className={styles.kpiCard}>
        <h3 className={styles.cardTitle}>Total de Investimentos</h3>
        <p className={styles.cardValue} style={{ color: '#00FF9D' }}>
          {formatarMoeda(totalInvestimentos)}
        </p>
      </div>
      
      <div className={styles.kpiCard}>
        <h3 className={styles.cardTitle}>Total de Dívidas (Restante)</h3>
        <p className={styles.cardValue} style={{ color: '#FF5A5A' }}>
          {formatarMoeda(totalDividas)}
        </p>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.cardTitle}>Histórico de Fluxo de Caixa</h3>
        </div>
        
        <div style={{ width: '100%', height: '350px' }}>
          {dadosGrafico.length === 0 ? (
            <div className={styles.chartPlaceholder}>
              <p style={{ margin: 0, opacity: 0.7 }}>Nenhum dado transacional para gerar o gráfico.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dadosGrafico}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#8A8A93" 
                  tick={{ fill: '#8A8A93' }} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#8A8A93" 
                  tick={{ fill: '#8A8A93' }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(valor) => `R$ ${valor}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                <Bar dataKey="Entradas" barSize={20} fill="#00FF9D" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saídas" barSize={20} fill="#FF5A5A" radius={[4, 4, 0, 0]} />
                
                <Line type="monotone" dataKey="Resultado" stroke="#4a90e2" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}