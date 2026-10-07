import { ClubEvent } from "@/lib/mock-data";

/**
 * Normalizes raw Supabase events row into a type-safe ClubEvent.
 * If the Supabase Postgres table has not yet had the ticketing columns added,
 * this function automatically unpacks ticketing metadata embedded in rules.
 */
export function normalizeEventFromDb(d: any): ClubEvent {
  if (!d) return d;

  let ticketingMeta: any = null;
  const cleanRules: string[] = [];

  if (Array.isArray(d.rules)) {
    for (const r of d.rules) {
      if (typeof r === "string" && r.includes('"__ticketing__":true')) {
        try {
          ticketingMeta = JSON.parse(r);
        } catch {
          // ignore parsing error
        }
      } else if (typeof r === "object" && r?.__ticketing__) {
        ticketingMeta = r;
      } else {
        cleanRules.push(r);
      }
    }
  }

  const isFree =
    d.is_free !== undefined
      ? d.is_free
      : ticketingMeta?.is_free !== undefined
      ? ticketingMeta.is_free
      : true;

  const ticketPrice = Number(
    d.ticket_price ?? ticketingMeta?.ticket_price ?? 0
  );
  const individualFee = Number(
    d.individual_fee ?? ticketingMeta?.individual_fee ?? ticketPrice
  );
  const teamFee = Number(d.team_fee ?? ticketingMeta?.team_fee ?? 0);
  const paymentUpi =
    d.payment_upi || ticketingMeta?.payment_upi || "malharmirai01@okaxis";
  const paymentQrUrl =
    d.payment_qr_url || ticketingMeta?.payment_qr_url || undefined;
  const allowedRegistrationType =
    d.allowed_registration_type ||
    ticketingMeta?.allowed_registration_type ||
    "both";
  const eventOptions = Array.isArray(d.event_options) && d.event_options.length > 0
    ? d.event_options
    : Array.isArray(ticketingMeta?.event_options)
    ? ticketingMeta.event_options
    : [];
  const askCustomQuestion = !!(
    d.ask_custom_question ?? ticketingMeta?.ask_custom_question
  );
  const customQuestion =
    d.custom_question || ticketingMeta?.custom_question || "";

  return {
    id: d.id,
    title: d.title || "Event",
    description: d.description || "",
    category: d.category || "General",
    date_time: d.date_time || new Date().toISOString(),
    venue: d.venue || "",
    poster_url: d.poster_url || "",
    max_capacity: d.max_capacity || 300,
    registered_count: d.registered_count ?? 0,
    status: d.status || "upcoming",
    registration_deadline: d.registration_deadline || "",
    rules:
      cleanRules.length > 0
        ? cleanRules
        : ["Valid Mirai Student Registration Pass required."],
    prizes: Array.isArray(d.prizes) ? d.prizes : [],
    coordinators: Array.isArray(d.coordinators) ? d.coordinators : [],
    is_free: isFree,
    ticket_price: ticketPrice,
    individual_fee: individualFee,
    team_fee: teamFee,
    payment_upi: paymentUpi,
    payment_qr_url: paymentQrUrl,
    event_options: eventOptions,
    ask_custom_question: askCustomQuestion,
    custom_question: customQuestion,
    allowed_registration_type: allowedRegistrationType,
  };
}

/**
 * Normalizes raw Supabase registrations row.
 * Handles fallback unpacking from year_of_study if table schema lacks new columns.
 */
export function normalizeRegistrationFromDb(r: any): any {
  if (!r) return r;

  let meta: any = null;
  if (
    typeof r.year_of_study === "string" &&
    (r.year_of_study.includes('"__reg_meta__":true') || r.year_of_study.trim().startsWith("{"))
  ) {
    try {
      meta = JSON.parse(r.year_of_study);
    } catch {
      // ignore parsing error
    }
  }

  const effectiveStatus = meta?.workflow_status || r.status || "confirmed";

  return {
    ...r,
    status: effectiveStatus,
    ticket_code:
      r.ticket_code ||
      meta?.ticket_code ||
      `MIRAI-${(r.id || "").slice(0, 6).toUpperCase()}`,
    registration_type:
      r.registration_type || meta?.registration_type || "individual",
    team_name: r.team_name || meta?.team_name || null,
    leader: r.leader || meta?.leader || null,
    team_members: r.team_members || meta?.team_members || [],
    selected_options: r.selected_options || meta?.selected_options || [],
    custom_answer: r.custom_answer || meta?.custom_answer || null,
    payment_screenshot:
      r.payment_screenshot || meta?.payment_screenshot || null,
    checked_in_at: r.checked_in_at || meta?.checked_in_at || null,
    issue_reason: r.issue_reason || meta?.issue_reason || null,
    year_of_study: meta
      ? meta.real_year || "1st Year"
      : (typeof r.year_of_study === "string" && r.year_of_study.trim().startsWith("{")
          ? "1st Year"
          : r.year_of_study || "1st Year"),
    college_id: r.college_id || meta?.real_college_id || null,
  };
}
