import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { FaCheckCircle, FaCalendarAlt, FaMapMarkerAlt, FaHome, FaStar } from 'react-icons/fa';
import { appointmentsAPI } from '../services/api';
import { canLeaveReview } from '../utils/appointmentReview';

const ACCENT = '#e91e63';
const ACCENT_DARK = '#c2185b';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(160deg, #fce4ec 0%, #f8fafc 45%, #fff1f2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  max-width: 560px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);

  h1 {
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    color: #0f172a;
  }

  .lead {
    color: #64748b;
    margin-bottom: 1.5rem;
  }
`;

const Details = styled.div`
  text-align: left;
  background: rgba(248, 250, 252, 0.9);
  border-radius: 14px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  font-size: 0.95rem;
  color: #475569;

  p {
    margin-bottom: 0.5rem;
  }

  p:last-child {
    margin-bottom: 0;
  }
`;

const Hint = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  background: rgba(233, 30, 99, 0.06);
  border: 1px solid rgba(233, 30, 99, 0.12);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.25rem;
  text-align: left;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.1rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: ${({ $outline }) => ($outline ? '1px solid #cbd5e1' : 'none')};
  background: ${({ $outline }) =>
    $outline ? '#fff' : `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`};
  color: ${({ $outline }) => ($outline ? '#475569' : '#fff')};
`;

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const appointmentId = searchParams.get('appointment_id');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const load = async () => {
      const id = appointmentId || sessionId;
      if (!id) {
        setError('No booking reference found.');
        setLoading(false);
        return;
      }
      try {
        const { data } = await appointmentsAPI.verifyPayment(id);
        setAppointment(data.appointment || data);
      } catch {
        setError('Could not load your booking. Check My Appointments or contact the salon.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appointmentId, sessionId]);

  if (loading) {
    return (
      <Container>
        <Card>Loading your booking...</Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Card>
          <h1>Booking not found</h1>
          <p className="lead">{error}</p>
          <Btn type="button" onClick={() => navigate('/appointments')}>
            <FaCalendarAlt /> My appointments
          </Btn>
        </Card>
      </Container>
    );
  }

  const appt = appointment;
  const salonId = appt?.salon?._id || appt?.salon;
  const reviewReady = canLeaveReview(appt);

  return (
    <Container>
      <Card>
        <FaCheckCircle style={{ color: '#22c55e', fontSize: '3.5rem', marginBottom: 20 }} />
        <h1>Appointment confirmed!</h1>
        <p className="lead">Your booking is registered. We look forward to seeing you at the salon.</p>

        {appt && (
          <Details>
            <p>
              <FaMapMarkerAlt style={{ color: ACCENT, marginRight: 8 }} />
              <strong>Salon:</strong> {appt.salon?.name || 'N/A'}
            </p>
            <p>
              <FaCalendarAlt style={{ color: ACCENT, marginRight: 8 }} />
              <strong>When:</strong> {new Date(appt.startTime).toLocaleString()}
            </p>
            <p>
              <strong>Total:</strong> {Number(appt.totalPrice).toLocaleString()} FCFA
            </p>
            <p>
              <strong>Services:</strong> {(appt.services || []).map((s) => s.name).join(', ')}
            </p>
          </Details>
        )}

        {reviewReady ? (
          <Hint>
            <FaStar style={{ color: '#f59e0b', marginRight: 6 }} />
            Your appointment has started — leave a review from My appointments or the salon page.
          </Hint>
        ) : (
          <Hint>
            Once your appointment starts, you can leave a review from <strong>My appointments</strong> or the
            salon&apos;s Reviews tab.
          </Hint>
        )}

        <BtnRow>
          <Btn type="button" onClick={() => navigate('/appointments')}>
            <FaCalendarAlt /> My appointments
          </Btn>
          {salonId && reviewReady && (
            <Btn type="button" onClick={() => navigate(`/salon/${salonId}`, { state: { tab: 'reviews' } })}>
              <FaStar /> Leave review
            </Btn>
          )}
          {salonId && (
            <Btn $outline type="button" onClick={() => navigate(`/salon/${salonId}`)}>
              View salon
            </Btn>
          )}
          <Btn $outline type="button" onClick={() => navigate('/')}>
            <FaHome /> Explore salons
          </Btn>
        </BtnRow>
      </Card>
    </Container>
  );
};

export default BookingSuccess;
