import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export function ProtectedRoute({ children, allowedRoles, portal = 'any' }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  if (portal === 'owner' && user.role !== 'OWNER') {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  if (portal === 'platform' && user.role !== 'SUPER_ADMIN') {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  if (portal === 'client' && user.role !== 'STAFF') {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return children;
}

function homePathForRole(role) {
  if (role === 'SUPER_ADMIN') return '/owner/admin/tenants';
  if (role === 'OWNER') return '/owner/dashboard';
  return '/client/pos';
}
