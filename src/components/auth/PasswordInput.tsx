"use client";
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputCls } from "@/components/ui";

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${inputCls} pr-11`} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded text-ink-3 hover:text-ink hover:bg-warm" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
