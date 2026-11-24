import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";
    const customYear = searchParams.get("year") ? parseInt(searchParams.get("year")) : null;
    const customMonth = searchParams.get("month") ? parseInt(searchParams.get("month")) : null; // 1-12

    const now = new Date();
    let startDate = null;
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (customYear && customMonth) {
      startDate = new Date(customYear, customMonth - 1, 1, 0, 0, 0, 0);
      endDate = new Date(customYear, customMonth, 0, 23, 59, 59, 999);
    } else {
      switch (period) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          break;
        case "3months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
          break;
        case "all":
        default:
          startDate = null;
          break;
      }
    }

    const dateFilter = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const periodWhere = startDate ? { date: dateFilter } : {};

    // 1. Total Versements in Period
    const versementsAgg = await prisma.versement.aggregate({
      where: periodWhere,
      _sum: { montant: true },
      _count: true,
    });
    const totalVersements = versementsAgg._sum.montant || 0;
    const countVersements = versementsAgg._count || 0;

    // 2. Total Dépenses in Period
    const depensesAgg = await prisma.depense.aggregate({
      where: periodWhere,
      _sum: { montant: true },
      _count: true,
    });
    const totalDepenses = depensesAgg._sum.montant || 0;
    const countDepenses = depensesAgg._count || 0;

    // 3. Bénéfice Net
    const beneficeNet = totalVersements - totalDepenses;

    // 4. Crédit Patients Global (Current outstanding balance across all consultations)
    const allConsultations = await prisma.consultation.findMany({
      select: {
        id: true,
        prix: true,
        createdAt: true,
        versements: {
          select: { montant: true },
        },
      },
    });

    let creditPatients = 0;
    let countPaid = 0;
    let countPartiel = 0;
    let countImpaye = 0;

    allConsultations.forEach((c) => {
      const price = c.prix !== null && c.prix !== undefined ? c.prix : 0;
      const paid = c.versements.reduce((sum, v) => sum + (v.montant || 0), 0);
      const remaining = Math.max(0, price - paid);

      if (remaining > 0) {
        creditPatients += remaining;
      }

      if (price > 0) {
        if (remaining <= 0) {
          countPaid++;
        } else if (paid > 0) {
          countPartiel++;
        } else {
          countImpaye++;
        }
      } else if (paid > 0) {
        countPaid++;
      }
    });

    // 5. Recent Versements (for list)
    const recentVersements = await prisma.versement.findMany({
      where: periodWhere,
      include: {
        patient: { select: { id: true, nom: true } },
        consultation: { select: { id: true, prix: true, createdAt: true } },
      },
      orderBy: { date: "desc" },
      take: 100,
    });

    // 6. Recent Dépenses (for list)
    const recentDepenses = await prisma.depense.findMany({
      where: periodWhere,
      orderBy: { date: "desc" },
      take: 100,
    });

    // 7. Time-series data for Charts
    // Build interval timeline
    const allPeriodVersements = await prisma.versement.findMany({
      where: periodWhere,
      select: { date: true, montant: true },
    });

    const allPeriodDepenses = await prisma.depense.findMany({
      where: periodWhere,
      select: { date: true, montant: true },
    });

    const chartMap = {};

    if (period === "today") {
      // Group by hour
      for (let h = 8; h <= 20; h++) {
        const key = `${String(h).padStart(2, "0")}h`;
        chartMap[key] = { label: key, versements: 0, depenses: 0, benefice: 0 };
      }
      allPeriodVersements.forEach((v) => {
        const d = new Date(v.date);
        const h = `${String(d.getHours()).padStart(2, "0")}h`;
        if (!chartMap[h]) chartMap[h] = { label: h, versements: 0, depenses: 0, benefice: 0 };
        chartMap[h].versements += v.montant || 0;
      });
      allPeriodDepenses.forEach((dp) => {
        const d = new Date(dp.date);
        const h = `${String(d.getHours()).padStart(2, "0")}h`;
        if (!chartMap[h]) chartMap[h] = { label: h, versements: 0, depenses: 0, benefice: 0 };
        chartMap[h].depenses += dp.montant || 0;
      });
    } else if (period === "month" || (customYear && customMonth)) {
      // Group by day of month
      const maxDays = endDate.getDate();
      for (let day = 1; day <= maxDays; day++) {
        const key = `${day}`;
        chartMap[key] = { label: `J-${day}`, versements: 0, depenses: 0, benefice: 0 };
      }
      allPeriodVersements.forEach((v) => {
        const d = new Date(v.date);
        const day = `${d.getDate()}`;
        if (!chartMap[day]) chartMap[day] = { label: `J-${day}`, versements: 0, depenses: 0, benefice: 0 };
        chartMap[day].versements += v.montant || 0;
      });
      allPeriodDepenses.forEach((dp) => {
        const d = new Date(dp.date);
        const day = `${d.getDate()}`;
        if (!chartMap[day]) chartMap[day] = { label: `J-${day}`, versements: 0, depenses: 0, benefice: 0 };
        chartMap[day].depenses += dp.montant || 0;
      });
    } else {
      // Group by month
      const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
      let loopStart = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
      let loopEnd = new Date(endDate);

      let cur = new Date(loopStart.getFullYear(), loopStart.getMonth(), 1);
      while (cur <= loopEnd) {
        const key = `${monthNames[cur.getMonth()]} ${cur.getFullYear() !== now.getFullYear() ? cur.getFullYear() : ""}`.trim();
        chartMap[key] = { label: key, versements: 0, depenses: 0, benefice: 0 };
        cur.setMonth(cur.getMonth() + 1);
      }

      allPeriodVersements.forEach((v) => {
        const d = new Date(v.date);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear() !== now.getFullYear() ? d.getFullYear() : ""}`.trim();
        if (!chartMap[key]) chartMap[key] = { label: key, versements: 0, depenses: 0, benefice: 0 };
        chartMap[key].versements += v.montant || 0;
      });

      allPeriodDepenses.forEach((dp) => {
        const d = new Date(dp.date);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear() !== now.getFullYear() ? d.getFullYear() : ""}`.trim();
        if (!chartMap[key]) chartMap[key] = { label: key, versements: 0, depenses: 0, benefice: 0 };
        chartMap[key].depenses += dp.montant || 0;
      });
    }

    const chartData = Object.values(chartMap).map((item) => ({
      ...item,
      benefice: item.versements - item.depenses,
    }));

    return NextResponse.json({
      summary: {
        totalVersements,
        totalDepenses,
        beneficeNet,
        creditPatients,
        countVersements,
        countDepenses,
        distribution: {
          paid: countPaid,
          partiel: countPartiel,
          impaye: countImpaye,
          total: allConsultations.length,
        },
      },
      chartData,
      recentVersements,
      recentDepenses,
      period,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error("GET /api/finance/stats error:", error);
    return NextResponse.json(
      { error: "Échec du calcul des statistiques financières." },
      { status: 500 }
    );
  }
}
