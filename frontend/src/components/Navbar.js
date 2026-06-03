import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Dropdown, Badge } from 'react-bootstrap';
import { 
  Search,
  Home,
  Heart,
  Menu,
  User,
  LogIn,
  UserPlus,
  Settings,
  LogOut,
  Bell,
  Calendar,
  HelpCircle,
  Shield,
  Plus,
  Info,
  Phone,
  MessageSquare,
  Rss
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import styled from 'styled-components';
import { hostApplicationsAPI } from '../services/api';

const NavbarComponent = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [pendingHostApps, setPendingHostApps] = useState(0);

  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      hostApplicationsAPI.list('pending').then(res => setPendingHostApps(res.data.length)).catch(() => setPendingHostApps(0));
    }
  }, [isAdmin]);

  const handleLogout = () => {
    logout();
  };

  // Notifications click handler for admin
  const handleNotificationsClick = () => {
    if (isAdmin) {
      navigate('/notifications');
    } else {
      navigate('/notifications');
    }
  };

  // Render the main action button based on user status and role (desktop only)
  const renderMainActionButton = () => {
    if (!isAuthenticated) {
      return (
        <Nav.Link as={Link} to="/login" className="host-link desktop-only">
          <LogIn /> Log in
        </Nav.Link>
      );
    }

    if (user?.role === 'admin') {
      return (
        <Nav.Link as={Link} to="/admin/host-applications" className="host-link desktop-only">
          <Shield /> Admin Panel
          {pendingHostApps > 0 && (
            <Badge bg="danger" className="notification-badge" style={{ marginLeft: '8px' }}>
              {pendingHostApps}
            </Badge>
          )}
        </Nav.Link>
      );
    }

    if (user?.role === 'host') {
      return (
        <Nav.Link as={Link} to="/my-salon" className="host-link desktop-only">
          <Home /> My Salon
        </Nav.Link>
      );
    }

    // Default for guests
    return (
      <Nav.Link as={Link} to="/become-a-host-info" className="host-link desktop-only">
        <Plus /> Become a Host
      </Nav.Link>
    );
  };

  return (
    <>
      <ResponsiveNavbarWrapper>
        <Navbar 
          bg="white" 
          expand="lg" 
          className={`airbnb-navbar nailbook-navbar ${isScrolled ? 'scrolled' : ''}`} 
          fixed="top"
        >
          <Container fluid>
            {/* Logo */}
            <Navbar.Brand as={Link} to="/" className="navbar-brand nailbook-brand" aria-label="Polishr home">
              <span className="brand-gem" aria-hidden />
              <span className="brand-lockup">
                <span className="brand-text">POLISHR</span>
              </span>
            </Navbar.Brand>

            {/* Navigation Links — desktop */}
            <Nav className="navbar-nav me-auto desktop-nav">
              <Nav.Link as={Link} to="/" className={`nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>
                <Search /> Explore
              </Nav.Link>
              <Nav.Link as={Link} to="/feed" className={`nav-link ${isActive('/feed') ? 'active' : ''}`}>
                <Rss /> Feed
              </Nav.Link>
              {isAuthenticated && (
                <Nav.Link as={Link} to="/following" className={`nav-link ${isActive('/following') ? 'active' : ''}`}>
                  <Heart /> Following
                </Nav.Link>
              )}
              <Nav.Link as={Link} to="/messages" className={`nav-link ${isActive('/messages') ? 'active' : ''}`}>
                <MessageSquare /> Messages
              </Nav.Link>
              {isAuthenticated && (
                <Nav.Link as={Link} to="/appointments" className={`nav-link ${isActive('/appointments') ? 'active' : ''}`}>
                  <Calendar /> Appointments
                </Nav.Link>
              )}
            </Nav>

            {/* Right Side Menu */}
            <div className="navbar-right">
              {/* Favorites - Only show for authenticated users */}
              {isAuthenticated && (
                <Nav.Link as={Link} to="/following" className="favorites-link desktop-only" title="Following">
                  <Heart />
                </Nav.Link>
              )}

              {/* Main Action Button - Dynamic based on user status and role (desktop only) */}
              {renderMainActionButton()}

              {/* Language selector removed */}

              {/* Notifications (if logged in) */}
              {isAuthenticated && (
                <div className="notifications-container" onClick={handleNotificationsClick} style={{ cursor: 'pointer', position: 'relative' }}>
                  <Bell className="notifications-icon" />
                  {isAdmin && pendingHostApps > 0 && (
                    <Badge bg="danger" className="notification-badge" style={{ position: 'absolute', top: -6, right: -6 }}>{pendingHostApps}</Badge>
                  )}
                  {!isAdmin && user?.notifications > 0 && (
                    <Badge bg="danger" className="notification-badge">
                      {user.notifications}
                    </Badge>
                  )}
                </div>
              )}

              {/* User Menu */}
              <div className="user-menu-container">
                {isAuthenticated ? (
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="light" className="user-menu-toggle">
                      <div className="user-menu-content">
                        <Menu className="menu-icon" />
                        <div className="user-avatar">
                          {user?.profileImage ? (
                            <img src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} />
                          ) : (
                            <User />
                          )}
                        </div>
                      </div>
                    </Dropdown.Toggle>

                    <Dropdown.Menu container={document.body} className="user-dropdown-menu">
                      <Dropdown.Item as={Link} to="/profile">
                        <User /> Profile
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/appointments">
                        <Calendar /> My Appointments
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/feed">
                        <Rss/> Feed
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/following">
                        <Heart /> Following
                      </Dropdown.Item>
                      {user?.role === 'host' && (
                        <>
                          <Dropdown.Item as={Link} to="/my-salon">
                            <Home /> My Salon
                          </Dropdown.Item>
                          <Dropdown.Item as={Link} to="/create-salon">
                            <Plus /> Set Up Salon
                          </Dropdown.Item>
                        </>
                      )}
                      {user?.role === 'admin' && (
                        <Dropdown.Item as={Link} to="/admin/host-applications" className="admin-panel-link">
                          <Shield /> Admin Panel
                          {pendingHostApps > 0 && (
                            <Badge bg="danger" className="dropdown-badge">
                              {pendingHostApps}
                            </Badge>
                          )}
                        </Dropdown.Item>
                      )}
                      {/* This condition should never be true for authenticated users, removing this item */}
                      {user?.role === 'guest' && (
                        <Dropdown.Item as={Link} to="/become-a-host-info">
                          <Plus /> Become a Host
                        </Dropdown.Item>
                      )}
                      <Dropdown.Item as={Link} to="/settings">
                        <Settings /> Settings
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/help">
                        <HelpCircle /> Help
                      </Dropdown.Item>
                      
                      <Dropdown.Divider />
                      
                      {/* About and Contact - Available in dropdown for smaller screens */}
                      <Dropdown.Item as={Link} to="/about">
                        <Info /> About
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/contact">
                        <Phone /> Contact
                      </Dropdown.Item>
                      
                      <Dropdown.Divider />
                      
                      <Dropdown.Item onClick={handleLogout}>
                        <LogOut /> Logout
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                ) : (
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="light" className="user-menu-toggle">
                      <div className="user-menu-content">
                        <Menu className="menu-icon" />
                        <User className="user-icon" />
                      </div>
                    </Dropdown.Toggle>

                    <Dropdown.Menu container={document.body} className="user-dropdown-menu">
                      <Dropdown.Item as={Link} to="/login">
                        <LogIn /> Sign in
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/register">
                        <UserPlus /> Sign up
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item as={Link} to="/become-a-host-info">
                        <Plus /> List Your Salon
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/help">
                        <HelpCircle /> Help
                      </Dropdown.Item>
                      
                      <Dropdown.Divider />
                      
                      {/* Main Action Button - Available in dropdown for smaller screens */}
                      <Dropdown.Item as={Link} to="/become-a-host-info" className="main-action-dropdown-item">
                        <Plus /> Become a Host
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                )}
              </div>
            </div>
          </Container>
                 </Navbar>
       </ResponsiveNavbarWrapper>
     </>
   );
 };

const ResponsiveNavbarWrapper = styled.div`
  .airbnb-navbar {
    background: var(--color-surface) !important;
    color: var(--color-text) !important;
    border-bottom: 1.5px solid var(--color-border);
  }
  .dashboard-link {
    color: var(--color-primary) !important;
    font-weight: 600;
    transition: all 0.3s ease;
    
    &:hover {
      color: var(--color-primary-dark) !important;
      transform: translateY(-1px);
    }
  }

  .host-link {
    .setup-required {
      font-size: 0.8rem;
      color: #666;
      cursor: help;
      border-bottom: 1px dotted #666;
      transition: color 0.3s ease;
      
      &:hover {
        color: #333;
      }
    }
  }

  // Modal styling
  .modal-content {
    border-radius: 12px;
    border: none;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    border-bottom: 1px solid #e9ecef;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 12px 12px 0 0;
  }

  .modal-title {
    color: #333;
    font-weight: 600;
  }

  .modal-body {
    padding: 24px;
  }

  .modal-footer {
    border-top: 1px solid #e9ecef;
    padding: 16px 24px;
  }
`;

export default NavbarComponent; 