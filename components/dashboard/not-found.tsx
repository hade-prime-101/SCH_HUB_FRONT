import { ErrorState } from "@/components/shared/ErrorState";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <ErrorState
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
      primaryAction={{
        label: "Go to dashboard",
        href: "/dashboard",
      }}
    />
  );
}