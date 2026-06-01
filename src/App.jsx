import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Legend } from "recharts";

// ─── CONSTANTES ───────────────────────────────────────────────
const INVEST = 42059;
const PRICE = 16;
const LAV_COST = 2.12;
const SEC_COST = 1.95;
const PARCELA_TOTAL = 7701;

// Sazonalidade base: B=Baixa M=Média A=Alta (meses 1–36, partindo de Abr/ano1)
// Peruíbe: Alta=Dez-Fev | Média=Mar,Jul,Out,Nov | Baixa=Abr-Jun,Ago-Set
const SEASONS_BASE = [
  'B','B','B','M','M','A','A','A','M','M','A','A',  // meses 1-12
  'A','B','B','B','M','M','A','A','A','M','M','A',  // meses 13-24
  'A','B','B','B','M','M','A','A','A','M','M','A'   // meses 25-36
];
const SEASONS_OT  = Array(36).fill('A');
const SEASONS_PE  = Array(36).fill('B');

// usos/dia/equipamento por temporada (3 lavadoras + 3 secadoras = 6 equip)
const USOS = {
  A:  { lav: 10, sec: 8 },
  M:  { lav: 6,  sec: 5 },
  B:  { lav: 3,  sec: 5 },
  OT: { lav: 13, sec: 11 },
};

function getUsos(season, isOt) {
  if (isOt) return USOS.OT;
  return USOS[season] || USOS.B;
}

function computeMonths(scenario) {
  const seasons = scenario === 'ot' ? SEASONS_OT : scenario === 'pe' ? SEASONS_PE : SEASONS_BASE;
  const isOt = scenario === 'ot';
  let acum = -INVEST;
  return seasons.map((s, i) => {
    const m = i + 1;
    const { lav, sec } = getUsos(s, isOt);
    const usosLav = lav * 3 * 30;   // 3 lavadoras × 30 dias
    const usosSec = sec * 3 * 30;   // 3 secadoras × 30 dias
    const totalUsos = usosLav + usosSec;
    const rec50    = Math.round((totalUsos * PRICE) / 2);
    const cv50     = Math.round((usosLav * LAV_COST + usosSec * SEC_COST) / 2);
    const fix50    = m <= 12 ? Math.round((PARCELA_TOTAL + 4000) / 2) : 2000;
    const result   = rec50 - cv50 - fix50;
    const prevAcum = acum;
    acum = Math.round(acum + result);
    return {
      m, season: s,
      seasonLabel: s === 'A' ? 'Alta' : s === 'M' ? 'Média' : 'Baixa',
      usosLav, usosSec, totalUsos,
      rec50, cv50, fix50,
      result: Math.round(result),
      acum,
      isBreakEven:  prevAcum < 0 && acum >= 0,
      isMilestone13: m === 13,
    };
  });
}

// ─── HELPERS ──────────────────────────────────────────────────
const brl = (v, sign = false) => {
  const abs = Math.abs(Math.round(v)).toLocaleString('pt-BR');
  const prefix = sign ? (v >= 0 ? '+ ' : '– ') : (v < 0 ? '– ' : '');
  return `${prefix}R$ ${abs}`;
};

const SCENARIO_META = {
  base: { label: 'Cenário base',   color: '#10B981', desc: 'Sazonalidade real de Peruíbe — alta em Dez–Fev, média em Mar/Jul/Out/Nov, baixa nos demais.' },
  ot:   { label: 'Otimista',       color: '#3B82F6', desc: 'Alta temporada o ano todo (+30% de usos). Representa localização excelente e fidelização rápida.' },
  pe:   { label: 'Conservador',    color: '#F43F5E', desc: 'Baixa temporada o ano todo. Pior caso absoluto — não espera turismo nem sazonalidade positiva.' },
};

