import { PublicHeader, PublicFooter } from "@/components/marketing/Shell";
import { KatoDemo } from "@/components/marketing/KatoDemo";

export const metadata = { title: "See how Planned works — the Kato family" };

export default function DemoPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <div className="mx-auto mb-8 max-w-3xl">
          <p className="text-sm font-semibold text-brand">A family, a little more in control</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">Meet the Kato family.</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink-2">Sarah manages the family money. Daniel and Maya are learning to make their own decisions. Explore their example: start with the family view, then open either child’s view to see how goals and everyday spending fit together.</p>
          <p className="mt-2 text-sm text-ink-3">Try approving a request or moving money into a goal. This is a simulation; refresh to start again.</p>
        </div>
        <KatoDemo />
      </main>
      <PublicFooter />
    </div>
  );
}
