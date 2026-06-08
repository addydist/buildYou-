import type { LucideIcon } from "lucide-react";

export function PrimaryButton({
  icon: Icon,
  label,
  onClick,
  submit = false,
  disabled = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  submit?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      className="flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500"
      disabled={disabled}
      onClick={onClick}
      type={submit ? "submit" : "button"}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export function SecondaryButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
