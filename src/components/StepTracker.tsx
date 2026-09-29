import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

const STEPS = [
  { label: "Property details", to: null },
  { label: "Upload images", to: "/flow/$id/upload" },
  { label: "AI analysis", to: "/flow/$id/analysis" },
  { label: "Review & edit", to: "/flow/$id/review" },
  { label: "Report design", to: "/flow/$id/design" },
  { label: "Final report", to: "/flow/$id/report" },
] as const;

/** 5-step progress header. `active` is 1-based; `reached` is the furthest step unlocked. */
export function StepTracker({ active, reached, id }: { active: number; reached: number; id?: string }) {
  return (
    <nav aria-label="Inspection steps" className="app-steps no-print">
      {STEPS.map((step, i) => {
        const n = i + 1;
        const state = n === active ? "active" : n < active || n <= reached ? "done" : "todo";
        const body = (
          <>
            <span className="app-step__dot" aria-hidden>
              {state === "done" && n !== active ? <Check /> : n}
            </span>
            <span className="app-step__label">{step.label}</span>
            <span className="app-step__state">
              {state === "active" ? "In progress" : state === "done" ? "Completed" : "Pending"}
            </span>
          </>
        );
        const canLink = id && step.to && n <= Math.max(reached, active) && n !== active;
        return (
          <div key={step.label} className={`app-step app-step--${state}`} aria-current={n === active ? "step" : undefined}>
            {canLink ? (
              <Link to={step.to!} params={{ id: id! }} className="app-step__link">
                {body}
              </Link>
            ) : (
              <span className="app-step__link">{body}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
