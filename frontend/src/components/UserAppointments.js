import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import {
  FaEnvelope,
  FaPhone,
  FaCommentDots,
  FaUser,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaStar,
} from 'react-icons/fa';
import { appointmentsAPI, reviewsAPI, chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReviewForm from './ReviewForm';
import { canLeaveReview, reviewStatusLabel } from '../utils/appointmentReview';

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
  max-width: 900px;
  margin: 0 auto;
`;

const PageHeader = styled.header`
  margin-bottom: 1.5rem;

  h1 {
    font-size: clamp(1.35rem, 4vw, 1.75rem);
    font-weight: 800;
    margin: 0 0 0.35rem;
    color: #0f172a;
  }

  p {
    color: #64748b;
    margin: 0;
    font-size: 0.95rem;
  }
`;

const ApptCard = styled.article`
  ${glass}
  border-radius: 20px;
  padding: 1.25rem 1.35rem;
  margin-bottom: 1rem;
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;

  h2 {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    color: #0f172a;
  }

  .sub {
    font-size: 0.8rem;
    color: #94a3b8;
    margin: 0;
  }
`;

const StatusPill = styled.span`
  flex-shrink: 0;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: capitalize;
  background: ${({ $variant }) => {
    const map = {
      pending: 'rgba(245, 158, 11, 0.15)',
      confirmed: 'rgba(34, 197, 94, 0.15)',
      completed: 'rgba(59, 130, 246, 0.15)',
      cancelled: 'rgba(148, 163, 184, 0.2)',
      no_show: 'rgba(239, 68, 68, 0.15)',
    };
    return map[$variant] || map.cancelled;
  }};
  color: ${({ $variant }) => {
    const map = {
      pending: '#b45309',
      confirmed: '#15803d',
      completed: '#1d4ed8',
      cancelled: '#64748b',
      no_show: '#b91c1c',
    };
    return map[$variant] || '#64748b';
  }};
`;

const MetaGrid = styled.div`
  display: grid;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #475569;
  margin-bottom: 0.75rem;

  .row-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .price {
    font-weight: 700;
    color: ${ACCENT_DARK};
    font-size: 1rem;
    margin-top: 0.25rem;
  }
`;

const GuestPanel = styled.div`
  margin-top: 0.75rem;
  padding: 1rem;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.2);
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex-wrap: wrap;

  img {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .guest-meta {
    flex: 1;
    min-width: 140px;
    font-size: 0.875rem;
    color: #475569;

    strong {
      display: block;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }

    a {
      color: ${ACCENT_DARK};
      text-decoration: none;
    }
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.9rem;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: ${({ $primary, $outline }) =>
    $primary ? 'none' : $outline ? '1px solid #cbd5e1' : `1px solid rgba(233, 30, 99, 0.35)`};
  background: ${({ $primary }) =>
    $primary ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` : '#fff'};
  color: ${({ $primary, $outline }) => ($primary ? '#fff' : $outline ? '#475569' : ACCENT_DARK)};

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ReviewHint = styled.span`
  font-size: 0.8rem;
  color: #64748b;
  align-self: center;
`;

const ReviewBadge = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
  align-self: center;
`;

const EmptyState = styled.div`
  ${glass}
  border-radius: 20px;
  padding: 3rem 1.5rem;
  text-align: center;
  color: #64748b;

  p {
    margin-bottom: 1.25rem;
  }
`;

const LoadingWrap = styled.div`
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GuestInfo = ({ guest, onMessage, messaging }) => {
  if (!guest) return null;
  const name = `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || 'Guest';
  const avatar =
    guest.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=64&background=e91e63&color=fff`;

  return (
    <GuestPanel>
      <img src={avatar} alt="" />
      <div className="guest-meta">
        <strong>
          <FaUser className="me-1" /> {name}
        </strong>
        {guest.email && (
          <div>
            <FaEnvelope className="me-1" />
            <a href={`mailto:${guest.email}`}>{guest.email}</a>
          </div>
        )}
        {guest.phoneNumber ? (
          <div>
            <FaPhone className="me-1" />
            <a href={`tel:${guest.phoneNumber}`}>{guest.phoneNumber}</a>
          </div>
        ) : (
          <div className="fst-italic">No phone on file</div>
        )}
      </div>
      <Btn $primary type="button" disabled={messaging} onClick={onMessage}>
        <FaCommentDots />
        {messaging ? 'Opening...' : 'Message guest'}
      </Btn>
    </GuestPanel>
  );
};

const UserAppointments = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const isHost = user?.role === 'host';
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [messagingId, setMessagingId] = useState(null);

  const loadAppointments = useCallback(async () => {
    try {
      setError('');
      const { data } = isHost
        ? await appointmentsAPI.getHostAppointments()
        : await appointmentsAPI.getUserAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [isHost]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setLoading(true);
    loadAppointments();
  }, [isAuthenticated, navigate, loadAppointments]);

  const cancelAppointment = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await appointmentsAPI.cancel(id);
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel');
    }
  };

  const messageGuest = async (appt) => {
    const guestId = appt.user?._id || appt.user;
    const salonId = appt.salon?._id || appt.salon;
    if (!guestId || !salonId) {
      alert('Cannot start chat: missing guest or salon information.');
      return;
    }
    setMessagingId(appt._id);
    try {
      const { data: room } = await chatAPI.createRoom({
        salonId,
        otherUserId: guestId,
      });
      navigate(`/messages/${room._id}`);
    } catch {
      alert('Could not start chat with this guest.');
    } finally {
      setMessagingId(null);
    }
  };

  const submitReview = async (formData) => {
    setSubmittingReview(true);
    try {
      await reviewsAPI.createReview({
        appointmentId: reviewTarget._id,
        ...formData,
      });
      setShowReview(false);
      setReviewTarget(null);
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <Page>
        <LoadingWrap>
          <Spinner animation="border" style={{ color: ACCENT }} />
        </LoadingWrap>
      </Page>
    );
  }

  return (
    <Page>
      <Inner>
        <PageHeader>
          <h1>{isHost ? 'Salon appointments' : 'My appointments'}</h1>
          <p>
            {isHost
              ? 'Bookings guests have made at your salon.'
              : 'Leave a review once your appointment starts.'}
          </p>
        </PageHeader>

        {error && <Alert variant="danger" className="rounded-3 mb-3">{error}</Alert>}

        {appointments.length === 0 && (
          <EmptyState>
            <p>{isHost ? 'No guest bookings yet.' : 'No appointments yet.'}</p>
            <Btn $primary type="button" onClick={() => navigate(isHost ? '/my-salon' : '/')}>
              {isHost ? 'Go to my salon' : 'Find a salon'}
            </Btn>
          </EmptyState>
        )}

        {appointments.map((appt) => {
          const guest = appt.user;
          const status = appt.status?.replace('_', ' ') || 'unknown';
          return (
            <ApptCard key={appt._id}>
              <CardTop>
                <div>
                  {isHost ? (
                    <>
                      <h2>{appt.salon?.name || 'Your salon'}</h2>
                      <p className="sub">Guest booking</p>
                    </>
                  ) : (
                    <h2>{appt.salon?.name || 'Salon'}</h2>
                  )}
                </div>
                <StatusPill $variant={appt.status}>{status}</StatusPill>
              </CardTop>

              <MetaGrid>
                <div className="row-item">
                  <FaCalendarAlt style={{ color: ACCENT, marginTop: 3 }} />
                  <span>
                    {new Date(appt.startTime).toLocaleString()} · {appt.totalDuration} min
                  </span>
                </div>
                {!isHost && appt.salon?.city && (
                  <div className="row-item">
                    <FaMapMarkerAlt style={{ color: ACCENT, marginTop: 3 }} />
                    <span>{appt.salon.city}</span>
                  </div>
                )}
                <div>{(appt.services || []).map((s) => s.name).join(', ')}</div>
                {appt.notes && (
                  <div>
                    <strong>Notes:</strong> {appt.notes}
                  </div>
                )}
                <div className="price">{Number(appt.totalPrice).toLocaleString()} FCFA</div>
              </MetaGrid>

              {isHost && (
                <GuestInfo
                  guest={guest}
                  messaging={messagingId === appt._id}
                  onMessage={() => messageGuest(appt)}
                />
              )}

              <Actions>
                {!isHost && appt.salon && (
                  <Btn type="button" onClick={() => navigate(`/salon/${appt.salon._id}`)}>
                    View salon
                  </Btn>
                )}
                {isHost && appt.salon && (
                  <Btn $outline type="button" onClick={() => navigate(`/salon/${appt.salon._id}`)}>
                    Public page
                  </Btn>
                )}
                {['pending', 'confirmed'].includes(appt.status) && (
                  <Btn $outline type="button" onClick={() => cancelAppointment(appt._id)}>
                    Cancel
                  </Btn>
                )}
                {!isHost && appt.hasReview && <ReviewBadge>Review submitted</ReviewBadge>}
                {!isHost && !appt.hasReview && reviewStatusLabel(appt) && !canLeaveReview(appt) && (
                  <ReviewHint>{reviewStatusLabel(appt)}</ReviewHint>
                )}
                {!isHost && canLeaveReview(appt) && (
                  <Btn
                    $primary
                    type="button"
                    onClick={() => {
                      setReviewTarget(appt);
                      setShowReview(true);
                    }}
                  >
                    <FaStar /> Leave review
                  </Btn>
                )}
              </Actions>
            </ApptCard>
          );
        })}

        <Modal show={showReview} onHide={() => setShowReview(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Review {reviewTarget?.salon?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {reviewTarget && (
              <ReviewForm
                booking={reviewTarget}
                onSubmit={submitReview}
                onCancel={() => setShowReview(false)}
                isLoading={submittingReview}
              />
            )}
          </Modal.Body>
        </Modal>
      </Inner>
    </Page>
  );
};

export default UserAppointments;
