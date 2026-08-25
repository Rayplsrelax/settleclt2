import type { Locale } from "./i18n";

export type HousingCopy = {
  request: string;
  success: string;
  disclosure: string;
  ownerNotice: string;
};

export const HOUSING_COPY = {
  en: {
    request:
      "Submit a Charlotte-area housing request for review. Settle CLT may share it with a licensed real estate professional. A referral or response is not guaranteed.",
    success:
      "Your housing request was received for review. Settle CLT may share it with a licensed real estate professional. A referral or response is not guaranteed.",
    disclosure:
      "Settle CLT may share your request with a licensed real estate professional and may receive a referral fee where permitted and disclosed if you choose to work with a referred professional. You are under no obligation to do so. A referral or response is not guaranteed. Independently verify the professional's current license status with the North Carolina Real Estate Commission (NCREC).",
    ownerNotice:
      "Housing request contract: review the request; sharing it with a licensed real estate professional is optional, and a referral, response, or timing is not guaranteed.",
  },
  es: {
    request:
      "Envía una solicitud de vivienda del área de Charlotte para revisión. Settle CLT puede compartirla con un profesional inmobiliario con licencia. No se garantiza una referencia ni una respuesta.",
    success:
      "Recibimos tu solicitud de vivienda para revisión. Settle CLT puede compartirla con un profesional inmobiliario con licencia. No se garantiza una referencia ni una respuesta.",
    disclosure:
      "Settle CLT puede compartir tu solicitud con un profesional inmobiliario con licencia y puede recibir una tarifa de referencia, cuando esté permitido y se divulgue, si decides trabajar con un profesional referido. No tienes ninguna obligación de hacerlo. No se garantiza una referencia ni una respuesta. Verifica de forma independiente el estado actual de la licencia del profesional con la Comisión de Bienes Raíces de Carolina del Norte (NCREC).",
    ownerNotice:
      "Contrato de solicitud de vivienda: revisa la solicitud; compartirla con un profesional inmobiliario con licencia es opcional y no se garantiza una referencia, respuesta ni plazo.",
  },
} satisfies Record<Locale, HousingCopy>;
