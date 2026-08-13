import { RegistrationStep } from "@/types/auth";

interface ProgressDotsProps {
  currentStep: RegistrationStep;
}

const STEPS: RegistrationStep[] = ["school", "faculty", "department", "details"];

/**
 * ProgressDots Component
 * 
 * Displays registration progress indicator with animated dots.
 * Uses semantic primary token for active/completed states.
 * 
 * States:
 * - Current step: expanded pill (primary color, 8px wide)
 * - Completed steps: filled dot (primary color, 2px)
 * - Upcoming steps: unfilled dot (muted color, 2px)
 * 
 * @example
 * ```tsx
 * <ProgressDots currentStep="faculty" />
 * ```
 */
export function ProgressDots({ currentStep }: ProgressDotsProps) {
  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <div className="flex gap-2 justify-center mb-6">
      {STEPS.map((_, index) => (
        <div
          key={index}
          className={`h-2 rounded-full transition-all ${
            index === currentIndex
              ? "bg-primary w-8"
              : index < currentIndex
                ? "bg-primary w-2"
                : "bg-muted-foreground w-2"
          }`}
        />
      ))}
    </div>
  );
}
