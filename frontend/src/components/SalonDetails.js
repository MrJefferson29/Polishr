import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Modal } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {
  FaStar,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaCommentDots,
  FaPhone,
  FaEnvelope,
  FaCalendarCheck,
  FaImages,
  FaPalette,
} from 'react-icons/fa';
import { salonsAPI, reviewsAPI, chatAPI, appointmentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FollowButton from './FollowButton';
import AppointmentForm from './AppointmentForm';
import ReviewForm from './ReviewForm';
import PhotoMosaic from './common/PhotoMosaic';
import { canLeaveReview } from '../utils/appointmentReview';
import 'leaflet/dist/leaflet.css';
import styled, { css } from 'styled-components';

const ACCENT = '#e91e63';
const ACCENT_DARK = '#c2185b';

const glass = css`
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow:
    0 4px 24px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
`;

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(160deg, #fce4ec 0%, #f8fafc 35%, #fff1f2 100%);
  padding-bottom: calc(6.5rem + env(safe-area-inset-bottom, 0px));

  @media (min-width: 992px) {
    padding-bottom: 4rem;
  }
`;

const HeroPlaceholder = styled.div`
  height: clamp(200px, 42vw, 340px);
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #f1f5f9 100%);
`;

const Inner = styled.div`
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 0.75rem;
  width: 100%;
  box-sizing: border-box;

  @media (min-width: 576px) {
    padding: 0 1rem;
  }

  @media (min-width: 768px) {
    padding: 0 1.5rem;
  }
`;

const Hero = styled.section`
  position: relative;
  margin: 0 -0.75rem 1.25rem;
  overflow: hidden;

  @media (min-width: 576px) {
    margin: 0 0 1.5rem;
  }

  @media (min-width: 768px) {
    margin: 0 0 1.75rem;
    border-radius: 20px;
    box-shadow: 0 16px 40px rgba(233, 30, 99, 0.12);
  }
`;

const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(15, 23, 42, 0.75) 0%,
    rgba(15, 23, 42, 0.2) 45%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 1;
`;

const HeroGlass = styled.div`
  position: absolute;
  left: 0.5rem;
  right: 0.5rem;
  bottom: 0.5rem;
  z-index: 2;
  ${glass}
  border-radius: 14px;
  padding: 0.85rem 1rem;
  color: #0f172a;

  @media (min-width: 576px) {
    left: 0.75rem;
    right: 0.75rem;
    bottom: 0.75rem;
    padding: 1rem 1.25rem;
  }

  @media (min-width: 768px) {
    left: 1rem;
    right: auto;
    max-width: min(520px, calc(100% - 2rem));
    padding: 1.15rem 1.35rem;
    border-radius: 18px;
  }

  h1 {
    font-size: clamp(1.35rem, 4vw, 1.85rem);
    font-weight: 700;
    margin: 0 0 0.25rem;
    letter-spacing: -0.02em;
  }

  .tagline {
    color: #64748b;
    font-size: 0.95rem;
    margin: 0 0 0.75rem;
  }
`;

const StatRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  font-size: 0.85rem;
  color: #475569;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .rating {
    color: #f59e0b;
    font-weight: 600;
  }
`;

const Layout = styled.div`
  display: grid;
  gap: 1rem;
  min-width: 0;

  @media (min-width: 992px) {
    grid-template-columns: minmax(0, 1fr) 340px;
    align-items: start;
    gap: 1.75rem;
  }
`;

const MainCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;

  @media (min-width: 768px) {
    gap: 1.25rem;
  }
`;

const HostBar = styled.div`
  ${glass}
  border-radius: 18px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
`;

const HostInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;

  img {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #94a3b8;
    margin-bottom: 2px;
  }

  .name {
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }
`;

const ActionGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
`;

const GlassBtn = styled.button`
  ${glass}
  border-radius: 999px;
  padding: 0.45rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(233, 30, 99, 0.12);
    color: ${ACCENT_DARK};
  }
`;

const TabNav = styled.div`
  ${glass}
  border-radius: 14px;
  padding: 0.3rem;
  display: flex;
  flex-wrap: nowrap;
  gap: 0.25rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabBtn = styled.button`
  flex: 0 0 auto;
  white-space: nowrap;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ $active, $reviews }) =>
    $active
      ? $reviews
        ? `linear-gradient(135deg, #f59e0b, #d97706)`
        : `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`
      : 'transparent'};
  color: ${({ $active }) => ($active ? '#fff' : '#64748b')};
  box-shadow: ${({ $active, $reviews }) =>
    $active
      ? $reviews
        ? '0 4px 14px rgba(245, 158, 11, 0.4)'
        : '0 4px 14px rgba(233, 30, 99, 0.35)'
      : 'none'};

  &:hover:not(:disabled) {
    color: ${({ $active }) => ($active ? '#fff' : ACCENT_DARK)};
  }
