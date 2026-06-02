import React, { useEffect, useState } from 'react';
import { Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import {
  FaEdit,
  FaImages,
  FaCalendarAlt,
  FaRss,
  FaMapMarkerAlt,
  FaStar,
  FaUsers,
  FaPhone,
  FaEnvelope,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import { salonsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PhotoMosaic from './common/PhotoMosaic';

const ACCENT = '#e91e63';
const ACCENT_DARK = '#c2185b';

const glass = css`
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
`;

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(160deg, #fce4ec 0%, #f8fafc 40%, #fff1f2 100%);
  padding: 1.25rem 0.75rem 3rem;

  @media (min-width: 768px) {
    padding: 2rem 1.5rem 4rem;
  }
`;

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const Header = styled.header`
  ${glass}
  border-radius: 20px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;

  h1 {
    font-size: clamp(1.35rem, 4vw, 1.75rem);
    font-weight: 800;
    margin: 0 0 0.35rem;
    color: #0f172a;
  }

  .tagline {
    color: #64748b;
    margin: 0 0 0.75rem;
    font-size: 0.95rem;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: ${({ $active }) => ($active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.2)')};
  color: ${({ $active }) => ($active ? '#15803d' : '#64748b')};
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: ${({ $primary }) => ($primary ? 'none' : `1px solid rgba(233, 30, 99, 0.35)`)};
  background: ${({ $primary }) =>
    $primary ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` : 'rgba(255, 255, 255, 0.9)'};
  color: ${({ $primary }) => ($primary ? '#fff' : ACCENT_DARK)};
  box-shadow: ${({ $primary }) => ($primary ? '0 4px 14px rgba(233, 30, 99, 0.3)' : 'none')};

  &:hover {
    filter: brightness(1.03);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;

  @media (min-width: 576px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const StatCard = styled.div`
  ${glass}
  border-radius: 16px;
  padding: 1rem;
  text-align: center;

  .value {
    font-size: 1.5rem;
    font-weight: 800;
    color: ${ACCENT_DARK};
    line-height: 1.2;
  }

  .label {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
`;

const Section = styled.section`
  ${glass}
  border-radius: 20px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;

  h2 {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 1rem;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const PhotoWrap = styled.div`
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 0;
`;

const MetaList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.5;

  a {
    color: ${ACCENT_DARK};
    text-decoration: none;
  }
`;

const ServiceGrid = styled.div`
  display: grid;
  gap: 0.65rem;

  @media (min-width: 576px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ServiceCard = styled.div`
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.2);

  strong {
    display: block;
    color: #0f172a;
    margin-bottom: 0.25rem;
  }

  .meta {
    font-size: 0.8rem;
    color: #64748b;
  }

  .price {
    font-weight: 700;
    color: ${ACCENT_DARK};
    margin-top: 0.35rem;
    font-size: 0.9rem;
  }
`;

const QuickLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const EmptyState = styled.div`
  ${glass}
  border-radius: 24px;
  padding: 3rem 1.5rem;
  text-align: center;
  max-width: 480px;
  margin: 4rem auto;

  h2 {
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  p {
    color: #64748b;
    margin-bottom: 1.5rem;
  }
`;

const LoadingWrap = styled.div`
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MySalon = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'host' && user?.role !== 'admin') {
      navigate('/');
      return;
    }
    salonsAPI
      .getMySalon()
      .then(({ data }) => setSalon(data))
      .catch((err) => {
        if (err.response?.status === 404) setSalon(null);
        else setError('Failed to load salon');
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) {
    return (
      <Page>
        <LoadingWrap>
          <Spinner animation="border" style={{ color: ACCENT }} />
        </LoadingWrap>
      </Page>
    );
  }

  if (!salon) {
    return (
      <Page>
        <Inner>
          <EmptyState>
            <h2>No salon profile yet</h2>
            <p>Create your salon profile so guests can find and book you.</p>
            <Btn $primary type="button" onClick={() => navigate('/create-salon')}>
              Create salon profile
            </Btn>
          </EmptyState>
        </Inner>
      </Page>
    );
  }

  const placeCount = (salon.placeImages || []).length;
  const workCount = (salon.workImages || []).length;
  const serviceCount = salon.services?.length || 0;
  const rating = salon.averageRating ?? 0;
  const reviewCount = salon.totalReviews ?? 0;

  return (
    <Page>
      <Inner>
        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

        <Header>
          <div>
            <StatusBadge $active={salon.isActive}>{salon.isActive ? 'Live' : 'Inactive'}</StatusBadge>
            <h1>{salon.name}</h1>
            {salon.title && <p className="tagline">{salon.title}</p>}
          </div>
          <Actions>
            <Btn $primary type="button" onClick={() => navigate('/edit-salon')}>
              <FaEdit /> Edit salon
            </Btn>
            <Btn type="button" onClick={() => navigate(`/salon/${salon._id}`)}>
              <FaExternalLinkAlt /> Public page
            </Btn>
          </Actions>
        </Header>

        <StatsGrid>
          <StatCard>
            <div className="value">
              <FaStar style={{ fontSize: '1.1rem', verticalAlign: 'middle' }} /> {Number(rating).toFixed(1)}
            </div>
            <div className="label">{reviewCount} reviews</div>
          </StatCard>
          <StatCard>
            <div className="value">{serviceCount}</div>
            <div className="label">Services</div>
          </StatCard>
          <StatCard>
            <div className="value">{placeCount + workCount}</div>
            <div className="label">Photos</div>
          </StatCard>
          <StatCard>
            <div className="value">{salon.numberOfEmployees ?? 1}</div>
            <div className="label">Team size</div>
          </StatCard>
        </StatsGrid>

        <Section>
          <h2>
            <FaImages style={{ color: ACCENT }} /> Salon photos
          </h2>
          <PhotoWrap>
            <PhotoMosaic
              images={salon.placeImages || []}
              variant="gallery"
              enableLightbox
              emptyMessage="No salon photos yet. Add them in Edit salon."
            />
          </PhotoWrap>
        </Section>

        <Section>
          <h2>
            <FaImages style={{ color: ACCENT }} /> Portfolio
          </h2>
          <PhotoWrap>
            <PhotoMosaic
              images={salon.workImages || []}
              variant="gallery"
              enableLightbox
              emptyMessage="No portfolio photos yet. Add work samples in Edit salon."
            />
          </PhotoWrap>
        </Section>

        <Section>
          <h2>About your salon</h2>
          <p style={{ color: '#475569', lineHeight: 1.65, margin: '0 0 1rem' }}>{salon.description}</p>
          <MetaList>
            <div>
              <FaMapMarkerAlt className="me-2" style={{ color: ACCENT }} />
              {[salon.address, salon.city, salon.state, salon.country].filter(Boolean).join(', ') ||
                'No address set'}
            </div>
            {salon.phone && (
              <div>
                <FaPhone className="me-2" style={{ color: ACCENT }} />
                <a href={`tel:${salon.phone}`}>{salon.phone}</a>
              </div>
            )}
            {salon.email && (
              <div>
                <FaEnvelope className="me-2" style={{ color: ACCENT }} />
                <a href={`mailto:${salon.email}`}>{salon.email}</a>
              </div>
            )}
            <div>
              <FaUsers className="me-2" style={{ color: ACCENT }} />
              {salon.numberOfEmployees ?? 1} team member
              {(salon.numberOfEmployees ?? 1) !== 1 ? 's' : ''}
              {user?.hostProfile?.yearsOfExperience != null &&
                ` · ${user.hostProfile.yearsOfExperience} years experience`}
            </div>
          </MetaList>
        </Section>

        <Section>
          <h2>Services & pricing</h2>
          {serviceCount === 0 ? (
            <p style={{ color: '#94a3b8', margin: 0 }}>No services yet. Add them when editing your salon.</p>
          ) : (
            <ServiceGrid>
              {(salon.services || []).map((s, i) => (
                <ServiceCard key={i}>
                  <strong>{s.name}</strong>
                  <div className="meta">
                    {s.duration} min
                    {s.isActive === false && ' · inactive'}
                  </div>
                  <div className="price">{Number(s.price).toLocaleString()} FCFA</div>
                </ServiceCard>
              ))}
            </ServiceGrid>
          )}
          <QuickLinks>
            <Btn type="button" onClick={() => navigate('/edit-salon')}>
              <FaImages /> Manage photos & prices
            </Btn>
          </QuickLinks>
        </Section>

        <Section>
          <h2>Manage your business</h2>
          <QuickLinks>
            <Btn $primary type="button" onClick={() => navigate('/appointments')}>
              <FaCalendarAlt /> Appointments
            </Btn>
            <Btn type="button" onClick={() => navigate('/feed')}>
              <FaRss /> Posts & feed
            </Btn>
            <Btn type="button" onClick={() => navigate('/edit-salon')}>
              <FaEdit /> Edit profile
            </Btn>
          </QuickLinks>
        </Section>
      </Inner>
    </Page>
  );
};

export default MySalon;
