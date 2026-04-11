import { redirect } from "next/navigation";

// /upload is merged into /forum — the feed page now hosts the submission flow.
// All existing "Submit Water" links across the app still point here; this
// redirect keeps them working without touching every caller.
export default function UploadPage() {
  redirect("/forum");
}
