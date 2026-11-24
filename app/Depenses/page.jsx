"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  Trash2,
  Edit2,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Filter,
  RefreshCw,
  Receipt,
  FileText,
  ChevronDown,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PERIODS = [
  { id: "today", label: "Aujourd'hui" },
  { id: "month", label: "Ce mois" },
  { id: "prev_month", label: "Mois précédent" },
  { id: "year", label: "Cette année" },
  { id: "all", label: "Toutes les dates" },
  { id: "custom", label: "Période personnalisée" },
];

export default function DepensesPage() {
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    montant: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Alert Dialog states (Shadcn confirm delete)
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Notification Banner
  const [alertBanner, setAlertBanner] = useState({ type: "", message: "" });

  const showAlert = (type, message) => {
    setAlertBanner({ type, message });
    setTimeout(() => setAlertBanner({ type: "", message: "" }), 4500);
  };

  const currentPeriodLabel =
    PERIODS.find((p) => p.id === period)?.label || "Période";

  // Compute start/end dates from selected preset period
  const handleSelectPeriod = (id) => {
    setPeriod(id);
    const now = new Date();
    const fmt = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

    if (id === "today") {
      const todayStr = fmt(now);
      setDateFilter({ start: todayStr, end: todayStr });
      setPeriodMenuOpen(false);
    } else if (id === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateFilter({ start: fmt(start), end: fmt(end) });
      setPeriodMenuOpen(false);
    } else if (id === "prev_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateFilter({ start: fmt(start), end: fmt(end) });
      setPeriodMenuOpen(false);
    } else if (id === "year") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      setDateFilter({ start: fmt(start), end: fmt(end) });
      setPeriodMenuOpen(false);
    } else if (id === "all") {
      setDateFilter({ start: "", end: "" });
      setPeriodMenuOpen(false);
    }
  };

  // Fetch all expenses
  const fetchDepenses = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (dateFilter.start) params.append("startDate", dateFilter.start);
      if (dateFilter.end) params.append("endDate", dateFilter.end);
      if (search.trim()) params.append("search", search.trim());

      const queryStr = params.toString();
      const res = await fetch(
        queryStr ? `/api/depenses?${queryStr}` : "/api/depenses"
      );
      if (res.ok) {
        const data = await res.json();
        setDepenses(data.depenses || []);
      }
    } catch (e) {
      console.error(e);
      showAlert("error", "Erreur lors du chargement des dépenses.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDepenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDepenses();
  };

  // Client-side instant search filter on top of fetched list
  const displayedDepenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return depenses;
    return depenses.filter((d) =>
      (d.description || "").toLowerCase().includes(q)
    );
  }, [depenses, search]);

  // Compute Metrics (3 cards matching DepensesPage reference)
  const metrics = useMemo(() => {
    const total = displayedDepenses.reduce(
      (sum, d) => sum + (Number(d.montant) || 0),
      0
    );
    const count = displayedDepenses.length;
    const average = count > 0 ? Math.round(total / count) : 0;

    return {
      total,
      count,
      average,
    };
  }, [displayedDepenses]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      montant: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    setFormError("");
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (depense) => {
    setIsEditing(true);
    setCurrentId(depense.id);
    setFormData({
      montant: String(depense.montant),
      description: depense.description || "",
      date: depense.date
        ? new Date(depense.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setFormError("");
    setModalOpen(true);
  };

  // Save (Create or Update)
  const handleSave = async (e) => {
    e?.preventDefault?.();
    setFormError("");

    const montantNum = parseFloat(formData.montant);
    if (isNaN(montantNum) || montantNum <= 0) {
      setFormError("Le montant doit être un nombre supérieur à 0 DA.");
      return;
    }

    if (!formData.description.trim()) {
      setFormError("Veuillez renseigner une description ou un motif valide.");
      return;
    }

    if (!formData.date) {
      setFormError("Veuillez sélectionner une date valide.");
      return;
    }

    try {
      setSubmitting(true);
      const url = isEditing ? `/api/depenses/${currentId}` : "/api/depenses";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montant: montantNum,
          description: formData.description.trim(),
          date: formData.date,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement.");
      }

      setModalOpen(false);
      showAlert(
        "success",
        isEditing
          ? "La dépense a été mise à jour avec succès."
          : "La nouvelle dépense a été ajoutée avec succès."
      );
      fetchDepenses();
    } catch (err) {
      setFormError(err.message || "Erreur serveur.");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete with Shadcn AlertDialog
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/depenses/${itemToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de la suppression.");
      }

      setDeleteOpen(false);
      setItemToDelete(null);
      showAlert("success", "La dépense a été supprimée avec succès.");
      fetchDepenses();
    } catch (err) {
      showAlert("error", err.message || "Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-[var(--color-50)] via-white to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl w-full mx-auto flex flex-col flex-1 min-h-0 gap-4">
        {/* ======================================================== */}
        {/* HEADER (avec recherche, filtre de période et ajout)      */}
        {/* ======================================================== */}
        <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--color-600)] text-white shadow-md">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                Gestion des Dépenses
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium">
                Enregistrement et suivi des charges et dépenses du cabinet
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 h-9 rounded-xl border-slate-200 bg-white text-xs focus:ring-1 focus:ring-[var(--color-500)]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Period filter button + menu */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPeriodMenuOpen((v) => !v)}
                className={`h-9 rounded-xl text-sm font-semibold flex items-center gap-2 border-slate-200 ${
                  periodMenuOpen
                    ? "bg-[var(--color-50)] text-[var(--color-700)] border-[var(--color-300)]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>{currentPeriodLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    periodMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {periodMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setPeriodMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 z-30 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5">
                    {PERIODS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPeriod(p.id)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          period === p.id
                            ? "bg-[var(--color-50)] text-[var(--color-700)] font-bold"
                            : "text-slate-700 hover:bg-slate-50 font-medium"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {p.id === "custom" && (
                            <Calendar className="w-3.5 h-3.5" />
                          )}
                          {p.label}
                        </span>
                        {period === p.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}

                    {period === "custom" && (
                      <div className="mt-1.5 pt-2.5 px-2 pb-1.5 border-t border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 font-medium">Du</span>
                          <Input
                            type="date"
                            value={dateFilter.start}
                            onChange={(e) =>
                              setDateFilter((prev) => ({
                                ...prev,
                                start: e.target.value,
                              }))
                            }
                            className="w-40 text-xs py-1 h-8 rounded-lg border-slate-200"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 font-medium">Au</span>
                          <Input
                            type="date"
                            value={dateFilter.end}
                            onChange={(e) =>
                              setDateFilter((prev) => ({
                                ...prev,
                                end: e.target.value,
                              }))
                            }
                            className="w-40 text-xs py-1 h-8 rounded-lg border-slate-200"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setPeriodMenuOpen(false)}
                          className="w-full h-8 rounded-lg text-xs bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white"
                        >
                          Appliquer
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <Button
              type="button"
              onClick={handleOpenCreate}
              className="h-9 rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white shadow-sm flex items-center gap-2 text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Nouvelle dépense
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={fetchDepenses}
              disabled={loading || refreshing}
              className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Rafraîchir"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading || refreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SHADCN NOTIFICATION BANNER                               */}
        {/* ======================================================== */}
        {alertBanner.message && (
          <div
            className={`shrink-0 px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs transition-all ${
              alertBanner.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {alertBanner.type === "error" ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{alertBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertBanner({ type: "", message: "" })}
              className="hover:opacity-75"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUMMARY CARDS                                            */}
        {/* ======================================================== */}
        <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Total des dépenses */}
          <Card className="rounded-xl border-slate-200/90 shadow-xs bg-white overflow-hidden px-3.5 py-2.5 flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 leading-none">
                Total des Dépenses
              </p>
              <div className="mt-1 text-lg font-extrabold text-rose-700 leading-tight">
                {loading ? (
                  <div className="h-5 w-24 bg-slate-100 animate-pulse rounded" />
                ) : (
                  `${Number(metrics.total || 0).toLocaleString("fr-FR")} DA`
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {currentPeriodLabel}
              </p>
            </div>
          </Card>

          {/* Nombre d'opérations */}
          <Card className="rounded-xl border-slate-200/90 shadow-xs bg-white overflow-hidden px-3.5 py-2.5 flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 leading-none">
                Nombre d&apos;Opérations
              </p>
              <div className="mt-1 text-lg font-extrabold text-slate-800 leading-tight">
                {loading ? (
                  <div className="h-5 w-14 bg-slate-100 animate-pulse rounded" />
                ) : (
                  `${metrics.count} opération${metrics.count > 1 ? "s" : ""}`
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Charges comptabilisées
              </p>
            </div>
          </Card>

          {/* Moyenne par dépense */}
          <Card className="rounded-xl border-slate-200/90 shadow-xs bg-white overflow-hidden px-3.5 py-2.5 flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 leading-none">
                Moyenne par Dépense
              </p>
              <div className="mt-1 text-lg font-extrabold text-emerald-700 leading-tight">
                {loading ? (
                  <div className="h-5 w-20 bg-slate-100 animate-pulse rounded" />
                ) : (
                  `${Number(metrics.average || 0).toLocaleString("fr-FR")} DA`
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Montant moyen par charge
              </p>
            </div>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* EXPENSES TABLE                                           */}
        {/* ======================================================== */}
        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl shadow-lg overflow-hidden border border-[var(--color-100)]">
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[var(--color-600)] text-white">
                  <th className="bg-[var(--color-600)] text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider w-[180px]">
                    Date
                  </th>
                  <th className="bg-[var(--color-600)] text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                    Description / Motif
                  </th>
                  <th className="bg-[var(--color-600)] text-right px-6 py-4 font-semibold text-sm uppercase tracking-wider w-[200px]">
                    Montant (DA)
                  </th>
                  <th className="bg-[var(--color-600)] text-right px-6 py-4 font-semibold text-sm uppercase tracking-wider w-[140px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`dep-skel-${i}`} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 w-28 bg-[var(--color-200)]/60 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-56 bg-[var(--color-200)]/60 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-28 bg-[var(--color-200)]/60 rounded-full ml-auto" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 bg-[var(--color-200)]/60 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : displayedDepenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Receipt className="w-10 h-10 text-gray-300" />
                        <p className="text-sm font-semibold text-gray-700">
                          Aucune dépense trouvée
                        </p>
                        <p className="text-xs text-gray-500 max-w-xs">
                          {search.trim()
                            ? "Aucun résultat ne correspond à votre recherche."
                            : "Aucune dépense n'a été enregistrée pour cette période."}
                        </p>
                        <Button
                          size="sm"
                          onClick={handleOpenCreate}
                          className="mt-2 text-xs rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Ajouter une dépense
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedDepenses.map((dep, index) => (
                    <tr
                      key={dep.id}
                      className={`transition-colors hover:bg-[var(--color-50)] ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                          <Calendar
                            size={16}
                            className="text-[var(--color-500)] shrink-0"
                          />
                          {formatDateDisplay(dep.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {dep.description}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {Number(dep.montant).toLocaleString("fr-FR")} DA
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(dep)}
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setItemToDelete(dep);
                              setDeleteOpen(true);
                            }}
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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
      {/* SHADCN DIALOG: AJOUTER / MODIFIER UNE DÉPENSE           */}
      {/* ======================================================== */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                <Receipt className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-800">
                {isEditing ? "Modifier la dépense" : "Nouvelle dépense"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              {isEditing
                ? "Modifiez les informations de la dépense enregistrée."
                : "Saisissez les détails de la dépense engagée pour le cabinet."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Montant */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Montant (en DA) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="Ex: 5000"
                  value={formData.montant}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, montant: e.target.value }))
                  }
                  className="rounded-xl border-slate-200 text-sm pr-12 focus:ring-1 focus:ring-[var(--color-500)]"
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  DA
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Description / Motif <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                required
                placeholder="Ex: Achat consommables médicaux, Facture électricité..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="rounded-xl border-slate-200 text-sm focus:ring-1 focus:ring-[var(--color-500)]"
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Date de la dépense <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                className="rounded-xl border-slate-200 text-sm focus:ring-1 focus:ring-[var(--color-500)]"
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="rounded-xl text-xs border-slate-200"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl text-xs bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white shadow font-semibold inline-flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Enregistrement...
                  </>
                ) : isEditing ? (
                  "Enregistrer les modifications"
                ) : (
                  "Ajouter la dépense"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* SHADCN ALERT DIALOG: CONFIRMATION SUPPRESSION DÉPENSE   */}
      {/* ======================================================== */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-white rounded-2xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900">
              Supprimer cette dépense ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600">
              Êtes-vous sûr de vouloir supprimer cette dépense de{" "}
              <strong className="text-slate-900">
                {itemToDelete
                  ? Number(itemToDelete.montant).toLocaleString("fr-FR")
                  : 0}{" "}
                DA
              </strong>{" "}
              ({itemToDelete?.description}) ? Cette action est irréversible et
              modifiera le calcul des bénéfices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="rounded-xl text-xs border-slate-200"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="rounded-xl text-xs bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {deleting ? "Suppression..." : "Oui, supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}