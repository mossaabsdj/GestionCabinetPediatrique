import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_CABINET_DATA = {
  title: "Cabinet Pédiatrique",
  doctorName: "Professeur",
  doctorNameAr: "بروفيسور",
  specialty: "Médecin Spécialiste en Pédiatrie et Néonatologie",
  specialtyAr: "طبيبة مختصة في طب الأطفال و حديثي الولادة",
  cabinetName: "Cabinet Pédiatrique",
  cabinetNameAr: "عيادة طب الأطفال",
  address: "Rue Frères KAFI logts 38, 1er étage",
  addressAr: "شارع الإخوة كافي عقار 38 الطابق الأول",
  city: "El-Harrouch SKIKDA",
  cityAr: "(بزاز لعلاوي) الحروش - سكيكدة",
  phones: "0652 76 89 72 / 0562 24 40 87",
  logo: "/uploads/image.PNG",
  numOrdre: "8130/23",
  defaultConsultationPrice: 2000,
};

// =========================
// GET: Fetch cabinet settings
// =========================
export async function GET() {
  try {
    let cabinet = await prisma.cabinet.findFirst();

    if (!cabinet) {
      // Auto-seed default cabinet row if not found
      cabinet = await prisma.cabinet.create({
        data: DEFAULT_CABINET_DATA,
      });
    }

    return NextResponse.json({
      ...cabinet,
      appName: cabinet.title || DEFAULT_CABINET_DATA.title,
    });
  } catch (error) {
    console.error("GET /api/cabinet error:", error);
    // Fallback to default in case of DB read error
    return NextResponse.json(
      {
        ...DEFAULT_CABINET_DATA,
        appName: DEFAULT_CABINET_DATA.title,
      },
      { status: 200 }
    );
  }
}

// =========================
// PUT / POST: Update cabinet settings
// =========================
export async function PUT(req) {
  try {
    const body = await req.json();

    const existing = await prisma.cabinet.findFirst();

    let logoValue = (body.logo || "").trim();
    if (logoValue) {
      logoValue = logoValue.split(/[?#]/)[0].trim();
      if (
        !logoValue.startsWith("/") &&
        !logoValue.startsWith("data:") &&
        !logoValue.startsWith("http://") &&
        !logoValue.startsWith("https://")
      ) {
        logoValue = `/uploads/${logoValue.replace(/^uploads[\\/]/, "")}`;
      }
    } else {
      logoValue = existing?.logo || "/uploads/image.PNG";
    }

    const appTitle = (
      body.title ||
      body.appName ||
      existing?.title ||
      DEFAULT_CABINET_DATA.title
    ).trim();

    const dataToSave = {
      title: appTitle,
      doctorName: body.doctorName?.trim() || "Professeur",
      doctorNameAr: body.doctorNameAr?.trim() || "بروفيسور",
      specialty:
        body.specialty?.trim() ||
        "Médecin Spécialiste en Pédiatrie et Néonatologie",
      specialtyAr:
        body.specialtyAr?.trim() || "طبيبة مختصة في طب الأطفال و حديثي الولادة",
      cabinetName: body.cabinetName?.trim() || "Cabinet Pédiatrique",
      cabinetNameAr: body.cabinetNameAr?.trim() || "عيادة طب الأطفال",
      address:
        body.address?.trim() || "Rue Frères KAFI logts 38, 1er étage",
      addressAr:
        body.addressAr?.trim() || "شارع الإخوة كافي عقار 38 الطابق الأول",
      city: body.city?.trim() || "El-Harrouch SKIKDA",
      cityAr: body.cityAr?.trim() || "(بزاز لعلاوي) الحروش - سكيكدة",
      phones:
        body.phones?.trim() || "0652 76 89 72 / 0562 24 40 87",
      logo: logoValue,
      numOrdre:
        body.numOrdre !== undefined
          ? String(body.numOrdre).trim()
          : (existing?.numOrdre || "8130/23"),
      defaultConsultationPrice:
        body.defaultConsultationPrice !== undefined
          ? Math.max(0, parseFloat(body.defaultConsultationPrice) || 0)
          : (existing?.defaultConsultationPrice ?? 2000),
    };

    let updated;
    if (existing) {
      updated = await prisma.cabinet.update({
        where: { id: existing.id },
        data: dataToSave,
      });
    } else {
      updated = await prisma.cabinet.create({
        data: dataToSave,
      });
    }

    return NextResponse.json({
      ...updated,
      appName: updated.title,
    });
  } catch (error) {
    console.error("PUT /api/cabinet error:", error);
    return NextResponse.json(
      { error: "Échec de la mise à jour des paramètres du cabinet." },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  return PUT(req);
}
