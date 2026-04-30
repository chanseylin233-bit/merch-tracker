import { useState } from 'react'
import { useYearStats, useMaxMonthlyPaid, useMaxTypePaid, MACARON } from '../hooks/useStats'
import { formatMoney } from '../utils/format'
import { useApp } from '../context/AppContext'
import { STATUS_COLORS } from '../types'
import { exportCSV } from '../utils/storage'
import { downloadFile } from '../utils/storage'
import './Stats.css'

export function StatsPage() {
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  
  const stats = useYearStats(viewYear)
  const maxMonthly = useMaxMonthlyPaid(viewYear)
  const maxTypePaid = useMaxTypePaid(viewYear)

  const { state } = useApp()

  const handleExportCSV = () => {
    const csv = exportCSV(state.orders)
    downloadFile(csv, `merch-tracker-${viewYear}.csv`, 'text/csv')
  }

  return (
    <div className="stats">
      <div className="stats__header">
        <div className="stats__title">年度统计</div>
        <div className="stats__year-switch">
          <button className="stats__year-btn" onClick={() => setViewYear(y => y - 1)}>◀</button>
          <span className="stats__year-label">{viewYear}</span>
          <button 
            className="stats__year-btn" 
            onClick={() => setViewYear(y => y + 1)} 
            disabled={viewYear >= new Date().getFullYear()}
          >
            ▶
          </button>
        </div>
      </div>

      {/* 年度概览 */}
      <div className="stats__card stats__card--gradient">
        <div className="stats__card-title">年度概览</div>
        <div className="stats__grid4">
          <div className="stats__metric">
            <div className="stats__metric-value">{stats.year.orders}</div>
            <div className="stats__metric-label">订单</div>
          </div>
          <div className="stats__metric">
            <div className="stats__metric-value stats__metric--red">¥{formatMoney(stats.year.paid)}</div>
            <div className="stats__metric-label">已付</div>
          </div>
          <div className="stats__metric">
            <div className="stats__metric-value stats__metric--orange">¥{formatMoney(stats.year.pending)}</div>
            <div className="stats__metric-label">待付</div>
          </div>
          <div className="stats__metric">
            <div className="stats__metric-value stats__metric--green">¥{formatMoney(stats.year.refunded)}</div>
            <div className="stats__metric-label">已退</div>
          </div>
        </div>
        <div className="stats__net-cost">
          <span>实际花费</span>
          <span className="stats__net-cost-num">¥{formatMoney(stats.year.netCost)}</span>
        </div>
        {/* 占比条 */}
        <div className="stats__cost-bar">
          {stats.year.paid > 0 && (
            <div 
              className="stats__cost-seg stats__cost-seg--paid" 
              style={{ width: `${(stats.year.paid / (stats.year.paid + stats.year.pending + stats.year.pendingRefund)) * 100}%` }}
            >
              已付
            </div>
          )}
          {stats.year.pending > 0 && (
            <div 
              className="stats__cost-seg stats__cost-seg--pending" 
              style={{ width: `${(stats.year.pending / (stats.year.paid + stats.year.pending + stats.year.pendingRefund)) * 100}%` }}
            >
              待付
            </div>
          )}
          {stats.year.pendingRefund > 0 && (
            <div 
              className="stats__cost-seg stats__cost-seg--refund" 
              style={{ width: `${(stats.year.pendingRefund / (stats.year.paid + stats.year.pending + stats.year.pendingRefund)) * 100}%` }}
            >
              待退
            </div>
          )}
        </div>
      </div>

      {/* 本月 & 进行中 */}
      <div className="stats__row2">
        <div className="stats__card stats__card--compact">
          <div className="stats__metric-value">{stats.month.orders}</div>
          <div className="stats__metric-label">本月订单</div>
        </div>
        <div className="stats__card stats__card--compact">
          <div className="stats__metric-value stats__metric--red">¥{formatMoney(stats.month.paid)}</div>
          <div className="stats__metric-label">本月已付</div>
        </div>
        <div className="stats__card stats__card--compact stats__card--accent">
          <div className="stats__metric-value">{stats.active}</div>
          <div className="stats__metric-label">进行中</div>
        </div>
      </div>

      {/* 月度趋势 */}
      <div className="stats__card">
        <div className="stats__card-title">月度趋势</div>
        <div className="stats__bar-chart">
          {stats.monthlyTrend.map(m => (
            <div className="stats__bar-col" key={m.month}>
              <div className="stats__bar-wrap">
                <div
                  className="stats__bar stats__bar--net"
                  style={{ height: `${Math.max((m.net / maxMonthly) * 100, 0)}%` }}
                  title={`净花费 ¥${m.net.toFixed(0)}`}
                />
                <div
                  className="stats__bar stats__bar--paid"
                  style={{
                    height: `${Math.max(((m.paid - m.net) / maxMonthly) * 100, 0)}%`,
                    bottom: `${Math.max((m.net / maxMonthly) * 100, 0)}%`,
                  }}
                  title={`已退 ¥${(m.paid - m.net).toFixed(0)}`}
                />
              </div>
              <div className="stats__bar-label">{m.month.replace('月', '')}</div>
            </div>
          ))}
        </div>
        <div className="stats__legend">
          <span className="stats__legend-item">
            <span className="stats__legend-dot stats__legend-dot--paid" />已付
          </span>
          <span className="stats__legend-item">
            <span className="stats__legend-dot stats__legend-dot--net" />净花费
          </span>
        </div>
      </div>

      {/* 按制品类型 */}
      {stats.byType.length > 0 && (
        <div className="stats__card">
          <div className="stats__card-title">按制品类型</div>
          {stats.byType.map(([type, data], i) => (
            <div className="stats__hbar-row" key={type}>
              <div className="stats__hbar-label">
                <span className="stats__hbar-dot" style={{ background: MACARON[i % MACARON.length] }} />
                {type}
              </div>
              <div className="stats__hbar-track">
                <div 
                  className="stats__hbar-fill" 
                  style={{ width: `${(data.paid / maxTypePaid) * 100}%`, background: MACARON[i % MACARON.length] }} 
                />
              </div>
              <div className="stats__hbar-val">
                <span className="stats__hbar-count">{data.count}件</span>
                <span className="stats__hbar-money">¥{formatMoney(data.netCost)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 按角色/主题 */}
      {stats.byChar.length > 0 && (
        <div className="stats__card">
          <div className="stats__card-title">按角色/主题</div>
          {stats.byChar.slice(0, 10).map(([char, data], i) => (
            <div className="stats__hbar-row" key={char}>
              <div className="stats__hbar-label">
                <span className="stats__hbar-dot" style={{ background: MACARON[(i + 3) % MACARON.length] }} />
                {char}
              </div>
              <div className="stats__hbar-track">
                <div 
                  className="stats__hbar-fill" 
                  style={{ 
                    width: `${(data.paid / (stats.byChar[0]?.[1].paid || 1)) * 100}%`, 
                    background: MACARON[(i + 3) % MACARON.length] 
                  }} 
                />
              </div>
              <div className="stats__hbar-val">
                <span className="stats__hbar-count">{data.count.toFixed(0)}件</span>
                <span className="stats__hbar-money">¥{formatMoney(data.paid)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 按拼团群 */}
      {stats.byGroup.length > 0 && (
        <div className="stats__card">
          <div className="stats__card-title">按拼团群</div>
          {stats.byGroup.slice(0, 8).map(([group, data], i) => (
            <div className="stats__hbar-row" key={group}>
              <div className="stats__hbar-label">
                <span className="stats__hbar-dot" style={{ background: MACARON[(i + 5) % MACARON.length] }} />
                {group}
              </div>
              <div className="stats__hbar-track">
                <div 
                  className="stats__hbar-fill" 
                  style={{ 
                    width: `${(data.paid / (stats.byGroup[0]?.[1].paid || 1)) * 100}%`, 
                    background: MACARON[(i + 5) % MACARON.length] 
                  }} 
                />
              </div>
              <div className="stats__hbar-val">
                <span className="stats__hbar-count">{data.count}件</span>
                <span className="stats__hbar-money">¥{formatMoney(data.paid)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 状态分布 */}
      {stats.byStatus.length > 0 && (
        <div className="stats__card">
          <div className="stats__card-title">状态分布</div>
          <div className="stats__bubble-row">
            {stats.byStatus.map(([status, count]) => (
              <div
                className="stats__bubble"
                key={status}
                style={{ '--bubble-color': STATUS_COLORS[status] || '#718096' } as React.CSSProperties}
              >
                <div className="stats__bubble-num">{count}</div>
                <div className="stats__bubble-label">{status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 导出按钮 */}
      <button className="stats__export-btn" onClick={handleExportCSV}>
        📥 导出 CSV
      </button>
    </div>
  )
}
