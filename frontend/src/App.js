import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SalonsProvider } from './context/SalonsContext';
import NavbarComponent from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import SocialLoginSuccess from './components/auth/SocialLoginSuccess';
import SalonDetails from './components/SalonDetails';
import CreateSalon from './components/CreateSalon';
import MySalon from './components/MySalon';
import EditSalon from './components/EditSalon';
import BecomeAHostInfo from './components/BecomeAHostInfo';
import Profile from './components/user/Profile';
import EditProfile from './components/user/EditProfile';
import HostApplicationForm from './components/HostApplicationForm';
import HostApplicationStatus from './components/HostApplicationStatus';
import AdminHostApplicationsPanel from './components/AdminHostApplicationsPanel';
import UserNotifications from './components/UserNotifications';
import NotificationDetails from './components/NotificationDetails';
import AdminPaymentsDashboard from './components/AdminPaymentsDashboard';
import FollowingList from './components/FollowingList';
import UserAppointments from './components/UserAppointments';
import ChatRoomsList from './components/ChatRoomsList';
import ChatScreen from './components/ChatScreen';
import BookingSuccess from './components/BookingSuccess';
import BookingCancel from './components/BookingCancel';
import Feed from './components/Feed';
import About from './components/About';
import Contact from './components/Contact';
import Help from './components/Help';

const LegacyListingRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/salon/${id}`} replace />;
};

const AUTH_ROUTES = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/social-login-success',
]);

const AppLayout = ({ children }) => {
  const location = useLocation();
  const hideFooter = AUTH_ROUTES.has(location.pathname);
  const isMobileChat = location.pathname.startsWith('/messages/');
  const hideChatChrome = /^\/messages\/[^/]+/.test(location.pathname);
  const mainClass = [
    'app-main',
    hideFooter ? 'app-main--auth' : '',
    isMobileChat ? 'app-main--chat' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="app-shell">
      {!hideChatChrome && <NavbarComponent />}
      <main className={mainClass}>{children}</main>
      {!hideFooter && !hideChatChrome && <Footer />}
      {!hideChatChrome && <BottomNav />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SalonsProvider>
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/social-login-success" element={<SocialLoginSuccess />} />

              <Route path="/salon/:id" element={<SalonDetails />} />
              <Route path="/listing/:id" element={<LegacyListingRedirect />} />

              <Route path="/feed" element={<Feed />} />
              <Route path="/following" element={<FollowingList />} />
              <Route path="/appointments" element={<UserAppointments />} />
              <Route path="/bookings" element={<UserAppointments />} />

              <Route path="/create-salon" element={<CreateSalon />} />
              <Route path="/my-salon" element={<MySalon />} />
              <Route path="/edit-salon" element={<EditSalon />} />
              <Route path="/create-listing" element={<Navigate to="/create-salon" replace />} />
              <Route path="/listings" element={<Navigate to="/my-salon" replace />} />

              <Route path="/become-a-host-info" element={<BecomeAHostInfo />} />
              <Route path="/become-a-host/apply" element={<HostApplicationForm />} />
              <Route path="/become-a-host/status" element={<HostApplicationStatus />} />
              <Route path="/host-application-status" element={<HostApplicationStatus />} />

              <Route path="/admin/host-applications" element={<AdminHostApplicationsPanel />} />
              <Route path="/admin/payments" element={<AdminPaymentsDashboard />} />
              <Route path="/notifications" element={<UserNotifications />} />
              <Route path="/notification/:id" element={<NotificationDetails />} />

              <Route path="/booking-success" element={<BookingSuccess />} />
              <Route path="/booking-cancel" element={<BookingCancel />} />

              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<Help />} />
              <Route path="/settings" element={<Profile />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />

              <Route path="/messages" element={<ChatRoomsList />} />
              <Route path="/messages/:roomId" element={<ChatScreen />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </Router>
      </SalonsProvider>
    </AuthProvider>
  );
}

export default App;
