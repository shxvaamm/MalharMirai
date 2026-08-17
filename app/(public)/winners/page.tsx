import { redirect } from "next/navigation";

export default function WinnersPageRedirect() {
  redirect("/events");
}
