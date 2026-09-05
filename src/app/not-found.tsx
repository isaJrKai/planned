import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-5">
      <div className="max-w-sm text-center">
        <h1 className="text-[28px] font-semibold">That page isn&rsquo;t here</h1>
        <p className="text-ink-2 mt-2">It may have moved, or the link was mistyped.</p>
        <Link href="/" className="inline-block mt-5 h-10 px-4 leading-10 rounded-md bg-brand text-white font-medium">Go home</Link>
      </div>
    </div>
  );
}
