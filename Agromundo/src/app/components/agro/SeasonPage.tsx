import { useState } from 'react';
import { Apple, Carrot, LeafyGreen, Wheat, Search, Info } from 'lucide-react';
import { C, FONT } from './theme';
import { Card, PageShell, Pill } from './ui';
import { useApp } from '../../AppContext';

type Grupo = 'Frutas' | 'Legumes' | 'Verduras' | 'Grãos';
type Item = { nome: string; grupo: Grupo; meses: number[] | 'todo' };

/**
 * Referência geral de safra (época de maior oferta e melhor preço) para o
 * Centro-Sul do Brasil. Varia por região, clima e variedade.
 */
const CALENDARIO: Item[] = [
  { nome: 'Abacate', grupo: 'Frutas', meses: [3, 4, 5, 6, 7] },
  { nome: 'Abacaxi', grupo: 'Frutas', meses: [11, 12, 1, 2] },
  { nome: 'Banana', grupo: 'Frutas', meses: 'todo' },
  { nome: 'Caqui', grupo: 'Frutas', meses: [3, 4, 5] },
  { nome: 'Goiaba', grupo: 'Frutas', meses: [1, 2, 3, 4] },
  { nome: 'Jabuticaba', grupo: 'Frutas', meses: [9, 10, 11] },
  { nome: 'Laranja', grupo: 'Frutas', meses: [5, 6, 7, 8, 9, 10] },
  { nome: 'Limão', grupo: 'Frutas', meses: [12, 1, 2, 3, 4] },
  { nome: 'Mamão', grupo: 'Frutas', meses: 'todo' },
  { nome: 'Manga', grupo: 'Frutas', meses: [10, 11, 12, 1] },
  { nome: 'Maracujá', grupo: 'Frutas', meses: [12, 1, 2, 3, 4, 5] },
  { nome: 'Melancia', grupo: 'Frutas', meses: [9, 10, 11, 12, 1, 2, 3] },
  { nome: 'Morango', grupo: 'Frutas', meses: [6, 7, 8, 9, 10] },
  { nome: 'Pêssego', grupo: 'Frutas', meses: [10, 11, 12] },
  { nome: 'Tangerina', grupo: 'Frutas', meses: [4, 5, 6, 7] },
  { nome: 'Uva', grupo: 'Frutas', meses: [12, 1, 2, 3] },
  { nome: 'Abobrinha', grupo: 'Legumes', meses: [6, 7, 8, 9, 10] },
  { nome: 'Batata', grupo: 'Legumes', meses: 'todo' },
  { nome: 'Berinjela', grupo: 'Legumes', meses: [1, 2, 3, 4] },
  { nome: 'Beterraba', grupo: 'Legumes', meses: [6, 7, 8, 9, 10] },
  { nome: 'Cenoura', grupo: 'Legumes', meses: [7, 8, 9, 10, 11] },
  { nome: 'Mandioca', grupo: 'Legumes', meses: [4, 5, 6, 7, 8] },
  { nome: 'Milho verde', grupo: 'Legumes', meses: [1, 2, 3, 4] },
  { nome: 'Pimentão', grupo: 'Legumes', meses: [12, 1, 2, 3, 4] },
  { nome: 'Tomate', grupo: 'Legumes', meses: [7, 8, 9, 10] },
  { nome: 'Alface', grupo: 'Verduras', meses: [5, 6, 7, 8, 9] },
  { nome: 'Brócolis', grupo: 'Verduras', meses: [5, 6, 7, 8, 9] },
  { nome: 'Couve', grupo: 'Verduras', meses: [4, 5, 6, 7, 8, 9] },
  { nome: 'Couve-flor', grupo: 'Verduras', meses: [5, 6, 7, 8, 9] },
  { nome: 'Espinafre', grupo: 'Verduras', meses: [4, 5, 6, 7, 8] },
  { nome: 'Repolho', grupo: 'Verduras', meses: [5, 6, 7, 8, 9] },
  { nome: 'Rúcula', grupo: 'Verduras', meses: [4, 5, 6, 7, 8, 9] },
  { nome: 'Arroz', grupo: 'Grãos', meses: [2, 3, 4, 5] },
  { nome: 'Café', grupo: 'Grãos', meses: [5, 6, 7, 8, 9] },
  { nome: 'Feijão', grupo: 'Grãos', meses: [12, 1, 2, 3] },
  { nome: 'Milho', grupo: 'Grãos', meses: [1, 2, 3, 4, 5, 6] },
];

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const ICONES: Record<Grupo, typeof Apple> = { Frutas: Apple, Legumes: Carrot, Verduras: LeafyGreen, Grãos: Wheat };