`;

const Panel = styled.div`
  ${glass}
  border-radius: 20px;
  padding: 1.25rem 1.5rem;

  @media (min-width: 768px) {
    padding: 1.5rem 1.75rem;
  }
`;

const PhotoPanel = styled(Panel)`
  padding: 0;
  overflow: hidden;
`;

const MobileBookBar = styled.div`
  display: block;
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(56px + env(safe-area-inset-bottom, 0px));
  z-index: 1040;
  padding: 0.65rem 0.85rem;
  ${glass}
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-bottom: none;
  box-shadow: 0 -4px 24px rgba(15, 23, 42, 0.1);

  @media (min-width: 992px) {
    display: none;
  }
`;

const DesktopOnlyBook = styled.div`
  @media (max-width: 991px) {
    display: none;
  }
`;

const AmenityChip = styled.span`
  display: inline-block;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  background: rgba(233, 30, 99, 0.08);
  color: ${ACCENT_DARK};
  border: 1px solid rgba(233, 30, 99, 0.15);
  margin: 0 0.35rem 0.35rem 0;
`;

const ReviewsPanel = styled(Panel)`
  padding: 1.5rem 1.35rem;

  @media (min-width: 768px) {
    padding: 1.75rem 1.65rem;
  }
`;

const ReviewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ReviewCard = styled.article`
  ${glass}
  border-radius: 18px;
  padding: 1.15rem 1.25rem;
  border: 1px solid rgba(233, 30, 99, 0.08);
  transition: box-shadow 0.2s, transform 0.2s;

  &:hover {
    box-shadow: 0 8px 28px rgba(233, 30, 99, 0.1);
    transform: translateY(-1px);
  }
`;

const ReviewAuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;

  img,
  .avatar-fallback {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    background: linear-gradient(135deg, #fce4ec, #f8bbd0);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: ${ACCENT_DARK};
    font-size: 0.9rem;
  }

  .author-meta {
    flex: 1;
    min-width: 0;
  }

  .name {
    font-weight: 700;
    color: #0f172a;
    font-size: 0.95rem;
  }

  .date {
    font-size: 0.78rem;
    color: #94a3b8;
    margin-top: 2px;
  }

  .rating-col {
    text-align: right;
    flex-shrink: 0;
  }

  .rating-num {
    font-weight: 800;
    font-size: 1.1rem;
    color: #0f172a;
    line-height: 1;
  }
`;

const StarRow = styled.div`
  display: flex;
  gap: 2px;
  margin-top: 4px;
  color: #f59e0b;
`;

const ReviewTitle = styled.h3`
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: #0f172a;
`;

const ReviewBody = styled.p`
  color: #475569;
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  line-height: 1.6;
`;

const DetailChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;

  span {
    font-size: 0.72rem;
    padding: 0.25rem 0.55rem;
    border-radius: 8px;
    background: rgba(248, 250, 252, 0.95);
    border: 1px solid rgba(148, 163, 184, 0.25);
    color: #64748b;

    strong {
      color: ${ACCENT_DARK};
      margin-left: 3px;
    }
  }
