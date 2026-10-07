"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Stethoscope,
  Plus,
  Trash,
  ArrowUp,
  ArrowDown,
  Eye,
  RotateCcw,
} from "lucide-react";
import AjouteModal from "@/app/component/NewPatient/page";
import DialogPage from "@/app/component/DialogPage/page";
import AlertModal from "@/app/component/success/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PatientModal from "../component/ViewPatient/page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import LoadingScreen from "../component/LoadingScreen/page";
import { Label } from "@/components/ui/label";

// ✅ Utility function to format all dates in French (dd/mm/yyyy)
function formatDateFR(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
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
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateDeNaissance, setdateDeNaissance] = useState("");
  const [filterDays, setFilterDays] = useState("none");
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedPatient, setselectedPatient] = useState();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    nom: "",
    telephone: "",
    adresse: "",
    antecedents: "",
    groupeSanguin: "",
  });

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

  // ===== Fetch patients from API =====
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

  // Check if any filter is currently applied
  const hasActiveFilters = Boolean(
    query.trim() ||
    dateFrom ||
    dateTo ||
    dateDeNaissance ||
    filterDays !== "none"
  );

  const handleResetFilters = () => {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setdateDeNaissance("");
    setFilterDays("none");
  };

  // ===== Filter + Sort logic =====
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

      return true;
    });

    // 6. Sorting
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
    sortBy,
    sortOrder,
  ]);

  function toggleSort(field) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }

  // ===== Add new patient API =====
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
        const errMsg =
          errJson.error || "Erreur lors de la création du patient.";
        throw new Error(errMsg);
      }

      const created = await res.json();
      setPatients((prev) => [created, ...prev]);
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

  // ===== Delete patient API =====
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

  if (loading) return <LoadingScreen />;

  const onclose = async () => {
    setviewpatient(false);
    await fetchPatients();
  };

  return (
    <div className="overflow-y-hidden min-h-screen bg-gradient-to-br from-[var(--color-50)] via-white to-[var(--color-100)] p-6">
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
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--color-100)] rounded-full shadow-md">
            <Stethoscope className="w-6 h-6 text-[var(--color-700)]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-800)]">Patients</h2>
            <p className="text-sm text-muted-foreground">
              Gestion des dossiers patients
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white shadow"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6 border-[var(--color-200)] shadow-sm">
        <CardContent>
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex flex-col">
              <Label className="mb-1">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Nom ou téléphone..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 focus:ring-[var(--color-500)] w-56"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <Label className="mb-1">Date depuis</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>

            <div className="flex flex-col">
              <Label className="mb-1">Date jusqu'à</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>

            <div className="flex flex-col">
              <Label className="mb-1">Date de naissance</Label>
              <Input
                type="date"
                value={dateDeNaissance}
                onChange={(e) => setdateDeNaissance(e.target.value)}
                className="w-48"
              />
            </div>

            <div className="flex flex-col">
              <Label className="mb-1">Ancien / Nouveau</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filterDays === "new-30" ? "default" : "outline"}
                  onClick={() =>
                    setFilterDays(filterDays === "new-30" ? "none" : "new-30")
                  }
                  className="flex items-center gap-1"
                >
                  <ArrowDown className="h-4 w-4" /> Nouveau
                </Button>
                <Button
                  size="sm"
                  variant={filterDays === "old-30" ? "default" : "outline"}
                  onClick={() =>
                    setFilterDays(filterDays === "old-30" ? "none" : "old-30")
                  }
                  className="flex items-center gap-1"
                >
                  <ArrowUp className="h-4 w-4" /> Ancien
                </Button>
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetFilters}
                className="text-gray-500 hover:text-red-600 flex items-center gap-1.5 h-9"
                title="Effacer tous les filtres"
              >
                <RotateCcw className="h-4 w-4" /> Réinitialiser
              </Button>
            )}

            <div className="ml-auto px-4 py-2 text-[var(--color-700)] bg-[var(--color-50)] border border-[var(--color-200)] rounded-xl shadow font-semibold flex items-center gap-1.5">
              <span>Total : {filteredPatients.length}</span>
              {hasActiveFilters && (
                <span className="text-xs text-gray-500 font-normal">
                  (sur {patients.length})
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-[var(--color-200)] shadow-md">
        <CardContent>
          <div className="rounded-lg border border-[var(--color-100)]">
            <div className="max-h-99 overflow-y-auto">
              <Table className="w-full border-collapse">
                <TableHeader className="sticky top-0 bg-gradient-to-r from-[var(--color-50)] to-[var(--color-100)] z-10">
                  <TableRow>
                    <TableHead
                      onClick={() => toggleSort("nom")}
                      className="px-4 py-3 font-bold text-[var(--color-800)] text-sm border-b border-[var(--color-200)] cursor-pointer select-none hover:bg-[var(--color-100)] transition"
                    >
                      <div className="flex items-center gap-1.5">
                        Nom
                        {sortBy === "nom" &&
                          (sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => toggleSort("age")}
                      className="px-4 py-3 font-bold text-[var(--color-800)] text-sm border-b border-[var(--color-200)] cursor-pointer select-none hover:bg-[var(--color-100)] transition"
                    >
                      <div className="flex items-center gap-1.5">
                        Date de Naissance
                        {sortBy === "age" &&
                          (sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="px-4 py-3 font-bold text-[var(--color-800)] text-sm border-b border-[var(--color-200)]">
                      Téléphone
                    </TableHead>
                    <TableHead className="px-4 py-3 font-bold text-[var(--color-800)] text-sm border-b border-[var(--color-200)]">
                      Groupe
                    </TableHead>
                    <TableHead
                      onClick={() => toggleSort("date")}
                      className="px-4 py-3 font-bold text-[var(--color-800)] text-sm border-b border-[var(--color-200)] cursor-pointer select-none hover:bg-[var(--color-100)] transition"
                    >
                      <div className="flex items-center gap-1.5">
                        Créé le
                        {sortBy === "date" &&
                          (sortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="px-4 py-3 font-bold text-[var(--color-800)] text-sm border-b border-[var(--color-200)] text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableSkeletonRows
                      columns={6}
                      rows={6}
                      widths={["w-3/4", "w-1/2", "w-2/3", "w-1/3", "w-1/2", "w-16"]}
                    />
                  ) : filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Aucun patient trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPatients.map((p) => (
                      <TableRow key={p.id} className="hover:bg-[var(--color-50)]/50">
                        <TableCell className="font-medium text-gray-900">{p.nom}</TableCell>
                        <TableCell>
                          {formatDateFR(p.dateDeNaissance)}
                        </TableCell>
                        <TableCell>{p.telephone ?? "-"}</TableCell>
                        <TableCell>
                          {p.groupeSanguin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-100)] text-[var(--color-800)]">
                              {p.groupeSanguin.replace("_", " ")}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{formatDateFR(p.createdAt)}</TableCell>
                        <TableCell className="flex justify-center items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setselectedPatient(p);
                              setviewpatient(true);
                            }}
                            title="Voir la fiche"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                          <DialogPage
                            title="Supprimer le patient"
                            triggerText="Supprimer"
                            description={`Êtes-vous sûr de vouloir supprimer le patient "${p.nom}" ? Cette action est irréversible et supprimera toutes ses consultations.`}
                            onConfirm={() => handleDelete(p.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

