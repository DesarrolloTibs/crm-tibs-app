import React from 'react';
import { Clock } from 'lucide-react';

interface CronPreviewBannerProps {
  isValid: boolean;
  previewText: string;
}

export const CronPreviewBanner: React.FC<CronPreviewBannerProps> = ({
  isValid,
  previewText,
}) => {
  return (
    <div
      className={`flex items-start gap-2.5 p-3.5 rounded-lg border text-sm ${
        isValid
          ? 'bg-blue-50 border-blue-100 text-blue-700'
          : 'bg-amber-50 border-amber-100 text-amber-700'
      }`}
    >
      <Clock size={15} className="shrink-0 mt-0.5" />
      <span className="font-medium">{previewText}</span>
    </div>
  );
};
