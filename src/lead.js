const MAX_FIELD_LENGTH = 2000;
const PERSONAL_DATA_CONSENT_VERSION = "pd-consent-v1-2026-05-01";
const PRIVACY_POLICY_VERSION = "privacy-v1-2026-05-01";
const MARKETING_CONSENT_VERSION = "marketing-v1-2026-05-01";

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, MAX_FIELD_LENGTH);
}

function cleanPhone(value) {
  const raw = String(value || "").trim();
  const startsWithPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  return `${startsWithPlus ? "+" : ""}${digits}`.slice(0, 32);
}

function toBoolean(value) {
  return value === true || value === "true" || value === "on" || value === "1" || value === "yes";
}

function normalizeLead(input) {
  const marketingConsent = toBoolean(input.marketing_consent);

  return {
    name: cleanText(input.name),
    phone: cleanPhone(input.phone),
    message: cleanText(input.message),
    form_id: cleanText(input.form_id),
    page_url: cleanText(input.page_url),
    submitted_at: cleanText(input.submitted_at),
    personal_data_consent: toBoolean(input.personal_data_consent),
    personal_data_consent_text_version: PERSONAL_DATA_CONSENT_VERSION,
    privacy_policy_version: PRIVACY_POLICY_VERSION,
    marketing_consent: marketingConsent,
    marketing_consent_version: marketingConsent ? MARKETING_CONSENT_VERSION : "",
    user_agent: cleanText(input.user_agent),
    utm_source: cleanText(input.utm_source),
    utm_medium: cleanText(input.utm_medium),
    utm_campaign: cleanText(input.utm_campaign),
    ym_client_id: cleanText(input.ym_client_id),
    ip_address: cleanText(input.ip_address)
  };
}

function validateLead(input) {
  const lead = normalizeLead(input);
  const errors = {};

  if (!lead.name) {
    errors.name = "Укажите имя";
  }

  if (lead.phone.replace(/\D/g, "").length < 10) {
    errors.phone = "Укажите телефон полностью";
  }

  if (!lead.message) {
    errors.message = "Опишите, что с машиной";
  }

  if (!lead.personal_data_consent) {
    errors.personal_data_consent = "Чтобы отправить заявку, необходимо дать согласие на обработку персональных данных";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    lead
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildLeadEmail(lead) {
  const safe = {
    name: escapeHtml(lead.name),
    phone: escapeHtml(lead.phone),
    message: escapeHtml(lead.message),
    form_id: escapeHtml(lead.form_id || "не передан"),
    page_url: escapeHtml(lead.page_url || "не передан"),
    submitted_at: escapeHtml(lead.submitted_at || "не передано"),
    personal_data_consent_text_version: escapeHtml(lead.personal_data_consent_text_version || PERSONAL_DATA_CONSENT_VERSION),
    privacy_policy_version: escapeHtml(lead.privacy_policy_version || PRIVACY_POLICY_VERSION),
    marketing_consent_version: escapeHtml(lead.marketing_consent_version || ""),
    user_agent: escapeHtml(lead.user_agent || "не передан"),
    utm_source: escapeHtml(lead.utm_source || ""),
    utm_medium: escapeHtml(lead.utm_medium || ""),
    utm_campaign: escapeHtml(lead.utm_campaign || ""),
    ym_client_id: escapeHtml(lead.ym_client_id || ""),
    ip_address: escapeHtml(lead.ip_address || "не определён")
  };

  const marketingText = lead.marketing_consent ? `да, версия ${lead.marketing_consent_version}` : "нет";

  return {
    subject: "Новая заявка с сайта Груз-Сервис",
    text: [
      "Новая заявка с сайта Груз-Сервис",
      "",
      `Имя: ${lead.name}`,
      `Телефон: ${lead.phone}`,
      "",
      "Что с машиной:",
      lead.message,
      "",
      "Технические данные и согласия:",
      `ID формы: ${lead.form_id || "не передан"}`,
      `URL страницы: ${lead.page_url || "не передан"}`,
      `Время отправки: ${lead.submitted_at || "не передано"}`,
      `IP: ${lead.ip_address || "не определён"}`,
      `User-Agent: ${lead.user_agent || "не передан"}`,
      `UTM source: ${lead.utm_source || ""}`,
      `UTM medium: ${lead.utm_medium || ""}`,
      `UTM campaign: ${lead.utm_campaign || ""}`,
      `YM client id: ${lead.ym_client_id || ""}`,
      `Согласие на ПДн: да, версия ${lead.personal_data_consent_text_version || PERSONAL_DATA_CONSENT_VERSION}`,
      `Версия политики ПДн: ${lead.privacy_policy_version || PRIVACY_POLICY_VERSION}`,
      `Рекламное согласие: ${marketingText}`
    ].join("\n"),
    html: `
      <h2>Новая заявка с сайта Груз-Сервис</h2>
      <p><strong>Имя:</strong> ${safe.name}</p>
      <p><strong>Телефон:</strong> <a href="tel:${safe.phone}">${safe.phone}</a></p>
      <p><strong>Что с машиной:</strong></p>
      <p>${safe.message}</p>
      <h3>Технические данные и согласия</h3>
      <ul>
        <li><strong>ID формы:</strong> ${safe.form_id}</li>
        <li><strong>URL страницы:</strong> ${safe.page_url}</li>
        <li><strong>Время отправки:</strong> ${safe.submitted_at}</li>
        <li><strong>IP:</strong> ${safe.ip_address}</li>
        <li><strong>User-Agent:</strong> ${safe.user_agent}</li>
        <li><strong>UTM source:</strong> ${safe.utm_source}</li>
        <li><strong>UTM medium:</strong> ${safe.utm_medium}</li>
        <li><strong>UTM campaign:</strong> ${safe.utm_campaign}</li>
        <li><strong>YM client id:</strong> ${safe.ym_client_id}</li>
        <li><strong>Согласие на ПДн:</strong> да, версия ${safe.personal_data_consent_text_version}</li>
        <li><strong>Версия политики ПДн:</strong> ${safe.privacy_policy_version}</li>
        <li><strong>Рекламное согласие:</strong> ${escapeHtml(marketingText)}</li>
      </ul>
    `
  };
}

module.exports = {
  buildLeadEmail,
  MARKETING_CONSENT_VERSION,
  normalizeLead,
  PERSONAL_DATA_CONSENT_VERSION,
  PRIVACY_POLICY_VERSION,
  validateLead
};
