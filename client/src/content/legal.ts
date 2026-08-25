import type { Locale } from "@shared/i18n";

export const LEGAL_EFFECTIVE_DATE = "2026-04-01" as const;

export interface LegalListItem {
  label?: string;
  text: string;
}

export type LegalBlock =
  | { type: "paragraph"; text: string; privacyLink?: true; suffix?: string }
  | { type: "list"; items: readonly LegalListItem[] };

export interface LegalSection {
  id: string;
  heading: string;
  blocks: readonly LegalBlock[];
}

export interface LegalPageContent {
  title: string;
  updatedLabel: string;
  seo: {
    title: string;
    description: string;
  };
  sections: readonly LegalSection[];
  privacyLinkLabel?: string;
  privacyLinkHref?: "/privacy";
}

export interface LegalLocaleContent {
  privacy: LegalPageContent;
  terms: LegalPageContent & {
    privacyLinkLabel: string;
    privacyLinkHref: "/privacy";
  };
}

export const legalContent = {
  en: {
    privacy: {
      title: "Privacy Policy",
      updatedLabel: "Last updated: April 1, 2026",
      seo: {
        title: "Privacy Policy — Settle CLT",
        description:
          "Learn how Settle CLT collects, uses, and protects your personal information. Read our full privacy policy.",
      },
      sections: [
        {
          id: "information-we-collect",
          heading: "1. Information We Collect",
          blocks: [
            {
              type: "paragraph",
              text: "When you use Settle CLT, we may collect the following types of information:",
            },
            {
              type: "list",
              items: [
                {
                  label: "Account Information:",
                  text: "When you create an account, we collect your name and email address through our authentication provider.",
                },
                {
                  label: "Profile Data:",
                  text: "Information you voluntarily provide, such as neighborhood preferences, quiz responses, and passport stamps.",
                },
                {
                  label: "Submission and Lead Data:",
                  text: "Contact submissions, business listing submissions and claims, premium or business leads, and housing referral requests may include contact, message, and business details, such as your name, email, phone number, business information, housing preferences, budget range, and timeline.",
                },
                {
                  label: "Usage Data:",
                  text: "Usage and search analytics, including page views, search queries, and feature usage, may be associated with account, user, session, or pseudonymous identifiers. Authenticated searches persist with user IDs.",
                },
                {
                  label: "Reviews:",
                  text: "Content you submit as neighborhood or business reviews, including star ratings and text.",
                },
              ],
            },
          ],
        },
        {
          id: "how-we-use-information",
          heading: "2. How We Use Your Information",
          blocks: [
            { type: "paragraph", text: "We use the information we collect to:" },
            {
              type: "list",
              items: [
                { text: "Provide and personalize the Settle CLT platform experience and respond to submissions, review listings, claims, leads, and referrals, and support platform operations" },
                { text: "Review housing referral requests and, when appropriate, share them with independent real estate professionals or apartment locators; a referral or response is not guaranteed" },
                { text: "Send you newsletter updates about Charlotte (if you opted in)" },
                { text: "Track your CLT Passport stamps, bingo progress, and leaderboard ranking" },
                { text: "Improve our services through usage and search analytics that may use account, user, session, or pseudonymous identifiers" },
                { text: "Display your reviews to help other users make informed decisions" },
              ],
            },
          ],
        },
        {
          id: "information-sharing",
          heading: "3. Information Sharing",
          blocks: [
            {
              type: "paragraph",
              text: "We do not sell your personal information. We may share your information in the following limited circumstances:",
            },
            {
              type: "list",
              items: [
                {
                  label: "Referral Partners:",
                  text: "When you submit a housing referral request, we may review and share your contact information and preferences with independent real estate professionals or apartment locators when appropriate. A referral or response is not guaranteed.",
                },
                {
                  label: "Service Providers:",
                  text: "We use third-party services for notification, authentication, analytics (including Mixpanel), and hosting that may process data on our behalf to support responses, review, and platform operations.",
                },
                {
                  label: "Legal Requirements:",
                  text: "We may disclose information if required by law or to protect our rights.",
                },
              ],
            },
          ],
        },
        {
          id: "real-estate-referral-disclosures",
          heading: "4. Real Estate Referral Disclosures",
          blocks: [
            {
              type: "paragraph",
              text: "We may review and share your housing request with an independent licensed real estate professional or apartment locator when appropriate; a referral or response is not guaranteed. Settle CLT may receive a referral fee where permitted and disclosed if a referral results in a transaction. You are under no obligation to respond to or work with any professional. Independently verify any professional's license with the North Carolina Real Estate Commission (NCREC) at www.ncrec.gov.",
            },
          ],
        },
        {
          id: "cookies-and-tracking",
          heading: "5. Cookies and Tracking",
          blocks: [
            {
              type: "paragraph",
              text: "We use essential cookies for authentication and session management. We also use Mixpanel for usage analytics that may be associated with account, user, session, or pseudonymous identifiers. You can disable cookies in your browser settings, though this may affect some features of the platform.",
            },
          ],
        },
        {
          id: "data-security",
          heading: "6. Data Security",
          blocks: [
            {
              type: "paragraph",
              text: "We implement reasonable security measures to protect your personal information, including encrypted connections (HTTPS), secure authentication, and access controls. However, no method of transmission over the internet is 100% secure.",
            },
          ],
        },
        {
          id: "your-rights",
          heading: "7. Your Rights",
          blocks: [
            { type: "paragraph", text: "You have the right to:" },
            {
              type: "list",
              items: [
                { text: "Access the personal information we hold about you" },
                { text: "Request correction of inaccurate information" },
                { text: "Request deletion of your account and associated data; deletion requests remain subject to legal and operational retention requirements" },
                { text: "Opt out of newsletter communications at any time through your profile settings" },
                { text: "Withdraw consent for data processing where applicable" },
              ],
            },
          ],
        },
        {
          id: "childrens-privacy",
          heading: "8. Children's Privacy",
          blocks: [
            {
              type: "paragraph",
              text: "Settle CLT is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.",
            },
          ],
        },
        {
          id: "changes-to-policy",
          heading: "9. Changes to This Policy",
          blocks: [
            {
              type: "paragraph",
              text: "We may update this Privacy Policy from time to time. We will notify users of material changes by updating the \"Last updated\" date at the top of this page.",
            },
          ],
        },
        {
          id: "contact-us",
          heading: "10. Contact Us",
          blocks: [
            {
              type: "paragraph",
              text: "If you have questions about this Privacy Policy or your personal data, please contact us through the Settle CLT platform or at the email address provided in your account settings.",
            },
          ],
        },
      ],
    },
    terms: {
      title: "Terms of Service",
      updatedLabel: "Last updated: April 1, 2026",
      seo: {
        title: "Terms of Service — Settle CLT",
        description:
          "Read the Terms of Service for using the Settle CLT platform, including user responsibilities, referral disclosures, and content policies.",
      },
      privacyLinkLabel: "Privacy Policy",
      privacyLinkHref: "/privacy",
      sections: [
        {
          id: "acceptance-of-terms",
          heading: "1. Acceptance of Terms",
          blocks: [
            {
              type: "paragraph",
              text: "By accessing or using Settle CLT (\"the Platform\"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. Settle CLT reserves the right to modify these terms at any time, and your continued use constitutes acceptance of any changes.",
            },
          ],
        },
        {
          id: "description-of-service",
          heading: "2. Description of Service",
          blocks: [
            {
              type: "paragraph",
              text: "Settle CLT is a community platform designed to help people discover, explore, and settle into Charlotte, North Carolina. The Platform provides neighborhood guides, a local business directory, event listings, gamification features (CLT Passport, Bingo), a neighborhood quiz, blog content, and housing referral services. The Platform is provided \"as is\" and may be updated, modified, or discontinued at any time.",
            },
          ],
        },
        {
          id: "user-accounts",
          heading: "3. User Accounts",
          blocks: [
            {
              type: "paragraph",
              text: "Some features require creating an account. By creating an account, you agree to:",
            },
            {
              type: "list",
              items: [
                { text: "Provide accurate and complete information" },
                { text: "Maintain the security of your account credentials" },
                { text: "Accept responsibility for all activity under your account" },
                { text: "Notify us immediately of any unauthorized use" },
              ],
            },
            {
              type: "paragraph",
              text: "We reserve the right to suspend or terminate accounts that violate these terms.",
            },
          ],
        },
        {
          id: "user-content",
          heading: "4. User Content",
          blocks: [
            {
              type: "paragraph",
              text: "You may submit content to the Platform, including reviews, event submissions, and business listings. By submitting content, you:",
            },
            {
              type: "list",
              items: [
                { text: "Grant Settle CLT a non-exclusive, royalty-free license to display, distribute, and use your content on the Platform" },
                { text: "Represent that your content is original, accurate, and does not infringe on any third-party rights" },
                { text: "Agree not to submit content that is defamatory, obscene, harassing, or otherwise objectionable" },
                { text: "Acknowledge that Settle CLT may moderate, edit, or remove content at its discretion" },
              ],
            },
          ],
        },
        {
          id: "housing-referral-services",
          heading: "5. Housing Referral Services",
          blocks: [
            {
              type: "paragraph",
              text: "Settle CLT offers a housing request review service (\"Find Your Home\"). By using this service:",
            },
            {
              type: "list",
              items: [
                { text: "Settle CLT may review and share your request only when appropriate, including with an independent licensed real estate professional or apartment locator" },
                { text: "A referral or response is not guaranteed" },
                { text: "Settle CLT may receive a referral fee where permitted and disclosed if a referral results in a transaction" },
                { text: "Any professional relationship is independent of Settle CLT" },
                { text: "You are under no obligation to respond to or work with any professional" },
                { text: "Independently verify any professional's license with the North Carolina Real Estate Commission (NCREC) at www.ncrec.gov" },
              ],
            },
          ],
        },
        {
          id: "business-listings",
          heading: "6. Business Listings",
          blocks: [
            {
              type: "paragraph",
              text: "Business information in the directory is provided for informational purposes only. While we strive for accuracy, Settle CLT does not guarantee that business hours, addresses, contact information, or other details are current or correct. Business owners may request corrections or removal of their listing by contacting us.",
            },
          ],
        },
        {
          id: "event-listings",
          heading: "7. Event Listings",
          blocks: [
            {
              type: "paragraph",
              text: "Event information is sourced from public sources and community submissions. Settle CLT does not organize or host the listed events (unless explicitly stated) and is not responsible for event cancellations, changes, or the accuracy of event details. Always verify event information with the official organizer before attending.",
            },
          ],
        },
        {
          id: "intellectual-property",
          heading: "8. Intellectual Property",
          blocks: [
            {
              type: "paragraph",
              text: "The Settle CLT name, logo, design, and original content are the property of Settle CLT. You may not reproduce, distribute, or create derivative works from the Platform's content without written permission. Third-party trademarks and content belong to their respective owners.",
            },
          ],
        },
        {
          id: "limitation-of-liability",
          heading: "9. Limitation of Liability",
          blocks: [
            {
              type: "paragraph",
              text: "Settle CLT is provided \"as is\" without warranties of any kind, express or implied. To the fullest extent permitted by law, Settle CLT shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, including but not limited to reliance on business listings, event information, neighborhood data, or housing referrals.",
            },
          ],
        },
        {
          id: "prohibited-conduct",
          heading: "10. Prohibited Conduct",
          blocks: [
            { type: "paragraph", text: "You agree not to:" },
            {
              type: "list",
              items: [
                { text: "Use the Platform for any unlawful purpose" },
                { text: "Scrape, crawl, or harvest data from the Platform without permission" },
                { text: "Impersonate another person or entity" },
                { text: "Submit false reviews or misleading business information" },
                { text: "Attempt to gain unauthorized access to the Platform or its systems" },
                { text: "Interfere with or disrupt the Platform's operation" },
              ],
            },
          ],
        },
        {
          id: "governing-law",
          heading: "11. Governing Law",
          blocks: [
            {
              type: "paragraph",
              text: "These Terms of Service are governed by and construed in accordance with the laws of the State of North Carolina, without regard to its conflict of law provisions. Any disputes arising from these terms shall be resolved in the courts of Mecklenburg County, North Carolina.",
            },
          ],
        },
        {
          id: "contact",
          heading: "12. Contact",
          blocks: [
            {
              type: "paragraph",
              text: "For questions about these Terms of Service, please contact us through the Settle CLT platform. For our data practices, please review our ",
              privacyLink: true,
              suffix: ".",
            },
          ],
        },
      ],
    },
  },
  es: {
    privacy: {
      title: "Política de Privacidad",
      updatedLabel: "Última actualización: 1 de abril de 2026",
      seo: {
        title: "Política de Privacidad — Settle CLT",
        description:
          "Conozca cómo Settle CLT recopila, usa y protege su información personal. Lea nuestra política de privacidad completa.",
      },
      sections: [
        {
          id: "information-we-collect",
          heading: "1. Información que Recopilamos",
          blocks: [
            {
              type: "paragraph",
              text: "Cuando usa Settle CLT, podemos recopilar los siguientes tipos de información:",
            },
            {
              type: "list",
              items: [
                {
                  label: "Información de la Cuenta:",
                  text: "Cuando crea una cuenta, recopilamos su nombre y dirección de correo electrónico a través de nuestro proveedor de autenticación.",
                },
                {
                  label: "Datos del Perfil:",
                  text: "Información que proporciona voluntariamente, como preferencias de vecindarios, respuestas al cuestionario y sellos del pasaporte.",
                },
                {
                  label: "Datos de Envíos y Clientes Potenciales:",
                  text: "Los formularios de contacto, las publicaciones y reclamaciones de fichas de negocios, los clientes potenciales premium o comerciales y las solicitudes de referencia de vivienda pueden incluir datos de contacto, mensajes y negocios, como su nombre, correo electrónico, número de teléfono, información comercial, preferencias de vivienda, rango de presupuesto y plazo.",
                },
                {
                  label: "Datos de Uso:",
                  text: "Los análisis de uso y búsqueda, incluidas las visualizaciones de páginas, las consultas de búsqueda y el uso de funciones, pueden estar asociados con identificadores de cuenta, usuario, sesión o seudónimos. Las búsquedas autenticadas persisten con ID de usuario.",
                },
                {
                  label: "Reseñas:",
                  text: "Contenido que envía como reseñas de vecindarios o negocios, incluidas las calificaciones con estrellas y el texto.",
                },
              ],
            },
          ],
        },
        {
          id: "how-we-use-information",
          heading: "2. Cómo Usamos su Información",
          blocks: [
            { type: "paragraph", text: "Usamos la información que recopilamos para:" },
            {
              type: "list",
              items: [
                { text: "Proporcionar y personalizar la experiencia de Settle CLT, responder a los envíos, revisar fichas, reclamaciones, clientes potenciales y referencias, y respaldar las operaciones de la plataforma" },
                { text: "Revisar solicitudes de referencia de vivienda y, cuando corresponda, compartirlas con profesionales independientes de bienes raíces o localizadores de apartamentos; no se garantiza una referencia ni una respuesta" },
                { text: "Enviarle actualizaciones del boletín sobre Charlotte (si optó por recibirlas)" },
                { text: "Registrar sus sellos del Pasaporte CLT, su progreso en el bingo y su posición en la clasificación" },
                { text: "Mejorar nuestros servicios mediante análisis de uso y búsqueda que pueden utilizar identificadores de cuenta, usuario, sesión o seudónimos" },
                { text: "Mostrar sus reseñas para ayudar a otros usuarios a tomar decisiones informadas" },
              ],
            },
          ],
        },
        {
          id: "information-sharing",
          heading: "3. Divulgación de Información",
          blocks: [
            {
              type: "paragraph",
              text: "No vendemos su información personal. Podemos compartir su información en las siguientes circunstancias limitadas:",
            },
            {
              type: "list",
              items: [
                {
                  label: "Socios de Referencia:",
                  text: "Cuando envía una solicitud de referencia de vivienda, podemos revisar y compartir su información de contacto y sus preferencias con profesionales independientes de bienes raíces o localizadores de apartamentos cuando corresponda. No se garantiza una referencia ni una respuesta.",
                },
                {
                  label: "Proveedores de Servicios:",
                  text: "Usamos servicios de terceros para notificaciones, autenticación, análisis (incluido Mixpanel) y alojamiento que pueden procesar datos en nuestro nombre para respaldar respuestas, revisiones y operaciones de la plataforma.",
                },
                {
                  label: "Requisitos Legales:",
                  text: "Podemos divulgar información si la ley lo exige o para proteger nuestros derechos.",
                },
              ],
            },
          ],
        },
        {
          id: "real-estate-referral-disclosures",
          heading: "4. Divulgaciones sobre Referencias de Bienes Raíces",
          blocks: [
            {
              type: "paragraph",
              text: "Podemos revisar y compartir su solicitud de vivienda con un profesional inmobiliario independiente con licencia o un localizador de apartamentos cuando corresponda; no se garantiza una referencia ni una respuesta. Settle CLT puede recibir una tarifa de referencia, cuando esté permitido y se divulgue, si una referencia resulta en una transacción. Usted no tiene ninguna obligación de responder ni de trabajar con ningún profesional. Verifique de forma independiente la licencia de cualquier profesional con la Comisión de Bienes Raíces de Carolina del Norte (NCREC) en www.ncrec.gov.",
            },
          ],
        },
        {
          id: "cookies-and-tracking",
          heading: "5. Cookies y Seguimiento",
          blocks: [
            {
              type: "paragraph",
              text: "Usamos cookies esenciales para la autenticación y la administración de sesiones. También usamos Mixpanel para análisis de uso que pueden estar asociados con identificadores de cuenta, usuario, sesión o seudónimos. Puede desactivar las cookies en la configuración de su navegador, aunque esto puede afectar algunas funciones de la plataforma.",
            },
          ],
        },
        {
          id: "data-security",
          heading: "6. Seguridad de los Datos",
          blocks: [
            {
              type: "paragraph",
              text: "Implementamos medidas de seguridad razonables para proteger su información personal, incluidas conexiones cifradas (HTTPS), autenticación segura y controles de acceso. Sin embargo, ningún método de transmisión por internet es 100 % seguro.",
            },
          ],
        },
        {
          id: "your-rights",
          heading: "7. Sus Derechos",
          blocks: [
            { type: "paragraph", text: "Usted tiene derecho a:" },
            {
              type: "list",
              items: [
                { text: "Acceder a la información personal que mantenemos sobre usted" },
                { text: "Solicitar la corrección de información inexacta" },
                { text: "Solicitar la eliminación de su cuenta y de los datos asociados; las solicitudes de eliminación siguen sujetas a requisitos de retención legal y operativa" },
                { text: "Dejar de recibir comunicaciones del boletín en cualquier momento mediante la configuración de su perfil" },
                { text: "Retirar su consentimiento para el procesamiento de datos cuando corresponda" },
              ],
            },
          ],
        },
        {
          id: "childrens-privacy",
          heading: "8. Privacidad de los Menores",
          blocks: [
            {
              type: "paragraph",
              text: "Settle CLT no está destinado a menores de 13 años. No recopilamos deliberadamente información personal de menores de 13 años.",
            },
          ],
        },
        {
          id: "changes-to-policy",
          heading: "9. Cambios a esta Política",
          blocks: [
            {
              type: "paragraph",
              text: "Podemos actualizar esta Política de Privacidad ocasionalmente. Notificaremos a los usuarios sobre cambios sustanciales mediante la actualización de la fecha de \"Última actualización\" en la parte superior de esta página.",
            },
          ],
        },
        {
          id: "contact-us",
          heading: "10. Contáctenos",
          blocks: [
            {
              type: "paragraph",
              text: "Si tiene preguntas sobre esta Política de Privacidad o sus datos personales, comuníquese con nosotros a través de la plataforma Settle CLT o en la dirección de correo electrónico proporcionada en la configuración de su cuenta.",
            },
          ],
        },
      ],
    },
    terms: {
      title: "Términos de Servicio",
      updatedLabel: "Última actualización: 1 de abril de 2026",
      seo: {
        title: "Términos de Servicio — Settle CLT",
        description:
          "Lea los Términos de Servicio para usar la plataforma Settle CLT, incluidas las responsabilidades del usuario, las divulgaciones de referencias y las políticas de contenido.",
      },
      privacyLinkLabel: "Política de Privacidad",
      privacyLinkHref: "/privacy",
      sections: [
        {
          id: "acceptance-of-terms",
          heading: "1. Aceptación de los Términos",
          blocks: [
            {
              type: "paragraph",
              text: "Al acceder o usar Settle CLT (\"la Plataforma\"), usted acepta quedar obligado por estos Términos de Servicio. Si no acepta estos términos, no use la Plataforma. Settle CLT se reserva el derecho de modificar estos términos en cualquier momento, y su uso continuado constituye la aceptación de cualquier cambio.",
            },
          ],
        },
        {
          id: "description-of-service",
          heading: "2. Descripción del Servicio",
          blocks: [
            {
              type: "paragraph",
              text: "Settle CLT es una plataforma comunitaria diseñada para ayudar a las personas a descubrir, explorar y establecerse en Charlotte, Carolina del Norte. La Plataforma proporciona guías de vecindarios, un directorio de negocios locales, listados de eventos, funciones de gamificación (Pasaporte CLT, Bingo), un cuestionario de vecindarios, contenido de blog y servicios de referencia de vivienda. La Plataforma se proporciona \"tal cual\" y puede ser actualizada, modificada o descontinuada en cualquier momento.",
            },
          ],
        },
        {
          id: "user-accounts",
          heading: "3. Cuentas de Usuario",
          blocks: [
            {
              type: "paragraph",
              text: "Algunas funciones requieren crear una cuenta. Al crear una cuenta, usted acepta:",
            },
            {
              type: "list",
              items: [
                { text: "Proporcionar información exacta y completa" },
                { text: "Mantener la seguridad de las credenciales de su cuenta" },
                { text: "Aceptar la responsabilidad por toda actividad realizada en su cuenta" },
                { text: "Notificarnos de inmediato sobre cualquier uso no autorizado" },
              ],
            },
            {
              type: "paragraph",
              text: "Nos reservamos el derecho de suspender o cancelar las cuentas que infrinjan estos términos.",
            },
          ],
        },
        {
          id: "user-content",
          heading: "4. Contenido del Usuario",
          blocks: [
            {
              type: "paragraph",
              text: "Puede enviar contenido a la Plataforma, incluidas reseñas, propuestas de eventos y listados de negocios. Al enviar contenido, usted:",
            },
            {
              type: "list",
              items: [
                { text: "Otorga a Settle CLT una licencia no exclusiva y libre de regalías para mostrar, distribuir y usar su contenido en la Plataforma" },
                { text: "Declara que su contenido es original, exacto y no infringe los derechos de terceros" },
                { text: "Acepta no enviar contenido difamatorio, obsceno, acosador o de otro modo objetable" },
                { text: "Reconoce que Settle CLT puede moderar, editar o eliminar contenido a su discreción" },
              ],
            },
          ],
        },
        {
          id: "housing-referral-services",
          heading: "5. Servicios de Referencia de Vivienda",
          blocks: [
            {
              type: "paragraph",
              text: "Settle CLT ofrece un servicio de revisión de solicitudes de vivienda (\"Find Your Home\"). Al usar este servicio:",
            },
            {
              type: "list",
              items: [
                { text: "Settle CLT puede revisar y compartir su solicitud solo cuando corresponda, incluso con un profesional inmobiliario independiente con licencia o un localizador de apartamentos" },
                { text: "No se garantiza una referencia ni una respuesta" },
                { text: "Settle CLT puede recibir una tarifa de referencia, cuando esté permitido y se divulgue, si una referencia resulta en una transacción" },
                { text: "Toda relación profesional es independiente de Settle CLT" },
                { text: "Usted no tiene ninguna obligación de responder ni de trabajar con ningún profesional" },
                { text: "Verifique de forma independiente la licencia de cualquier profesional con la Comisión de Bienes Raíces de Carolina del Norte (NCREC) en www.ncrec.gov" },
              ],
            },
          ],
        },
        {
          id: "business-listings",
          heading: "6. Listados de Negocios",
          blocks: [
            {
              type: "paragraph",
              text: "La información de negocios del directorio se proporciona únicamente con fines informativos. Aunque procuramos que sea exacta, Settle CLT no garantiza que los horarios, las direcciones, la información de contacto u otros detalles de los negocios estén actualizados o sean correctos. Los propietarios de negocios pueden solicitar correcciones o la eliminación de su listado comunicándose con nosotros.",
            },
          ],
        },
        {
          id: "event-listings",
          heading: "7. Listados de Eventos",
          blocks: [
            {
              type: "paragraph",
              text: "La información de eventos proviene de fuentes públicas y propuestas de la comunidad. Settle CLT no organiza ni presenta los eventos listados (salvo que se indique expresamente) y no es responsable de cancelaciones, cambios ni de la exactitud de los detalles de los eventos. Verifique siempre la información del evento con el organizador oficial antes de asistir.",
            },
          ],
        },
        {
          id: "intellectual-property",
          heading: "8. Propiedad Intelectual",
          blocks: [
            {
              type: "paragraph",
              text: "El nombre, el logotipo, el diseño y el contenido original de Settle CLT son propiedad de Settle CLT. No puede reproducir, distribuir ni crear obras derivadas del contenido de la Plataforma sin autorización por escrito. Las marcas comerciales y el contenido de terceros pertenecen a sus respectivos propietarios.",
            },
          ],
        },
        {
          id: "limitation-of-liability",
          heading: "9. Limitación de Responsabilidad",
          blocks: [
            {
              type: "paragraph",
              text: "Settle CLT se proporciona \"tal cual\", sin garantías de ningún tipo, expresas o implícitas. En la máxima medida permitida por la ley, Settle CLT no será responsable de daños indirectos, incidentales, especiales, consecuentes o punitivos que surjan de su uso de la Plataforma, incluidos, entre otros, los derivados de confiar en listados de negocios, información de eventos, datos de vecindarios o referencias de vivienda.",
            },
          ],
        },
        {
          id: "prohibited-conduct",
          heading: "10. Conducta Prohibida",
          blocks: [
            { type: "paragraph", text: "Usted acepta no:" },
            {
              type: "list",
              items: [
                { text: "Usar la Plataforma para ningún propósito ilegal" },
                { text: "Extraer, rastrear o recopilar datos de la Plataforma sin autorización" },
                { text: "Suplantar a otra persona o entidad" },
                { text: "Enviar reseñas falsas o información engañosa sobre negocios" },
                { text: "Intentar obtener acceso no autorizado a la Plataforma o a sus sistemas" },
                { text: "Interferir o interrumpir el funcionamiento de la Plataforma" },
              ],
            },
          ],
        },
        {
          id: "governing-law",
          heading: "11. Ley Aplicable",
          blocks: [
            {
              type: "paragraph",
              text: "Estos Términos de Servicio se rigen e interpretan de acuerdo con las leyes del Estado de Carolina del Norte, sin tener en cuenta sus disposiciones sobre conflicto de leyes. Toda disputa que surja de estos términos se resolverá en los tribunales del condado de Mecklenburg, Carolina del Norte.",
            },
          ],
        },
        {
          id: "contact",
          heading: "12. Contacto",
          blocks: [
            {
              type: "paragraph",
              text: "Si tiene preguntas sobre estos Términos de Servicio, comuníquese con nosotros a través de la plataforma Settle CLT. Para conocer nuestras prácticas de datos, consulte nuestra ",
              privacyLink: true,
              suffix: ".",
            },
          ],
        },
      ],
    },
  },
} satisfies Record<Locale, LegalLocaleContent>;

export function legalPageText(page: LegalPageContent): string {
  return [
    page.title,
    page.updatedLabel,
    ...page.sections.flatMap(section => [
      section.heading,
      ...section.blocks.flatMap(block =>
        block.type === "paragraph"
          ? [
              block.text,
              ...(block.privacyLink && page.privacyLinkLabel
                ? [page.privacyLinkLabel, block.suffix ?? ""]
                : []),
            ]
          : block.items.flatMap(item => [item.label ?? "", item.text])
      ),
    ]),
  ]
    .filter(Boolean)
    .join(" ");
}
