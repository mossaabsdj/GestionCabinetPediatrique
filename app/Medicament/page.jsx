"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Pill,
  Download,
  Upload,
  Calendar,
  RefreshCw,
  FileSpreadsheet,
  FileJson,
  ChevronDown,
  X,
  CheckCircle2,
  Clock,
} from "lucide-react";
import AddMedicamentModal from "@/app/component/NewMedicament/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DialogPage from "@/app/component/DialogPage/page";
import AlertModal from "@/app/component/success/page";

import {
  exportToJSON,
  exportToExcel,
  importFromJSON,
  importFromExcel,
} from "@/lib/import-export";

function formatDate(d) {
  if (!d) return "—";
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function MedicamentsPage() {
  const [medicaments, setMedicaments] = useState([]);
  const [query, setQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [newMedicament, setNewMedicament] = useState({ nom: "" });
  const [loading, setLoading] = useState(true);

  // === Centered Alert Modal State ===
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "success",
    title: "",
    description: "",
  });

  const showAlert = (type, title, description, autoClose = true) => {
    setAlertConfig({
      type,
      title,
      description,
      autoClose,
      autoCloseDelay: type === "error" ? 4000 : 2500,
    });
    setAlertOpen(true);
  };

  // Load medicaments from API
  async function fetchMedicaments() {
    setLoading(true);
    try {
      const res = await fetch("/api/medicaments");
      const data = await res.json();
      if (Array.isArray(data)) setMedicaments(data);
    } catch {
      showAlert("error", "Erreur", "Impossible de charger les médicaments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMedicaments();
  }, []);

  // Filter search
  const filteredMedicaments = useMemo(() => {
    return medicaments.filter((m) =>
      (m.nom || "").toLowerCase().includes(query.toLowerCase())
    );
  }, [medicaments, query]);

  const totalCount = medicaments.length;

  const recentCount = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return medicaments.filter((m) => {
      if (!m.createdAt) return false;
      const t = new Date(m.createdAt).getTime();
      return !isNaN(t) && t >= thirtyDaysAgo;
    }).length;
  }, [medicaments]);

  // Add Medicament (calls API)
  async function handleAddMedicament(nom) {
    if (!nom || !nom.trim()) {
      showAlert(
        "warning",
        "Champ requis",
        "Le nom du médicament est obligatoire."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/medicaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nom.trim()),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l’ajout du médicament.");
      }

      setMedicaments((prev) => [data, ...prev]);
      setNewMedicament({ nom: "" });
      setIsAddOpen(false);
      showAlert(
        "success",
        "Succès !",
        `Le médicament "${data.nom}" a été ajouté.`
      );
    } catch (err) {
      console.error(err);
      showAlert(
        "error",
        "Erreur d'ajout",
        err.message || "Impossible d’ajouter le médicament."
      );
    } finally {
      setLoading(false);
    }
  }

  // Delete Medicament
  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/medicaments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de la suppression.");
      }
      setMedicaments((prev) => prev.filter((m) => m.id !== id));
      showAlert(
        "success",
        "Supprimé !",
        "Le médicament a été supprimé avec succès."
      );
    } catch (err) {
      console.error("Erreur suppression:", err);
      showAlert(
        "error",
        "Erreur",
        err.message || "Erreur lors de la suppression."
      );
    }
  }

  // Export Medicaments
  const handleExportJSON = () => {
    setExportMenuOpen(false);
    if (medicaments.length === 0) {
      showAlert("warning", "Attention", "Aucun médicament à exporter.");
      return;
    }
    const cleanData = medicaments.map((m) => ({
      nom: m.nom,
      createdAt: m.createdAt,
    }));
    exportToJSON(
      cleanData,
      `medicaments_${new Date().toISOString().slice(0, 10)}.json`
    );
    showAlert(
      "success",
      "Exportation réussie",
      "Le fichier JSON a été téléchargé."
    );
  };

  const handleExportExcel = () => {
    setExportMenuOpen(false);
    if (medicaments.length === 0) {
      showAlert("warning", "Attention", "Aucun médicament à exporter.");
      return;
    }
    const cleanData = medicaments.map((m) => ({
      Nom: m.nom,
      "Date d'ajout": m.createdAt
        ? new Date(m.createdAt).toLocaleDateString("fr-FR")
        : "",
    }));
    exportToExcel(
      cleanData,
      `medicaments_${new Date().toISOString().slice(0, 10)}.xlsx`,
      "Médicaments"
    );
    showAlert(
      "success",
      "Exportation réussie",
      "Le fichier Excel (.xlsx) a été téléchargé."
    );
  };

  // Import Medicaments (JSON, Excel, CSV)
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      let importedData = [];

      if (file.name.endsWith(".json")) {
        importedData = await importFromJSON(file);
      } else if (
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls") ||
        file.name.endsWith(".csv")
      ) {
        importedData = await importFromExcel(file);
      } else {
        showAlert(
          "error",
          "Format non supporté",
          "Veuillez choisir un fichier .json, .xlsx, .xls ou .csv."
        );
        return;
      }

      if (importedData.length === 0) {
        showAlert(
          "warning",
          "Fichier vide",
          "Aucun médicament trouvé dans le fichier."
        );
        return;
      }

      const res = await fetch("/api/medicaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: importedData }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Erreur lors de l'importation.");
      }

      if (Array.isArray(result.medicaments)) {
        setMedicaments(result.medicaments);
      } else {
        await fetchMedicaments();
      }

      showAlert(
        "success",
        "Importation terminée !",
        `${result.addedCount ?? importedData.length} nouveau(x) médicament(s) importé(s) avec succès${
          result.skippedCount
            ? ` (${result.skippedCount} doublon(s) ignoré(s))`
            : ""
        }.`
      );
    } catch (err) {
      console.error(err);
      showAlert(
        "error",
        "Échec de l'importation",
        err.message || "Erreur lors de l'importation."
      );
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-[var(--color-50)] via-white to-slate-50 p-4 md:p-8">
      {/* Centered Nice Alert Modal */}
      <AlertModal
        config={alertConfig}
        dialogOpen={alertOpen}
        setDialogOpen={setAlertOpen}
      />

      <AddMedicamentModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddMedicament}
        value={newMedicament}
        setValue={setNewMedicament}
        loading={loading}
      />

      <div className="max-w-7xl w-full mx-auto flex flex-col flex-1 min-h-0 gap-4">
        {/* ======================================================== */}
        {/* HEADER (avec recherche, import/export et bouton d'ajout) */}
        {/* ======================================================== */}
        <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--color-600)] text-white shadow-md">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                Gestion des Médicaments
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium">
                Catalogue des médicaments du cabinet, importation et exportation
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Rechercher un médicament..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 pr-8 h-9 rounded-xl border-slate-200 bg-white text-xs focus:ring-1 focus:ring-[var(--color-500)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => setExportMenuOpen((v) => !v)}
                className={`h-9 rounded-xl text-xs font-semibold flex items-center gap-2 border-slate-200 ${
                  exportMenuOpen
                    ? "bg-[var(--color-50)] text-[var(--color-700)] border-[var(--color-300)]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    exportMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {exportMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setExportMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 z-30 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5">
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Export Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportJSON}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <FileJson className="w-4 h-4 text-blue-600" />
                      <span>Export JSON (.json)</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Import Button */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document.getElementById("import-medicaments").click()
                }
                className="h-9 rounded-xl text-xs font-semibold flex items-center gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Upload className="w-3.5 h-3.5 text-[var(--color-600)]" />
                <span>Importer</span>
              </Button>
              <Input
                id="import-medicaments"
                type="file"
                accept=".json,.xlsx,.xls,.csv"
                onChange={handleImport}
                className="hidden"
              />
            </div>

            {/* Add Button */}
            <Button
              onClick={() => setIsAddOpen(true)}
              className="h-9 rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white shadow-sm flex items-center gap-2 text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Nouveau médicament
            </Button>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={fetchMedicaments}
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
          {/* Total Médicaments */}
          <Card className="rounded-xl border-slate-200/90 shadow-xs bg-white overflow-hidden px-3.5 py-2.5 flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
              <Pill className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 leading-none">
                Total des Médicaments
              </p>
              <div className="mt-1 text-lg font-extrabold text-slate-800 leading-tight">
                {loading ? (
                  <div className="h-5 w-20 bg-slate-100 animate-pulse rounded" />
                ) : (
                  `${totalCount} médicament${totalCount > 1 ? "s" : ""}`
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Référentiel enregistré
              </p>
            </div>
          </Card>

          {/* Résultats Filtrés */}
          <Card className="rounded-xl border-slate-200/90 shadow-xs bg-white overflow-hidden px-3.5 py-2.5 flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 leading-none">
                Affichés
              </p>
              <div className="mt-1 text-lg font-extrabold text-emerald-700 leading-tight">
                {loading ? (
                  <div className="h-5 w-16 bg-slate-100 animate-pulse rounded" />
                ) : (
                  `${filteredMedicaments.length} résultat${
                    filteredMedicaments.length > 1 ? "s" : ""
                  }`
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {query.trim() ? `Filtre : "${query}"` : "Liste complète"}
              </p>
            </div>
          </Card>

          {/* Ajouts Récents */}
          <Card className="rounded-xl border-slate-200/90 shadow-xs bg-white overflow-hidden px-3.5 py-2.5 flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 leading-none">
                Ajouts Récents (30j)
              </p>
              <div className="mt-1 text-lg font-extrabold text-slate-800 leading-tight">
                {loading ? (
                  <div className="h-5 w-16 bg-slate-100 animate-pulse rounded" />
                ) : (
                  `${recentCount} médicament${recentCount > 1 ? "s" : ""}`
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Ajoutés ce dernier mois
              </p>
            </div>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* MEDICAMENTS TABLE                                        */}
        {/* ======================================================== */}
        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl shadow-lg overflow-hidden border border-[var(--color-100)]">
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[var(--color-600)] text-white">
                  <th className="bg-[var(--color-600)] text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                    Nom du médicament
                  </th>
                  <th className="bg-[var(--color-600)] text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider w-[220px]">
                    Date d&apos;ajout
                  </th>
                  <th className="bg-[var(--color-600)] text-right px-6 py-4 font-semibold text-sm uppercase tracking-wider w-[140px]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`med-skel-${i}`} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 w-56 bg-[var(--color-200)]/60 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-28 bg-[var(--color-200)]/60 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 bg-[var(--color-200)]/60 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredMedicaments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Pill className="w-10 h-10 text-gray-300" />
                        <p className="text-sm font-semibold text-gray-700">
                          Aucun médicament trouvé
                        </p>
                        <p className="text-xs text-gray-500 max-w-xs">
                          {query.trim()
                            ? "Aucun résultat ne correspond à votre recherche."
                            : "Aucun médicament n'a encore été enregistré dans le catalogue."}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setIsAddOpen(true)}
                          className="mt-2 text-xs rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Ajouter un médicament
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMedicaments.map((m, index) => (
                    <tr
                      key={m.id}
                      className={`transition-colors hover:bg-[var(--color-50)] ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-800">
                          <Pill className="w-4 h-4 text-[var(--color-500)] shrink-0" />
                          <span>{m.nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                          <Calendar
                            size={16}
                            className="text-[var(--color-500)] shrink-0"
                          />
                          {formatDate(m.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <DialogPage
                            title="Supprimer le médicament"
                            triggerText="Supprimer"
                            description={`Êtes-vous sûr de vouloir supprimer "${m.nom}" ? Cette action est irréversible.`}
                            onConfirm={() => handleDelete(m.id)}
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
    </div>
  );
}