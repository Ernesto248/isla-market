"use client";

import { useEffect } from "react";

/**
 * Componente que captura el código de referido de la URL y lo guarda en localStorage
 * Se ejecuta en el cliente tan pronto como la página carga
 */
export function ReferralCapture() {
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === "undefined") return;

    // Capturar código de referido de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get("ref");

    if (refParam) {
      console.log("[REFERRAL-CAPTURE] Código de referido detectado:", refParam);

      // Guardar inmediatamente en localStorage
      localStorage.setItem("pending_referral_code", refParam.toUpperCase());

      console.log("[REFERRAL-CAPTURE] Código guardado en localStorage");

      // Opcional: Limpiar la URL para que no se vea el parámetro
      // pero mantener el código en localStorage
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);

      console.log(
        "[REFERRAL-CAPTURE] URL limpiada, código permanece en localStorage"
      );
    } else {
      // Verificar si hay un código pendiente en localStorage
      const pendingCode = localStorage.getItem("pending_referral_code");
      if (pendingCode) {
        console.log(
          "[REFERRAL-CAPTURE] Código pendiente en localStorage:",
          pendingCode
        );
      }
    }
  }, []);

  // Este componente no renderiza nada
  return null;
}
