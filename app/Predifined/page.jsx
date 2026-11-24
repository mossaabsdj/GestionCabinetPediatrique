"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Plus,
  Search,
  Pill,
  TestTube,
  FlaskConical,
  Loader2,
  FileText,
  ClipboardList,
  Edit2,
  RefreshCw,
  Layers,
  X,
  AlertCircle,
} from "lucide-react";
import DialogPage from "@/app/component/DialogPage/page";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: 16, transition: { duration: 0.2 } },
};

export default function TypesPage() {
  const [activeTab, setActiveTab] = useState("ord");
  const [ordTypes, setOrdTypes] = useState([]);
  const [bilanTypes, setBilanTypes] = useState([]);
  const [justifTypes, setJustifTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [modal, setModal] = useState({
    open: false,
    section: "ord",
    mode: "add",
    type: null,
  });

  const [typeLabel, setTypeLabel] = useState("");
  const [medQuery, setMedQuery] = useState("");
  const [selectedMeds, setSelectedMeds] = useState([]);
  const [bilanQuery, setBilanQuery] = useState("");
  const [selectedBilans, setSelectedBilans] = useState([]);
  const [MEDICAMENTS, setMedicaments] = useState([]);
  const [BILANS, setBilans] = useState([]);
  const [openMedDialog, setOpenMedDialog] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [isEditingMed, setIsEditingMed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Keyboard highlight indexes for autocomplete lists
  const [hiMed, setHiMed] = useState(0);
  const [hiBilan, setHiBilan] = useState(0);

  // Refs for auto-scrolling preview lists when items are added
  const medsListRef = useRef(null);
  const bilansListRef = useRef(null);

  // Justifs
  const [newJustif, setNewJustif] = useState({ nom: "", texte: "" });
  const [justifList, setJustifList] = useState([]);
  const [Dejaexist, setDejaExistDialog] = useState(false);
  const [DejaexistB, setDejaExistDialogB] = useState(false);

  const scrollListToBottom = (ref) => {
    requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.scrollTo({
          top: ref.current.scrollHeight,
          behavior: "smooth",
        });
      }
    });
  };

  const openAdd = (section = activeTab) => {
    setSaveError("");
    setModal({ open: true, section, mode: "add", type: null });
    setTypeLabel("");
    setSelectedMeds([]);
    setSelectedBilans([]);
    setNewJustif({ nom: "", texte: "" });
    setJustifList([]);
    setMedQuery("");
    setBilanQuery("");
    setHiMed(0);
    setHiBilan(0);
  };

  async function fetchJustifTypes() {
    try {
      const response = await fetch("/api/JustificationsType", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(
          err.error || "Erreur lors du chargement des justifications types"
        );
      }

      const data = await response.json();
      setJustifTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ fetchJustifTypes error:", err);
    }
  }

  async function fetchBilanTypes() {
    try {
      const response = await fetch("/api/BilansType", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(
          err.error || "Erreur lors du chargement des bilans types"
        );
      }

      const data = await response.json();
      setBilanTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ fetchBilanTypes error:", err);
    }
  }

  async function fetchRecettes() {
    try {
      const response = await fetch("/api/OrdanaceType", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        let message = "Erreur lors du chargement des recettes types";
        try {
          const error = await response.json();
          message = error.error || message;
        } catch {}
        throw new Error(message);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ fetchRecettes error:", err);
      throw err;
    }
  }

  const loadRecettes = async () => {
    try {
      const data = await fetchRecettes();
      setOrdTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  async function fetchMedicaments() {
    try {
      const res = await fetch("/api/medicaments");
      const data = await res.json();
      if (Array.isArray(data)) setMedicaments(data);
    } catch (err) {
      console.error("Erreur de chargement des médicaments", err);
    }
  }

  async function fetchBilans() {
    try {
      const res = await fetch("/api/bilans");
      const data = await res.json();
      if (Array.isArray(data)) setBilans(data);
    } catch (err) {
      console.error("Erreur de chargement des bilans", err);
    }
  }

  async function loadAllInitialData() {
    setLoading(true);
    try {
      await Promise.allSettled([
        loadRecettes(),
        fetchMedicaments(),
        fetchBilans(),
        fetchBilanTypes(),
        fetchJustifTypes(),
      ]);
    } catch (err) {
      console.error("Erreur de chargement des données prédéfinies:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (section, type) => {
    setSaveError("");
    setModal({ open: true, section, mode: "edit", type });
    setTypeLabel(type.nom || "");
    setMedQuery("");
    setBilanQuery("");
    setHiMed(0);
    setHiBilan(0);
    if (section === "ord") {
      setSelectedMeds(type.items || []);
    }
    if (section === "bilan") {
      setSelectedBilans(type.items || []);
    }
    if (section === "justif") {
      setNewJustif({ nom: type.nom || "", texte: type.texte || "" });
    }
  };

  async function createRecette(data) {
    try {
      const payload = {
        nom: data.label,
        items: data.meds.map((item) => ({
          medicamentId: item.id,
          frequence:
            item.tmpDose === "custom" ? item.tmpCustomDose : item.tmpDose,
          dosage:
            item.tmpStrength === "custom"
              ? item.tmpCustomStrength
              : item.tmpStrength,
          duree:
            item.tmpDuration === "custom"
              ? item.tmpCustomDuration
              : item.tmpDuration,
          quantite: item.tmpQuantite,
        })),
      };

      const response = await fetch("/api/OrdanaceType", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la création de la recette";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ createRecette error:", err);
      throw err;
    }
  }

  async function createBilanType(data) {
    try {
      const payload = {
        nom: data.label,
        items: data.bilans.map((item) => ({
          bilanId: item.id,
          remarque: item.remarque || null,
        })),
      };

      const response = await fetch("/api/BilansType", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la création du type de bilan";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ createBilanType error:", err);
      throw err;
    }
  }

  async function updateBilanType(data) {
    try {
      const payload = {
        id: data.id,
        nom: data.label,
        items: data.bilans.map((item) => ({
          bilanId: item.id,
          remarque: item.remarque || null,
        })),
      };

      const response = await fetch("/api/BilansType", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la mise à jour du type de bilan";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ updateBilanType error:", err);
      throw err;
    }
  }

  async function updateRecette(data) {
    try {
      const payload = {
        id: data.id,
        nom: data.label,
        items: data.meds.map((item) => ({
          medicamentId: item.id,
          dosage:
            item.tmpStrength === "custom"
              ? item.tmpCustomStrength
              : item.tmpStrength || item.dosage || null,
          frequence:
            item.tmpDose === "custom"
              ? item.tmpCustomDose
              : item.tmpDose || item.frequence || null,
          duree:
            item.tmpDuration === "custom"
              ? item.tmpCustomDuration
              : item.tmpDuration || item.duree || null,
          quantite: item.tmpQuantite || item.quantite || null,
        })),
      };

      const response = await fetch("/api/OrdanaceType", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "Erreur lors de la mise à jour de la recette";
        try {
          const error = await response.json();
          message = error.error || error.message || message;
        } catch {}
        throw new Error(message);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ updateRecette error:", err);
      throw err;
    }
  }

  async function deleteBilanType(id) {
    try {
      if (!id) throw new Error("ID est requis pour la suppression");

      const response = await fetch(`/api/BilansType?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la suppression du type de bilan";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ deleteBilanType error:", err);
      throw err;
    }
  }

  async function deleteRecetteType(id) {
    try {
      if (!id) throw new Error("ID de la recette requis");

      const response = await fetch(`/api/OrdanaceType?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la suppression de la recette";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const result = await response.json();
      return result.message || "Recette supprimée avec succès";
    } catch (err) {
      console.error("❌ deleteRecetteType error:", err);
      throw err;
    }
  }

  async function createJustifType(data) {
    try {
      const payload = {
        nom: data.label,
        texte: newJustif.texte || "",
      };

      const response = await fetch("/api/JustificationsType", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la création du type de justification";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ createJustifType error:", err);
      throw err;
    }
  }

  async function updateJustifType(data) {
    try {
      const payload = {
        id: data.id,
        nom: data.label,
        texte: newJustif.texte || "",
      };

      const response = await fetch("/api/JustificationsType", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la mise à jour du type de justification";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ updateJustifType error:", err);
      throw err;
    }
  }

  async function deleteJustifType(id) {
    try {
      if (!id) throw new Error("ID requis pour la suppression");

      const response = await fetch(`/api/JustificationsType?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la suppression du type de justification";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const result = await response.json();
      return result.message || "Supprimé avec succès";
    } catch (err) {
      console.error("❌ deleteJustifType error:", err);
      throw err;
    }
  }

  const handleSave = async () => {
    if (!typeLabel.trim()) return;

    const newType = {
      id: modal.type?.id || Date.now().toString(),
      label: typeLabel.trim(),
      meds: selectedMeds,
      bilans: selectedBilans,
      justifs: justifList,
    };

    setSaving(true);
    setSaveError("");
    try {
      if (modal.section === "ord") {
        if (modal.mode === "add") {
          await createRecette(newType);
        } else {
          await updateRecette(newType);
        }
        await loadRecettes();
      }

      if (modal.section === "bilan") {
        if (modal.mode === "add") {
          await createBilanType(newType);
        } else {
          await updateBilanType(newType);
        }
        await fetchBilanTypes();
      }

      if (modal.section === "justif") {
        if (modal.mode === "add") {
          await createJustifType(newType);
        } else {
          await updateJustifType(newType);
        }
        await fetchJustifTypes();
      }

      setSaveError("");
      setModal({ open: false, section: activeTab, mode: "add", type: null });
    } catch (err) {
      console.error("❌ handleSave error:", err);
      setSaveError(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (section, id) => {
    try {
      if (section === "ord") {
        await deleteRecetteType(id);
        await loadRecettes();
      } else if (section === "bilan") {
        await deleteBilanType(id);
        await fetchBilanTypes();
      } else if (section === "justif") {
        await deleteJustifType(id);
        await fetchJustifTypes();
      }
    } catch (err) {
      console.error("❌ handleDelete error:", err);
      throw err;
    }
  };

  // Filtered autocomplete lists
  const filteredMeds = useMemo(
    () =>
      MEDICAMENTS.filter((m) =>
        (m.nom || "").toLowerCase().includes(medQuery.toLowerCase())
      ),
    [MEDICAMENTS, medQuery]
  );

  const filteredBilans = useMemo(
    () =>
      BILANS.filter((b) =>
        (b.nom || "").toLowerCase().includes(bilanQuery.toLowerCase())
      ),
    [BILANS, bilanQuery]
  );

  const pickMed = (m) => {
    if (!selectedMeds.some((sm) => sm.id === m.id)) {
      setIsEditingMed(false);
      setSelectedMed({
        ...m,
        tmpStrength: m.tmpStrength || "",
        tmpDose: m.tmpDose || "1 fois / jour",
        tmpDuration: m.tmpDuration || "5 jours",
        tmpQuantite: m.tmpQuantite || 1,
      });
      setOpenMedDialog(true);
    } else {
      setDejaExistDialog(true);
    }
  };

  const editSelectedMed = (m) => {
    setIsEditingMed(true);
    setSelectedMed({
      ...m,
      tmpStrength: m.tmpStrength || m.dosage || "",
      tmpDose: m.tmpDose || m.frequence || "1 fois / jour",
      tmpDuration: m.tmpDuration || m.duree || "5 jours",
      tmpQuantite: m.tmpQuantite || m.quantite || 1,
    });
    setOpenMedDialog(true);
  };

  const addMedication = () => {
    if (!selectedMed) return;

    if (isEditingMed) {
      setSelectedMeds((prev) =>
        prev.map((item) => (item.id === selectedMed.id ? selectedMed : item))
      );
    } else if (!selectedMeds.some((sm) => sm.id === selectedMed.id)) {
      setSelectedMeds((prev) => [...prev, selectedMed]);
      setMedQuery("");
      scrollListToBottom(medsListRef);
    }

    setIsEditingMed(false);
    setOpenMedDialog(false);
  };

  const pickBilan = (b) => {
    if (!selectedBilans.some((sm) => sm.id === b.id)) {
      setSelectedBilans((prev) => [...prev, b]);
      setBilanQuery("");
      scrollListToBottom(bilansListRef);
    } else {
      setDejaExistDialogB(true);
    }
  };

  // Filtered data for active section
  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (activeTab === "ord") {
      return ordTypes.filter((t) =>
        (t.nom || "").toLowerCase().includes(q)
      );
    }
    if (activeTab === "bilan") {
      return bilanTypes.filter((t) =>
        (t.nom || "").toLowerCase().includes(q)
      );
    }
    return justifTypes.filter(
      (t) =>
        (t.nom || "").toLowerCase().includes(q) ||
        (t.texte || "").toLowerCase().includes(q)
    );
  }, [activeTab, ordTypes, bilanTypes, justifTypes, searchQuery]);

  const sectionMeta = {
    ord: {
      singular: "une ordonnance type",
      addLabel: "Nouvelle ordonnance",
      emptyIcon: Pill,
      emptyText: "Aucun type d'ordonnance trouvé",
    },
    bilan: {
      singular: "un bilan type",
      addLabel: "Nouveau bilan",
      emptyIcon: TestTube,
      emptyText: "Aucun type de bilan trouvé",
    },
    justif: {
      singular: "une justification type",
      addLabel: "Nouvelle justification",
      emptyIcon: FileText,
      emptyText: "Aucun type de justification trouvé",
    },
  }[activeTab];

  const EmptyIcon = sectionMeta.emptyIcon;

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden flex flex-col bg-gradient-to-br from-[var(--color-50)] via-white to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl w-full mx-auto flex flex-col flex-1 min-h-0 gap-4">
        {/* ======================================================== */}
        {/* HEADER (avec recherche, onglets, ajout et rafraîchir)    */}
        {/* ======================================================== */}
        <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--color-600)] text-white shadow-md">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                Modèles &amp; Protocoles Types
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium">
                Configuration des ordonnances, bilans et justifications prédéfinis
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Rechercher un modèle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 rounded-xl border-slate-200 bg-white text-xs focus:ring-1 focus:ring-[var(--color-500)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("ord");
                  setSearchQuery("");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "ord"
                    ? "bg-white text-[var(--color-700)] shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Ordonnances</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("bilan");
                  setSearchQuery("");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "bilan"
                    ? "bg-white text-[var(--color-700)] shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TestTube className="w-3.5 h-3.5" />
                <span>Bilans</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("justif");
                  setSearchQuery("");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "justif"
                    ? "bg-white text-[var(--color-700)] shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Justifs</span>
              </button>
            </div>

            <Button
              onClick={() => openAdd(activeTab)}
              className="h-9 rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white shadow-sm flex items-center gap-2 text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              {sectionMeta.addLabel}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={loadAllInitialData}
              disabled={loading}
              className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SUMMARY CARDS                                            */}
        {/* ======================================================== */}
        <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Ordonnances Types */}
          <Card
            onClick={() => setActiveTab("ord")}
            className={`rounded-xl shadow-xs bg-white overflow-hidden px-3.5 py-2.5 flex-row items-center gap-3 cursor-pointer transition-all ${
              activeTab === "ord"
                ? "border-[var(--color-400)] ring-1 ring-[var(--color-200)]"
                : "border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
              <Pill className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 leading-none">
                Ordonnances Types
              </p>
              <div className="mt-1 text-lg font-extrabold text-slate-800 leading-tight">
                {loading ? (
                  <div className="h-5 w-16 bg-slate-100 animate-pulse rounded" />
                ) : (
                  `${ordTypes.length} modèle${ordTypes.length > 1 ? "s" : ""}`
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Prescriptions pré-configurées
              </p>
            </div>
          </Card>

          {/* Bilans Types */}
          <Card
            onClick={() => setActiveTab("bilan")}
            className={`rounded-xl shadow-xs bg-white overflow-hidden px-3.5 py-2.5 flex-row items-center gap-3 cursor-pointer transition-all ${
              activeTab === "bilan"
                ? "border-[var(--color-400)] ring-1 ring-[var(--color-200)]"
                : "border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <TestTube className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 leading-none">
                Bilans Types
              </p>
              <div className="mt-1 text-lg font-extrabold text-slate-800 leading-tight">
                {loading ? (
                  <div className="h-5 w-16 bg-slate-100 animate-pulse rounded" />
                ) : (
                  `${bilanTypes.length} modèle${bilanTypes.length > 1 ? "s" : ""}`
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Examens et analyses groupés
              </p>
            </div>
          </Card>

          {/* Justifications Types */}
          <Card
            onClick={() => setActiveTab("justif")}
            className={`rounded-xl shadow-xs bg-white overflow-hidden px-3.5 py-2.5 flex-row items-center gap-3 cursor-pointer transition-all ${
              activeTab === "justif"
                ? "border-[var(--color-400)] ring-1 ring-[var(--color-200)]"
                : "border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 leading-none">
                Justifications Types
              </p>
              <div className="mt-1 text-lg font-extrabold text-slate-800 leading-tight">
                {loading ? (
                  <div className="h-5 w-16 bg-slate-100 animate-pulse rounded" />
                ) : (
                  `${justifTypes.length} modèle${justifTypes.length > 1 ? "s" : ""}`
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Certificats et textes types
              </p>
            </div>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* TYPES TABLE                                              */}
        {/* ======================================================== */}
        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl shadow-lg overflow-hidden border border-[var(--color-100)]">
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[var(--color-600)] text-white">
                  <th className="bg-[var(--color-600)] text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider w-[280px]">
                    Nom du modèle
                  </th>
                  <th className="bg-[var(--color-600)] text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                    Aperçu / Contenu
                  </th>
                  <th className="bg-[var(--color-600)] text-right px-6 py-4 font-semibold text-sm uppercase tracking-wider w-[150px]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`type-skel-${i}`} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 w-44 bg-[var(--color-200)]/60 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-56 bg-[var(--color-200)]/60 rounded-full" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 bg-[var(--color-200)]/60 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <EmptyIcon className="w-10 h-10 text-gray-300" />
                        <p className="text-sm font-semibold text-gray-700">
                          {sectionMeta.emptyText}
                        </p>
                        <p className="text-xs text-gray-500 max-w-xs">
                          {searchQuery
                            ? "Aucun résultat ne correspond à votre recherche."
                            : `Créez ${sectionMeta.singular} pour accélérer vos consultations.`}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => openAdd(activeTab)}
                          className="mt-2 text-xs rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          {sectionMeta.addLabel}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((t, index) => (
                    <tr
                      key={t.id}
                      onClick={() => openEdit(activeTab, t)}
                      className={`cursor-pointer transition-colors hover:bg-[var(--color-50)] ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-800">
                          {activeTab === "ord" && (
                            <Pill className="w-4 h-4 text-[var(--color-500)] shrink-0" />
                          )}
                          {activeTab === "bilan" && (
                            <TestTube className="w-4 h-4 text-[var(--color-500)] shrink-0" />
                          )}
                          {activeTab === "justif" && (
                            <FileText className="w-4 h-4 text-[var(--color-500)] shrink-0" />
                          )}
                          <span>{t.nom}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {activeTab === "ord" && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-50)] text-[var(--color-700)] border border-[var(--color-200)]">
                              {t.items?.length || 0} médicament
                              {(t.items?.length || 0) > 1 ? "s" : ""}
                            </span>
                            {t.items?.slice(0, 3).map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                              >
                                {item.nom}
                              </span>
                            ))}
                            {(t.items?.length || 0) > 3 && (
                              <span className="text-xs text-slate-400 font-medium">
                                +{t.items.length - 3} autre(s)
                              </span>
                            )}
                          </div>
                        )}

                        {activeTab === "bilan" && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {t.items?.length || 0} bilan
                              {(t.items?.length || 0) > 1 ? "s" : ""}
                            </span>
                            {t.items?.slice(0, 3).map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                              >
                                {item.nom}
                              </span>
                            ))}
                            {(t.items?.length || 0) > 3 && (
                              <span className="text-xs text-slate-400 font-medium">
                                +{t.items.length - 3} autre(s)
                              </span>
                            )}
                          </div>
                        )}

                        {activeTab === "justif" && (
                          <p className="text-sm text-gray-600 max-w-xl truncate">
                            {t.texte || "Modèle de texte"}
                          </p>
                        )}
                      </td>

                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(activeTab, t)}
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <DialogPage
                            title="Supprimer"
                            triggerText="Supprimer"
                            description="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
                            onConfirm={() => handleDelete(activeTab, t.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ADD / EDIT TYPE MODAL                                    */}
      {/* ======================================================== */}
      <Dialog
        open={modal.open}
        onOpenChange={(open) => {
          setModal((m) => ({ ...m, open }));
          if (!open) setSaveError("");
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[95vh] flex flex-col p-6 rounded-2xl bg-white shadow-xl overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1 pt-2">
            <Tabs
              value={modal.section}
              onValueChange={(val) => {
                if (modal.mode === "add") {
                  setModal((m) => ({ ...m, section: val }));
                }
              }}
            >
              {modal.mode === "add" && (
                <TabsList className="grid grid-cols-3 mb-4 bg-gradient-to-r from-[var(--color-100)] to-[var(--color-50)] text-[var(--color-700)] rounded-xl p-1 shadow-xs">
                  <TabsTrigger
                    value="ord"
                    className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                  >
                    <Pill className="w-3.5 h-3.5 mr-1.5" />
                    Ordonnance
                  </TabsTrigger>
                  <TabsTrigger
                    value="bilan"
                    className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                  >
                    <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
                    Bilans
                  </TabsTrigger>
                  <TabsTrigger
                    value="justif"
                    className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    Justifs
                  </TabsTrigger>
                </TabsList>
              )}

              {/* ORD */}
              <TabsContent value="ord" className="space-y-3 mt-0">
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Card className="border-[var(--color-200)] shadow-xs rounded-xl">
                    <CardHeader className="py-1 bg-gradient-to-r from-[var(--color-50)] to-white rounded-t-xl">
                      <CardTitle className="text-sm font-bold text-[var(--color-700)] flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[var(--color-500)]" />
                        Rédiger un modèle d&apos;ordonnance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="type-label-ord"
                            className="text-xs font-semibold text-slate-700"
                          >
                            Nom du type d&apos;ordonnance{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="type-label-ord"
                            value={typeLabel}
                            onChange={(e) => setTypeLabel(e.target.value)}
                            placeholder="Ex: Antibiothérapie..."
                            className="rounded-xl border-slate-200 text-sm focus:ring-1 focus:ring-[var(--color-500)]"
                            autoComplete="off"
                          />
                        </div>

                        <div className="md:col-span-2 relative space-y-1.5">
                          <Label
                            htmlFor="med-search"
                            className="text-xs font-semibold text-slate-700"
                          >
                            Ajouter un médicament
                          </Label>
                          <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                              id="med-search"
                              value={medQuery}
                              onChange={(e) => {
                                setMedQuery(e.target.value);
                                setHiMed(0);
                              }}
                              onKeyDown={(e) => {
                                if (!filteredMeds.length) return;
                                if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  setHiMed((i) =>
                                    Math.min(i + 1, filteredMeds.length - 1)
                                  );
                                } else if (e.key === "ArrowUp") {
                                  e.preventDefault();
                                  setHiMed((i) => Math.max(i - 1, 0));
                                } else if (
                                  e.key === "Enter" &&
                                  filteredMeds[hiMed]
                                ) {
                                  e.preventDefault();
                                  pickMed(filteredMeds[hiMed]);
                                }
                              }}
                              placeholder="Tapez le nom du médicament..."
                              className="pl-9 pr-8 rounded-xl border-slate-200 text-sm focus:ring-1 focus:ring-[var(--color-500)]"
                              autoComplete="off"
                            />
                            {medQuery && (
                              <button
                                type="button"
                                onClick={() => setMedQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <AnimatePresence>
                            {medQuery && (
                              <motion.ul
                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className="absolute z-50 w-full mt-1 bg-white border border-[var(--color-200)] rounded-xl shadow-xl max-h-52 overflow-auto"
                              >
                                {filteredMeds.length > 0 ? (
                                  filteredMeds.map((m, idx) => {
                                    const alreadyAdded = selectedMeds.some(
                                      (sm) => sm.id === m.id
                                    );
                                    return (
                                      <li
                                        key={m.id}
                                        className={`px-3.5 py-2.5 flex justify-between items-center cursor-pointer text-xs transition-colors ${
                                          idx === hiMed
                                            ? "bg-[var(--color-100)] border-l-4 border-[var(--color-500)]"
                                            : "hover:bg-[var(--color-50)]"
                                        }`}
                                        onMouseEnter={() => setHiMed(idx)}
                                        onClick={() => pickMed(m)}
                                        ref={(el) => {
                                          if (idx === hiMed && el)
                                            el.scrollIntoView({
                                              block: "nearest",
                                            });
                                        }}
                                      >
                                        <span className="font-semibold text-slate-800">
                                          {m.nom}
                                        </span>
                                        {alreadyAdded ? (
                                          <span className="text-[11px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                                            déjà ajouté
                                          </span>
                                        ) : (
                                          <span className="text-[11px] text-[var(--color-600)] font-semibold bg-[var(--color-50)] px-2 py-0.5 rounded-md">
                                            + sélectionner
                                          </span>
                                        )}
                                      </li>
                                    );
                                  })
                                ) : (
                                  <li className="py-4 text-center text-xs text-slate-400 italic">
                                    Aucun médicament trouvé
                                  </li>
                                )}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Aperçu Médicaments */}
                <Card className="border-[var(--color-200)] h-96 flex flex-col shadow-xs rounded-xl overflow-hidden">
                  <CardHeader className="py-0 px-4 mb-0 bg-gradient-to-r from-[var(--color-50)] to-white border-b border-slate-100">
                    <CardTitle className="text-xs font-bold text-[var(--color-700)] flex items-center justify-between">
                      <span>Médicaments sélectionnés — Aperçu</span>
                      <span className="text-xs bg-[var(--color-100)] text-[var(--color-700)] px-2.5 py-0.5 rounded-full">
                        {selectedMeds.length} médicament
                        {selectedMeds.length > 1 ? "s" : ""}
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-hidden p-0 bg-slate-50/70">
                    {selectedMeds.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                        <Pill className="w-8 h-8 mb-2 opacity-30" />
                        <p className="font-medium">Aucun médicament ajouté</p>
                        <p className="text-[11px] mt-0.5">
                          Recherchez et sélectionnez un médicament ci-dessus
                        </p>
                      </div>
                    ) : (
                      <ul
                        ref={medsListRef}
                        className="space-y-2 h-full overflow-y-auto p-3 scroll-smooth"
                      >
                        <AnimatePresence>
                          {selectedMeds.map((m, index) => {
                            const strength =
                              m.tmpStrength === "custom"
                                ? m.tmpCustomStrength
                                : m.tmpStrength || m.dosage || "";
                            const dose =
                              m.tmpDose === "custom"
                                ? m.tmpCustomDose
                                : m.tmpDose || m.frequence || "";
                            const duration =
                              m.tmpDuration === "custom"
                                ? m.tmpCustomDuration
                                : m.tmpDuration || m.duree || "";
                            const qty = m.tmpQuantite || m.quantite || 1;

                            return (
                              <motion.li
                                key={m.id}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                layout
                                className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-3 py-2.5 shadow-xs hover:border-[var(--color-300)] transition-colors"
                              >
                                <div className="flex flex-col flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--color-500)] to-[var(--color-700)] flex items-center justify-center text-white font-bold text-[11px] shrink-0">
                                      {index + 1}
                                    </div>
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      {m.nom}
                                    </span>
                                    {strength ? (
                                      <span className="text-[11px] text-slate-500 font-medium">
                                        {strength}
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="text-[11px] text-slate-600 mt-1 ml-7 flex flex-wrap gap-1.5 items-center">
                                    {dose ? (
                                      <span className="bg-[var(--color-50)] text-[var(--color-700)] border border-[var(--color-200)] px-2 py-0.5 rounded-md font-medium">
                                        {dose}
                                      </span>
                                    ) : null}
                                    {duration ? (
                                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                                        pendant {duration}
                                      </span>
                                    ) : null}
                                    <span className="bg-[var(--color-100)] text-[var(--color-800)] px-2 py-0.5 rounded-md font-bold">
                                      × {qty} boîte{qty > 1 ? "s" : ""}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                                    title="Modifier la posologie"
                                    onClick={() => editSelectedMed(m)}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                                    title="Retirer"
                                    onClick={() =>
                                      setSelectedMeds(
                                        selectedMeds.filter(
                                          (x) => x.id !== m.id
                                        )
                                      )
                                    }
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </motion.li>
                            );
                          })}
                        </AnimatePresence>
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* BILANS */}
              <TabsContent value="bilan" className="space-y-3 mt-0">
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Card className="border-[var(--color-200)] shadow-xs rounded-xl">
                    <CardHeader className="py-3 bg-gradient-to-r from-[var(--color-50)] to-white rounded-t-xl">
                      <CardTitle className="text-sm font-bold text-[var(--color-700)] flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[var(--color-500)]" />
                        Rédiger un modèle de bilan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="type-label-bilan"
                            className="text-xs font-semibold text-slate-700"
                          >
                            Nom du type de bilan{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="type-label-bilan"
                            value={typeLabel}
                            onChange={(e) => setTypeLabel(e.target.value)}
                            placeholder="Ex: Bilan standard..."
                            className="rounded-xl border-slate-200 text-sm focus:ring-1 focus:ring-[var(--color-500)]"
                            autoComplete="off"
                          />
                        </div>

                        <div className="md:col-span-2 relative space-y-1.5">
                          <Label
                            htmlFor="bilan-search"
                            className="text-xs font-semibold text-slate-700"
                          >
                            Ajouter un examen / bilan
                          </Label>
                          <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                              id="bilan-search"
                              value={bilanQuery}
                              onChange={(e) => {
                                setBilanQuery(e.target.value);
                                setHiBilan(0);
                              }}
                              onKeyDown={(e) => {
                                if (!filteredBilans.length) return;
                                if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  setHiBilan((i) =>
                                    Math.min(i + 1, filteredBilans.length - 1)
                                  );
                                } else if (e.key === "ArrowUp") {
                                  e.preventDefault();
                                  setHiBilan((i) => Math.max(i - 1, 0));
                                } else if (
                                  e.key === "Enter" &&
                                  filteredBilans[hiBilan]
                                ) {
                                  e.preventDefault();
                                  pickBilan(filteredBilans[hiBilan]);
                                }
                              }}
                              placeholder="Tapez le nom de l'examen..."
                              className="pl-9 pr-8 rounded-xl border-slate-200 text-sm focus:ring-1 focus:ring-[var(--color-500)]"
                              autoComplete="off"
                            />
                            {bilanQuery && (
                              <button
                                type="button"
                                onClick={() => setBilanQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <AnimatePresence>
                            {bilanQuery && (
                              <motion.ul
                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className="absolute z-50 w-full mt-1 bg-white border border-[var(--color-200)] rounded-xl shadow-xl max-h-52 overflow-auto"
                              >
                                {filteredBilans.length > 0 ? (
                                  filteredBilans.map((b, idx) => {
                                    const alreadyAdded = selectedBilans.some(
                                      (sb) => sb.id === b.id
                                    );
                                    return (
                                      <li
                                        key={b.id}
                                        className={`px-3.5 py-2.5 flex justify-between items-center cursor-pointer text-xs transition-colors ${
                                          idx === hiBilan
                                            ? "bg-[var(--color-100)] border-l-4 border-[var(--color-500)]"
                                            : "hover:bg-[var(--color-50)]"
                                        }`}
                                        onMouseEnter={() => setHiBilan(idx)}
                                        onClick={() => pickBilan(b)}
                                        ref={(el) => {
                                          if (idx === hiBilan && el)
                                            el.scrollIntoView({
                                              block: "nearest",
                                            });
                                        }}
                                      >
                                        <span className="font-semibold text-slate-800">
                                          {b.nom}
                                        </span>
                                        {alreadyAdded ? (
                                          <span className="text-[11px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                                            déjà ajouté
                                          </span>
                                        ) : (
                                          <span className="text-[11px] text-[var(--color-600)] font-semibold bg-[var(--color-50)] px-2 py-0.5 rounded-md">
                                            + ajouter
                                          </span>
                                        )}
                                      </li>
                                    );
                                  })
                                ) : (
                                  <li className="py-4 text-center text-xs text-slate-400 italic">
                                    Aucun examen trouvé
                                  </li>
                                )}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Aperçu Bilans */}
                <Card className="border-[var(--color-200)] h-96 flex flex-col shadow-xs rounded-xl overflow-hidden">
                  <CardHeader className="py-2.5 px-4 bg-gradient-to-r from-[var(--color-50)] to-white border-b border-slate-100">
                    <CardTitle className="text-xs font-bold text-[var(--color-700)] flex items-center justify-between">
                      <span>Bilans sélectionnés — Aperçu</span>
                      <span className="text-xs bg-[var(--color-100)] text-[var(--color-700)] px-2.5 py-0.5 rounded-full">
                        {selectedBilans.length} bilan
                        {selectedBilans.length > 1 ? "s" : ""}
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-hidden p-0 bg-slate-50/70">
                    {selectedBilans.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                        <FlaskConical className="w-8 h-8 mb-2 opacity-30" />
                        <p className="font-medium">Aucun bilan sélectionné</p>
                        <p className="text-[11px] mt-0.5">
                          Recherchez et ajoutez des bilans ci-dessus
                        </p>
                      </div>
                    ) : (
                      <ul
                        ref={bilansListRef}
                        className="space-y-2 h-full overflow-y-auto p-3 scroll-smooth"
                      >
                        <AnimatePresence>
                          {selectedBilans.map((b, index) => (
                            <motion.li
                              key={b.id}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              layout
                              className="flex justify-between items-center bg-white hover:bg-[var(--color-50)] transition-colors px-3 py-2.5 rounded-xl shadow-xs border border-slate-100"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-[11px] shrink-0">
                                  {index + 1}
                                </div>
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {b.nom}
                                </span>
                              </div>

                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 shrink-0"
                                title="Retirer"
                                onClick={() =>
                                  setSelectedBilans(
                                    selectedBilans.filter((x) => x.id !== b.id)
                                  )
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* JUSTIFS */}
              <TabsContent value="justif" className="space-y-3 mt-0">
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Card className="border-[var(--color-200)] shadow-xs rounded-xl">
                    <CardHeader className="py-3 bg-gradient-to-r from-[var(--color-50)] to-white rounded-t-xl">
                      <CardTitle className="text-sm font-bold text-[var(--color-700)] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--color-500)]" />
                        Modèle de justification médicale
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">
                          Nom du type de justification{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={typeLabel}
                          onChange={(e) => setTypeLabel(e.target.value)}
                          placeholder="Ex: Arrêt 7 jours, Dispense EPS..."
                          className="rounded-xl border-slate-200 text-sm focus:ring-1 focus:ring-[var(--color-500)]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">
                          Texte prédéfini de la justification
                        </Label>
                        <Textarea
                          rows={7}
                          value={newJustif.texte}
                          onChange={(e) =>
                            setNewJustif((j) => ({
                              ...j,
                              texte: e.target.value,
                            }))
                          }
                          placeholder="Texte de la justification..."
                          className="min-h-[160px] rounded-xl border-slate-200 text-sm focus:ring-1 focus:ring-[var(--color-500)]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {saveError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <DialogFooter className="pt-3 mt-2 border-t border-slate-100 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => {
                setSaveError("");
                setModal({
                  open: false,
                  section: activeTab,
                  mode: "add",
                  type: null,
                });
              }}
              className="rounded-xl text-xs border-slate-200"
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={saving || !typeLabel.trim()}
              className="rounded-xl text-xs bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white shadow font-semibold inline-flex items-center gap-1.5"
              onClick={handleSave}
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {modal.mode === "add" ? "Ajout..." : "Mise à jour..."}
                </>
              ) : modal.mode === "add" ? (
                "Ajouter"
              ) : (
                "Mettre à jour"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MEDICATION DOSAGE CONFIGURATION DIALOG                   */}
      {/* ======================================================== */}
      <Dialog
        open={openMedDialog}
        onOpenChange={(open) => {
          setOpenMedDialog(open);
          if (!open) setIsEditingMed(false);
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl p-6 bg-white shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-[var(--color-100)] text-[var(--color-700)]">
                <Pill className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-800">
                {selectedMed?.nom}{" "}
                {selectedMed?.form ? `(${selectedMed.form})` : ""}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Choisissez la concentration, la posologie, la durée et la
              quantité.
            </DialogDescription>
          </DialogHeader>

          {selectedMed && (
            <div className="space-y-3.5 pt-2">
              {/* Dosage */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Dosage
                </Label>
                <select
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:ring-1 focus:ring-[var(--color-500)] outline-none"
                  value={selectedMed.tmpStrength || ""}
                  onChange={(e) =>
                    setSelectedMed({
                      ...selectedMed,
                      tmpStrength: e.target.value,
                    })
                  }
                >
                  <option value="">-- Sélectionner --</option>
                  {selectedMed?.strengths?.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                  <option value="250 mg">250 mg</option>
                  <option value="500 mg">500 mg</option>
                  <option value="1 g">1 g</option>
                  <option value="custom">Autre...</option>
                </select>

                {selectedMed.tmpStrength === "custom" && (
                  <Input
                    type="text"
                    className="mt-1.5 rounded-xl border-slate-200 text-sm"
                    placeholder="Entrer un dosage personnalisé..."
                    value={selectedMed.tmpCustomStrength || ""}
                    onChange={(e) =>
                      setSelectedMed({
                        ...selectedMed,
                        tmpCustomStrength: e.target.value,
                      })
                    }
                  />
                )}
              </div>

              {/* Posologie */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Posologie (rythme de prise)
                </Label>
                <select
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:ring-1 focus:ring-[var(--color-500)] outline-none"
                  value={selectedMed.tmpDose || ""}
                  onChange={(e) =>
                    setSelectedMed({
                      ...selectedMed,
                      tmpDose: e.target.value,
                    })
                  }
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="1 fois / jour">1 fois / jour</option>
                  <option value="2 fois / jour">2 fois / jour</option>
                  <option value="3 fois / jour">3 fois / jour</option>
                  <option value="Toutes les 8 heures">Toutes les 8 heures</option>
                  <option value="Toutes les 12 heures">Toutes les 12 heures</option>
                  <option value="Avant repas">Avant repas</option>
                  <option value="Après repas">Après repas</option>
                  <option value="Selon besoin">Selon besoin</option>
                  <option value="custom">Autre...</option>
                </select>

                {selectedMed.tmpDose === "custom" && (
                  <Input
                    type="text"
                    className="mt-1.5 rounded-xl border-slate-200 text-sm"
                    placeholder="Entrer une posologie personnalisée..."
                    value={selectedMed.tmpCustomDose || ""}
                    onChange={(e) =>
                      setSelectedMed({
                        ...selectedMed,
                        tmpCustomDose: e.target.value,
                      })
                    }
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Durée */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Durée
                  </Label>
                  <select
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:ring-1 focus:ring-[var(--color-500)] outline-none"
                    value={selectedMed.tmpDuration || ""}
                    onChange={(e) =>
                      setSelectedMed({
                        ...selectedMed,
                        tmpDuration: e.target.value,
                      })
                    }
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="3 jours">3 jours</option>
                    <option value="5 jours">5 jours</option>
                    <option value="7 jours">7 jours</option>
                    <option value="10 jours">10 jours</option>
                    <option value="14 jours">14 jours</option>
                    <option value="1 mois">1 mois</option>
                    <option value="custom">Autre...</option>
                  </select>

                  {selectedMed.tmpDuration === "custom" && (
                    <Input
                      type="text"
                      className="mt-1.5 rounded-xl border-slate-200 text-sm"
                      placeholder="Durée personnalisée..."
                      value={selectedMed.tmpCustomDuration || ""}
                      onChange={(e) =>
                        setSelectedMed({
                          ...selectedMed,
                          tmpCustomDuration: e.target.value,
                        })
                      }
                    />
                  )}
                </div>

                {/* Quantité */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Quantité (boîtes)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={selectedMed.tmpQuantite || 1}
                    onChange={(e) =>
                      setSelectedMed({
                        ...selectedMed,
                        tmpQuantite: e.target.value,
                      })
                    }
                    className="h-10 rounded-xl border-slate-200 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpenMedDialog(false);
                setIsEditingMed(false);
              }}
              className="rounded-xl text-xs border-slate-200"
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="rounded-xl text-xs bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white shadow font-semibold"
              onClick={addMedication}
            >
              {isEditingMed ? (
                "Enregistrer"
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Ajouter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Alerts */}
      <Dialog open={Dejaexist} onOpenChange={setDejaExistDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">
              Médicament déjà existant
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ce médicament est déjà présent dans votre sélection. Vous ne
              pouvez pas l’ajouter deux fois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setDejaExistDialog(false)}
              className="rounded-xl text-xs bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={DejaexistB} onOpenChange={setDejaExistDialogB}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">
              Bilan déjà existant
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ce bilan est déjà présent dans votre sélection. Vous ne pouvez pas
              l’ajouter deux fois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setDejaExistDialogB(false)}
              className="rounded-xl text-xs bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}