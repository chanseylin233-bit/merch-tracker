# merch-tracker 代码审查报告

## 📊 审查概要

| 维度 | 评分 | 说明 |
|------|------|------|
| **代码质量** | ⭐⭐⭐⭐ | TypeScript 类型完善，结构清晰 |
| **性能** | ⭐⭐⭐ | 存在重复计算，可优化 |
| **UI/UX** | ⭐⭐⭐⭐ | 基础良好，交互可增强 |
| **可维护性** | ⭐⭐⭐⭐⭐ | hooks/utils 拆分合理 |

---

## 🔴 性能问题

### 1. 重复计算（高优先级）
**位置**: `Home.tsx` L25-27
```typescript
const yearOrders = state.orders.filter(o => o.createdAt.startsWith(String(year)))
const yearPaid = yearOrders.reduce((s, o) => s + o.paidAmount, 0)
```
**问题**: 每次渲染都重新计算年度统计，但 `useStats` hook 已有类似逻辑。
**建议**: 在 `useStats` 中暴露 `yearStats`，或使用 `useMemo` 缓存。

### 2. 搜索 + 筛选重复过滤
**位置**: `Records.tsx` L43-45
```typescript
const filteredByFilter = useFilteredOrders(filters)
const filtered = useSearchOrders(search)
const displayList = search ? filtered : filteredByFilter
```
**问题**: 两个 hook 各自遍历完整列表，无法组合。
**建议**: 合并为单一 hook，支持多条件叠加。

### 3. Canvas 重绘未优化
**位置**: `Stats.tsx` L56-107
**问题**: 每次 `stats.monthlyTrend` 变化都完整重绘，未利用脏区检测。
**建议**: 提取为自定义 hook `useLineChart`，添加防抖/节流。

---

## 🟡 代码质量

### 1. 类型过于宽松
**位置**: `storage.ts` L78
```typescript
export function exportCSV(orders: any[]): string
```
**问题**: `any[]` 丧失类型安全。
**建议**: 改为 `Order[]`。

### 2. 重复逻辑
**位置**: `OrderCard.tsx` L15
```typescript
const isDone = order.status === '已收货已完成' || order.status === '已退款' || ...
```
**问题**: 硬编码判断，与 `utils/orders.ts` 的 `isTerminated` 功能重复。
**建议**: 复用 `isCompleted()` 或 `isTerminated()`。

### 3. 缺少错误边界
**问题**: 无全局错误捕获，Canvas 报错会导致白屏。
**建议**: 添加 `ErrorBoundary` 组件包裹路由。

---

## 🟢 UI/UX 优化建议

### 1. 交互反馈
| 位置 | 当前状态 | 建议改进 |
|------|----------|----------|
| 按钮点击 | 仅颜色变化 | 添加缩放动画（scale: 0.95）+ 触觉反馈 |
| 卡片点击 | 无反馈 | 添加点击涟漪效果 |
| 状态切换 | 即时切换 | 添加过渡动画（淡入淡出） |

### 2. 空状态优化
**当前**: 静态图标 + 文字
**建议**: 
- 添加浮动动画（上下缓慢浮动）
- 添加粒子效果（星星闪烁）
- 添加文案轮播（"暂无待办，一切顺利！" → "要不要看看收藏的周边？"）

### 3. 加载状态
**问题**: 无骨架屏，首次加载直接显示空状态。
**建议**: 添加 `Skeleton` 组件模拟卡片布局。

### 4. 折线图交互
**当前**: 静态图表
**建议**:
- 鼠标悬停显示具体数值
- 点击数据点弹出详情
- 支持缩放/拖动查看细节

### 5. 状态标签动画
**建议**: 添加呼吸动画（低优先级状态）或脉冲动画（高优先级状态）。

---

## 🔵 功能完善建议

### 优先级高
1. **数据备份提醒** - localStorage 损坏风险高，建议每周提醒导出
2. **撤销/重做** - 误删除可恢复（基于 reducer 历史栈）
3. **快捷键支持** - `Ctrl+Z` 撤销，`Ctrl+S` 保存

### 优先级中
4. **主题色自定义** - 用户可选择自己喜欢的强调色
5. **数据云同步** - 接入 GitHub Gist 或私有的云存储
6. **图表导出** - 折线图导出为 PNG

### 优先级低
7. **PWA 离线提示** - 当前已配置 PWA，但无离线提示
8. **移动端手势** - 下拉刷新、左滑删除
9. **深色模式** - 第四套主题（夜间护眼）

---

## 📋 建议优先级

### 立即修复（本周）
- [ ] 修复重复计算问题（`Home.tsx`）
- [ ] 修复类型问题（`storage.ts`）
- [ ] 添加错误边界

### 近期优化（两周内）
- [ ] 合并搜索/筛选逻辑
- [ ] 添加骨架屏
- [ ] 添加按钮点击动画
- [ ] 折线图添加悬停提示

### 中期改进（一月内）
- [ ] 数据备份提醒
- [ ] 撤销/重做功能
- [ ] 快捷键支持
- [ ] 主题色自定义

---

## 🎨 UI 美化具体方案

### 方案 1: 按钮点击动画
```css
.btn {
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.btn:active {
  transform: scale(0.95);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
```

### 方案 2: 空状态浮动动画
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.empty-icon {
  animation: float 3s ease-in-out infinite;
}
```

### 方案 3: 卡片涟漪效果
```tsx
<div className="card" onClick={handleClick}>
  <span className="ripple" style={{ left, top }} />
</div>
```

### 方案 4: 折线图悬停提示
```tsx
const [tooltip, setTooltip] = useState<{x: number; y: number; value: number} | null>(null)

<canvas 
  onMouseMove={(e) => {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const point = findNearestPoint(x)
    setTooltip(point)
  }}
/>
{tooltip && <div className="tooltip">¥{tooltip.value}</div>}
```

---

*生成时间: 2026-05-02 21:43*
