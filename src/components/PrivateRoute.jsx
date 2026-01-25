import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../hooks/AuthProvider';

const PrivateRoute = ({ children, requiredPermissions = [] }) => {
  const { auth, isAuthReady } = useContext(AuthContext);

  if (!isAuthReady) {
    return <div>Cargando...</div>;
  }

  if (!auth || !auth.token) {
    return <Navigate to="/login" replace />;
  }

  if (
    requiredPermissions.length > 0 &&
    !requiredPermissions.every((p) =>
      auth.user?.permissions?.includes(p)
    )
  ) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

export default PrivateRoute;