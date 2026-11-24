import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ============================================
// GET /api/depenses/[id] - Fetch single expense
// ============================================
export async function GET(req, { params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    }

    const depense = await prisma.depense.findUnique({
      where: { id },
    });

    if (!depense) {
      return NextResponse.json({ error: "Dépense introuvable." }, { status: 404 });
    }

    return NextResponse.json(depense);
  } catch (error) {
    console.error("GET /api/depenses/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ============================================
// PUT /api/depenses/[id] - Update an expense
// ============================================
export async function PUT(req, { params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    }

    const body = await req.json();
    const montant = parseFloat(body.montant);
    const description = body.description?.trim();
    const date = body.date ? new Date(body.date) : undefined;

    if (isNaN(montant) || montant <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être un nombre positif supérieur à zéro." },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: "La description est obligatoire." },
        { status: 400 }
      );
    }

    const updated = await prisma.depense.update({
      where: { id },
      data: {
        montant,
        description,
        ...(date ? { date } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/depenses/[id] error:", error);
    return NextResponse.json(
      { error: "Échec de la modification de la dépense." },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/depenses/[id] - Delete an expense
// ============================================
export async function DELETE(req, { params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    }

    await prisma.depense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Dépense supprimée avec succès." });
  } catch (error) {
    console.error("DELETE /api/depenses/[id] error:", error);
    return NextResponse.json(
      { error: "Échec de la suppression de la dépense." },
      { status: 500 }
    );
  }
}
