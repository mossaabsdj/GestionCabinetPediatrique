"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Stethoscope,
  Plus,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Coins,
  AlertCircle,
  CheckCircle,
  Users,
  Wallet,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
  Filter,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import AjouteModal from "@/app/component/NewPatient/page";
import DialogPage from "@/app/component/DialogPage/page";
import AlertModal from "@/app/component/success/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PatientModal from "../component/ViewPatient/page";

// Utility function to format all dates in French (dd/mm/yyyy)
function formatDateFR(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewpatient, setviewpatient] = useState(false);
  const [patientModalTab, setPatientModalTab] = useState("info");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateDeNaissance, setdateDeNaissance] = useState("");
  const [filterDays, setFilterDays] = useState("none");
  const [filterCredit, setFilterCredit] = useState("all"); // "all" | "credit_only" | "paid_only"
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedPatient, setselectedPatient] = useState();
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Centered Alert Modal State
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

  // Fetch patients from API
  async function fetchPatients() {
    try {
      setLoading(true);
      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Erreur lors du chargement des patients");
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showAlert("error", "Erreur", "Impossible de charger la liste des patients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPatients();
  }, []);

  // Aggregated Financial Stats across all patients
  const financialStats = useMemo(() => {
    let totalDebt = 0;
    let debtorsCount = 0;
    let totalPaid = 0;

    (patients || []).forEach((p) => {
      const cred = Number(p.totalCredit) || 0;
      const paid = Number(p.totalPaye) || 0;
      if (cred > 0) {
        totalDebt += cred;
        debtorsCount++;
      }
      totalPaid += paid;
    });

    return {
      totalPatients: patients.length,
      debtorsCount,
      totalDebt,
      totalPaid,
    };
  }, [patients]);

  // Check if any filter is currently applied
  const hasActiveFilters = Boolean(
    query.trim() ||
      dateFrom ||
      dateTo ||
      dateDeNaissance ||
      filterDays !== "none" ||
      filterCredit !== "all"
  );

  const activeFilterCount = [
    Boolean(dateDeNaissance),
    Boolean(dateFrom || dateTo),
    filterDays !== "none",
    filterCredit !== "all",
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setdateDeNaissance("");
    setFilterDays("none");
    setFilterCredit("all");
    setCurrentPage(1);
  };

  // Reset page to 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query, dateFrom, dateTo, dateDeNaissance, filterDays, filterCredit, pageSize]);

  // Filter + Sort logic
  const filteredPatients = useMemo(() => {
    const list = Array.isArray(patients) ? patients : [];

    const filtered = list.filter((p) => {
      // 1. Text search on Name or Phone
      const q = query.trim().toLowerCase();
      if (q) {
        const nom = (p.nom || "").toLowerCase();
        const tel = (p.telephone || "").toLowerCase();
        if (!nom.includes(q) && !tel.includes(q)) {
          return false;
        }
      }

      // 2. Date Created From
      if (dateFrom) {
        const [y, m, d] = dateFrom.split("-").map(Number);
        const fromStart = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
        const createdTime = p.createdAt ? new Date(p.createdAt).getTime() : NaN;
        if (isNaN(createdTime) || createdTime < fromStart) {
          return false;
        }
      }

      // 3. Date Created To
      if (dateTo) {
        const [y, m, d] = dateTo.split("-").map(Number);
        const toEnd = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
        const createdTime = p.createdAt ? new Date(p.createdAt).getTime() : NaN;
        if (isNaN(createdTime) || createdTime > toEnd) {
          return false;
        }
      }

      // 4. Date de Naissance
      if (dateDeNaissance) {
        if (!p.dateDeNaissance) return false;
        const pDate = new Date(p.dateDeNaissance);
        if (isNaN(pDate.getTime())) return false;

        const py = pDate.getFullYear();
        const pm = String(pDate.getMonth() + 1).padStart(2, "0");
        const pd = String(pDate.getDate()).padStart(2, "0");
        const localBirthStr = `${py}-${pm}-${pd}`;
        const utcBirthStr = pDate.toISOString().split("T")[0];

        if (localBirthStr !== dateDeNaissance && utcBirthStr !== dateDeNaissance) {
          return false;
        }
      }

      // 5. Filter Days (New / Old 30 days)
      if (filterDays === "new-30") {
        const createdTime = p.createdAt ? new Date(p.createdAt).getTime() : NaN;
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (isNaN(createdTime) || createdTime < thirtyDaysAgo) {
          return false;
        }
      }

      if (filterDays === "old-30") {
        const createdTime = p.createdAt ? new Date(p.createdAt).getTime() : NaN;
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (isNaN(createdTime) || createdTime >= thirtyDaysAgo) {
          return false;
        }
      }

      // 6. Filter Credit (Outstanding credit balance)
      const cred = Number(p.totalCredit) || 0;
      if (filterCredit === "credit_only" && cred <= 0) {
        return false;
      }
      if (filterCredit === "paid_only" && cred > 0) {
        return false;
      }

      return true;
    });

    // 7. Sorting
    const sorted = [...filtered];
    if (sortBy === "nom") {
      sorted.sort((a, b) => {
        const nameA = (a.nom || "").toLowerCase();
        const nameB = (b.nom || "").toLowerCase();
        return sortOrder === "asc"
          ? nameA.localeCompare(nameB, "fr")
          : nameB.localeCompare(nameA, "fr");
      });
    } else if (sortBy === "age" || sortBy === "dateDeNaissance") {
      sorted.sort((a, b) => {
        const timeA = a.dateDeNaissance ? new Date(a.dateDeNaissance).getTime() : 0;
        const timeB = b.dateDeNaissance ? new Date(b.dateDeNaissance).getTime() : 0;
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      });
    } else if (sortBy === "credit" || sortBy === "totalCredit") {
      sorted.sort((a, b) => {
        const credA = Number(a.totalCredit) || 0;
        const credB = Number(b.totalCredit) || 0;
        return sortOrder === "asc" ? credA - credB : credB - credA;
      });
    } else if (sortBy === "date" || sortBy === "createdAt") {
      sorted.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      });
    }

    return sorted;
  }, [
    patients,
    query,
    dateFrom,
    dateTo,
    dateDeNaissance,
    filterDays,
    filterCredit,
    sortBy,
    sortOrder,
  ]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const paginatedPatients = useMemo(() => {
    if (pageSize <= 0) return filteredPatients;
    const start = (currentPage - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, currentPage, pageSize]);

  function toggleSort(field) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }

  const sortIcon = (field) =>
    sortBy === field ? (
      sortOrder === "asc" ? (
        <ArrowUp className="w-3.5 h-3.5 inline" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 inline" />
      )
    ) : null;

  // Add new patient API
  async function handleAddPatient(data) {
    if (!data.nom || !data.nom.trim()) {
      return { success: false, error: "Le nom du patient est obligatoire." };
    }

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson.error || "Erreur lors de la création du patient.";
        throw new Error(errMsg);
      }

      const created = await res.json();
      setPatients((prev) => [
        { ...created, totalCredit: 0, totalFacture: 0, totalPaye: 0, hasCredit: false },
        ...prev,
      ]);
      setIsAddOpen(false);
      return { success: true, data: created };
    } catch (err) {
      console.error("❌ handleAddPatient error:", err);
      return {
        success: false,
        error: err.message || "Erreur lors de la création du patient.",
      };
    }
  }

  // Delete patient API
  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/patients?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Erreur lors de la suppression");
      }
      setPatients((prev) => prev.filter((p) => p.id !== id));
      showAlert("success", "Supprimé !", "Le patient a été supprimé avec succès.");
    } catch (err) {
      console.error(err);
      showAlert("error", "Erreur", err.message || "Erreur lors de la suppression du patient.");
    }
  }

  const onclose = async () => {
    setviewpatient(false);
    await fetchPatients();
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-[var(--color-50)] via-white to-slate-50 p-4 md:p-8">
      <AlertModal
        config={alertConfig}
        dialogOpen={alertOpen}
        setDialogOpen={setAlertOpen}
      />
      <AjouteModal
        onAdd={handleAddPatient}
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
      {viewpatient && (
        <PatientModal
          onClose={onclose}
          open={viewpatient}
          patient={selectedPatient}
          initialTab={patientModalTab}
        />
      )}

      <div className="max-w-7xl w-full mx-auto flex flex-col flex-1 min-h-0 gap-4">
        {/* ======================================================== */}
        {/* HEADER (avec recherche, filtres et bouton d'ajout)       */}
        {/* ======================================================== */}
        <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--color-600)] text-white shadow-md">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                Gestion des Dossiers Patients
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium">
                Fiches médicales, historique des consultations, vaccins et règlements
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Nom ou téléphone..."
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

            {/* Quick Credit Filter Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setFilterCredit(filterCredit === "credit_only" ? "all" : "credit_only")
              }
              className={`h-9 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                filterCredit === "credit_only"
                  ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
                  : "border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Impayés</span>
              {financialStats.debtorsCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                    filterCredit === "credit_only"
                      ? "bg-white text-rose-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {financialStats.debtorsCount}
                </span>
              )}
            </Button>

            {/* Filters Popover (style DepensesPage) */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFilterMenuOpen((v) => !v)}
                className={`h-9 rounded-xl text-xs font-semibold flex items-center gap-2 border-slate-200 ${
                  filterMenuOpen || activeFilterCount > 0
                    ? "bg-[var(--color-50)] text-[var(--color-700)] border-[var(--color-300)]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filtres</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-[var(--color-600)] text-white">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    filterMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {filterMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setFilterMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 z-30 bg-white rounded-xl border border-slate-200 shadow-lg p-3 space-y-3 text-xs">
                    {/* Statut de paiement */}
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-700">Statut financier</p>
                      {[
                        { id: "all", label: "Tous les patients" },
                        { id: "credit_only", label: "Avec solde impayé" },
                        { id: "paid_only", label: "Dossiers soldés" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFilterCredit(opt.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                            filterCredit === opt.id
                              ? "bg-[var(--color-50)] text-[var(--color-700)] font-bold"
                              : "text-slate-600 hover:bg-slate-50 font-medium"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {filterCredit === opt.id && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>

                    {/* Ancienneté */}
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <p className="font-semibold text-slate-700">Ancienneté</p>
                      {[
                        { id: "none", label: "Toutes les dates" },
                        { id: "new-30", label: "Nouveaux (-30 jours)" },
                        { id: "old-30", label: "Anciens (+30 jours)" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFilterDays(opt.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                            filterDays === opt.id
                              ? "bg-[var(--color-50)] text-[var(--color-700)] font-bold"
                              : "text-slate-600 hover:bg-slate-50 font-medium"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {filterDays === opt.id && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>

                    {/* Date de naissance */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <label className="block font-semibold text-slate-700">
                        Date de naissance
                      </label>
                      <Input
                        type="date"
                        value={dateDeNaissance}
                        onChange={(e) => setdateDeNaissance(e.target.value)}
                        className="w-full text-xs h-8 rounded-lg border-slate-200"
                      />
                    </div>

                    {/* Date de création */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <p className="font-semibold text-slate-700">Date d&apos;inscription</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Du</span>
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-44 text-xs h-8 rounded-lg border-slate-200"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Au</span>
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-44 text-xs h-8 rounded-lg border-slate-200"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      {hasActiveFilters && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="flex-1 h-8 rounded-lg text-xs border-slate-200 text-slate-600 hover:text-red-600"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Effacer
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setFilterMenuOpen(false)}
                        className="flex-1 h-8 rounded-lg text-xs bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white"
                      >
                        Appliquer
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetFilters}
                className="h-9 w-9 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50"
                title="Réinitialiser les filtres"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}

            <Button
              onClick={() => setIsAddOpen(true)}
              className="h-9 rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white shadow-sm flex items-center gap-2 text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Nouveau patient
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={fetchPatients}
              disabled={loading}
              className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SUMMARY CARDS (identique à DepensesPage)                 */}
        {/* ======================================================== */}
        <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Total Patients */}
          <Card className="rounded-xl border-slate-200/90 shadow-xs bg-white overflow-hidden px-3.5 py-2.5 flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 leading-none">
                Total Patients
              </p>
              <div className="mt-1 text-lg font-extrabold text-slate-800 leading-tight">
                {loading ? (
                  <div className="h-5 w-20 bg-slate-100 animate-pulse rounded" />
                ) : (
                  <>
                    {financialStats.totalPatients} patient
                    {financialStats.totalPatients > 1 ? "s" : ""}
                    {hasActiveFilters && (
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        ({filteredPatients.length} affiché{filteredPatients.length > 1 ? "s" : ""})
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Dossiers médicaux enregistrés
              </p>
            </div>
          </Card>

          {/* Patients Débiteurs (cliquable pour filtrer) */}
          <Card
            onClick={() =>
              setFilterCredit((prev) =>
                prev === "credit_only" ? "all" : "credit_only"
              )
            }
            className={`rounded-xl shadow-xs bg-white overflow-hidden px-3.5 py-2.5 flex-row items-center gap-3 cursor-pointer transition-all ${
              filterCredit === "credit_only"
                ? "border-rose-400 ring-1 ring-rose-300 bg-rose-50/30"
                : "border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                financialStats.debtorsCount > 0
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 leading-none">
                Patients Débiteurs
              </p>
              <div
                className={`mt-1 text-lg font-extrabold leading-tight ${
                  financialStats.debtorsCount > 0
                    ? "text-rose-700"
                    : "text-emerald-700"
                }`}
              >
                {loading ? (
                  <div className="h-5 w-16 bg-slate-100 animate-pulse rounded" />
                ) : (
                  `${financialStats.debtorsCount} dossier${
                    financialStats.debtorsCount > 1 ? "s" : ""
                  }`
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {filterCredit === "credit_only"
                  ? "Filtre actif · Cliquer pour tout afficher"
                  : "Cliquer pour filtrer les impayés"}
              </p>
            </div>
          </Card>

          {/* Total Crédits Restants */}
          <Card className="rounded-xl border-slate-200/90 shadow-xs bg-white overflow-hidden px-3.5 py-2.5 flex-row items-center gap-3">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                financialStats.totalDebt > 0
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              <Wallet className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-[11px] font-semibold uppercase tracking-wider leading-none ${
                  financialStats.totalDebt > 0
                    ? "text-rose-700"
                    : "text-emerald-700"
                }`}
              >
                Total Crédits Restants
              </p>
              <div
                className={`mt-1 text-lg font-extrabold leading-tight ${
                  financialStats.totalDebt > 0
                    ? "text-rose-700"
                    : "text-emerald-700"
                }`}
              >
                {loading ? (
                  <div className="h-5 w-24 bg-slate-100 animate-pulse rounded" />
                ) : (
                  `${financialStats.totalDebt.toLocaleString("fr-FR")} DA`
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {financialStats.totalDebt > 0
                  ? "Solde global restant à encaisser"
                  : "Tous les paiements sont à jour"}
              </p>
            </div>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* PATIENTS TABLE (style tableau des dépenses)              */}
        {/* ======================================================== */}
        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl shadow-lg overflow-hidden border border-[var(--color-100)]">
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[var(--color-600)] text-white">
                  <th
                    onClick={() => toggleSort("nom")}
                    className="bg-[var(--color-600)] text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider cursor-pointer select-none hover:bg-[var(--color-700)] transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Nom du Patient {sortIcon("nom")}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("age")}
                    className="bg-[var(--color-600)] text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider cursor-pointer select-none hover:bg-[var(--color-700)] transition-colors w-[180px]"
                  >
                    <div className="flex items-center gap-1.5">
                      Naissance {sortIcon("age")}
                    </div>
                  </th>
                  <th className="bg-[var(--color-600)] text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider w-[160px]">
                    Téléphone
                  </th>
                  <th className="bg-[var(--color-600)] text-center px-4 py-4 font-semibold text-sm uppercase tracking-wider w-[110px]">
                    Groupe
                  </th>
                  <th
                    onClick={() => toggleSort("credit")}
                    className="bg-[var(--color-600)] text-right px-6 py-4 font-semibold text-sm uppercase tracking-wider cursor-pointer select-none hover:bg-[var(--color-700)] transition-colors w-[190px]"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Solde / Crédit {sortIcon("credit")}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("date")}
                    className="bg-[var(--color-600)] text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider cursor-pointer select-none hover:bg-[var(--color-700)] transition-colors w-[160px]"
                  >
                    <div className="flex items-center gap-1.5">
                      Créé le {sortIcon("date")}
                    </div>
                  </th>
                  <th className="bg-[var(--color-600)] text-right px-6 py-4 font-semibold text-sm uppercase tracking-wider w-[150px]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`pat-skel-${i}`} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 w-40 bg-[var(--color-200)]/60 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 bg-[var(--color-200)]/60 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-28 bg-[var(--color-200)]/60 rounded" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-5 w-10 bg-[var(--color-200)]/60 rounded-full mx-auto" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-24 bg-[var(--color-200)]/60 rounded-full ml-auto" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 bg-[var(--color-200)]/60 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-20 bg-[var(--color-200)]/60 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-10 h-10 text-gray-300" />
                        <p className="text-sm font-semibold text-gray-700">
                          Aucun patient trouvé
                        </p>
                        <p className="text-xs text-gray-500 max-w-xs">
                          {hasActiveFilters
                            ? "Aucun dossier patient ne correspond aux critères de recherche."
                            : "Aucun patient n'a encore été enregistré."}
                        </p>
                        {!hasActiveFilters && (
                          <Button
                            size="sm"
                            onClick={() => setIsAddOpen(true)}
                            className="mt-2 text-xs rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Ajouter un patient
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPatients.map((p, index) => {
                    const cred = Number(p.totalCredit) || 0;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => {
                          setselectedPatient(p);
                          setPatientModalTab("info");
                          setviewpatient(true);
                        }}
                        title="Ouvrir la fiche patient"
                        className={`cursor-pointer transition-colors hover:bg-[var(--color-50)] ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        {/* Name */}
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                          {p.nom}
                        </td>

                        {/* Birth date */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                            <Calendar
                              size={15}
                              className="text-[var(--color-500)] shrink-0"
                            />
                            {formatDateFR(p.dateDeNaissance)}
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          {p.telephone || "—"}
                        </td>

                        {/* Blood group */}
                        <td className="px-4 py-4 text-center">
                          {p.groupeSanguin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-100)] text-[var(--color-800)] border border-[var(--color-200)]">
                              {p.groupeSanguin.replace("_", " ")}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Solde / Crédit column */}
                        <td className="px-6 py-4 text-right">
                          {cred > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setselectedPatient(p);
                                setPatientModalTab("finances");
                                setviewpatient(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                              title="Cliquer pour gérer les versements du patient"
                            >
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>{cred.toLocaleString("fr-FR")} DA</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              Soldé
                            </span>
                          )}
                        </td>

                        {/* Created At */}
                        <td className="px-6 py-4 text-sm font-medium text-gray-600">
                          {formatDateFR(p.createdAt)}
                        </td>

                        {/* Actions */}
                        <td
                          className="px-6 py-4 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-end items-center gap-1">
                            {/* Finances / Versements shortcut <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setselectedPatient(p);
                                setPatientModalTab("finances");
                                setviewpatient(true);
                              }}
                              className={`h-8 w-8 rounded-lg ${
                                cred > 0
                                  ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              }`}
                              title="Finances & Règlements"
                            >
                              <Coins className="w-3.5 h-3.5" />
                            </Button>
 */}
                            
                            {/* Delete Patient */}
                            <DialogPage
                              title="Supprimer le patient"
                              triggerText="Supprimer"
                              description={`Êtes-vous sûr de vouloir supprimer le patient "${p.nom}" ? Cette action est irréversible et supprimera toutes ses consultations.`}
                              onConfirm={() => handleDelete(p.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          {filteredPatients.length > 0 && (
            <div className="shrink-0 px-6 py-3 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-slate-600">
                <span>
                  Affichage de{" "}
                  <strong className="text-slate-800">
                    {(currentPage - 1) * pageSize + 1}
                  </strong>{" "}
                  à{" "}
                  <strong className="text-slate-800">
                    {Math.min(currentPage * pageSize, filteredPatients.length)}
                  </strong>{" "}
                  sur{" "}
                  <strong className="text-slate-800">
                    {filteredPatients.length}
                  </strong>{" "}
                  patient(s)
                </span>

                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-slate-400">Lignes :</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[var(--color-500)]"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Page Navigation */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2.5 rounded-lg text-xs gap-1 border-slate-200"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Précédent
                  </Button>

                  <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                    {currentPage} / {totalPages}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="h-8 px-2.5 rounded-lg text-xs gap-1 border-slate-200"
                  >
                    Suivant
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}