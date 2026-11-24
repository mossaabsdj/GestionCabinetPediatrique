"use client";

import { motion } from "framer-motion";
import React, { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  Coins,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Filter,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  PieChart as PieIcon,
  BarChart3,
  Receipt,
  User,
  Loader2,
  X,
  Check,
  ChevronDown,
  CalendarDays,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#10b981", "#f59e0b", "#f43f5e"];

const PERIODS = [
  { id: "today", label: "Aujourd'hui" },
  { id: "month", label: "Ce mois" },
  { id: "3months", label: "3 derniers mois" },
  { id: "year", label: "Cette année" },
  { id: "all", label: "Toutes les dates" },
  { id: "custom", label: "Sélectionner un mois" },
];

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export default function FinancePage() {
  const [activeMainTab, setActiveMainTab] = useState("tresorerie"); // "tresorerie" | "statistiques"
  const [period, setPeriod] = useState("month"); // "today" | "month" | "3months" | "year" | "all" | "custom"
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsData, setStatsData] = useState(null);

  // Search filters inside columns
  const [searchVersements, setSearchVersements] = useState("");
  const [searchDepenses, setSearchDepenses] = useState("");
const [showDateEdit, setShowDateEdit] = useState(false);
  // Modal create versement (debtors only)
  const [versementModalOpen, setVersementModalOpen] = useState(false);
  const [debtorsList, setDebtorsList] = useState([]);
  const [loadingDebtors, setLoadingDebtors] = useState(false);
  const [selectedDebtorId, setSelectedDebtorId] = useState("");
  const [selectedConsultationId, setSelectedConsultationId] = useState("");
  const [versementAmount, setVersementAmount] = useState("");
  const [versementDate, setVersementDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [versementNote, setVersementNote] = useState("Espèces");
  const [savingVersement, setSavingVersement] = useState(false);
  const [versementError, setVersementError] = useState("");

  // Modal create expense
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    montant: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState("");

  // Delete dialogs (Shadcn AlertDialog)
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    type: "", // "versement" | "depense"
    item: null,
  });
  const [deleting, setDeleting] = useState(false);

  // Notification Banner
  const [alertBanner, setAlertBanner] = useState({ type: "", message: "" });
  const showAlert = (type, message) => {
    setAlertBanner({ type, message });
    setTimeout(() => setAlertBanner({ type: "", message: "" }), 4500);
  };

  const currentPeriodShortLabel =
    period === "custom"
      ? `${MONTHS_FR[customMonth - 1]} ${customYear}`
      : PERIODS.find((p) => p.id === period)?.label || "Période";

  const handleSelectPeriod = (id) => {
    setPeriod(id);
    if (id !== "custom") setPeriodMenuOpen(false);
  };

  // Fetch Finance Data
  const fetchFinanceData = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      params.append("period", period);
      if (period === "custom") {
        params.append("year", String(customYear));
        params.append("month", String(customMonth));
      }

      const res = await fetch(`/api/finance/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (e) {
      console.error(e);
      showAlert("error", "Erreur lors du calcul des statistiques financières.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customYear, customMonth]);

  // Filtered Versements in left column
  const filteredVersements = useMemo(() => {
    if (!statsData?.recentVersements) return [];
    if (!searchVersements.trim()) return statsData.recentVersements;
    const q = searchVersements.toLowerCase().trim();
    return statsData.recentVersements.filter((v) => {
      const patientNom = (v.patient?.nom || "").toLowerCase();
      const note = (v.note || "").toLowerCase();
      const consultId = String(v.consultationId || "");
      return patientNom.includes(q) || note.includes(q) || consultId.includes(q);
    });
  }, [statsData, searchVersements]);

  // Filtered Depenses in right column
  const filteredDepenses = useMemo(() => {
    if (!statsData?.recentDepenses) return [];
    if (!searchDepenses.trim()) return statsData.recentDepenses;
    const q = searchDepenses.toLowerCase().trim();
    return statsData.recentDepenses.filter((d) => {
      const desc = (d.description || "").toLowerCase();
      return desc.includes(q);
    });
  }, [statsData, searchDepenses]);

  // Totals for displayed lists
  const displayedVersementsTotal = useMemo(
    () =>
      filteredVersements.reduce((sum, v) => sum + (Number(v.montant) || 0), 0),
    [filteredVersements]
  );

  const displayedDepensesTotal = useMemo(
    () =>
      filteredDepenses.reduce((sum, d) => sum + (Number(d.montant) || 0), 0),
    [filteredDepenses]
  );

  // Filter clients with credit only
  const clientsWithCredit = useMemo(() => {
    return debtorsList.filter(
      (d) =>
        (Number(d.totalCredit) || 0) > 0 &&
        (d.unpaidConsultations || []).some((c) => (Number(c.reste) || 0) > 0)
    );
  }, [debtorsList]);

  // Resolve selected debtor & consultation objects
  const selectedDebtor = useMemo(() => {
    return (
      clientsWithCredit.find((d) => String(d.id) === String(selectedDebtorId)) || null
    );
  }, [clientsWithCredit, selectedDebtorId]);

  const consultationsWithCredit = useMemo(() => {
    if (!selectedDebtor?.unpaidConsultations) return [];
    return selectedDebtor.unpaidConsultations.filter(
      (c) => (Number(c.reste) || 0) > 0
    );
  }, [selectedDebtor]);

  const selectedConsultation = useMemo(() => {
    return (
      consultationsWithCredit.find(
        (c) => String(c.id) === String(selectedConsultationId)
      ) || null
    );
  }, [consultationsWithCredit, selectedConsultationId]);

  // Handle Debtor Selection Change
  const handleDebtorChange = (debtorId) => {
    setSelectedDebtorId(debtorId);
    const debtor = clientsWithCredit.find((d) => String(d.id) === String(debtorId));
    const consults = (debtor?.unpaidConsultations || []).filter(
      (c) => (Number(c.reste) || 0) > 0
    );
    if (consults.length > 0) {
      setSelectedConsultationId(String(consults[0].id));
      setVersementAmount(String(consults[0].reste));
    } else {
      setSelectedConsultationId("");
      setVersementAmount("");
    }
  };

  // Handle Consultation Selection Change
  const handleConsultationChange = (consultId) => {
    setSelectedConsultationId(consultId);
    const consult = consultationsWithCredit.find(
      (c) => String(c.id) === String(consultId)
    );
    if (consult) {
      setVersementAmount(String(consult.reste));
    }
  };

  // Open Add Versement Modal & Fetch Debtors
  const handleOpenAddVersement = async () => {
    setVersementModalOpen(true);
    setLoadingDebtors(true);
    setVersementError("");
    setVersementDate(new Date().toISOString().split("T")[0]);
    setVersementNote("Espèces");

    try {
      const res = await fetch("/api/finance/debtors");
      if (res.ok) {
        const data = await res.json();
        const rawList = data.debtors || [];
        const list = rawList.filter(
          (d) =>
            (Number(d.totalCredit) || 0) > 0 &&
            (d.unpaidConsultations || []).some((c) => (Number(c.reste) || 0) > 0)
        );
        setDebtorsList(list);

        if (list.length > 0) {
          const firstDebtor = list[0];
          setSelectedDebtorId(String(firstDebtor.id));
          const consults = (firstDebtor.unpaidConsultations || []).filter(
            (c) => (Number(c.reste) || 0) > 0
          );
          if (consults.length > 0) {
            setSelectedConsultationId(String(consults[0].id));
            setVersementAmount(String(consults[0].reste));
          } else {
            setSelectedConsultationId("");
            setVersementAmount("");
          }
        } else {
          setSelectedDebtorId("");
          setSelectedConsultationId("");
          setVersementAmount("");
        }
      } else {
        setVersementError(
          "Impossible de charger la liste des patients débiteurs."
        );
      }
    } catch (err) {
      console.error(err);
      setVersementError("Erreur réseau lors du chargement des patients.");
    } finally {
      setLoadingDebtors(false);
    }
  };

  // Save new Versement
  const handleSaveVersement = async (e) => {
    e?.preventDefault?.();
    setVersementError("");

    if (!selectedDebtorId) {
      setVersementError("Veuillez sélectionner un patient.");
      return;
    }

    if (!selectedConsultationId || !selectedConsultation) {
      setVersementError("Veuillez sélectionner une consultation.");
      return;
    }

    const amountNum = parseFloat(
      String(versementAmount).replace(/\s+/g, "").replace(/,/g, ".")
    );
    if (isNaN(amountNum) || amountNum <= 0) {
      setVersementError(
        "Veuillez saisir un montant valide supérieur à 0 DZD."
      );
      return;
    }

    const maxReste = Number(selectedConsultation.reste) || 0;
    if (amountNum > maxReste) {
      setVersementError(
        `Le montant ne peut pas dépasser le reste à payer (${maxReste.toLocaleString("fr-FR")} DZD).`
      );
      return;
    }

    const currentTotalPaye = Number(selectedConsultation.totalPaye) || 0;
    const currentPrice = Number(selectedConsultation.prix) || 0;
    const finalPrice = Math.max(currentPrice, currentTotalPaye + amountNum);

    try {
      setSavingVersement(true);
      const res = await fetch("/api/versements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montant: amountNum,
          prix: finalPrice,
          patientId: parseInt(selectedDebtorId),
          consultationId: parseInt(selectedConsultationId),
          date: versementDate,
          note: versementNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || "Erreur lors de l'enregistrement du versement."
        );
      }

      setVersementModalOpen(false);
      showAlert(
        "success",
        `Versement de ${amountNum.toLocaleString("fr-FR")} DZD enregistré avec succès pour ${selectedDebtor.nom}.`
      );
      fetchFinanceData();
    } catch (err) {
      setVersementError(err.message || "Erreur serveur.");
    } finally {
      setSavingVersement(false);
    }
  };

  // Save new expense from modal
  const handleSaveExpense = async (e) => {
    e?.preventDefault?.();
    setExpenseError("");

    const m = parseFloat(expenseForm.montant);
    if (isNaN(m) || m <= 0) {
      setExpenseError("Le montant doit être supérieur à 0 DZD.");
      return;
    }
    if (!expenseForm.description.trim()) {
      setExpenseError("La description est obligatoire.");
      return;
    }

    try {
      setSavingExpense(true);
      const res = await fetch("/api/depenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montant: m,
          description: expenseForm.description.trim(),
          date: expenseForm.date,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement.");
      }

      setExpenseModalOpen(false);
      setExpenseForm({
        montant: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      showAlert("success", "Dépense enregistrée avec succès.");
      fetchFinanceData();
    } catch (err) {
      setExpenseError(err.message || "Erreur serveur.");
    } finally {
      setSavingExpense(false);
    }
  };

  // Confirm Delete Item
  const handleConfirmDelete = async () => {
    const { type, item } = deleteDialog;
    if (!item) return;

    try {
      setDeleting(true);
      const endpoint =
        type === "versement"
          ? `/api/versements/${item.id}`
          : `/api/depenses/${item.id}`;
      const res = await fetch(endpoint, { method: "DELETE" });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de la suppression.");
      }

      setDeleteDialog({ open: false, type: "", item: null });
      showAlert(
        "success",
        type === "versement"
          ? "Versement supprimé avec succès."
          : "Dépense supprimée avec succès."
      );
      fetchFinanceData();
    } catch (err) {
      showAlert("error", err.message || "Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  const summary = statsData?.summary || {
    totalVersements: 0,
    totalDepenses: 0,
    beneficeNet: 0,
    creditPatients: 0,
    countVersements: 0,
    countDepenses: 0,
    distribution: { paid: 0, partiel: 0, impaye: 0, total: 0 },
  };

  const pieData = [
    { name: "Consultations Soldées", value: summary.distribution.paid },
    { name: "Règlements Partiels", value: summary.distribution.partiel },
    { name: "Consultations Impayées", value: summary.distribution.impaye },
  ].filter((p) => p.value > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-50)] via-white to-slate-50 p-3 sm:p-5 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ======================================================== */}
        {/* HEADER (avec onglets, filtre de période et rafraîchir)   */}
        {/* ======================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--color-600)] text-white shadow-md">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                Finances &amp; Trésorerie
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium">
                Pilotage des encaissements patients, décaissements, bénéfices et crédits
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tabs selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveMainTab("tresorerie")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeMainTab === "tresorerie"
                    ? "bg-white text-[var(--color-700)] shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Finance &amp; Trésorerie</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab("statistiques")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeMainTab === "statistiques"
                    ? "bg-white text-[var(--color-700)] shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Statistiques</span>
              </button>
            </div>

            {/* Period filter button + menu */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPeriodMenuOpen((v) => !v)}
                className={`rounded-xl text-sm font-semibold flex items-center gap-2 border-slate-200 ${
                  periodMenuOpen
                    ? "bg-[var(--color-50)] text-[var(--color-700)] border-[var(--color-300)]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>{currentPeriodShortLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    periodMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {periodMenuOpen && (
                <>
                  {/* click outside to close */}
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
                            <CalendarDays className="w-3.5 h-3.5" />
                          )}
                          {p.label}
                        </span>
                        {period === p.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}

                    {period === "custom" && (
                      <div className="mt-1.5 pt-2.5 px-2 pb-1.5 border-t border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 font-medium">Mois</span>
                          <select
                            value={customMonth}
                            onChange={(e) =>
                              setCustomMonth(parseInt(e.target.value))
                            }
                            className="w-40 text-xs py-1 px-2 h-8 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[var(--color-500)]"
                          >
                            {MONTHS_FR.map((m, idx) => (
                              <option key={idx + 1} value={idx + 1}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 font-medium">Année</span>
                          <select
                            value={customYear}
                            onChange={(e) =>
                              setCustomYear(parseInt(e.target.value))
                            }
                            className="w-40 text-xs py-1 px-2 h-8 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[var(--color-500)]"
                          >
                            {[2024, 2025, 2026, 2027].map((yr) => (
                              <option key={yr} value={yr}>
                                {yr}
                              </option>
                            ))}
                          </select>
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
              variant="outline"
              size="icon"
              onClick={fetchFinanceData}
              disabled={loading || refreshing}
              className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Rafraîchir"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loading || refreshing ? "animate-spin" : ""
                }`}
              />
            </Button>
          </div>
        </div>

        {/* Shadcn Alert Banner */}
        {alertBanner.message && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-2xs animate-in fade-in slide-in-from-top-2 ${
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
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TOP SUMMARY STATS CARDS                                 */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Versements */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Total Versements
                </span>
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-700">
                {loading ? (
                  <div className="h-7 w-28 bg-slate-100 animate-pulse rounded" />
                ) : (
                  `+${Number(summary.totalVersements || 0).toLocaleString("fr-FR")} DZD`
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {summary.countVersements} versement(s) encaissé(s)
            </p>
          </motion.div>

          {/* Card 2: Total Dépenses */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.04 }}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-rose-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  Total Dépenses
                </span>
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-rose-700">
                {loading ? (
                  <div className="h-7 w-28 bg-slate-100 animate-pulse rounded" />
                ) : (
                  `-${Number(summary.totalDepenses || 0).toLocaleString("fr-FR")} DZD`
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {summary.countDepenses} charge(s) décaissée(s)
            </p>
          </motion.div>

          {/* Card 3: Bénéfice Net */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.08 }}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-300 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  Bénéfice Net
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      summary.beneficeNet >= 0
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {summary.beneficeNet >= 0 ? "Positif" : "Déficit"}
                  </span>
                </span>
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-xl sm:text-2xl font-extrabold ${
                  summary.beneficeNet >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {loading ? (
                  <div className="h-7 w-28 bg-slate-100 animate-pulse rounded" />
                ) : (
                  `${Number(summary.beneficeNet || 0).toLocaleString("fr-FR")} DZD`
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Versements reçus moins dépenses réelles
            </p>
          </motion.div>

          {/* Card 4: Crédit Patients Global */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.12 }}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Crédit Patients Global
                </span>
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-800">
                {loading ? (
                  <div className="h-7 w-28 bg-slate-100 animate-pulse rounded" />
                ) : (
                  `${Number(summary.creditPatients || 0).toLocaleString("fr-FR")} DZD`
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Crédits patients globaux en attente
            </p>
          </motion.div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: VUE TRÉSORERIE (SIDE-BY-SIDE COLUMNS)             */}
        {/* ======================================================== */}
        {activeMainTab === "tresorerie" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* ---------------------------------------------------- */}
            {/* LEFT COLUMN: VERSEMENTS (PATIENT PAYMENTS)           */}
            {/* ---------------------------------------------------- */}
            <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white overflow-hidden flex flex-col">
              <CardHeader className="p-4 pb-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                        Versements &amp; Encaissements
                      
                      </CardTitle>
                     
                    </div>
                  </div>

                  {/* Add Versement Button */}
                  <Button
                    onClick={handleOpenAddVersement}
                    size="sm"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Nouveau versement
                  </Button>
                </div>

                {/* Search bar */}
                <div className="relative mt-3">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Filtrer par patient, consultation ou note..."
                    value={searchVersements}
                    onChange={(e) => setSearchVersements(e.target.value)}
                    className="pl-9 pr-8 text-xs h-9 rounded-xl border-slate-200 bg-white"
                  />
                  {searchVersements && (
                    <button
                      type="button"
                      onClick={() => setSearchVersements("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </CardHeader>

              {/* Scrollable Table Container */}
              <div className="relative flex flex-col h-[520px]">
                <div className="overflow-y-auto overflow-x-auto flex-1 scroll-smooth">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 border-b border-slate-200 shadow-xs">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-bold text-slate-600 uppercase py-2.5 w-[95px]">
                          Date
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-600 uppercase py-2.5">
                          Patient &amp; Consultation
                        </TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-600 uppercase py-2.5 w-[120px]">
                          Montant
                        </TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-600 uppercase py-2.5 w-[75px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div className="h-4 bg-slate-100 animate-pulse rounded w-16" />
                            </TableCell>
                            <TableCell>
                              <div className="h-4 bg-slate-100 animate-pulse rounded w-36" />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="h-4 bg-slate-100 animate-pulse rounded w-20 ml-auto" />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="h-4 bg-slate-100 animate-pulse rounded w-12 ml-auto" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : filteredVersements.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="h-80 text-center py-10"
                          >
                            <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                              <div className="p-3 bg-emerald-50 rounded-full border border-emerald-100">
                                <DollarSign className="w-7 h-7 text-emerald-400" />
                              </div>
                              <div className="text-sm font-semibold text-slate-700">
                                Aucun versement trouvé
                              </div>
                              <p className="text-xs text-slate-400 max-w-xs">
                                {searchVersements
                                  ? "Aucun résultat ne correspond à votre filtre de recherche."
                                  : "Aucun versement n'a été enregistré pour cette période."}
                              </p>
                              <Button
                                size="sm"
                                onClick={handleOpenAddVersement}
                                className="mt-2 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Encaisser un versement
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredVersements.map((v) => (
                          <TableRow
                            key={v.id}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            <TableCell className="text-xs font-medium text-slate-600 align-top py-3">
                              {v.date
                                ? new Date(v.date).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })
                                : "—"}
                            </TableCell>

                            <TableCell className="align-top py-3">
                              <div className="space-y-0.5">
                                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  <span>
                                    {v.patient?.nom || "Patient non spécifié"}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
                                  <span className="text-slate-600 font-medium">
                                    Consultation #{v.consultationId}
                                  </span>
                                  {v.note && (
                                    <span className="text-[10px] text-slate-400 italic line-clamp-1">
                                      · {v.note}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="text-right align-top py-3">
                              <span className="text-xs font-extrabold text-emerald-700 whitespace-nowrap">
                                +{Number(v.montant).toLocaleString("fr-FR")} DZD
                              </span>
                            </TableCell>

                            <TableCell className="text-right align-top py-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setDeleteDialog({
                                      open: true,
                                      type: "versement",
                                      item: v,
                                    })
                                  }
                                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pinned Card Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium shrink-0">
                  <span>
                    Affichage :{" "}
                    <strong className="text-slate-800">
                      {filteredVersements.length}
                    </strong>{" "}
                    versement(s)
                  </span>
                  <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    +{displayedVersementsTotal.toLocaleString("fr-FR")} DZD
                  </span>
                </div>
              </div>
            </Card>

            {/* ---------------------------------------------------- */}
            {/* RIGHT COLUMN: DÉPENSES (EXPENSES)                    */}
            {/* ---------------------------------------------------- */}
            <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white overflow-hidden flex flex-col">
              <CardHeader className="p-4 pb-3 border-b border-slate-100 bg-gradient-to-r from-rose-50/70 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                        Dépenses &amp; Charges
                       
                      </CardTitle>
                   
                    </div>
                  </div>

                  {/* Add Depense Button */}
                  <Button
                    onClick={() => setExpenseModalOpen(true)}
                    size="sm"
                    className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvelle dépense
                  </Button>
                </div>

                {/* Search bar */}
                <div className="relative mt-3">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Filtrer par motif ou description..."
                    value={searchDepenses}
                    onChange={(e) => setSearchDepenses(e.target.value)}
                    className="pl-9 pr-8 text-xs h-9 rounded-xl border-slate-200 bg-white"
                  />
                  {searchDepenses && (
                    <button
                      type="button"
                      onClick={() => setSearchDepenses("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </CardHeader>

              {/* Scrollable Table Container */}
              <div className="relative flex flex-col h-[520px]">
                <div className="overflow-y-auto overflow-x-auto flex-1 scroll-smooth">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 border-b border-slate-200 shadow-xs">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-bold text-slate-600 uppercase py-2.5 w-[95px]">
                          Date
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-600 uppercase py-2.5">
                          Description / Motif
                        </TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-600 uppercase py-2.5 w-[120px]">
                          Montant
                        </TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-600 uppercase py-2.5 w-[75px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div className="h-4 bg-slate-100 animate-pulse rounded w-16" />
                            </TableCell>
                            <TableCell>
                              <div className="h-4 bg-slate-100 animate-pulse rounded w-36" />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="h-4 bg-slate-100 animate-pulse rounded w-20 ml-auto" />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="h-4 bg-slate-100 animate-pulse rounded w-12 ml-auto" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : filteredDepenses.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="h-80 text-center py-10"
                          >
                            <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                              <div className="p-3 bg-rose-50 rounded-full border border-rose-100">
                                <Receipt className="w-7 h-7 text-rose-400" />
                              </div>
                              <div className="text-sm font-semibold text-slate-700">
                                Aucune dépense trouvée
                              </div>
                              <p className="text-xs text-slate-400 max-w-xs">
                                {searchDepenses
                                  ? "Aucune dépense ne correspond à votre filtre de recherche."
                                  : "Aucune charge enregistrée pour cette période."}
                              </p>
                              <Button
                                size="sm"
                                onClick={() => setExpenseModalOpen(true)}
                                className="mt-2 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Ajouter une charge
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDepenses.map((dep) => (
                          <TableRow
                            key={dep.id}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            <TableCell className="text-xs font-medium text-slate-600 align-top py-3">
                              {dep.date
                                ? new Date(dep.date).toLocaleDateString(
                                    "fr-FR",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    }
                                  )
                                : "—"}
                            </TableCell>

                            <TableCell className="align-top py-3">
                              <div className="text-xs font-bold text-slate-800 line-clamp-2">
                                {dep.description}
                              </div>
                            </TableCell>

                            <TableCell className="text-right align-top py-3">
                              <span className="text-xs font-extrabold text-rose-700 whitespace-nowrap">
                                -{Number(dep.montant).toLocaleString("fr-FR")}{" "}
                                DZD
                              </span>
                            </TableCell>

                            <TableCell className="text-right align-top py-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setDeleteDialog({
                                      open: true,
                                      type: "depense",
                                      item: dep,
                                    })
                                  }
                                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pinned Card Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium shrink-0">
                  <span>
                    Affichage :{" "}
                    <strong className="text-slate-800">
                      {filteredDepenses.length}
                    </strong>{" "}
                    dépense(s)
                  </span>
                  <span className="font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    -{displayedDepensesTotal.toLocaleString("fr-FR")} DZD
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: STATISTIQUES & ANALYSES GRAPHIQUES                */}
        {/* ======================================================== */}
        {activeMainTab === "statistiques" && (
          <div className="space-y-6">
            {/* Row 1: Area Chart (Evolution Versements vs Dépenses vs Bénéfice) */}
            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Évolution Financière dans le Temps (Recettes, Dépenses &amp; Bénéfice)
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Visualisation chronologique des flux de trésorerie sur la période
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                      Recettes
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-rose-700">
                      <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                      Dépenses
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-blue-700">
                      <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                      Bénéfice
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 pb-2">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={statsData?.chartData || []}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorRecettes"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient
                          id="colorDepenses"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor="#e11d48" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) =>
                          `${Number(value).toLocaleString("fr-FR")} DZD`
                        }
                        contentStyle={{
                          borderRadius: "12px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          border: "none",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="versements"
                        name="Recettes"
                        stroke="#059669"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRecettes)"
                      />
                      <Area
                        type="monotone"
                        dataKey="depenses"
                        name="Dépenses"
                        stroke="#e11d48"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorDepenses)"
                      />
                      <Line
                        type="monotone"
                        dataKey="benefice"
                        name="Bénéfice Net"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Row 2: Two charts side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart: Comparison Recettes vs Dépenses */}
              <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Comparaison Recettes vs Dépenses
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Équilibre budgétaire sur la période sélectionnée
                  </p>
                </CardHeader>

                <CardContent className="pt-4">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsData?.chartData || []}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value) =>
                            `${Number(value).toLocaleString("fr-FR")} DZD`
                          }
                          contentStyle={{
                            borderRadius: "12px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            border: "none",
                            fontSize: "12px",
                          }}
                        />
                        <Bar
                          dataKey="versements"
                          name="Recettes"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="depenses"
                          name="Dépenses"
                          fill="#f43f5e"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Donut Chart: Payment Distribution */}
              <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-purple-600" />
                    Répartition des Règlements de Consultations
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Proportion des consultations soldées, partielles et impayées
                  </p>
                </CardHeader>

                <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                  <div className="h-52 w-full flex items-center justify-center">
                    {pieData.length === 0 ? (
                      <span className="text-xs text-slate-400">
                        Aucune donnée de consultation
                      </span>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => `${value} consultation(s)`}
                            contentStyle={{
                              borderRadius: "12px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                              border: "none",
                              fontSize: "12px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Legend with counts */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
                    <div className="p-2 rounded-xl bg-emerald-50">
                      <span className="text-emerald-800 font-bold block text-sm">
                        {summary.distribution.paid}
                      </span>
                      <span className="text-[11px] text-emerald-600">
                        Soldées
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50">
                      <span className="text-amber-800 font-bold block text-sm">
                        {summary.distribution.partiel}
                      </span>
                      <span className="text-[11px] text-amber-600">
                        Partielles
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-50">
                      <span className="text-rose-800 font-bold block text-sm">
                        {summary.distribution.impaye}
                      </span>
                      <span className="text-[11px] text-rose-600">
                        Impayées
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SHADCN DIALOG: AJOUTER UN VERSEMENT (PATIENTS DÉBITEURS) */}
        {/* ======================================================== */}
     <Dialog
  open={versementModalOpen}
  onOpenChange={(open) => {
    setVersementModalOpen(open);
    if (!open) setShowDateEdit(false);
  }}
>
  <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white border border-[var(--color-100)] shadow-xl">
    <DialogHeader>
      <DialogTitle className="text-xl font-bold text-[var(--color-700)] flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-[var(--color-600)]" />
        Nouveau versement
      </DialogTitle>
    </DialogHeader>

    {versementError && (
      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{versementError}</span>
      </div>
    )}

    {loadingDebtors ? (
      <div className="py-10 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-600)]" />
      </div>
    ) : clientsWithCredit.length === 0 ? (
      <div className="py-6 text-center space-y-3">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-800">Aucun solde débiteur</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setVersementModalOpen(false)}
          className="rounded-xl text-xs"
        >
          Fermer
        </Button>
      </div>
    ) : (
      <form onSubmit={handleSaveVersement} className="space-y-4">
        {/* Patient */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-700)] uppercase tracking-wider mb-1.5">
            Patient
          </label>
          <select
            required
            value={selectedDebtorId}
            onChange={(e) => handleDebtorChange(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-[var(--color-200)] bg-white text-sm outline-none focus:ring-2 focus:ring-[var(--color-400)]"
          >
            {clientsWithCredit.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nom} — {d.totalCredit.toLocaleString("fr-FR")} DZD
              </option>
            ))}
          </select>
        </div>

        {/* Consultation */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-700)] uppercase tracking-wider mb-1.5">
            Consultation
          </label>
          <select
            required
            value={selectedConsultationId}
            onChange={(e) => handleConsultationChange(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-[var(--color-200)] bg-white text-sm outline-none focus:ring-2 focus:ring-[var(--color-400)]"
          >
            {consultationsWithCredit.map((c) => (
              <option key={c.id} value={c.id}>
                {new Date(c.createdAt).toLocaleDateString("fr-FR")} — {c.motif} (reste {c.reste.toLocaleString("fr-FR")} DZD)
              </option>
            ))}
          </select>
        </div>

        {/* Montant */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[var(--color-700)] uppercase tracking-wider">
              Montant (DZD)
            </label>
            {selectedConsultation && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setVersementAmount(String(selectedConsultation.reste))}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Tout
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setVersementAmount(String(Math.round(selectedConsultation.reste / 2)))
                  }
                  className="font-bold text-blue-600 hover:underline"
                >
                  50%
                </button>
              </div>
            )}
          </div>
          <Input
            type="number"
            min="1"
            max={selectedConsultation?.reste}
            step="any"
            required
            autoFocus
            value={versementAmount}
            onChange={(e) => setVersementAmount(e.target.value)}
            className={`h-11 rounded-xl text-base font-semibold border-[var(--color-200)] bg-white ${
              selectedConsultation && parseFloat(versementAmount) > selectedConsultation.reste
                ? "border-red-400 text-red-600"
                : ""
            }`}
          />
        </div>

        {/* Reste après (rouge = aucun versement, vert = soldé, jaune = partiel) */}
        {selectedConsultation && (() => {
          const amount = parseFloat(versementAmount) || 0;
          const resteApres = Math.max(0, selectedConsultation.reste - amount);
          const color =
            amount <= 0
              ? "bg-red-50 border-red-200 text-red-700"
              : resteApres === 0
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-yellow-50 border-yellow-300 text-yellow-700";
          return (
            <div
              className={`flex justify-between items-center text-xs px-3 py-2 rounded-xl border font-medium ${color}`}
            >
              <span>Reste après</span>
              <b className="text-sm">{resteApres.toLocaleString("fr-FR")} DZD</b>
            </div>
          );
        })()}

        {/* Date (masquée au départ, champ d'origine affiché au clic) */}
        {!showDateEdit ? (
          <button
            type="button"
            onClick={() => setShowDateEdit(true)}
            className="text-xs font-bold text-[var(--color-600)] hover:underline"
          >
            Modifier la date
          </button>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-[var(--color-700)] uppercase tracking-wider mb-1.5">
              Date *
            </label>
            <Input
              type="date"
              required
              value={versementDate}
              onChange={(e) => setVersementDate(e.target.value)}
              className="h-11 rounded-xl border-[var(--color-200)] focus:ring-2 focus:ring-[var(--color-400)] focus:border-[var(--color-500)] bg-white text-sm"
            />
          </div>
        )}

        <DialogFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={savingVersement}
            onClick={() => setVersementModalOpen(false)}
            className="rounded-xl"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={
              savingVersement ||
              !selectedConsultation ||
              !versementAmount ||
              parseFloat(versementAmount) <= 0 ||
              parseFloat(versementAmount) > selectedConsultation.reste
            }
            className="bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white rounded-xl flex items-center gap-2"
          >
            {savingVersement ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Valider"
            )}
          </Button>
        </DialogFooter>
      </form>
    )}
  </DialogContent>
</Dialog>

        {/* ======================================================== */}
        {/* SHADCN DIALOG: AJOUTER UNE DÉPENSE RAPIDE               */}
        {/* ======================================================== */}
        <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white shadow-xl">
            <DialogHeader>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                  <Receipt className="w-5 h-5" />
                </div>
                <DialogTitle className="text-lg font-bold text-slate-800">
                  Nouvelle dépense
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Saisissez les détails de la dépense engagée pour le cabinet.
              </DialogDescription>
            </DialogHeader>

            {expenseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{expenseError}</span>
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Montant (DZD) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={expenseForm.montant}
                    onChange={(e) =>
                      setExpenseForm((prev) => ({
                        ...prev,
                        montant: e.target.value,
                      }))
                    }
                    placeholder="Ex: 8500"
                    className="rounded-xl border-slate-200 text-sm pr-12 focus:ring-1 focus:ring-rose-500"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    DZD
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Description / Motif <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Ex: Consommables, pharmacie, électricité, loyer..."
                  className="rounded-xl border-slate-200 text-xs focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Date de la dépense <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={(e) =>
                    setExpenseForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="rounded-xl border-slate-200 text-xs focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingExpense}
                  onClick={() => setExpenseModalOpen(false)}
                  className="rounded-xl text-xs border-slate-200"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={savingExpense}
                  className="rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white shadow font-semibold"
                >
                  {savingExpense ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Enregistrement...
                    </>
                  ) : (
                    "Ajouter la dépense"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ======================================================== */}
        {/* SHADCN ALERT DIALOG: CONFIRMATION SUPPRESSION ÉLÉMENT   */}
        {/* ======================================================== */}
        <AlertDialog
          open={deleteDialog.open}
          onOpenChange={(isOpen) =>
            setDeleteDialog((prev) => ({ ...prev, open: isOpen }))
          }
        >
          <AlertDialogContent className="bg-white rounded-2xl shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-bold text-slate-900">
                Confirmer la suppression ?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-600">
                {deleteDialog.type === "versement" ? (
                  <>
                    Êtes-vous sûr de vouloir supprimer ce versement de{" "}
                    <strong className="text-slate-900">
                      {deleteDialog.item
                        ? Number(deleteDialog.item.montant).toLocaleString(
                            "fr-FR"
                          )
                        : 0}{" "}
                      DZD
                    </strong>{" "}
                    (Patient : {deleteDialog.item?.patient?.nom}) ? Le solde de
                    la consultation sera réajusté.
                  </>
                ) : (
                  <>
                    Êtes-vous sûr de vouloir supprimer cette dépense de{" "}
                    <strong className="text-slate-900">
                      {deleteDialog.item
                        ? Number(deleteDialog.item.montant).toLocaleString(
                            "fr-FR"
                          )
                        : 0}{" "}
                      DZD
                    </strong>{" "}
                    ({deleteDialog.item?.description}) ? Les bilans de
                    trésorerie seront recalculés.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel
                disabled={deleting}
                className="rounded-xl text-xs"
              >
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {deleting ? "Suppression..." : "Confirmer la suppression"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}