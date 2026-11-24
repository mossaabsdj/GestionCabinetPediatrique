import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ============================================
// GET /api/versements - List payments
// Supports query by patientId, consultationId, date range
// ============================================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId")
      ? parseInt(searchParams.get("patientId"))
      : undefined;
    const consultationId = searchParams.get("consultationId")
      ? parseInt(searchParams.get("consultationId"))
      : undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")) : undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")) : 1;

    const where = {};
    if (patientId) where.patientId = patientId;
    if (consultationId) where.consultationId = consultationId;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const total = await prisma.versement.count({ where });

    const versements = await prisma.versement.findMany({
      where,
      include: {
        patient: {
          select: { id: true, nom: true, telephone: true },
        },
        consultation: {
          select: {
            id: true,
            createdAt: true,
            prix: true,
            motifDeConsultation: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: limit,
      skip: limit && page > 1 ? (page - 1) * limit : undefined,
    });

    const sumResult = await prisma.versement.aggregate({
      where,
      _sum: { montant: true },
    });

    return NextResponse.json({
      versements,
      total,
      totalMontant: sumResult._sum.montant || 0,
      page,
      totalPages: limit ? Math.ceil(total / limit) : 1,
    });
  } catch (error) {
    console.error("GET /api/versements error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des versements." },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/versements - Record a new payment
// STRICT RULE: Must be linked to an existing consultation!
// ============================================
export async function POST(req) {
  try {
    const body = await req.json();

    const montant = parseFloat(body.montant);
    const consultationId = parseInt(body.consultationId);
    let patientId = body.patientId ? parseInt(body.patientId) : undefined;
    const date = body.date ? new Date(body.date) : new Date();
    const note = body.note?.trim() || null;

    // 1. Validate consultation ID presence
    if (isNaN(consultationId) || consultationId <= 0) {
      return NextResponse.json(
        { error: "Règle stricte: Tout versement doit être obligatoirement rattaché à une consultation valide." },
        { status: 400 }
      );
    }

    // 2. Validate positive amount
    if (isNaN(montant) || montant <= 0) {
      return NextResponse.json(
        { error: "Le montant du versement doit être supérieur à zéro." },
        { status: 400 }
      );
    }

    // 3. Verify consultation exists and retrieve its details & existing payments
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        versements: true,
        patient: { select: { id: true, nom: true } },
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: "La consultation spécifiée est introuvable." },
        { status: 404 }
      );
    }

    // If patientId was passed, verify it matches the consultation's patient
    if (patientId && patientId !== consultation.patientId) {
      return NextResponse.json(
        { error: "Incohérence: Le patient spécifié ne correspond pas au patient de cette consultation." },
        { status: 400 }
      );
    }
    patientId = consultation.patientId;

    // 4. Calculate total already paid and handle consultation price flexibly
    let consultationPrice =
      consultation.prix !== null && consultation.prix !== undefined
        ? Number(consultation.prix)
        : 0;

    // If an explicit consultation price was passed in request, apply it if valid
    if (body.prix !== undefined && body.prix !== null && !isNaN(parseFloat(body.prix))) {
      const explicitPrice = Math.max(0, parseFloat(body.prix));
      if (explicitPrice > 0) {
        consultationPrice = explicitPrice;
      }
    }

    const alreadyPaid = consultation.versements.reduce(
      (acc, v) => acc + (Number(v.montant) || 0),
      0
    );

    // If consultation price was 0 or if the payment exceeds the current price,
    // automatically adjust consultation.prix so the payment is accepted without error!
    if (consultationPrice < alreadyPaid + montant) {
      consultationPrice = alreadyPaid + montant;
    }

    // Persist updated consultation price if it changed
    if (consultationPrice !== consultation.prix) {
      await prisma.consultation.update({
        where: { id: consultationId },
        data: { prix: consultationPrice },
      });
    }

    const remainingBalance = Math.max(0, consultationPrice - alreadyPaid);

    // 6. Create versement
    const versement = await prisma.versement.create({
      data: {
        montant,
        date,
        note,
        patientId,
        consultationId,
      },
      include: {
        patient: { select: { id: true, nom: true } },
        consultation: { select: { id: true, prix: true, createdAt: true } },
      },
    });

    const newTotalPaid = alreadyPaid + montant;
    const newRemaining = Math.max(0, consultationPrice - newTotalPaid);

    return NextResponse.json(
      {
        versement,
        consultationSummary: {
          consultationId,
          prix: consultationPrice,
          totalPaye: newTotalPaid,
          reste: newRemaining,
          statut: newRemaining <= 0 ? "paye" : newTotalPaid > 0 ? "partiel" : "impaye",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/versements error:", error);
    return NextResponse.json(
      { error: "Échec de l'enregistrement du versement." },
      { status: 500 }
    );
  }
}
