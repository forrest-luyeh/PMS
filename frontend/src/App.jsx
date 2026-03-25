import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
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
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="reservations" element={<Reservations />} />
              <Route path="guests" element={<Guests />} />
              <Route path="housekeeping" element={<Housekeeping />} />
              <Route path="users" element={<Users />} />
              <Route path="folios/:id" element={<Folio />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
