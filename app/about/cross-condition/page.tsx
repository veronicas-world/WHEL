import { redirect } from "next/navigation";

// This arm now lives in the canonical Signal Types page.
export default function CrossConditionRedirect() {
  redirect("/signal-types");
}
