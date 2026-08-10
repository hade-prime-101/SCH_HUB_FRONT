import { MdError } from "react-icons/md";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
      <MdError className="w-5 h-5 text-red-600 flex-shrink-0" />
      <p className="text-red-700 text-sm">{message}</p>
    </div>
  );
}
