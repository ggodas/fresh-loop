import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar
} from "recharts";

// ─── CONSTANTES ───────────────────────────────────────────────
const PRICE = 16;
const LAV_COST = 2.12;
const SEC_COST = 1.95;

const INVEST = 39469;
const FIX_MES12 = 6015;
const FIX_MES13 = 2165;

const SEASONS_BASE = [
  'B','B','B','M','M','A','A','A','M','M','A','A',
  'A','B','B','B','M','M','A','A','A','M','M','A',
  'A','B','B','B','M','M','A','A','A','M','M','A'
];

const INV_ITEMS = [
  ['Entrada 3 Speed Queen Stacked', 23100, false],
  ['Instalação elétrica + hidráulica', 4000, true],
  ['Reforma (pintura + reparação parede)', 6000, true],
  ['Drywall nicho máquinas', 2000, true],
  ['Fachada (2 vitrines + 2 portas IoT)', 10400, true],
  ['A/C 24.000 BTU + instalação', 4400, false],
  ['Kit Intelbras 6 câmeras + DVR + HD', 3200, false],
  ['Box Payblu (controlador 3 máquinas)', 1799, false],
  ['Moderninha PagBank (12× R$ 24,90)', 299, false],
  ['Mobiliário (2 longarinas + mesa dobrar)', 2000, false],
  ['Sinalização + identidade visual', 5000, false],
  ['Prateleiras sala utilidades', 300, false],
  ['Galões iniciais Omo Pro + Confort Pro', 1440, false],
  ['Imprevistos (5%)', 5000, false],
];

const SCENARIO_META = {
  base: { label: 'Cenário base',   color: '#10B981', desc: 'Sazonalidade real de Peruíbe — alta em Dez–Fev, média em Mar/Jul/Out/Nov, baixa nos demais.' },
  ot:   { label: 'Otimista',       color: '#3B82F6', desc: 'Alta temporada o ano todo. Representa localização excelente e fidelização rápida.' },
  pe:   { label: 'Conservador',    color: '#F43F5E', desc: 'Baixa temporada o ano todo. Pior caso absoluto.' },
};

// ─── HELPERS ──────────────────────────────────────────────────
const brl = (v) => (v < 0 ? '– ' : '') + 'R$ ' + Math.abs(Math.round(v)).toLocaleString('pt-BR');
const brlS = (v) => (v >= 0 ? '+ ' : '– ') + 'R$ ' + Math.abs(Math.round(v)).toLocaleString('pt-BR');

function getUsos(s, sc) {
  if (sc === 'ot') return { lav: 13, sec: 11 };
  if (s === 'A')   return { lav: 10, sec: 8  };
  if (s === 'M')   return { lav: 6,  sec: 5  };
  return { lav: 3, sec: 5 };
}

function computeMonths(sc) {
  const seasons = sc === 'ot' ? Array(36).fill('A') : sc === 'pe' ? Array(36).fill('B') : SEASONS_BASE;
  let acum = -INVEST;
  return seasons.map((s, i) => {
    const m = i + 1;
    const { lav, sec } = getUsos(s, sc);
    const ul = lav * 3 * 30;
    const us = sec * 3 * 30;
    const rec = Math.round((ul + us) * PRICE / 2);
    const cv  = Math.round((ul * LAV_COST + us * SEC_COST) / 2);
    const fix = m <= 12 ? FIX_MES12 : FIX_MES13;
    const res = rec - cv - fix;
    const prev = acum;
    acum = Math.round(acum + res);
    return {
      m, s,
      sl: s === 'A' ? 'Alta' : s === 'M' ? 'Média' : 'Baixa',
      ul, us, rec, cv, fix,
      res: Math.round(res), acum,
      isBreakEven: prev < 0 && acum >= 0,
      isMilestone13: m === 13,
    };
  });
}

// ─── COMPONENTES BASE ─────────────────────────────────────────
const S = {
  app: { background: '#020817', minHeight: '100vh', color: '#E2E8F0', fontFamily: 'system-ui, sans-serif' },
  hdr: { background: '#020817', borderBottom: '1px solid #0F172A', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  nav: { background: '#020817', borderBottom: '1px solid #0F172A', padding: '6px 28px', display: 'flex', gap: 2, overflowX: 'auto' },
  body: { padding: '28px', maxWidth: 1200, margin: '0 auto' },
};

function MetricCard({ label, value, sub, color = '#10B981' }) {
  return (
    <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 600, color, fontFamily: 'monospace' }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: '#475569' }}>{sub}</span>}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 12, padding: '18px 20px', ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function VerToggle({ ver, onChange, ids }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {[
        { k: 'e', label: 'Versão enxuta',  color: '#10B981' },
        { k: 'i', label: 'Versão ideal',   color: '#3B82F6' },
      ].map(({ k, label, color }) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', border: `1.5px solid ${ver === k ? color : '#1E293B'}`,
            background: ver === k ? color + '20' : 'transparent',
            color: ver === k ? color : '#475569', transition: 'all .15s',
          }}
        >{label}</button>
      ))}
    </div>
  );
}

