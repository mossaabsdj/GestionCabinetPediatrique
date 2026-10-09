import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/age";

export const dynamic = "force-dynamic";

// ====================
// GET consultations (all or by patientId)
// ====================
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  try {
    const consultations = await prisma.consultation.findMany({
      where: patientId ? { patientId: Number(patientId) } : {},
      include: {
        radios: true,
        bilansFiles: true,
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
        patient: { select: { id: true, nom: true } },
        rendezVous: { select: { id: true, date: true, description: true } }, // ✅ new relation
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(consultations);
  } catch (error) {
    console.error("GET consultations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consultations" },
      { status: 500 },
    );
  }
}

// ====================
// POST: Create new consultation
// ====================
export async function POST(req) {
  try {
    const data = await req.json();

    // Convert numeric types safely
    const taille = data.taille ? parseFloat(data.taille) : null;
    const poids = data.poids ? parseFloat(data.poids) : null;
    const tensionSystolique = data.tensionSystolique
      ? parseInt(data.tensionSystolique)
      : null;
    const tensionDiastolique = data.tensionDiastolique
      ? parseInt(data.tensionDiastolique)
      : null;
    const temperature = data.temperature ? parseFloat(data.temperature) : null;
    const frequenceCardiaque = data.frequenceCardiaque
      ? parseInt(data.frequenceCardiaque)
      : null;
    const frequenceRespiratoire = data.frequenceRespiratoire
      ? parseInt(data.frequenceRespiratoire)
      : null;
    const saturationOxygene = data.saturationOxygene
      ? parseInt(data.saturationOxygene)
      : null;
    const glycemie = data.glycemie ? parseFloat(data.glycemie) : null;
    const perimetreCranien = data.perimetreCranien
      ? parseFloat(data.perimetreCranien)
      : null;

    // ✅ Fetch patient to calculate age for CourbeInfo
    const patientRecord = await prisma.patient.findUnique({
      where: { id: Number(data.patientId) },
      select: { id: true, dateDeNaissance: true },
    });

    const consultDate = data.createdAt ? new Date(data.createdAt) : new Date();
    const calculatedAge = patientRecord
      ? calculateAge(patientRecord.dateDeNaissance, consultDate)
      : null;

    const hasGrowthData = poids !== null || taille !== null || perimetreCranien !== null;

    // ✅ Auto-create RendezVous if not provided
    let rendezVousId = data.rendezVousId ? Number(data.rendezVousId) : null;

    if (!rendezVousId && data.rendezVousDate) {
      const rendezVous = await prisma.rendezVous.create({
        data: {
          date: new Date(data.rendezVousDate),
          description: data.rendezVousDescription || "Consultation programmée",
        },
      });
      rendezVousId = rendezVous.id;
    }

    const consultation = await prisma.consultation.create({
      data: {
        patientId: data.patientId,
        note: data.note,
        taille,
        poids,
        createdAt: consultDate,

        tensionSystolique,
        tensionDiastolique,
        temperature,
        frequenceCardiaque,
        frequenceRespiratoire,
        saturationOxygene,
        glycemie,
        developpementPsychomoteur: data.developpementPsychomoteur || null,
        motifDeConsultation: data.motifDeConsultation || null,
        justification: typeof data.justification === "string" ? data.justification : null,
        perimetreCranien,
        rendezVousId, // ✅ now always set if date given

        // ✅ CourbeInfo automatic creation if at least one measurement is provided
        courbeInfo: hasGrowthData
          ? {
              create: {
                patientId: Number(data.patientId),
                age: calculatedAge,
                poids,
                taille,
                perimetreCranien,
                createdAt: consultDate,
              },
            }
          : undefined,

        // ✅ Justification
        justificationRecord: (data.justificationRecord || (typeof data.justification === "object" && data.justification !== null))
          ? {
              create: {
                patientId: Number(data.patientId),
                createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
                texte: (data.justificationRecord || data.justification).texte || "",
              },
            }
          : undefined,

        // ✅ Ordonnance
        ordonnance: data.ordonnance
          ? {
              create: {
                createdAt: data.createdAt
                  ? new Date(data.createdAt)
                  : undefined,

                patientId: data.patientId,
                items: {
                  create: data.ordonnance.items.map((item) => ({
                    medicamentId: item.medicamentId,
                    dosage: item.dosage,
                    frequence: item.frequence,
                    duree: item.duree,
                    quantite: parseInt(item.quantite) || 0,
                  })),
                },
              },
            }
          : undefined,

        // ✅ BilanRecip
        bilanRecip: data.bilanRecip
          ? {
              create: {
                createdAt: data.createdAt
                  ? new Date(data.createdAt)
                  : undefined,

                patientId: data.patientId,
                items: {
                  create: data.bilanRecip.items.map((item) => ({
                    bilanId: item.bilanId,
                    resultat: item.resultat,
                    remarque: item.remarque,
                  })),
                },
              },
            }
          : undefined,

        // ✅ Radios
        radios: Array.isArray(data.radios) && data.radios.length > 0
          ? {
              create: data.radios
                .filter((r) => r && (r.fichier || r.description))
                .map((r) => ({
                  patientId: Number(data.patientId),
                  description: r.description || null,
                  fichier: r.fichier || null,
                })),
            }
          : undefined,
      },
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
        rendezVous: true,
        radios: true,
      },
    });

    return NextResponse.json(consultation);
  } catch (error) {
    console.error("POST consultation error:", error);
    return NextResponse.json(
      { error: "Failed to create consultation" },
      { status: 500 },
    );
  }
}

