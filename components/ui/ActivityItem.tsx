import { CheckCircle } from 'lucide-react';
import type { Activity } from '@/types';

interface ActivityItemProps {
  activity: Activity;
}

export default function ActivityItem({ activity }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-900">{activity.text}</div>
        <div className="text-xs text-gray-500 mt-1">{activity.timestamp}</div>
      </div>
    </div>
  );
}