`;

const MapGlass = styled.div`
  ${glass}
  border-radius: 20px;
  overflow: hidden;
  height: 280px;

  @media (min-width: 768px) {
    height: 320px;
  }

  .leaflet-container {
    height: 100%;
    width: 100%;
    border-radius: 0;
  }
`;

const Sidebar = styled.aside`
  min-width: 0;

  @media (min-width: 992px) {
    position: sticky;
    top: 84px;
  }
`;

const BookCard = styled.div`
  ${glass}
  border-radius: 24px;
  padding: 1.5rem;
  border: 1px solid rgba(233, 30, 99, 0.12);

  h5 {
    font-weight: 700;
    margin-bottom: 1rem;
    color: #0f172a;
    font-size: 1.1rem;
  }
`;

const ServiceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);

  &:last-of-type {
    border-bottom: none;
  }

  .price {
    font-weight: 700;
    color: ${ACCENT_DARK};
    white-space: nowrap;
  }

  .meta {
    font-size: 0.8rem;
    color: #94a3b8;
    margin-top: 2px;
  }
`;

const HoursRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  padding: 0.35rem 0;
  color: #475569;

  span:first-child {
    text-transform: capitalize;
    font-weight: 500;
  }
`;

const BookBtn = styled.button`
  width: 100%;
  margin-top: 1.25rem;
  padding: 0.95rem 1.5rem;
  border: none;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%);
  box-shadow: 0 8px 24px rgba(233, 30, 99, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(233, 30, 99, 0.45);
  }
`;

const LoadingWrap = styled.div`
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EmptyText = styled.p`
  color: #94a3b8;
  text-align: center;
  padding: 2rem 1rem;
  margin: 0;
`;

const ReviewSummary = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem 1.35rem;
  margin-bottom: 1.25rem;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.08) 0%, rgba(252, 228, 236, 0.5) 100%);
  border: 1px solid rgba(233, 30, 99, 0.15);

  .score {
    font-size: 2.75rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
  }

  .meta {
    font-size: 0.95rem;
    color: #64748b;
    margin-top: 0.35rem;
  }

  .label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: ${ACCENT_DARK};
    font-weight: 600;
  }
`;

const ReviewsEmpty = styled.div`
  text-align: center;
  padding: 2.5rem 1.5rem;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.8);
  border: 1px dashed rgba(148, 163, 184, 0.4);

  .icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
    opacity: 0.5;
  }

  p {
    color: #64748b;
    margin: 0;
    max-width: 360px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.55;
  }
`;

const ReviewCta = styled.button`
  width: 100%;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK});
  box-shadow: 0 4px 14px rgba(233, 30, 99, 0.35);

  &:hover {
    filter: brightness(1.05);
  }