// ====================
// PUT: Update consultation
// ====================
export async function PUT(req) {
  try {
    const data = await req.json();
    const {
      id,
      patientId,
      note,
      taille,
      createdAt,

      poids,
      tensionSystolique,
      tensionDiastolique,
      temperature,
      frequenceCardiaque,
      frequenceRespiratoire,
      saturationOxygene,
      glycemie,
      developpementPsychomoteur,
      motifDeConsultation,
      justification,
      justificationRecord,
      perimetreCranien,
      rendezVousId,
      rendezVousDate,
      rendezVousDescription,
      radios,
    } = data;

    if (!id) {
      return NextResponse.json(
        { error: "L'ID de la consultation est requis" },
        { status: 400 },
      );
    }

    // ✅ Build main consultation update data
    const updateData = {
      ...(patientId !== undefined && {
        patient: { connect: { id: Number(patientId) } },
      }),
      ...(note !== undefined && { note }),
      ...(taille !== undefined && {
        taille: taille ? parseFloat(taille) : null,
      }),
      ...(poids !== undefined && { poids: poids ? parseFloat(poids) : null }),
      ...(tensionSystolique !== undefined && {
        tensionSystolique: tensionSystolique
          ? parseInt(tensionSystolique)
          : null,
      }),
      ...(tensionDiastolique !== undefined && {
        tensionDiastolique: tensionDiastolique
          ? parseInt(tensionDiastolique)
          : null,
      }),
      ...(temperature !== undefined && {
        temperature: temperature ? parseFloat(temperature) : null,
      }),
      ...(frequenceCardiaque !== undefined && {
        frequenceCardiaque: frequenceCardiaque
          ? parseInt(frequenceCardiaque)
          : null,
      }),
      ...(frequenceRespiratoire !== undefined && {
        frequenceRespiratoire: frequenceRespiratoire
          ? parseInt(frequenceRespiratoire)
          : null,
      }),
      ...(saturationOxygene !== undefined && {
        saturationOxygene: saturationOxygene
          ? parseInt(saturationOxygene)
          : null,
      }),
      ...(glycemie !== undefined && {
        glycemie: glycemie ? parseFloat(glycemie) : null,
      }),
      ...(developpementPsychomoteur !== undefined && {
        developpementPsychomoteur,
      }),
      ...(motifDeConsultation !== undefined && { motifDeConsultation }),
      ...(typeof justification === "string" && { justification }),
      ...(perimetreCranien !== undefined && {
        perimetreCranien: perimetreCranien
          ? parseFloat(perimetreCranien)
          : null,
      }),
      ...(createdAt && { createdAt: new Date(createdAt) }),
    };

    // ✅ Handle RendezVous (update or create)
    if (rendezVousDate || rendezVousDescription) {
      if (rendezVousId) {
        // Update existing rendezvous
        await prisma.rendezVous.update({
          where: { id: Number(rendezVousId) },
          data: {
            ...(rendezVousDate && { date: new Date(rendezVousDate) }),
            description: rendezVousDescription || "",
          },
        });
      } else {
        // Create a new rendezvous
        const newRendezVous = await prisma.rendezVous.create({
          data: {
            date: rendezVousDate ? new Date(rendezVousDate) : new Date(),
            description: rendezVousDescription || "",
          },
        });
        updateData.rendezVous = { connect: { id: newRendezVous.id } };
      }
    } else if (rendezVousId) {
      // Clear existing rendezvous
      updateData.rendezVous = { disconnect: true }; // or delete if you want to remove
    }

    // ✅ Handle Justification update / upsert
    const justifPayload = justificationRecord || (typeof justification === "object" && justification !== null ? justification : undefined);
    if (justifPayload !== undefined) {
      if (justifPayload && justifPayload.texte) {
        const resolvedPatientId = patientId ? Number(patientId) : (await prisma.consultation.findUnique({ where: { id: Number(id) }, select: { patientId: true } }))?.patientId;
        await prisma.justification.upsert({
          where: { consultationId: Number(id) },
          create: {
            consultationId: Number(id),
            patientId: Number(resolvedPatientId),
            texte: justifPayload.texte,
          },
          update: {
            texte: justifPayload.texte,
          },
        });
      } else if (justifPayload === null) {
        await prisma.justification.deleteMany({
          where: { consultationId: Number(id) },
        });
      }
    }

    // ✅ Handle Radios
    if (Array.isArray(radios)) {
      const existingRadios = await prisma.radio.findMany({
        where: { consultationId: Number(id) },
        select: { id: true },
      });
      const keptIds = radios.filter((r) => r.id).map((r) => Number(r.id));
      const toDelete = existingRadios.filter((r) => !keptIds.includes(r.id));
      for (const del of toDelete) {
        await prisma.radio.delete({ where: { id: del.id } });
      }

      for (const r of radios) {
        if (!r.id && (r.fichier || r.description)) {
          const resolvedPatId = patientId
            ? Number(patientId)
            : (
                await prisma.consultation.findUnique({
                  where: { id: Number(id) },
                  select: { patientId: true },
                })
              )?.patientId;
          await prisma.radio.create({
            data: {
              consultationId: Number(id),
              patientId: Number(resolvedPatId),
              description: r.description || null,
              fichier: r.fichier || null,
            },
          });
        } else if (r.id) {
          await prisma.radio.update({
            where: { id: Number(r.id) },
            data: {
              description: r.description || null,
              fichier: r.fichier || null,
            },
          });
        }
      }
    }

    // ✅ Update consultation with new data
    const updated = await prisma.consultation.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        patient: { select: { id: true, dateDeNaissance: true } },
        rendezVous: true,
        justificationRecord: true,
        courbeInfo: true,
        radios: true,
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
      },
    });

    // ✅ Synchronize CourbeInfo with updated consultation values
    const hasAnyGrowth =
      updated.poids !== null ||
      updated.taille !== null ||
      updated.perimetreCranien !== null;

    if (hasAnyGrowth) {
      const birthDate = updated.patient?.dateDeNaissance;
      const computedAge = calculateAge(birthDate, updated.createdAt);

      await prisma.courbeInfo.upsert({
        where: { consultationId: Number(id) },
        create: {
          patientId: updated.patientId,
          consultationId: Number(id),
          age: computedAge,
          poids: updated.poids,
          taille: updated.taille,
          perimetreCranien: updated.perimetreCranien,
          createdAt: updated.createdAt,
        },
        update: {
          age: computedAge,
          poids: updated.poids,
          taille: updated.taille,
          perimetreCranien: updated.perimetreCranien,
          createdAt: updated.createdAt,
        },
      });
    } else {
      // If all growth parameters were removed, remove the associated CourbeInfo
      await prisma.courbeInfo.deleteMany({
        where: { consultationId: Number(id) },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ PUT consultation error:", error);
    return NextResponse.json(
      { error: "Échec de la mise à jour de la consultation" },
      { status: 500 },
    );
  }
}

// ====================
// DELETE: Delete consultation + related data
// ====================
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.ordonnanceItem.deleteMany({
        where: {
          ordonnance: { consultationId: Number(id) },
        },
      }),
      prisma.bilanItem.deleteMany({
        where: {
          bilanRecip: { consultationId: Number(id) },
        },
      }),
      prisma.radio.deleteMany({ where: { consultationId: Number(id) } }),
      prisma.bilanFile.deleteMany({ where: { consultationId: Number(id) } }),
      prisma.justification.deleteMany({ where: { consultationId: Number(id) } }),
      prisma.courbeInfo.deleteMany({ where: { consultationId: Number(id) } }),
      prisma.ordonnance.deleteMany({ where: { consultationId: Number(id) } }),
      prisma.bilanRecip.deleteMany({ where: { consultationId: Number(id) } }),
      prisma.consultation.delete({ where: { id: Number(id) } }),
    ]);

    return NextResponse.json({ message: "Consultation deleted successfully" });
  } catch (error) {
    console.error("DELETE consultation error:", error);
    return NextResponse.json(
      { error: "Failed to delete consultation" },
      { status: 500 },
    );
  }
}
