"use client";
import Swal from "sweetalert2";

import {
  Plus,
  Search,
  Calendar,
  User,
  Phone,
  Home,
  ClipboardList,
  FileText,
  Stethoscope,
  Ruler,
  Weight,
  Activity,
  Thermometer,
  HeartPulse,
  Gauge,
  Droplets,
  FilePlus,
  UserCircle,
  Mail,
  MapPin,
  Sparkles,
  Keyboard,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  Save,
  Coins,
  CreditCard,
  Check,
} from "lucide-react";
import {
  DialogDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import SuccessModal from "@/app/component/success/page";
import { printOrdonnance, printBilan, printJustification } from "@/lib/printer";
import { calculateAge } from "@/lib/age";
import { Card, CardContent } from "@/components/ui/card";
import NewOrdanance from "@/app/component/NewOrdanance/page";
import AddVaccinationButton from "../component/NewVaccination/page";
import { useState, useMemo, useEffect, useRef } from "react";
import VaccinationsPage from "@/app/component/Vaccination/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AjouteModal from "@/app/component/NewPatient/page";
import CourbePage from "@/app/component/Courbe/page";
import NewConsultationPage from "../component/NewConsultation/page";
import Analyses from "../component/Analyses/page";
import PatientVisits from "../component/Visites/page";
import Ordonnances from "../component/Ordanance/page";
import LoadingScreen from "../component/LoadingScreen/page";
import { motion, AnimatePresence } from "framer-motion";
import ModernSearchBar from "../component/SearchBar/SearchBar";
import DatePickerFilter from "../component/DatePickerFilter/DatePickerFilter";
import { tabs } from "@heroui/theme";

export default function PatientDashboard() {
  const searchRef = useRef();
  const [selectedPatient, setSelectedPatient] = useState();
  const [search, setSearch] = useState("");
  const [files, setFiles] = useState([]);
  const [refrech, setrefrech] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedtab, setselectedtab] = useState("Informations Patient");
  const [NewConsultation, setNewConsultation] = useState(false);
  const [patientsData, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ShowAddDialogNewAnalyse, setShowAddDialogNewAnalyse] = useState(false);
  const [NewConsultationData, setNewConsultationData] = useState(null);
  const [lastid, setlastid] = useState(null);
  const [openNewordanance, setnewordanance] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [load, setload] = useState(false);
  const [query, setquery] = useState({ visites: "", ord: "", vaccination: "" });
  const [dateFilter, setDateFilter] = useState({
    visites: "",
    analyses: "",
    ord: "",
    vaccination: "",
  });
  const [successopen, setsuccessopen] = useState(false);
  const [createdConsultationData, setCreatedConsultationData] = useState(null);
  const [printingDoc, setPrintingDoc] = useState(null);
  const [DateTimeModal, setDataTimeModel] = useState(false);
  const [defaultConsultationPrice, setDefaultConsultationPrice] = useState(2000);
  const [modalPrice, setModalPrice] = useState("2000");
  const [modalRecordPayment, setModalRecordPayment] = useState(true);
  const [modalVersementInitial, setModalVersementInitial] = useState("2000");
  const [modalVersementNote, setModalVersementNote] = useState("Versement initial (Espèces)");
  const [modalSaveError, setModalSaveError] = useState("");
  const [viderForm, setViderForm] = useState(false);
  const [currentConsultationIndex, setCurrentConsultationIndex] = useState(0);

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0] // "YYYY-MM-DD"
  );
  const [time, setTime] = useState(
    new Date().toTimeString().slice(0, 5) // "HH:MM"
  );
  const [config, setConfig] = useState({
    title: "Payment Successful!",
    description:
      "Your payment has been processed successfully. You'll receive a confirmation email shortly.",
    autoClose: true,
    loadingText: "Traitement en cours...",

    autoCloseDelay: 100,
  });
  const filteredPatients = patientsData.filter((p) =>
    p.nom.toLowerCase().includes(search.toLowerCase())
  );
  const handleChange = (value) => {
    let att = "ord";
    if (selectedtab === "Visites") att = "visites";
    else if (selectedtab === "Vaccinations") att = "vaccination";
    setquery((prev) => ({ ...prev, [att]: value }));
  };

  const handleDateChange = (value) => {
    let key = "ord";
    if (selectedtab === "Visites") key = "visites";
    else if (selectedtab === "Analyses et Résultats") key = "analyses";
    else if (selectedtab === "Vaccinations") key = "vaccination";
    setDateFilter((prev) => ({ ...prev, [key]: value }));
  };

  const handlesaveOrdanance = (data) => {
    const payload = {
      note: "",
      ordonnance: data.ordonnance,
      bilanRecip: data.bilanRecip,
      taille: "",
      poids: "",
      tensionSystolique: "",
      tensionDiastolique: "",
      temperature: "",
      frequenceCardiaque: "",
      frequenceRespiratoire: "",
      saturationOxygene: "",
      glycemie: "",
      developpementPsychomoteur: "",
    };
    handleOpenConsultationSaveModal(payload);
  };

  function handleFileAdd(e) {
    const file = e.target.files[0];
    if (file) {
      setFiles((prev) => [...prev, { file, type: "bilan" }]);
    }
  }

  function handleFileTypeChange(index, value) {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, type: value } : f))
    );
  }

  function handleFileRemove(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function addConsultation(formData) {
    if (!formData) return;
    setlastid(selectedPatient?.id);
    console.log(formData);
    const dateTime = new Date(`${date}T${time}:00`);

    // ✅ Check if at least one field has data
    const hasData =
      formData.note?.trim() ||
      formData.taille ||
      formData.poids ||
      formData.tensionSystolique ||
      formData.tensionDiastolique ||
      formData.temperature ||
      formData.frequenceCardiaque ||
      formData.frequenceRespiratoire ||
      formData.saturationOxygene ||
      formData.glycemie ||
      formData.developpementPsychomoteur?.trim() ||
      formData.motifDeConsultation?.trim() || // ✅ new
      formData.perimetreCranien || // ✅ new
      formData.rendezVousDate || // ✅ new
      formData?.ordonnance?.items?.length > 0 ||
      formData?.bilanRecip?.items?.length > 0 ||
      formData?.justification?.trim?.() ||
      (typeof formData?.justification === "object" &&
        formData?.justification?.texte?.trim?.()) ||
      (Array.isArray(formData?.radios) && formData.radios.length > 0);

    if (!hasData) {
      // ❌ Replace alert with SweetAlert
      Swal.fire({
        icon: "error",
        title: "Champs requis",
        text: "Veuillez remplir au moins un champ avant de créer la consultation.",
        confirmButtonColor: "#d33",
      });
      return;
    }

    setCreatedConsultationData(null);
    setPrintingDoc(null);
    setConfig({
      title: "Nouvelle consultation ajoutée !",
      description: "La consultation du patient a été ajoutée avec succès.",
      autoClose: true,
      actionText: "OK",
    });
    setsuccessopen(true);
    setload(true);

    try {
      const response = await fetch("/api/Consulter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        // ✅ include new fields in POST body
        body: JSON.stringify({
          createdAt: dateTime.toISOString(),

          patientId: selectedPatient?.id,
          note: formData.note?.trim() || "",
          taille: formData.taille || null,
          poids: formData.poids || null,
          tensionSystolique: formData.tensionSystolique || null,
          tensionDiastolique: formData.tensionDiastolique || null,
          temperature: formData.temperature || null,
          frequenceCardiaque: formData.frequenceCardiaque || null,
          frequenceRespiratoire: formData.frequenceRespiratoire || null,
          saturationOxygene: formData.saturationOxygene || null,
          glycemie: formData.glycemie || null,
          developpementPsychomoteur:
            formData.developpementPsychomoteur?.trim() || null,

          // ✅ New fields
          motifDeConsultation: formData.motifDeConsultation?.trim() || null,
          justification:
            typeof formData.justification === "string"
              ? formData.justification.trim()
              : null,
          justificationRecord:
            typeof formData.justification === "object" &&
            formData.justification !== null
              ? formData.justification
              : null,
          perimetreCranien: formData.perimetreCranien || null,
          rendezVousDate: formData.rendezVousDate || null,
          rendezVousDescription: formData.rendezVousDescription?.trim() || null,

          // ✅ Ordonnance
          ordonnance:
            formData?.ordonnance?.items?.length > 0
              ? {
                  items: formData.ordonnance.items.map((item) => ({
                    medicamentId: item.medicamentId,
                    dosage: item.dosage,
                    frequence: item.frequence,
                    duree: item.duree,
                    quantite: item.quantite,
                  })),
                }
              : undefined,

          // ✅ Bilan
          bilanRecip:
            formData?.bilanRecip?.items?.length > 0
              ? {
                  items: formData.bilanRecip.items.map((item) => ({
                    bilanId: item.id || item.bilanId,
                    resultat: null,
                    remarque: null,
                  })),
                }
              : undefined,

          // ✅ Radios
          radios:
            Array.isArray(formData?.radios) && formData.radios.length > 0
              ? formData.radios.map((r) => ({
                  description: r.description,
                  fichier: r.fichier,
                }))
              : undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err.error || "Erreur lors de la création de la consultation"
        );
      }

      const consultation = await response.json();
      console.log("✅ Consultation créée:", consultation);

      const hasOrdonnance = Boolean(
        (consultation?.ordonnance?.items &&
          consultation.ordonnance.items.length > 0) ||
          (formData?.ordonnance?.items && formData.ordonnance.items.length > 0)
      );

      const hasBilan = Boolean(
        (consultation?.bilanRecip?.items &&
          consultation.bilanRecip.items.length > 0) ||
          (formData?.bilanRecip?.items && formData.bilanRecip.items.length > 0)
      );

      const hasJustification = Boolean(
        consultation?.justificationRecord?.texte?.trim() ||
          consultation?.justification?.trim() ||
          (typeof formData?.justification === "string"
            ? formData.justification.trim()
            : formData?.justification?.texte?.trim())
      );

      const hasAnyDocs = hasOrdonnance || hasBilan || hasJustification;

      if (hasAnyDocs) {
        setCreatedConsultationData({
          consultation,
          formData,
          hasOrdonnance,
          hasBilan,
          hasJustification,
        });
        setConfig({
          title: "Nouvelle consultation ajoutée !",
          description: "La consultation du patient a été ajoutée avec succès.",
          autoClose: false,
          actionText: "Fermer",
        });
      } else {
        setCreatedConsultationData(null);
        setConfig({
          title: "Nouvelle consultation ajoutée !",
          description: "La consultation du patient a été ajoutée avec succès.",
          autoClose: true,
          autoCloseDelay: 3000,
          actionText: "OK",
        });
      }

      setViderForm(true);
      await fetchPatients();
      setnewordanance(false);
      return consultation;
    } catch (error) {
      console.error("❌ addConsultation error:", error);
      setCreatedConsultationData(null);
      setPrintingDoc(null);
      setsuccessopen(false);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error?.message || "Erreur lors de la création de la consultation.",
        confirmButtonColor: "#d33",
      });
    } finally {
      setload(false);
    }
  }

  // 🖨️ Handlers to print documents created for the new consultation
  const handlePrintCreatedOrdonnance = async () => {
    if (!createdConsultationData) return;
    setPrintingDoc("ordonnance");
    try {
      const { consultation, formData } = createdConsultationData;
      const fullname = selectedPatient?.nom || "";
      let prenom = "";
      let nom = "";
      if (fullname.trim()) {
        const parts = fullname.trim().split(" ");
        if (parts.length === 1) nom = parts[0];
        else {
          prenom = parts.slice(0, -1).join(" ");
          nom = parts[parts.length - 1];
        }
      }
      const age = calculateAge(selectedPatient?.dateDeNaissance);

      const rawItems =
        consultation?.ordonnance?.items && consultation.ordonnance.items.length > 0
          ? consultation.ordonnance.items
          : formData?.ordonnance?.items || [];

      const items = rawItems.map((it, idx) => {
        const fallback = formData?.ordonnance?.items?.[idx];
        return {
          name:
            it.medicament?.nom ||
            it.nom ||
            it.name ||
            fallback?.nom ||
            fallback?.name ||
            "",
          dosage: it.dosage || fallback?.dosage || "",
          duration:
            it.duree || it.duration || fallback?.duree || fallback?.duration || "",
          frequency:
            it.frequence ||
            it.frequency ||
            fallback?.frequence ||
            fallback?.frequency ||
            "",
          quantity:
            it.quantite ||
            it.quantity ||
            fallback?.quantite ||
            fallback?.quantity ||
            "",
        };
      });

      printOrdonnance({
        consultationId: consultation?.id || "",
        ordonnanceId: consultation?.ordonnance?.id || "",
        nom,
        prenom,
        age,
        items,
      });
    } catch (err) {
      console.error("Erreur impression ordonnance:", err);
      Swal.fire({
        icon: "error",
        title: "Erreur d'impression",
        text: "Impossible d'imprimer l'ordonnance.",
      });
    } finally {
      setPrintingDoc(null);
    }
  };

  const handlePrintCreatedBilan = async () => {
    if (!createdConsultationData) return;
    setPrintingDoc("bilan");
    try {
      const { consultation, formData } = createdConsultationData;
      const fullname = selectedPatient?.nom || "";
      let prenom = "";
      let nom = "";
      if (fullname.trim()) {
        const parts = fullname.trim().split(" ");
        if (parts.length === 1) nom = parts[0];
        else {
          prenom = parts.slice(0, -1).join(" ");
          nom = parts[parts.length - 1];
        }
      }
      const age = calculateAge(selectedPatient?.dateDeNaissance);

      const rawItems =
        consultation?.bilanRecip?.items && consultation.bilanRecip.items.length > 0
          ? consultation.bilanRecip.items
          : formData?.bilanRecip?.items || [];

      const items = rawItems.map((it, idx) => {
        const fallback = formData?.bilanRecip?.items?.[idx];
        return {
          id: it.id || it.bilanId || fallback?.id || fallback?.bilanId,
          nom:
            it.bilan?.nom ||
            it.nom ||
            it.name ||
            fallback?.nom ||
            fallback?.name ||
            "",
        };
      });

      printBilan({
        consultationId: consultation?.id || "",
        bilanId: consultation?.bilanRecip?.id || "",
        nom,
        prenom,
        age,
        items,
      });
    } catch (err) {
      console.error("Erreur impression bilan:", err);
      Swal.fire({
        icon: "error",
        title: "Erreur d'impression",
        text: "Impossible d'imprimer le bilan.",
      });
    } finally {
      setPrintingDoc(null);
    }
  };

  const handlePrintCreatedJustification = async () => {
    if (!createdConsultationData) return;
    setPrintingDoc("justification");
    try {
      const { consultation, formData } = createdConsultationData;
      const fullname = selectedPatient?.nom || "";
      let prenom = "";
      let nom = "";
      if (fullname.trim()) {
        const parts = fullname.trim().split(" ");
        if (parts.length === 1) nom = parts[0];
        else {
          prenom = parts.slice(0, -1).join(" ");
          nom = parts[parts.length - 1];
        }
      }
      const age = calculateAge(selectedPatient?.dateDeNaissance);

      const justifRecord = consultation?.justificationRecord;
      const justifForm = formData?.justification;

      const texte =
        justifRecord?.texte ||
        (typeof justifForm === "string" ? justifForm : justifForm?.texte) ||
        consultation?.justification ||
        "";

      printJustification({
        consultationId: consultation?.id || "",
        justificationId: justifRecord?.id || consultation?.id || "",
        nom,
        prenom,
        age,
        texte,
      });
    } catch (err) {
      console.error("Erreur impression justification:", err);
      Swal.fire({
        icon: "error",
        title: "Erreur d'impression",
        text: "Impossible d'imprimer la justification.",
      });
    } finally {
      setPrintingDoc(null);
    }
  };

  // Load default consultation price from cabinet settings
  useEffect(() => {
    fetch("/api/cabinet")
      .then((res) => res.json())
      .then((data) => {
        const p =
          data?.defaultConsultationPrice !== undefined
            ? Number(data.defaultConsultationPrice)
            : 2000;
        setDefaultConsultationPrice(p);
        setModalPrice(String(p));
        setModalVersementInitial(String(p));
      })
      .catch(() => {});
  }, []);

  const handleSaveConsultation = () => {};

  const handleOpenConsultationSaveModal = (data) => {
    if (!data) return;
    setNewConsultationData(data);
    addconsultationfunction(data);
  };

  const handleCloseConsultationModal = () => {
    setDataTimeModel(false);
    setModalSaveError("");
    setNewConsultationData(null);
  };

  async function addconsultationfunction(data) {
    setDate(new Date().toISOString().split("T")[0]);
    setTime(new Date().toTimeString().slice(0, 5));
    const initPrice =
      data?.prix !== undefined && data?.prix !== ""
        ? String(data.prix)
        : String(defaultConsultationPrice);
    setModalPrice(initPrice);
    setModalRecordPayment(true);
    setModalVersementInitial(initPrice);
    setModalVersementNote("Versement initial (Espèces)");
    setModalSaveError("");
    setDataTimeModel(true);
  }

  async function fetchPatients() {
    console.log("lastid" + lastid);
    try {
      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Failed to fetch patients");
      const data = await res.json();
      console.log(JSON.stringify(data[0]));
      setPatients(data);
      setSelectedPatient(data[0]);

      if (lastid != null && lastid != "") {
        const updatedPatient = data.find((p) => p.id === lastid) || null;
        setSelectedPatient(updatedPatient);
      }
      console.log(JSON.stringify(selectedPatient));
    } catch (error) {
      console.error("❌ Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPatients();
    setCurrentConsultationIndex(0);
  }, []);

  // Reset consultation index when patient changes
  useEffect(() => {
    if (selectedPatient?.consultations?.length > 0) {
      setCurrentConsultationIndex(selectedPatient.consultations.length - 1);
    }
  }, [selectedPatient?.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+A: Focus search bar
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        searchRef.current?.focus();
      }

      // Ctrl+N: New patient
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        setIsAddOpen(true);
      }

      // Ctrl+K: New consultation
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        setNewConsultation(true);
        setselectedtab("+ Nouvelle Consultation");
      }

      // Ctrl+P: New prescription/bilan
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setnewordanance(true);
      }

      // Ctrl+V: Vaccinations tab
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        setselectedtab("Vaccinations");
      }

      // Ctrl+I: Patient info tab
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        setselectedtab("Informations Patient");
      }

      // Ctrl+/: Show shortcuts help
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setShowShortcuts(true);
      }

      // ESC: Close shortcuts help
      if (e.key === "Escape" && showShortcuts) {
        setShowShortcuts(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedPatient, showShortcuts]);

  const generalInfo = (selectedPatient) => [
    {
      icon: Calendar,
      label: "Date de naissance",
      value: selectedPatient?.dateDeNaissance
        ? new Date(selectedPatient.dateDeNaissance).toLocaleDateString("fr-FR")
        : "Non spécifiée",
    },
    {
      icon: Weight,
      label: "Poids de naissance",
      value: selectedPatient?.poidsDeNaissance
        ? `${selectedPatient?.poidsDeNaissance} kg`
        : "Non spécifié",
    },
    {
      icon: ClipboardList,
      label: "Antécédents",
      value: selectedPatient?.antecedents || "Non spécifié",
    },
    {
      icon: Droplets,
      label: "Groupe sanguin",
      value: selectedPatient?.groupeSanguin || "Non spécifié",
    },
  ];

  const contactInfo = (selectedPatient) => [
    {
      icon: MapPin,
      label: "Adresse",
      value: selectedPatient?.adresse || "Non spécifiée",
    },
    {
      icon: Phone,
      label: "Téléphone",
      value: selectedPatient?.telephone || "Non spécifié",
    },
  ];

  const medicalInfo = (selectedPatient, consultationIndex) => {
    if (!selectedPatient?.consultations?.length) return [];

    const consultations = selectedPatient.consultations;
    const index = consultationIndex ?? consultations.length - 1;

    const getInfo = (attr, currentIndex) => {
      for (let i = currentIndex; i >= 0; i--) {
        const val = consultations[i]?.[attr];
        if (val !== null && val !== undefined && val !== "") {
          return val;
        }
      }
      return null;
    };

    const c = consultations[index];

    const allFields = [
      {
        icon: Stethoscope,
        label: "Motif de consultation",
        value: getInfo("motifDeConsultation", index),
        type: "textarea",
        unite: "",
      },
      {
        icon: ClipboardList,
        label: "Notes",
        value: getInfo("note", index),
        type: "textarea",
        unite: "",
      },
      {
        icon: Sparkles,
        label: "Développement Psychomoteur",
        value: getInfo("developpementPsychomoteur", index),
        type: "textarea",
        unite: "",
      },
      {
        icon: Ruler,
        label: "Taille",
        value: getInfo("taille", index),
        type: "text",
        unite: "cm",
      },
      {
        icon: Weight,
        label: "Poids",
        value: getInfo("poids", index),
        type: "text",
        unite: "kg",
      },
      {
        icon: Ruler,
        label: "Périmètre crânien",
        value: getInfo("perimetreCranien", index),
        type: "text",
        unite: "cm",
      },
      {
        icon: Activity,
        label: "TA systolique",
        value: getInfo("tensionSystolique", index),
        type: "text",
        unite: "mmHg",
      },
      {
        icon: Activity,
        label: "TA diastolique",
        value: getInfo("tensionDiastolique", index),
        type: "text",
        unite: "mmHg",
      },
      {
        icon: Thermometer,
        label: "Température",
        value: getInfo("temperature", index),
        type: "text",
        unite: "°C",
      },
      {
        icon: HeartPulse,
        label: "Fréquence cardiaque",
        value: getInfo("frequenceCardiaque", index),
        type: "text",
        unite: "bpm",
      },
      {
        icon: Gauge,
        label: "Fréquence respiratoire",
        value: getInfo("frequenceRespiratoire", index),
        type: "text",
        unite: "cpm",
      },
      {
        icon: Droplets,
        label: "Saturation en oxygène",
        value: getInfo("saturationOxygene", index),
        type: "text",
        unite: "%",
      },
      {
        icon: ClipboardList,
        label: "Glycémie",
        value: getInfo("glycemie", index),
        type: "text",
        unite: "g/L",
      },
      c?.rendezVous
        ? {
            icon: Calendar,
            label: "Rendez-vous lié",
            value: `${new Date(c.rendezVous.date).toLocaleDateString(
              "fr-FR"
            )} - ${c.rendezVous.description || "Non spécifié"}`,
            type: "text",
            unite: "",
          }
        : null,
    ];

    // Filter out null values and null fields
    return allFields.filter((field) => field !== null && field.value !== null);
  };

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
      setload(false);
      setConfig({
        title: "Nouveau patient ajouté !",
        description: "Le patient a été enregistré avec succès.",
      });
      setsuccessopen(true);

      setIsAddOpen(false);
      setSearch("");
      if (created?.id) {
        setlastid(created.id);
        setSelectedPatient(created);
      }
      await fetchPatients();

      return { success: true, data: created }; // ✅ return success
    } catch (err) {
      console.error("❌ handleAddPatient error:", err);
      return {
        success: false,
        error: err.message || "Erreur lors de la création du patient.",
      };
    }
  }

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[var(--color-50)] via-white to-[var(--color-100)]">
      <SuccessModal
        config={config}
        dialogOpen={successopen}
        setDialogOpen={(open) => {
          setsuccessopen(open);
          if (!open) {
            setCreatedConsultationData(null);
            setPrintingDoc(null);
          }
        }}
        loading={load}
      >
        {createdConsultationData && (
          <div className="w-full pt-2 pb-1 space-y-2.5">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-left space-y-2.5">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Documents disponibles pour impression
              </p>
              <div className="flex flex-col gap-2">
                {createdConsultationData.hasOrdonnance && (
                  <button
                    type="button"
                    onClick={handlePrintCreatedOrdonnance}
                    disabled={printingDoc === "ordonnance"}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 hover:bg-blue-100/80 dark:hover:bg-blue-900/50 transition font-medium text-sm shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <span>🖨️</span>
                      <span>Imprimer ordonnance</span>
                    </span>
                    {printingDoc === "ordonnance" && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    )}
                  </button>
                )}

                {createdConsultationData.hasBilan && (
                  <button
                    type="button"
                    onClick={handlePrintCreatedBilan}
                    disabled={printingDoc === "bilan"}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 transition font-medium text-sm shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <span>🖨️</span>
                      <span>Imprimer bilan</span>
                    </span>
                    {printingDoc === "bilan" && (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    )}
                  </button>
                )}

                {createdConsultationData.hasJustification && (
                  <button
                    type="button"
                    onClick={handlePrintCreatedJustification}
                    disabled={printingDoc === "justification"}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 hover:bg-purple-100/80 dark:hover:bg-purple-900/50 transition font-medium text-sm shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <span>🖨️</span>
                      <span>Imprimer justification</span>
                    </span>
                    {printingDoc === "justification" && (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </SuccessModal>

      {/* Keyboard Shortcuts Help Dialog */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[var(--color-800)] flex items-center gap-2">
                  <Keyboard size={24} />
                  Raccourcis clavier
                </h2>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { key: "Ctrl + S", desc: "Rechercher un patient" },
                  { key: "Ctrl + A", desc: "Nouveau patient" },
                  { key: "Ctrl + C", desc: "Nouvelle consultation" },
                  { key: "Ctrl + P", desc: "Nouvelle prescription/bilan" },
                  { key: "Ctrl + V", desc: "Onglet Vaccinations" },
                  { key: "Ctrl + I", desc: "Onglet Informations" },
                  { key: "Ctrl + /", desc: "Afficher les raccourcis" },
                  { key: "ESC", desc: "Fermer les dialogues" },
                ].map((shortcut, i) => (
                  <motion.div
                    key={shortcut.key}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex justify-between items-center p-3 bg-[var(--color-50)] rounded-lg"
                  >
                    <span className="text-gray-700">{shortcut.desc}</span>
                    <kbd className="px-3 py-1 bg-white border border-[var(--color-300)] rounded-md text-sm font-semibold text-[var(--color-700)] shadow-sm">
                      {shortcut.key}
                    </kbd>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <NewOrdanance
        open={openNewordanance}
        onOpenChange={setnewordanance}
        onsave={handlesaveOrdanance}
        selectedPatient={selectedPatient}
      />
      <AjouteModal
        onAdd={handleAddPatient}
        open={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
        }}
      />
      {/* Sidebar with Animation */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-60 h-screen bg-[var(--color-100)] rounded-tr-4xl p-6 pl-2 pr-2  pr-0flex flex-col border-r border-[var(--color-200)] fixed "
      >
        <div className="flex justify-between items-center mb-6">
          <motion.h2
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-[var(--color-800)]"
          >
            Patients
          </motion.h2>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Button
              onClick={() => setIsAddOpen(true)}
              className="rounded-full p-2 bg-[var(--color-600)] hover:bg-[var(--color-700)]"
            >
              <Plus size={16} />
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative mb-4"
        >
          <Input
            ref={searchRef}
            type="text"
            placeholder="Rechercher (Ctrl+S)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
          <Search
            className="absolute right-3 top-2.5 text-gray-400"
            size={16}
          />
        </motion.div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="overflow-y-auto p-1 flex-1 h-[calc(100vh-120px)]"
        >
          <AnimatePresence>
            {filteredPatients.map((patient, index) => (
              <motion.li
                key={patient.id}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPatient(patient)}
                className={`p-3 mb-2 rounded-lg cursor-pointer flex flex-col transition-all duration-200 ${
                  selectedPatient?.id === patient.id
                    ? "bg-[var(--color-600)] text-white shadow-lg"
                    : "bg-white text-gray-800 hover:bg-[var(--color-100)]"
                }`}
              >
                <p className="font-medium flex items-center gap-2">
                  <UserCircle size={16} /> {patient.nom}
                </p>
                <p className="text-sm flex items-center gap-2">
                  <User size={14} /> {patient.sexe}
                </p>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </motion.div>
      {/* Main Content */}
      <div className="flex-1 ml-50 p-6 px-0 pr-2 overflow-auto">
        {/* Keyboard shortcut hint button (hidden in Nouvelle Consultation where the floating save button is displayed) */}
        {selectedtab !== "+ Nouvelle Consultation" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowShortcuts(true)}
            className="fixed bottom-6 right-6 bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white rounded-full p-4 shadow-lg z-40"
            title="Raccourcis clavier (Ctrl+/)"
          >
            <Keyboard size={24} />
          </motion.button>
        )}

        {/* Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-6"
        >
          <div>
            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-3xl font-bold text-[var(--color-800)]"
            >
              {selectedPatient?.nom}
            </motion.h1>
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
              <ClipboardList size={16} />
              {!NewConsultation ? "Dernier diagnostic" : "Nouveau diagnostic"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedtab === "Prescriptions et Bilans" && (
              <ModernSearchBar
                onChange={handleChange}
                value={query.ord}
                placeholder="Rechercher par ID ou mot-clé..."
              />
            )}
            {selectedtab === "Visites" && (
              <ModernSearchBar
                onChange={handleChange}
                value={query.visites}
                placeholder="Rechercher une visite..."
              />
            )}
            {selectedtab === "Vaccinations" && (
              <ModernSearchBar
                onChange={handleChange}
                value={query.vaccination}
                placeholder="Rechercher un vaccin..."
              />
            )}

            {(selectedtab === "Visites" ||
              selectedtab === "Analyses et Résultats" ||
              selectedtab === "Prescriptions et Bilans" ||
              selectedtab === "Vaccinations") && (
              <DatePickerFilter
                value={
                  selectedtab === "Visites"
                    ? dateFilter.visites
                    : selectedtab === "Analyses et Résultats"
                    ? dateFilter.analyses
                    : selectedtab === "Prescriptions et Bilans"
                    ? dateFilter.ord
                    : dateFilter.vaccination
                }
                onChange={handleDateChange}
              />
            )}
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {selectedtab === "Vaccinations" ? (
              <AddVaccinationButton
                patientId={selectedPatient?.id}
                setrefrech={setrefrech}
              />
            ) : selectedtab === "Analyses et Résultats" ? (
              <Button
                onClick={() => setShowAddDialogNewAnalyse(true)}
                className="flex items-center gap-2 bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white font-medium px-5 py-2 rounded-xl shadow-md transition"
              >
                <Plus className="mr-2 h-4 w-4" /> Nouvelle analyse
              </Button>
            ) : selectedtab === "Prescriptions et Bilans" ? (
              <Button
                onClick={() => setnewordanance(true)}
                className="flex items-center gap-2 bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white font-medium px-5 py-2 rounded-xl shadow-md transition"
              >
                <Plus className="mr-2 h-4 w-4" /> Nouvelle Prescription/Bilan
              </Button>
            ) : selectedtab === "Visites" ||
              selectedtab === "Informations Patient" ? (
              <Button
                onClick={() => {
                  setNewConsultation(true);
                  setselectedtab("+ Nouvelle Consultation");
                }}
                className="bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
              >
                <Plus size={18} />
                Nouvelle Consultation
              </Button>
            ) : selectedtab === "+ Nouvelle Consultation" ? null : null}
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap sm:flex-nowrap border-b border-[var(--color-200)] mb-6 overflow-x-auto scrollbar-hide"
        >
          {[
            "Informations Patient",
            "Analyses et Résultats",
            "Vaccinations",
            "Courbe",
            "Visites",
            "Prescriptions et Bilans",
            "+ Nouvelle Consultation",
          ].map((tab, index) => (
            <motion.button
              key={tab}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setselectedtab(tab);
              }}
              className={`px-2 sm:px-2 py-2 text-sm sm:text-base font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                tab === selectedtab
                  ? "text-[var(--color-600)] border-[var(--color-600)]"
                  : "text-gray-600 border-transparent hover:text-[var(--color-600)] hover:border-[var(--color-300)]"
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {!selectedPatient ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-gray-500 text-center mt-10"
            >
              Aucune Patient.
            </motion.p>
          ) : (
            <motion.div
              key={selectedtab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {selectedtab === "Informations Patient" && (
                <>
                  {[
                    {
                      title: "Informations Générales",
                      icon: User,
                      data: selectedPatient
                        ? generalInfo(selectedPatient)
                        : null,
                    },
                    {
                      title: "Informations Médicales",
                      icon: Stethoscope,
                      data: selectedPatient
                        ? medicalInfo(selectedPatient, currentConsultationIndex)
                        : null,
                      isPaginated: true,
                    },
                    {
                      title: "Informations de Contact",
                      icon: Phone,
                      data: selectedPatient
                        ? contactInfo(selectedPatient)
                        : null,
                    },
                  ].map((section, sectionIndex) => (
                    <motion.div
                      key={section.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: sectionIndex * 0.1 }}
                      className="mb-6"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-[var(--color-700)] flex items-center gap-2">
                          <section.icon size={20} /> {section.title}
                        </h3>

                        {section.isPaginated &&
                          selectedPatient?.consultations?.length > 0 && (
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">
                                Consultation {currentConsultationIndex + 1} /{" "}
                                {selectedPatient.consultations.length}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(
                                  selectedPatient.consultations[
                                    currentConsultationIndex
                                  ]?.createdAt
                                ).toLocaleDateString("fr-FR")}
                              </span>
                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() =>
                                    setCurrentConsultationIndex((prev) =>
                                      Math.max(0, prev - 1)
                                    )
                                  }
                                  disabled={currentConsultationIndex === 0}
                                  className={`p-2 rounded-lg transition-all ${
                                    currentConsultationIndex === 0
                                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                      : "bg-[var(--color-100)] text-[var(--color-700)] hover:bg-[var(--color-200)]"
                                  }`}
                                >
                                  <ChevronLeft size={20} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() =>
                                    setCurrentConsultationIndex((prev) =>
                                      Math.min(
                                        selectedPatient.consultations.length -
                                          1,
                                        prev + 1
                                      )
                                    )
                                  }
                                  disabled={
                                    currentConsultationIndex ===
                                    selectedPatient.consultations.length - 1
                                  }
                                  className={`p-2 rounded-lg transition-all ${
                                    currentConsultationIndex ===
                                    selectedPatient.consultations.length - 1
                                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                      : "bg-[var(--color-100)] text-[var(--color-700)] hover:bg-[var(--color-200)]"
                                  }`}
                                >
                                  <ChevronRight size={20} />
                                </motion.button>
                              </div>
                            </div>
                          )}
                      </div>

                      {section?.data?.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {section.data.map((info, infoIndex) => (
                            <motion.div
                              key={info.label}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                delay: sectionIndex * 0.1 + infoIndex * 0.05,
                              }}
                              whileHover={{ scale: 1.02, y: -2 }}
                            >
                              <Card className="flex items-center gap-3 p-3 shadow-sm hover:shadow-md transition-shadow bg-white z-0">
                                <div className="flex flex-col w-full gap-2">
                                  <div className="flex items-center gap-2">
                                    <info.icon
                                      className="text-[var(--color-500)]"
                                      size={20}
                                    />
                                    <span className="text-gray-500 text-sm">
                                      {info.label}
                                    </span>
                                  </div>
                                  {info.type === "textarea" ? (
                                    <textarea
                                      rows={3}
                                      readOnly
                                      className="w-full border rounded-md p-2 text-sm text-gray-800 bg-gray-50"
                                      value={info.value || ""}
                                    />
                                  ) : (
                                    <span className="font-medium text-gray-900">
                                      {info.value} {info.unite}
                                    </span>
                                  )}
                                </div>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      ) : section.isPaginated ? (
                        <div className="text-center py-8 text-gray-500">
                          Aucune donnée médicale disponible pour cette
                          consultation
                        </div>
                      ) : null}
                    </motion.div>
                  ))}
                </>
              )}
              {selectedtab === "Courbe" && (
                <CourbePage patientID={selectedPatient?.id} />
              )}
              {selectedtab === "+ Nouvelle Consultation" && (
                <NewConsultationPage
                  onSave={handleOpenConsultationSaveModal}
                  selectedPatient={selectedPatient}
                  setViderForm={setViderForm}
                  viderForm={viderForm}
                />
              )}
              {selectedtab === "Analyses et Résultats" && (
                <Analyses
                  patientID={selectedPatient?.id}
                  ShowAddDialogNewAnalyse={ShowAddDialogNewAnalyse}
                  setShowAddDialogNewAnalyse={setShowAddDialogNewAnalyse}
                  dateFilter={dateFilter.analyses}
                />
              )}
              {selectedtab === "Vaccinations" && (
                <VaccinationsPage
                  refrech={refrech}
                  setrefrech={setrefrech}
                  patientId={selectedPatient?.id}
                  query={query.vaccination}
                  dateFilter={dateFilter.vaccination}
                />
              )}
              {selectedtab === "Visites" && (
                <PatientVisits
                  patientId={selectedPatient?.id}
                  query={query.visites}
                  dateFilter={dateFilter.visites}
                />
              )}
              {selectedtab === "Prescriptions et Bilans" && (
                <Ordonnances
                  patientId={selectedPatient?.id}
                  query={query.ord}
                  dateFilter={dateFilter.ord}
                  selectedPatient={selectedPatient}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Dialog
        open={DateTimeModal}
        onOpenChange={(open) => {
          setDataTimeModel(open);
          if (!open) {
            setModalSaveError("");
            setNewConsultationData(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl w-full max-h-[92vh] overflow-y-auto rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="text-left space-y-1 mb-1">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <span className="p-2 bg-[var(--color-100)] text-[var(--color-700)] rounded-xl">
                <FileText className="w-5 h-5" />
              </span>
              Enregistrer la consultation
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Vérifiez la date, l&rsquo;heure ainsi que les modalités de tarification et de règlement avant de valider.
            </DialogDescription>
          </DialogHeader>

          {modalSaveError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl font-medium">
              {modalSaveError}
            </div>
          )}

          <div className="space-y-4 py-1">
            {/* 1. Date & Heure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[var(--color-600)]" />
                  Date de la consultation
                </span>
                <input
                  type="date"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--color-500)] transition-all"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[var(--color-600)]" />
                  Heure de la consultation
                </span>
                <input
                  type="time"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--color-500)] transition-all"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </label>
            </div>

            {/* 2. 💰 Tarification & Règlement de la consultation */}
            <div className="bg-gradient-to-br from-amber-50/50 via-white to-slate-50 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-900 p-4 sm:p-5 rounded-2xl border border-amber-200/80 dark:border-slate-700 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-amber-100 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Tarification & Règlement de la Consultation
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Prix de l&rsquo;acte médical et encaissement du versement patient
                    </p>
                  </div>
                </div>

                {/* Quick status preview */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Statut initial :</span>
                  {modalRecordPayment && parseFloat(modalVersementInitial) >= parseFloat(modalPrice || 0) && parseFloat(modalPrice || 0) > 0 ? (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-lg">
                      Soldé (Payé)
                    </span>
                  ) : modalRecordPayment && parseFloat(modalVersementInitial) > 0 ? (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-lg">
                      Partiellement payé
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded-lg">
                      Impayé (Crédit)
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prix de la consultation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                    <span>Prix de la consultation (DZD) *</span>
                    <span className="text-2xs font-normal text-slate-400">
                      Défaut cabinet : {defaultConsultationPrice.toLocaleString()} DZD
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={modalPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setModalPrice(val);
                        if (modalRecordPayment && (modalVersementInitial === "" || modalVersementInitial === modalPrice)) {
                          setModalVersementInitial(val);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-[var(--color-500)] outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      placeholder="Ex: 2000"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      DZD
                    </span>
                  </div>
                </div>

                {/* Checkbox Activer versement initial */}
                <div className="flex flex-col justify-end space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Mode d&rsquo;encaissement
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !modalRecordPayment;
                      setModalRecordPayment(nextState);
                      if (nextState) {
                        setModalVersementInitial(modalPrice || String(defaultConsultationPrice));
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                      modalRecordPayment
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard className={`w-4 h-4 ${modalRecordPayment ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                      Enregistrer un versement immédiat
                    </span>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                        modalRecordPayment ? "bg-emerald-600 text-white" : "border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                      }`}
                    >
                      {modalRecordPayment && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                </div>

                {/* Fields when payment is enabled */}
                {modalRecordPayment && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Montant du versement (DZD) *
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setModalVersementInitial(modalPrice || String(defaultConsultationPrice))}
                            className="text-2xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            100%
                          </button>
                          <span className="text-slate-300 dark:text-slate-600 text-2xs">|</span>
                          <button
                            type="button"
                            onClick={() => setModalVersementInitial(String(Math.round((parseFloat(modalPrice) || 0) / 2)))}
                            className="text-2xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            50%
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={modalVersementInitial}
                          onChange={(e) => {
                            const val = e.target.value;
                            setModalVersementInitial(val);
                            const num = parseFloat(val);
                            const currentP = parseFloat(modalPrice) || 0;
                            if (!isNaN(num) && num > currentP) {
                              setModalPrice(String(num));
                            }
                          }}
                          className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-emerald-300 dark:border-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-800 text-emerald-900 dark:text-emerald-300"
                          placeholder="Ex: 2000"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          DZD
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Note / Mode de règlement
                      </label>
                      <input
                        type="text"
                        value={modalVersementNote}
                        onChange={(e) => setModalVersementNote(e.target.value)}
                        placeholder="Ex: Espèces, Chèque, Acompte..."
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-[var(--color-500)] outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Remaining Balance Indicator */}
                    <div className="md:col-span-2 flex items-center justify-between p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        Reste à payer après enregistrement :
                      </span>
                      <span className={`font-bold ${
                        Math.max(0, (parseFloat(modalPrice) || 0) - (parseFloat(modalVersementInitial) || 0)) === 0
                          ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "text-amber-600 dark:text-amber-400 font-bold"
                      }`}>
                        {Math.max(
                          0,
                          (parseFloat(modalPrice) || 0) - (parseFloat(modalVersementInitial) || 0)
                        ).toLocaleString()}{" "}
                        DZD
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCloseConsultationModal}
              className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={async () => {
                setModalSaveError("");
                const numPrice = parseFloat(String(modalPrice).replace(/\s+/g, "").replace(/,/g, "."));
                if (isNaN(numPrice) || numPrice < 0) {
                  setModalSaveError("Le prix de la consultation doit être un nombre positif ou nul.");
                  return;
                }
                let initialAmount = 0;
                if (modalRecordPayment) {
                  initialAmount = parseFloat(String(modalVersementInitial).replace(/\s+/g, "").replace(/,/g, "."));
                  if (isNaN(initialAmount) || initialAmount <= 0) {
                    setModalSaveError("Le montant du versement initial doit être supérieur à zéro.");
                    return;
                  }
                }
                const finalPrice = Math.max(numPrice, initialAmount);
                const payloadToSave = {
                  ...NewConsultationData,
                  prix: finalPrice,
                  versementInitial: modalRecordPayment ? initialAmount : 0,
                  versementNote: modalRecordPayment ? modalVersementNote : null,
                };

                setDataTimeModel(false);
                setNewConsultationData(null);
                try {
                  await addConsultation(payloadToSave);
                } catch (err) {
                  console.error("Erreur enregistrement consultation:", err);
                }
              }}
              disabled={!date || !time}
              className="px-5 py-2.5 text-sm rounded-xl bg-[var(--color-600)] text-white font-medium shadow-sm hover:bg-[var(--color-700)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer la consultation</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

