import { Suspense } from "react";
import { ResetForm } from "@/components/auth/Forms";
export const metadata = { title: "Choose a new password" };
export default function Page() { return <Suspense fallback={null}><ResetForm /></Suspense>; }
