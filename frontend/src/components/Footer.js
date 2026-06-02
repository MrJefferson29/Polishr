import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Sparkles, Mail, HelpCircle, UserPlus, Heart } from 'lucide-react';

const ACCENT = '#e91e63';
const ACCENT_DARK = '#c2185b';

const FooterRoot = styled.footer`
  margin-top: auto;
  background: linear-gradient(180deg, #fff 0%, #fce4ec 45%, #f8fafc 100%);
  border-top: 1px solid rgba(233, 30, 99, 0.12);
  color: #334155;
`;

const Inner = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 3rem 1.5rem 2rem;
  display: grid;
  grid-template-columns: 1.15fr 2fr;
  gap: 2.5rem;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const Brand = styled.div`
  max-width: 320px;
`;

const Logo = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 1.35rem;
  font-weight: 800;
  text-decoration: none;
  margin-bottom: 0.75rem;
  color: ${ACCENT_DARK};

  svg {
    color: ${ACCENT};
  }

  &:hover {
    color: ${ACCENT};
  }
`;

const Tagline = styled.p`
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.65;
  color: #64748b;
`;

const LinksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const Column = styled.div`
  h4 {
    margin: 0 0 0.85rem;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #0f172a;
  }

  a {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #64748b;
    text-decoration: none;
    font-size: 0.88rem;
    margin-bottom: 0.55rem;
    transition: color 0.15s;

    &:hover {
      color: ${ACCENT_DARK};
    }
  }
`;

const Bottom = styled.div`
  border-top: 1px solid rgba(233, 30, 99, 0.1);
  max-width: 1140px;
  margin: 0 auto;
  padding: 1.15rem 1.5rem 1.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.82rem;
  color: #94a3b8;

  p {
    margin: 0;
  }
`;

const BottomMeta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;

  svg {
    color: ${ACCENT};
  }
`;

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <FooterRoot>
      <Inner>
        <Brand>
          <Logo to="/">
            <Sparkles size={22} aria-hidden />
            <span>POLISHR</span>
          </Logo>
          <Tagline>
            Discover top beauty salons, book appointments, and follow your favorite artists across
            Cameroon.
          </Tagline>
        </Brand>

        <LinksGrid>
          <Column>
            <h4>Discover</h4>
            <Link to="/">Explore Salons</Link>
            <Link to="/feed">Feed</Link>
            <Link to="/following">Following</Link>
            <Link to="/appointments">My Appointments</Link>
          </Column>

          <Column>
            <h4>Hosts</h4>
            <Link to="/become-a-host-info">Become a Host</Link>
            <Link to="/become-a-host/apply">Apply Now</Link>
            <Link to="/my-salon">My Salon</Link>
            <Link to="/create-salon">Set Up Salon</Link>
          </Column>

          <Column>
            <h4>Support</h4>
            <Link to="/help">
              <HelpCircle size={14} aria-hidden /> Help Center
            </Link>
            <Link to="/contact">
              <Mail size={14} aria-hidden /> Contact Us
            </Link>
            <Link to="/about">About NailBook</Link>
          </Column>

          <Column>
            <h4>Account</h4>
            <Link to="/login">Sign In</Link>
            <Link to="/register">
              <UserPlus size={14} aria-hidden /> Sign Up
            </Link>
            <Link to="/profile">Profile</Link>
            <Link to="/messages">Messages</Link>
          </Column>
        </LinksGrid>
      </Inner>

      <Bottom>
        <p>© {year} NailBook. All rights reserved.</p>
        <BottomMeta>
          <Heart size={13} aria-hidden /> Built for nail lovers
        </BottomMeta>
      </Bottom>
    </FooterRoot>
  );
};

export default Footer;
