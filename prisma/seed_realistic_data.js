/**
 * ============================================================================
 * seed_realistic_data.js - Realistic Clinical & Patient Data Generator
 * ============================================================================
 *
 * Populates the clinic database with coherent, real-world Algerian pediatric data:
 * - Predefined Templates (Ordonnances Types, Bilans Types, Justifications Types)
 * - Diverse Pediatric Medications & Lab Panels
 * - Realistic Patients with proper Algerian names, addresses, phones, and medical histories
 * - Consultations with matching clinical signs, vitals, developmental milestones
 * - Growth curve measurements (CourbeInfo) matching WHO/pediatric standards
 * - Complete Ordonnances, Bilans Biologiques, and Medical Certificates (Justifications)
 * - PEV Vaccinations given with proper batch notes & dates
 * - Financial transactions (full payments, partial payments, multiple payments, and outstanding credits)
 * - Clinic Operating Expenses (Dépenses) across multiple months
 *
 * Fully idempotent and safe to run repeatedly.
 * ============================================================================
 */

const { PrismaClient } = require("../app/generated/prisma");
const prisma = new PrismaClient();

// Helper date generator relative to reference date (Nov 2026)
const NOW = new Date("2026-11-24T10:00:00.000Z");
function daysAgo(d) {
  return new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000);
}
function monthsAgo(m, daysOffset = 0) {
  return new Date(NOW.getTime() - (m * 30.44 + daysOffset) * 24 * 60 * 60 * 1000);
}
function yearsAgo(y, monthsOffset = 0) {
  return new Date(NOW.getTime() - (y * 365.25 + monthsOffset * 30.44) * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("================================================================================");
  console.log("🌱 INITIALISATION ET GÉNÉRATION DES DONNÉES CLINIQUES PÉDIATRIQUES RÉALISTES");
  console.log("================================================================================");

  // --------------------------------------------------------------------------
  // 1. MÉDICAMENTS PÉDIATRIQUES
  // --------------------------------------------------------------------------
  console.log("\n📦 1. Synchronisation de la pharmacopée pédiatrique...");
  const medicationsList = [
    "Paracétamol Sirop 2.4% (Doliprane)",
    "Paracétamol Suppositoire 150mg",
    "Paracétamol Suppositoire 300mg",
    "Paracétamol 500mg comprimés dispersibles",
    "Amoxicilline 250mg/5ml suspension (Clamoxyl)",
    "Amoxicilline 500mg/5ml suspension",
    "Amoxicilline + Acide Clavulanique 100mg/12.5mg (Augmentin)",
    "Céfixime 100mg/5ml suspension buvable (Oroken)",
    "Azithromycine 200mg/5ml suspension (Zithromax)",
    "Ibuprofène 20mg/ml suspension (Advil pédiatrique)",
    "Célestène 0.05% solution buvable en gouttes (Bétaméthasone)",
    "Ventoline 100µg/dose spray aérosol",
    "Flixotide 50µg spray avec chambre d'inhalation (Babyhaler)",
    "Pulmicort 0.5mg/2ml suspension pour nébulisation",
    "Sérum physiologique 0.9% (Dosettes 5ml)",
    "Soluté de Réhydratation Orale (SRO / Adiaril)",
    "Smecta 3g sachets pédiatrique (Diosmectite)",
    "Tiorfan 10mg sachets nourrissons (Racécadotril)",
    "Tiorfan 30mg sachets enfants (Racécadotril)",
    "Ultra-Levure 50mg sachets pédiatriques",
    "Gaviscon suspension buvable nourrissons",
    "Débridat suspension buvable (Trimébutine)",
    "Zyrtec (Cétirizine) solution buvable 10mg/ml",
    "Aerius 0.5mg/ml sirop (Desloratadine)",
    "Ferrostrane 0.68% sirop (Fer ferrique)",
    "Vitamine D3 (Zyma D) 10 000 UI/ml gouttes",
    "Vitamine D3 200 000 UI ampoule buvable",
    "Biseptine solution désinfectante locale",
    "Dexeryl crème émolliente et réparatrice pédiatrique",
    "Bactrim pédiatrique suspension (Sulfaméthoxazole + Triméthoprime)",
    "Josacine 250mg/5ml suspension (Josamycine)",
  ];

  const medMap = {};
  for (const nom of medicationsList) {
    const med = await prisma.medicament.upsert({
      where: { nom },
      update: {},
      create: { nom },
    });
    medMap[nom] = med.id;
  }
  console.log(`   ✅ ${Object.keys(medMap).length} médicaments pédiatriques prêts.`);

  // --------------------------------------------------------------------------
  // 2. ANALYSES ET BILANS BIOLOGIQUES
  // --------------------------------------------------------------------------
  console.log("\n🔬 2. Synchronisation des bilans et analyses de laboratoire...");
  const bilansList = [
    "NFS (Numération Formule Sanguine)",
    "CRP (Protéine C-Réactive)",
    "Vitesse de sédimentation (VS)",
    "ECBU (Examen Cytobactériologique des Urines)",
    "Ferritine sérique + Fer sérique",
    "Ionogramme sanguin (Sodium, Potassium, Chlore)",
    "Glycémie à jeun",
    "Bilan hépatique (ASAT / ALAT / Bilirubine)",
    "Urée & Créatinine plasmatique",
    "Coproculture & Examen Parasitologique des Selles",
    "Sérologie Maladie Coeliaque (Anti-transglutaminase IgA)",
    "Bilan Phospho-calcique & 25-OH Vitamine D",
    "Bilan d'Hémostase (TP, TCA, Fibrinogène)",
    "TSH & T4 libre (Bilan thyroïdien pédiatrique)",
    "Électrophorèse de l'Hémoglobine",
  ];

  const bilanMap = {};
  for (const nom of bilansList) {
    const b = await prisma.bilan.upsert({
      where: { nom },
      update: {},
      create: { nom },
    });
    bilanMap[nom] = b.id;
  }
  console.log(`   ✅ ${Object.keys(bilanMap).length} examens de laboratoire prêts.`);

  // --------------------------------------------------------------------------
  // 3. VACCINS DU CALENDRIER NATIONAL (PEV ALGÉRIE)
  // --------------------------------------------------------------------------
  console.log("\n💉 3. Synchronisation des vaccins pédiatriques...");
  const vaccinesList = [
    "BCG + Hépatite B (Naissance)",
    "Pentavalent 1ère dose (DTC-Hib-HBV) + VPI - 2 mois",
    "Pneumocoque conjugué (PCV 13) 1ère dose - 2 mois",
    "Pentavalent 2ème dose + VPO - 4 mois",
    "Pneumocoque conjugué (PCV 13) 2ème dose - 4 mois",
    "Pentavalent 3ème dose + VPO - 12 mois",
    "ROR 1ère dose (Rougeole-Oreillons-Rubéole) - 11 mois",
    "ROR 2ème dose (Rappel) - 18 mois",
    "Vaccin DTPolio (Rappel scolaire 6 ans)",
  ];

  const vaccineMap = {};
  for (const name of vaccinesList) {
    const v = await prisma.vaccine.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    vaccineMap[name] = v.id;
  }
  console.log(`   ✅ ${Object.keys(vaccineMap).length} vaccins du calendrier national prêts.`);

  // --------------------------------------------------------------------------
  // 4. MODÈLES PRÉDÉFINIS : JUSTIFICATIONS TYPES
  // --------------------------------------------------------------------------
  console.log("\n📜 4. Création des modèles de Certificats & Justificatifs médicaux...");
  const justifTypesData = [
    {
      nom: "Dispense d'activités physiques et sportives (EPS)",
      texte:
        "Je soussigné(e), Professeur en pédiatrie, certifie avoir examiné ce jour l'enfant mentionné ci-dessus et atteste que son état de santé justifie une dispense temporaire de cours d'éducation physique et sportive (EPS) pour la durée mentionnée ci-après.",
    },
    {
      nom: "Certificat d'inaptitude temporaire pour affection aiguë (Crèche/École)",
      texte:
        "Je soussigné(e), Professeur en pédiatrie, certifie que l'état de santé de l'enfant nécessite une éviction temporaire de la collectivité scolaire / crèche pour affection aiguë et justifie un repos à domicile avec soins.",
    },
    {
      nom: "Certificat de non-contagion (Retour en collectivité)",
      texte:
        "Je soussigné(e), Professeur en pédiatrie, certifie avoir examiné ce jour l'enfant et atteste qu'il ne présente plus aucun signe clinique de maladie contagieuse. La réintégration en collectivité d'enfants est autorisée.",
    },
    {
      nom: "Certificat de présence en consultation médicale pédiatrique",
      texte:
        "Je soussigné(e), Professeur en pédiatrie, certifie avoir reçu ce jour l'enfant mentionné ci-dessus pour une consultation médicale pédiatrique au cabinet en présence de son représentant légal.",
    },
    {
      nom: "Certificat d'aptitude aux activités sportives et collectives",
      texte:
        "Je soussigné(e), Professeur en pédiatrie, certifie avoir examiné ce jour l'enfant et n'avoir constaté aucune contre-indication clinique apparente à la pratique des activités physiques et sportives en milieu scolaire ou en club.",
    },
    {
      nom: "Garde d'enfant malade (Justificatif employeur parent)",
      texte:
        "Je soussigné(e), Professeur en pédiatrie, certifie que l'état de santé de l'enfant nécessite impérativement la présence et les soins continus de l'un de ses parents à domicile pour la durée indiquée.",
    },
  ];

  for (const jt of justifTypesData) {
    await prisma.justificationType.upsert({
      where: { nom: jt.nom },
      update: { texte: jt.texte },
      create: jt,
    });
  }
  console.log(`   ✅ ${justifTypesData.length} modèles de justificatifs types configurés.`);

  // --------------------------------------------------------------------------
  // 5. MODÈLES PRÉDÉFINIS : BILANS TYPES
  // --------------------------------------------------------------------------
  console.log("\n🧪 5. Création des protocoles de Bilans Biologiques types...");
  const bilanTypesData = [
    {
      nom: "Bilan Infectieux & Syndrome Inflammatoire Aigu",
      items: [
        { nom: "NFS (Numération Formule Sanguine)", remarque: "Recherche hyperleucocytose à PNN ou lymphocytose" },
        { nom: "CRP (Protéine C-Réactive)", remarque: "Évaluation du syndrome inflammatoire aigu" },
        { nom: "Vitesse de sédimentation (VS)", remarque: "Cinétique inflammatoire" },
      ],
    },
    {
      nom: "Bilan Anémie Microcytaire & Carence Martiale",
      items: [
        { nom: "NFS (Numération Formule Sanguine)", remarque: "Taux d'Hb, VGM, TCMH, RDW" },
        { nom: "Ferritine sérique + Fer sérique", remarque: "Confirmation de la déplétion des réserves martiales" },
      ],
    },
    {
      nom: "Bilan Infection Urinaire Fébrile / Pyélonéphrite",
      items: [
        { nom: "ECBU (Examen Cytobactériologique des Urines)", remarque: "Compte de leucocytes et antibiogramme systématique" },
        { nom: "NFS (Numération Formule Sanguine)", remarque: "Vérification du retentissement systémique" },
        { nom: "CRP (Protéine C-Réactive)", remarque: "Marqueur précoce d'atteinte parenchymateuse" },
        { nom: "Urée & Créatinine plasmatique", remarque: "Fonction rénale" },
      ],
    },
    {
      nom: "Bilan Retard Staturo-Pondéral & Malabsorption",
      items: [
        { nom: "NFS (Numération Formule Sanguine)", remarque: "Dépistage anémie carentielle" },
        { nom: "Ferritine sérique + Fer sérique", remarque: "Statut martial" },
        { nom: "Sérologie Maladie Coeliaque (Anti-transglutaminase IgA)", remarque: "Dosage des IgA totales conjoint" },
        { nom: "Bilan Phospho-calcique & 25-OH Vitamine D", remarque: "Recherche rachitisme ou hypovitaminose D" },
        { nom: "Ionogramme sanguin (Sodium, Potassium, Chlore)", remarque: "Équilibre hydro-électrolytique" },
      ],
    },
    {
      nom: "Bilan Pré-Opératoire Pédiatrique (ORL / Chirurgie)",
      items: [
        { nom: "NFS (Numération Formule Sanguine)", remarque: "Taux d'hémoglobine et plaquettes pré-op" },
        { nom: "Bilan d'Hémostase (TP, TCA, Fibrinogène)", remarque: "Hémostase primaire et coagulation" },
      ],
    },
  ];

  for (const bt of bilanTypesData) {
    let existing = await prisma.bilanType.findFirst({ where: { nom: bt.nom } });
    if (!existing) {
      existing = await prisma.bilanType.create({ data: { nom: bt.nom } });
    }
    // Sync items
    await prisma.bilanTypeItem.deleteMany({ where: { bilanTypeId: existing.id } });
    for (const it of bt.items) {
      const bId = bilanMap[it.nom];
      if (bId) {
        await prisma.bilanTypeItem.create({
          data: {
            bilanTypeId: existing.id,
            bilanId: bId,
            remarque: it.remarque,
          },
        });
      }
    }
  }
  console.log(`   ✅ ${bilanTypesData.length} bilans types configurés.`);

  // --------------------------------------------------------------------------
  // 6. MODÈLES PRÉDÉFINIS : ORDONNANCES TYPES (RECETTES)
  // --------------------------------------------------------------------------
  console.log("\n💊 6. Création des protocoles d'Ordonnances types...");
  const recetteTypesData = [
    {
      nom: "Protocole Angine Streptococcique / Pharyngite Aiguë",
      items: [
        {
          nom: "Amoxicilline 250mg/5ml suspension (Clamoxyl)",
          dosage: "50 mg/kg/jour en 2 prises",
          frequence: "Matin et soir au cours du repas",
          duree: "6 jours",
          quantite: 2,
        },
        {
          nom: "Paracétamol Sirop 2.4% (Doliprane)",
          dosage: "1 dose-kilo (15 mg/kg)",
          frequence: "Toutes les 6 heures si fièvre > 38.5°C ou douleur",
          duree: "5 jours",
          quantite: 1,
        },
        {
          nom: "Sérum physiologique 0.9% (Dosettes 5ml)",
          dosage: "1 dosette dans chaque narine",
          frequence: "3 fois par jour avant les repas",
          duree: "6 jours",
          quantite: 1,
        },
      ],
    },
    {
      nom: "Protocole Otite Moyenne Aiguë (OMA) de l'Enfant",
      items: [
        {
          nom: "Amoxicilline 500mg/5ml suspension",
          dosage: "80 à 90 mg/kg/jour en 3 prises",
          frequence: "Matin, midi et soir",
          duree: "8 jours",
          quantite: 2,
        },
        {
          nom: "Paracétamol Sirop 2.4% (Doliprane)",
          dosage: "1 dose-kilo (15 mg/kg)",
          frequence: "Toutes les 6 heures systématiquement les 48 premières heures",
          duree: "5 jours",
          quantite: 1,
        },
        {
          nom: "Sérum physiologique 0.9% (Dosettes 5ml)",
          dosage: "Désobstruction rhinopharyngée",
          frequence: "4 fois par jour",
          duree: "8 jours",
          quantite: 1,
        },
      ],
    },
    {
      nom: "Protocole Bronchiolite du Nourrisson",
      items: [
        {
          nom: "Sérum physiologique 0.9% (Dosettes 5ml)",
          dosage: "1 dosette dans chaque narine avec désobstruction rhinopharyngée (DRP)",
          frequence: "Avant chaque biberon / tétée et au coucher",
          duree: "8 jours",
          quantite: 2,
        },
        {
          nom: "Ventoline 100µg/dose spray aérosol",
          dosage: "2 bouffées avec chambre d'inhalation (Babyhaler)",
          frequence: "3 à 4 fois par jour si sifflements expiratoires",
          duree: "5 jours",
          quantite: 1,
        },
        {
          nom: "Paracétamol Sirop 2.4% (Doliprane)",
          dosage: "1 dose-kilo",
          frequence: "Toutes les 6 heures si fièvre > 38.5°C",
          duree: "3 jours",
          quantite: 1,
        },
      ],
    },
    {
      nom: "Protocole Gastro-Entérite Aiguë (GEA) & Réhydratation",
      items: [
        {
          nom: "Soluté de Réhydratation Orale (SRO / Adiaril)",
          dosage: "1 sachet dilué dans 200ml d'eau minérale fraîche",
          frequence: "À volonté par petites gorgées après chaque selle liquide",
          duree: "3 à 5 jours",
          quantite: 2,
        },
        {
          nom: "Tiorfan 10mg sachets nourrissons (Racécadotril)",
          dosage: "1 sachet selon le poids",
          frequence: "3 fois par jour au début des repas",
          duree: "5 jours",
          quantite: 1,
        },
        {
          nom: "Ultra-Levure 50mg sachets pédiatriques",
          dosage: "1 sachet délayé dans une compote ou liquide tiède",
          frequence: "Matin et soir",
          duree: "7 jours",
          quantite: 1,
        },
      ],
    },
    {
      nom: "Protocole Crise d'Asthme / Toux Spasmodique",
      items: [
        {
          nom: "Ventoline 100µg/dose spray aérosol",
          dosage: "2 bouffées avec chambre d'inhalation Babyhaler",
          frequence: "Toutes les 4 à 6 heures selon la gêne respiratoire",
          duree: "5 jours",
          quantite: 1,
        },
        {
          nom: "Célestène 0.05% solution buvable en gouttes (Bétaméthasone)",
          dosage: "10 gouttes / kg / jour",
          frequence: "Le matin en une seule prise",
          duree: "3 jours",
          quantite: 1,
        },
        {
          nom: "Flixotide 50µg spray avec chambre d'inhalation (Babyhaler)",
          dosage: "1 bouffée",
          frequence: "Matin et soir en traitement de fond",
          duree: "1 mois",
          quantite: 1,
        },
      ],
    },
    {
      nom: "Protocole Prophylaxie du Rachitisme & Carence Martiale",
      items: [
        {
          nom: "Vitamine D3 (Zyma D) 10 000 UI/ml gouttes",
          dosage: "4 gouttes par jour",
          frequence: "Directement dans la bouche ou avec un peu de lait",
          duree: "En continu jusqu'à 18 mois",
          quantite: 1,
        },
        {
          nom: "Ferrostrane 0.68% sirop (Fer ferrique)",
          dosage: "1 cuillère-mesure (5ml)",
          frequence: "Deux fois par jour pendant les repas",
          duree: "3 mois",
          quantite: 2,
        },
      ],
    },
  ];

  for (const rt of recetteTypesData) {
    let existing = await prisma.recetteType.findFirst({ where: { nom: rt.nom } });
    if (!existing) {
      existing = await prisma.recetteType.create({ data: { nom: rt.nom } });
    }
    // Sync items
    await prisma.recetteTypeItem.deleteMany({ where: { recetteId: existing.id } });
    for (const it of rt.items) {
      const mId = medMap[it.nom];
      if (mId) {
        await prisma.recetteTypeItem.create({
          data: {
            recetteId: existing.id,
            medicamentId: mId,
            dosage: it.dosage,
            frequence: it.frequence,
            duree: it.duree,
            quantite: it.quantite,
          },
        });
      }
    }
  }
  console.log(`   ✅ ${recetteTypesData.length} ordonnances types configurées.`);

  // --------------------------------------------------------------------------
  // 7. PATIENTS, HISTORIQUE CLINIQUES, MESURES, ORDONNANCES & FINANCES
  // --------------------------------------------------------------------------
  console.log("\n👶 7. Génération des patients et des dossiers médicaux complets...");

  // Data definitions for the 10 patients
  const patientsDataset = [
    // ------------------------------------------------------------------------
    // PATIENT 1 : BENALI Youcef (4 mois - Soldé)
    // ------------------------------------------------------------------------
    {
      info: {
        nom: "BENALI Youcef",
        dateDeNaissance: monthsAgo(4),
        sexe: "garçon",
        telephone: "0554 18 29 40",
        adresse: "Cité 500 Logements, Bâtiment B4, El-Harrouch, Skikda",
        antecedents: "Né à terme (39 SA), accouchement voie basse eutocique, allaitement maternel exclusif, bon Apgar (10/10)",
        poidsDeNaissance: 3.35,
        groupeSanguin: "O_POS",
      },
      consultations: [
        {
          date: monthsAgo(2),
          motif: "Visite systématique du 2ème mois & vaccinations du calendrier national",
          poids: 5.20,
          taille: 58.0,
          perimetreCranien: 39.5,
          temperature: 37.1,
          frequenceCardiaque: 124,
          frequenceRespiratoire: 32,
          saturationOxygene: 99,
          developpementPsychomoteur: "Sourire-réponse acquis, fixation et poursuite oculaire, début de maintien de la tête.",
          note: "Examen pédiatrique normal: fontanelle antérieure normotendue (2x2 cm), bruits du cœur purs, hanches stables sans ressaut. Allaitement maternel bien conduit. Croissance harmonieuse.",
          prix: 2000,
          versements: [
            { montant: 2000, date: monthsAgo(2), note: "Espèces - Règlement intégral" },
          ],
          courbeAge: "2 mois",
          vaccins: [
            { name: "Pentavalent 1ère dose (DTC-Hib-HBV) + VPI - 2 mois", dose: 1, note: "Cuisse gauche, tolérance excellente" },
            { name: "Pneumocoque conjugué (PCV 13) 1ère dose - 2 mois", dose: 1, note: "Cuisse droite" },
          ],
        },
        {
          date: daysAgo(5),
          motif: "Visite systématique du 4ème mois & rhinopharyngite aiguë fébrile",
          poids: 6.65,
          taille: 63.5,
          perimetreCranien: 41.8,
          temperature: 38.3,
          frequenceCardiaque: 130,
          frequenceRespiratoire: 34,
          saturationOxygene: 98,
          developpementPsychomoteur: "Bonne tenue de tête acquise, rit aux éclats, vocalise avec gazouillis.",
          note: "Rhinorrhée séro-muqueuse bilatérale, pharynx érythémateux, tympans congestifs bilatéraux sans bombement ni épanchement. Auscultation pulmonaire libre. Bon état général conservé.",
          prix: 2000,
          versements: [
            { montant: 2000, date: daysAgo(5), note: "Espèces - Règlement intégral" },
          ],
          courbeAge: "4 mois",
          vaccins: [
            { name: "Pentavalent 2ème dose + VPO - 4 mois", dose: 2, note: "Injection cuisse gauche + gouttes orales VPO" },
            { name: "Pneumocoque conjugué (PCV 13) 2ème dose - 4 mois", dose: 2, note: "Injection cuisse droite" },
          ],
          ordonnance: [
            { med: "Paracétamol Sirop 2.4% (Doliprane)", dosage: "1 dose-kilo (15 mg/kg)", freq: "Toutes les 6h si T° > 38.5°C", duree: "5 jours", qte: 1 },
            { med: "Sérum physiologique 0.9% (Dosettes 5ml)", dosage: "Lavage soigneux des fosses nasales", freq: "Avant chaque tétée / repas", duree: "7 jours", qte: 1 },
          ],
        },
      ],
    },

    // ------------------------------------------------------------------------
    // PATIENT 2 : BOUZID Meriem (9 mois - Crédit 1000 DZD)
    // ------------------------------------------------------------------------
    {
      info: {
        nom: "BOUZID Meriem",
        dateDeNaissance: monthsAgo(9),
        sexe: "fille",
        telephone: "0662 45 81 90",
        adresse: "Rue Didouche Mourad, Centre-Ville, El-Harrouch",
        antecedents: "Terrain atopique familial (mère asthmatique, eczéma du nourrisson modéré)",
        poidsDeNaissance: 3.10,
        groupeSanguin: "A_POS",
      },
      consultations: [
        {
          date: monthsAgo(6),
          motif: "Régurgitations fréquentes post-prandiales (RGO simple du nourrisson)",
          poids: 5.75,
          taille: 59.5,
          perimetreCranien: 40.2,
          temperature: 37.0,
          frequenceCardiaque: 122,
          frequenceRespiratoire: 30,
          saturationOxygene: 99,
          developpementPsychomoteur: "Tient bien sa tête, sourit, suit les objets du regard.",
          note: "Régurgitations faciles après les tétées sans cassure de la courbe de poids ni œsophagite. Abdomen souple. Conseils positionnels (surélévation du plan de couchage).",
          prix: 2000,
          versements: [
            { montant: 2000, date: monthsAgo(6), note: "Espèces - Règlement complet" },
          ],
          courbeAge: "3 mois",
          ordonnance: [
            { med: "Gaviscon suspension buvable nourrissons", dosage: "1 ml après chaque repas", freq: "3 à 4 fois par jour après la tétée", duree: "15 jours", qte: 1 },
          ],
        },
        {
          date: monthsAgo(3),
          motif: "Visite du 6ème mois, diversification alimentaire et suivi de croissance",
          poids: 7.40,
          taille: 66.0,
          perimetreCranien: 43.2,
          temperature: 36.9,
          frequenceCardiaque: 118,
          frequenceRespiratoire: 28,
          saturationOxygene: 99,
          developpementPsychomoteur: "Assise avec léger appui, attrape les objets à deux mains, début de babillage.",
          note: "Croissance régulière. Début de la diversification alimentaire sans difficulté. Examen pédiatrique complet normal.",
          prix: 2000,
          versements: [
            { montant: 2000, date: monthsAgo(3), note: "Espèces - Règlement complet" },
          ],
          courbeAge: "6 mois",
        },
        {
          date: daysAgo(3),
          motif: "Premier épisode de bronchiolite aiguë du nourrisson avec gêne respiratoire sifflante",
          poids: 8.55,
          taille: 71.0,
          perimetreCranien: 44.5,
          temperature: 37.8,
          frequenceCardiaque: 138,
          frequenceRespiratoire: 44,
          saturationOxygene: 96,
          developpementPsychomoteur: "Assise autonome solide, début de station debout avec appui.",
          note: "Toux sèche puis quinteuse, encombrement bronchique avec frein expiratoire et râles sibilants bilatéraux diffus. Léger tirage sous-costal sans signe de gravité immédiat. Prise en charge ambulatoire avec surveillance rapprochée.",
          prix: 2500, // Consultation approfondie avec aérosol au cabinet
          versements: [
            { montant: 1500, date: daysAgo(3), note: "Espèces - Acompte consultation (Reste 1000 DZD)" },
          ],
          courbeAge: "9 mois",
          ordonnance: [
            { med: "Sérum physiologique 0.9% (Dosettes 5ml)", dosage: "Désobstruction rhinopharyngée soigneuse", freq: "Avant chaque repas et au coucher", duree: "8 jours", qte: 2 },
            { med: "Ventoline 100µg/dose spray aérosol", dosage: "2 bouffées avec chambre Babyhaler", freq: "3 à 4 fois par jour si gêne respiratoire", duree: "5 jours", qte: 1 },
            { med: "Paracétamol Sirop 2.4% (Doliprane)", dosage: "1 dose-kilo", freq: "Toutes les 6h si fièvre > 38.5°C", duree: "3 jours", qte: 1 },
          ],
          justification: {
            titre: "Certificat d'Inaptitude Temporaire pour Crèche",
            texte: "Je soussigné(e), Professeur en pédiatrie, certifie que l'état de santé du nourrisson BOUZID Meriem justifie une éviction temporaire de la crèche pour une durée de 5 jours à compter de ce jour pour bronchiolite aiguë.",
            duree: "5 jours",
            dateDebut: daysAgo(3),
            dateFin: daysAgo(-2),
          },
        },
      ],
    },

    // ------------------------------------------------------------------------
    // PATIENT 3 : SAIDI Adem (18 mois - Crédit 2000 DZD impayé)
    // ------------------------------------------------------------------------
    {
      info: {
        nom: "SAIDI Adem",
        dateDeNaissance: monthsAgo(18),
        sexe: "garçon",
        telephone: "0770 33 62 15",
        adresse: "Cité des Frères Boukheddami, El-Harrouch",
        antecedents: "Épisodes récurrents de rhinopharyngite depuis l'entrée en garderie",
        poidsDeNaissance: 3.60,
        groupeSanguin: "B_POS",
      },
      consultations: [
        {
          date: monthsAgo(6),
          motif: "Visite du 1er anniversaire, développement psychomoteur et vaccins",
          poids: 10.3,
          taille: 76.5,
          perimetreCranien: 46.8,
          temperature: 37.0,
          frequenceCardiaque: 115,
          frequenceRespiratoire: 26,
          saturationOxygene: 99,
          developpementPsychomoteur: "Marche autonome acquise, plusieurs mots distincts ('papa', 'maman').",
          note: "Enfant tonique et curieux. Examen cardio-pulmonaire et abdominal normal. Bon développement général.",
          prix: 2000,
          versements: [
            { montant: 2000, date: monthsAgo(6), note: "Espèces - Règlement complet" },
          ],
          courbeAge: "12 mois",
          vaccins: [
            { name: "Pentavalent 3ème dose + VPO - 12 mois", dose: 3, note: "Vaccin de rappel 1 an" },
          ],
        },
        {
          date: daysAgo(2),
          motif: "Otite Moyenne Aiguë suppurée droite avec fièvre à 39.2°C et otalgie nocturne",
          poids: 11.85,
          taille: 83.0,
          perimetreCranien: 48.0,
          temperature: 39.2,
          frequenceCardiaque: 125,
          frequenceRespiratoire: 28,
          saturationOxygene: 98,
          developpementPsychomoteur: "Bonne motricité globale, court, comprend les consignes simples.",
          note: "Otoscopie droite: tympan très bombé, inflammatoire, hyperhémié avec disparition des reliefs osseux et collection rétro-tympanique purulente. Tympan gauche congestif sans bombement. Pharynx érythémateux. Enfant grognon et agité.",
          prix: 2000,
          versements: [], // TOTALEMENT IMPAYÉ -> Dette de 2000 DZD
          courbeAge: "18 mois",
          ordonnance: [
            { med: "Amoxicilline 250mg/5ml suspension (Clamoxyl)", dosage: "80 mg/kg/jour en 3 prises", freq: "Matin, midi et soir", duree: "8 jours", qte: 2 },
            { med: "Paracétamol Sirop 2.4% (Doliprane)", dosage: "1 dose-kilo", freq: "Toutes les 6h systématiquement pendant 48h", duree: "5 jours", qte: 1 },
            { med: "Sérum physiologique 0.9% (Dosettes 5ml)", dosage: "Lavage soigneux des fosses nasales", freq: "3 à 4 fois par jour", duree: "8 jours", qte: 1 },
          ],
          justification: {
            titre: "Certificat Médical d'Inaptitude Temporaire pour Garderie",
            texte: "Je soussigné(e), Professeur en pédiatrie, certifie avoir examiné ce jour l'enfant SAIDI Adem et atteste que son état de santé (Otite moyenne aiguë fébrile) nécessite une éviction temporaire de la garderie pour une durée de 4 jours.",
            duree: "4 jours",
            dateDebut: daysAgo(2),
            dateFin: daysAgo(-2),
          },
        },
      ],
    },

    // ------------------------------------------------------------------------
    // PATIENT 4 : MEZIANE Inès (3 ans - Soldé via 2 versements)
    // ------------------------------------------------------------------------
    {
      info: {
        nom: "MEZIANE Inès",
        dateDeNaissance: yearsAgo(3),
        sexe: "fille",
        telephone: "0560 94 11 72",
        adresse: "Cité 100 Logements LSP, Ramdane Djamel, Skikda",
        antecedents: "Vaccination complète selon calendrier national PEV, pas d'allergie médicamenteuse",
        poidsDeNaissance: 3.25,
        groupeSanguin: "O_POS",
      },
      consultations: [
        {
          date: yearsAgo(1),
          motif: "Visite de contrôle des 2 ans & contrôle de la propreté diurne",
          poids: 12.6,
          taille: 87.5,
          perimetreCranien: 48.5,
          temperature: 36.8,
          frequenceCardiaque: 105,
          frequenceRespiratoire: 24,
          developpementPsychomoteur: "Langage riche avec phrases simples, propreté diurne acquise.",
          note: "Croissance satisfaisante. Examen clinique sans anomalie. Bon état général.",
          prix: 2000,
          versements: [
            { montant: 2000, date: yearsAgo(1), note: "Espèces - Règlement intégral" },
          ],
          courbeAge: "2 ans",
        },
        {
          date: daysAgo(10),
          motif: "Gastro-Entérite Aiguë fébrile (GEA) avec 6 selles liquides/jour et vomissements",
          poids: 14.1,
          taille: 96.0,
          perimetreCranien: 49.2,
          temperature: 38.5,
          frequenceCardiaque: 110,
          tensionSystolique: 95,
          tensionDiastolique: 60,
          saturationOxygene: 99,
          developpementPsychomoteur: "Activité normale, coopération satisfaisante à l'examen.",
          note: "Selles aqueuses profuses depuis 24h. Muqueuses bien humides, larmes présentes, pli cutané normal, diurèse conservée. Pas de signe de déshydratation sévère. Abdomen souple et dépressible.",
          prix: 2000,
          versements: [
            { montant: 1000, date: daysAgo(10), note: "Espèces - Acompte consultation initiale" },
            { montant: 1000, date: daysAgo(6), note: "Espèces - Solde consultation après guérison" },
          ],
          courbeAge: "3 ans",
          ordonnance: [
            { med: "Soluté de Réhydratation Orale (SRO / Adiaril)", dosage: "1 sachet dans 200ml d'eau", freq: "À volonté par petites gorgées", duree: "4 jours", qte: 2 },
            { med: "Tiorfan 30mg sachets enfants (Racécadotril)", dosage: "1 sachet", freq: "3 fois par jour au début des repas", duree: "5 jours", qte: 1 },
            { med: "Ultra-Levure 50mg sachets pédiatriques", dosage: "1 sachet", freq: "Matin et soir délayé dans compote", duree: "7 jours", qte: 1 },
            { med: "Paracétamol Sirop 2.4% (Doliprane)", dosage: "1 dose-kilo", freq: "Toutes les 6h si fièvre > 38.5°C", duree: "3 jours", qte: 1 },
          ],
          bilan: {
            nom: "Coproculture & Examen Parasitologique des Selles",
            resultat: "Examen direct négatif pour parasites. Coproculture stérile. Recherche d'antigène Rotavirus: Positive.",
            remarque: "Gastro-entérite virale à Rotavirus sans surinfection bactérienne.",
          },
        },
      ],
    },

    // ------------------------------------------------------------------------
    // PATIENT 5 : CHERIF Rayan (5 ans - Soldé)
    // ------------------------------------------------------------------------
    {
      info: {
        nom: "CHERIF Rayan",
        dateDeNaissance: yearsAgo(5),
        sexe: "garçon",
        telephone: "0671 22 88 54",
        adresse: "Cité des Jardins, Azzaba, Skikda",
        antecedents: "Asthme allergique de l'enfant diagnostiqué à l'âge de 3 ans, sensibilisation aux acariens, père asthmatique",
        poidsDeNaissance: 3.40,
        groupeSanguin: "A_NEG",
      },
      consultations: [
        {
          date: monthsAgo(4),
          motif: "Suivi régulier de l'asthme et contrôle du traitement de fond avant la rentrée scolaire",
          poids: 18.0,
          taille: 109.0,
          temperature: 36.7,
          frequenceCardiaque: 88,
          frequenceRespiratoire: 20,
          saturationOxygene: 99,
          developpementPsychomoteur: "Très bon développement cognitif et moteur.",
          note: "Asthme bien contrôlé sous traitement de fond, pas de réveil nocturne ni d'exacerbation estivale. Auscultation pulmonaire claire et symétrique.",
          prix: 2000,
          versements: [
            { montant: 2000, date: monthsAgo(4), note: "Espèces - Règlement intégral" },
          ],
          courbeAge: "4 ans et demi",
          ordonnance: [
            { med: "Flixotide 50µg spray avec chambre d'inhalation (Babyhaler)", dosage: "1 bouffée", freq: "Matin et soir", duree: "Pendant 3 mois", qte: 2 },
          ],
        },
        {
          date: daysAgo(4),
          motif: "Exacerbation aiguë d'asthme déclenchée par un coup de froid avec toux spasmodique nocturne",
          poids: 18.7,
          taille: 111.5,
          temperature: 37.4,
          frequenceCardiaque: 106,
          frequenceRespiratoire: 28,
          saturationOxygene: 96,
          developpementPsychomoteur: "Enfant coopérant.",
          note: "Bradypnée expiratoire avec sifflements audibles. Auscultation: râles sibilants disséminés bilatéraux. Tirage intercostal modéré. Amélioration nette après nébulisation de salbutamol au cabinet.",
          prix: 2500,
          versements: [
            { montant: 2500, date: daysAgo(4), note: "Espèces - Règlement intégral" },
          ],
          courbeAge: "5 ans",
          ordonnance: [
            { med: "Ventoline 100µg/dose spray aérosol", dosage: "2 bouffées avec chambre Babyhaler", freq: "Toutes les 4 à 6 heures pendant 5 jours", duree: "5 jours", qte: 1 },
            { med: "Célestène 0.05% solution buvable en gouttes (Bétaméthasone)", dosage: "10 gouttes / kg / jour", freq: "Le matin en 1 prise", duree: "3 jours", qte: 1 },
            { med: "Flixotide 50µg spray avec chambre d'inhalation (Babyhaler)", dosage: "2 bouffées", freq: "Matin et soir dès la fin de la crise", duree: "1 mois", qte: 1 },
          ],
          justification: {
            titre: "Dispense d'Éducation Physique et Sportive (EPS)",
            texte: "Je soussigné(e), Professeur en pédiatrie, certifie que l'état de santé de l'enfant CHERIF Rayan nécessite une dispense temporaire de toute activité physique et sportive scolaire (EPS) pour une durée de 15 jours pour exacerbation d'asthme.",
            duree: "15 jours",
            dateDebut: daysAgo(4),
            dateFin: daysAgo(-11),
          },
        },
      ],
    },

    // ------------------------------------------------------------------------
    // PATIENT 6 : KHALDI Amine (8 ans - Soldé)
    // ------------------------------------------------------------------------
    {
      info: {
        nom: "KHALDI Amine",
        dateDeNaissance: yearsAgo(8),
        sexe: "garçon",
        telephone: "0552 67 43 91",
        adresse: "Boulevard Mohamed Khemisti, El-Harrouch",
        antecedents: "Hypertrophie amygdalienne modérée, épisodes d'angines récidivantes",
        poidsDeNaissance: 3.50,
        groupeSanguin: "AB_POS",
      },
      consultations: [
        {
          date: monthsAgo(8),
          motif: "Visite médicale de contrôle annuel & certificat d'aptitude sportive",
          poids: 24.8,
          taille: 126.0,
          temperature: 36.8,
          frequenceCardiaque: 82,
          tensionSystolique: 100,
          tensionDiastolique: 65,
          developpementPsychomoteur: "Excellente scolarité, pratique de la natation.",
          note: "Examen pédiatrique complet normal. Auscultation cardio-pulmonaire sans anomalie.",
          prix: 2000,
          versements: [
            { montant: 2000, date: monthsAgo(8), note: "Espèces - Règlement intégral" },
          ],
          courbeAge: "7 ans et demi",
          justification: {
            titre: "Certificat d'Aptitude aux Activités Sportives",
            texte: "Je soussigné(e), Professeur en pédiatrie, certifie avoir examiné ce jour l'enfant KHALDI Amine et n'avoir constaté aucune contre-indication clinique à la pratique de la natation.",
            duree: "1 an",
            dateDebut: monthsAgo(8),
          },
        },
        {
          date: daysAgo(6),
          motif: "Angine érythémato-pultacée aiguë fébrile avec odynophagie intense et adénopathies cervicales",
          poids: 26.3,
          taille: 129.5,
          temperature: 39.4,
          frequenceCardiaque: 108,
          tensionSystolique: 105,
          tensionDiastolique: 65,
          saturationOxygene: 99,
          developpementPsychomoteur: "Normal.",
          note: "Gorge très inflammatoire, amygdales tuméfiées recouvertes d'un enduit pultacé blanchâtre punctiforme. Adénopathies sous-angulomaxillaires bilatérales sensibles. TDR Streptocoque A positif au cabinet. Pas d'éruption scarlatiniforme.",
          prix: 2000,
          versements: [
            { montant: 2000, date: daysAgo(6), note: "Espèces - Règlement intégral" },
          ],
          courbeAge: "8 ans",
          ordonnance: [
            { med: "Amoxicilline 500mg comprimés dispersibles", dosage: "1000 mg (2 comprimés)", freq: "Matin et soir au cours du repas", duree: "6 jours", qte: 2 },
            { med: "Paracétamol 500mg comprimés dispersibles", dosage: "500 mg", freq: "Toutes les 6h si fièvre ou douleur pharyngée", duree: "5 jours", qte: 1 },
          ],
          bilan: {
            nom: "NFS (Numération Formule Sanguine)",
            resultat: "Leucocytes: 14 200 /mm³ (PNN: 76%), Hb: 12.8 g/dL, Plaquettes: 310 000 /mm³",
            remarque: "Hyperleucocytose à prédominance neutrophile en faveur d'une étiologie bactérienne.",
          },
          justification: {
            titre: "Certificat d'Inaptitude Scolaire Temporaire",
            texte: "Je soussigné(e), Professeur en pédiatrie, certifie que l'état de santé de l'enfant KHALDI Amine justifie un arrêt de scolarité et un repos à domicile pour une durée de 5 jours à compter de ce jour.",
            duree: "5 jours",
            dateDebut: daysAgo(6),
            dateFin: daysAgo(-1),
          },
        },
      ],
    },

    // ------------------------------------------------------------------------
    // PATIENT 7 : MANSOURI Lina (11 mois - Crédit 1000 DZD)
    // ------------------------------------------------------------------------
    {
      info: {
        nom: "MANSOURI Lina",
        dateDeNaissance: monthsAgo(11),
        sexe: "fille",
        telephone: "0775 80 19 63",
        adresse: "Cité 20 Août 1955, El-Harrouch",
        antecedents: "Nourrisson au régime lacté prédominant, refus des solides, diversification difficile",
        poidsDeNaissance: 2.80,
        groupeSanguin: "O_NEG",
      },
      consultations: [
        {
          date: monthsAgo(5),
          motif: "Visite systématique du 6ème mois & conseils pour l'introduction des solides",
          poids: 6.40,
          taille: 63.5,
          perimetreCranien: 41.8,
          temperature: 37.0,
          frequenceCardiaque: 120,
          frequenceRespiratoire: 28,
          developpementPsychomoteur: "Tenue assise avec appui, bon éveil.",
          note: "Croissance satisfaisante. Recommandations pour introduire progressivement légumes et fruits.",
          prix: 2000,
          versements: [
            { montant: 2000, date: monthsAgo(5), note: "Espèces - Règlement intégral" },
          ],
          courbeAge: "6 mois",
        },
        {
          date: daysAgo(8),
          motif: "Ralentissement pondéral, pâleur cutanéo-muqueuse marquée et baisse de l'appétit (Suspicion anémie ferriprive)",
          poids: 7.65,
          taille: 69.5,
          perimetreCranien: 44.0,
          temperature: 37.1,
          frequenceCardiaque: 118,
          frequenceRespiratoire: 26,
          saturationOxygene: 99,
          developpementPsychomoteur: "Légère apathie, station debout avec appui.",
          note: "Pâleur conjonctivale et unguéale évidente. Souffle systolique fonctionnel 1-2/6ème apexien sans anomalie organique. Abdomen souple. Ralentissement de la courbe pondérale depuis 3 mois. Bilan biologique prescrit.",
          prix: 2000,
          versements: [
            { montant: 1000, date: daysAgo(8), note: "Espèces - Paiement partiel (Reste 1000 DZD)" },
          ],
          courbeAge: "11 mois",
          ordonnance: [
            { med: "Ferrostrane 0.68% sirop (Fer ferrique)", dosage: "1 cuillère-mesure de 5ml", freq: "Deux fois par jour pendant les repas", duree: "3 mois", qte: 2 },
            { med: "Vitamine D3 (Zyma D) 10 000 UI/ml gouttes", dosage: "4 gouttes quotidiennes", freq: "Le matin avec un peu d'eau ou purée", duree: "En continu", qte: 1 },
          ],
          bilan: {
            nom: "Ferritine sérique + Fer sérique",
            resultat: "Ferritine sérique: 6.5 ng/ml (Effondrée, N: 20-150), Fer sérique: 32 µg/dL",
            remarque: "Carence martiale sévère confirmée justifiant supplémentation en fer ferrique par voie orale.",
          },
        },
      ],
    },

    // ------------------------------------------------------------------------
    // PATIENT 8 : ZITOUNI Nour (2 ans - Soldé)
    // ------------------------------------------------------------------------
    {
      info: {
        nom: "ZITOUNI Nour",
        dateDeNaissance: yearsAgo(2),
        sexe: "fille",
        telephone: "0664 91 35 27",
        adresse: "Cité Frères Drissi, El-Harrouch",
        antecedents: "Épidémie de varicelle signalée à la crèche municipale il y a 2 semaines",
        poidsDeNaissance: 3.15,
        groupeSanguin: "B_NEG",
      },
      consultations: [
        {
          date: daysAgo(4),
          motif: "Éruption cutanée vésiculeuse très prurigineuse et fébricule (Varicelle typique)",
          poids: 12.1,
          taille: 86.5,
          perimetreCranien: 48.0,
          temperature: 38.2,
          frequenceCardiaque: 104,
          frequenceRespiratoire: 24,
          developpementPsychomoteur: "Marche, court, parle bien.",
          note: "Éruption vésiculo-croûteuse en gouttes de rosée généralisée prédominant sur le tronc et le cuir chevelu. Lésions d'âges différents (macules, vésicules claires, premières croûtes). Prurit intense. Pas de surinfection cutanée. Consignes: AINS et Aspirine formellement contre-indiqués.",
          prix: 2000,
          versements: [
            { montant: 2000, date: daysAgo(4), note: "Espèces - Règlement intégral" },
          ],
          courbeAge: "2 ans",
          ordonnance: [
            { med: "Biseptine solution désinfectante locale", dosage: "Application locale sur les vésicules", freq: "2 fois par jour sans frotter", duree: "7 jours", qte: 1 },
            { med: "Zyrtec (Cétirizine) solution buvable 10mg/ml", dosage: "5 gouttes", freq: "Matin et soir contre le prurit", duree: "7 jours", qte: 1 },
            { med: "Paracétamol Sirop 2.4% (Doliprane)", dosage: "1 dose-kilo", freq: "Toutes les 6h si fièvre > 38.5°C", duree: "5 jours", qte: 1 },
          ],
          justification: {
            titre: "Certificat d'Éviction de la Crèche (Varicelle)",
            texte: "Je soussigné(e), Professeur en pédiatrie, certifie que l'enfant ZITOUNI Nour présente une varicelle en phase active et atteste que son état justifie une éviction de la crèche jusqu'au stade de croûtes sèches (durée prévisionnelle: 7 jours).",
            duree: "7 jours",
            dateDebut: daysAgo(4),
            dateFin: daysAgo(-3),
          },
        },
      ],
    },

    // ------------------------------------------------------------------------
    // PATIENT 9 : DAHMANI Walid (6 ans - Soldé)
    // ------------------------------------------------------------------------
    {
      info: {
        nom: "DAHMANI Walid",
        dateDeNaissance: yearsAgo(6),
        sexe: "garçon",
        telephone: "0559 40 73 82",
        adresse: "Rue Zighoud Youcef, El-Harrouch",
        antecedents: "Bonne croissance staturo-pondérale régulière, calendrier vaccinal national à jour",
        poidsDeNaissance: 3.65,
        groupeSanguin: "A_POS",
      },
      consultations: [
        {
          date: daysAgo(7),
          motif: "Examen médical d'aptitude sportive scolaire et football en club & rappel vaccinal",
          poids: 21.4,
          taille: 117.0,
          temperature: 36.8,
          frequenceCardiaque: 84,
          tensionSystolique: 98,
          tensionDiastolique: 62,
          saturationOxygene: 99,
          developpementPsychomoteur: "Excellente motricité, apprentissage de la lecture en cours.",
          note: "Examen pédiatrique complet satisfaisant. Auscultation cardio-vasculaire normale: bruits réguliers sans souffle. Pas d'anomalie ostéo-articulaire ni vertébrale. Acuité visuelle 10/10ème aux 2 yeux. Enfant apte à la pratique sportive compétitive.",
          prix: 2000,
          versements: [
            { montant: 2000, date: daysAgo(7), note: "Espèces - Règlement intégral" },
          ],
          courbeAge: "6 ans",
          vaccins: [
            { name: "Vaccin DTPolio (Rappel scolaire 6 ans)", dose: 1, note: "Rappel scolaire 6 ans deltoïde gauche" },
          ],
          justification: {
            titre: "Certificat Médical d'Aptitude aux Activités Physiques et Sportives",
            texte: "Je soussigné(e), Professeur en pédiatrie, certifie avoir examiné ce jour l'enfant DAHMANI Walid et n'avoir constaté aucune contre-indication clinique apparente à la pratique des activités physiques et sportives scolaires et en club (Football en catégorie U7).",
            duree: "1 an",
            dateDebut: daysAgo(7),
          },
        },
      ],
    },

    // ------------------------------------------------------------------------
    // PATIENT 10 : FERHAT Maya (6 semaines - Crédit 2000 DZD impayé)
    // ------------------------------------------------------------------------
    {
      info: {
        nom: "FERHAT Maya",
        dateDeNaissance: daysAgo(42),
        sexe: "fille",
        telephone: "0771 59 34 20",
        adresse: "Cité 200 Logements, Bâtiment D, El-Harrouch",
        antecedents: "Née à 39 SA + 3 jours, accouchement eutocique, allaitement maternel avec compléments occasionnels",
        poidsDeNaissance: 3.20,
        groupeSanguin: "O_POS",
      },
      consultations: [
        {
          date: daysAgo(1),
          motif: "Pleurs prolongés et inconsolables en fin d'après-midi avec ballonnement abdominal (Coliques du nourrisson)",
          poids: 4.30,
          taille: 54.5,
          perimetreCranien: 37.5,
          temperature: 37.1,
          frequenceCardiaque: 132,
          frequenceRespiratoire: 36,
          saturationOxygene: 99,
          developpementPsychomoteur: "Bébé tonique, bon contact visuel, ébauche de sourire-réponse.",
          note: "Prise de poids très satisfaisante (+1.10 kg depuis la naissance). Abdomen météorisé mais souple et non douloureux à la palpation. Pas de hernie inguinale. Pleurs vespéraux rythmés avec émission de gaz soulageant l'enfant. Diagnostic de coliques bénignes du nourrisson. Conseils rassurants donnés aux parents.",
          prix: 2000,
          versements: [], // TOTALEMENT IMPAYÉ -> Dette de 2000 DZD
          courbeAge: "1 mois et demi",
          ordonnance: [
            { med: "Débridat suspension buvable (Trimébutine)", dosage: "1 dose-kilo", freq: "2 à 3 fois par jour avant les tétées / biberons", duree: "10 jours", qte: 1 },
          ],
        },
      ],
    },
  ];

  // Insert patients and all their medical & financial details
  for (const pData of patientsDataset) {
    // 1. Upsert Patient
    const patient = await prisma.patient.upsert({
      where: { nom: pData.info.nom },
      update: {
        dateDeNaissance: pData.info.dateDeNaissance,
        sexe: pData.info.sexe,
        telephone: pData.info.telephone,
        adresse: pData.info.adresse,
        antecedents: pData.info.antecedents,
        poidsDeNaissance: pData.info.poidsDeNaissance,
        groupeSanguin: pData.info.groupeSanguin,
      },
      create: pData.info,
    });

    console.log(`\n   👤 Patient: ${patient.nom} (${patient.sexe}, né(e) le ${patient.dateDeNaissance.toISOString().split("T")[0]})`);

    // Clean existing consultations for this patient to ensure idempotent generation
    await prisma.consultation.deleteMany({ where: { patientId: patient.id } });

    // 2. Insert Consultations
    for (const cData of pData.consultations) {
      const consultation = await prisma.consultation.create({
        data: {
          patientId: patient.id,
          createdAt: cData.date,
          motifDeConsultation: cData.motif,
          poids: cData.poids,
          taille: cData.taille,
          perimetreCranien: cData.perimetreCranien,
          temperature: cData.temperature,
          frequenceCardiaque: cData.frequenceCardiaque,
          frequenceRespiratoire: cData.frequenceRespiratoire,
          tensionSystolique: cData.tensionSystolique,
          tensionDiastolique: cData.tensionDiastolique,
          saturationOxygene: cData.saturationOxygene,
          developpementPsychomoteur: cData.developpementPsychomoteur,
          note: cData.note,
          prix: cData.prix,
        },
      });

      // 3. Insert Growth Curve Record (CourbeInfo)
      if (cData.courbeAge) {
        await prisma.courbeInfo.create({
          data: {
            patientId: patient.id,
            consultationId: consultation.id,
            age: cData.courbeAge,
            poids: cData.poids,
            taille: cData.taille,
            perimetreCranien: cData.perimetreCranien,
            createdAt: cData.date,
          },
        });
      }

      // 4. Insert Payments (Versements)
      if (cData.versements && cData.versements.length > 0) {
        for (const v of cData.versements) {
          await prisma.versement.create({
            data: {
              patientId: patient.id,
              consultationId: consultation.id,
              montant: v.montant,
              date: v.date,
              note: v.note,
            },
          });
        }
      }

      // 5. Insert Vaccinations
      if (cData.vaccins && cData.vaccins.length > 0) {
        for (const vac of cData.vaccins) {
          const vId = vaccineMap[vac.name];
          if (vId) {
            await prisma.vaccination.create({
              data: {
                patientId: patient.id,
                vaccineId: vId,
                dateGiven: cData.date,
                doseNumber: vac.dose,
                notes: vac.note,
              },
            });
          }
        }
      }

      // 6. Insert Ordonnance
      if (cData.ordonnance && cData.ordonnance.length > 0) {
        const ordonnance = await prisma.ordonnance.create({
          data: {
            patientId: patient.id,
            consultationId: consultation.id,
            createdAt: cData.date,
          },
        });

        for (const item of cData.ordonnance) {
          const mId = medMap[item.med];
          if (mId) {
            await prisma.ordonnanceItem.create({
              data: {
                ordonnanceId: ordonnance.id,
                medicamentId: mId,
                dosage: item.dosage,
                frequence: item.freq,
                duree: item.duree,
                quantite: item.qte,
              },
            });
          }
        }
      }

      // 7. Insert Justification
      if (cData.justification) {
        await prisma.justification.create({
          data: {
            patientId: patient.id,
            consultationId: consultation.id,
            titre: cData.justification.titre,
            texte: cData.justification.texte,
            duree: cData.justification.duree,
            dateDebut: cData.justification.dateDebut,
            dateFin: cData.justification.dateFin,
            createdAt: cData.date,
          },
        });
      }

      // 8. Insert BilanRecip
      if (cData.bilan) {
        const bilanRecip = await prisma.bilanRecip.create({
          data: {
            patientId: patient.id,
            consultationId: consultation.id,
            createdAt: cData.date,
          },
        });

        const bId = bilanMap[cData.bilan.nom];
        if (bId) {
          await prisma.bilanItem.create({
            data: {
              bilanRecipId: bilanRecip.id,
              bilanId: bId,
              resultat: cData.bilan.resultat,
              remarque: cData.bilan.remarque,
            },
          });
        }
      }

      const totalVersement = (cData.versements || []).reduce((acc, v) => acc + v.montant, 0);
      const reste = Math.max(0, cData.prix - totalVersement);
      const statut = reste === 0 ? "SOLDÉ" : totalVersement > 0 ? `PARTIEL (Reste: ${reste} DZD)` : `IMPAYÉ (Dette: ${reste} DZD)`;
      console.log(`      ↳ Consultation #${consultation.id} (${cData.date.toISOString().split("T")[0]}): ${cData.motif.substring(0, 45)}... | Tarif: ${cData.prix} DZD | Statut: ${statut}`);
    }
  }

  // --------------------------------------------------------------------------
  // 8. DÉPENSES DU CABINET MÉDICAL (DEPENSES)
  // --------------------------------------------------------------------------
  console.log("\n🏢 8. Génération des dépenses réelles d'exploitation du cabinet...");

  // Clean existing depenses to ensure exact idempotent financial reports
  await prisma.depense.deleteMany({});

  const depensesDataset = [
    {
      description: "Loyer professionnel du cabinet médical - Mois de Novembre 2026",
      montant: 45000,
      date: new Date("2026-11-02T09:00:00.000Z"),
    },
    {
      description: "Loyer professionnel du cabinet médical - Mois d'Octobre 2026",
      montant: 45000,
      date: new Date("2026-10-02T09:00:00.000Z"),
    },
    {
      description: "Loyer professionnel du cabinet médical - Mois de Septembre 2026",
      montant: 45000,
      date: new Date("2026-09-02T09:00:00.000Z"),
    },
    {
      description: "Consommables médicaux pédiatriques (abaisse-langues, gants d'examen nitrile, seringues et aiguilles pédiatriques, draps d'examen papier)",
      montant: 18500,
      date: new Date("2026-11-08T11:30:00.000Z"),
    },
    {
      description: "Facture électricité, éclairage et climatisation Sonelgaz (3ème trimestre)",
      montant: 12800,
      date: new Date("2026-10-15T14:00:00.000Z"),
    },
    {
      description: "Papeterie médicale (ordonnances personnalisées sécurisées, fiches de suivi, carnets et enveloppes)",
      montant: 8600,
      date: new Date("2026-10-22T10:15:00.000Z"),
    },
    {
      description: "Produits de désinfection hospitalière et hygiène du cabinet (Aniospray 29M, Savon doux antiseptique, gel hydroalcoolique)",
      montant: 7400,
      date: new Date("2026-11-12T16:00:00.000Z"),
    },
    {
      description: "Abonnement internet très haut débit fibre optique Algérie Télécom Idoom Fibre (Novembre 2026)",
      montant: 3200,
      date: new Date("2026-11-05T08:30:00.000Z"),
    },
    {
      description: "Achat kits de tests de diagnostic rapide (Streptest TDR angine, bandelettes urinaires 10 paramètres Combur)",
      montant: 14500,
      date: new Date("2026-10-28T13:45:00.000Z"),
    },
    {
      description: "Contrôle technique périodique et étalonnage métrologique pèse-bébé électronique et toise pédiatrique",
      montant: 9500,
      date: new Date("2026-09-18T15:20:00.000Z"),
    },
    {
      description: "Maintenance et nettoyage désinfection des climatiseurs salle d'attente et salle de consultation",
      montant: 6000,
      date: new Date("2026-09-25T11:00:00.000Z"),
    },
    {
      description: "Consommables d'urgence pédiatrique (chambres d'inhalation pédiatriques Babyhaler, masques néonataux, embouts thermomètres)",
      montant: 11200,
      date: new Date("2026-11-19T14:30:00.000Z"),
    },
  ];

  for (const dep of depensesDataset) {
    await prisma.depense.create({ data: dep });
  }
  console.log(`   ✅ ${depensesDataset.length} dépenses réelles d'exploitation enregistrées.`);

  // --------------------------------------------------------------------------
  // 9. RAPPORT FINAL & VÉRIFICATION DE LA COHÉRENCE
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("📊 RÉSUMÉ ET VÉRIFICATION DE LA COHÉRENCE CLINIQUE ET FINANCIÈRE");
  console.log("================================================================================");

  const totalPatients = await prisma.patient.count();
  const totalConsultations = await prisma.consultation.count();
  const totalVersements = await prisma.versement.count();
  const totalDepenses = await prisma.depense.count();
  const totalOrdonnances = await prisma.ordonnance.count();
  const totalBilans = await prisma.bilanRecip.count();
  const totalJustifications = await prisma.justification.count();
  const totalCourbeInfos = await prisma.courbeInfo.count();
  const totalVaccinations = await prisma.vaccination.count();

  // Aggregate financial metrics
  const consultSum = await prisma.consultation.aggregate({ _sum: { prix: true } });
  const versementSum = await prisma.versement.aggregate({ _sum: { montant: true } });
  const depenseSum = await prisma.depense.aggregate({ _sum: { montant: true } });

  const totalHonoraire = consultSum._sum.prix || 0;
  const totalRecettes = versementSum._sum.montant || 0;
  const totalDep = depenseSum._sum.montant || 0;
  const totalCredit = Math.max(0, totalHonoraire - totalRecettes);

  console.log(`   • Patients enregistrés           : ${totalPatients}`);
  console.log(`   • Consultations médicales        : ${totalConsultations}`);
  console.log(`   • Ordonnances délivrées          : ${totalOrdonnances}`);
  console.log(`   • Bilans de laboratoire rattachés: ${totalBilans}`);
  console.log(`   • Justificatifs & Certificats    : ${totalJustifications}`);
  console.log(`   • Mesures de croissance (Courbe) : ${totalCourbeInfos}`);
  console.log(`   • Vaccinations administrées      : ${totalVaccinations}`);
  console.log(`   • Dépenses du cabinet            : ${totalDepenses} (${totalDep.toLocaleString("fr-FR")} DZD)`);
  console.log(`   • Total Honoraires Consultations : ${totalHonoraire.toLocaleString("fr-FR")} DZD`);
  console.log(`   • Total Recettes Encaissées      : ${totalRecettes.toLocaleString("fr-FR")} DZD`);
  console.log(`   • Total Crédits Impayés (Dette)  : ${totalCredit.toLocaleString("fr-FR")} DZD`);

  console.log("\n🔍 Vérification des débiteurs :");
  const debtors = await prisma.patient.findMany({
    include: {
      consultations: {
        include: { versements: true },
      },
    },
  });

  let countDebtors = 0;
  for (const d of debtors) {
    const prixTotal = d.consultations.reduce((sum, c) => sum + (c.prix || 0), 0);
    const payeTotal = d.consultations.reduce(
      (sum, c) => sum + c.versements.reduce((vSum, v) => vSum + v.montant, 0),
      0
    );
    const dette = Math.max(0, prixTotal - payeTotal);
    if (dette > 0) {
      countDebtors++;
      console.log(`      🔴 ${d.nom} (Tél: ${d.telephone}) -> Honoraires: ${prixTotal} DZD | Payé: ${payeTotal} DZD | Reste dû: ${dette} DZD`);
    }
  }

  console.log(`\n✅ ${countDebtors} patients débiteurs avec crédit en cours identifiés (sur ${totalPatients} patients).`);
  console.log("🎉 Génération des données cliniques et financières terminée avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur pendant la génération :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
