"use client";

export type SavePopupStatus = "saving" | "success" | "error";

type Props = {
  open: boolean;
  status: SavePopupStatus;
  title: string;
  message?: string;
  onClose?: () => void;
  closeLabel?: string;
};

export default function SaveStatusPopup({
  open,
  status,
  title,
  message,
  onClose,
  closeLabel = "OK",
}: Props) {
  if (!open) return null;

  const isSaving = status === "saving";
  const toneClass =
    status === "success"
      ? "text-green-600"
      : status === "error"
      ? "text-red-600"
      : "text-blue-600";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="space-y-3 text-center">
          <h2 className={`text-lg font-semibold ${toneClass}`}>
            {title}
          </h2>

          {message && (
            <p className="text-sm text-gray-600">{message}</p>
          )}

          {isSaving && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-full animate-pulse bg-blue-600" />
            </div>
          )}

          {!isSaving && (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {closeLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
