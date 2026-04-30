import type { AppState } from '../../types'
import { DEFAULT_PRODUCT_TYPES } from '../../types'
import { ordersReducer } from './ordersReducer'

type AppAction =
  | { type: 'ADD_ORDER'; order: AppState['orders'][0] }
  | { type: 'UPDATE_ORDER'; order: AppState['orders'][0] }
  | { type: 'DELETE_ORDER'; id: string }
  | { type: 'BATCH_DELETE'; ids: string[] }
  | { type: 'SET_STATUS'; id: string; status: AppState['orders'][0]['status']; customNextAction?: string }
  | { type: 'BATCH_SET_STATUS'; ids: string[]; status: AppState['orders'][0]['status'] }
  | { type: 'ADD_PAYMENT'; id: string; payment: AppState['orders'][0]['payments'][0] }
  | { type: 'ADD_REFUND'; id: string; refund: AppState['orders'][0]['refunds'][0] }
  | { type: 'ADD_PROGRESS'; id: string; entry: AppState['orders'][0]['progressLog'][0] }
  | { type: 'IMPORT_DATA'; state: AppState }
  | { type: 'CLEAR_ALL' }
  | { type: 'ADD_PRODUCT_TYPE'; name: string }
  | { type: 'REMOVE_PRODUCT_TYPE'; name: string }

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'IMPORT_DATA':
      return action.state
      
    case 'CLEAR_ALL':
      return {
        ...state,
        orders: [],
      }
      
    case 'ADD_PRODUCT_TYPE':
      if (state.customProductTypes.includes(action.name) || DEFAULT_PRODUCT_TYPES.includes(action.name)) {
        return state
      }
      return {
        ...state,
        customProductTypes: [...state.customProductTypes, action.name],
      }
      
    case 'REMOVE_PRODUCT_TYPE':
      return {
        ...state,
        customProductTypes: state.customProductTypes.filter(t => t !== action.name),
      }
      
    default:
      // 所有订单相关操作委托给 ordersReducer
      return {
        ...state,
        orders: ordersReducer(state.orders, action as any),
      }
  }
}
