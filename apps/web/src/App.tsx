import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminOnly, ProtectedLayout } from './components/layout';
import { AssetDetailPage } from './pages/asset-detail';
import { AssetsPage } from './pages/assets';
import { DashboardPage } from './pages/dashboard';
import { LoginPage } from './pages/login';
import { MyAssetsPage } from './pages/my-assets';
import { UsersPage } from './pages/users';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/assets/:id" element={<AssetDetailPage />} />
        <Route path="/my-assets" element={<MyAssetsPage />} />
        <Route
          path="/users"
          element={
            <AdminOnly>
              <UsersPage />
            </AdminOnly>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