`;

const DETAIL_RATING_LABELS = {
  skill: 'Skill',
  cleanliness: 'Cleanliness',
  atmosphere: 'Atmosphere',
  value: 'Value',
  punctuality: 'Punctuality',
  communication: 'Communication',
};

const renderStars = (rating) =>
  [1, 2, 3, 4, 5].map((i) => (
    <FaStar key={i} size={12} style={{ opacity: i <= Math.round(rating || 0) ? 1 : 0.22 }} />
  ));

const SERVICE_LABELS = {
  manicure: 'Manicure',
  pedicure: 'Pedicure',
  gel_manicure: 'Gel Manicure',
  gel_pedicure: 'Gel Pedicure',
  acrylic: 'Acrylic Nails',
  nail_art: 'Nail Art',
  dip_powder: 'Dip Powder',
  spa_pedicure: 'Spa Pedicure',
  combo: 'Mani + Pedi Combo',
  other: 'Other',
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const TABS = [
  { key: 'about', label: 'About', icon: FaPalette },
  { key: 'place', label: 'Salon', icon: FaImages },
  { key: 'work', label: 'Portfolio', icon: FaImages },
  { key: 'reviews', label: 'Reviews', icon: FaStar },
];

const SalonDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [salon, setSalon] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [messaging, setMessaging] = useState(false);
  const [eligibleReviewAppt, setEligibleReviewAppt] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadReviews = async () => {
    const { data } = await reviewsAPI.getSalonReviews(id);
    setReviews(Array.isArray(data) ? data : []);
  };

  const refreshSalon = async () => {
    const { data } = await salonsAPI.getById(id);
    setSalon(data);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: salonData }, { data: reviewData }] = await Promise.all([
          salonsAPI.getById(id),
          reviewsAPI.getSalonReviews(id),
        ]);
        setSalon(salonData);
        setReviews(Array.isArray(reviewData) ? reviewData : []);
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !id) {
      setEligibleReviewAppt(null);
      return;
    }
    appointmentsAPI
      .getUserAppointments()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        const match = list.find((a) => {
          const salonId = a.salon?._id || a.salon;
          return salonId?.toString() === id && canLeaveReview(a);
        });
        setEligibleReviewAppt(match || null);
      })
      .catch(() => setEligibleReviewAppt(null));
  }, [isAuthenticated, id]);

  const heroImages = useMemo(() => {
    if (!salon) return [];
    return [...(salon.placeImages || []), ...(salon.workImages || [])];
  }, [salon]);

  const activeServices = useMemo(
    () => (salon?.services || []).filter((s) => s.isActive !== false),
    [salon]
  );

  const minPrice = activeServices.length
    ? Math.min(...activeServices.map((s) => s.price))
    : null;

  if (loading) {
    return (
      <Page>
        <LoadingWrap>
          <Spinner animation="border" style={{ color: ACCENT }} />
        </LoadingWrap>
      </Page>
    );
  }

  if (!salon) return null;

  const host = salon.owner;

  const messageSalon = async () => {
    if (!host) return;
    setMessaging(true);
    try {
      const { data: room } = await chatAPI.createRoom({
        salonId: salon._id,
        otherUserId: host._id,
      });
      navigate(`/messages/${room._id}`);
    } catch {
      alert('Could not start chat');
    } finally {
      setMessaging(false);
    }
  };

  const hostName = host ? `${host.firstName || ''} ${host.lastName || ''}`.trim() : '';
  const hostAvatar =
    host?.profileImage ||
    (hostName
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(hostName)}&size=104&background=e91e63&color=fff`
      : null);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <Panel>
            <p style={{ lineHeight: 1.7, color: '#475569', margin: 0 }}>{salon.description}</p>
            {salon.amenities?.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                {salon.amenities.map((a) => (
                  <AmenityChip key={a}>{a.replace(/_/g, ' ')}</AmenityChip>
                ))}
              </div>
            )}
            {(salon.phone || salon.email) && (
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {salon.phone && (
                  <a href={`tel:${salon.phone}`} style={{ color: ACCENT_DARK, textDecoration: 'none', fontSize: '0.9rem' }}>
                    <FaPhone className="me-2" />{salon.phone}
                  </a>
                )}
                {salon.email && (
                  <a href={`mailto:${salon.email}`} style={{ color: ACCENT_DARK, textDecoration: 'none', fontSize: '0.9rem' }}>
                    <FaEnvelope className="me-2" />{salon.email}
                  </a>
                )}
              </div>
            )}
          </Panel>
        );
      case 'place':
        return (
          <PhotoPanel>
            <PhotoMosaic
              images={salon.placeImages}
              variant="gallery"
              enableLightbox
              emptyMessage="No salon photos yet."
            />
          </PhotoPanel>
        );
      case 'work':
        return (
          <PhotoPanel>
            <PhotoMosaic
              images={salon.workImages}
              variant="gallery"
              enableLightbox
              emptyMessage="No portfolio photos yet."
            />
          </PhotoPanel>
        );
      case 'reviews': {
        const avg = salon.averageRating ?? salon.rating ?? 0;
        const count = salon.totalReviews ?? salon.reviews ?? reviews.length;
        return (
          <ReviewsPanel>
            {count > 0 && (
              <ReviewSummary>
                <div className="score">{(Number(avg) || 0).toFixed(1)}</div>
                <div>
                  <div className="label">Guest rating</div>
                  <StarRow>{renderStars(avg)}</StarRow>
                  <div className="meta">
                    {count} verified review{count !== 1 ? 's' : ''}
                  </div>
                </div>
              </ReviewSummary>
            )}
            {eligibleReviewAppt && (
              <ReviewCta type="button" onClick={() => setShowReview(true)}>
                Share your experience — leave a review
              </ReviewCta>
            )}
            {reviews.length > 0 ? (
              <ReviewsList>
                {reviews.map((r) => {
                  const first = r.user?.firstName || '';
                  const last = r.user?.lastName || '';
                  const avatar =
                    r.user?.profileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${first} ${last}`.trim() || 'Guest'
                    )}&size=88&background=e91e63&color=fff`;
                  const details = r.detailedRatings || {};
                  return (
                    <ReviewCard key={r._id}>
                      <ReviewAuthorRow>
                        <img src={avatar} alt="" />
                        <div className="author-meta">
                          <div className="name">
                            {first} {last}
                          </div>
                          {r.createdAt && (
                            <div className="date">
                              {new Date(r.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          )}
                        </div>
                        <div className="rating-col">
                          <div className="rating-num">{r.rating}.0</div>
                          <StarRow>{renderStars(r.rating)}</StarRow>
                        </div>
                      </ReviewAuthorRow>
                      {r.title && <ReviewTitle>{r.title}</ReviewTitle>}
                      <ReviewBody>{r.content}</ReviewBody>
                      {Object.keys(details).length > 0 && (
                        <DetailChips>
                          {Object.entries(details).map(([key, val]) =>
                            val ? (
                              <span key={key}>
                                {DETAIL_RATING_LABELS[key] || key}
                                <strong>{val}</strong>
                              </span>
                            ) : null
                          )}
                        </DetailChips>
                      )}
                    </ReviewCard>
                  );
                })}
              </ReviewsList>
            ) : (
              <ReviewsEmpty>
                <div className="icon">★</div>
                <p>
                  No reviews yet. Book a visit and share your experience once your appointment
                  starts.
                </p>
              </ReviewsEmpty>
            )}
          </ReviewsPanel>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Page>
      <Inner>
        <Hero>
          {heroImages.length > 0 ? (
            <PhotoMosaic images={heroImages.slice(0, 10)} variant="hero" enableLightbox />
          ) : (
            <HeroPlaceholder />
          )}
          <HeroOverlay />
          <HeroGlass>
            <h1>{salon.name}</h1>
            {salon.title && <p className="tagline">{salon.title}</p>}
            <StatRow>
              <span>
                <FaMapMarkerAlt style={{ color: ACCENT }} />
                {[salon.address, salon.city, salon.state].filter(Boolean).join(', ')}
              </span>
              <span className="rating">
                <FaStar /> {(salon.rating || salon.averageRating || 0).toFixed(1)} ({salon.reviews ?? salon.totalReviews ?? 0})
              </span>
              <span>
                <FaUsers /> {salon.numberOfEmployees} staff
              </span>
            </StatRow>
          </HeroGlass>
        </Hero>

        <Layout>
          <MainCol>
            {host && (
              <HostBar>
                <HostInfo>
                  {hostAvatar && <img src={hostAvatar} alt={hostName} />}
                  <div>
                    <div className="label">Your nail tech</div>
                    <p className="name">{hostName}</p>
                  </div>
                </HostInfo>
                <ActionGroup>
                  <FollowButton hostId={host._id} />
                  {isAuthenticated && user?._id !== host._id && (
                    <GlassBtn type="button" onClick={messageSalon} disabled={messaging}>
                      <FaCommentDots />
                      {messaging ? 'Opening...' : 'Message'}
                    </GlassBtn>
                  )}
                </ActionGroup>
              </HostBar>
            )}

            <TabNav>
              {TABS.map(({ key, label, icon: Icon }) => (
                <TabBtn
                  key={key}
                  type="button"
                  $active={activeTab === key}
                  $reviews={key === 'reviews'}
                  onClick={() => setActiveTab(key)}
                >
                  <Icon style={{ marginRight: 6, fontSize: '0.75rem' }} />
                  {key === 'reviews' ? `${label} (${reviews.length})` : label}
                </TabBtn>
              ))}
            </TabNav>

            {renderTabContent()}

            {salon.lat && salon.lng && salon.lat !== 0 && (
              <MapGlass>
                <MapContainer center={[salon.lat, salon.lng]} zoom={14} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[salon.lat, salon.lng]}>
                    <Popup>{salon.name}</Popup>
                  </Marker>
                </MapContainer>
              </MapGlass>
            )}
          </MainCol>

          <Sidebar>
            <BookCard>
              <h5>Services & booking</h5>
              {activeServices.map((service, i) => (
                <ServiceRow key={i}>
                  <div>
                    <strong>{service.name || SERVICE_LABELS[service.category]}</strong>
                    <div className="meta">{service.duration} min</div>
                  </div>
                  <span className="price">{Number(service.price).toLocaleString()} FCFA</span>
                </ServiceRow>
              ))}
              {!activeServices.length && <EmptyText style={{ padding: '1rem 0' }}>No services listed.</EmptyText>}

              <h5 style={{ marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                <FaClock style={{ marginRight: 8, color: ACCENT }} />
                Opening hours
              </h5>
              {DAYS.map((day) => {
                const h = salon.openingHours?.[day];
                return (
                  <HoursRow key={day}>
                    <span>{day}</span>
                    <span>{h?.closed ? 'Closed' : `${h?.open || '09:00'} – ${h?.close || '18:00'}`}</span>
                  </HoursRow>
                );
              })}

              {minPrice != null && (
                <p style={{ marginTop: '1rem', marginBottom: 0, color: '#64748b', fontSize: '0.9rem' }}>
                  From <strong style={{ color: ACCENT_DARK }}>{minPrice.toLocaleString()} FCFA</strong>
                </p>
              )}

              <DesktopOnlyBook>
                <BookBtn
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) navigate('/login');
                    else setShowBooking(true);
                  }}
                >
                  <FaCalendarCheck />
                  Book appointment
                </BookBtn>
              </DesktopOnlyBook>
            </BookCard>
          </Sidebar>
        </Layout>
      </Inner>

      <MobileBookBar>
        <BookBtn
          type="button"
          style={{ marginTop: 0 }}
          onClick={() => {
            if (!isAuthenticated) navigate('/login');
            else setShowBooking(true);
          }}
        >
          <FaCalendarCheck />
          Book appointment
          {minPrice != null && ` · from ${minPrice.toLocaleString()} FCFA`}
        </BookBtn>
      </MobileBookBar>

      {showBooking && (
        <AppointmentForm salon={salon} onClose={() => setShowBooking(false)} />
      )}

      <Modal show={showReview} onHide={() => setShowReview(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Review {salon.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {eligibleReviewAppt && (
            <ReviewForm
              booking={eligibleReviewAppt}
              isLoading={submittingReview}
              onCancel={() => setShowReview(false)}
              onSubmit={async (formData) => {
                setSubmittingReview(true);
                try {
                  await reviewsAPI.createReview({
                    appointmentId: eligibleReviewAppt._id,
                    ...formData,
                  });
                  setShowReview(false);
                  setEligibleReviewAppt(null);
                  await Promise.all([loadReviews(), refreshSalon()]);
                  setActiveTab('reviews');
                } catch (err) {
                  alert(err.response?.data?.message || 'Failed to submit review');
                } finally {
                  setSubmittingReview(false);
                }
              }}
            />
          )}
        </Modal.Body>
      </Modal>
    </Page>
  );
};

export default SalonDetails;
