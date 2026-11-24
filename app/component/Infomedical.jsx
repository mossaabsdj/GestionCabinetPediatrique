"use client";

import PatientVisits from "./Visites/page";

export default function VisitsInfoModal(props) {
  return <PatientVisits modalOnly={true} {...props} />;
}
