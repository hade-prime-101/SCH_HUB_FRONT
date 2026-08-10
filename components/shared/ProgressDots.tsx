import { RegistrationStep } from "@/types/auth";

interface ProgressDotsProps {
  currentStep: RegistrationStep;
}

const STEPS: RegistrationStep[] = ["school", "faculty", "department", "details"];

export function ProgressDots({ currentStep }: ProgressDotsProps) {
  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <div className="flex gap-2 justify-center mb-6">
      {STEPS.map((_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-all ${
            index === currentIndex
              ? "bg-indigo-600 w-8"
              : index < currentIndex
                ? "bg-indigo-600"
                : "bg-slate-300"
          }`}
        />
      ))}
    </div>
  );
}
