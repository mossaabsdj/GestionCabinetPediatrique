import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ============================================
// GET /api/versements/[id] - Fetch single payment
// ============================================
export async function GET(req, { params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    }

    const versement = await prisma.versement.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, nom: true } },
        consultation: { select: { id: true, prix: true, createdAt: true } },
      },
    });

    if (!versement) {
      return NextResponse.json({ error: "Versement introuvable." }, { status: 404 });
    }

    return NextResponse.json(versement);
  } catch (error) {
    console.error("GET /api/versements/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ============================================
// PUT /api/versements/[id] - Update a payment
// Re-validates against consultation's remaining balance
// ============================================
export async function PUT(req, { params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    }

    const current = await prisma.versement.findUnique({
      where: { id },
      include: {
        consultation: {
          include: { versements: true },
        },
      },
    });

    if (!current) {
      return NextResponse.json({ error: "Versement introuvable." }, { status: 404 });
    }

    const body = await req.json();
    const montant = parseFloat(body.montant);
    const date = body.date ? new Date(body.date) : undefined;
    const note = body.note !== undefined ? body.note?.trim() || null : undefined;

    if (isNaN(montant) || montant <= 0) {
      return NextResponse.json(
        { error: "Le montant du versement doit être supérieur à zéro." },
        { status: 400 }
      );
    }

    // Check balance excluding this versement
    const consultationPrice = current.consultation.prix ?? 0;
    const otherPaid = current.consultation.versements
      .filter((v) => v.id !== id)
      .reduce((sum, v) => sum + (v.montant || 0), 0);
    const maxAllowed = Math.max(0, consultationPrice - otherPaid);

    if (montant > maxAllowed + 0.01) {
      return NextResponse.json(
        {
          error: `Le montant modifié (${montant.toLocaleString()} DZD) dépasse le reste à payer maximum (${maxAllowed.toLocaleString()} DZD).`,
          maxAllowed,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.versement.update({
      where: { id },
      data: {
        montant,
        ...(date ? { date } : {}),
        ...(note !== undefined ? { note } : {}),
      },
      include: {
        patient: { select: { id: true, nom: true } },
        consultation: { select: { id: true, prix: true, createdAt: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/versements/[id] error:", error);
    return NextResponse.json(
      { error: "Échec de la modification du versement." },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/versements/[id] - Delete a payment
// ============================================
export async function DELETE(req, { params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    }

    await prisma.versement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Versement supprimé avec succès." });
  } catch (error) {
    console.error("DELETE /api/versements/[id] error:", error);
    return NextResponse.json(
      { error: "Échec de la suppression du versement." },
      { status: 500 }
    );
  }
}
