// ── Order Status ────────────────────────────────────────────────
export type OrderStatus =
  | '观望中'
  | '已报名/已占位'
  | '拼团中'
  | '拼团成功待付款'
  | '已付定金待尾款'
  | '待补尾款'
  | '已付款待发货'
  | '已到团长处待排发'
  | '已申请排发待发货'
  | '已发货待收货'
  | '已收货已完成'
  | '未拼成'
  | '流团待退款'
  | '已退款'
  | '部分退款'
  | '异常待确认'
  | '已放弃/已转单'

export const STATUS_STEPS = [
  '观望中',
  '已报名/已占位',
  '拼团中',
  '拼团成功待付款',
  '已付定金待尾款',
  '待补尾款',
  '已付款待发货',
  '已到团长处待排发',
  '已申请排发待发货',
  '已发货待收货',
  '已收货已完成',
] as const

export type TerminatedStatus = '未拼成' | '流团待退款' | '已退款' | '部分退款' | '异常待确认' | '已放弃/已转单'

export const TERMINATED_STATUSES: TerminatedStatus[] = [
  '未拼成', '流团待退款', '已退款', '部分退款', '异常待确认', '已放弃/已转单',
]

export const ALL_STATUSES: OrderStatus[] = [
  ...STATUS_STEPS,
  ...TERMINATED_STATUSES,
]

export const STATUS_COLORS: Record<string, string> = {
  '观望中': '#718096',
  '已报名/已占位': '#5990d0',
  '拼团中': '#102a6b',
  '拼团成功待付款': '#cca273',
  '已付定金待尾款': '#cca273',
  '待补尾款': '#cca273',
  '已付款待发货': '#015185',
  '已到团长处待排发': '#b0898c',
  '已申请排发待发货': '#b0898c',
  '已发货待收货': '#5990d0',
  '已收货已完成': '#2a7d6e',
  '未拼成': '#718096',
  '流团待退款': '#c45c4a',
  '已退款': '#718096',
  '部分退款': '#cca273',
  '异常待确认': '#c45c4a',
  '已放弃/已转单': '#718096',
}

export const NEXT_ACTION_MAP: Record<OrderStatus, string> = {
  '观望中': '决定是否参与',
  '已报名/已占位': '等待团长确认',
  '拼团中': '等待成团结果',
  '拼团成功待付款': '去付款',
  '已付定金待尾款': '等待尾款通知',
  '待补尾款': '补尾款',
  '已付款待发货': '等待发货进度',
  '已到团长处待排发': '发起排发 / 补邮费',
  '已申请排发待发货': '等待团长寄出',
  '已发货待收货': '查看物流并确认收货',
  '已收货已完成': '已完成',
  '未拼成': '无需处理',
  '流团待退款': '确认退款 / 催退款',
  '已退款': '已结束',
  '部分退款': '确认剩余金额',
  '异常待确认': '回群翻记录 / 询问团长',
  '已放弃/已转单': '已结束',
}

// ── Product Types ───────────────────────────────────────────────
export const DEFAULT_PRODUCT_TYPES = [
  '收藏卡', '扑克牌', '旋转立牌', '色纸', '明信片', '镭射票', '透卡', '其他',
]

// ── Payment Record ─────────────────────────────────────────────
export interface PaymentRecord {
  id: string
  type: '定金' | '尾款' | '代理费' | '运费' | '排发费' | '补款' | '全款' | '其他'
  amount: number
  date: string // YYYY-MM-DD
  method?: string
  note?: string
  attachment?: string // file path or URL
}

// ── Refund Record ──────────────────────────────────────────────
export interface RefundRecord {
  id: string
  reason: string
  amount: number
  date: string
  received: boolean
  note?: string
  attachment?: string
}

// ── Progress Entry ─────────────────────────────────────────────
export interface ProgressEntry {
  id: string
  date: string // YYYY-MM-DD HH:mm
  status: OrderStatus
  note?: string
  attachment?: string
}

// ── Main Order ─────────────────────────────────────────────────
export interface Order {
  id: string
  // 基础信息
  title: string
  characterTags: string[]       // 角色/主题标签，多选
  productType: string           // 制品分类
  theme?: string                // 主题/系列
  publisher?: string            // 出品方/画手/企划
  quantity: number
  // 拼团信息
  groupName?: string           // 拼团群
  leader?: string              // 团长
  platform?: string             // 平台
  batch?: string                // 批次
  // 金额
  unitPrice?: number            // 商品单价
  subtotal?: number             // 商品小计
  paidAmount: number            // 已付金额
  pendingAmount: number         // 待付金额
  pendingRefundAmount: number   // 待退款金额
  refundedAmount: number        // 已退款金额
  // 状态
  status: OrderStatus
  customNextAction?: string     // 自定义下一步动作
  // 时间
  registerTime?: string         // 报名时间
  payDeadline?: string          // 付款截止时间
  balanceDeadline?: string      // 补款截止时间
  distributeDeadline?: string    // 排发截止时间
  shipTime?: string             // 发货时间
  receiveTime?: string          // 收货时间
  lastUpdateTime: string        // 最近更新时间
  // 物流
  logisticsCompany?: string
  trackingNumber?: string
  receivedConfirmed?: boolean
  // 备注与附件
  note?: string
  attachments: string[]          // 截图/附件路径列表
  // 多笔记录
  payments: PaymentRecord[]
  refunds: RefundRecord[]
  progressLog: ProgressEntry[]
  // 元数据
  createdAt: string
  updatedAt: string
}

// ── App State ───────────────────────────────────────────────────
export interface AppState {
  orders: Order[]
  customProductTypes: string[]
  lastExportTime?: string
}