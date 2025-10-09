"use client";

interface InfoBannerProps {
  icon?: string;
  title: string;
  description: string;
  onClose?: () => void;
}

export default function InfoBanner({
  icon = "👆",
  title,
  description,
  onClose,
}: InfoBannerProps) {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-emerald-900 mb-1">
            {title}
          </p>
          <p className="text-xs text-emerald-800">
            {description}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-emerald-600 hover:text-emerald-800 text-xl flex-shrink-0"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