function LineItem({ label, value, valueColor = '#F43F5E', bold = false, note = '' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid #0F172A', fontSize: 13 }}>
      <span style={{ color: bold ? '#E2E8F0' : '#94A3B8', fontWeight: bold ? 600 : 400 }}>
        {label}{note && <span style={{ fontSize: 10, color: '#FBBF24', marginLeft: 4 }}>{note}</span>}
      </span>
      <span style={{ color: valueColor, fontFamily: 'monospace', fontSize: 12, fontWeight: bold ? 600 : 400 }}>{value}</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#020817', border: '1px solid #1E293B', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#94A3B8', marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: '#CBD5E1' }}>{p.name}:</span>
          <span style={{ color: p.value >= 0 ? '#10B981' : '#F43F5E', fontWeight: 600 }}>{brl(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

function FluxoTable({ data }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1E293B' }}>
            {['Mês','Período','Usos lav.','Usos sec.','Receita 50%','Custo var. 50%','Fixos 50%','Resultado','Acumulado'].map(h => (
              <th key={h} style={{ padding: '9px 10px', textAlign: ['Mês','Período'].includes(h) ? 'left' : 'right', color: '#475569', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.m} style={{ borderBottom: '1px solid #0F172A', background: row.isBreakEven ? 'rgba(16,185,129,0.1)' : row.isMilestone13 ? 'rgba(59,130,246,0.06)' : 'transparent' }}>
              <td style={{ padding: '7px 10px', color: '#64748B', fontWeight: 600 }}>{row.m}</td>
              <td style={{ padding: '7px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 600,
                    background: row.s === 'A' ? 'rgba(251,191,36,0.15)' : row.s === 'M' ? 'rgba(99,102,241,0.15)' : 'rgba(100,116,139,0.15)',
                    color: row.s === 'A' ? '#FCD34D' : row.s === 'M' ? '#818CF8' : '#94A3B8',
                  }}>{row.sl}</span>
                  {row.isMilestone13 && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(59,130,246,0.2)', color: '#60A5FA', fontWeight: 600 }}>sem parcelas</span>}
                  {row.isBreakEven  && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(16,185,129,0.25)', color: '#34D399', fontWeight: 600 }}>break even ✓</span>}
                </div>
              </td>
              <td style={{ padding: '7px 10px', textAlign: 'right', color: '#64748B', fontFamily: 'monospace', fontSize: 11 }}>{row.ul}</td>
              <td style={{ padding: '7px 10px', textAlign: 'right', color: '#64748B', fontFamily: 'monospace', fontSize: 11 }}>{row.us}</td>
              <td style={{ padding: '7px 10px', textAlign: 'right', color: '#10B981', fontFamily: 'monospace', fontSize: 11 }}>R$ {row.rec.toLocaleString('pt-BR')}</td>
              <td style={{ padding: '7px 10px', textAlign: 'right', color: '#F43F5E', fontFamily: 'monospace', fontSize: 11 }}>– R$ {row.cv.toLocaleString('pt-BR')}</td>
              <td style={{ padding: '7px 10px', textAlign: 'right', color: '#F43F5E', fontFamily: 'monospace', fontSize: 11 }}>– R$ {row.fix.toLocaleString('pt-BR')}</td>
              <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: row.res >= 0 ? '#10B981' : '#F43F5E' }}>{brlS(row.res)}</td>
              <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: row.acum >= 0 ? '#10B981' : '#94A3B8' }}>{brl(row.acum)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── SEÇÕES ───────────────────────────────────────────────────
function Overview() {
  const d = computeMonths('base');
  const be = d.find(r => r.isBreakEven)?.m ?? '—';
  const lm = Math.round(d.slice(12).reduce((s, r) => s + r.res, 0) / 24);
  const maxExp = Math.min(...d.map(r => r.acum));
  const negM = d.filter(r => r.res < 0).length;

  return (
    <div>
      <SectionTitle title="Resumo executivo" sub="Lavanderia self-service de marca própria — sem franquia, sem royalties, sistema IoT próprio." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 24 }}>
        <MetricCard label="Investimento por sócio"      value={brl(INVEST)}            sub="Desembolso inicial"           color="#F43F5E" />
        <MetricCard label="Parcela mensal (mês 1–12)"   value="R$ 3.851"               sub="Por sócio · 12 meses"         color="#FB923C" />
        <MetricCard label="Exposição máxima ano 1"      value={brl(maxExp)}            sub="Pior momento do caixa"        color="#FBBF24" />
        <MetricCard label="Meses resultado negativo"    value={`~${negM} meses`}       sub="Cenário base"                 color="#A78BFA" />
        <MetricCard label="Break even acumulado"        value={`~mês ${be}`}           sub="Cenário base"                 color="#10B981" />
        <MetricCard label="Lucro médio pós break even"  value={`R$ ${lm.toLocaleString('pt-BR')}`} sub="Por sócio / mês (mês 13+)" color="#10B981" />
        <MetricCard label="Lucro anual pós break even"  value={`R$ ${(lm*12).toLocaleString('pt-BR')}`} sub="Por sócio / ano"  color="#10B981" />
        <MetricCard label="ROI acumulado (36 meses)"    value="~197%"                  sub="Sobre capital investido"      color="#3B82F6" />
      </div>

      <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: '#BFDBFE', lineHeight: 1.75, margin: 0 }}>
          Fachada com 2 vitrines fixas + 2 portas de vidro com trava eletromagnética IoT (abertura e fechamento remoto), A/C 24.000 BTU e operação autônoma em horário estendido. Sistema IoT próprio (ESP32 + Azure IoT Hub) em desenvolvimento paralelo — migração do Vendpago planejada.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#94A3B8' }}>Diferenciais competitivos</h3>
          {[
            'Zero royalties — marca 100% própria',
            'Dados dos clientes 100% próprios',
            'Precificação dinâmica por temporada',
            'Bomba peristáltica inclusa nas máquinas (Vendpago)',
            'Box Payblu controla máquinas e dosador',
            'Sistema IoT próprio planejado (pós-MVP)',
            ver === 'i' ? 'Portas automáticas via IoT (abre/fecha remoto)' : 'Portas de ferro como segurança fallback',
            'Câmera Intelbras como prova documental',
            'Fachada de esquina — visibilidade dupla',
          ].map(d => (
            <div key={d} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B', fontSize: 13 }}>
              <span style={{ color: '#CBD5E1' }}>{d}</span>
              <span style={{ color: '#10B981', fontWeight: 600 }}>✓</span>
            </div>
          ))}
        </Card>
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#94A3B8' }}>Estrutura societária</h3>
          {[
            ['Sócios',               'George & Jane'],
            ['Divisão',              '50% / 50%'],
            ['Máquinas',             '3 Speed Queen Stacked'],
            ['Equipamentos',         '3 lavadoras + 3 secadoras'],
            ['Aluguel efetivo',      'R$ 3.000/mês (sem isenção)'],
            ['Parcelas (12 meses)',  'R$ 3.851/sócio/mês'],
            ['Sistema de pagamento', 'Vendpago (Payblu/PaySelf)'],
            ['Totem Payblu',         'R$ 329/mês permanente'],
            ['Custos fixos',         '50/50 sempre'],
            ['Custos variáveis',     'Proporcional aos ciclos'],
            ['Manutenção',           'Por proprietário da máquina'],
            ['Saída (cláusula)',      '90 dias · NC 12 meses · 2km'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #1E293B', fontSize: 13 }}>
              <span style={{ color: '#64748B' }}>{k}</span>
              <span style={{ color: '#CBD5E1', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function Investimento() {
  const items = INV_ITEMS;
  const sub = items.reduce((s, [, v]) => s + v, 0);
  const total = sub + 10000;
  const mid = Math.ceil(items.length / 2);
  const col1 = items.slice(0, mid);
  const col2 = items.slice(mid);

  return (
    <div>
      <SectionTitle title="Investimento inicial" sub="Todo o capital dividido 50/50. Nenhum sócio tem isenção ou vantagem sobre o outro." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#94A3B8' }}>Itens — parte 1</h3>
          {col1.map(([label, val, est]) => (
            <LineItem key={label} label={label} value={`R$ ${val.toLocaleString('pt-BR')}`} note={est ? '*' : ''} />
          ))}
        </Card>
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#94A3B8' }}>Itens — parte 2</h3>
          {col2.map(([label, val, est]) => (
            <LineItem key={label} label={label} value={`R$ ${val.toLocaleString('pt-BR')}`} note={est ? '*' : ''} />
          ))}
          <div style={{ marginTop: 14, padding: 14, background: '#020817', borderRadius: 8, border: '1px solid #1E293B' }}>
            {[
              ['Total desembolso inicial', sub],
              ['Capital de giro', 10000],
              ['Total operação', total],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                <span style={{ color: '#94A3B8' }}>{l}</span>
                <span style={{ color: '#F43F5E', fontFamily: 'monospace', fontSize: 12 }}>R$ {v.toLocaleString('pt-BR')}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #1E293B', marginTop: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>Por sócio (50%)</span>
              <span style={{ fontSize: 20, fontWeight: 600, color: '#F43F5E', fontFamily: 'monospace' }}>R$ {Math.round(total / 2).toLocaleString('pt-BR')}</span>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#475569', marginTop: 10, lineHeight: 1.6 }}>
            + R$ 3.851/mês por sócio durante 12 meses (parcelas das 3 máquinas).<br />
            Exposição máxima total ano 1: <strong style={{ color: '#FBBF24' }}>~R$ {(Math.round(total / 2) + 3851 * 3).toLocaleString('pt-BR')} por sócio</strong>.
          </p>
        </Card>
      </div>
      <div style={{ background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 10, padding: '14px 18px' }}>
        <p style={{ fontSize: 13, color: '#FED7AA', lineHeight: 1.75, margin: 0 }}>
          <strong>* Estimativas sem orçamento formal:</strong> instalação elétrica/hidráulica, reforma, drywall e fachada. Recomenda-se obter pelo menos 1 orçamento real de cada antes de assinar o contrato de locação.
        </p>
      </div>
    </div>
  );
}

function Custos() {
  const barData = [
    { periodo: 'Baixa',    lav: 3*3*30,  sec: 5*3*30  },
    { periodo: 'Média',    lav: 6*3*30,  sec: 5*3*30  },
    { periodo: 'Alta',     lav: 10*3*30, sec: 8*3*30  },
    { periodo: 'Otimista', lav: 13*3*30, sec: 11*3*30 },
  ].map(({ periodo, lav, sec }) => ({
    periodo,
    receita: Math.round((lav + sec) * PRICE),
    margem: Math.round((lav + sec) * PRICE - (lav * LAV_COST + sec * SEC_COST)),
  }));

  return (
    <div>
      <SectionTitle title="Custos operacionais" sub="Custo por uso — metodologia Autax adaptada para tarifa B3 Neoenergia Elektro (~R$ 0,85/kWh)." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#10B981' }}>Custo por uso — lavagem</h3>
          <LineItem label="Energia (0,6 kWh × R$ 0,85)"         value="R$ 0,51" />
          <LineItem label="Água (80L × R$ 7,50/m³)"             value="R$ 0,60" />
          <LineItem label="Omo Pro (16 ml × R$ 0,036/ml)"       value="R$ 0,58" />
          <LineItem label="Confort Pro (12 ml × R$ 0,036/ml)"   value="R$ 0,43" />
          <LineItem label="Total custo/uso" value="R$ 2,12" bold />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 14 }}>
            <span style={{ color: '#E2E8F0', fontWeight: 600 }}>Margem bruta</span>
            <span style={{ color: '#10B981', fontFamily: 'monospace', fontWeight: 600, fontSize: 20 }}>R$ 13,88</span>
          </div>
        </Card>
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#3B82F6' }}>Custo por uso — secagem</h3>
          <LineItem label="Energia (2,3 kWh × R$ 0,85)"  value="R$ 1,95" />
          <LineItem label="Água"                          value="R$ 0,00" valueColor="#334155" />
          <LineItem label="Detergente"                    value="R$ 0,00" valueColor="#334155" />
          <LineItem label="Amaciante"                     value="R$ 0,00" valueColor="#334155" />
          <LineItem label="Total custo/uso" value="R$ 1,95" bold />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 14 }}>
            <span style={{ color: '#E2E8F0', fontWeight: 600 }}>Margem bruta</span>
            <span style={{ color: '#10B981', fontFamily: 'monospace', fontWeight: 600, fontSize: 20 }}>R$ 14,05</span>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#94A3B8' }}>Insumos — referência de preço</h3>
          {[
            { produto: 'Omo Pro Lavanderia 20L', preco: 'R$ 720,00', dose: '16 ml/uso (2 ml/kg × 8 kg)', rend: '1.250 usos/galão', custo: 'R$ 0,58/uso' },
            { produto: 'Confort Pro 20L',        preco: 'R$ 720,00', dose: '12 ml/uso (1,5 ml/kg × 8 kg)', rend: '1.667 usos/galão', custo: 'R$ 0,43/uso' },
          ].map(p => (
            <div key={p.produto} style={{ background: '#020817', borderRadius: 8, padding: 12, border: '1px solid #1E293B', marginBottom: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', marginBottom: 8 }}>{p.produto}</p>
              {[['Preço galão', p.preco], ['Dose/uso', p.dose], ['Rendimento', p.rend], ['Custo/uso', p.custo]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid #0F172A' }}>
                  <span style={{ color: '#64748B' }}>{k}</span>
                  <span style={{ color: '#94A3B8' }}>{v}</span>
                </div>
              ))}
            </div>
          ))}
        </Card>
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#94A3B8' }}>Receita e margem por período</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="periodo" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#1E293B' }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#1E293B' }} tickFormatter={v => 'R$' + (v / 1000).toFixed(0) + 'k'} />
              <Tooltip formatter={(v, n) => [brl(v), n === 'receita' ? 'Receita bruta' : 'Margem bruta']} contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="receita" name="receita" fill="#1E40AF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="margem"  name="margem"  fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94A3B8' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#1E40AF', display: 'inline-block' }} />Receita bruta</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94A3B8' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#10B981', display: 'inline-block' }} />Margem bruta</span>
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: '#94A3B8' }}>Custos fixos mensais — ambas as versões</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E293B' }}>
              {['Item', 'Descrição', 'Total', 'Por sócio (50%)', 'Período'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Item' || h === 'Descrição' ? 'left' : 'right', color: '#475569', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Aluguel',                   'Imóvel comercial Loja 5, sem isenção para nenhum sócio',                                        3000, 1500,  'Permanente', false],
              ['Parcelas 3 máquinas',        '3 financiamentos individuais (cada sócio assina o seu)',                                        7701, 3851,  'Meses 1–12', true],
              ['Totem Payblu',              'POS físico onde o cliente realiza o pagamento — mensalidade do sistema Vendpago',                329,  165,   'Permanente', false],
              ['Internet + sistema',        'Conectividade + infraestrutura do sistema IoT e monitoramento',                                  300,  150,   'Permanente', false],
              ['Seguro',                    'Seguro patrimonial do negócio',                                                                  300,  150,   'Permanente', false],
              ['Insumos limpeza/manutenção','Tablets de limpeza a cada 30 ciclos + higienização semanal. Valor superestimado deliberadamente', 200,  100,   'Permanente', false],
            ].map(([item, desc, tot, soc, per, highlight]) => (
              <tr key={item} style={{ borderBottom: '1px solid #0F172A', background: highlight ? 'rgba(251,191,36,0.05)' : 'transparent' }}>
                <td style={{ padding: '8px 10px', color: '#E2E8F0', fontWeight: 500, whiteSpace: 'nowrap' }}>{item}</td>
                <td style={{ padding: '8px 10px', color: '#64748B', fontSize: 12, maxWidth: 320 }}>{desc}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#F43F5E', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>R$ {tot.toLocaleString('pt-BR')}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#F43F5E', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>R$ {soc.toLocaleString('pt-BR')}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, whiteSpace: 'nowrap', color: per === 'Permanente' ? '#64748B' : '#FBBF24' }}>{per}</td>
              </tr>
            ))}
            <tr style={{ background: '#020817', borderTop: '1px solid #1E293B' }}>
              <td style={{ padding: '9px 10px', fontWeight: 600, color: '#E2E8F0' }}>Total meses 1–12</td>
              <td />
              <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 600, color: '#F43F5E', fontFamily: 'monospace' }}>R$ 12.030</td>
              <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 600, color: '#F43F5E', fontFamily: 'monospace' }}>R$ 6.015</td>
              <td />
            </tr>
            <tr style={{ background: 'rgba(16,185,129,0.08)', borderTop: '1px solid rgba(16,185,129,0.2)' }}>
              <td style={{ padding: '9px 10px', fontWeight: 600, color: '#10B981' }}>Total mês 13+ ★</td>
              <td style={{ padding: '9px 10px', fontSize: 12, color: '#10B981' }}>Parcelas quitadas — fixos caem 64%</td>
              <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 600, color: '#10B981', fontFamily: 'monospace' }}>R$ 4.329</td>
              <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 600, color: '#10B981', fontFamily: 'monospace' }}>R$ 2.165</td>
              <td />
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: 12, color: '#475569', marginTop: 10, lineHeight: 1.6 }}>
          ★ A queda de R$ 6.015 → R$ 2.165/sócio nos fixos mensais é a principal virada do negócio. Break even operacional meses 1–12: ~419 usos/mês = 2,3 usos/equipamento/dia.
        </p>
      </Card>
    </div>
  );
}

