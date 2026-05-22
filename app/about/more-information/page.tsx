import { redirect } from "next/navigation";

// Superseded by the Technical Architecture page.
export default function MoreInformationRedirect() {
  redirect("/about/technical-architecture");
}
