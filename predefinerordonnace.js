const { PrismaClient } = require("./app/generated/prisma");
const prisma = new PrismaClient();

const FORCE = process.argv.includes("--force");

// ------------------------------------------------------------
// DURÉES PROPOSÉES
// ------------------------------------------------------------

const DUREES = [1, 2, 3, 5, 7, 10, 15, 30];
const DUREES_COURTES = [1, 2, 3, 5, 7, 10, 15];

const label = (n) => (n === 1 ? "ce jour" : `${n} jours`);

/**
 * Génère une liste de justifications selon la durée.
 *
 * @param {string} nomBase
 * @param {(n: number) => string} texteFn
 * @param {number[]} durees
 * @returns {{ nom: string, texte: string }[]}
 */
function parDuree(nomBase, texteFn, durees = DUREES) {
  return durees.map((n) => ({
    nom: `${nomBase} - ${label(n)}`,
    texte: texteFn(n),
  }));
}

// ------------------------------------------------------------
// MODÈLES DE JUSTIFICATIONS
// ------------------------------------------------------------

const JUSTIFICATIONS = [
  // ==========================================================
  // 1. REPOS ET ABSENCE
  // ==========================================================

  ...parDuree("Repos à domicile", (n) =>
    n === 1
      ? "Au vu de l'état clinique constaté ce jour, un repos à domicile est médicalement indiqué pour la journée."
      : `Au vu de l'état clinique constaté ce jour, un repos à domicile est médicalement indiqué pour une durée de ${n} jours.`,
  ),

  ...parDuree("Absence scolaire", (n) =>
    n === 1
      ? "L'état de santé de l'enfant justifie une absence scolaire pour la journée. La reprise sera envisagée selon l'évolution clinique."
      : `L'état de santé de l'enfant justifie une absence scolaire pendant ${n} jours. La reprise sera envisagée selon l'évolution clinique.`,
  ),

  ...parDuree(
    "Présence d'un parent auprès de l'enfant",
    (n) =>
      n === 1
        ? "L'état de santé de l'enfant nécessite la présence d'un parent à ses côtés pour la journée."
        : `L'état de santé de l'enfant nécessite la présence d'un parent à ses côtés pendant ${n} jours.`,
    DUREES_COURTES,
  ),

  ...parDuree("Dispense d'éducation physique et sportive", (n) =>
    n === 1
      ? "Une dispense temporaire d'éducation physique et sportive est médicalement indiquée pour la journée."
      : `Une dispense temporaire d'éducation physique et sportive est médicalement indiquée pour ${n} jours.`,
  ),

  ...parDuree("Restriction des activités physiques", (n) =>
    n === 1
      ? "Une limitation temporaire des activités physiques est recommandée ce jour, conformément à l'état clinique de l'enfant."
      : `Une limitation temporaire des activités physiques est recommandée pendant ${n} jours, conformément à l'état clinique de l'enfant.`,
  ),

  ...parDuree("Éviction temporaire de la collectivité", (n) =>
    n === 1
      ? "Une éviction temporaire de la collectivité est médicalement indiquée pour la journée, selon la situation clinique."
      : `Une éviction temporaire de la collectivité est médicalement indiquée pendant ${n} jours, selon la situation clinique.`,
  ),

  ...parDuree("Aménagement temporaire de la scolarité", (n) =>
    n === 1
      ? "Un aménagement temporaire de la scolarité est recommandé pour la journée afin de tenir compte de l'état de santé de l'enfant."
      : `Un aménagement temporaire de la scolarité est recommandé pendant ${n} jours afin de tenir compte de l'état de santé de l'enfant.`,
  ),

  // ==========================================================
  // 2. CERTIFICATS MÉDICAUX
  // ==========================================================

  {
    nom: "Certificat médical - constat clinique",
    texte:
      "L'enfant a été examiné en consultation ce jour. Les constatations cliniques et les conclusions médicales figurent dans le certificat délivré.",
  },

  {
    nom: "Certificat médical - absence justifiée",
    texte:
      "Après examen médical, l'état de santé de l'enfant justifie l'absence pour la période indiquée sur le présent certificat.",
  },

  {
    nom: "Certificat médical - présence parentale",
    texte:
      "Après évaluation de la situation clinique, la présence d'un parent auprès de l'enfant est médicalement justifiée pour la période indiquée.",
  },

  {
    nom: "Certificat médical - suivi nécessaire",
    texte:
      "L'état de santé de l'enfant nécessite un suivi médical adapté, avec réévaluation clinique selon l'évolution et les recommandations du médecin.",
  },

  {
    nom: "Certificat médical - soins en cours",
    texte:
      "L'enfant bénéficie d'une prise en charge médicale nécessitant la poursuite des soins et le suivi de l'évolution clinique.",
  },

  {
    nom: "Certificat médical - reprise des activités",
    texte:
      "Après évaluation clinique ce jour, la reprise des activités habituelles peut être envisagée sous réserve de l'évolution de l'état de santé et du respect des éventuelles restrictions médicales.",
  },

  {
    nom: "Certificat de bonne santé",
    texte:
      "À la date de l'examen, aucune anomalie clinique significative n'a été constatée dans le cadre de l'évaluation réalisée. Cette conclusion est limitée aux éléments examinés ce jour.",
  },

  // ==========================================================
  // 3. REPRISE SCOLAIRE ET COLLECTIVITÉ
  // ==========================================================

  {
    nom: "Reprise scolaire",
    texte:
      "Au vu de l'examen clinique réalisé ce jour, la reprise scolaire peut être envisagée, sous réserve de l'évolution de l'état de santé de l'enfant et des éventuelles recommandations médicales.",
  },

  {
    nom: "Aptitude à la vie en collectivité",
    texte:
      "L'évaluation clinique réalisée ce jour ne met pas en évidence de contre-indication médicale apparente à l'accueil en collectivité, dans les limites de l'examen effectué.",
  },

  {
    nom: "Éviction scolaire - varicelle",
    texte:
      "En cas de varicelle confirmée ou suspectée, l'éviction de la collectivité est à adapter à l'évolution clinique, à l'état général de l'enfant et aux recommandations sanitaires applicables.",
  },

  {
    nom: "Éviction scolaire - angine à streptocoque",
    texte:
      "En cas d'angine à streptocoque confirmée, la durée de l'éviction de la collectivité doit être déterminée selon le traitement instauré, son délai d'efficacité attendu et les recommandations sanitaires en vigueur.",
  },

  {
    nom: "Éviction scolaire - gastro-entérite",
    texte:
      "En présence de vomissements ou de diarrhée, le retour en collectivité doit être envisagé selon l'évolution des symptômes, l'état général de l'enfant et les recommandations sanitaires applicables.",
  },

  {
    nom: "Éviction scolaire - conjonctivite",
    texte:
      "La reprise de la collectivité est à évaluer selon la cause de la conjonctivite, l'évolution des symptômes et les recommandations médicales applicables.",
  },

  {
    nom: "Éviction scolaire - gale ou pédiculose",
    texte:
      "La prise en charge et les conditions de retour en collectivité doivent être adaptées au diagnostic, au traitement réalisé et aux recommandations sanitaires en vigueur.",
  },

  // ==========================================================
  // 4. APTITUDE ET ACTIVITÉS
  // ==========================================================

  {
    nom: "Aptitude à la pratique sportive",
    texte:
      "L'évaluation médicale réalisée ce jour ne met pas en évidence de contre-indication apparente à la pratique sportive dans les conditions examinées. Toute restriction particulière doit être précisée séparément.",
  },

  {
    nom: "Aptitude à la natation",
    texte:
      "L'évaluation clinique réalisée ce jour ne met pas en évidence de contre-indication médicale apparente à la pratique de la natation, dans les limites de l'examen effectué.",
  },

  {
    nom: "Aptitude au voyage",
    texte:
      "Après évaluation clinique ce jour, aucune contre-indication médicale apparente au voyage envisagé n'a été identifiée dans les limites de l'examen effectué. Les besoins particuliers de l'enfant doivent être pris en compte.",
  },

  // ==========================================================
  // 5. VACCINATION
  // ==========================================================

  {
    nom: "Situation vaccinale vérifiée",
    texte:
      "Le statut vaccinal a été vérifié à partir des documents disponibles et évalué au regard du calendrier vaccinal applicable. Les éventuelles vaccinations à réaliser sont précisées dans le dossier médical.",
  },

  {
    nom: "Vaccination conforme au calendrier",
    texte:
      "Après vérification du carnet vaccinal disponible, les vaccinations documentées sont conformes aux échéances applicables à la date du contrôle.",
  },

  {
    nom: "Vaccination à compléter",
    texte:
      "Après vérification des documents vaccinaux disponibles, des vaccinations restent à réaliser ou à compléter selon le calendrier vaccinal applicable. Un rattrapage pourra être organisé selon les recommandations médicales.",
  },

  {
    nom: "Contre-indication vaccinale temporaire",
    texte:
      "Une contre-indication temporaire à la vaccination a été retenue après évaluation médicale. La vaccination devra être réévaluée à l'issue de cette période, selon l'évolution clinique.",
  },

  {
    nom: "Report temporaire de vaccination",
    texte:
      "La vaccination est reportée temporairement sur décision médicale. Une nouvelle évaluation sera réalisée afin de déterminer le moment approprié pour sa réalisation.",
  },

  // ==========================================================
  // 6. ALIMENTATION ET AMÉNAGEMENTS
  // ==========================================================

  {
    nom: "Régime alimentaire adapté",
    texte:
      "Un régime alimentaire adapté est médicalement recommandé au regard de la situation clinique de l'enfant. Les aliments concernés et les modalités pratiques doivent être précisés selon les besoins individuels.",
  },

  {
    nom: "Allergie alimentaire documentée",
    texte:
      "Une allergie alimentaire documentée nécessite des mesures d'éviction adaptées. Les allergènes concernés et les mesures de prévention doivent être précisés afin d'assurer la sécurité de l'enfant en collectivité.",
  },

  {
    nom: "Aménagement scolaire pour raison médicale",
    texte:
      "L'état de santé de l'enfant justifie des aménagements scolaires individualisés. Les mesures recommandées doivent être définies en fonction des besoins cliniques et des possibilités de mise en œuvre par l'établissement.",
  },

  {
    nom: "Aménagement des horaires scolaires",
    texte:
      "Un aménagement temporaire des horaires scolaires peut être nécessaire pour des raisons médicales. Les modalités et la durée de cet aménagement sont à déterminer selon la situation clinique.",
  },

  {
    nom: "Autorisation de prise en charge médicale à l'école",
    texte:
      "Une prise en charge adaptée aux besoins médicaux de l'enfant peut être nécessaire pendant le temps scolaire. Les modalités doivent être précisées par le médecin et organisées avec les responsables concernés, conformément aux règles applicables.",
  },

  // ==========================================================
  // 7. HOSPITALISATION ET ORIENTATION
  // ==========================================================

  {
    nom: "Orientation vers une structure hospitalière",
    texte:
      "Au vu de l'évaluation clinique, une orientation vers une structure hospitalière est recommandée pour une évaluation complémentaire et une prise en charge adaptée.",
  },

  {
    nom: "Hospitalisation médicalement indiquée",
    texte:
      "Au terme de l'évaluation médicale, une hospitalisation est indiquée afin de permettre la surveillance clinique et/ou la réalisation des soins nécessaires.",
  },

  {
    nom: "Orientation vers un spécialiste",
    texte:
      "L'enfant est adressé à un médecin spécialiste pour un avis complémentaire, une évaluation ciblée et, si nécessaire, l'adaptation de la prise en charge.",
  },

  {
    nom: "Examens complémentaires recommandés",
    texte:
      "Des examens complémentaires sont recommandés afin de préciser l'évaluation diagnostique et d'orienter la conduite à tenir selon les constatations cliniques.",
  },

  {
    nom: "Suivi médical rapproché",
    texte:
      "Un suivi médical rapproché est recommandé afin de surveiller l'évolution clinique, d'évaluer la réponse à la prise en charge et d'adapter les soins si nécessaire.",
  },

  {
    nom: "Contrôle médical programmé",
    texte:
      "Un contrôle médical est recommandé à l'échéance définie par le médecin afin de réévaluer l'évolution clinique et la nécessité de poursuivre ou d'adapter la prise en charge.",
  },

  // ==========================================================
  // 8. DOCUMENTS ET SITUATIONS PARTICULIÈRES
  // ==========================================================

  {
    nom: "Certificat de présence en consultation",
    texte:
      "La présence de l'enfant en consultation médicale a été constatée ce jour. Ce document atteste uniquement de la présence à la consultation.",
  },

  {
    nom: "Certificat de suivi pédiatrique",
    texte:
      "L'enfant bénéficie d'un suivi pédiatrique. Les modalités du suivi et les éventuelles recommandations sont consignées dans son dossier médical.",
  },

  {
    nom: "Certificat pour soins réguliers",
    texte:
      "La situation médicale de l'enfant peut nécessiter des consultations ou des soins réguliers. Les absences éventuellement liées à ces soins doivent être appréciées selon les dates et les besoins effectivement constatés.",
  },

  {
    nom: "Certificat médical - document administratif",
    texte:
      "Le présent certificat est établi à la demande du représentant légal, sur la base des constatations médicales réalisées et des informations vérifiées, pour servir et valoir ce que de droit dans les limites de son objet.",
  },
];

