import { db } from "~/server/db";

let lastCheckDate: Date | null = null;

export async function checkAndPerformSettlement() {
  try {
    const now = new Date();

    // 只在日期变化时检查（避免频繁检查）
    if (
      lastCheckDate &&
      lastCheckDate.getDate() === now.getDate() &&
      lastCheckDate.getMonth() === now.getMonth() &&
      lastCheckDate.getFullYear() === now.getFullYear()
    ) {
      return;
    }

    lastCheckDate = now;

    // 获取系统配置
    const config = await db.systemConfig.findUnique({
      where: { id: "system" },
    });

    if (!config || !config.settlementInitialized || !config.settlementDay) {
      return;
    }

    const currentDay = now.getDate();

    // 检查是否是结算日
    if (currentDay !== config.settlementDay) {
      return;
    }

    // 获取用户状态
    const userState = await db.userState.findUnique({
      where: { id: "user" },
    });

    if (!userState) {
      return;
    }

    // 检查本月是否已经结算过
    const lastSettlement = await db.settlementHistory.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (lastSettlement) {
      const lastSettlementDate = new Date(lastSettlement.cycleEnd);
      const isSameMonth =
        lastSettlementDate.getMonth() === now.getMonth() &&
        lastSettlementDate.getFullYear() === now.getFullYear();

      if (isSameMonth) {
        return;
      }
    }

    // 计算周期开始和结束时间
    const cycleEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      config.settlementDay,
      0,
      0,
      0
    );

    const cycleStart = new Date(cycleEnd);
    cycleStart.setMonth(cycleStart.getMonth() - 1);

    // 保存历史记录
    await db.settlementHistory.create({
      data: {
        cycleStart,
        cycleEnd,
        totalPoints: userState.currentPoints,
        totalReward: userState.currentReward,
      },
    });

    // 清零积分和奖励金
    await db.userState.update({
      where: { id: "user" },
      data: {
        currentPoints: 0,
        currentReward: 0,
      },
    });

    console.log("Settlement completed successfully");
  } catch (error) {
    console.error("Settlement check error:", error);
  }
}
