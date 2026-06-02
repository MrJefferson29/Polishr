import React, { useEffect, useState, useRef, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import {
  HiOutlineHome,
  HiOutlineRss,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentList,
  HiOutlineCreditCard,
  HiOutlineHeart,
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';

const BottomNavBar = styled.nav`
  position: fixed;
  left: 50%;
  transform: translateX(-50%) ${({ $visible }) => ($visible ? 'translateY(0)' : 'translateY(calc(100% + 24px))')};
  bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  z-index: 1050;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  height: 64px;
  border-radius: 20px;
  max-width: 420px;
  width: calc(100vw - 20px);
  border: 1px solid var(--color-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);

  @media (min-width: 701px) {
    display: none;
  }
`;

const NavItem = styled(Link)`
  flex: 1;
  text-align: center;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 4px;
  border-radius: 14px;
  margin: 6px 4px;
  transition: color 0.2s ease, background 0.2s ease;

  ${({ $active }) =>
    $active &&
    css`
      color: var(--color-primary);
      background: rgba(37, 99, 235, 0.08);
      font-weight: 700;
    `}
`;

const NavIcon = styled.div`
  font-size: 1.45rem;
  line-height: 1;
  transition: transform 0.2s ease;

  ${({ $active }) =>
    $active &&
    css`
      transform: scale(1.12);
    `}
`;

const AUTH_ROUTES = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/social-login-success',
]);

const isRouteActive = (pathname, target) => {
  if (target === '/') return pathname === '/';
  return pathname === target || pathname.startsWith(`${target}/`);
};

const shouldShowBottomNav = (pathname) => {
  if (AUTH_ROUTES.has(pathname)) return false;
  if (pathname.startsWith('/become-a-host')) return false;

  const allowedPrefixes = [
    '/',
    '/feed',
    '/following',
    '/messages',
    '/appointments',
    '/bookings',
    '/my-salon',
    '/salon',
    '/profile',
    '/notifications',
    '/help',
    '/about',
    '/contact',
    '/settings',
    '/admin/payments',
    '/admin/host-applications',
  ];

  return allowedPrefixes.some((prefix) =>
    prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
};

const BottomNav = () => {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(window.scrollY);
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const navItems = useMemo(() => {
    const secondItem =
      user?.role === 'admin'
        ? { to: '/admin/payments', label: 'Payments', icon: <HiOutlineCreditCard /> }
        : user?.role === 'host'
        ? { to: '/my-salon', label: 'Salon', icon: <HiOutlineClipboardDocumentList /> }
        : isAuthenticated
        ? { to: '/following', label: 'Following', icon: <HiOutlineHeart /> }
        : { to: '/feed', label: 'Feed', icon: <HiOutlineRss /> };

    return [
      { to: '/', label: 'Explore', icon: <HiOutlineHome /> },
      secondItem,
      { to: '/messages', label: 'Messages', icon: <HiOutlineChatBubbleLeftRight /> },
      { to: '/appointments', label: 'Bookings', icon: <HiOutlineCalendarDays /> },
    ];
  }, [user?.role, isAuthenticated]);

  const showNav = shouldShowBottomNav(location.pathname);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y < 10) setVisible(true);
      else if (y > lastScrollY.current + 8) setVisible(false);
      else if (y < lastScrollY.current - 8) setVisible(true);
      lastScrollY.current = y;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!showNav) return null;

  return (
    <BottomNavBar $visible={visible} aria-label="Mobile navigation">
      {navItems.map((item) => {
        const active = isRouteActive(location.pathname, item.to);
        return (
          <NavItem key={item.to} to={item.to} $active={active} aria-current={active ? 'page' : undefined}>
            <NavIcon $active={active}>{item.icon}</NavIcon>
            {item.label}
          </NavItem>
        );
      })}
    </BottomNavBar>
  );
};

export default BottomNav;
