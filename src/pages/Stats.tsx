import { useState, useRef, useEffect } from 'react'
import { ShoppingBag, CreditCard, Clock, RefreshCw, Package, Moon } from 'lucide-react'
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

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleExportCSV = () => {
    const csv = exportCSV(state.orders)
    downloadFile(csv, `merch-tracker-${viewYear}.csv`, 'text/csv')
  }

  // 折线图绘制
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const W = rect.width
    const H = rect.height
    const pad = { top: 10, right: 10, bottom: 24, left: 36 }
    const cW = W - pad.left - pad.right
    const cH = H - pad.top - pad.bottom

    ctx.clearRect(0, 0, W, H)

    // 网格线
    ctx.strokeStyle = '#e8dfd5'
    ctx.lineWidth = 0.5
    const yLines = [0, 50, 100, 150]
    yLines.forEach(v => {
      const y = pad.top + cH - (v / Math.max(maxMonthly, 150)) * cH
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(pad.left + cW, y)
      ctx.stroke()
      // Y轴标签
      ctx.fillStyle = '#94a3b8'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(String(v), pad.left - 6, y + 3)
    })

    // X轴月份标签
    stats.monthlyTrend.forEach((m, i) => {
      const x = pad.left + (i / 11) * cW
      ctx.fillStyle = '#94a3b8'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(m.month.replace('月', ''), x, H - 6)
    })

    // 已付折线（粉色）
    drawLine(ctx, stats.monthlyTrend, m => m.paid, maxMonthly, '#f5a0b0', pad, cW, cH)
    // 净花费折线（蓝色）
    drawLine(ctx, stats.monthlyTrend, m => m.net, maxMonthly, '#5990d0', pad, cW, cH)
  }, [stats.monthlyTrend, maxMonthly])

  return (
    <div className="stats page-enter">
      <div className="stats__header">
        <div className="stats__title">✨ 年度统计</div>
        <div className="stats__year-switch">
          <button className="stats__year-btn" onClick={() => setViewYear(y => y - 1)}>‹</button>
          <span className="stats__year-label">{viewYear}</span>
          <button 
            className="stats__year-btn" 
            onClick={() => setViewYear(y => y + 1)} 
            disabled={viewYear >= new Date().getFullYear()}
          >
            ›
          </button>
        </div>
      </div>

      {/* 年度概览 */}
      <div className="stats__card stats__card--gradient">
        <div className="stats__card-title">📋 年度概览</div>
        <div className="stats__grid4">
          <div className="stats__metric">
            <div className="stats__metric-icon stats__metric-icon--blue"><ShoppingBag size={16} /></div>
            <div className="stats__metric-value">{stats.year.orders}</div>
            <div className="stats__metric-label">订单</div>
          </div>
          <div className="stats__metric">
            <div className="stats__metric-icon stats__metric-icon--pink"><CreditCard size={16} /></div>
            <div className="stats__metric-value stats__metric--red">¥{formatMoney(stats.year.paid)}</div>
            <div className="stats__metric-label">已付</div>
          </div>
          <div className="stats__metric">
            <div className="stats__metric-icon stats__metric-icon--amber"><Clock size={16} /></div>
            <div className="stats__metric-value stats__metric--orange">¥{formatMoney(stats.year.pending)}</div>
            <div className="stats__metric-label">待付</div>
          </div>
          <div className="stats__metric">
            <div className="stats__metric-icon stats__metric-icon--green"><RefreshCw size={16} /></div>
            <div className="stats__metric-value stats__metric--green">¥{formatMoney(stats.year.refunded)}</div>
            <div className="stats__metric-label">已退</div>
          </div>
        </div>

        {/* 实际花费横条 */}
        <div className="stats__net-cost-bar">
          <span className="stats__net-cost-label">实际花费</span>
          <span className="stats__net-cost-num">¥{formatMoney(stats.year.netCost)}</span>
        </div>

        {/* 占比条 */}
        <div className="stats__cost-bar">
          {stats.year.paid > 0 && (
            <div 
              className="stats__cost-seg stats__cost-seg--paid" 
              style={{ width: `${(stats.year.paid / Math.max(stats.year.paid + stats.year.pending + stats.year.pendingRefund, 1)) * 100}%` }}
            />
          )}
          {stats.year.pending > 0 && (
            <div 
              className="stats__cost-seg stats__cost-seg--pending" 
              style={{ width: `${(stats.year.pending / Math.max(stats.year.paid + stats.year.pending + stats.year.pendingRefund, 1)) * 100}%` }}
            />
          )}
          {stats.year.pendingRefund > 0 && (
            <div 
              className="stats__cost-seg stats__cost-seg--refund" 
              style={{ width: `${(stats.year.pendingRefund / Math.max(stats.year.paid + stats.year.pending + stats.year.pendingRefund, 1)) * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* 三张小卡片 */}
      <div className="stats__row2">
        <div className="stats__card stats__card--compact stats__card--blue">
          <div className="stats__metric-icon-sm"><Package size={16} /></div>
          <div className="stats__metric-value">{stats.month.orders}</div>
          <div className="stats__metric-label">本月订单</div>
        </div>
        <div className="stats__card stats__card--compact stats__card--pink">
          <div className="stats__metric-icon-sm"><CreditCard size={16} /></div>
          <div className="stats__metric-value stats__metric--red">¥{formatMoney(stats.month.paid)}</div>
          <div className="stats__metric-label">本月已付</div>
        </div>
        <div className="stats__card stats__card--compact stats__card--purple">
          <div className="stats__metric-icon-sm"><Moon size={16} /></div>
          <div className="stats__metric-value">{stats.active}</div>
          <div className="stats__metric-label">进行中</div>
        </div>
      </div>

      {/* 月度趋势 */}
      <div className="stats__card">
        <div className="stats__card-title">📅 月度趋势</div>
        <div className="stats__chart-wrap">
          <canvas ref={canvasRef} className="stats__line-canvas" />
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
        ⬇ 导出 CSV
      </button>
    </div>
  )
}

/* ── 折线图绘制辅助 ───────────────── */
function drawLine(
  ctx: CanvasRenderingContext2D,
  data: { month: string; paid: number; net: number }[],
  getter: (d: typeof data[0]) => number,
  maxVal: number,
  color: string,
  pad: { top: number; right: number; bottom: number; left: number },
  cW: number,
  cH: number
) {
  if (!data.length) return
  const points = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * cW,
    y: pad.top + cH - (getter(d) / Math.max(maxVal, 1)) * cH,
  }))

  // 渐变填充区域
  ctx.beginPath()
  ctx.moveTo(points[0].x, pad.top + cH)
  points.forEach(p => ctx.lineTo(p.x, p.y))
  ctx.lineTo(points[points.length - 1].x, pad.top + cH)
  ctx.closePath()
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH)
  grad.addColorStop(0, color + '30')
  grad.addColorStop(1, color + '06')
  ctx.fillStyle = grad
  ctx.fill()

  // 线条
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    const xc = (points[i - 1].x + points[i].x) / 2
    const yc = (points[i - 1].y + points[i].y) / 2
    ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc)
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.stroke()

  // 数据点
  points.forEach(p => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.stroke()
  })
}