// ─── COMPONENTES ──────────────────────────────────────────────
function MetricCard({ label, value, sub, color = '#10B981' }) {
  return (
    <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: '#475569' }}>{sub}</span>}
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 12, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function LineItem({ label, value, valueColor = '#F43F5E', bold = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid #0F172A', fontSize: 13 }}>
      <span style={{ color: bold ? '#E2E8F0' : '#94A3B8', fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ color: valueColor, fontFamily: 'monospace', fontSize: 12, fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#020817', border: '1px solid #1E293B', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#94A3B8', marginBottom: 6, fontWeight: 700 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: '#CBD5E1' }}>{p.name}:</span>
          <span style={{ color: p.value >= 0 ? '#10B981' : '#F43F5E', fontWeight: 700 }}>
            {brl(p.value)}
          </span>
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
            {['Mês', 'Período', 'Usos lav.', 'Usos sec.', 'Receita 50%', 'Custo var. 50%', 'Fixos 50%', 'Resultado', 'Acumulado'].map(h => (
              <th key={h} style={{ padding: '9px 10px', textAlign: h === 'Mês' || h === 'Período' ? 'left' : 'right', color: '#475569', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr
              key={row.m}
              style={{
                borderBottom: '1px solid #0F172A',
                background: row.isBreakEven ? 'rgba(16,185,129,0.1)' : row.isMilestone13 ? 'rgba(59,130,246,0.06)' : 'transparent',
              }}
            >
              <td style={{ padding: '8px 10px', color: '#64748B', fontWeight: 700, fontSize: 12 }}>{row.m}</td>
              <td style={{ padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 700,
                    background: row.season === 'A' ? 'rgba(251,191,36,0.15)' : row.season === 'M' ? 'rgba(99,102,241,0.15)' : 'rgba(100,116,139,0.15)',
                    color: row.season === 'A' ? '#FCD34D' : row.season === 'M' ? '#818CF8' : '#94A3B8',
                  }}>{row.seasonLabel}</span>
                  {row.isMilestone13  && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(59,130,246,0.2)', color: '#60A5FA', fontWeight: 700 }}>sem parcelas</span>}
                  {row.isBreakEven   && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(16,185,129,0.25)', color: '#34D399', fontWeight: 700 }}>break even ✓</span>}
                </div>
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B', fontFamily: 'monospace', fontSize: 11 }}>{row.usosLav}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B', fontFamily: 'monospace', fontSize: 11 }}>{row.usosSec}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10B981', fontFamily: 'monospace', fontSize: 11 }}>R$ {row.rec50.toLocaleString('pt-BR')}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#F43F5E', fontFamily: 'monospace', fontSize: 11 }}>– R$ {row.cv50.toLocaleString('pt-BR')}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#F43F5E', fontFamily: 'monospace', fontSize: 11 }}>– R$ {row.fix50.toLocaleString('pt-BR')}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: row.result >= 0 ? '#10B981' : '#F43F5E' }}>
                {brl(row.result, true)}
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: row.acum >= 0 ? '#10B981' : '#94A3B8' }}>
                {brl(row.acum)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────
export default function App() {
  const [section, setSection]   = useState('overview');
  const [scenario, setScenario] = useState('base');

  const dataBase = computeMonths('base');
  const dataOt   = computeMonths('ot');
  const dataPe   = computeMonths('pe');
  const currentData = scenario === 'base' ? dataBase : scenario === 'ot' ? dataOt : dataPe;

  const beMonth = currentData.find(r => r.isBreakEven)?.m ?? '—';
  const maxExposure = Math.min(...currentData.map(r => r.acum));
  const lucroMedio  = Math.round(currentData.slice(12).reduce((s, r) => s + r.result, 0) / 24);

  const chartData = dataBase.map((b, i) => ({
    name: `M${b.m}`,
    base: b.acum,
    ot:   dataOt[i].acum,
    pe:   dataPe[i].acum,
  }));

  const barData = [
    { periodo: 'Baixa',  lav: 3*3*30, sec: 5*3*30, receita: Math.round((3*3*30+5*3*30)*PRICE), margem: Math.round((3*3*30+5*3*30)*PRICE - (3*3*30*LAV_COST+5*3*30*SEC_COST)) },
    { periodo: 'Média',  lav: 6*3*30, sec: 5*3*30, receita: Math.round((6*3*30+5*3*30)*PRICE), margem: Math.round((6*3*30+5*3*30)*PRICE - (6*3*30*LAV_COST+5*3*30*SEC_COST)) },
    { periodo: 'Alta',   lav:10*3*30, sec: 8*3*30, receita: Math.round((10*3*30+8*3*30)*PRICE), margem: Math.round((10*3*30+8*3*30)*PRICE - (10*3*30*LAV_COST+8*3*30*SEC_COST)) },
    { periodo: 'Otimista',lav:13*3*30,sec:11*3*30, receita: Math.round((13*3*30+11*3*30)*PRICE), margem: Math.round((13*3*30+11*3*30)*PRICE - (13*3*30*LAV_COST+11*3*30*SEC_COST)) },
  ];

  const SECTIONS = [
    { id: 'overview',    label: 'Visão geral' },
    { id: 'investimento',label: 'Investimento' },
    { id: 'custos',      label: 'Custos' },
    { id: 'sazonalidade',label: 'Sazonalidade' },
    { id: 'fluxo',       label: 'Fluxo de caixa' },
    { id: 'projecao',    label: 'Projeção de lucro' },
    { id: 'grafico',     label: 'Gráfico' },
    { id: 'riscos',      label: 'Riscos' },
  ];

  const nav = (id) => ({
    padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
    background: section === id ? '#10B981' : 'transparent',
    color: section === id ? '#fff' : '#64748B',
    transition: 'all .15s',
  });

  const tab = (key) => ({
    padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all .15s',
    border: `1.5px solid ${scenario === key ? SCENARIO_META[key].color : '#1E293B'}`,
    background: scenario === key ? SCENARIO_META[key].color + '20' : 'transparent',
    color: scenario === key ? SCENARIO_META[key].color : '#475569',
  });

  return (
    <div style={{ background: '#020817', minHeight: '100vh', color: '#E2E8F0', fontFamily: 'system-ui, sans-serif' }}>

      {/* HEADER */}
      <div style={{ borderBottom: '1px solid #0F172A', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: '#10B981', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>⚡</div>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em' }}>WashUp</span>
            <span style={{ fontSize: 11, padding: '2px 8px', background: '#0F172A', border: '1px solid #1E293B', borderRadius: 20, color: '#64748B' }}>Plano de Negócio · 2026</span>
          </div>
          <p style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>Peruíbe/SP · George Krajan Godas &amp; Jane · 50% / 50% · Confidencial</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(16,185,129,0.1)', color: '#10B981', borderRadius: 6, border: '1px solid rgba(16,185,129,0.2)' }}>3 Speed Queen Stacked</span>
          <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(59,130,246,0.1)', color: '#60A5FA', borderRadius: 6, border: '1px solid rgba(59,130,246,0.2)' }}>6 equipamentos independentes</span>
          <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(251,191,36,0.1)', color: '#FCD34D', borderRadius: 6, border: '1px solid rgba(251,191,36,0.2)' }}>Loja 5 — esquina</span>
        </div>
      </div>

      {/* NAV */}
      <div style={{ borderBottom: '1px solid #0F172A', padding: '6px 28px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {SECTIONS.map(s => <button key={s.id} style={nav(s.id)} onClick={() => setSection(s.id)}>{s.label}</button>)}
      </div>

      <div style={{ padding: '28px', maxWidth: 1100, margin: '0 auto' }}>

        {/* ── VISÃO GERAL ─────────────────────────────────────── */}
        {section === 'overview' && (
          <div>
            <SectionTitle title="Resumo executivo" sub="Lavanderia self-service de marca própria — sem franquia, sem royalties, sistema IoT próprio." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 10, marginBottom: 28 }}>
              <MetricCard label="Investimento por sócio"   value="R$ 42.059"  sub="Desembolso inicial"        color="#F43F5E" />
              <MetricCard label="Parcela mensal por sócio" value="R$ 3.851"   sub="Durante 12 meses"          color="#FB923C" />
              <MetricCard label="Exposição máxima ano 1"   value="~R$ 46k"    sub="Inclui parcelas mês 1–12"  color="#FBBF24" />
              <MetricCard label="Meses com resultado neg." value="~6 meses"   sub="Apenas baixa temporada"    color="#A78BFA" />
              <MetricCard label="Break even acumulado"     value="~mês 26"    sub="Cenário base"              color="#10B981" />
              <MetricCard label="Lucro médio pós break even" value="R$ 5.229" sub="Por sócio / mês (mês 13+)" color="#10B981" />
              <MetricCard label="Lucro anual pós break even" value="R$ 62.7k" sub="Por sócio / ano"           color="#10B981" />
              <MetricCard label="ROI acumulado (36 meses)" value="~149%"      sub="Sobre capital investido"   color="#3B82F6" />
            </div>

            <div style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: '#FED7AA', lineHeight: 1.75, margin: 0 }}>
                <strong>Como ler este plano:</strong> R$ 42.059 é o desembolso no ato da abertura (50% de tudo — máquinas, obra, fachada, câmeras, mobiliário). A partir daí, cada sócio paga R$ 3.851/mês por 12 meses como sua parte do financiamento das 3 máquinas. No pior caso (baixa temporada do ano 1), o resultado mensal é levemente negativo — coberto pelo capital de giro. No <strong>mês 13 as parcelas acabam</strong> e os fixos caem de R$ 5.851 para R$ 2.000 por sócio: mesmo a baixa temporada passa a gerar lucro positivo de R$ 3.257/sócio/mês.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Card>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#94A3B8' }}>Diferenciais competitivos</h3>
                {[
                  'Zero royalties — marca 100% própria',
                  'Dados dos clientes 100% próprios',
                  'Precificação dinâmica por temporada',
                  'Bomba peristáltica inclusa nas máquinas',
                  'Sistema IoT próprio — sem taxa recorrente',
                  'Fachada de esquina — visibilidade dupla',
                  'Portas automáticas via IoT (abre/fecha remoto)',
                  'Câmera como prova documental em reclamações',
                ].map(d => (
                  <div key={d} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B', fontSize: 13 }}>
                    <span style={{ color: '#CBD5E1' }}>{d}</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span>
                  </div>
                ))}
              </Card>
              <Card>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#94A3B8' }}>Estrutura societária</h3>
                {[
                  ['Sócios',              'George & Jane'],
                  ['Divisão',             '50% / 50%'],
                  ['Máquinas',            '3 Speed Queen Stacked'],
                  ['Equipamentos',        '3 lavadoras + 3 secadoras'],
                  ['Aluguel efetivo',     'R$ 3.000/mês (sem isenção)'],
                  ['Parcelas (12 meses)', 'R$ 3.851/sócio/mês'],
                  ['Custos fixos',        '50/50 sempre'],
                  ['Custos variáveis',    'Proporcional aos ciclos'],
                  ['Manutenção',          'Por proprietário da máquina'],
                  ['Saída (cláusula)',     '90 dias · NC 12 meses · 2km'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B', fontSize: 13 }}>
                    <span style={{ color: '#64748B' }}>{k}</span>
                    <span style={{ color: '#CBD5E1', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        )}

        {/* ── INVESTIMENTO ────────────────────────────────────── */}
        {section === 'investimento' && (
          <div>
            <SectionTitle title="Investimento inicial" sub="Todo o capital dividido 50/50. Nenhum sócio tem isenção ou vantagem sobre o outro." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <Card>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#94A3B8' }}>Infraestrutura e fachada</h3>
                {[
                  ['Instalação elétrica + hidráulica',    8000],
                  ['Reforma (pintura + reparação parede)',  6000],
                  ['A/C 24.000 BTU + instalação',          4400],
                  ['Fachada (2 vitrines + 2 portas IoT)',  10400],
                  ['Câmeras (6 câmeras + NVR local)',       2000],
                  ['Mobiliário (cadeiras + mesa dobrar)',   2000],
                  ['Sinalização + identidade visual',       5000],
                  ['Sala de utilidades + IoT infra',        1600],
                  ['POS físico + gateway setup',            2000],
                ].map(([item, val]) => (
                  <LineItem key={item} label={item} value={`R$ ${val.toLocaleString('pt-BR')}`} />
                ))}
                <LineItem label="Subtotal" value="R$ 41.400" bold valueColor="#F43F5E" />
              </Card>
              <Card>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#94A3B8' }}>Máquinas e insumos</h3>
                {[
                  ['Entrada 3 Speed Queen Stacked (3 × R$ 7.700)', 23100],
                  ['Galões iniciais Omo Pro (2 × 20L)',             1440],
                  ['Galões iniciais Confort Pro (2 × 20L)',         1440],
                  ['Imprevistos (10%)',                             6738],
                ].map(([item, val]) => (
                  <LineItem key={item} label={item} value={`R$ ${val.toLocaleString('pt-BR')}`} />
                ))}
                <LineItem label="Subtotal" value="R$ 32.718" bold valueColor="#F43F5E" />

                <div style={{ marginTop: 16, padding: 14, background: '#020817', borderRadius: 8, border: '1px solid #1E293B' }}>
                  {[
                    ['Total desembolso inicial', 'R$ 74.118'],
                    ['Capital de giro',          'R$ 10.000'],
                    ['Total operação',           'R$ 84.118'],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                      <span style={{ color: '#94A3B8' }}>{l}</span>
                      <span style={{ color: '#F43F5E', fontFamily: 'monospace', fontSize: 12 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: '1px solid #1E293B', marginTop: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0' }}>Por sócio (50%)</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#F43F5E', fontFamily: 'monospace' }}>R$ 42.059</span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#475569', marginTop: 10, lineHeight: 1.6 }}>
                  + R$ 3.851/mês por sócio durante 12 meses (parcelas das 3 máquinas).<br />
                  Exposição máxima total ano 1: <strong style={{ color: '#FBBF24' }}>~R$ 46.000 por sócio</strong>.
                </p>
              </Card>
            </div>
            <div style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 10, padding: '14px 18px' }}>
              <p style={{ fontSize: 13, color: '#FED7AA', lineHeight: 1.75, margin: 0 }}>
                <strong>Nota sobre estimativas:</strong> Fachada (R$ 10.400), instalação elétrica/hidráulica (R$ 8.000) e reforma (R$ 6.000) são estimativas ainda sem orçamento formal de fornecedor. Recomenda-se obter pelo menos 1 orçamento real de cada antes de assinar o contrato de locação.
              </p>
            </div>
          </div>
        )}

        {/* ── CUSTOS ──────────────────────────────────────────── */}
        {section === 'custos' && (
          <div>
            <SectionTitle title="Custos operacionais" sub="Custo por uso calculado pela metodologia Autax, adaptada para tarifa B3 Neoenergia Elektro (~R$ 0,85/kWh)." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <Card>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#10B981' }}>Custo por uso — lavagem</h3>
                <LineItem label="Energia (0,6 kWh × R$ 0,85)" value="R$ 0,51" />
                <LineItem label="Água (80L × R$ 7,50/m³)"     value="R$ 0,60" />
                <LineItem label="Omo Pro (16 ml × R$ 0,036/ml)"   value="R$ 0,58" />
                <LineItem label="Confort Pro (12 ml × R$ 0,036/ml)" value="R$ 0,43" />
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #1E293B' }}>
                  <LineItem label="Total custo/uso" value="R$ 2,12" bold valueColor="#F43F5E" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: 14 }}>
                    <span style={{ color: '#E2E8F0', fontWeight: 700 }}>Margem bruta</span>
                    <span style={{ color: '#10B981', fontFamily: 'monospace', fontWeight: 700, fontSize: 18 }}>R$ 13,88</span>
                  </div>
                </div>
              </Card>
              <Card>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#3B82F6' }}>Custo por uso — secagem</h3>
                <LineItem label="Energia (2,3 kWh × R$ 0,85)" value="R$ 1,95" />
                <LineItem label="Água"                         value="R$ 0,00" valueColor="#334155" />
                <LineItem label="Detergente"                   value="R$ 0,00" valueColor="#334155" />
                <LineItem label="Amaciante"                    value="R$ 0,00" valueColor="#334155" />
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #1E293B' }}>
                  <LineItem label="Total custo/uso" value="R$ 1,95" bold valueColor="#F43F5E" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: 14 }}>
                    <span style={{ color: '#E2E8F0', fontWeight: 700 }}>Margem bruta</span>
                    <span style={{ color: '#10B981', fontFamily: 'monospace', fontWeight: 700, fontSize: 18 }}>R$ 14,05</span>
                  </div>
                </div>
              </Card>
            </div>

            <Card style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: '#94A3B8' }}>Insumos — referência de preço</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { produto: 'Omo Pro Lavanderia', formato: 'Galão 20L', preco: 'R$ 720,00', dose: '16 ml/uso (2 ml/kg × 8 kg)', rendimento: '1.250 usos/galão', custo: 'R$ 0,58/uso' },
                  { produto: 'Confort Pro',        formato: 'Galão 20L', preco: 'R$ 720,00', dose: '12 ml/uso (1,5 ml/kg × 8 kg)', rendimento: '1.667 usos/galão', custo: 'R$ 0,43/uso' },
                ].map(p => (
                  <div key={p.produto} style={{ background: '#020817', borderRadius: 8, padding: 14, border: '1px solid #1E293B' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', marginBottom: 8 }}>{p.produto}</p>
                    {[['Formato', p.formato], ['Preço', p.preco], ['Dose/uso', p.dose], ['Rendimento', p.rendimento], ['Custo/uso', p.custo]].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid #0F172A' }}>
                        <span style={{ color: '#64748B' }}>{k}</span>
                        <span style={{ color: '#94A3B8' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: '#94A3B8' }}>Custos fixos mensais</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1E293B' }}>
                    {['Item', 'Total', 'Por sócio (50%)', 'Período'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: h === 'Item' ? 'left' : 'right', color: '#475569', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Aluguel',                    3000, 1500, 'Permanente', false],
                    ['Parcelas 3 máquinas',         7701, 3851, 'Meses 1–12', true],
                    ['Internet + IoT + sistema',     300,  150, 'Permanente', false],
                    ['Seguro',                       300,  150, 'Permanente', false],
                    ['Manutenção preventiva',        400,  200, 'Permanente', false],
                  ].map(([item, tot, soc, per, highlight]) => (
                    <tr key={item} style={{ borderBottom: '1px solid #0F172A', background: highlight ? 'rgba(251,191,36,0.05)' : 'transparent' }}>
                      <td style={{ padding: '7px 10px', color: '#94A3B8' }}>{item}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: '#F43F5E', fontFamily: 'monospace', fontSize: 12 }}>R$ {tot.toLocaleString('pt-BR')}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: '#F43F5E', fontFamily: 'monospace', fontSize: 12 }}>R$ {soc.toLocaleString('pt-BR')}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: 11, color: per === 'Permanente' ? '#64748B' : '#FBBF24' }}>{per}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#020817', borderTop: '1px solid #1E293B' }}>
                    <td style={{ padding: '9px 10px', fontWeight: 700, color: '#E2E8F0' }}>Total meses 1–12</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#F43F5E', fontFamily: 'monospace' }}>R$ 11.701</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#F43F5E', fontFamily: 'monospace' }}>R$ 5.851</td>
                    <td />
                  </tr>
                  <tr style={{ background: 'rgba(16,185,129,0.08)', borderTop: '1px solid rgba(16,185,129,0.2)' }}>
                    <td style={{ padding: '9px 10px', fontWeight: 700, color: '#10B981' }}>Total mês 13+ (sem parcelas) ★</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>R$ 4.000</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>R$ 2.000</td>
                    <td />
                  </tr>
                </tbody>
              </table>
              <p style={{ fontSize: 12, color: '#475569', marginTop: 10, lineHeight: 1.6 }}>
                ★ A queda de R$ 5.851 → R$ 2.000/sócio nos fixos mensais é a principal virada do negócio. Break even operacional meses 1–12: 419 usos/mês = 2,3 usos/equipamento/dia.
              </p>
            </Card>
          </div>
        )}

        {/* ── SAZONALIDADE ────────────────────────────────────── */}
        {section === 'sazonalidade' && (
          <div>
            <SectionTitle title="Sazonalidade — Peruíbe/SP" sub="6 equipamentos independentes: 3 lavadoras + 3 secadoras. Usos/dia por equipamento individual." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { periodo: 'Alta temporada', meses: 'Dez, Jan, Fev', lav: 10, sec: 8, cor: '#FBBF24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' },
                { periodo: 'Média temporada', meses: 'Mar, Jul, Out, Nov', lav: 6, sec: 5, cor: '#818CF8', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
                { periodo: 'Baixa temporada', meses: 'Abr, Mai, Jun, Ago, Set', lav: 3, sec: 5, cor: '#94A3B8', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)' },
              ].map(({ periodo, meses, lav, sec, cor, bg, border }) => {
                const usosLavMes = lav * 3 * 30;
                const usosSecMes = sec * 3 * 30;
                const recBruta  = (usosLavMes + usosSecMes) * PRICE;
                const margem    = recBruta - (usosLavMes * LAV_COST + usosSecMes * SEC_COST);
                return (
                  <div key={periodo} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: 18 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: cor, marginBottom: 4 }}>{periodo}</p>
                    <p style={{ fontSize: 11, color: '#64748B', marginBottom: 14 }}>{meses}</p>
                    {[
                      ['Lavadoras (usos/dia/equip)', lav + ' lavagens'],
                      ['Secadoras (usos/dia/equip)', sec + ' secagens'],
                      ['Total usos/mês (6 equip.)', (usosLavMes + usosSecMes).toLocaleString('pt-BR')],
                      ['Receita bruta',              brl(recBruta)],
                      ['Margem bruta',               brl(margem)],
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

            <Card style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: '#94A3B8' }}>Receita e margem por período</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="periodo" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#1E293B' }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#1E293B' }} tickFormatter={v => 'R$' + (v/1000).toFixed(0) + 'k'} />
                  <Tooltip formatter={(v, n) => [brl(v), n === 'receita' ? 'Receita bruta' : 'Margem bruta']} contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="receita" name="Receita bruta" fill="#1E40AF" radius={[4,4,0,0]} />
                  <Bar dataKey="margem"  name="Margem bruta"  fill="#10B981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '14px 18px' }}>
              <p style={{ fontSize: 13, color: '#BFDBFE', lineHeight: 1.75, margin: 0 }}>
                <strong>Nota sobre o padrão de uso:</strong> Na baixa temporada (inverno + chuva), a secadora tende a ter uso igual ou superior à lavadora — moradores trazem roupas lavadas de casa para secar. Na alta (verão/turismo), a lavadora domina. Esses números são estimativas iniciais; os primeiros 2–3 meses de operação real calibrarão o modelo.
              </p>
            </div>
          </div>
        )}

        {/* ── FLUXO DE CAIXA ──────────────────────────────────── */}
        {section === 'fluxo' && (
          <div>
            <SectionTitle title="Fluxo de caixa mensal" sub="Valores por sócio (50%). Caixa acumulado parte de –R$ 42.059 (investimento inicial)." />
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              {Object.entries(SCENARIO_META).map(([key, meta]) => (
                <button key={key} style={tab(key)} onClick={() => setScenario(key)}>{meta.label}</button>
              ))}
            </div>
            <div style={{ background: '#0F172A', borderRadius: 8, padding: '10px 16px', marginBottom: 18, fontSize: 13, color: '#94A3B8', border: '1px solid #1E293B' }}>
              {SCENARIO_META[scenario].desc}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
              <MetricCard label="Break even acumulado"     value={`~mês ${beMonth}`}                                    sub="Recuperação do investimento"       color={SCENARIO_META[scenario].color} />
              <MetricCard label="Exposição máxima"         value={`– R$ ${Math.abs(maxExposure).toLocaleString('pt-BR')}`} sub="Pior momento do caixa"          color="#F43F5E" />
              <MetricCard label="Lucro médio pós mês 12"  value={`R$ ${lucroMedio.toLocaleString('pt-BR')}`}            sub="Por sócio / mês (média 24 meses)"  color={SCENARIO_META[scenario].color} />
            </div>
            <Card>
              <FluxoTable data={currentData} />
            </Card>
          </div>
        )}

        {/* ── PROJEÇÃO DE LUCRO ───────────────────────────────── */}
        {section === 'projecao' && (
          <div>
            <SectionTitle title="Projeção de lucro" sub="A partir do mês 13, as parcelas acabam e o negócio entra em regime de cruzeiro." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(165px,1fr))', gap: 10, marginBottom: 24 }}>
              <MetricCard label="Lucro médio mensal (mês 13+)" value="R$ 5.229"  sub="Por sócio · cenário base"   color="#10B981" />
              <MetricCard label="Lucro anual médio"             value="R$ 62.748" sub="Por sócio · pós break even" color="#10B981" />
              <MetricCard label="Break even acumulado (base)"   value="~mês 26"   sub="Recuperação do capital"    color="#A78BFA" />
              <MetricCard label="ROI acumulado (36 meses)"      value="~149%"     sub="Sobre capital investido"   color="#3B82F6" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <Card>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: '#94A3B8' }}>Resultado mensal médio — mês 13+</h3>
                <LineItem label="Receita média ponderada (50%)"   value="+ R$ 8.722"  valueColor="#10B981" />
                <LineItem label="Custo variável médio (50%)"      value="– R$ 1.493"  valueColor="#F43F5E" />
                <LineItem label="Fixos sem parcelas (50%)"        value="– R$ 2.000"  valueColor="#F43F5E" />
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0' }}>Lucro líquido médio</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>R$ 5.229/mês</span>
                </div>
              </Card>

              <Card>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: '#94A3B8' }}>Comparativo por cenário (mês 13+)</h3>
                {Object.entries(SCENARIO_META).map(([key, meta]) => {
                  const d  = key === 'base' ? dataBase : key === 'ot' ? dataOt : dataPe;
                  const be = d.find(r => r.isBreakEven)?.m ?? '—';
                  const lm = Math.round(d.slice(12).reduce((s, r) => s + r.result, 0) / 24);
                  const la = Math.round(lm * 12);
                  return (
                    <div key={key} style={{ padding: '10px 0', borderBottom: '1px solid #1E293B' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                        <span style={{ fontSize: 11, color: '#64748B' }}>BE: mês {be}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#64748B' }}>Lucro médio mensal</span>
                        <span style={{ color: '#10B981', fontFamily: 'monospace', fontWeight: 600 }}>R$ {lm.toLocaleString('pt-BR')}/mês</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#64748B' }}>Lucro anual (projetado)</span>
                        <span style={{ color: '#10B981', fontFamily: 'monospace', fontWeight: 600 }}>R$ {la.toLocaleString('pt-BR')}/ano</span>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>

            <Card>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: '#94A3B8' }}>Resultado mensal por período — mês 13+ (por sócio)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1E293B' }}>
                      {['Período', 'Usos/mês', 'Receita 50%', 'Custo var. 50%', 'Fixos 50%', 'Lucro líquido'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Período' ? 'left' : 'right', color: '#475569', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { periodo: 'Alta',  lav: 10, sec: 8 },
                      { periodo: 'Média', lav: 6,  sec: 5 },
                      { periodo: 'Baixa', lav: 3,  sec: 5 },
                    ].map(({ periodo, lav, sec }) => {
                      const ul = lav * 3 * 30, us = sec * 3 * 30;
                      const rec = Math.round((ul + us) * PRICE / 2);
                      const cv  = Math.round((ul * LAV_COST + us * SEC_COST) / 2);
                      const fix = 2000;
                      const luc = rec - cv - fix;
                      return (
                        <tr key={periodo} style={{ borderBottom: '1px solid #0F172A', background: luc < 0 ? 'rgba(244,63,94,0.05)' : 'transparent' }}>
                          <td style={{ padding: '8px 10px', color: '#94A3B8' }}>{periodo}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B', fontFamily: 'monospace', fontSize: 12 }}>{(ul+us).toLocaleString('pt-BR')}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10B981', fontFamily: 'monospace', fontSize: 12 }}>R$ {rec.toLocaleString('pt-BR')}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#F43F5E', fontFamily: 'monospace', fontSize: 12 }}>– R$ {cv.toLocaleString('pt-BR')}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#F43F5E', fontFamily: 'monospace', fontSize: 12 }}>– R$ {fix.toLocaleString('pt-BR')}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: luc >= 0 ? '#10B981' : '#F43F5E' }}>{brl(luc, true)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: 12, color: '#475569', marginTop: 10, lineHeight: 1.6 }}>
                Mesmo a baixa temporada gera lucro positivo a partir do mês 13. Isso é a virada estrutural do negócio.
              </p>
            </Card>
          </div>
        )}

        {/* ── GRÁFICO ─────────────────────────────────────────── */}
        {section === 'grafico' && (
          <div>
            <SectionTitle title="Evolução do caixa acumulado" sub="Por sócio ao longo de 36 meses. Linha zero = break even acumulado (recuperação do investimento)." />
            <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
              {Object.entries(SCENARIO_META).map(([key, meta]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                  <span style={{ width: 22, height: 3, background: meta.color, borderRadius: 2, display: 'inline-block' }} />
                  <span style={{ color: '#94A3B8' }}>{meta.label}</span>
                </div>
              ))}
            </div>
            <Card style={{ marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#1E293B' }} interval={2} />
                  <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#1E293B' }} tickFormatter={v => (v < 0 ? '–' : '') + 'R$' + Math.abs(v/1000).toFixed(0) + 'k'} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" label={{ value: 'Break even', fill: '#475569', fontSize: 11, position: 'insideRight' }} />
                  <Line type="monotone" dataKey="ot"   name="Otimista"    stroke="#3B82F6" strokeWidth={2}   dot={false} strokeDasharray="6 3" />
                  <Line type="monotone" dataKey="base" name="Base"        stroke="#10B981" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="pe"   name="Conservador" stroke="#F43F5E" strokeWidth={2}   dot={false} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {Object.entries(SCENARIO_META).map(([key, meta]) => {
                const d  = key === 'base' ? dataBase : key === 'ot' ? dataOt : dataPe;
                const be = d.find(r => r.isBreakEven)?.m ?? '—';
                const lm = Math.round(d.slice(12).reduce((s, r) => s + r.result, 0) / 24);
                const minAcum = Math.min(...d.map(r => r.acum));
                return (
                  <div key={key} style={{ background: '#0F172A', border: `1px solid ${meta.color}30`, borderRadius: 10, padding: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: meta.color, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{meta.label}</p>
                    {[
                      ['Break even',            `Mês ${be}`],
                      ['Exposição máxima',       brl(minAcum)],
                      ['Lucro médio pós mês 12', `R$ ${lm.toLocaleString('pt-BR')}/mês`],
                      ['Lucro anual projetado',  `R$ ${(lm*12).toLocaleString('pt-BR')}/ano`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #1E293B' }}>
                        <span style={{ color: '#64748B' }}>{k}</span>
                        <span style={{ color: '#E2E8F0', fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RISCOS ──────────────────────────────────────────── */}
        {section === 'riscos' && (
          <div>
            <SectionTitle title="Análise de risco" sub="Mapeamento dos principais riscos operacionais e suas mitigações." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { risco: 'Baixa adesão nos primeiros meses', prob: 'Média', cor: '#FBBF24', mit: 'Capital de giro incluso no plano. Break even operacional é baixo (2,3 usos/equipamento/dia). Peruíbe tem demanda real por este serviço — ausência de concorrente local é uma vantagem.' },
                { risco: 'Manutenção inesperada de máquina', prob: 'Média', cor: '#FBBF24', mit: 'Speed Queen: vida útil 10–15 anos em uso comercial intensivo. Peças disponíveis no Brasil via Alliance Laundry Systems. Manutenção atribuída ao proprietário da máquina — não socializa o custo.' },
                { risco: 'Aumento da tarifa de energia elétrica', prob: 'Baixa', cor: '#10B981', mit: 'Totalmente repassável via ajuste de preço — sem franquia para restringir. Margem bruta elevada (R$ 13,97/uso) absorve aumentos moderados antes de precisar reajuste.' },
                { risco: 'Concorrência de franquia no raio', prob: 'Baixa', cor: '#10B981', mit: 'Sem royalty + precificação dinâmica por temporada + identidade local. Sistema IoT próprio reduz custo operacional vs franquias no longo prazo.' },
                { risco: 'Inadimplência nas parcelas da máquina', prob: 'Baixa', cor: '#10B981', mit: 'Cada sócio assina e financia sua própria máquina individualmente. Inadimplência de um não afeta o outro.' },
                { risco: 'Dano em roupas de cliente (CDC Art. 14)', prob: 'Baixa', cor: '#10B981', mit: 'Câmeras documentam estado das roupas antes/depois. Sachê/dosador bypassa o dispenser — eliminando o principal vetor de mancha. Ciclo quente não oferecido no MVP.' },
                { risco: 'Falha no sistema IoT / portas', prob: 'Baixa', cor: '#10B981', mit: 'Portas de ferro basculantes originais permanecem instaladas como fallback manual. Sistema IoT pode operar em modo degradado (abertura manual) sem impacto na operação das máquinas.' },
                { risco: 'Disputa societária', prob: 'Baixa', cor: '#10B981', mit: 'Cláusula de saída definida: 90 dias de prazo, não-concorrência de 12 meses em raio de 2km. Só máquinas são reembolsáveis — instalações são ativo permanente da operação.' },
              ].map(({ risco, prob, cor, mit }) => (
                <Card key={risco} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 80, textAlign: 'center', paddingTop: 2 }}>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: cor + '20', color: cor, fontWeight: 700, whiteSpace: 'nowrap' }}>{prob}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', marginBottom: 5 }}>{risco}</p>
                    <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.65, margin: 0 }}>{mit}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
