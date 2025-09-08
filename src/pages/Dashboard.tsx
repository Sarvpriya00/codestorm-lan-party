import { ContestDashboard } from "@/components/ContestDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { PERMISSIONS } from "@/constants/permissions";

export function Dashboard() {
  const { user } = useAuth();

  return (
    <RoleGuard requiredPermissions={[PERMISSIONS.DASHBOARD]}>
      <ContestDashboard />
    </RoleGuard>
  );
}