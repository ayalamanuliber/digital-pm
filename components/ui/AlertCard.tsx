import { AlertCircle } from 'lucide-react';
import type { Alert } from '@/types';

interface AlertCardProps {
  alert: Alert;
  onResolve?: () => void;
}

export default function AlertCard({ alert, onResolve }: AlertCardProps) {
  return (
    <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="font-semibold text-gray-900 mb-1">{alert.title}</div>
        <div className="text-sm text-gray-600">{alert.description}</div>
      </div>
      {onResolve && (
        <button
          onClick={onResolve}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Resolve
        </button>
      )}
    </div>
  );
}