const naSafra = (item: Item, mes: number) => item.meses === 'todo' || item.meses.includes(mes);

/** O que está na época: ajuda a comprar mais barato e mais fresco. */
export function SeasonPage() {
  const app = useApp();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [grupo, setGrupo] = useState<Grupo | 'Todos'>('Todos');
  const agora = CALENDARIO.filter(i => naSafra(i, mes) && i.meses !== 'todo');
  const visiveis = CALENDARIO.filter(i => grupo === 'Todos' || i.grupo === grupo);

  const buscar = (nome: string) => app.go(`/?q=${encodeURIComponent(nome)}#produtos`);

  return (
    <PageShell titulo="Calendário de safra" subtitulo="Na época certa o alimento é mais fresco, mais saboroso e mais barato.">
      <div className="flex flex-wrap gap-2 mb-5" role="tablist" aria-label="Mês">
        {MESES.map((m, i) => (
          <button key={m} role="tab" aria-selected={mes === i + 1} onClick={() => setMes(i + 1)}
            style={{
              padding: '7px 12px', borderRadius: '999px', cursor: 'pointer', fontFamily: FONT, fontSize: '13px', textTransform: 'capitalize',
              border: `1px solid ${mes === i + 1 ? C.orange : C.border}`, background: mes === i + 1 ? C.orange : C.surface,
              color: mes === i + 1 ? '#fff' : C.text, fontWeight: 600,
            }}>
            {m}
          </button>
        ))}
      </div>

      <Card style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Na safra em {MESES_LONGOS[mes - 1]}</h2>
        <div className="flex flex-wrap gap-2">
          {agora.map(i => {
            const Icone = ICONES[i.grupo];
            return (
              <button key={i.nome} onClick={() => buscar(i.nome)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${C.border}`, background: '#FBFAF7', cursor: 'pointer', fontFamily: FONT, fontSize: '14px', color: C.text }}>
                <Icone size={16} color={C.brown} /> {i.nome} <Search size={13} color={C.muted} />
              </button>
            );
          })}
        </div>
        <p className="flex items-center gap-1.5" style={{ fontSize: '12.5px', color: C.muted, marginTop: '12px' }}>
          <Info size={14} /> Clique para ver quem está vendendo. Banana, mamão e batata têm oferta o ano todo.
        </p>
      </Card>

      <div className="flex flex-wrap gap-2 mb-3">
        {(['Todos', 'Frutas', 'Legumes', 'Verduras', 'Grãos'] as const).map(g => (
          <button key={g} onClick={() => setGrupo(g)}
            style={{ padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: FONT, fontSize: '13px', border: `1px solid ${grupo === g ? C.orange : C.border}`, background: grupo === g ? C.orangeSoft : C.surface, color: grupo === g ? C.brown : C.text, fontWeight: 600 }}>
            {g}
          </button>
        ))}
      </div>

      <Card padding="0" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '720px' }}>
          <thead>
            <tr style={{ background: '#FBFAF7' }}>
              <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600 }}>Alimento</th>
              {MESES.map((m, i) => (
                <th key={m} style={{ padding: '10px 4px', fontWeight: 600, textTransform: 'capitalize', color: mes === i + 1 ? C.orange : C.muted }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map(i => (
              <tr key={i.nome} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={{ padding: '8px 14px' }}>
                  <button onClick={() => buscar(i.nome)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: FONT, fontSize: '13.5px', color: C.text, fontWeight: 500 }}>
                    {i.nome}
                  </button>
                  {' '}<Pill tom="cinza" style={{ fontSize: '10.5px', padding: '1px 6px' }}>{i.grupo}</Pill>
                </td>
                {MESES.map((m, idx) => {
                  const ativo = naSafra(i, idx + 1);
                  return (
                    <td key={m} style={{ textAlign: 'center', padding: '6px 2px', background: mes === idx + 1 ? 'rgba(244,119,11,0.05)' : undefined }}>
                      <span title={ativo ? 'Época de safra' : ''} style={{
                        display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%',
                        background: ativo ? (i.meses === 'todo' ? '#F9B95C' : C.orange) : C.border, opacity: ativo ? 1 : 0.6,
                      }} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p style={{ fontSize: '12.5px', color: C.muted, marginTop: '10px' }}>
        Referência geral para o Centro-Sul do Brasil; a época real varia com a região, o clima e a variedade. Pergunte ao produtor.
      </p>
    </PageShell>
  );
}
