"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Calendar,
  Weight,
  Ruler,
  Activity,
  Thermometer,
  HeartPulse,
  Droplets,
  Stethoscope,
  Pill,
  FlaskConical,
  FileText,
  Syringe,
  X,
  CheckCircle,
  Search,
  ExternalLink,
  TrendingUp,
  Save,
  Edit3,
  Printer,
  Phone,
  MapPin,
  User,
  Image as ImageIcon,
} from "lucide-react";
import PatientFinances from "@/app/component/PatientFinances/page";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { calculateAge } from "@/lib/age";
import { printOrdonnance, printBilan, printJustification } from "@/lib/printer";

// ==========================================
// Helper Utilities
// ==========================================

// Les helpers de date retournent "" si la valeur est vide → rien n'est affiché.
function formatDateDisplay(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTimeDisplay(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateForInput(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

const BLOOD_GROUPS = [
  { value: "A_POS", label: "A+" },
  { value: "A_NEG", label: "A-" },
  { value: "B_POS", label: "B+" },
  { value: "B_NEG", label: "B-" },
  { value: "AB_POS", label: "AB+" },
  { value: "AB_NEG", label: "AB-" },
  { value: "O_POS", label: "O+" },
  { value: "O_NEG", label: "O-" },
];

function getBloodGroupLabel(bg) {
  if (!bg) return "";
  const found = BLOOD_GROUPS.find((g) => g.value === bg);
  return found ? found.label : bg.replace("_", " ");
}

function toFormData(p = {}) {
  return {
    id: p.id || "",
    nom: p.nom || "",
    sexe: p.sexe || "",
    telephone: p.telephone || "",
    adresse: p.adresse || "",
    groupeSanguin: p.groupeSanguin || "",
    dateDeNaissance: p.dateDeNaissance
      ? formatDateForInput(p.dateDeNaissance)
      : "",
    poidsDeNaissance: p.poidsDeNaissance ?? "",
    antecedents: p.antecedents || "",
  };
}

const hasText = (v) => typeof v === "string" && v.trim() !== "";
const hasValue = (v) =>
  v !== null && v !== undefined && String(v).trim() !== "";

// ==========================================
// Small presentational components
// ==========================================

const PRIMARY_BTN =
  "bg-gradient-to-r from-[var(--color-500)] to-[var(--color-600)] hover:from-[var(--color-600)] hover:to-[var(--color-700)] text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5";

const CARD_CLASS =
  "border border-gray-200 bg-white shadow-2xs hover:shadow-sm transition overflow-hidden";

const INPUT_CLASS = "focus:ring-[var(--color-500)]";

// Affiche une information (label + valeur). Ne rend RIEN si la valeur est vide.
function InfoItem({ icon: Icon, label, value, className = "" }) {
  if (
    value === null ||
    value === undefined ||
    value === false ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }
  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border border-[var(--color-100)] bg-[var(--color-50)]/50 ${className}`}
    >
      {Icon && (
        <div className="p-2 rounded-lg bg-white border border-[var(--color-100)] text-[var(--color-700)] shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-500">
          {label}
        </p>
        <div className="text-sm font-semibold text-gray-900 mt-0.5 break-words whitespace-pre-line leading-relaxed">
          {value}
        </div>
      </div>
    </div>
  );
}

// Mesure clinique (chip). Ne rend RIEN si la valeur est vide.
function VitalChip({ icon: Icon, label, value }) {
  if (!hasValue(value)) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--color-50)] border border-[var(--color-200)] text-gray-800 text-xs font-medium">
      <Icon className="w-3 h-3 text-[var(--color-600)]" />
      {label} : <strong>{value}</strong>
    </span>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-300 text-center space-y-2">
      <Icon className="w-10 h-10 mx-auto text-gray-300" />
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {text && <p className="text-xs text-gray-500">{text}</p>}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full sm:w-80 bg-white rounded-xl">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 h-10 text-sm focus:ring-[var(--color-500)]"
      />
    </div>
  );
}

function IconBadge({ icon: Icon }) {
  return (
    <div className="p-2.5 rounded-xl bg-[var(--color-100)] text-[var(--color-700)] shrink-0">
      <Icon className="w-5 h-5" />
    </div>
  );
}

const TOOLTIP_STYLE = {
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  fontSize: "12px",
};

// ==========================================
// Main PatientModal Component
// ==========================================

export default function PatientModal({
  open,
  onClose,
  patient = {},
  initialTab = "info",
}) {
  const [fullPatient, setFullPatient] = useState(patient);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || "info");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [basePath, setBasePath] = useState("");

  // Search filters per tab
  const [searchVisites, setSearchVisites] = useState("");
  const [searchVaccines, setSearchVaccines] = useState("");
  const [searchPrescriptions, setSearchPrescriptions] = useState("");
  const [docFilter, setDocFilter] = useState("all"); // 'all' | 'bilans' | 'radios'

  const [formData, setFormData] = useState(toFormData(patient));

  // Get Electron base path for file opening if running in desktop shell
  useEffect(() => {
    if (typeof window !== "undefined" && window?.electron?.getAppPath) {
      window.electron
        .getAppPath()
        .then((path) => setBasePath(path))
        .catch(() => setBasePath(""));
    }
  }, []);

  // Sync state when patient prop changes or modal opens
  useEffect(() => {
    if (patient && patient.id) {
      setFullPatient(patient);
      setIsEditingInfo(false);
      setErrorMessage("");
      setActiveTab(initialTab || "info");
      setFormData(toFormData(patient));
      fetchFullPatientDetails(patient.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id, open, initialTab]);

  // Fetch complete patient dossier including all relations
  async function fetchFullPatientDetails(id) {
    if (!id) return;
    try {
      setLoadingDetails(true);
      const res = await fetch(`/api/patients?id=${id}`);
      if (!res.ok) throw new Error("Erreur de chargement du patient");
      const data = await res.json();
      setFullPatient(data);
      setFormData(toFormData(data));
    } catch (err) {
      console.error("❌ fetchFullPatientDetails error:", err);
    } finally {
      setLoadingDetails(false);
    }
  }

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleStartEdit = () => {
    setActiveTab("info");
    setErrorMessage("");
    setIsEditingInfo(true);
  };

  const handleCancelInfo = () => {
    setIsEditingInfo(false);
    setErrorMessage("");
    setFormData(toFormData(fullPatient));
  };

  // Save changes to patient profile
  const handleSaveInfo = async (e) => {
    if (e) e.preventDefault();
    if (!formData.nom || formData.nom.trim() === "") {
      setActiveTab("info");
      setErrorMessage("Le nom complet est obligatoire.");
      return;
    }

    setSaveLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/patients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          poidsDeNaissance: formData.poidsDeNaissance
            ? parseFloat(formData.poidsDeNaissance)
            : null,
          dateDeNaissance: formData.dateDeNaissance || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Échec de l'enregistrement");
      }

      const updated = await response.json();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setIsEditingInfo(false);
      await fetchFullPatientDetails(updated.id);
    } catch (err) {
      console.error("❌ handleSaveInfo error:", err);
      setErrorMessage(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaveLoading(false);
    }
  };

  // File helpers (compatible Electron shell & web browser)
  const formatFileUrl = (filename) => {
    if (!filename) return "";
    if (
      filename.startsWith("http://") ||
      filename.startsWith("https://") ||
      filename.startsWith("data:") ||
      filename.startsWith("/")
    ) {
      return filename;
    }
    return `/uploads/${filename}`;
  };

  const isImageFile = (filename) => {
    if (!filename) return false;
    const lower = String(filename).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp"].some(
      (ext) => lower.endsWith(ext),
    );
  };

  const handleOpenFile = (fileName) => {
    if (!fileName) return;
    if (typeof window !== "undefined" && window?.electron?.openFile) {
      window.electron.openFile(fileName);
    } else if (typeof window !== "undefined") {
      window.open(formatFileUrl(fileName), "_blank");
    }
  };

  // ==========================================
  // Data Aggregations
  // ==========================================

  const consultations = useMemo(
    () => fullPatient.consultations || [],
    [fullPatient.consultations],
  );
  const vaccinations = useMemo(
    () => fullPatient.vaccinations || [],
    [fullPatient.vaccinations],
  );
  const ordonnances = useMemo(
    () => fullPatient.ordonnances || [],
    [fullPatient.ordonnances],
  );
  const courbeInfos = useMemo(
    () => fullPatient.courbeInfos || [],
    [fullPatient.courbeInfos],
  );
  const radios = useMemo(() => fullPatient.radios || [], [fullPatient.radios]);
  const bilanFiles = useMemo(
    () => fullPatient.bilanFiles || [],
    [fullPatient.bilanFiles],
  );
  const bilansRecip = useMemo(
    () => fullPatient.bilans || [],
    [fullPatient.bilans],
  );

  const pediatricAge = useMemo(
    () => calculateAge(fullPatient.dateDeNaissance) || "",
    [fullPatient.dateDeNaissance],
  );

  // Growth progression data (birth + courbeInfo + consultations)
  const growthChartData = useMemo(() => {
    const list = [];

    if (fullPatient.poidsDeNaissance && fullPatient.dateDeNaissance) {
      list.push({
        date: formatDateDisplay(fullPatient.dateDeNaissance),
        timestamp: new Date(fullPatient.dateDeNaissance).getTime(),
        age: "Naissance",
        Poids: parseFloat(fullPatient.poidsDeNaissance),
        Taille: null,
        PC: null,
      });
    }

    courbeInfos.forEach((ci) => {
      list.push({
        date: formatDateDisplay(ci.createdAt),
        timestamp: new Date(ci.createdAt).getTime(),
        age: ci.age || formatDateDisplay(ci.createdAt),
        Poids: ci.poids || null,
        Taille: ci.taille || null,
        PC: ci.perimetreCranien || null,
      });
    });

    consultations.forEach((c) => {
      if (c.poids || c.taille || c.perimetreCranien) {
        const time = new Date(c.createdAt).getTime();
        const existing = list.find(
          (item) => Math.abs(item.timestamp - time) < 24 * 60 * 60 * 1000,
        );
        if (!existing) {
          list.push({
            date: formatDateDisplay(c.createdAt),
            timestamp: time,
            age: calculateAge(fullPatient.dateDeNaissance, c.createdAt),
            Poids: c.poids || null,
            Taille: c.taille || null,
            PC: c.perimetreCranien || null,
          });
        }
      }
    });

    list.sort((a, b) => a.timestamp - b.timestamp);
    return list;
  }, [
    fullPatient.poidsDeNaissance,
    fullPatient.dateDeNaissance,
    courbeInfos,
    consultations,
  ]);

  // Monthly visits histogram data
  const monthlyVisitsData = useMemo(() => {
    const counts = {};
    consultations.forEach((c) => {
      const d = new Date(c.createdAt);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => {
        const [year, month] = k.split("-");
        const monthName = new Date(year, parseInt(month) - 1).toLocaleString(
          "fr-FR",
          { month: "short" },
        );
        return { name: `${monthName} ${year}`, Visites: v };
      });
  }, [consultations]);

  // All documents (unfiltered)
  const allDocuments = useMemo(() => {
    const list = [];

    radios.forEach((r) => {
      list.push({
        id: `radio-${r.id}`,
        title: hasText(r.description) ? r.description : "",
        date: r.createdAt,
        type: "Radio",
        fichier: r.fichier,
      });
    });

    bilanFiles.forEach((bf) => {
      list.push({
        id: `bilanfile-${bf.id}`,
        title: hasText(bf.description)
          ? bf.description
          : hasText(bf.type)
            ? bf.type
            : "",
        date: bf.createdAt,
        type: "BilanFile",
        fichier: bf.fichier,
      });
    });

    bilansRecip.forEach((br) => {
      list.push({
        id: `bilanrecip-${br.id}`,
        title: "",
        date: br.createdAt,
        type: "BilanRecip",
        items: (br.items || []).filter((it) => hasText(it.bilan?.nom)),
        raw: br,
      });
    });

    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  }, [radios, bilanFiles, bilansRecip]);

  const bilansCount = bilanFiles.length + bilansRecip.length;

  const combinedDocuments = useMemo(() => {
    if (docFilter === "radios")
      return allDocuments.filter((d) => d.type === "Radio");
    if (docFilter === "bilans")
      return allDocuments.filter(
        (d) => d.type === "BilanFile" || d.type === "BilanRecip",
      );
    return allDocuments;
  }, [allDocuments, docFilter]);

  const filteredConsultations = useMemo(() => {
    if (!searchVisites.trim()) return consultations;
    const q = searchVisites.toLowerCase().trim();
    return consultations.filter(
      (c) =>
        (c.motifDeConsultation &&
          c.motifDeConsultation.toLowerCase().includes(q)) ||
        (c.note && c.note.toLowerCase().includes(q)) ||
        formatDateDisplay(c.createdAt).includes(q),
    );
  }, [consultations, searchVisites]);

  const filteredVaccinations = useMemo(() => {
    if (!searchVaccines.trim()) return vaccinations;
    const q = searchVaccines.toLowerCase().trim();
    return vaccinations.filter((v) => {
      const name = v.vaccine?.name || v.name || "";
      return (
        name.toLowerCase().includes(q) ||
        (v.notes && v.notes.toLowerCase().includes(q))
      );
    });
  }, [vaccinations, searchVaccines]);

  const filteredPrescriptions = useMemo(() => {
    if (!searchPrescriptions.trim()) return ordonnances;
    const q = searchPrescriptions.toLowerCase().trim();
    return ordonnances.filter((ord) => {
      const matchesDate = formatDateDisplay(ord.createdAt).includes(q);
      const matchesMed = (ord.items || []).some(
        (it) =>
          it.medicament?.nom && it.medicament.nom.toLowerCase().includes(q),
      );
      return matchesDate || matchesMed;
    });
  }, [ordonnances, searchPrescriptions]);

  // Crédit restant (consultations - versements)
  const patientTotalCredit = useMemo(() => {
    return consultations.reduce((acc, c) => {
      const prix = Number(c.prix) || 0;
      const totalPaye = (c.versements || []).reduce(
        (sum, v) => sum + (Number(v.montant) || 0),
        0,
      );
      return acc + Math.max(0, prix - totalPaye);
    }, 0);
  }, [consultations]);

  // Tabs : un badge n'est affiché que s'il y a quelque chose à compter
  const tabsList = [
    { id: "info", label: "Informations & Coordonnées" },
    { id: "consultations", label: "Consultations", count: consultations.length },
    { id: "finances", label: "Finances & Règlements" },
    { id: "vaccinations", label: "Vaccinations", count: vaccinations.length },
    { id: "prescriptions", label: "Ordonnances", count: ordonnances.length },
    {
      id: "documents",
      label: "Bilans & Radios",
      count: radios.length + bilanFiles.length + bilansRecip.length,
    },
  ];

  // Informations (mode lecture) – seules les valeurs renseignées sont affichées
  const sexeLabel = hasText(fullPatient.sexe)
    ? fullPatient.sexe.charAt(0).toUpperCase() + fullPatient.sexe.slice(1)
    : "";
  const birthLabel = formatDateDisplay(fullPatient.dateDeNaissance);
  const bloodLabel = getBloodGroupLabel(fullPatient.groupeSanguin);
  const birthWeightLabel = hasValue(fullPatient.poidsDeNaissance)
    ? `${fullPatient.poidsDeNaissance} kg`
    : "";
  const hasAnyInfo = [
    sexeLabel,
    birthLabel,
    birthWeightLabel,
    bloodLabel,
    fullPatient.telephone,
    fullPatient.adresse,
    fullPatient.antecedents,
  ].some(hasText);

  // Croissance : sections et colonnes dynamiques
  const hasWeightHeight = growthChartData.some((m) => m.Poids || m.Taille);
  const hasVisits = monthlyVisitsData.length > 0;
  const growthCols = {
    age: growthChartData.some((m) => hasText(m.age)),
    Poids: growthChartData.some((m) => m.Poids),
    Taille: growthChartData.some((m) => m.Taille),
    PC: growthChartData.some((m) => m.PC),
  };

  // Vaccinations : colonnes dynamiques
  const showVaccineDate = filteredVaccinations.some((v) =>
    hasText(formatDateDisplay(v.dateGiven)),
  );
  const showVaccineDose = filteredVaccinations.some((v) =>
    hasValue(v.doseNumber),
  );
  const showVaccineNotes = filteredVaccinations.some((v) => hasText(v.notes));

  const DOC_META = {
    Radio: { label: "Radiographie", icon: ImageIcon },
    BilanFile: { label: "Résultat d'analyse", icon: FlaskConical },
    BilanRecip: { label: "Bilan prescrit", icon: FileText },
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="w-[96vw] max-w-[96vw] sm:max-w-[95vw] md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border border-[var(--color-200)]"
        showCloseButton={false}
      >
        {/* ======================================================== */}
        {/* HEADER : identité + actions (Modifier / Enregistrer)     */}
        {/* ======================================================== */}
        <DialogHeader className="p-4 sm:px-6 sm:py-4 border-b border-[var(--color-200)] bg-gradient-to-r from-[var(--color-50)] to-white flex flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-[var(--color-800)] tracking-tight">
              {fullPatient.nom || "Dossier Patient"}
            </DialogTitle>
            {pediatricAge && (
              <span className="px-3 py-1 text-xs sm:text-sm rounded-full bg-[var(--color-100)] text-[var(--color-800)] font-semibold border border-[var(--color-200)] shadow-2xs">
                {pediatricAge}
              </span>
            )}
            {fullPatient.id && (
              <span className="text-xs text-gray-500 font-mono">
                #{fullPatient.id}
              </span>
            )}
            {patientTotalCredit > 0 ? (
              <span className="px-2.5 py-0.5 text-xs rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Solde dû : {patientTotalCredit.toLocaleString("fr-FR")} DZD
              </span>
            ) : consultations.length > 0 ? (
              <span className="px-2.5 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Compte à jour
              </span>
            ) : null}
            {loadingDetails && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-600)]" />
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {saveSuccess && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-green-700 font-semibold bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Enregistré
              </span>
            )}

            {!isEditingInfo ? (
              <Button
                type="button"
                size="sm"
                onClick={handleStartEdit}
                className="bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white shadow font-semibold flex items-center gap-1.5 text-xs sm:text-sm rounded-lg"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Modifier</span>
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCancelInfo}
                  disabled={saveLoading}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm rounded-lg"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveInfo}
                  disabled={saveLoading}
                  className="bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white shadow font-semibold flex items-center gap-1.5 text-xs sm:text-sm rounded-lg"
                >
                  {saveLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {saveLoading ? "Enregistrement..." : "Enregistrer"}
                  </span>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full w-8 h-8 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* ======================================================== */}
        {/* TAB NAVIGATION                                           */}
        {/* ======================================================== */}
        <div className="flex border-b border-[var(--color-200)] bg-[var(--color-50)]/40 px-4 sm:px-6 overflow-x-auto scrollbar-hide shrink-0">
          {tabsList.map((tab) => {
            const showCount = tab.count !== undefined && tab.count > 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "text-[var(--color-700)] border-[var(--color-600)] font-bold bg-white"
                    : "text-gray-600 border-transparent hover:text-[var(--color-600)] hover:border-[var(--color-300)]"
                }`}
              >
                <span>{tab.label}</span>
                {tab.id === "finances" && patientTotalCredit > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                    {patientTotalCredit.toLocaleString("fr-FR")} DZD
                  </span>
                )}
                {showCount && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id
                        ? "bg-[var(--color-100)] text-[var(--color-800)] font-bold"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* TAB CONTENTS                                             */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/40">
          {errorMessage && (
            <div className="mb-4 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* ------------------------------------------------------ */}
          {/* INFORMATIONS & COORDONNÉES                             */}
          {/* ------------------------------------------------------ */}
          {activeTab === "info" && (
            <Card className="border border-[var(--color-200)] shadow-sm bg-white rounded-xl">
              <CardContent className="p-4 sm:p-6">
                {isEditingInfo ? (
                  <form
                    onSubmit={handleSaveInfo}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        Nom complet *
                      </Label>
                      <Input
                        value={formData.nom}
                        onChange={(e) => handleChange("nom", e.target.value)}
                        placeholder="Nom et prénom..."
                        className={INPUT_CLASS}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        Sexe *
                      </Label>
                      <select
                        className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-[var(--color-500)] bg-white"
                        value={formData.sexe}
                        onChange={(e) => handleChange("sexe", e.target.value)}
                      >
                        <option value="">Sélectionner...</option>
                        <option value="garçon">Garçon</option>
                        <option value="fille">Fille</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        Date de naissance
                      </Label>
                      <Input
                        type="date"
                        value={formData.dateDeNaissance}
                        onChange={(e) =>
                          handleChange("dateDeNaissance", e.target.value)
                        }
                        className={INPUT_CLASS}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        Poids de naissance (kg)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 3.25"
                        value={formData.poidsDeNaissance}
                        onChange={(e) =>
                          handleChange("poidsDeNaissance", e.target.value)
                        }
                        className={INPUT_CLASS}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        Groupe sanguin
                      </Label>
                      <select
                        className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-[var(--color-500)] bg-white"
                        value={formData.groupeSanguin}
                        onChange={(e) =>
                          handleChange("groupeSanguin", e.target.value)
                        }
                      >
                        <option value="">Inconnu / Non renseigné</option>
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg.value} value={bg.value}>
                            {bg.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        Téléphone
                      </Label>
                      <Input
                        type="tel"
                        placeholder="06 XX XX XX XX"
                        value={formData.telephone}
                        onChange={(e) =>
                          handleChange("telephone", e.target.value)
                        }
                        className={INPUT_CLASS}
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2 md:col-span-3">
                      <Label className="text-xs font-semibold text-gray-700">
                        Adresse de résidence
                      </Label>
                      <Input
                        placeholder="Adresse complète..."
                        value={formData.adresse}
                        onChange={(e) =>
                          handleChange("adresse", e.target.value)
                        }
                        className={INPUT_CLASS}
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2 md:col-span-3">
                      <Label className="text-xs font-semibold text-gray-700">
                        Antécédents médicaux, chirurgicaux & allergies
                      </Label>
                      <Textarea
                        rows={3}
                        placeholder="Ex: Asthme, allergies médicamenteuses, terrain atopique..."
                        value={formData.antecedents}
                        onChange={(e) =>
                          handleChange("antecedents", e.target.value)
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                  </form>
                ) : hasAnyInfo ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <InfoItem icon={User} label="Sexe" value={sexeLabel} />
                    <InfoItem
                      icon={Calendar}
                      label="Né(e) le"
                      value={birthLabel}
                    />
                    <InfoItem
                      icon={Weight}
                      label="Poids de naissance"
                      value={birthWeightLabel}
                    />
                    <InfoItem
                      icon={Droplets}
                      label="Groupe sanguin"
                      value={bloodLabel}
                    />
                    <InfoItem
                      icon={Phone}
                      label="Téléphone"
                      value={fullPatient.telephone}
                    />
                    <InfoItem
                      icon={MapPin}
                      label="Adresse"
                      value={fullPatient.adresse}
                      className="sm:col-span-2 lg:col-span-1"
                    />
                    <InfoItem
                      icon={Activity}
                      label="Antécédents & allergies"
                      value={fullPatient.antecedents}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                  </div>
                ) : (
                  <EmptyState
                    icon={User}
                    title="Aucune information renseignée"
                    text="Utilisez le bouton Modifier pour compléter le dossier."
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* ------------------------------------------------------ */}
          {/* CONSULTATIONS                                          */}
          {/* ------------------------------------------------------ */}
          {activeTab === "consultations" && (
            <div className="space-y-4">
              {consultations.length > 3 && (
                <SearchBar
                  value={searchVisites}
                  onChange={setSearchVisites}
                  placeholder="Filtrer par motif, date ou note..."
                />
              )}

              {filteredConsultations.length === 0 ? (
                <EmptyState
                  icon={Stethoscope}
                  title={
                    searchVisites ? "Aucun résultat" : "Aucune visite enregistrée"
                  }
                />
              ) : (
                <div className="space-y-3">
                  {filteredConsultations.map((consult) => {
                    const motif = hasText(consult.motifDeConsultation)
                      ? consult.motifDeConsultation
                      : "";
                    const dateTime = formatDateTimeDisplay(consult.createdAt);
                    const rdvDate = formatDateDisplay(consult.rendezVous?.date);
                    const radiosList = consult.radios || [];

                    const hasVitals = [
                      consult.poids,
                      consult.taille,
                      consult.perimetreCranien,
                      consult.temperature,
                      consult.frequenceCardiaque,
                      consult.saturationOxygene,
                      hasValue(consult.tensionSystolique) &&
                      hasValue(consult.tensionDiastolique)
                        ? "ta"
                        : null,
                    ].some(hasValue);

                    const hasActions =
                      consult.ordonnance ||
                      consult.bilanRecip ||
                      consult.justificationRecord ||
                      radiosList.length > 0;

                    return (
                      <Card
                        key={consult.id}
                        className={`${CARD_CLASS} border-l-4 border-l-[var(--color-500)]`}
                      >
                        <CardContent className="p-4 sm:p-5 space-y-3">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3 min-w-0">
                              <IconBadge icon={Stethoscope} />
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-gray-900">
                                  {motif || dateTime}
                                </h4>
                                {motif && dateTime && (
                                  <span className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                    <Calendar className="w-3.5 h-3.5 text-[var(--color-600)]" />
                                    {dateTime}
                                  </span>
                                )}
                              </div>
                            </div>
                            {rdvDate && (
                              <span className="px-2.5 py-1 rounded-full bg-[var(--color-50)] text-[var(--color-800)] border border-[var(--color-200)] text-xs font-semibold">
                                RDV : {rdvDate}
                              </span>
                            )}
                          </div>

                          {hasVitals && (
                            <div className="flex flex-wrap gap-2">
                              <VitalChip
                                icon={Weight}
                                label="Poids"
                                value={
                                  hasValue(consult.poids)
                                    ? `${consult.poids} kg`
                                    : null
                                }
                              />
                              <VitalChip
                                icon={Ruler}
                                label="Taille"
                                value={
                                  hasValue(consult.taille)
                                    ? `${consult.taille} cm`
                                    : null
                                }
                              />
                              <VitalChip
                                icon={Ruler}
                                label="PC"
                                value={
                                  hasValue(consult.perimetreCranien)
                                    ? `${consult.perimetreCranien} cm`
                                    : null
                                }
                              />
                              <VitalChip
                                icon={Thermometer}
                                label="T°"
                                value={
                                  hasValue(consult.temperature)
                                    ? `${consult.temperature} °C`
                                    : null
                                }
                              />
                              <VitalChip
                                icon={Activity}
                                label="TA"
                                value={
                                  hasValue(consult.tensionSystolique) &&
                                  hasValue(consult.tensionDiastolique)
                                    ? `${consult.tensionSystolique}/${consult.tensionDiastolique} mmHg`
                                    : null
                                }
                              />
                              <VitalChip
                                icon={HeartPulse}
                                label="FC"
                                value={
                                  hasValue(consult.frequenceCardiaque)
                                    ? `${consult.frequenceCardiaque} bpm`
                                    : null
                                }
                              />
                              <VitalChip
                                icon={Droplets}
                                label="SpO2"
                                value={
                                  hasValue(consult.saturationOxygene)
                                    ? `${consult.saturationOxygene} %`
                                    : null
                                }
                              />
                            </div>
                          )}

                          {hasText(consult.note) && (
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-800">
                              <span className="font-semibold text-gray-700 block mb-0.5">
                                Notes & Diagnostic
                              </span>
                              <p className="whitespace-pre-line leading-relaxed">
                                {consult.note}
                              </p>
                            </div>
                          )}

                          {hasText(consult.developpementPsychomoteur) && (
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-800">
                              <span className="font-semibold text-gray-700 block mb-0.5">
                                Développement psychomoteur
                              </span>
                              <p className="whitespace-pre-line leading-relaxed">
                                {consult.developpementPsychomoteur}
                              </p>
                            </div>
                          )}

                          {hasActions && (
                            <div className="pt-3 flex flex-wrap items-center gap-2 border-t border-gray-100">
                              {consult.ordonnance && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    printOrdonnance({
                                      nom: fullPatient.nom,
                                      age: pediatricAge,
                                      consultationId: consult.id,
                                      items: consult.ordonnance.items || [],
                                    })
                                  }
                                  className={PRIMARY_BTN}
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Ordonnance
                                </Button>
                              )}

                              {consult.bilanRecip && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    printBilan({
                                      nom: fullPatient.nom,
                                      age: pediatricAge,
                                      consultationId: consult.id,
                                      items: (
                                        consult.bilanRecip.items || []
                                      ).map((it) => ({ nom: it.bilan?.nom })),
                                    })
                                  }
                                  className={PRIMARY_BTN}
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Bilan
                                </Button>
                              )}

                              {consult.justificationRecord && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    printJustification({
                                      nom: fullPatient.nom,
                                      age: pediatricAge,
                                      consultationId: consult.id,
                                      texte: consult.justificationRecord.texte,
                                    })
                                  }
                                  className={PRIMARY_BTN}
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Justification
                                </Button>
                              )}

                              {radiosList.map((r) => (
                                <Button
                                  key={r.id}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenFile(r.fichier)}
                                  className="border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1 text-xs"
                                >
                                  <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                                  {hasText(r.description)
                                    ? r.description
                                    : "Radio"}
                                </Button>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------ */}
          {/* FINANCES & RÈGLEMENTS                                  */}
          {/* ------------------------------------------------------ */}
          {activeTab === "finances" && (
            <PatientFinances
              patient={fullPatient}
              onRefresh={() => fetchFullPatientDetails(fullPatient.id)}
            />
          )}

          {/* ------------------------------------------------------ */}
          {/* VACCINATIONS                                           */}
          {/* ------------------------------------------------------ */}
          {activeTab === "vaccinations" && (
            <div className="space-y-4">
              {vaccinations.length > 5 && (
                <SearchBar
                  value={searchVaccines}
                  onChange={setSearchVaccines}
                  placeholder="Rechercher un vaccin..."
                />
              )}

              {filteredVaccinations.length === 0 ? (
                <EmptyState
                  icon={Syringe}
                  title={
                    searchVaccines ? "Aucun résultat" : "Carnet vaccinal vide"
                  }
                />
              ) : (
                <div className="rounded-xl border border-[var(--color-100)] overflow-hidden bg-white shadow-2xs">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-gradient-to-r from-[var(--color-100)] to-[var(--color-200)] text-[var(--color-800)]">
                      <tr>
                        <th className="text-left px-5 py-3 font-bold text-sm">
                          Vaccin
                        </th>
                        {showVaccineDate && (
                          <th className="text-left px-5 py-3 font-bold text-sm">
                            Date
                          </th>
                        )}
                        {showVaccineDose && (
                          <th className="text-left px-5 py-3 font-bold text-sm">
                            Dose
                          </th>
                        )}
                        {showVaccineNotes && (
                          <th className="text-left px-5 py-3 font-bold text-sm">
                            Observations
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredVaccinations.map((vaccine, index) => (
                        <tr
                          key={vaccine.id}
                          className={`transition-colors hover:bg-[var(--color-50)] ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3 font-semibold text-gray-900">
                              <div className="p-2 bg-[var(--color-100)] rounded-full shrink-0">
                                <Syringe className="w-4 h-4 text-[var(--color-700)]" />
                              </div>
                              {vaccine.vaccine?.name || vaccine.name}
                            </div>
                          </td>
                          {showVaccineDate && (
                            <td className="px-5 py-3.5 text-gray-700 font-medium">
                              {formatDateDisplay(vaccine.dateGiven)}
                            </td>
                          )}
                          {showVaccineDose && (
                            <td className="px-5 py-3.5">
                              {hasValue(vaccine.doseNumber) && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-100)] text-[var(--color-800)]">
                                  Dose #{vaccine.doseNumber}
                                </span>
                              )}
                            </td>
                          )}
                          {showVaccineNotes && (
                            <td className="px-5 py-3.5 text-gray-600">
                              {vaccine.notes}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------ */}
          {/* CROISSANCE & MESURES                                   */}
          {/* ------------------------------------------------------ */}
        

          {/* ------------------------------------------------------ */}
          {/* ORDONNANCES                                            */}
          {/* ------------------------------------------------------ */}
          {activeTab === "prescriptions" && (
            <div className="space-y-4">
              {ordonnances.length > 3 && (
                <SearchBar
                  value={searchPrescriptions}
                  onChange={setSearchPrescriptions}
                  placeholder="Rechercher par médicament ou date..."
                />
              )}

              {filteredPrescriptions.length === 0 ? (
                <EmptyState
                  icon={Pill}
                  title={
                    searchPrescriptions
                      ? "Aucun résultat"
                      : "Aucune ordonnance délivrée"
                  }
                />
              ) : (
                <div className="space-y-3">
                  {filteredPrescriptions.map((ord) => {
                    const items = ord.items || [];
                    const columns = [
                      { key: "dosage", label: "Dosage" },
                      { key: "frequence", label: "Fréquence" },
                      { key: "duree", label: "Durée" },
                    ].filter((c) => items.some((it) => hasText(it[c.key])));
                    const showQty = items.some((it) => hasValue(it.quantite));
                    const date = formatDateTimeDisplay(ord.createdAt);

                    return (
                      <Card
                        key={ord.id}
                        className={`${CARD_CLASS} border-l-4 border-l-[var(--color-500)]`}
                      >
                        <CardContent className="p-4 sm:p-5 space-y-3">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                              <IconBadge icon={Pill} />
                              <div>
                                <h4 className="text-sm font-bold text-gray-900">
                                  {date || `N° ${ord.id}`}
                                </h4>
                                {date && (
                                  <span className="text-xs text-gray-500 font-mono">
                                    N° {ord.id}
                                  </span>
                                )}
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() =>
                                printOrdonnance({
                                  nom: fullPatient.nom,
                                  age: pediatricAge,
                                  ordonnanceId: ord.id,
                                  items,
                                })
                              }
                              className={PRIMARY_BTN}
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Imprimer
                            </Button>
                          </div>

                          {items.length > 0 && (
                            <div className="rounded-lg border border-gray-100 overflow-hidden">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-[var(--color-50)] border-b border-[var(--color-100)] text-gray-700 font-semibold">
                                    <th className="p-2.5">Médicament</th>
                                    {columns.map((c) => (
                                      <th key={c.key} className="p-2.5">
                                        {c.label}
                                      </th>
                                    ))}
                                    {showQty && (
                                      <th className="p-2.5 text-right">
                                        Quantité
                                      </th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {items.map((it, idx) => (
                                    <tr
                                      key={it.id || idx}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="p-2.5 font-bold text-gray-900">
                                        {it.medicament?.nom}
                                      </td>
                                      {columns.map((c) => (
                                        <td
                                          key={c.key}
                                          className="p-2.5 text-gray-700"
                                        >
                                          {it[c.key]}
                                        </td>
                                      ))}
                                      {showQty && (
                                        <td className="p-2.5 text-right font-medium text-gray-800">
                                          {hasValue(it.quantite) &&
                                            `${it.quantite} boîte${it.quantite > 1 ? "s" : ""}`}
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------ */}
          {/* BILANS & RADIOS                                        */}
          {/* ------------------------------------------------------ */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              {radios.length > 0 && bilansCount > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "all", label: "Tous", count: allDocuments.length },
                    { id: "bilans", label: "Analyses", count: bilansCount },
                    {
                      id: "radios",
                      label: "Radiographies",
                      count: radios.length,
                    },
                  ].map((f) => (
                    <Button
                      key={f.id}
                      size="sm"
                      variant={docFilter === f.id ? "default" : "outline"}
                      onClick={() => setDocFilter(f.id)}
                      className={`rounded-full text-xs ${
                        docFilter === f.id
                          ? "bg-[var(--color-600)] text-white"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      {f.label} ({f.count})
                    </Button>
                  ))}
                </div>
              )}

              {combinedDocuments.length === 0 ? (
                <EmptyState icon={FileText} title="Aucun document rattaché" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {combinedDocuments.map((doc) => {
                    const meta = DOC_META[doc.type];
                    const isBilanRecip = doc.type === "BilanRecip";
                    const date = formatDateTimeDisplay(doc.date);
                    const hasImage = doc.fichier && isImageFile(doc.fichier);
                    const hasItems = isBilanRecip && doc.items?.length > 0;

                    return (
                      <Card key={doc.id} className={CARD_CLASS}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <IconBadge icon={meta.icon} />
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 line-clamp-1">
                                  {doc.title || meta.label}
                                </h4>
                                {date && (
                                  <span className="text-xs text-gray-500">
                                    {date}
                                  </span>
                                )}
                              </div>
                            </div>

                            {doc.title && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-100)] text-[var(--color-800)] shrink-0">
                                {meta.label}
                              </span>
                            )}
                          </div>

                          {hasImage && (
                            <button
                              type="button"
                              onClick={() => handleOpenFile(doc.fichier)}
                              className="block w-full h-40 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                            >
                              <img
                                src={formatFileUrl(doc.fichier)}
                                alt={doc.title || meta.label}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.parentElement.style.display =
                                    "none";
                                }}
                              />
                            </button>
                          )}

                          {hasItems && (
                            <div className="flex flex-wrap gap-1.5">
                              {doc.items.map((it, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-[var(--color-50)] border border-[var(--color-100)] text-gray-800 text-xs"
                                >
                                  {it.bilan.nom}
                                </span>
                              ))}
                            </div>
                          )}

                          {(doc.fichier || hasItems) && (
                            <div className="pt-3 flex justify-end border-t border-gray-100">
                              {doc.fichier ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenFile(doc.fichier)}
                                  className="border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 text-xs"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Ouvrir
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    printBilan({
                                      nom: fullPatient.nom,
                                      age: pediatricAge,
                                      items: doc.items.map((it) => ({
                                        nom: it.bilan?.nom,
                                      })),
                                    })
                                  }
                                  className={PRIMARY_BTN}
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Imprimer
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}