// ------------------------------------------------------------
// VALIDATION DES DONNÉES
// ------------------------------------------------------------

function validerJustifications(justifications) {
  const noms = new Set();

  for (const justification of justifications) {
    if (
      !justification ||
      typeof justification.nom !== "string" ||
      typeof justification.texte !== "string" ||
      !justification.nom.trim() ||
      !justification.texte.trim()
    ) {
      throw new Error(
        "Une justification contient un nom ou un texte vide/invalide.",
      );
    }

    if (noms.has(justification.nom)) {
      throw new Error(`Nom de justification dupliqué : "${justification.nom}"`);
    }

    noms.add(justification.nom);
  }
}

// ------------------------------------------------------------
// SEED PRINCIPAL
// ------------------------------------------------------------

async function main() {
  validerJustifications(JUSTIFICATIONS);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let unchanged = 0;

  console.log("Initialisation des justifications médicales...");
  console.log(
    `Mode : ${FORCE ? "mise à jour activée" : "création uniquement"}`,
  );
  console.log(`Modèles à traiter : ${JUSTIFICATIONS.length}`);
  console.log("");

  for (const justification of JUSTIFICATIONS) {
    const nom = justification.nom;
    const texte = justification.texte;

    const existing = await prisma.justificationType.findUnique({
      where: { nom },
    });

    if (!existing) {
      await prisma.justificationType.create({
        data: { nom, texte },
      });

      created++;
      console.log(`+ Créée : ${nom}`);
      continue;
    }

    if (existing.texte === texte) {
      unchanged++;
      continue;
    }

    if (FORCE) {
      await prisma.justificationType.update({
        where: { nom },
        data: { texte },
      });

      updated++;
      console.log(`~ Mise à jour : ${nom}`);
    } else {
      skipped++;
    }
  }

  console.log("");
  console.log("========================================");
  console.log("RÉSULTAT DE L'INITIALISATION");
  console.log("========================================");
  console.log(`Modèles traités       : ${JUSTIFICATIONS.length}`);
  console.log(`Créés                 : ${created}`);
  console.log(`Mis à jour            : ${updated}`);
  console.log(`Ignorés (existants)   : ${skipped}`);
  console.log(`Déjà identiques       : ${unchanged}`);
  console.log("========================================");
  console.log("Important : validation médicale requise avant délivrance.");
}

main()
  .catch((error) => {
    console.error("");
    console.error("Échec de l'initialisation des justifications :");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
