import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import param from "@/param.json";
import path from "path";
import { writeFile, readFile } from "fs/promises";
import { getAppRootDir } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const DEFAULT_CABINET_DATA = {
  title: param.title || "Professeur",
  doctorName: param.doctorName || "Professeur",
  doctorNameAr: param.doctorNameAr || "بروفيسور",
  specialty:
    param.specialty || "Médecin Spécialiste en Pédiatrie et Néonatologie",
  specialtyAr: param.specialtyAr || "طبيبة مختصة في طب الأطفال و حديثي الولادة",
  cabinetName: param.cabinetName || "Cabinet Pédiatrique",
  cabinetNameAr: param.cabinetNameAr || "عيادة طب الأطفال",
  address: param.address || "Rue Frères KAFI logts 38, 1er étage",
  addressAr: param.addressAr || "شارع الإخوة كافي عقار 38 الطابق الأول",
  city: param.city || "El-Harrouch SKIKDA",
  cityAr: param.cityAr || "(بزاز لعلاوي) الحروش - سكيكدة",
  phones: param.phones || "0652 76 89 72 / 0562 24 40 87",
  logo: "/uploads/image.PNG",
  numOrdre: param.numOrdre || "8130/23",
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

    return NextResponse.json(cabinet);
  } catch (error) {
    console.error("GET /api/cabinet error:", error);
    // Fallback to default in case of DB read error
    return NextResponse.json(DEFAULT_CABINET_DATA, { status: 200 });
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
      logoValue = "/uploads/image.PNG";
    }

    const dataToSave = {
      title: body.title?.trim() || "Professeur",
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
      numOrdre: body.numOrdre !== undefined ? String(body.numOrdre).trim() : (param.numOrdre || "8130/23"),
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

    // Synchronize to param.json file if possible
    try {
      const paramPath = path.join(getAppRootDir(), "param.json");
      let currentParam = {};
      try {
        currentParam = JSON.parse(await readFile(paramPath, "utf-8"));
      } catch (e) {}

      const merged = {
        ...currentParam,
        ...dataToSave,
      };
      await writeFile(paramPath, JSON.stringify(merged, null, 2), "utf-8");
    } catch (err) {
      console.warn("Could not sync to param.json:", err);
    }

    return NextResponse.json(updated);
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