function Sazonalidade() {
  return (
    <div>
      <SectionTitle title="Sazonalidade — Peruíbe/SP" sub="6 equipamentos independentes: 3 lavadoras + 3 secadoras. Usos/dia por equipamento individual." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { periodo: 'Alta temporada',  meses: 'Dez, Jan, Fev',          lav: 10, sec: 8, cor: '#FCD34D', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)'  },
          { periodo: 'Média temporada', meses: 'Mar, Jul, Out, Nov',      lav: 6,  sec: 5, cor: '#818CF8', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.25)'  },
          { periodo: 'Baixa temporada', meses: 'Abr–Jun, Ago–Set',        lav: 3,  sec: 5, cor: '#94A3B8', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.25)' },
        ].map(({ periodo, meses, lav, sec, cor, bg, border }) => {
          const ul = lav * 3 * 30, us = sec * 3 * 30;
          const recBruta = (ul + us) * PRICE;
          const margem   = recBruta - (ul * LAV_COST + us * SEC_COST);
          return (
            <div key={periodo} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: 18 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: cor, marginBottom: 4 }}>{periodo}</p>
              <p style={{ fontSize: 11, color: '#64748B', marginBottom: 14 }}>{meses}</p>
              {[
                ['Lavadoras (usos/dia/equip.)',  lav + ' lavagens'],
                ['Secadoras (usos/dia/equip.)',  sec + ' secagens'],
                ['Total usos/mês (6 equip.)',    (ul + us).toLocaleString('pt-BR')],
                ['Receita bruta',                brl(recBruta)],
                ['Margem bruta total',           brl(margem)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#64748B' }}>{k}</span>
                  <span style={{ color: '#E2E8F0', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#BFDBFE', lineHeight: 1.75, margin: 0 }}>
          <strong>Nota sobre o padrão de uso:</strong> Na baixa temporada (inverno/chuva), a secadora tende a uso igual ou superior à lavadora — moradores trazem roupas lavadas de casa para secar. Na alta (verão/turismo), a lavadora domina. Os números acima são estimativas iniciais — os primeiros 2–3 meses de operação real calibrarão o modelo.
        </p>
      </div>
      <Card>
        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: '#94A3B8' }}>Detalhamento por temporada — 3 cenários de usos</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E293B' }}>
              {['Período','Meses','Lav/dia/equip','Sec/dia/equip','Usos lav/mês','Usos sec/mês','Total usos','Receita bruta','Margem bruta'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: ['Período','Meses'].includes(h) ? 'left' : 'right', color: '#475569', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { p: 'Alta',     m: 'Dez–Fev',        lav: 10, sec: 8,  cor: '#FCD34D' },
              { p: 'Média',    m: 'Mar/Jul/Out/Nov', lav: 6,  sec: 5,  cor: '#818CF8' },
              { p: 'Baixa',    m: 'Abr–Jun/Ago–Set', lav: 3,  sec: 5, cor: '#94A3B8' },
              { p: 'Otimista', m: 'Cenário ideal',   lav: 13, sec: 11, cor: '#3B82F6' },
            ].map(({ p, m, lav, sec, cor }) => {
              const ul = lav*3*30, us = sec*3*30;
              return (
                <tr key={p} style={{ borderBottom: '1px solid #0F172A' }}>
                  <td style={{ padding: '8px 10px', color: cor, fontWeight: 600 }}>{p}</td>
                  <td style={{ padding: '8px 10px', color: '#64748B', fontSize: 12 }}>{m}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94A3B8', fontFamily: 'monospace', fontSize: 12 }}>{lav}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94A3B8', fontFamily: 'monospace', fontSize: 12 }}>{sec}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B', fontFamily: 'monospace', fontSize: 12 }}>{ul.toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B', fontFamily: 'monospace', fontSize: 12 }}>{us.toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#E2E8F0', fontFamily: 'monospace', fontSize: 12, fontWeight: 500 }}>{(ul+us).toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10B981', fontFamily: 'monospace', fontSize: 12 }}>{brl((ul+us)*PRICE)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10B981', fontFamily: 'monospace', fontSize: 12, fontWeight: 500 }}>{brl((ul+us)*PRICE - (ul*LAV_COST+us*SEC_COST))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Fluxo() {
  const [sc, setSc] = useState('base');
  const data = computeMonths(sc);
  const be = data.find(r => r.isBreakEven)?.m ?? '—';
  const maxExp = Math.min(...data.map(r => r.acum));
  const lm = Math.round(data.slice(12).reduce((s, r) => s + r.res, 0) / 24);

  return (
    <div>
      <SectionTitle title="Fluxo de caixa mensal" sub="Valores por sócio (50%). Caixa acumulado parte do investimento inicial negativo." />
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {Object.entries(SCENARIO_META).map(([key, meta]) => (
          <button key={key} onClick={() => setSc(key)} style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: `1.5px solid ${sc === key ? meta.color : '#1E293B'}`,
            background: sc === key ? meta.color + '20' : 'transparent',
            color: sc === key ? meta.color : '#475569', transition: 'all .15s',
          }}>{meta.label}</button>
        ))}
      </div>
      <div style={{ background: '#0F172A', borderRadius: 8, padding: '10px 16px', marginBottom: 18, fontSize: 13, color: '#94A3B8', border: '1px solid #1E293B' }}>
        {SCENARIO_META[sc].desc}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <MetricCard label="Break even acumulado"    value={`~mês ${be}`}                                     sub="Recuperação do investimento"      color={SCENARIO_META[sc].color} />
        <MetricCard label="Exposição máxima"        value={brl(maxExp)}                                      sub="Pior momento do caixa"            color="#F43F5E" />
        <MetricCard label="Lucro médio pós mês 12"  value={`R$ ${lm.toLocaleString('pt-BR')}`}              sub="Por sócio / mês (média 24 meses)"  color={SCENARIO_META[sc].color} />
      </div>
      <Card>
        <FluxoTable data={data} />
      </Card>
    </div>
  );
}

function Projecao() {
  const data = computeMonths('base');
  const be = data.find(r => r.isBreakEven)?.m ?? '—';
  const lm = Math.round(data.slice(12).reduce((s, r) => s + r.res, 0) / 24);

  return (
    <div>
      <SectionTitle title="Projeção de lucro" sub="A partir do mês 13, parcelas acabam e o negócio entra em regime de cruzeiro." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 24 }}>
        <MetricCard label="Lucro médio mensal (mês 13+)"   value={`R$ ${lm.toLocaleString('pt-BR')}`}  sub="Por sócio · cenário base"    color="#10B981" />
        <MetricCard label="Lucro anual médio"               value={`R$ ${(lm*12).toLocaleString('pt-BR')}`} sub="Por sócio · pós break even" color="#10B981" />
        <MetricCard label="Break even acumulado (base)"     value={`~mês ${be}`}                        sub="Recuperação do capital"      color="#A78BFA" />
        <MetricCard label="ROI acumulado (36 meses)"        value="~197%"                               sub="Sobre capital investido"     color="#3B82F6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: '#94A3B8' }}>Resultado médio mensal — mês 13+</h3>
          <LineItem label="Receita média ponderada (50%)"  value="+ R$ 8.722"  valueColor="#10B981" />
          <LineItem label="Custo variável médio (50%)"     value="– R$ 1.493"  valueColor="#F43F5E" />
          <LineItem label="Fixos sem parcelas (50%)"       value="– R$ 2.165"  valueColor="#F43F5E" />
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #1E293B', marginTop: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>Lucro líquido médio</span>
            <span style={{ fontSize: 20, fontWeight: 600, color: '#10B981', fontFamily: 'monospace' }}>R$ {lm.toLocaleString('pt-BR')}/mês</span>
          </div>
        </Card>
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: '#94A3B8' }}>Comparativo por cenário (mês 13+)</h3>
          {Object.entries(SCENARIO_META).map(([key, meta]) => {
            const d = computeMonths(key);
            const bbe = d.find(r => r.isBreakEven)?.m ?? '—';
            const llm = Math.round(d.slice(12).reduce((s, r) => s + r.res, 0) / 24);
            return (
              <div key={key} style={{ padding: '10px 0', borderBottom: '1px solid #1E293B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: meta.color }}>{meta.label}</span>
                  <span style={{ fontSize: 11, color: '#64748B' }}>BE: mês {bbe}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Lucro médio mensal</span>
                  <span style={{ color: '#10B981', fontFamily: 'monospace', fontWeight: 500 }}>R$ {llm.toLocaleString('pt-BR')}/mês</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Lucro anual projetado</span>
                  <span style={{ color: '#10B981', fontFamily: 'monospace', fontWeight: 500 }}>R$ {(llm * 12).toLocaleString('pt-BR')}/ano</span>
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: '#94A3B8' }}>Resultado por período — mês 13+ por sócio</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E293B' }}>
              {['Período','Usos/mês','Receita 50%','Custo var. 50%','Fixos 50%','Lucro líquido'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Período' ? 'left' : 'right', color: '#475569', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { p: 'Alta',  lav: 10, sec: 8,  cor: '#FCD34D' },
              { p: 'Média', lav: 6,  sec: 5,  cor: '#818CF8' },
              { p: 'Baixa', lav: 3,  sec: 5,  cor: '#94A3B8' },
            ].map(({ p, lav, sec, cor }) => {
              const ul = lav*3*30, us = sec*3*30;
              const rec = Math.round((ul+us)*PRICE/2);
              const cv  = Math.round((ul*LAV_COST+us*SEC_COST)/2);
              const fix = FIX_MES13;
              const luc = rec - cv - fix;
              return (
                <tr key={p} style={{ borderBottom: '1px solid #0F172A' }}>
                  <td style={{ padding: '8px 10px', color: cor, fontWeight: 600 }}>{p}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B', fontFamily: 'monospace', fontSize: 12 }}>{(ul+us).toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10B981', fontFamily: 'monospace', fontSize: 12 }}>{brl(rec)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#F43F5E', fontFamily: 'monospace', fontSize: 12 }}>– R$ {cv.toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#F43F5E', fontFamily: 'monospace', fontSize: 12 }}>– R$ {fix.toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: luc >= 0 ? '#10B981' : '#F43F5E' }}>{brlS(luc)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p style={{ fontSize: 12, color: '#475569', marginTop: 10, lineHeight: 1.6 }}>
          Mesmo a baixa temporada gera lucro positivo a partir do mês 13. Essa é a virada estrutural do negócio.
        </p>
      </Card>
    </div>
  );
}

function Grafico() {
  const chartData = computeMonths('base').map((b, i) => ({
    name: `M${b.m}`,
    base: b.acum,
    ot:   computeMonths('ot')[i].acum,
    pe:   computeMonths('pe')[i].acum,
  }));
  chartData.unshift({ name: 'Aber', base: -INVEST, ot: -INVEST, pe: -INVEST });

  return (
    <div>
      <SectionTitle title="Evolução do caixa acumulado" sub="Por sócio ao longo de 36 meses. Linha zero = break even acumulado (recuperação do investimento)." />
      <div style={{ display: 'flex', gap: 18, marginBottom: 14, flexWrap: 'wrap' }}>
        {[['Base','#10B981',''], ['Otimista','#3B82F6','6 3'], ['Conservador','#F43F5E','3 3']].map(([l, c, d]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
            <span style={{ width: 22, height: 3, background: c, borderRadius: 2, display: 'inline-block' }} />
            <span style={{ color: '#94A3B8' }}>{l}</span>
          </div>
        ))}
      </div>
      <Card style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#1E293B' }} interval={2} />
            <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#1E293B' }} tickFormatter={v => (v < 0 ? '–' : '') + 'R$' + Math.abs(v / 1000).toFixed(0) + 'k'} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" label={{ value: 'Break even', fill: '#475569', fontSize: 11, position: 'insideRight' }} />
            <Line type="monotone" dataKey="ot"   name="Otimista"    stroke="#3B82F6" strokeWidth={2}   dot={false} strokeDasharray="6 3" />
            <Line type="monotone" dataKey="base" name="Base"        stroke="#10B981" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="pe"   name="Conservador" stroke="#F43F5E" strokeWidth={2}   dot={false} strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {Object.entries(SCENARIO_META).map(([key, meta]) => {
          const d = computeMonths(key);
          const be = d.find(r => r.isBreakEven)?.m ?? '—';
          const lm = Math.round(d.slice(12).reduce((s, r) => s + r.res, 0) / 24);
          const minAcum = Math.min(...d.map(r => r.acum));
          return (
            <div key={key} style={{ background: '#0F172A', border: `1px solid ${meta.color}30`, borderRadius: 10, padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: meta.color, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{meta.label}</p>
              {[
                ['Break even',             `Mês ${be}`],
                ['Exposição máxima',        brl(minAcum)],
                ['Lucro médio pós mês 12', `R$ ${lm.toLocaleString('pt-BR')}/mês`],
                ['Lucro anual projetado',   `R$ ${(lm*12).toLocaleString('pt-BR')}/ano`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #1E293B' }}>
                  <span style={{ color: '#64748B' }}>{k}</span>
                  <span style={{ color: '#E2E8F0', fontFamily: 'monospace', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Riscos() {
  const riscos = [
    { r: 'Concorrência local estabelecida',
      p: 'Média', c: '#FBBF24',
      m: 'Existem 2 concorrentes no mesmo quarteirão e aproximadamente 7 lavanderias na cidade. Mitigação: localização de esquina com duas frentes garante maior visibilidade e fluxo de pedestres. Diferenciais adicionais: sistema de pagamento moderno, identidade visual própria e precificação dinâmica por temporada.' },
    { r: 'Baixa adesão nos primeiros meses',
      p: 'Média', c: '#FBBF24',
      m: 'Capital de giro incluso no plano cobre o período de déficit inicial. Break even operacional é baixo (2,3 usos/equipamento/dia). Ramp-up esperado de 2–3 meses até o público local incorporar o hábito.' },
    { r: 'Manutenção inesperada de máquina',
      p: 'Média', c: '#FBBF24',
      m: 'Speed Queen: vida útil de 10–15 anos em uso comercial intensivo. Peças disponíveis no Brasil via Alliance Laundry Systems. Qualquer custo de manutenção é compartilhado entre os sócios — impacta os dois.' },
    { r: 'Aumento da tarifa de energia elétrica',
      p: 'Baixa', c: '#10B981',
      m: 'Totalmente repassável via ajuste de preço — sem franquia para restringir. Margem bruta de R$ 13,97/uso absorve aumentos moderados antes de precisar reajustar o valor cobrado.' },
    { r: 'Dano em roupas de cliente (CDC Art. 14)',
      p: 'Baixa', c: '#10B981',
      m: 'Câmeras Intelbras documentam o estado das roupas antes e depois. Dosador peristáltico bypassa o dispenser — elimina o principal vetor de mancha por resíduo. Ciclo quente não oferecido no MVP.' },
    { r: 'Falha no sistema Vendpago',
      p: 'Baixa', c: '#10B981',
      m: 'Sistema interim com plano de migração definido. IoT próprio (ESP32 + Azure IoT Hub) já arquitetado. Especificação elétrica do Start Pulse é item crítico a ser confirmado antes de assinar contrato.' },
  ];

  return (
    <div>
      <SectionTitle title="Análise de risco" sub="Mapeamento dos principais riscos operacionais e suas mitigações." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {riscos.map(({ r, p, c, m }) => (
          <Card key={r} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ minWidth: 72, textAlign: 'center', paddingTop: 2 }}>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: c + '20', color: c, fontWeight: 600, whiteSpace: 'nowrap' }}>{p}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', marginBottom: 5 }}>{r}</p>
              <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7, margin: 0 }}>{m}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'overview',     label: 'Visão geral'      },
  { id: 'investimento', label: 'Investimento'      },
  { id: 'custos',       label: 'Custos'            },
  { id: 'sazonalidade', label: 'Sazonalidade'      },
  { id: 'fluxo',        label: 'Fluxo de caixa'   },
  { id: 'projecao',     label: 'Projeção de lucro' },
  { id: 'grafico',      label: 'Gráfico'           },
  { id: 'riscos',       label: 'Riscos'            },
];

export default function App() {
  const [section, setSection] = useState('overview');

  return (
    <div style={S.app}>
      <div style={S.hdr}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: '#10B981', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>⚡</div>
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>WashUp</span>
            <span style={{ fontSize: 11, padding: '2px 8px', background: '#0F172A', border: '1px solid #1E293B', borderRadius: 20, color: '#64748B' }}>Plano de Negócio · 2026</span>
          </div>
          <p style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>Peruíbe/SP · George Krajan Godas &amp; Jane · 50% / 50% · Confidencial</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(16,185,129,0.1)', color: '#10B981', borderRadius: 6, border: '1px solid rgba(16,185,129,0.2)' }}>3 Speed Queen Stacked</span>
            <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(59,130,246,0.1)', color: '#60A5FA', borderRadius: 6, border: '1px solid rgba(59,130,246,0.2)' }}>6 equipamentos independentes</span>
          </div>
        </div>
      </div>

      <div style={S.nav}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
            background: section === s.id ? '#10B981' : 'transparent',
            color: section === s.id ? '#fff' : '#64748B',
            transition: 'all .15s',
          }}>{s.label}</button>
        ))}
      </div>

      <div style={S.body}>
        {section === 'overview'     && <Overview />}
        {section === 'investimento' && <Investimento />}
        {section === 'custos'       && <Custos />}
        {section === 'sazonalidade' && <Sazonalidade />}
        {section === 'fluxo'        && <Fluxo />}
        {section === 'projecao'     && <Projecao />}
        {section === 'grafico'      && <Grafico />}
        {section === 'riscos'       && <Riscos />}
      </div>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { background: #020817; }`}</style>
    </div>
  );
}
