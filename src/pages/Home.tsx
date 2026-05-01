import { useNavigate } from 'react-router-dom'
import { ClipboardList, Sparkles, CreditCard, PartyPopper } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useTodoGroups, useActiveOrders } from '../hooks/useOrders'
import { OrderCard } from '../components/OrderCard'
import { formatMoney } from '../utils/format'
import { isTerminated } from '../utils/orders'
import './Home.css'

export function HomePage() {
  const { state } = useApp()
  const navigate = useNavigate()
  const year = new Date().getFullYear()

  const todoGroups = useTodoGroups()
  const activeOrders = useActiveOrders()

  // 未完成订单（排除已终止状态）
  const incompleteOrders = activeOrders
    .filter(o => !isTerminated(o.status))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  // 统计
  const yearOrders = state.orders.filter(o => o.createdAt.startsWith(String(year)))
  const yearPaid = yearOrders.reduce((s, o) => s + o.paidAmount, 0)

  const refundCount = activeOrders.filter(o =>
    o.status === '流团待退款' || o.status === '部分退款'
  ).length

  return (
    <div className="home page-enter">
      {/* 标题区 */}
      <div className="home__hero">
        <div className="home__greeting">
          <span className="icon-badge icon-badge--purple">
            <ClipboardList size={20} />
          </span>
          苏茜周边拼团账本
          <Sparkles size={18} className="home__hero-icon" />
        </div>
        <div className="home__sub">{year}年 · 共 {state.orders.length} 笔记录</div>
      </div>

      {/* 三张统计卡片 */}
      <div className="home__overview stagger-container">
        <div className="home__stat home__stat--amber stagger-item">
          <span className="icon-badge icon-badge--sm home__stat-icon">
            <ClipboardList size={15} />
          </span>
          <div className="home__stat-value">{activeOrders.length}</div>
          <div className="home__stat-label">未完成</div>
        </div>
        <div className="home__stat home__stat--pink stagger-item">
          <span className="icon-badge icon-badge--sm home__stat-icon">
            <CreditCard size={15} />
          </span>
          <div className="home__stat-value">{refundCount}</div>
          <div className="home__stat-label">待退款</div>
        </div>
        <div className="home__stat home__stat--blue stagger-item">
          <span className="icon-badge icon-badge--sm home__stat-icon home__stat-icon--money">
            <CreditCard size={15} />
          </span>
          <div className="home__stat-value home__stat--money">¥{formatMoney(yearPaid)}</div>
          <div className="home__stat-label">今年已付</div>
        </div>
      </div>

      {/* 待办列表 */}
      {todoGroups.length === 0 && incompleteOrders.length === 0 && (
        <div className="home__empty-wrap">
          <div className="home__empty-icon">
            <span className="icon-badge icon-badge--lg">
              <PartyPopper size={26} strokeWidth={1.5} />
            </span>
          </div>
          <div className="home__empty-text">暂无待办，一切顺利！</div>
        </div>
      )}

      {todoGroups.map(g => (
        <div className="home__section stagger-container" key={g.label}>
          <div className="home__section-title">
            {g.icon} {g.label} ({g.orders.length})
          </div>
          {g.orders.map(o => (
            <OrderCard
              key={o.id}
              order={o}
              onClick={id => navigate(`/detail/${id}`)}
            />
          ))}
        </div>
      ))}

      {/* 未完成记录列表 */}
      {incompleteOrders.length > 0 && (
        <div className="home__section">
          <div className="home__section-title">
            笔记 {incompleteOrders.length}
          </div>
          {incompleteOrders.map(o => (
            <OrderCard
              key={o.id}
              order={o}
              onClick={id => navigate(`/detail/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}