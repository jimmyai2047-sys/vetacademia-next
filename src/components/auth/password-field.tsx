"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_MIN_LENGTH, passwordStrength } from "@/lib/password";
import { cn } from "@/lib/utils";

// P1+P2: password input with show/hide, strength meter, a11y wiring.
export function PasswordField({
  id = "password",
  name = "password",
  label = "Password",
  autoComplete = "current-password",
  placeholder = "••••••••",
  disabled = false,
  required = true,
  autoFocus = false,
  showStrength = false,
  // Native min-length. Signup/reset enforce the 8-char policy; login must NOT
  // (legacy 6-char passwords from the old reset flow still need to sign in).
  minLength = PASSWORD_MIN_LENGTH,
  value: controlledValue,
  onChange: controlledOnChange,
  error,
}: {
  id?: string;
  name?: string;
  label?: string;
  autoComplete?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  showStrength?: boolean;
  minLength?: number;
  value?: string;
  onChange?: (v: string) => void;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  const [inner, setInner] = useState("");
  const value = controlledValue ?? inner;
  const strength = useMemo(() => passwordStrength(value), [value]);
  const describedBy = showStrength ? `${id}-strength` : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn("pr-10", error && "border-destructive")}
          value={value}
          onChange={(e) => {
            if (controlledOnChange) controlledOnChange(e.target.value);
            else setInner(e.target.value);
          }}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength && value.length > 0 ? (
        <div id={`${id}-strength`} aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i < strength.score
                    ? strength.score <= 1
                      ? "bg-red-500"
                      : strength.score === 2
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{strength.label}</p>
        </div>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
