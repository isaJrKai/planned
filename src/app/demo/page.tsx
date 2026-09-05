import { PublicHeader, PublicFooter } from "@/components/marketing/Shell";
import { KatoDemo } from "@/components/marketing/KatoDemo";

export const metadata = { title: "Demo — the Kato family" };

export default function DemoPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <div className="max-w-2xl mb-8">
          <h1 className="text-[36px] font-semibold leading-tight">Meet the Kato family.</h1>
          <p className="text-ink-2 mt-2 text-[16.5px]">Sarah is the parent. Daniel is 12, Maya is 9. Everything below is live — pay an allowance, approve a request, add to a goal, finish a lesson — and watch the ledger respond. Nothing is saved; refresh to reset.</p>
        </div>
        <KatoDemo />
      </main>
      <PublicFooter />
    </div>
  );
}
