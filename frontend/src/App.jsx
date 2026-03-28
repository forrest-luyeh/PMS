import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminTenants from './pages/admin/Tenants'
import AdminHotels from './pages/admin/Hotels'
import SuperAdminDashboard from './pages/admin/Dashboard'
import ManageHotels from './pages/manage/Hotels'
import ManageBrands from './pages/manage/Brands'
import RoomSetup from './pages/manage/RoomSetup'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import Reservations from './pages/Reservations'
import Guests from './pages/Guests'
import Housekeeping from './pages/Housekeeping'
import Users from './pages/Users'
import Folio from './pages/Folio'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="reservations" element={<Reservations />} />
              <Route path="guests" element={<Guests />} />
              <Route path="housekeeping" element={<Housekeeping />} />
              <Route path="users" element={<Users />} />
              <Route path="folios/:id" element={<Folio />} />
              <Route path="admin/tenants" element={<PrivateRoute roles={['SUPER_ADMIN']}><AdminTenants /></PrivateRoute>} />
              <Route path="admin/hotels" element={<PrivateRoute roles={['SUPER_ADMIN','TENANT_ADMIN','BRAND_ADMIN']}><AdminHotels /></PrivateRoute>} />
              <Route path="admin/dashboard" element={<PrivateRoute roles={['SUPER_ADMIN']}><SuperAdminDashboard /></PrivateRoute>} />
              <Route path="manage/hotels" element={<PrivateRoute roles={['TENANT_ADMIN','BRAND_ADMIN']}><ManageHotels /></PrivateRoute>} />
              <Route path="manage/brands" element={<PrivateRoute roles={['TENANT_ADMIN']}><ManageBrands /></PrivateRoute>} />
              <Route path="manage/rooms" element={<PrivateRoute roles={['TENANT_ADMIN','BRAND_ADMIN','ADMIN']}><RoomSetup /></PrivateRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
