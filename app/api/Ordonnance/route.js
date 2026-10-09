import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// =========================
// ✅ GET all or by patientId
// =========================
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    const ordonnances = await prisma.ordonnance.findMany({
      where: patientId ? { patientId: Number(patientId) } : {},
      include: {
        patient: true,
        consultation: true,
        items: {
          include: { medicament: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(ordonnances);
  } catch (error) {
    console.error("❌ Error fetching ordonnances:", error);
    return NextResponse.json(
      { error: "Failed to fetch ordonnances" },
      { status: 500 },
    );
  }
}

// =========================
// ✅ POST create ordonnance
// =========================
export async function POST(request) {
  try {
    const body = await request.json();
    const { patientId, consultationId, items } = body;

    if (!patientId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "patientId and at least one item are required" },
        { status: 400 },
      );
    }

    const newOrdonnance = await prisma.ordonnance.create({
      data: {
        patientId,
        consultationId: consultationId || null,
        items: {
          create: items.map((item) => ({
            medicamentId: item.medicamentId,
            dosage: item.dosage,
            frequence: item.frequence,
            duree: item.duree,
            quantite: item.quantite,
          })),
        },
      },
      include: {
        patient: true,
        consultation: true,
        items: { include: { medicament: true } },
      },
    });

    return NextResponse.json(newOrdonnance);
  } catch (error) {
    console.error("❌ Error creating ordonnance:", error);
    return NextResponse.json(
      { error: "Failed to create ordonnance" },
      { status: 500 },
    );
  }
}

// =========================
// ✅ PUT update ordonnance
// =========================
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, patientId, consultationId, items } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Ordonnance ID is required for update" },
        { status: 400 },
      );
    }

    const ordonnanceId = Number(id);

    // 🧹 Delete existing items before updating
    await prisma.ordonnanceItem.deleteMany({
      where: { ordonnanceId },
    });

    const updateData = {
      items: {
        create: (items || []).map((item) => ({
          medicamentId: Number(item.medicamentId),
          dosage: item.dosage || null,
          frequence: item.frequence || null,
          duree: item.duree || null,
          quantite: item.quantite ? Number(item.quantite) : 1,
        })),
      },
    };

    if (patientId) {
      updateData.patientId = Number(patientId);
    }
    if (consultationId) {
      updateData.consultationId = Number(consultationId);
    }

    // 🔁 Update ordonnance and re-create items
    const updatedOrdonnance = await prisma.ordonnance.update({
      where: { id: ordonnanceId },
      data: updateData,
      include: {
        patient: true,
        consultation: true,
        items: { include: { medicament: true } },
      },
    });

    return NextResponse.json(updatedOrdonnance);
  } catch (error) {
    console.error("❌ Error updating ordonnance:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update ordonnance" },
      { status: 500 },
    );
  }
}

// =========================
// ✅ DELETE ordonnance
// =========================
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Ordonnance ID is required for delete" },
        { status: 400 },
      );
    }

    // 🧹 Delete items first (cascade)
    await prisma.ordonnanceItem.deleteMany({
      where: { ordonnanceId: Number(id) },
    });

    // 🗑 Delete ordonnance
    await prisma.ordonnance.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Ordonnance deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting ordonnance:", error);
    return NextResponse.json(
      { error: "Failed to delete ordonnance" },
      { status: 500 },
    );
  }
}
