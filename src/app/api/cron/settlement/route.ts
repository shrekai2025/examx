import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET() {
  try {
    // 获取系统配置
    const config = await db.systemConfig.findUnique({
      where: { id: "system" },
    });

    if (!config || !config.settlementInitialized || !config.settlementDay) {
      return NextResponse.json({ message: "Settlement not initialized" });
    }

    const now = new Date();
    const currentDay = now.getDate();

    // 检查是否是结算日
    if (currentDay !== config.settlementDay) {
      return NextResponse.json({ message: "Not settlement day" });
    }

    // 获取用户状态
    const userState = await db.userState.findUnique({
      where: { id: "user" },
    });

    if (!userState) {
      return NextResponse.json({ message: "No user state found" });
    }

    // 检查本月是否已经结算过（通过查看最近的结算历史）
    const lastSettlement = await db.settlementHistory.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (lastSettlement) {
      const lastSettlementDate = new Date(lastSettlement.cycleEnd);
      const isSameMonth =
        lastSettlementDate.getMonth() === now.getMonth() &&
        lastSettlementDate.getFullYear() === now.getFullYear();

      if (isSameMonth) {
        return NextResponse.json({ message: "Already settled this month" });
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

    return NextResponse.json({
      success: true,
      message: "Settlement completed",
      cycleStart,
      cycleEnd,
      totalPoints: userState.currentPoints,
      totalReward: userState.currentReward,
    });
  } catch (error) {
    console.error("Settlement error:", error);
    return NextResponse.json(
      { error: "Settlement failed" },
      { status: 500 }
    );
  }
}
