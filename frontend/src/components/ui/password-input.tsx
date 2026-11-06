import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordInputProps = {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  required?: boolean;
};

export function PasswordInput({
  id,
  label,
  autoComplete,
  required = true,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-stone-700"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={8}
          maxLength={64}
          pattern={
            autoComplete === "new-password"
              ? "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,64}"
              : undefined
          }
          title={
            autoComplete === "new-password"
              ? "Use 8–64 characters with an uppercase letter, a lowercase letter, and a number."
              : undefined
          }
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 pr-12 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 hover:border-stone-400 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/10"
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          className="absolute inset-y-0 right-0 inline-flex items-center px-4 text-stone-500 transition hover:text-stone-800 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-orange-700"
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
        >
          {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
