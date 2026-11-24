import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ============================================
// GET /api/depenses - List expenses with filters
// ============================================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")) : undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")) : 1;

    const where = {};

    if (search) {
      where.description = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const total = await prisma.depense.count({ where });

    const depenses = await prisma.depense.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      skip: limit && page > 1 ? (page - 1) * limit : undefined,
    });

    const sumResult = await prisma.depense.aggregate({
      where,
      _sum: { montant: true },
    });

    return NextResponse.json({
      depenses,
      total,
      totalMontant: sumResult._sum.montant || 0,
      page,
      totalPages: limit ? Math.ceil(total / limit) : 1,
    });
  } catch (error) {
    console.error("GET /api/depenses error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des dépenses." },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/depenses - Create a new expense
// ============================================
export async function POST(req) {
  try {
    const body = await req.json();

    const montant = parseFloat(body.montant);
    const description = body.description?.trim();
    const date = body.date ? new Date(body.date) : new Date();

    if (isNaN(montant) || montant <= 0) {
      return NextResponse.json(
        { error: "Le montant de la dépense doit être un nombre positif supérieur à zéro." },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: "La description de la dépense est obligatoire." },
        { status: 400 }
      );
    }

    const depense = await prisma.depense.create({
      data: {
        montant,
        description,
        date,
      },
    });

    return NextResponse.json(depense, { status: 201 });
  } catch (error) {
    console.error("POST /api/depenses error:", error);
    return NextResponse.json(
      { error: "Échec de l'enregistrement de la dépense." },
      { status: 500 }
    );
  }
}
