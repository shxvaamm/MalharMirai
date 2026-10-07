const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // USE ADMIN KEY
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data: events, error: evErr } = await supabase.from("events").select("id, title");
  console.log("Events:", events, evErr);

  if (events && events.length > 0) {
    const eventId = events[0].id;
    const newId = crypto.randomUUID();
    console.log("Trying to insert registration for event:", eventId);

    const insertPayload = {
      id: newId,
      event_id: eventId,
      student_name: "Test User 2",
      student_email: "test2@example.com",
      student_phone: null,
      user_id: null,
      college_id: null,
      department: "General",
      year_of_study: null,
      status: "pending",
      registration_type: "individual",
      team_name: null,
      leader: null,
      team_members: [],
      selected_options: [],
      custom_answer: null,
      payment_screenshot: null,
      ticket_code: "123123",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("registrations").insert(insertPayload).select().single();
    console.log("Insert result 1:", error);

    if (error && (error.message?.includes("column") || error.message?.includes("schema cache") || error.message?.includes("registrations_status_check"))) {
      console.log("Falling back...");
      const safePayload = {
        id: newId,
        event_id: eventId,
        student_name: "Test User 2",
        student_email: "test2@example.com",
        student_phone: null,
        user_id: null,
        college_id: null,
        department: "General",
        year_of_study: JSON.stringify({ workflow_status: "pending" }),
        status: "confirmed",
        created_at: new Date().toISOString(),
      };
      const fallbackRes = await supabase.from("registrations").insert(safePayload).select().single();
      console.log("Insert result fallback:", fallbackRes.error);
    }
  }
}

testInsert();
