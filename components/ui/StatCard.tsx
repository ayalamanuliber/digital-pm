import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  iconBgColor?: string;
  iconColor?: string;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600'
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconBgColor)}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        </div>
      </div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
}
