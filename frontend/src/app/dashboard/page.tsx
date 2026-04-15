'use client'
// src/app/dashboard/page.tsx
import { useDashboardMetricas, useDashboardAtividades, useDashboardGrafico, useItensMaisAlugados } from '@/hooks/useDashboard'
import { SkeletonCard, Card, Badge } from '@/components/ui'
import { formatRelative, LOCACAO_STATUS_MAP } from '@/lib/utils'
import { Package, ClipboardList, Users, AlertTriangle, TrendingUp, TrendingDown, ArrowRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Não foi possível carregar os dados.</p>
      <button onClick={onRetry} className="btn-secondary btn-sm"><RefreshCw className="w-3.5 h-3.5" /> Tentar novamente</button>
    </div>
  )
}

export default function DashboardPage() {
  const { data: metricas,  isLoading, isError, refetch }           = useDashboardMetricas()
  const { data: atividades, isError: errAtiv, refetch: refAtiv }   = useDashboardAtividades(6)
  const { data: grafico,    isError: errGraf, refetch: refGraf }   = useDashboardGrafico(6)
  const { data: populares,  isError: errPop,  refetch: refPop  }   = useItensMaisAlugados(6)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Visão Geral</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? Array(4).fill(0).map((_,i) => <SkeletonCard key={i} />) :
         isError   ? <div className="col-span-4"><ErrorState onRetry={refetch} /></div> : (
          <>
            <MetricCard label="Itens no Acervo"  value={metricas?.acervo.total ?? 0}       sub={`${metricas?.acervo.disponiveis} disponíveis`}     icon={<Package className="w-4 h-4"/>}       color="purple" />
            <MetricCard label="Locações Ativas"  value={metricas?.locacoes.ativas ?? 0}    sub={`${metricas?.locacoes.mesAtual} este mês`}         icon={<ClipboardList className="w-4 h-4"/>}  color="pink"
              trend={metricas?.locacoes.variacaoPercentual ? { value: metricas.locacoes.variacaoPercentual, positive: parseFloat(metricas.locacoes.variacaoPercentual) >= 0 } : undefined} />
            <MetricCard label="Clientes"          value={metricas?.clientes.total ?? 0}     sub="cadastrados"                                        icon={<Users className="w-4 h-4"/>}          color="violet" />
            <MetricCard label="Em Atraso"         value={metricas?.locacoes.atrasadas ?? 0} sub={`${metricas?.alertas.devolucoesHoje} devoluções hoje`} icon={<AlertTriangle className="w-4 h-4"/>} color="red" href="/locacoes?status=ATRASADA" />
          </>
        )}
      </div>

      {/* Gráfico + Populares */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Locações por mês</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Últimos 6 meses</p>
          </div>
          {errGraf ? <ErrorState onRetry={refGraf} /> : grafico ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={grafico} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="50%"  stopColor="#ec4899" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(192,132,252,0.07)" />
                <XAxis dataKey="mes" tick={{ fill: '#7c6a9e', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7c6a9e', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1a1525', border: '1px solid #2e2440', borderRadius: '8px', fontSize: '12px', color: '#f4f0ff' }}
                  cursor={{ stroke: 'rgba(192,132,252,0.2)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="total" stroke="url(#line)" strokeWidth={2} fill="url(#grad)" dot={false} activeDot={{ r: 4, fill: '#c084fc' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-44 skeleton rounded-lg" />}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Mais Alugados</h3>
          {errPop ? <ErrorState onRetry={refPop} /> : (
            <div className="space-y-3">
              {populares?.map((item, i) => (
                <div key={item.acervo?.id} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono w-4" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.acervo?.nome}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.acervo?.categoria?.nome}</p>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{item.totalLocacoes}×</span>
                </div>
              ))}
              {!populares && Array(6).fill(0).map((_,i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="skeleton h-3 w-4 rounded" /><div className="skeleton h-3 flex-1 rounded" /><div className="skeleton h-3 w-6 rounded" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Atividades recentes */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Locações Recentes</h3>
          <Link href="/locacoes" className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {errAtiv ? <ErrorState onRetry={refAtiv} /> : (
          <div className="space-y-1">
            {atividades?.map(loc => {
              const st = LOCACAO_STATUS_MAP[loc.status]
              return (
                <Link key={loc.id} href={`/locacoes/${loc.id}`}>
                  <div className="flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer hover:bg-[var(--bg-hover)]">
                    <div className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0"
                      style={{ background: 'var(--bg-hover)', borderColor: 'var(--border)' }}>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {loc.cliente.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{loc.cliente.nome}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {loc.itens.slice(0,2).map(i => i.acervo.nome).join(', ')}
                        {loc.itens.length > 2 && ` +${loc.itens.length - 2}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className={st.badge}>{st.label}</Badge>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{formatRelative(loc.criadoEm)}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
            {!atividades && Array(4).fill(0).map((_,i) => (
              <div key={i} className="flex gap-4 items-center p-3">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2"><div className="skeleton h-3 w-32 rounded" /><div className="skeleton h-3 w-48 rounded" /></div>
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function MetricCard({ label, value, sub, icon, color, trend, href }: {
  label: string; value: number; sub: string; icon: React.ReactNode
  color: 'purple' | 'pink' | 'violet' | 'red'
  trend?: { value: string; positive: boolean }
  href?: string
}) {
  const styles = {
    purple: { bg: 'rgba(168,85,247,0.1)',  text: '#c084fc', border: 'rgba(168,85,247,0.2)' },
    pink:   { bg: 'rgba(236,72,153,0.1)',  text: '#f472b6', border: 'rgba(236,72,153,0.2)' },
    violet: { bg: 'rgba(139,92,246,0.1)',  text: '#a78bfa', border: 'rgba(139,92,246,0.2)' },
    red:    { bg: 'rgba(239,68,68,0.1)',   text: '#f87171', border: 'rgba(239,68,68,0.2)'  },
  }
  const s = styles[color]

  const content = (
    <Card className={`p-5 transition-colors ${href ? 'cursor-pointer' : 'cursor-default'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg border" style={{ background: s.bg, color: s.text, borderColor: s.border }}>{icon}</div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.positive ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: s.text }}>{label}</p>
      <p className="text-[10px] mt-0.5 opacity-70" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </Card>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
