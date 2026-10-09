/**
 * ============================================================================
 * test.js - Comprehensive Test Data Generator & Integrity Verification Suite
 * ============================================================================
 *
 * Covers 100% of the Prisma Schema models (22 models, 1 enum):
 *   1.  Cabinet
 *   2.  Medicament
 *   3.  Bilan
 *   4.  Vaccine
 *   5.  JustificationType
 *   6.  BilanType
 *   7.  BilanTypeItem
 *   8.  RecetteType
 *   9.  RecetteTypeItem
 *   10. RendezVous
 *   11. Patient
 *   12. Consultation
 *   13. Ordonnance
 *   14. OrdonnanceItem
 *   15. BilanRecip
 *   16. BilanItem
 *   17. Justification
 *   18. CourbeInfo
 *   19. Radio
 *   20. BilanFile
 *   21. Vaccination
 *   22. Paiement
 *
 * Safety & Protection:
 *   - Identifies all test-generated entities using the prefix/tag 'TEST_'
 *   - Never deletes, truncates, or modifies existing real patient / clinical data
 *   - Safe to run repeatedly (fully idempotent upsert & relation resolution)
 *   - Supports safe CLI options:
 *       node test.js          -> Generate/update test records, verify integrity, report
 *       node test.js --verify -> Verify data integrity and model coverage only
 *       node test.js --clean  -> Safely delete ONLY records created by this script
 *       node test.js --help   -> Display usage instructions
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");

// ==========================================
// 1. ENVIRONMENT CONFIGURATION & PRISMA INIT
// ==========================================

function loadEnv() {
  if (typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile();
    } catch (_) {}
  }
  if (!process.env.DATABASE_URL) {
    const envPath = path.join(__dirname, ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      envContent.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            let val = trimmed.substring(eqIdx + 1).trim();
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.substring(1, val.length - 1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  }
}

loadEnv();

let PrismaClient;
try {
  PrismaClient = require("./app/generated/prisma").PrismaClient;
} catch (e) {
  try {
    PrismaClient = require("@prisma/client").PrismaClient;
  } catch (err) {
    console.error("❌ Erreur : Impossible de charger PrismaClient :", err.message);
    process.exit(1);
  }
}

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

// Helper for safe query execution with retry
async function safeExec(fn, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      const waitTime = (i + 1) * 800;
      await new Promise((r) => setTimeout(r, waitTime));
    }
  }
}

const PREFIX = "TEST_";

// ==========================================
// 2. COMPREHENSIVE CLINICAL TEST DATA DEFINITIONS
// ==========================================

// --- Reference Catalogs ---

const TEST_MEDICAMENTS = [
  { nom: `${PREFIX}Amoxicilline 250mg/5ml suspension` },
  { nom: `${PREFIX}Amoxicilline-Acide Clavulanique 100mg/12.5mg/ml` },
  { nom: `${PREFIX}Céfixime 100mg/5ml suspension (Oroken)` },
  { nom: `${PREFIX}Azithromycine 200mg/5ml suspension (Zithromax)` },
  { nom: `${PREFIX}Paracétamol Sirop 2.4% (Doliprane)` },
  { nom: `${PREFIX}Paracétamol Suppositoire 150mg` },
  { nom: `${PREFIX}Ibuprofène 20mg/ml suspension (Advil pédiatrique)` },
  { nom: `${PREFIX}Célestène 0.05% gouttes buvables (Bétaméthasone)` },
  { nom: `${PREFIX}Salbutamol spray 100µg (Ventoline)` },
  { nom: `${PREFIX}Budésonide suspension pour inhalation 0.5mg/2ml (Pulmicort)` },
  { nom: `${PREFIX}Fluticasone 50µg spray aérosol (Flixotide)` },
  { nom: `${PREFIX}Sérum physiologique 0.9% dosettes 5ml` },
  { nom: `${PREFIX}Soluté de Réhydratation Orale (SRO / Adiaril)` },
  { nom: `${PREFIX}Diosmectite 3g sachets (Smecta pédiatrique)` },
  { nom: `${PREFIX}Racécadotril 10mg sachets (Tiorfan nourrisson)` },
  { nom: `${PREFIX}Ultra-Levure 50mg sachets (Saccharomyces boulardii)` },
  { nom: `${PREFIX}Gaviscon nourrisson suspension buvable` },
  { nom: `${PREFIX}Débridat suspension buvable (Trimébutine)` },
  { nom: `${PREFIX}Desloratadine sirop 0.5mg/ml (Aerius)` },
  { nom: `${PREFIX}Cétirizine gouttes buvables 10mg/ml (Zyrtec)` },
  { nom: `${PREFIX}Vitamine D3 200 000 UI ampoule buvable` },
  { nom: `${PREFIX}Vitamine D3 gouttes quotidiennes (Zyma-D)` },
  { nom: `${PREFIX}Fer ferrique sirop (Ferrostrane)` },
  { nom: `${PREFIX}Crème émolliente et réparatrice pédiatrique (Dexeryl)` },
  { nom: `${PREFIX}Bactrim pédiatrique suspension` },
  { nom: `${PREFIX}Josamycine 250mg/5ml suspension (Josacine)` },
  { nom: `${PREFIX}Pivalone 1% suspension nasale` },
];

const TEST_BILANS = [
  { nom: `${PREFIX}NFS / Numération Formule Sanguine complète` },
  { nom: `${PREFIX}CRP / Protéine C-Réactive quantitative` },
  { nom: `${PREFIX}Vitesse de Sédimentation (VS 1ère et 2ème heure)` },
  { nom: `${PREFIX}ECBU avec antibiogramme` },
  { nom: `${PREFIX}Ionogramme Sanguin (Na+, K+, Cl-, Bicarbonates)` },
  { nom: `${PREFIX}Glycémie veineuse à jeun` },
  { nom: `${PREFIX}Urée et Créatinine plasmatiques` },
  { nom: `${PREFIX}Bilan hépatique (ASAT, ALAT, Bilirubine totale/directe)` },
  { nom: `${PREFIX}Bilan martial (Fer sérique, Ferritine, CST)` },
  { nom: `${PREFIX}Bilan phospho-calcique et 25-OH Vitamine D` },
  { nom: `${PREFIX}Sérologie Maladie Cœliaque (Anti-tTG IgA + IgA totales)` },
  { nom: `${PREFIX}Coproculture et Examen Parasitologique des Selles` },
  { nom: `${PREFIX}Bilan d'Hémostase pré-opératoire (TP, TCA, Fibrinogène)` },
  { nom: `${PREFIX}TSH ultrasensible et T4 libre` },
  { nom: `${PREFIX}Bilan allergologique (IgE totales et Trophallergènes)` },
];

const TEST_VACCINES = [
  { name: `${PREFIX}BCG (Tuberculose)` },
  { name: `${PREFIX}Hépatite B pédiatrique` },
  { name: `${PREFIX}Pentavalent (DTC-Hib-HBV)` },
  { name: `${PREFIX}Hexavalent (DTC-Polio-Hib-HBV)` },
  { name: `${PREFIX}Pneumocoque conjugué 13-valent (PCV13)` },
  { name: `${PREFIX}Vaccin Poliomyélitique Oral (VPO)` },
  { name: `${PREFIX}Vaccin Poliomyélitique Injectable (VPI)` },
  { name: `${PREFIX}ROR (Rougeole - Oreillons - Rubéole)` },
  { name: `${PREFIX}Rotavirus oral` },
  { name: `${PREFIX}Méningocoque A+C+Y+W135` },
  { name: `${PREFIX}Varicelle pédiatrique` },
  { name: `${PREFIX}DTPolio Rappel scolaire` },
];

const TEST_JUSTIF_TYPES = [
  {
    nom: `${PREFIX}Dispense d'activités physiques et sportives`,
    texte:
      "Je soussigné(e), Docteur en médecine, certifie avoir examiné ce jour l'enfant mentionné ci-dessus et atteste que son état de santé justifie une dispense temporaire de cours d'éducation physique et sportive (EPS).",
  },
  {
    nom: `${PREFIX}Certificat d'inaptitude temporaire pour affection aiguë (Crèche/École)`,
    texte:
      "Je soussigné(e), Docteur en médecine, certifie que l'état de santé de l'enfant nécessite une éviction temporaire de la collectivité scolaire / crèche pour maladie infectieuse aiguë.",
  },
  {
    nom: `${PREFIX}Certificat de non-contagion (Retour en collectivité)`,
    texte:
      "Je soussigné(e), Docteur en médecine, certifie avoir réexaminé ce jour l'enfant et atteste qu'il ne présente plus aucun signe clinique de maladie contagieuse. La réintégration en collectivité est autorisée.",
  },
  {
    nom: `${PREFIX}Certificat de présence en consultation médicale`,
    texte:
      "Je soussigné(e), Docteur en médecine, certifie avoir reçu ce jour l'enfant mentionné ci-dessus pour une consultation médicale pédiatrique en présence de son représentant légal.",
  },
  {
    nom: `${PREFIX}Certificat d'aptitude aux activités sportives en club`,
    texte:
      "Je soussigné(e), Docteur en médecine, certifie avoir examiné ce jour l'enfant et n'avoir constaté aucune contre-indication clinique apparente à la pratique des activités sportives régulières.",
  },
  {
    nom: `${PREFIX}Garde d'enfant malade (Justificatif employeur parent)`,
    texte:
      "Je soussigné(e), Docteur en médecine, certifie que l'état de santé de l'enfant nécessite impérativement la présence et les soins continus de l'un de ses parents à domicile.",
  },
];

const TEST_RECETTES = [
  {
    nom: `${PREFIX}Protocole Angine Streptococcique / Pharyngite Aiguë`,
    items: [
      {
        medName: `${PREFIX}Amoxicilline 250mg/5ml suspension`,
        dosage: "50 mg/kg/jour en 2 prises",
        frequence: "Matin et soir au milieu des repas",
        duree: "6 jours",
        quantite: 2,
      },
      {
        medName: `${PREFIX}Paracétamol Sirop 2.4% (Doliprane)`,
        dosage: "1 dose-poids",
        frequence: "Toutes les 6 heures en cas de fièvre > 38.5°C",
        duree: "3 à 5 jours",
        quantite: 1,
      },
      {
        medName: `${PREFIX}Sérum physiologique 0.9% dosettes 5ml`,
        dosage: "1 dosette dans chaque narine",
        frequence: "3 fois par jour",
        duree: "7 jours",
        quantite: 1,
      },
    ],
  },
  {
    nom: `${PREFIX}Protocole Bronchiolite du Nourrisson`,
    items: [
      {
        medName: `${PREFIX}Sérum physiologique 0.9% dosettes 5ml`,
        dosage: "Désobstruction rhinopharyngée soigneuse",
        frequence: "Avant chaque repas et au coucher (4 à 6 fois/j)",
        duree: "8 jours",
        quantite: 3,
      },
      {
        medName: `${PREFIX}Salbutamol spray 100µg (Ventoline)`,
        dosage: "2 bouffées avec chambre d'inhalation pédiatrique",
        frequence: "3 à 4 fois par jour si sifflements",
        duree: "5 jours",
        quantite: 1,
      },
      {
        medName: `${PREFIX}Paracétamol Sirop 2.4% (Doliprane)`,
        dosage: "1 dose-poids",
        frequence: "Toutes les 6 heures si fièvre",
        duree: "3 jours",
        quantite: 1,
      },
    ],
  },
  {
    nom: `${PREFIX}Protocole Gastro-Entérite Aiguë (GEA) & Réhydratation`,
    items: [
      {
        medName: `${PREFIX}Soluté de Réhydratation Orale (SRO / Adiaril)`,
        dosage: "1 sachet pour 200 ml d'eau",
        frequence: "À volonté par petites gorgées régulières",
        duree: "48 à 72 heures",
        quantite: 2,
      },
      {
        medName: `${PREFIX}Racécadotril 10mg sachets (Tiorfan nourrisson)`,
        dosage: "1 sachet 3 fois par jour",
        frequence: "Avec les repas ou dans le liquide de réhydratation",
        duree: "4 jours",
        quantite: 1,
      },
      {
        medName: `${PREFIX}Ultra-Levure 50mg sachets (Saccharomyces boulardii)`,
        dosage: "1 sachet par jour",
        frequence: "Dilué dans un yaourt ou compote",
        duree: "5 jours",
        quantite: 1,
      },
    ],
  },
  {
    nom: `${PREFIX}Protocole Otite Moyenne Aiguë (OMA)`,
    items: [
      {
        medName: `${PREFIX}Amoxicilline-Acide Clavulanique 100mg/12.5mg/ml`,
        dosage: "80 mg/kg/jour en 3 prises",
        frequence: "Toutes les 8 heures",
        duree: "8 jours",
        quantite: 2,
      },
      {
        medName: `${PREFIX}Paracétamol Sirop 2.4% (Doliprane)`,
        dosage: "1 dose-poids",
        frequence: "Toutes les 6 heures systématiquement les 48 premières heures",
        duree: "5 jours",
        quantite: 1,
      },
    ],
  },
  {
    nom: `${PREFIX}Protocole Crise d'Asthme / Toux Spasmodique`,
    items: [
      {
        medName: `${PREFIX}Salbutamol spray 100µg (Ventoline)`,
        dosage: "2 bouffées avec chambre d'inhalation",
        frequence: "Toutes les 4 heures pendant 48h puis espacer",
        duree: "7 jours",
        quantite: 1,
      },
      {
        medName: `${PREFIX}Célestène 0.05% gouttes buvables (Bétaméthasone)`,
        dosage: "10 gouttes/kg/jour en 1 prise matinale",
        frequence: "Le matin après le petit-déjeuner",
        duree: "3 jours",
        quantite: 1,
      },
      {
        medName: `${PREFIX}Fluticasone 50µg spray aérosol (Flixotide)`,
        dosage: "1 bouffée matin et soir",
        frequence: "Traitement régulateur de fond",
        duree: "1 mois",
        quantite: 1,
      },
    ],
  },
  {
    nom: `${PREFIX}Protocole Prophylaxie Rachitisme & Carence Martiale`,
    items: [
      {
        medName: `${PREFIX}Vitamine D3 200 000 UI ampoule buvable`,
        dosage: "1 ampoule dose unique",
        frequence: "À prendre en une fois avec un peu de lait",
        duree: "Dose unique",
        quantite: 1,
      },
      {
        medName: `${PREFIX}Fer ferrique sirop (Ferrostrane)`,
        dosage: "1 cuillère mesure par jour",
        frequence: "En dehors des repas avec un jus de fruit",
        duree: "2 mois",
        quantite: 2,
      },
    ],
  },
];

const TEST_BILAN_TYPES = [
  {
    nom: `${PREFIX}Bilan Infectieux & Inflammatoire Pédiatrique`,
    items: [
      { bilanName: `${PREFIX}NFS / Numération Formule Sanguine complète`, remarque: "Recherche hyperleucocytose ou neutropénie" },
      { bilanName: `${PREFIX}CRP / Protéine C-Réactive quantitative`, remarque: "Évaluation du syndrome inflammatoire aigu" },
      { bilanName: `${PREFIX}Vitesse de Sédimentation (VS 1ère et 2ème heure)`, remarque: "Cinétique inflammatoire" },
    ],
  },
  {
    nom: `${PREFIX}Bilan Anémie Microcytaire & Carence Martiale`,
    items: [
      { bilanName: `${PREFIX}NFS / Numération Formule Sanguine complète`, remarque: "Recherche microcytose et hypochromie" },
      { bilanName: `${PREFIX}Bilan martial (Fer sérique, Ferritine, CST)`, remarque: "Dosage de ferritine sérique à jeun" },
    ],
  },
  {
    nom: `${PREFIX}Bilan Retard Staturo-Pondéral & Malabsorption`,
    items: [
      { bilanName: `${PREFIX}NFS / Numération Formule Sanguine complète`, remarque: "Recherche anémie associée" },
      { bilanName: `${PREFIX}Sérologie Maladie Cœliaque (Anti-tTG IgA + IgA totales)`, remarque: "Dépistage maladie cœliaque" },
      { bilanName: `${PREFIX}TSH ultrasensible et T4 libre`, remarque: "Élimination hypothyroïdie acquise" },
      { bilanName: `${PREFIX}Bilan phospho-calcique et 25-OH Vitamine D`, remarque: "Statut phosphocalcique" },
    ],
  },
  {
    nom: `${PREFIX}Bilan Néphro-Urologique & Infection Urinaire`,
    items: [
      { bilanName: `${PREFIX}ECBU avec antibiogramme`, remarque: "Prélèvement stérile avant toute antibiothérapie" },
      { bilanName: `${PREFIX}Urée et Créatinine plasmatiques`, remarque: "Évaluation de la fonction rénale" },
      { bilanName: `${PREFIX}Ionogramme Sanguin (Na+, K+, Cl-, Bicarbonates)`, remarque: "Équilibre hydro-électrolytique" },
    ],
  },
  {
    nom: `${PREFIX}Bilan Pré-opératoire Nourrisson & Enfant`,
    items: [
      { bilanName: `${PREFIX}NFS / Numération Formule Sanguine complète`, remarque: "Taux d'hémoglobine et plaquettes" },
      { bilanName: `${PREFIX}Bilan d'Hémostase pré-opératoire (TP, TCA, Fibrinogène)`, remarque: "Recherche coagulopathie infraclinique" },
    ],
  },
];

const TEST_APPOINTMENTS = [
  { daysOffset: -30, time: "09:30", description: `[${PREFIX}] Consultation initiale nouveau-né et sortie de maternité` },
  { daysOffset: -21, time: "10:00", description: `[${PREFIX}] Visite du 1er mois et contrôle de croissance` },
  { daysOffset: -14, time: "11:15", description: `[${PREFIX}] Contrôle tympanique post-otite et réévaluation auditive` },
  { daysOffset: -7,  time: "14:00", description: `[${PREFIX}] Réévaluation bronchiolite aiguë et auscultation pulmonaire` },
  { daysOffset: -3,  time: "15:30", description: `[${PREFIX}] Contrôle biologique après antibiothérapie pour pyélonéphrite` },
  { daysOffset: 0,   time: "09:00", description: `[${PREFIX}] Consultation du jour : Fièvre aiguë prolongée depuis 48h` },
  { daysOffset: 0,   time: "11:00", description: `[${PREFIX}] Consultation du jour : Visite systématique 9ème mois` },
  { daysOffset: 1,   time: "10:30", description: `[${PREFIX}] Contrôle post-traitement gastro-entérite et réhydratation` },
  { daysOffset: 3,   time: "14:00", description: `[${PREFIX}] Bilan allergologique et interprétation des prick-tests` },
  { daysOffset: 7,   time: "09:30", description: `[${PREFIX}] Rappel de vaccination Pentavalent et Pneumocoque 4ème mois` },
  { daysOffset: 14,  time: "10:00", description: `[${PREFIX}] Visite des 12 mois : Vaccin ROR + VPO et bilan psychomoteur` },
  { daysOffset: 21,  time: "11:00", description: `[${PREFIX}] Contrôle de courbe staturo-pondérale après régime sans gluten` },
  { daysOffset: 30,  time: "16:00", description: `[${PREFIX}] Visite annuelle de suivi asthme et renouvellement de PAI` },
  { daysOffset: 45,  time: "10:00", description: `[${PREFIX}] Suivi prématurité à 18 mois d'âge corrigé` },
  { daysOffset: 60,  time: "15:00", description: `[${PREFIX}] Contrôle cardiologique pédiatrique pour souffle fonctionnel` },
];

// --- Comprehensive Pediatric Patient Cohort (25 Patients) ---
const TEST_PATIENTS = [
  // 1. Nouveau-né à terme (15 jours)
  {
    nom: `${PREFIX}Amrani Rayan`,
    age: 0,
    dateDeNaissance: new Date("2026-09-24"),
    sexe: "M",
    telephone: "0550112233",
    adresse: "Cité des Martyrs, Bloc C, Skikda",
    antecedents: "Accouchement voie basse à terme (39 SA), Apgar 10/10, bon cri initial.",
    poidsDeNaissance: 3.45,
    groupeSanguin: "O_POS",
  },
  // 2. Nourrisson 2 mois (Visite vaccinale & Reflux)
  {
    nom: `${PREFIX}Bouzid Lina`,
    age: 0,
    dateDeNaissance: new Date("2026-08-09"),
    sexe: "F",
    telephone: "0551223344",
    adresse: "Rue Frères Kafi, El-Harrouch, Skikda",
    antecedents: "Reflux gastro-œsophagien (RGO) simple du nourrisson sans œsophagite.",
    poidsDeNaissance: 3.2,
    groupeSanguin: "A_POS",
  },
  // 3. Nourrisson 4 mois (Bronchiolite aiguë)
  {
    nom: `${PREFIX}Khelifi Mehdi`,
    age: 0,
    dateDeNaissance: new Date("2026-06-09"),
    sexe: "M",
    telephone: "0560334455",
    adresse: "Cité 500 Logements, Skikda",
    antecedents: "Épisode de bronchiolite à 3 mois, pas d'atopie familiale.",
    poidsDeNaissance: 3.6,
    groupeSanguin: "B_POS",
  },
  // 4. Nourrisson 6 mois (Diversification & Eczéma)
  {
    nom: `${PREFIX}Mansouri Sarah`,
    age: 0,
    dateDeNaissance: new Date("2026-04-09"),
    sexe: "F",
    telephone: "0770445566",
    adresse: "Boulevard Didouche Mourad, Skikda",
    antecedents: "Dermatite atopique modérée des joues et plis de flexion, terrain atopique paternel.",
    poidsDeNaissance: 3.15,
    groupeSanguin: "AB_POS",
  },
  // 5. Nourrisson 9 mois (Cassure staturo-pondérale / Cœliaque)
  {
    nom: `${PREFIX}Zeroual Youcef`,
    age: 0,
    dateDeNaissance: new Date("2026-01-09"),
    sexe: "M",
    telephone: "0661556677",
    adresse: "Cité des Jardins, Azzaba, Skikda",
    antecedents: "Stagnation pondérale depuis l'introduction du gluten à 6 mois.",
    poidsDeNaissance: 3.3,
    groupeSanguin: "O_NEG",
  },
  // 6. Nourrisson 12 mois (Visite des 1 an & Vaccin ROR)
  {
    nom: `${PREFIX}Haddad Nour`,
    age: 1,
    dateDeNaissance: new Date("2025-10-09"),
    sexe: "F",
    telephone: "0558667788",
    adresse: "Cité 20 Août 1955, Skikda",
    antecedents: "Bon développement psychomoteur, marche acquise à 11 mois et demi.",
    poidsDeNaissance: 3.0,
    groupeSanguin: "A_NEG",
  },
  // 7. Petite enfance 18 mois (Gastro-entérite aiguë)
  {
    nom: `${PREFIX}Belkacem Adam`,
    age: 1,
    dateDeNaissance: new Date("2025-04-09"),
    sexe: "M",
    telephone: "0561778899",
    adresse: "Cité Bachir Boukadoum, Ramdane Djamel",
    antecedents: "Otites récidivantes l'hiver dernier.",
    poidsDeNaissance: 3.5,
    groupeSanguin: "B_NEG",
  },
  // 8. Enfant 2 ans (Convulsion fébrile simple)
  {
    nom: `${PREFIX}Derradji Ines`,
    age: 2,
    dateDeNaissance: new Date("2024-10-09"),
    sexe: "F",
    telephone: "0772889900",
    adresse: "Rue Zighoud Youcef, El-Harrouch",
    antecedents: "Épisode unique de convulsion fébrile simple à 18 mois lors d'une virose.",
    poidsDeNaissance: 3.4,
    groupeSanguin: "AB_NEG",
  },
  // 9. Enfant 3 ans (Allergie protéines de lait de vache résolue)
  {
    nom: `${PREFIX}Bensalem Zakaria`,
    age: 3,
    dateDeNaissance: new Date("2023-10-09"),
    sexe: "M",
    telephone: "0555990011",
    adresse: "Coopérative El-Amel, Skikda",
    antecedents: "APLV guérie après réintroduction progressive sous surveillance hospitalière.",
    poidsDeNaissance: 2.85,
    groupeSanguin: "O_POS",
  },
  // 10. Enfant 4 ans (Asthme du nourrisson en rémission)
  {
    nom: `${PREFIX}Chérif Maya`,
    age: 4,
    dateDeNaissance: new Date("2022-10-09"),
    sexe: "F",
    telephone: "0660123456",
    adresse: "Cité Merdj Eddib, Skikda",
    antecedents: "Asthme léger intermittent sous Ventoline à la demande.",
    poidsDeNaissance: 3.25,
    groupeSanguin: "A_POS",
  },
  // 11. Enfant 5 ans (Otite séromuqueuse & Végétations)
  {
    nom: `${PREFIX}Saadi Sofiane`,
    age: 5,
    dateDeNaissance: new Date("2021-10-09"),
    sexe: "M",
    telephone: "0562234567",
    adresse: "Village Agricole, Ain Bouziane",
    antecedents: "Hypertrophie des végétations adénoïdes, respiration buccale nocturne.",
    poidsDeNaissance: 3.7,
    groupeSanguin: "B_POS",
  },
  // 12. Enfant 6 ans (Rappel vaccinal DTPolio scolaire)
  {
    nom: `${PREFIX}Meziane Rania`,
    age: 6,
    dateDeNaissance: new Date("2020-10-09"),
    sexe: "F",
    telephone: "0773345678",
    adresse: "Rue de la Révolution, Skikda",
    antecedents: "Aucun antécédent pathologique notable.",
    poidsDeNaissance: 3.3,
    groupeSanguin: "O_POS",
  },
  // 13. Enfant 7 ans (Angine streptococcique récidivante)
  {
    nom: `${PREFIX}Boudiaf Walid`,
    age: 7,
    dateDeNaissance: new Date("2019-10-09"),
    sexe: "M",
    telephone: "0554456789",
    adresse: "Cité 700 Logements, El-Harrouch",
    antecedents: "Angines érythématopultacées fréquentes, allergie modérée aux acariens.",
    poidsDeNaissance: 3.4,
    groupeSanguin: "A_POS",
  },
  // 14. Enfant 8 ans (Énurésie nocturne primaire isolée)
  {
    nom: `${PREFIX}Guenifi Selma`,
    age: 8,
    dateDeNaissance: new Date("2018-10-09"),
    sexe: "F",
    telephone: "0663567890",
    adresse: "Cité Frères Saker, Skikda",
    antecedents: "Énurésie nocturne primaire monosymptomatique sans anomalie néphrologique.",
    poidsDeNaissance: 3.1,
    groupeSanguin: "O_POS",
  },
  // 15. Enfant 9 ans (Asthme persistant modéré)
  {
    nom: `${PREFIX}Larbi Sami`,
    age: 9,
    dateDeNaissance: new Date("2017-10-09"),
    sexe: "M",
    telephone: "0563678901",
    adresse: "Cité Universitaire El-Hadaiek",
    antecedents: "Asthme persistant traité par corticoïdes inhalés au long cours.",
    poidsDeNaissance: 3.65,
    groupeSanguin: "AB_POS",
  },
  // 16. Enfant 10 ans (Bilan d'aptitude sportive Judo)
  {
    nom: `${PREFIX}Rahmouni Yasmine`,
    age: 10,
    dateDeNaissance: new Date("2016-10-09"),
    sexe: "F",
    telephone: "0774789012",
    adresse: "Résidence Les Pins, Skikda",
    antecedents: "Excellente condition physique, pratique du judo en club compétitif.",
    poidsDeNaissance: 3.5,
    groupeSanguin: "B_POS",
  },
  // 17. Prématuré 32 SA (14 mois âge corrigé)
  {
    nom: `${PREFIX}Bensaada Idriss`,
    age: 1,
    dateDeNaissance: new Date("2025-06-15"),
    sexe: "M",
    telephone: "0556890123",
    adresse: "Cité Sidi Ahmed, Skikda",
    antecedents: "Grande prématurité à 32 SA, séjour néonatalogie 3 semaines, surveillance neurodéveloppementale étroite.",
    poidsDeNaissance: 1.65, // Très faible poids de naissance
    groupeSanguin: "A_NEG",
  },
  // 18. Ancien prématuré hypotrophique (3 ans)
  {
    nom: `${PREFIX}Taibi Manel`,
    age: 3,
    dateDeNaissance: new Date("2023-05-20"),
    sexe: "F",
    telephone: "0664901234",
    adresse: "Cité 100 Logements, Collo",
    antecedents: "Retard de croissance intra-utérin (RCIU) harmonieux, rattrapage staturo-pondéral satisfaisant.",
    poidsDeNaissance: 1.95,
    groupeSanguin: "O_NEG",
  },
  // 19. Macrosome de naissance (Enfant 4 ans)
  {
    nom: `${PREFIX}Zaidi Othmane`,
    age: 4,
    dateDeNaissance: new Date("2022-03-14"),
    sexe: "M",
    telephone: "0565012345",
    adresse: "Centre-Ville, Tamalous, Skikda",
    antecedents: "Macrosomie fœtale (diabète gestationnel maternel équilibré), glycémies néonatales normales.",
    poidsDeNaissance: 4.65, // Macrosomie
    groupeSanguin: "B_POS",
  },
  // 20. Adolescent 12 ans (Scoliose idiopathique débutante)
  {
    nom: `${PREFIX}Hamlaoui Kenza`,
    age: 12,
    dateDeNaissance: new Date("2014-10-09"),
    sexe: "F",
    telephone: "0775123456",
    adresse: "Cité La Paix, Skikda",
    antecedents: "Scoliose dorso-lombaire idiopathique débutante sous surveillance radiologique semestrielle.",
    poidsDeNaissance: 3.3,
    groupeSanguin: "A_POS",
  },
  // 21. Adolescent 14 ans (Bilan cardiologique pour souffle fonctionnel)
  {
    nom: `${PREFIX}Boulkroun Fares`,
    age: 14,
    dateDeNaissance: new Date("2012-10-09"),
    sexe: "M",
    telephone: "0557234567",
    adresse: "Boulevard de la Soummam, Skikda",
    antecedents: "Souffle cardiaque méso-systolique anorganique (innocent), échocardiographie normale.",
    poidsDeNaissance: 3.8,
    groupeSanguin: "O_POS",
  },
  // 22. Patient Boundary : Groupe sanguin non déterminé (null)
  {
    nom: `${PREFIX}Nasri Maria`,
    age: 2,
    dateDeNaissance: new Date("2024-07-01"),
    sexe: "F",
    telephone: "0665345678",
    adresse: "Cité du Port, Skikda",
    antecedents: "Aucun, carnet de santé à jour.",
    poidsDeNaissance: 3.1,
    groupeSanguin: null, // Test enum optionnel
  },
  // 23. Patient Boundary : Nouveau dossier (0 consultation, RDV futur uniquement)
  {
    nom: `${PREFIX}Toumi Ayoub`,
    age: 5,
    dateDeNaissance: new Date("2021-02-15"),
    sexe: "M",
    telephone: "0566456789",
    adresse: "Cité Émoul, Skikda",
    antecedents: "Dossier ouvert pour prise de premier rendez-vous de dépistage.",
    poidsDeNaissance: 3.4,
    groupeSanguin: "A_POS",
  },
  // 24. Patient Boundary : Poids de naissance inconnu (null)
  {
    nom: `${PREFIX}Driss Camelia`,
    age: 6,
    dateDeNaissance: new Date("2020-05-12"),
    sexe: "F",
    telephone: "0776567890",
    adresse: "Cité 200 Logements, El-Harrouch",
    antecedents: null,
    poidsDeNaissance: null, // Test valeur nulle
    groupeSanguin: "B_NEG",
  },
  // 25. Patient Multi-visites : Suivi complet sur 1 an
  {
    nom: `${PREFIX}Bacha Khaled`,
    age: 1,
    dateDeNaissance: new Date("2025-08-01"),
    sexe: "M",
    telephone: "0558678901",
    adresse: "Rue Commandant Si Zoubir, Skikda",
    antecedents: "Suivi régulier pédiatrique pour courbe de croissance et surveillance alimentaire.",
    poidsDeNaissance: 3.25,
    groupeSanguin: "O_POS",
  },
];

// ==========================================
// 3. SEEDING & DATA INTEGRITY EXECUTION
// ==========================================

async function runSeed() {
  console.log("\n================================================================================");
  console.log("🏥 GÉNÉRATION COMPLÈTE DU JEU DE DONNÉES DE TEST PÉDIATRIQUE (22 MODÈLES PRISMA)");
  console.log("================================================================================\n");

  const results = {};

  // 1. Cabinet Médical
  console.log("🏢 1/14. Configuration du Cabinet Médical...");
  let cabinet = await safeExec(() => prisma.cabinet.findFirst());
  if (!cabinet) {
    cabinet = await safeExec(() =>
      prisma.cabinet.create({
        data: {
          title: "Professeur",
          doctorName: "Professeur Amel",
          doctorNameAr: "بروفيسور آمال",
          specialty: "Médecin Spécialiste en Pédiatrie et Néonatologie",
          specialtyAr: "طبيبة مختصة في طب الأطفال و حديثي الولادة",
          cabinetName: "Cabinet Pédiatrique Spécialisé",
          cabinetNameAr: "عيادة طب الأطفال المتخصصة",
          address: "Rue Frères KAFI logts 38, 1er étage",
          addressAr: "شارع الإخوة كافي عقار 38 الطابق الأول",
          city: "El-Harrouch SKIKDA",
          cityAr: "الحروش - سكيكدة",
          phones: "0652 76 89 72 / 0562 24 40 87",
          logo: "/uploads/image.PNG",
        },
      })
    );
  }
  results["Cabinet"] = 1;
  console.log(`   ✅ Cabinet médical configuré (ID: ${cabinet.id}).`);

  // 2. Médicaments
  console.log("\n💊 2/14. Insertion des Médicaments de Test...");
  for (const med of TEST_MEDICAMENTS) {
    await safeExec(() =>
      prisma.medicament.upsert({
        where: { nom: med.nom },
        update: {},
        create: med,
      })
    );
  }
  const allMeds = await safeExec(() =>
    prisma.medicament.findMany({ where: { nom: { startsWith: PREFIX } } })
  );
  const medMap = {};
  allMeds.forEach((m) => (medMap[m.nom] = m));
  results["Medicament"] = allMeds.length;
  console.log(`   ✅ ${allMeds.length} médicaments de test prêts.`);

  // 3. Bilans
  console.log("\n🧪 3/14. Insertion des Analyses Biologiques de Test...");
  for (const b of TEST_BILANS) {
    await safeExec(() =>
      prisma.bilan.upsert({
        where: { nom: b.nom },
        update: {},
        create: b,
      })
    );
  }
  const allBilans = await safeExec(() =>
    prisma.bilan.findMany({ where: { nom: { startsWith: PREFIX } } })
  );
  const bilanMap = {};
  allBilans.forEach((b) => (bilanMap[b.nom] = b));
  results["Bilan"] = allBilans.length;
  console.log(`   ✅ ${allBilans.length} types d'analyses de test prêts.`);

  // 4. Vaccins
  console.log("\n💉 4/14. Insertion des Vaccins du Calendrier...");
  for (const v of TEST_VACCINES) {
    await safeExec(() =>
      prisma.vaccine.upsert({
        where: { name: v.name },
        update: {},
        create: v,
      })
    );
  }
  const allVaccines = await safeExec(() =>
    prisma.vaccine.findMany({ where: { name: { startsWith: PREFIX } } })
  );
  const vaccineMap = {};
  allVaccines.forEach((v) => (vaccineMap[v.name] = v));
  results["Vaccine"] = allVaccines.length;
  console.log(`   ✅ ${allVaccines.length} vaccins de test prêts.`);

  // 5. JustificationType
  console.log("\n📄 5/14. Insertion des Modèles de Justifications...");
  for (const jt of TEST_JUSTIF_TYPES) {
    await safeExec(() =>
      prisma.justificationType.upsert({
        where: { nom: jt.nom },
        update: { texte: jt.texte },
        create: jt,
      })
    );
  }
  const allJustifTypes = await safeExec(() =>
    prisma.justificationType.findMany({ where: { nom: { startsWith: PREFIX } } })
  );
  results["JustificationType"] = allJustifTypes.length;
  console.log(`   ✅ ${allJustifTypes.length} modèles de justification enregistrés.`);

  // 6. RecetteType & RecetteTypeItem
  console.log("\n📋 6/14. Configuration des Protocoles Thérapeutiques (RecetteType)...");
  let recetteItemCount = 0;
  for (const rt of TEST_RECETTES) {
    let rec = await safeExec(() =>
      prisma.recetteType.findFirst({
        where: { nom: rt.nom },
        include: { items: true },
      })
    );
    if (!rec) {
      rec = await safeExec(() =>
        prisma.recetteType.create({ data: { nom: rt.nom } })
      );
    }
    if (!rec.items || rec.items.length === 0) {
      for (const it of rt.items) {
        const med = medMap[it.medName];
        if (med) {
          await safeExec(() =>
            prisma.recetteTypeItem.create({
              data: {
                recetteId: rec.id,
                medicamentId: med.id,
                dosage: it.dosage,
                frequence: it.frequence,
                duree: it.duree,
                quantite: it.quantite,
              },
            })
          );
          recetteItemCount++;
        }
      }
    } else {
      recetteItemCount += rec.items.length;
    }
  }
  const allRecetteTypes = await safeExec(() =>
    prisma.recetteType.findMany({ where: { nom: { startsWith: PREFIX } } })
  );
  results["RecetteType"] = allRecetteTypes.length;
  results["RecetteTypeItem"] = recetteItemCount;
  console.log(`   ✅ ${allRecetteTypes.length} ordonnances types (${recetteItemCount} items associés).`);

  // 7. BilanType & BilanTypeItem
  console.log("\n📑 7/14. Configuration des Profils Biologiques (BilanType)...");
  let bilanTypeItemCount = 0;
  for (const bt of TEST_BILAN_TYPES) {
    let bType = await safeExec(() =>
      prisma.bilanType.findFirst({
        where: { nom: bt.nom },
        include: { items: true },
      })
    );
    if (!bType) {
      bType = await safeExec(() =>
        prisma.bilanType.create({ data: { nom: bt.nom } })
      );
    }
    if (!bType.items || bType.items.length === 0) {
      for (const it of bt.items) {
        const b = bilanMap[it.bilanName];
        if (b) {
          await safeExec(() =>
            prisma.bilanTypeItem.create({
              data: {
                bilanTypeId: bType.id,
                bilanId: b.id,
                remarque: it.remarque,
              },
            })
          );
          bilanTypeItemCount++;
        }
      }
    } else {
      bilanTypeItemCount += bType.items.length;
    }
  }
  const allBilanTypes = await safeExec(() =>
    prisma.bilanType.findMany({ where: { nom: { startsWith: PREFIX } } })
  );
  results["BilanType"] = allBilanTypes.length;
  results["BilanTypeItem"] = bilanTypeItemCount;
  console.log(`   ✅ ${allBilanTypes.length} bilans types (${bilanTypeItemCount} analyses associées).`);

  // 8. RendezVous
  console.log("\n📅 8/14. Génération des Rendez-vous Cliniques...");
  const createdRdvs = [];
  for (const rdvData of TEST_APPOINTMENTS) {
    const rdvDate = new Date();
    rdvDate.setDate(rdvDate.getDate() + rdvData.daysOffset);
    const [hours, minutes] = rdvData.time.split(":").map(Number);
    rdvDate.setHours(hours, minutes, 0, 0);

    let existingRdv = await safeExec(() =>
      prisma.rendezVous.findFirst({
        where: { description: rdvData.description },
      })
    );
    if (!existingRdv) {
      existingRdv = await safeExec(() =>
        prisma.rendezVous.create({
          data: {
            date: rdvDate,
            description: rdvData.description,
          },
        })
      );
    }
    createdRdvs.push(existingRdv);
  }
  results["RendezVous"] = createdRdvs.length;
  console.log(`   ✅ ${createdRdvs.length} rendez-vous de test configurés.`);

  // 9. Patients
  console.log("\n👶 9/14. Enregistrement des Dossiers Patients Pédiatriques...");
  const patientMap = {};
  for (const p of TEST_PATIENTS) {
    const pat = await safeExec(() =>
      prisma.patient.upsert({
        where: { nom: p.nom },
        update: {
          age: p.age,
          dateDeNaissance: p.dateDeNaissance,
          sexe: p.sexe,
          telephone: p.telephone,
          adresse: p.adresse,
          antecedents: p.antecedents,
          poidsDeNaissance: p.poidsDeNaissance,
          groupeSanguin: p.groupeSanguin,
        },
        create: p,
      })
    );
    patientMap[p.nom] = pat;
  }
  results["Patient"] = Object.keys(patientMap).length;
  console.log(`   ✅ ${Object.keys(patientMap).length} dossiers patients pédiatriques créés / synchronisés.`);

  // 10. Consultations & Clinical Interconnections
  console.log("\n🩺 10/14. Génération des Consultations & Actes Cliniques Interconnectés...");

  let consultationCount = 0;
  let ordonnanceCount = 0;
  let ordonnanceItemCount = 0;
  let bilanRecipCount = 0;
  let bilanItemCount = 0;
  let justificationCount = 0;
  let courbeInfoCount = 0;
  let radioCount = 0;
  let bilanFileCount = 0;
  let vaccinationCount = 0;
  let paiementCount = 0;

  // Plan comprehensive interconnected consultation workflows per patient scenario
  const CLINICAL_SCENARIOS = [
    // Scenario 1: Nouveau-né Amrani Rayan (Visite j15, ictère bénin résolutif, courbe néonatale, paiement)
    {
      patientKey: `${PREFIX}Amrani Rayan`,
      consultations: [
        {
          motif: "Visite des 15 jours de vie, surveillance ictère cutané néonatal et cordon ombilical",
          note: "Bonne vitalité, succion vigoureuse au sein maternel. Ictère cutané au visage uniquement (Kramer 1), selles bien colorées dorées, urines claires. Chute du cordon ombilical effective, cicatrice ombilicale propre et sèche sans hernie.",
          vitals: { poids: 3.7, taille: 51.5, perimetreCranien: 36.0, temp: 36.9, fc: 135, fr: 40, sao2: 99 },
          neuro: "Réflexes archaïques présents et symétriques (Moro, succion, agrippement).",
          rdvIndex: 0,
          ordonnance: [
            { med: `${PREFIX}Vitamine D3 gouttes quotidiennes (Zyma-D)`, dosage: "4 gouttes par jour", freq: "Le matin avec une cuillère de lait", duree: "En continu", qte: 1 },
            { med: `${PREFIX}Sérum physiologique 0.9% dosettes 5ml`, dosage: "Désobstruction rhinopharyngée si nez encombré", freq: "Au besoin", duree: "10 jours", qte: 1 },
          ],
          bilan: null,
          justif: "Certificat de présence en consultation médicale délivré à la mère.",
          courbe: { age: "15 jours", poids: 3.7, taille: 51.5, perimetreCranien: 36.0 },
          radio: null,
          bilanFile: null,
          vaccine: { name: `${PREFIX}BCG (Tuberculose)`, dose: 1, notes: "Vaccination BCG réalisée à la maternité vérifiée." },
          paiement: 2500,
        },
      ],
      standaloneCourbes: [
        { age: "Naissance", poids: 3.45, taille: 50.0, perimetreCranien: 35.0, daysAgo: 15 },
        { age: "5 jours", poids: 3.25, taille: 50.5, perimetreCranien: 35.2, daysAgo: 10 },
      ],
    },

    // Scenario 2: Nourrisson Bouzid Lina (2 mois, vaccins, RGO, radio reflux, bilan de contrôle)
    {
      patientKey: `${PREFIX}Bouzid Lina`,
      consultations: [
        {
          motif: "Visite systématique du 2ème mois, régurgitations post-prandiales fréquentes",
          note: "Régurgitations faciles indolores sans cassure pondérale. Examen de l'abdomen souple sans masse ni hépatomégalie. Bonne prise de poids globale (+950g depuis naissance).",
          vitals: { poids: 4.15, taille: 55.0, perimetreCranien: 38.0, temp: 37.1, fc: 125, fr: 34, sao2: 99 },
          neuro: "Sourire réponse acquis, poursuite oculaire à 180°, tenue de tête ébauchée en position assise.",
          rdvIndex: 1,
          ordonnance: [
            { med: `${PREFIX}Gaviscon nourrisson suspension buvable`, dosage: "1 ml après chaque tétée", freq: "4 à 5 fois par jour", duree: "15 jours", qte: 1 },
            { med: `${PREFIX}Paracétamol Sirop 2.4% (Doliprane)`, dosage: "1 dose-poids", freq: "Toutes les 6h si fièvre post-vaccinale", duree: "48 heures", qte: 1 },
          ],
          bilan: null,
          justif: "Certificat médical d'aptitude à la vie en collectivité en crèche avec protocole RGO.",
          courbe: { age: "2 mois", poids: 4.15, taille: 55.0, perimetreCranien: 38.0 },
          radio: { desc: "Échographie œso-gastrique pédiatrique : pas de sténose du pylore, reflux gastro-œsophagien modéré intermittent.", file: "/uploads/radios/echo_rgo_bouzid_lina.png" },
          bilanFile: null,
          vaccine: { name: `${PREFIX}Hexavalent (DTC-Polio-Hib-HBV)`, dose: 1, notes: "1ère injection Hexavalent cuisse gauche bien tolérée." },
          paiement: 3000,
        },
      ],
      standaloneCourbes: [
        { age: "1 mois", poids: 3.65, taille: 53.0, perimetreCranien: 36.8, daysAgo: 30 },
      ],
    },

    // Scenario 3: Nourrisson Khelifi Mehdi (4 mois, Bronchiolite aiguë, radio thorax, hospitalisation évitée)
    {
      patientKey: `${PREFIX}Khelifi Mehdi`,
      consultations: [
        {
          motif: "Détresse respiratoire sifflante, toux quinteuse et encombrement depuis 48h",
          note: "Polypnée à 50/min avec tirage intercostal et sous-lésionnel modéré. Auscultation : râles sibilants et sous-crépitants diffus bilatéraux. Fréquence cardiaque 142 bpm, SaO2 93% à l'air libre. Pas de signes d'épuisement respiratoire immédiat.",
          vitals: { poids: 6.2, taille: 62.5, perimetreCranien: 41.5, temp: 38.4, fc: 142, fr: 50, sao2: 93 },
          neuro: "Enfant réactif, boit par petites fractions de biberon.",
          rdvIndex: 3,
          ordonnance: [
            { med: `${PREFIX}Sérum physiologique 0.9% dosettes 5ml`, dosage: "Désobstruction rhinopharyngée avant chaque repas", freq: "6 fois par jour", duree: "8 jours", qte: 3 },
            { med: `${PREFIX}Salbutamol spray 100µg (Ventoline)`, dosage: "2 bouffées avec chambre d'inhalation Babyhaler", freq: "Toutes les 4 heures", duree: "5 jours", qte: 1 },
            { med: `${PREFIX}Paracétamol Suppositoire 150mg`, dosage: "1 suppositoire", freq: "Toutes les 6h si fièvre > 38.5°C", duree: "3 jours", qte: 1 },
          ],
          bilan: [
            { test: `${PREFIX}NFS / Numération Formule Sanguine complète`, result: "GB: 11 800 /mm³ (PNN 48%, Lymphos 46%)", remark: "Formule équilibrée, pas de polynucléose majeure" },
            { test: `${PREFIX}CRP / Protéine C-Réactive quantitative`, result: "12 mg/L", remark: "Syndrome inflammatoire modéré en faveur d'une étiologie virale" },
          ],
          justif: "Arrêt temporaire de crèche pour affection respiratoire aiguë (bronchiolite du nourrisson).",
          courbe: { age: "4 mois", poids: 6.2, taille: 62.5, perimetreCranien: 41.5 },
          radio: { desc: "Radiographie pulmonaire face : distension thoracique bilatérale modérée, accentuation de la trame péri-bronchovasculaire, pas de foyer alvéolaire de condensation.", file: "/uploads/radios/rx_thorax_khelifi_mehdi.jpg" },
          bilanFile: { type: "PDF", desc: "Compte-rendu externe de radiologie thoracique", file: "/uploads/bilans/cr_radio_khelifi.pdf" },
          vaccine: { name: `${PREFIX}Pneumocoque conjugué 13-valent (PCV13)`, dose: 2, notes: "Vaccin administré 2 semaines avant l'épisode." },
          paiement: 3500,
        },
      ],
    },

    // Scenario 4: Nourrisson Mansouri Sarah (6 mois, eczéma, diversification, 2 consultations)
    {
      patientKey: `${PREFIX}Mansouri Sarah`,
      consultations: [
        {
          motif: "Poussée d'eczéma atopique sur les joues et le tronc, prurit nocturne",
          note: "Plaques érythémato-vésiculeuses des convexités du visage et plis des coudes. Peau xérotique diffuse. Pas de surinfection bactérienne (pas d'impétiginisation).",
          vitals: { poids: 7.3, taille: 66.0, perimetreCranien: 43.0, temp: 37.0, fc: 118, fr: 28, sao2: 99 },
          neuro: "Tenue assise sans appui en cours d'acquisition, préhension palmaire bilatérale, babillage riche.",
          rdvIndex: 2,
          ordonnance: [
            { med: `${PREFIX}Crème émolliente et réparatrice pédiatrique (Dexeryl)`, dosage: "Application généreuse 2 fois par jour après le bain", freq: "Matin et soir", duree: "Au long cours", qte: 2 },
            { med: `${PREFIX}Cétirizine gouttes buvables 10mg/ml (Zyrtec)`, dosage: "5 gouttes le soir au coucher", freq: "1 fois par jour", duree: "7 jours si prurit", qte: 1 },
          ],
          bilan: null,
          justif: "Certificat de présence en consultation de dermatologie pédiatrique.",
          courbe: { age: "6 mois", poids: 7.3, taille: 66.0, perimetreCranien: 43.0 },
          radio: null,
          bilanFile: null,
          vaccine: null,
          paiement: 2000,
        },
      ],
    },

    // Scenario 5: Nourrisson Zeroual Youcef (9 mois, cassure staturo-pondérale, bilan cœliaque complet)
    {
      patientKey: `${PREFIX}Zeroual Youcef`,
      consultations: [
        {
          motif: "Stagnation pondérale depuis 3 mois, selles pâteuses décolorées abondantes, anorexie",
          note: "Enfant apathique, ballonnement abdominal important avec membres grêles. Pâleur cutanéo-muqueuse nette. Cassure nette de la courbe de poids depuis l'âge de 6 mois (-2 Déviations Standards).",
          vitals: { poids: 7.1, taille: 68.5, perimetreCranien: 44.5, temp: 36.8, fc: 110, fr: 26, sao2: 98, glycemie: 0.82 },
          neuro: "Légère hypotonie axiale secondaire à la dénutrition modérée. Station assise acquise.",
          rdvIndex: 4,
          ordonnance: [
            { med: `${PREFIX}Vitamine D3 200 000 UI ampoule buvable`, dosage: "1 ampoule en dose unique", freq: "Dose de charge", duree: "Dose unique", qte: 1 },
            { med: `${PREFIX}Fer ferrique sirop (Ferrostrane)`, dosage: "5 mg/kg/jour", freq: "En 2 prises quotidiennes", duree: "3 mois", qte: 2 },
          ],
          bilan: [
            { test: `${PREFIX}NFS / Numération Formule Sanguine complète`, result: "Hb: 9.6 g/dL, VGM: 68 fl, CCMH: 29 g/dL", remark: "Anémie microcytaire hypochrome modérée" },
            { test: `${PREFIX}Bilan martial (Fer sérique, Ferritine, CST)`, result: "Ferritine: 7 µg/L (Normes: 20-200)", remark: "Carence martiale profonde" },
            { test: `${PREFIX}Sérologie Maladie Cœliaque (Anti-tTG IgA + IgA totales)`, result: "Anti-tTG IgA: > 120 U/mL (Norme < 10)", remark: "Sérologie très fortement positive (> 10x la norme)" },
            { test: `${PREFIX}TSH ultrasensible et T4 libre`, result: "TSH: 2.1 mUI/L, T4L: 14 pmol/L", remark: "Fonction thyroïdienne normale" },
          ],
          justif: "Lettre d'orientation en gastro-pédiatrie pour confirmation diagnostique et prise en charge diététique sans gluten.",
          courbe: { age: "9 mois", poids: 7.1, taille: 68.5, perimetreCranien: 44.5 },
          radio: { desc: "Échographie abdominale : anses grêles légèrement distendues avec hyperpéristaltisme, pas d'invagination intestinale ni d'adénolymphite mésentérique suspecte.", file: "/uploads/radios/echo_abdo_zeroual.png" },
          bilanFile: { type: "PDF", desc: "Rapport d'analyses biologiques spécialisées Institut Pasteur", file: "/uploads/bilans/bilan_coeliaque_zeroual.pdf" },
          vaccine: null,
          paiement: 4000,
        },
      ],
      standaloneCourbes: [
        { age: "3 mois", poids: 5.8, taille: 60.0, perimetreCranien: 40.5, daysAgo: 180 },
        { age: "6 mois", poids: 7.0, taille: 65.0, perimetreCranien: 42.8, daysAgo: 90 },
      ],
    },

    // Scenario 6: Nourrisson Haddad Nour (12 mois, visite 1 an, vaccin ROR, croissance parfaite)
    {
      patientKey: `${PREFIX}Haddad Nour`,
      consultations: [
        {
          motif: "Bilan systématique des 1 an et vaccination ROR",
          note: "Excellente vitalité. Examen somatique complet sans anomalie. Tympans clairs, auscultation cardio-pulmonaire normale. Palpation des testicules / organes génitaux externes normaux. Dents : 6 incisives sorties.",
          vitals: { poids: 9.4, taille: 75.0, perimetreCranien: 46.0, temp: 37.0, fc: 108, fr: 24, sao2: 100 },
          neuro: "Marche autonome assurée, applaudit, pointe du doigt, prononce 3 mots avec signification.",
          rdvIndex: 10,
          ordonnance: [
            { med: `${PREFIX}Vitamine D3 200 000 UI ampoule buvable`, dosage: "1 ampoule au début de l'hiver", freq: "Dose unique", duree: "Dose unique", qte: 1 },
          ],
          bilan: null,
          justif: "Certificat de vaccination à jour et de bon développement pour maintien en crèche.",
          courbe: { age: "12 mois", poids: 9.4, taille: 75.0, perimetreCranien: 46.0 },
          radio: null,
          bilanFile: null,
          vaccine: { name: `${PREFIX}ROR (Rougeole - Oreillons - Rubéole)`, dose: 1, notes: "Vaccin ROR administré sous-cutané épaule gauche sans incident." },
          paiement: 2500,
        },
      ],
    },

    // Scenario 7: Enfant Belkacem Adam (18 mois, Gastro-entérite aiguë fébrile)
    {
      patientKey: `${PREFIX}Belkacem Adam`,
      consultations: [
        {
          motif: "Diarrhée liquide aiguë (5 selles/j) et vomissements depuis hier, fébricule",
          note: "Pli cutané s'effaçant rapidement, muqueuses légèrement sèches mais yeux non cernés. Pas de signes de déshydratation sévère (> 5%). Abdomen souple, bruits hydro-aériques augmentés.",
          vitals: { poids: 11.2, taille: 82.0, perimetreCranien: 47.5, temp: 38.3, fc: 120, fr: 26, sao2: 98, glycemie: 0.92 },
          neuro: "Enfant conscient, soif vive mais tolère le liquide par gorgées.",
          rdvIndex: 7,
          ordonnance: [
            { med: `${PREFIX}Soluté de Réhydratation Orale (SRO / Adiaril)`, dosage: "1 sachet dans 200 ml d'eau", freq: "Après chaque selle liquide", duree: "3 jours", qte: 2 },
            { med: `${PREFIX}Racécadotril 10mg sachets (Tiorfan nourrisson)`, dosage: "1 sachet 3 fois par jour", freq: "Avec les repas", duree: "4 jours", qte: 1 },
            { med: `${PREFIX}Paracétamol Sirop 2.4% (Doliprane)`, dosage: "1 dose-poids", freq: "Toutes les 6h si fièvre > 38.5°C", duree: "3 jours", qte: 1 },
          ],
          bilan: [
            { test: `${PREFIX}Ionogramme Sanguin (Na+, K+, Cl-, Bicarbonates)`, result: "Na+: 138 mEq/L, K+: 4.2 mEq/L, Cl-: 101 mEq/L", remark: "Ionogramme normal, pas de trouble hydroélectrolytique" },
          ],
          justif: "Éviction scolaire et dispense de garde en crèche pour gastro-entérite aiguë contagieuse.",
          courbe: { age: "18 mois", poids: 11.2, taille: 82.0, perimetreCranien: 47.5 },
          radio: null,
          bilanFile: null,
          vaccine: null,
          paiement: 2500,
        },
      ],
    },

    // Scenario 8: Enfant Saadi Sofiane (5 ans, OMA suppurée, bilan auditif)
    {
      patientKey: `${PREFIX}Saadi Sofiane`,
      consultations: [
        {
          motif: "Otalgie droite aiguë pulsatile, fièvre à 39°C et rhinorrhée purulente",
          note: "Otoscopie droite : tympan rouge violacé, bombé dans le cadran postéro-inférieur avec disparition du triangle lumineux. Tympan gauche congestif simple. Pharynx enflammé.",
          vitals: { poids: 18.2, taille: 108.0, perimetreCranien: 50.5, temp: 39.2, fc: 112, fr: 22, sao2: 99, tensionSystolique: 95, tensionDiastolique: 60 },
          neuro: "Examen neurologique normal, pas de raideur de nuque, pas de syndrome méningé.",
          rdvIndex: 2,
          ordonnance: [
            { med: `${PREFIX}Amoxicilline-Acide Clavulanique 100mg/12.5mg/ml`, dosage: "80 mg/kg/j en 3 prises", freq: "Toutes les 8h au milieu des repas", duree: "8 jours", qte: 2 },
            { med: `${PREFIX}Paracétamol Sirop 2.4% (Doliprane)`, dosage: "1 dose-poids", freq: "Toutes les 6h systématiquement pendant 48h", duree: "5 jours", qte: 1 },
            { med: `${PREFIX}Pivalone 1% suspension nasale`, dosage: "1 pulvérisation dans chaque narine", freq: "3 fois par jour", duree: "5 jours", qte: 1 },
          ],
          bilan: null,
          justif: "Dispense d'école et d'activités sportives pour otite moyenne aiguë fébrile pendant 5 jours.",
          courbe: { age: "5 ans", poids: 18.2, taille: 108.0, perimetreCranien: 50.5 },
          radio: null,
          bilanFile: null,
          vaccine: null,
          paiement: 2500,
        },
      ],
    },

    // Scenario 9: Enfant Meziane Rania (6 ans, Rappel scolaire DTPolio, aptitude)
    {
      patientKey: `${PREFIX}Meziane Rania`,
      consultations: [
        {
          motif: "Visite des 6 ans : Rappel de vaccination DTPolio et certificat d'entrée au CP",
          note: "Examen clinique parfait. Vision et audition satisfaisantes. Pas de souffle cardiaque, auscultation pulmonaire libre. Rachis droit sans gibbosité.",
          vitals: { poids: 21.0, taille: 116.0, perimetreCranien: 51.5, temp: 36.8, fc: 88, fr: 20, sao2: 100, tensionSystolique: 100, tensionDiastolique: 65 },
          neuro: "Développement cognitif et langage très bien adaptés, latéralisation manuelle droite affirmée.",
          rdvIndex: 12,
          ordonnance: null, // Test consultation sans ordonnance
          bilan: null,
          justif: "Certificat de bonne santé physique et d'aptitude à la scolarité en classe de CP.",
          courbe: { age: "6 ans", poids: 21.0, taille: 116.0, perimetreCranien: 51.5 },
          radio: null,
          bilanFile: null,
          vaccine: { name: `${PREFIX}DTPolio Rappel scolaire`, dose: 1, notes: "Rappel vaccinal DTPolio des 6 ans administré bras droit." },
          paiement: 2000,
        },
      ],
    },

    // Scenario 10: Enfant Boudiaf Walid (7 ans, Angine érythémato-pultacée, TDR positif)
    {
      patientKey: `${PREFIX}Boudiaf Walid`,
      consultations: [
        {
          motif: "Gorge douloureuse, dysphagie intense et fièvre à 39.5°C",
          note: "Amygdales très hypertrophiées et cryptiques avec enduit pultacé blanc-crème. Adénopathies sous-mandibulaires bilatérales volumineuses et sensibles. Pas de rash cutané scarlatiniforme.",
          vitals: { poids: 24.5, taille: 122.0, perimetreCranien: 52.0, temp: 39.5, fc: 115, fr: 22, sao2: 98, tensionSystolique: 105, tensionDiastolique: 68 },
          neuro: "Enfant abattu par la fièvre, examen neurologique sans anomalie.",
          rdvIndex: 5,
          ordonnance: [
            { med: `${PREFIX}Amoxicilline 250mg/5ml suspension`, dosage: "50 mg/kg/j en 2 prises", freq: "Matin et soir", duree: "6 jours", qte: 2 },
            { med: `${PREFIX}Paracétamol Sirop 2.4% (Doliprane)`, dosage: "1 dose-poids", freq: "Toutes les 6h si T° > 38.5°C", duree: "4 jours", qte: 1 },
          ],
          bilan: [
            { test: `${PREFIX}NFS / Numération Formule Sanguine complète`, result: "GB: 14 500 /mm³ (PNN 82%)", remark: "Hyperleucocytose à polynucléaires neutrophiles nette" },
            { test: `${PREFIX}CRP / Protéine C-Réactive quantitative`, result: "48 mg/L", remark: "Syndrome inflammatoire biologique significatif" },
          ],
          justif: "Éviction scolaire pour angine aiguë contagieuse streptococcique jusqu'à 48h d'antibiothérapie.",
          courbe: { age: "7 ans", poids: 24.5, taille: 122.0, perimetreCranien: 52.0 },
          radio: null,
          bilanFile: null,
          vaccine: null,
          paiement: 2500,
        },
      ],
    },

    // Scenario 11: Enfant Larbi Sami (9 ans, Asthme persistant, PAI, Radio thorax)
    {
      patientKey: `${PREFIX}Larbi Sami`,
      consultations: [
        {
          motif: "Suivi semestriel d'asthme, toux d'effort récente lors des séances de sport",
          note: "Auscultation : râles sibilants télé-expiratoires déclenchés à l'expiration forcée. Fréquence respiratoire 20/min. Débit Expiratoire de Pointe (DEP) mesuré à 240 L/min (78% de la valeur théorique). Adaptation du traitement de fond.",
          vitals: { poids: 30.5, taille: 133.0, perimetreCranien: 52.5, temp: 37.0, fc: 84, fr: 20, sao2: 97, tensionSystolique: 108, tensionDiastolique: 70 },
          neuro: "Très bon niveau scolaire, autonome dans la prise de son traitement par spray.",
          rdvIndex: 12,
          ordonnance: [
            { med: `${PREFIX}Salbutamol spray 100µg (Ventoline)`, dosage: "2 bouffées avec chambre d'inhalation", freq: "15 minutes avant le sport ou si essoufflement", duree: "Renouvelable", qte: 1 },
            { med: `${PREFIX}Fluticasone 50µg spray aérosol (Flixotide)`, dosage: "2 bouffées matin et soir", freq: "Quotidiennement après rinçage de bouche", duree: "3 mois", qte: 2 },
          ],
          bilan: null,
          justif: "Projet d'Accueil Individualisé (PAI) scolaire pour asthme et aménagement d'effort physique.",
          courbe: { age: "9 ans", poids: 30.5, taille: 133.0, perimetreCranien: 52.5 },
          radio: { desc: "Radiographie thoracique de face de contrôle : absence de foyer parenchymateux, pas d'atélectasie segmentaire.", file: "/uploads/radios/rx_thorax_larbi_sami.png" },
          bilanFile: { type: "PDF", desc: "Explorations Fonctionnelles Respiratoires (EFR) du Centre Hospitalier", file: "/uploads/bilans/efr_larbi_sami.pdf" },
          vaccine: null,
          paiement: 3000,
        },
      ],
    },

    // Scenario 12: Enfant Rahmouni Yasmine (10 ans, Aptitude sportive Judo compétition)
    {
      patientKey: `${PREFIX}Rahmouni Yasmine`,
      consultations: [
        {
          motif: "Visite annuelle de non contre-indication à la pratique du Judo en compétition",
          note: "Examen cardiovasculaire complet : bruits du cœur purs et réguliers, pas de souffle. Pouls fémoraux bien perçus et symétriques. Tension artérielle normale aux 2 bras. Épreuve de Ruffier-Dickson : Indice < 3 (Excellente récupération cardiaque à l'effort).",
          vitals: { poids: 33.0, taille: 138.5, perimetreCranien: 53.0, temp: 36.7, fc: 72, fr: 18, sao2: 100, tensionSystolique: 110, tensionDiastolique: 70 },
          neuro: "Développement psycho-affectif et physique optimal.",
          rdvIndex: null,
          ordonnance: null,
          bilan: null,
          justif: "Certificat médical d'absence de contre-indication à la pratique des sports de combat (Judo) en compétition.",
          courbe: { age: "10 ans", poids: 33.0, taille: 138.5, perimetreCranien: 53.0 },
          radio: null,
          bilanFile: null,
          vaccine: null,
          paiement: 2000,
        },
      ],
    },

    // Scenario 13: Prématuré Bensaada Idriss (14 mois corrigé, Echographie cérébrale, suivi neuro)
    {
      patientKey: `${PREFIX}Bensaada Idriss`,
      consultations: [
        {
          motif: "Contrôle du développement psychomoteur et staturo-pondéral de l'ancien prématuré",
          note: "Bonne évolution globale. Tonus de l'axe vertébral satisfaisant, pas d'hypertonie des membres inférieurs. Préhension pouce-index fine acquise. Station debout avec appui stable.",
          vitals: { poids: 8.8, taille: 73.0, perimetreCranien: 45.0, temp: 37.1, fc: 115, fr: 26, sao2: 99 },
          neuro: "Âge de développement estimé à 12 mois, tout à fait concordant avec son âge corrigé de prématurité.",
          rdvIndex: 13,
          ordonnance: [
            { med: `${PREFIX}Vitamine D3 gouttes quotidiennes (Zyma-D)`, dosage: "3 gouttes par jour", freq: "Le matin", duree: "En continu", qte: 1 },
            { med: `${PREFIX}Fer ferrique sirop (Ferrostrane)`, dosage: "1 cuillère mesure par jour", freq: "Le soir", duree: "1 mois", qte: 1 },
          ],
          bilan: null,
          justif: "Certificat de suivi pédiatrique spécialisé pour enfant prématuré.",
          courbe: { age: "14 mois", poids: 8.8, taille: 73.0, perimetreCranien: 45.0 },
          radio: { desc: "Échographie transfontanellaire (ETF) antérieure de contrôle : ventricules cérébraux de taille et morphologie normales, absence de résidu d'hémorragie sous-épendymaire.", file: "/uploads/radios/etf_bensaada_idriss.png" },
          bilanFile: { type: "PDF", desc: "Bilan neuropédiatrique spécialisé externe", file: "/uploads/bilans/cr_neuro_bensaada.pdf" },
          vaccine: null,
          paiement: 3500,
        },
      ],
      standaloneCourbes: [
        { age: "6 mois", poids: 5.4, taille: 61.0, perimetreCranien: 41.0, daysAgo: 240 },
        { age: "9 mois", poids: 6.8, taille: 65.5, perimetreCranien: 42.5, daysAgo: 150 },
        { age: "12 mois", poids: 7.9, taille: 70.0, perimetreCranien: 44.0, daysAgo: 60 },
      ],
    },

    // Scenario 14: Adolescent Boulkroun Fares (14 ans, Souffle cardiaque innocent, Radio & ECG)
    {
      patientKey: `${PREFIX}Boulkroun Fares`,
      consultations: [
        {
          motif: "Bilan pour découverte fortuite d'un souffle cardiaque en médecine scolaire",
          note: "Souffle proto-méso-systolique 2/6 au foyer pulmonaire, timbre doux et musical, diminuant en position debout et lors des manœuvres d'inspiration. B2 normal dédoublé physiologiquement. Pas de clics, pas de cyanose, pouls fémoraux très bien perçus.",
          vitals: { poids: 52.0, taille: 164.0, temp: 36.8, fc: 68, fr: 16, sao2: 100, tensionSystolique: 115, tensionDiastolique: 72 },
          neuro: "Examen neurologique et pubertaire normal (Tanner 4).",
          rdvIndex: 14,
          ordonnance: null,
          bilan: null,
          justif: "Certificat médical attestant de la bénignité du souffle cardiaque anorganique, pratique sportive libre autorisée.",
          courbe: { age: "14 ans", poids: 52.0, taille: 164.0 },
          radio: { desc: "Radiographie du thorax de face : index cardio-thoracique normal (ICT 0.44), silhouette cardiaque normale, parenchyme pulmonaire sain.", file: "/uploads/radios/rx_coeur_boulkroun.jpg" },
          bilanFile: { type: "PDF", desc: "Compte-rendu d'Échocardiographie Doppler couleur pédiatrique", file: "/uploads/bilans/echo_coeur_boulkroun.pdf" },
          vaccine: null,
          paiement: 3000,
        },
      ],
    },

    // Scenario 15: Patient Multi-visites Bacha Khaled (4 consultations échelonnées sur 1 an)
    {
      patientKey: `${PREFIX}Bacha Khaled`,
      consultations: [
        {
          motif: "Visite du 3ème mois : Contrôle pondéral et premier bilan de diversification",
          note: "Enfant en parfait état général. Bonne croissance régulière. Palpation abdominale normale.",
          vitals: { poids: 5.9, taille: 59.5, perimetreCranien: 40.0, temp: 37.0, fc: 122, fr: 30, sao2: 99 },
          neuro: "Tenue de tête solide, gazouille.",
          daysAgo: 270,
          ordonnance: [
            { med: `${PREFIX}Vitamine D3 gouttes quotidiennes (Zyma-D)`, dosage: "4 gouttes par jour", freq: "Matin", duree: "En continu", qte: 1 },
          ],
          bilan: null,
          justif: null,
          courbe: { age: "3 mois", poids: 5.9, taille: 59.5, perimetreCranien: 40.0 },
          radio: null,
          bilanFile: null,
          vaccine: { name: `${PREFIX}Pentavalent (DTC-Hib-HBV)`, dose: 2, notes: "Vaccination 3ème mois sans incident." },
          paiement: 2000,
        },
        {
          motif: "Visite du 6ème mois : Épisode de rhinopharyngite aiguë et poussée dentaire",
          note: "Tympan gauche un peu érythémateux, nez obstrué avec sécrétions claires. Gencives inférieures gonflées.",
          vitals: { poids: 7.5, taille: 66.5, perimetreCranien: 43.0, temp: 38.1, fc: 128, fr: 32, sao2: 98 },
          neuro: "Passe un objet d'une main à l'autre, se tient assis avec appui.",
          daysAgo: 180,
          ordonnance: [
            { med: `${PREFIX}Sérum physiologique 0.9% dosettes 5ml`, dosage: "Lavage de nez avant chaque repas", freq: "4 fois par jour", duree: "6 jours", qte: 1 },
            { med: `${PREFIX}Paracétamol Sirop 2.4% (Doliprane)`, dosage: "1 dose-poids", freq: "Toutes les 6h si fièvre > 38.5°C", duree: "3 jours", qte: 1 },
          ],
          bilan: null,
          justif: "Certificat de présence en consultation médicale.",
          courbe: { age: "6 mois", poids: 7.5, taille: 66.5, perimetreCranien: 43.0 },
          radio: null,
          bilanFile: null,
          vaccine: null,
          paiement: 2000,
        },
        {
          motif: "Visite du 9ème mois : Contrôle systématique, examen bucco-dentaire",
          note: "Examen normal, 4 incisives éruptées. Auscultation cardio-pulmonaire normale.",
          vitals: { poids: 8.7, taille: 71.0, perimetreCranien: 45.0, temp: 36.9, fc: 112, fr: 26, sao2: 100 },
          neuro: "Répète des syllabes doubles (ma-ma, da-da), réaction vive à l'appel de son prénom.",
          daysAgo: 90,
          ordonnance: [
            { med: `${PREFIX}Fer ferrique sirop (Ferrostrane)`, dosage: "1 cuillère mesure par jour", freq: "Le matin", duree: "1 mois", qte: 1 },
          ],
          bilan: null,
          justif: null,
          courbe: { age: "9 mois", poids: 8.7, taille: 71.0, perimetreCranien: 45.0 },
          radio: null,
          bilanFile: null,
          vaccine: { name: `${PREFIX}Pneumocoque conjugué 13-valent (PCV13)`, dose: 3, notes: "Rappel Pneumocoque des 9 mois." },
          paiement: 2000,
        },
        {
          motif: "Visite des 12 mois : Contrôle annuel et rappel vaccinal ROR",
          note: "Enfant en pleine santé, marche débutante. Appétit et sommeil réguliers.",
          vitals: { poids: 9.8, taille: 76.5, perimetreCranien: 46.5, temp: 37.0, fc: 105, fr: 24, sao2: 99 },
          neuro: "Marche acquise, coopère à l'habillage, empile deux cubes.",
          daysAgo: 0,
          ordonnance: [
            { med: `${PREFIX}Vitamine D3 200 000 UI ampoule buvable`, dosage: "1 ampoule en dose unique", freq: "Dose unique", duree: "Dose unique", qte: 1 },
          ],
          bilan: null,
          justif: "Certificat de vaccination à jour pour dossier de crèche collective.",
          courbe: { age: "12 mois", poids: 9.8, taille: 76.5, perimetreCranien: 46.5 },
          radio: null,
          bilanFile: null,
          vaccine: { name: `${PREFIX}ROR (Rougeole - Oreillons - Rubéole)`, dose: 1, notes: "Vaccination ROR du 12ème mois effectuée." },
          paiement: 2500,
        },
      ],
    },
  ];

  // Execute scenario seeding
  for (const scenario of CLINICAL_SCENARIOS) {
    const patient = patientMap[scenario.patientKey];
    if (!patient) continue;

    for (const cData of scenario.consultations) {
      // Determine creation date
      let consultDate = new Date();
      if (cData.daysAgo !== undefined) {
        consultDate.setDate(consultDate.getDate() - cData.daysAgo);
      }

      // Check if consultation exists
      let existingConsult = await safeExec(() =>
        prisma.consultation.findFirst({
          where: {
            patientId: patient.id,
            motifDeConsultation: cData.motif,
          },
          include: {
            ordonnance: true,
            bilanRecip: true,
            justificationRecord: true,
            courbeInfo: true,
            radios: true,
            bilansFiles: true,
          },
        })
      );

      if (!existingConsult) {
        let rdvId = null;
        if (cData.rdvIndex !== null && cData.rdvIndex !== undefined && createdRdvs[cData.rdvIndex]) {
          rdvId = createdRdvs[cData.rdvIndex].id;
        }

        existingConsult = await safeExec(() =>
          prisma.consultation.create({
            data: {
              patientId: patient.id,
              motifDeConsultation: cData.motif,
              note: cData.note,
              taille: cData.vitals.taille || null,
              poids: cData.vitals.poids || null,
              perimetreCranien: cData.vitals.perimetreCranien || null,
              temperature: cData.vitals.temp || null,
              frequenceCardiaque: cData.vitals.fc || null,
              frequenceRespiratoire: cData.vitals.fr || null,
              saturationOxygene: cData.vitals.sao2 || null,
              tensionSystolique: cData.vitals.tensionSystolique || null,
              tensionDiastolique: cData.vitals.tensionDiastolique || null,
              glycemie: cData.vitals.glycemie || null,
              developpementPsychomoteur: cData.neuro || null,
              justification: cData.justif || null,
              rendezVousId: rdvId,
              createdAt: consultDate,
            },
          })
        );
      }
      consultationCount++;

      // 1. Ordonnance
      if (cData.ordonnance && Array.isArray(cData.ordonnance)) {
        let ord = await safeExec(() =>
          prisma.ordonnance.findUnique({
            where: { consultationId: existingConsult.id },
            include: { items: true },
          })
        );
        if (!ord) {
          ord = await safeExec(() =>
            prisma.ordonnance.create({
              data: {
                patientId: patient.id,
                consultationId: existingConsult.id,
                createdAt: consultDate,
              },
            })
          );
          for (const item of cData.ordonnance) {
            const med = medMap[item.med];
            if (med) {
              await safeExec(() =>
                prisma.ordonnanceItem.create({
                  data: {
                    ordonnanceId: ord.id,
                    medicamentId: med.id,
                    dosage: item.dosage,
                    frequence: item.freq,
                    duree: item.duree,
                    quantite: item.qte,
                  },
                })
              );
              ordonnanceItemCount++;
            }
          }
        } else {
          ordonnanceItemCount += ord.items.length;
        }
        ordonnanceCount++;
      }

      // 2. BilanRecip & BilanItem
      if (cData.bilan && Array.isArray(cData.bilan)) {
        let bRecip = await safeExec(() =>
          prisma.bilanRecip.findUnique({
            where: { consultationId: existingConsult.id },
            include: { items: true },
          })
        );
        if (!bRecip) {
          bRecip = await safeExec(() =>
            prisma.bilanRecip.create({
              data: {
                patientId: patient.id,
                consultationId: existingConsult.id,
                createdAt: consultDate,
              },
            })
          );
          for (const bIt of cData.bilan) {
            const b = bilanMap[bIt.test];
            if (b) {
              await safeExec(() =>
                prisma.bilanItem.create({
                  data: {
                    bilanRecipId: bRecip.id,
                    bilanId: b.id,
                    resultat: bIt.result,
                    remarque: bIt.remark,
                  },
                })
              );
              bilanItemCount++;
            }
          }
        } else {
          bilanItemCount += bRecip.items.length;
        }
        bilanRecipCount++;
      }

      // 3. Justification (Record)
      if (cData.justif) {
        let justifRec = await safeExec(() =>
          prisma.justification.findUnique({
            where: { consultationId: existingConsult.id },
          })
        );
        if (!justifRec) {
          await safeExec(() =>
            prisma.justification.create({
              data: {
                patientId: patient.id,
                consultationId: existingConsult.id,
                texte: cData.justif,
                createdAt: consultDate,
              },
            })
          );
        }
        justificationCount++;
      }

      // 4. CourbeInfo (Linked to Consultation)
      if (cData.courbe) {
        let crb = await safeExec(() =>
          prisma.courbeInfo.findUnique({
            where: { consultationId: existingConsult.id },
          })
        );
        if (!crb) {
          await safeExec(() =>
            prisma.courbeInfo.create({
              data: {
                patientId: patient.id,
                consultationId: existingConsult.id,
                age: cData.courbe.age,
                poids: cData.courbe.poids || null,
                taille: cData.courbe.taille || null,
                perimetreCranien: cData.courbe.perimetreCranien || null,
                createdAt: consultDate,
              },
            })
          );
        }
        courbeInfoCount++;
      }

      // 5. Radio
      if (cData.radio) {
        let rad = await safeExec(() =>
          prisma.radio.findFirst({
            where: {
              consultationId: existingConsult.id,
              description: cData.radio.desc,
            },
          })
        );
        if (!rad) {
          await safeExec(() =>
            prisma.radio.create({
              data: {
                patientId: patient.id,
                consultationId: existingConsult.id,
                description: cData.radio.desc,
                fichier: cData.radio.file,
                createdAt: consultDate,
              },
            })
          );
        }
        radioCount++;
      }

      // 6. BilanFile
      if (cData.bilanFile) {
        let bf = await safeExec(() =>
          prisma.bilanFile.findFirst({
            where: {
              consultationId: existingConsult.id,
              description: cData.bilanFile.desc,
            },
          })
        );
        if (!bf) {
          await safeExec(() =>
            prisma.bilanFile.create({
              data: {
                patientId: patient.id,
                consultationId: existingConsult.id,
                type: cData.bilanFile.type,
                description: cData.bilanFile.desc,
                fichier: cData.bilanFile.file,
                createdAt: consultDate,
              },
            })
          );
        }
        bilanFileCount++;
      }

      // 7. Vaccination
      if (cData.vaccine) {
        const v = vaccineMap[cData.vaccine.name];
        if (v) {
          let existingVac = await safeExec(() =>
            prisma.vaccination.findFirst({
              where: {
                patientId: patient.id,
                vaccineId: v.id,
                doseNumber: cData.vaccine.dose,
              },
            })
          );
          if (!existingVac) {
            await safeExec(() =>
              prisma.vaccination.create({
                data: {
                  patientId: patient.id,
                  vaccineId: v.id,
                  dateGiven: consultDate,
                  doseNumber: cData.vaccine.dose,
                  notes: cData.vaccine.notes,
                },
              })
            );
          }
          vaccinationCount++;
        }
      }

      // 8. Paiement
      if (cData.paiement) {
        let existingPay = await safeExec(() =>
          prisma.paiement.findFirst({
            where: {
              patientId: patient.id,
              montant: cData.paiement,
            },
          })
        );
        if (!existingPay) {
          await safeExec(() =>
            prisma.paiement.create({
              data: {
                patientId: patient.id,
                montant: cData.paiement,
                date: consultDate,
              },
            })
          );
        }
        paiementCount++;
      }
    }

    // Standalone CourbePoints (Tracking longitudinal without consultation)
    if (scenario.standaloneCourbes && Array.isArray(scenario.standaloneCourbes)) {
      for (const sc of scenario.standaloneCourbes) {
        const scDate = new Date();
        scDate.setDate(scDate.getDate() - sc.daysAgo);
        const existingSC = await safeExec(() =>
          prisma.courbeInfo.findFirst({
            where: {
              patientId: patient.id,
              age: sc.age,
              consultationId: null,
            },
          })
        );
        if (!existingSC) {
          await safeExec(() =>
            prisma.courbeInfo.create({
              data: {
                patientId: patient.id,
                consultationId: null,
                age: sc.age,
                poids: sc.poids || null,
                taille: sc.taille || null,
                perimetreCranien: sc.perimetreCranien || null,
                createdAt: scDate,
              },
            })
          );
        }
        courbeInfoCount++;
      }
    }
  }

  // Standalone Vaccinations & Payments for other patients in the cohort to ensure deep coverage
  const otherPatientsToEnrich = [
    { key: `${PREFIX}Derradji Ines`, vac: `${PREFIX}Pentavalent (DTC-Hib-HBV)`, dose: 3, pay: 2000 },
    { key: `${PREFIX}Bensalem Zakaria`, vac: `${PREFIX}Pneumocoque conjugué 13-valent (PCV13)`, dose: 2, pay: 2500 },
    { key: `${PREFIX}Chérif Maya`, vac: `${PREFIX}ROR (Rougeole - Oreillons - Rubéole)`, dose: 2, pay: 2000 },
    { key: `${PREFIX}Guenifi Selma`, vac: `${PREFIX}DTPolio Rappel scolaire`, dose: 1, pay: 2000 },
    { key: `${PREFIX}Taibi Manel`, vac: `${PREFIX}Hexavalent (DTC-Polio-Hib-HBV)`, dose: 3, pay: 2500 },
    { key: `${PREFIX}Zaidi Othmane`, vac: `${PREFIX}Rotavirus oral`, dose: 2, pay: 2500 },
    { key: `${PREFIX}Hamlaoui Kenza`, vac: `${PREFIX}Méningocoque A+C+Y+W135`, dose: 1, pay: 3000 },
  ];

  for (const extra of otherPatientsToEnrich) {
    const pat = patientMap[extra.key];
    if (pat) {
      const v = vaccineMap[extra.vac];
      if (v) {
        const hasV = await safeExec(() =>
          prisma.vaccination.findFirst({
            where: { patientId: pat.id, vaccineId: v.id },
          })
        );
        if (!hasV) {
          await safeExec(() =>
            prisma.vaccination.create({
              data: {
                patientId: pat.id,
                vaccineId: v.id,
                dateGiven: new Date("2025-10-15"),
                doseNumber: extra.dose,
                notes: "Vaccination bien tolérée enregistrée sur carnet.",
              },
            })
          );
        }
        vaccinationCount++;
      }
      if (extra.pay) {
        const hasPay = await safeExec(() =>
          prisma.paiement.findFirst({
            where: { patientId: pat.id, montant: extra.pay },
          })
        );
        if (!hasPay) {
          await safeExec(() =>
            prisma.paiement.create({
              data: {
                patientId: pat.id,
                montant: extra.pay,
                date: new Date(),
              },
            })
          );
        }
        paiementCount++;
      }
    }
  }

  results["Consultation"] = consultationCount;
  results["Ordonnance"] = ordonnanceCount;
  results["OrdonnanceItem"] = ordonnanceItemCount;
  results["BilanRecip"] = bilanRecipCount;
  results["BilanItem"] = bilanItemCount;
  results["Justification"] = justificationCount;
  results["CourbeInfo"] = courbeInfoCount;
  results["Radio"] = radioCount;
  results["BilanFile"] = bilanFileCount;
  results["Vaccination"] = vaccinationCount;
  results["Paiement"] = paiementCount;

  console.log(`   ✅ ${consultationCount} consultations créées avec succès.`);
  console.log(`   ✅ ${ordonnanceCount} ordonnances (${ordonnanceItemCount} médicaments prescrits).`);
  console.log(`   ✅ ${bilanRecipCount} bilans prescrits (${bilanItemCount} résultats analysés).`);
  console.log(`   ✅ ${justificationCount} justifications médicales délivrées.`);
  console.log(`   ✅ ${courbeInfoCount} points de croissance staturo-pondérale enregistrés.`);
  console.log(`   ✅ ${radioCount} actes d'imagerie médicale archivés.`);
  console.log(`   ✅ ${bilanFileCount} comptes-rendus externes archivés.`);
  console.log(`   ✅ ${vaccinationCount} actes vaccinaux enregistrés.`);
  console.log(`   ✅ ${paiementCount} règlements et paiements enregistrés.`);

  return results;
}

// ==========================================
// 4. DATA INTEGRITY & TEST VERIFICATION SUITE
// ==========================================

async function runVerification() {
  console.log("\n================================================================================");
  console.log("🔍 VÉRIFICATION DE L'INTÉGRITÉ DES DONNÉES & COUVERTURE DES 22 MODÈLES PRISMA");
  console.log("================================================================================\n");

  const startTime = Date.now();
  const checks = [];

  // Helper check recorder
  function record(title, passed, details = "") {
    checks.push({ title, passed, details });
    const mark = passed ? "✅ PASS" : "❌ FAIL";
    console.log(` [${mark}] ${title}${details ? ` (${details})` : ""}`);
  }

  try {
    // Check 1: Model Counts & Coverage
    const allModels = [
      "cabinet",
      "medicament",
      "bilan",
      "vaccine",
      "justificationType",
      "bilanType",
      "bilanTypeItem",
      "recetteType",
      "recetteTypeItem",
      "rendezVous",
      "patient",
      "consultation",
      "ordonnance",
      "ordonnanceItem",
      "bilanRecip",
      "bilanItem",
      "justification",
      "courbeInfo",
      "radio",
      "bilanFile",
      "vaccination",
      "paiement",
    ];

    const counts = {};
    for (const model of allModels) {
      counts[model] = await safeExec(() => prisma[model].count());
    }

    const unpopulated = allModels.filter((m) => counts[m] === 0);
    record(
      "Couverture de l'intégralité des 22 modèles Prisma",
      unpopulated.length === 0,
      unpopulated.length === 0
        ? "100% des modèles contiennent des enregistrements"
        : `Modèles vides : ${unpopulated.join(", ")}`
    );

    // Check 2: Foreign Key Constraints & Relations
    // A. Consultations -> Patients
    const allPatientIds = new Set(
      (await safeExec(() => prisma.patient.findMany({ select: { id: true } }))).map((p) => p.id)
    );
    const allConsultations = await safeExec(() =>
      prisma.consultation.findMany({ select: { id: true, patientId: true } })
    );
    const orphanConsultations = allConsultations.filter((c) => !allPatientIds.has(c.patientId));
    record(
      "Intégrité Référentielle Consultation -> Patient",
      orphanConsultations.length === 0,
      `${orphanConsultations.length} orphelin(s)`
    );

    // B. Ordonnances -> Consultations & Patients
    const allConsultationIds = new Set(allConsultations.map((c) => c.id));
    const allOrdonnances = await safeExec(() =>
      prisma.ordonnance.findMany({ select: { id: true, consultationId: true, patientId: true } })
    );
    const invalidOrdonnances = allOrdonnances.filter(
      (o) => !allConsultationIds.has(o.consultationId) || !allPatientIds.has(o.patientId)
    );
    record(
      "Intégrité Référentielle Ordonnance -> Consultation / Patient",
      invalidOrdonnances.length === 0,
      `${invalidOrdonnances.length} orphelin(s)`
    );

    // C. OrdonnanceItems -> Ordonnance & Medicament
    const allOrdIds = new Set(allOrdonnances.map((o) => o.id));
    const allMedIds = new Set(
      (await safeExec(() => prisma.medicament.findMany({ select: { id: true } }))).map((m) => m.id)
    );
    const allOrdItems = await safeExec(() =>
      prisma.ordonnanceItem.findMany({ select: { id: true, ordonnanceId: true, medicamentId: true } })
    );
    const invalidOrdItems = allOrdItems.filter(
      (oi) => !allOrdIds.has(oi.ordonnanceId) || !allMedIds.has(oi.medicamentId)
    );
    record(
      "Intégrité Référentielle OrdonnanceItem -> Ordonnance / Medicament",
      invalidOrdItems.length === 0,
      `${invalidOrdItems.length} orphelin(s)`
    );

    // D. BilanRecip & BilanItem
    const allBilanRecips = await safeExec(() =>
      prisma.bilanRecip.findMany({ select: { id: true, consultationId: true, patientId: true } })
    );
    const invalidBRecips = allBilanRecips.filter(
      (b) => !allConsultationIds.has(b.consultationId) || !allPatientIds.has(b.patientId)
    );
    const allBRecipIds = new Set(allBilanRecips.map((b) => b.id));
    const allBilanIds = new Set(
      (await safeExec(() => prisma.bilan.findMany({ select: { id: true } }))).map((b) => b.id)
    );
    const allBilanItems = await safeExec(() =>
      prisma.bilanItem.findMany({ select: { id: true, bilanRecipId: true, bilanId: true } })
    );
    const invalidBilanItems = allBilanItems.filter(
      (bi) => !allBRecipIds.has(bi.bilanRecipId) || !allBilanIds.has(bi.bilanId)
    );
    record(
      "Intégrité Référentielle BilanItem -> BilanRecip / Bilan",
      invalidBilanItems.length === 0 && invalidBRecips.length === 0,
      `${invalidBilanItems.length + invalidBRecips.length} orphelin(s)`
    );

    // E. Justifications -> Patients
    const allJustifs = await safeExec(() =>
      prisma.justification.findMany({ select: { id: true, patientId: true, consultationId: true } })
    );
    const orphanJustifs = allJustifs.filter(
      (j) => !allPatientIds.has(j.patientId) || (j.consultationId && !allConsultationIds.has(j.consultationId))
    );
    record(
      "Intégrité Référentielle Justification -> Patient / Consultation",
      orphanJustifs.length === 0,
      `${orphanJustifs.length} orphelin(s)`
    );

    // F. Vaccinations -> Patients & Vaccines
    const allVaccineIds = new Set(
      (await safeExec(() => prisma.vaccine.findMany({ select: { id: true } }))).map((v) => v.id)
    );
    const allVaccinations = await safeExec(() =>
      prisma.vaccination.findMany({ select: { id: true, patientId: true, vaccineId: true } })
    );
    const invalidVaccinations = allVaccinations.filter(
      (v) => !allPatientIds.has(v.patientId) || !allVaccineIds.has(v.vaccineId)
    );
    record(
      "Intégrité Référentielle Vaccination -> Patient / Vaccine",
      invalidVaccinations.length === 0,
      `${invalidVaccinations.length} orphelin(s)`
    );

    // Check 3: Unique Constraints Validation
    // A. Patient.nom uniqueness
    const duplicatePatients = await safeExec(() =>
      prisma.patient.groupBy({
        by: ["nom"],
        _count: { nom: true },
        having: { nom: { _count: { gt: 1 } } },
      })
    );
    record(
      "Unicité des Noms de Patients (@unique)",
      duplicatePatients.length === 0,
      `${duplicatePatients.length} doublon(s)`
    );

    // B. Ordonnance.consultationId uniqueness
    const duplicateOrds = await safeExec(() =>
      prisma.ordonnance.groupBy({
        by: ["consultationId"],
        _count: { consultationId: true },
        having: { consultationId: { _count: { gt: 1 } } },
      })
    );
    record(
      "Unicité 1:1 Consultation -> Ordonnance (@unique)",
      duplicateOrds.length === 0,
      `${duplicateOrds.length} doublon(s)`
    );

    // C. BilanRecip.consultationId uniqueness
    const duplicateBRecips = await safeExec(() =>
      prisma.bilanRecip.groupBy({
        by: ["consultationId"],
        _count: { consultationId: true },
        having: { consultationId: { _count: { gt: 1 } } },
      })
    );
    record(
      "Unicité 1:1 Consultation -> BilanRecip (@unique)",
      duplicateBRecips.length === 0,
      `${duplicateBRecips.length} doublon(s)`
    );

    // D. Justification.consultationId uniqueness
    const duplicateJustifs = await safeExec(() =>
      prisma.justification.groupBy({
        by: ["consultationId"],
        _count: { consultationId: true },
        having: { consultationId: { _count: { gt: 1 } } },
      })
    );
    record(
      "Unicité 1:1 Consultation -> Justification (@unique)",
      duplicateJustifs.length === 0,
      `${duplicateJustifs.length} doublon(s)`
    );

    // E. CourbeInfo.consultationId uniqueness
    const duplicateCourbes = await safeExec(() =>
      prisma.courbeInfo.groupBy({
        by: ["consultationId"],
        where: { consultationId: { not: null } },
        _count: { consultationId: true },
        having: { consultationId: { _count: { gt: 1 } } },
      })
    );
    record(
      "Unicité 1:1 Consultation -> CourbeInfo (@unique)",
      duplicateCourbes.length === 0,
      `${duplicateCourbes.length} doublon(s)`
    );

    // Check 4: Enums & Range Constraints
    const validGroupes = [
      "A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG", null,
    ];
    const patientsWithInvalidBlood = await safeExec(() =>
      prisma.patient.findMany({
        where: { NOT: { groupeSanguin: { in: ["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"] } } },
      })
    );
    const nonNullInvalid = patientsWithInvalidBlood.filter((p) => p.groupeSanguin !== null);
    record(
      "Conformité de l'Enum GroupeSanguin",
      nonNullInvalid.length === 0,
      `${nonNullInvalid.length} valeur(s) invalide(s)`
    );

    // Check 5: Application Business Query Compatibility
    // A. Query used by Consulter / ViewPatient (Deep Patient Fetch)
    const testPatient = await safeExec(() =>
      prisma.patient.findFirst({
        where: { nom: { startsWith: PREFIX }, consultations: { some: {} } },
        include: {
          consultations: {
            include: {
              ordonnance: { include: { items: { include: { medicament: true } } } },
              bilanRecip: { include: { items: { include: { bilan: true } } } },
              justificationRecord: true,
              courbeInfo: true,
              radios: true,
              bilansFiles: true,
            },
          },
          ordonnances: { include: { items: { include: { medicament: true } } } },
          bilans: { include: { items: { include: { bilan: true } } } },
          paiements: true,
          courbeInfos: true,
          vaccinations: { include: { vaccine: true } },
          radios: true,
          bilanFiles: true,
          justifications: true,
        },
      })
    );
    record(
      "Requête Complexe Dossier Médical (/api/patients?id=...)",
      testPatient !== null && testPatient.consultations.length > 0,
      `Patient '${testPatient?.nom}' chargé avec succès`
    );

    // B. Query used by Statistics top-usage (/api/Stats/top-usage)
    const topMeds = await safeExec(() =>
      prisma.ordonnanceItem.groupBy({
        by: ["medicamentId"],
        _count: { medicamentId: true },
        orderBy: { _count: { medicamentId: "desc" } },
        take: 5,
      })
    );
    const topBilans = await safeExec(() =>
      prisma.bilanItem.groupBy({
        by: ["bilanId"],
        _count: { bilanId: true },
        orderBy: { _count: { bilanId: "desc" } },
        take: 5,
      })
    );
    record(
      "Agrégation Statistiques (/api/Stats/top-usage)",
      topMeds.length > 0 && topBilans.length > 0,
      `${topMeds.length} top médicaments, ${topBilans.length} top bilans agrégés`
    );

    // C. Query used by Growth Monitoring (/api/courbe-info)
    const growthData = await safeExec(() =>
      prisma.courbeInfo.findMany({
        where: { patientId: testPatient ? testPatient.id : undefined },
        orderBy: { createdAt: "asc" },
      })
    );
    record(
      "Requête Courbes de Croissance (/api/courbe-info)",
      growthData.length > 0,
      `${growthData.length} mesure(s) temporelle(s) récupérée(s)`
    );

    const elapsed = Date.now() - startTime;
    const allPassed = checks.every((c) => c.passed);

    console.log("\n================================================================================");
    console.log("📊 INVENTAIRE GLOBAL DE LA BASE DE DONNÉES (22 MODÈLES)");
    console.log("================================================================================");
    console.log(" Modèle Prisma                 │ Enregistrements dans la BD │ Statut");
    console.log("───────────────────────────────┼────────────────────────────┼─────────");
    for (const model of allModels) {
      const modelFormatted = (model.charAt(0).toUpperCase() + model.slice(1)).padEnd(29);
      const countFormatted = String(counts[model]).padStart(26);
      const statusFormatted = counts[model] > 0 ? "✅ OK" : "⚠️ VIDE";
      console.log(` ${modelFormatted} │ ${countFormatted} │ ${statusFormatted}`);
    }
    console.log("================================================================================");
    console.log(` Résultat global des tests    : ${allPassed ? "✅ TOUS LES TESTS ONT RÉUSSI" : "❌ CERTAINS TESTS ONT ÉCHOUÉ"}`);
    console.log(` Nombre de tests exécutés     : ${checks.length}`);
    console.log(` Temps d'exécution           : ${elapsed} ms`);
    console.log("================================================================================\n");

    return allPassed;
  } catch (err) {
    console.error("❌ Erreur inattendue lors de la vérification :", err);
    return false;
  }
}

// ==========================================
// 5. SAFE CLEANUP (ONLY TEST-GENERATED DATA)
// ==========================================

async function runCleanup() {
  console.log("\n================================================================================");
  console.log("🧹 NETTOYAGE SÉCURISÉ DES DONNÉES DE TEST (PRÉFIXE: 'TEST_')");
  console.log("================================================================================\n");

  try {
    // 1. Identify test patients
    const testPatients = await safeExec(() =>
      prisma.patient.findMany({
        where: { nom: { startsWith: PREFIX } },
        select: { id: true, nom: true },
      })
    );
    const testPatientIds = testPatients.map((p) => p.id);
    console.log(`🔍 ${testPatients.length} patient(s) de test identifié(s).`);

    if (testPatientIds.length > 0) {
      // Deleting patients cascades automatically to:
      // Consultations, Ordonnances, OrdonnanceItems, BilanRecips, BilanItems,
      // Justifications, CourbeInfos, Radios, BilanFiles, Vaccinations, Paiements
      const delPatients = await safeExec(() =>
        prisma.patient.deleteMany({
          where: { id: { in: testPatientIds } },
        })
      );
      console.log(`   🗑️  ${delPatients.count} patients de test supprimés (et tous leurs dossiers associés par cascade).`);
    }

    // 2. Delete test appointments
    const delRdvs = await safeExec(() =>
      prisma.rendezVous.deleteMany({
        where: { description: { contains: `[${PREFIX}]` } },
      })
    );
    console.log(`   🗑️  ${delRdvs.count} rendez-vous de test supprimés.`);

    // 3. Delete test RecetteTypes & items
    const delRecettes = await safeExec(() =>
      prisma.recetteType.deleteMany({
        where: { nom: { startsWith: PREFIX } },
      })
    );
    console.log(`   🗑️  ${delRecettes.count} ordonnances types de test supprimées.`);

    // 4. Delete test BilanTypes & items
    const delBilanTypes = await safeExec(() =>
      prisma.bilanType.deleteMany({
        where: { nom: { startsWith: PREFIX } },
      })
    );
    console.log(`   🗑️  ${delBilanTypes.count} bilans types de test supprimés.`);

    // 5. Delete test JustificationTypes
    const delJustifTypes = await safeExec(() =>
      prisma.justificationType.deleteMany({
        where: { nom: { startsWith: PREFIX } },
      })
    );
    console.log(`   🗑️  ${delJustifTypes.count} modèles de justification de test supprimés.`);

    // 6. Delete test Vaccines
    const delVaccines = await safeExec(() =>
      prisma.vaccine.deleteMany({
        where: { name: { startsWith: PREFIX } },
      })
    );
    console.log(`   🗑️  ${delVaccines.count} vaccins de test supprimés.`);

    // 7. Delete test Bilans
    const delBilans = await safeExec(() =>
      prisma.bilan.deleteMany({
        where: { nom: { startsWith: PREFIX } },
      })
    );
    console.log(`   🗑️  ${delBilans.count} types d'analyses de test supprimés.`);

    // 8. Delete test Medicaments
    const delMeds = await safeExec(() =>
      prisma.medicament.deleteMany({
        where: { nom: { startsWith: PREFIX } },
      })
    );
    console.log(`   🗑️  ${delMeds.count} médicaments de test supprimés.`);

    console.log("\n✅ Nettoyage terminé avec succès. Toutes les données réelles ont été préservées.");
  } catch (err) {
    console.error("❌ Erreur lors du nettoyage :", err.message);
  }
}

// ==========================================
// 6. CLI ENTRY POINT & ORCHESTRATION
// ==========================================

function printHelp() {
  console.log(`
Utilisation:
  node test.js [options]

Options:
  (aucune)      Génère ou synchronise le jeu de test complet, vérifie l'intégrité, et affiche le rapport.
  --verify      Exécute uniquement la suite de vérification et d'intégrité sans générer de nouvelles données.
  --clean       Supprime UNIQUEMENT les enregistrements préfixés '${PREFIX}' de manière sûre.
  --help        Affiche ce message d'aide.
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  if (args.includes("--clean")) {
    await runCleanup();
    return;
  }

  if (args.includes("--verify")) {
    const passed = await runVerification();
    process.exit(passed ? 0 : 1);
    return;
  }

  // Default: Seed + Verify
  await runSeed();
  const passed = await runVerification();
  if (!passed) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Erreur fatale :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
