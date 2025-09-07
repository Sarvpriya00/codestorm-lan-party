import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export type Status = "not-started" | "pending" | "accepted" | "rejected";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig = {
  "not-started": {
    label: "Not Started",
    icon: Clock,
    className: "bg-muted text-muted-foreground border-muted-foreground/20"
  },
  pending: {
    label: "Pending",
    icon: AlertCircle,
    className: "bg-pending/20 text-pending border-pending/50"
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle,
    className: "bg-accepted/20 text-accepted border-accepted/50"
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-rejected/20 text-rejected border-rejected/50"
  }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}