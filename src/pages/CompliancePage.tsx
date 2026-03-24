import { ComplianceDashboard } from '../sections/ComplianceDashboard';

export function CompliancePage({ user }: { user?: any }) {
  return (
    <div className="pt-20">
      <ComplianceDashboard user={user} />
    </div>
  );
}
