import type { Order, OrderStatus, PaymentRecord, RefundRecord, ProgressEntry } from '../../types'
import { NEXT_ACTION_MAP } from '../../types'
import { now } from '../../utils/storage'

type OrderAction =
  | { type: 'ADD_ORDER'; order: Order }
  | { type: 'UPDATE_ORDER'; order: Order }
  | { type: 'DELETE_ORDER'; id: string }
  | { type: 'BATCH_DELETE'; ids: string[] }
  | { type: 'SET_STATUS'; id: string; status: OrderStatus; customNextAction?: string }
  | { type: 'BATCH_SET_STATUS'; ids: string[]; status: OrderStatus }
  | { type: 'ADD_PAYMENT'; id: string; payment: PaymentRecord }
  | { type: 'ADD_REFUND'; id: string; refund: RefundRecord }
  | { type: 'ADD_PROGRESS'; id: string; entry: ProgressEntry }

export function ordersReducer(orders: Order[], action: OrderAction): Order[] {
  const ts = now()
  
  switch (action.type) {
    case 'ADD_ORDER':
      return [action.order, ...orders]
      
    case 'UPDATE_ORDER':
      return orders.map(o =>
        o.id === action.order.id
          ? { ...action.order, updatedAt: ts, lastUpdateTime: ts }
          : o
      )
      
    case 'DELETE_ORDER':
      return orders.filter(o => o.id !== action.id)
      
    case 'BATCH_DELETE':
      const idSet = new Set(action.ids)
      return orders.filter(o => !idSet.has(o.id))
      
    case 'BATCH_SET_STATUS':
      const setIdSet = new Set(action.ids)
      return orders.map(o =>
        setIdSet.has(o.id)
          ? {
              ...o,
              status: action.status,
              customNextAction: NEXT_ACTION_MAP[action.status],
              lastUpdateTime: ts,
              updatedAt: ts,
            }
          : o
      )
      
    case 'SET_STATUS':
      const nextAction = action.customNextAction ?? NEXT_ACTION_MAP[action.status]
      return orders.map(o =>
        o.id === action.id
          ? {
              ...o,
              status: action.status,
              customNextAction: nextAction !== NEXT_ACTION_MAP[o.status] ? nextAction : undefined,
              lastUpdateTime: ts,
              updatedAt: ts,
            }
          : o
      )
      
    case 'ADD_PAYMENT':
      return orders.map(o =>
        o.id === action.id
          ? {
              ...o,
              payments: [...o.payments, action.payment],
              paidAmount: o.paidAmount + action.payment.amount,
              lastUpdateTime: ts,
              updatedAt: ts,
            }
          : o
      )
      
    case 'ADD_REFUND':
      return orders.map(o =>
        o.id === action.id
          ? {
              ...o,
              refunds: [...o.refunds, action.refund],
              refundedAmount: o.refundedAmount + action.refund.amount,
              lastUpdateTime: ts,
              updatedAt: ts,
            }
          : o
      )
      
    case 'ADD_PROGRESS':
      return orders.map(o =>
        o.id === action.id
          ? {
              ...o,
              progressLog: [...o.progressLog, action.entry],
              lastUpdateTime: ts,
              updatedAt: ts,
            }
          : o
      )
      
    default:
      return orders
  }
}
