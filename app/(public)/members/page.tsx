import { redirect } from "next/navigation";

/**
 * /members now redirects to /leadership — the two pages have been
 * unified into a single "People of MALHAR" page that shows Core
 * Committee at the top followed by all members sorted by year.
 */
export default function MembersPage() {
  redirect("/leadership");
}
