# TAI Protocol MVP Gap Plan (app-tai)

## 已补齐（本轮）

### P0 页面骨架
- [x] `/` 落地/目标设定
- [x] `/sale` 代币销售页（阶段价格、限购、FOMO 信息）
- [x] `/home` 主界面
- [x] `/deposit` 价格锁存款页
- [x] `/invite` 邀请页
- [x] `/rewards` 奖励中心页
- [x] `/leaderboard` 排行榜页（持仓/购买/纸手榜切换）
- [x] `/missions` 任务页
- [x] `/achievements` 成就页
- [x] `/profile` 钱包与账户页

### P0 前端核心计算（mock）
- [x] 50 阶段价格函数（按阶段递增价格换算 TAI/TON）
- [x] 每日限购剩余额度计算
- [x] 30 天销售倒计时
- [x] 单次购买区间限制（0.1 - 1000 TON）
- [x] 财富自由目标换算（目标 USD -> 需要 TAI）
- [x] 锁仓目标价与锁仓仓位本地记录

### 工程修复
- [x] 去除前端注入 `GEMINI_API_KEY` 配置
- [x] 清理 `index.html` 无效 `index.css` 引用
- [x] 新增 `typecheck/lint` 脚本（当前 lint 为类型检查占位）
- [x] `npm run typecheck` 通过

## 仍缺失（上线前必须）

### P0 必须补齐
- [ ] TonConnect 真正接入（替换当前 mock wallet）
- [ ] `/sale` 对接真实后端 + 合约读写
- [ ] `/deposit` 对接 VestingContract（创建锁仓、链上状态同步）
- [ ] `/invite` 邀请关系记录与 3% 返利结算（后端）
- [ ] `/rewards` 奖励池聚合与一次性领取（后端 + 合约）
- [ ] `/leaderboard` 实时数据（持仓/购买/纸手）
- [ ] Telegram Mini App 身份绑定（tg initData 校验 + 用户注册）

### 合约/后端协同
- [ ] SaleContract: 50 阶段、每日 8 亿限购、30 天时限
- [ ] VestingContract: 用户自定义解锁价格
- [ ] RewardPool: 链下积分到链上领取
- [ ] Cloudflare Workers API: users/invites/rewards/sale/leaderboard/missions
- [ ] 数据库表落地与索引（users, invites, rewards, purchases, locks, leaderboard snapshots）

### 上线质量
- [ ] E2E 测试（核心转化流：连接钱包 -> 购买 -> 锁仓 -> 领取奖励）
- [ ] 监控告警（前端错误、接口错误、链上交易失败）
- [ ] 风控校验（地址限额、交易防重放、签名校验）
- [ ] 法务/文案（条款、风险提示、隐私政策）

## 下一步建议执行顺序
1. 打通 `TonConnect + Telegram initData`（身份与钱包先稳定）。
2. 对接 `/sale` 真实数据与交易（MVP 第一转化漏斗）。
3. 对接 `/deposit` 锁仓合约交互（核心价值点）。
4. 完成 `/invite` + `/rewards` 返利闭环（增长飞轮）。
5. 接入排行榜真实数据并加分享入口（传播增强）。
