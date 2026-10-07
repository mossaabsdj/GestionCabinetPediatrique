import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// =====================
// GET /api/patients
// =====================

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id"); // optional patient ID

    if (id) {
      // Fetch a single patient by ID
      const patient = await prisma.patient.findUnique({
        where: { id: Number(id) }, // or id if UUID
        include: {
          consultations: {
            orderBy: { createdAt: "desc" },
            include: {
              ordonnance: {
                include: {
                  items: {
                    include: { medicament: true },
                  },
                },
              },
              bilanRecip: {
                include: {
                  items: {
                    include: { bilan: true },
                  },
                },
              },
              justificationRecord: true,
              courbeInfo: true,
              rendezVous: {
                select: { id: true, date: true, description: true },
              },
              radios: true,
              bilansFiles: true,
            },
          },
          ordonnances: {
            orderBy: { createdAt: "desc" },
            include: {
              items: {
                include: { medicament: true },
              },
            },
          },
          bilans: {
            orderBy: { createdAt: "desc" },
            include: {
              items: {
                include: { bilan: true },
              },
            },
          },
          paiements: {
            orderBy: { date: "desc" },
          },
          courbeInfos: {
            orderBy: { createdAt: "asc" },
          },
          vaccinations: {
            orderBy: { dateGiven: "desc" },
            include: {
              vaccine: true,
            },
          },
          radios: {
            orderBy: { createdAt: "desc" },
          },
          bilanFiles: {
            orderBy: { createdAt: "desc" },
          },
          justifications: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Patient non trouvé" },
          { status: 404 },
        );
      }

      return NextResponse.json(patient);
    } else {
      // Fetch all patients
      const patients = await prisma.patient.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          consultations: false,
          ordonnances: false,
          bilans: false,
          paiements: false,
        },
      });
      return NextResponse.json(patients);
    }
  } catch (error) {
    console.error("❌ Error fetching patients:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des patients" },
      { status: 500 },
    );
  }
}

// =====================
// POST /api/patients
// =====================
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      nom,
      age,
      telephone,
      adresse,
      antecedents,
      groupeSanguin,
      poidsDeNaissance,
      dateDeNaissance,
      sexe,
    } = body;

    if (!nom || nom.trim() === "") {
      return NextResponse.json({ error: "Nom est requis" }, { status: 400 });
    }

    // Check unique nom
    const existing = await prisma.patient.findUnique({
      where: { nom: nom.trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Un patient avec ce nom existe déjà." },
        { status: 400 },
      );
    }

    const validBirthDate =
      dateDeNaissance && !isNaN(new Date(dateDeNaissance).getTime())
        ? new Date(dateDeNaissance)
        : new Date();

    const patient = await prisma.patient.create({
      data: {
        nom: nom.trim(),
        age:
          age !== undefined && age !== null && age !== ""
            ? parseInt(age)
            : null,
        sexe: sexe && sexe.trim() ? sexe.trim() : "Non spécifié",
        telephone: telephone ? telephone.trim() : null,
        adresse: adresse ? adresse.trim() : null,
        antecedents: antecedents ? antecedents.trim() : null,
        groupeSanguin: groupeSanguin || null,
        dateDeNaissance: validBirthDate,
        poidsDeNaissance:
          poidsDeNaissance !== undefined &&
          poidsDeNaissance !== null &&
          poidsDeNaissance !== ""
            ? parseFloat(poidsDeNaissance)
            : null,
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("❌ Error creating patient:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du patient: " + error.message },
      { status: 500 },
    );
  }
}

// =====================
// PUT /api/patients
// =====================
export async function PUT(req) {
  try {
    const body = await req.json();
    const {
      id,
      nom,
      age,
      telephone,
      poidsDeNaissance,
      dateDeNaissance,
      sexe,
      adresse,
      antecedents,
      groupeSanguin,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant du patient (ID) est requis" },
        { status: 400 },
      );
    }

    const dataToUpdate = {};

    if (nom !== undefined) {
      if (!nom || nom.trim() === "") {
        return NextResponse.json(
          { error: "Le nom ne peut pas être vide" },
          { status: 400 },
        );
      }
      dataToUpdate.nom = nom.trim();
    }

    if (sexe !== undefined && sexe !== null && sexe !== "") {
      dataToUpdate.sexe = sexe.trim();
    }

    if (age !== undefined) {
      dataToUpdate.age = age !== null && age !== "" ? parseInt(age) : null;
    }

    if (telephone !== undefined) {
      dataToUpdate.telephone = telephone ? telephone.trim() : null;
    }

    if (adresse !== undefined) {
      dataToUpdate.adresse = adresse ? adresse.trim() : null;
    }

    if (antecedents !== undefined) {
      dataToUpdate.antecedents = antecedents ? antecedents.trim() : null;
    }

    if (groupeSanguin !== undefined) {
      dataToUpdate.groupeSanguin = groupeSanguin || null;
    }

    if (poidsDeNaissance !== undefined) {
      dataToUpdate.poidsDeNaissance =
        poidsDeNaissance !== null && poidsDeNaissance !== ""
          ? parseFloat(poidsDeNaissance)
          : null;
    }

    if (
      dateDeNaissance !== undefined &&
      dateDeNaissance !== null &&
      dateDeNaissance !== ""
    ) {
      const parsedDate = new Date(dateDeNaissance);
      if (!isNaN(parsedDate.getTime())) {
        dataToUpdate.dateDeNaissance = parsedDate;
      }
    }

    const updated = await prisma.patient.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Error updating patient:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du patient: " + error.message },
      { status: 500 },
    );
  }
}

// =====================
// DELETE /api/patients?id=1
// =====================
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID du patient requis" },
        { status: 400 },
      );
    }

    await prisma.patient.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: "Patient supprimé avec succès" });
  } catch (error) {
    console.error("❌ Error deleting patient:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du patient" },
      { status: 500 },
    );
  }
}
