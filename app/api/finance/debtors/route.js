import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ========================================================
// GET /api/finance/debtors
// Returns ONLY patients who currently have an outstanding credit
// (unpaid or partially paid consultations with reste > 0)
// ========================================================
export async function GET() {
  try {
    const patients = await prisma.patient.findMany({
      where: {
        consultations: {
          some: {},
        },
      },
      select: {
        id: true,
        nom: true,
        telephone: true,
        consultations: {
          select: {
            id: true,
            createdAt: true,
            motifDeConsultation: true,
            note: true,
            prix: true,
            versements: {
              select: {
                id: true,
                montant: true,
                date: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { nom: "asc" },
    });

    const debtors = [];

    patients.forEach((p) => {
      const unpaidConsultations = [];
      let patientTotalCredit = 0;

      p.consultations.forEach((c) => {
        const prix = c.prix !== null && c.prix !== undefined ? Number(c.prix) : 0;
        const totalPaye = (c.versements || []).reduce(
          (sum, v) => sum + (Number(v.montant) || 0),
          0
        );
        const reste = Math.max(0, prix - totalPaye);

        if (reste > 0) {
          patientTotalCredit += reste;
          unpaidConsultations.push({
            id: c.id,
            createdAt: c.createdAt,
            motif: c.motifDeConsultation || c.note || "Consultation générale",
            prix,
            totalPaye,
            reste,
          });
        }
      });

      // ONLY include patients who have at least one consultation with credit > 0
      if (unpaidConsultations.length > 0 && patientTotalCredit > 0) {
        debtors.push({
          id: p.id,
          nom: p.nom,
          telephone: p.telephone || null,
          totalCredit: patientTotalCredit,
          unpaidConsultations,
        });
      }
    });

    // Sort by largest credit first or alphabetical
    debtors.sort((a, b) => b.totalCredit - a.totalCredit);

    return NextResponse.json({
      debtors,
      totalDebtors: debtors.length,
      globalCredit: debtors.reduce((sum, d) => sum + d.totalCredit, 0),
    });
  } catch (error) {
    console.error("GET /api/finance/debtors error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des patients avec solde débiteur." },
      { status: 500 }
    );
  }
}
