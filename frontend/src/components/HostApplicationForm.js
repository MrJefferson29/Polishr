import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hostApplicationsAPI } from '../services/api';
import styled from 'styled-components';
import {
  FaCheckCircle,
  FaEye,
  FaHome,
  FaCheck,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaFileAlt,
  FaStar,
  FaInfoCircle,
  FaListUl,
} from 'react-icons/fa';
import ServiceCatalogPicker from './common/ServiceCatalogPicker';
import { normalizeServicesForApi } from '../utils/salonServices';

const ACCENT = '#e91e63';
const ACCENT_DARK = '#c2185b';

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(160deg, #fce4ec 0%, #f8fafc 40%, #fff1f2 100%);
  padding: 2rem 1rem 3rem;
`;

const Card = styled.div`
  max-width: 880px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border-radius: 24px;
  box-shadow: 0 8px 40px rgba(233, 30, 99, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.7);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 2rem 2rem 1.25rem;
  border-bottom: 1px solid rgba(233, 30, 99, 0.1);
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.06) 0%, rgba(252, 228, 236, 0.4) 100%);

  h1 {
    font-size: clamp(1.35rem, 3vw, 1.65rem);
    font-weight: 800;
    margin: 0 0 0.5rem;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 0.95rem;
    line-height: 1.55;
    max-width: 640px;
  }
`;

const Stepper = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const StepPill = styled.div`
  flex: 1;
  min-width: 110px;
  text-align: center;
  padding: 0.65rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $active, $done }) =>
    $active
      ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`
      : $done
        ? 'rgba(233, 30, 99, 0.12)'
        : '#f1f5f9'};
  color: ${({ $active, $done }) => ($active ? '#fff' : $done ? ACCENT_DARK : '#64748b')};
  box-shadow: ${({ $active }) => ($active ? '0 4px 14px rgba(233, 30, 99, 0.3)' : 'none')};
`;

const Body = styled.div`
  padding: 1.75rem 2rem 2rem;

  @media (max-width: 576px) {
    padding: 1.25rem 1rem 1.5rem;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-weight: 600;
    font-size: 0.875rem;
    color: #334155;
  }

  .req {
    color: ${ACCENT};
  }

  input,
  select,
  textarea {
    padding: 0.75rem 0.9rem;
    border: 1px solid rgba(148, 163, 184, 0.35);
    border-radius: 12px;
    font-size: 0.95rem;
    font-family: inherit;
    background: rgba(255, 255, 255, 0.9);
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      outline: none;
      border-color: ${ACCENT};
      box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.12);
    }
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }
`;

const Hint = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1.25rem;
  line-height: 1.5;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: rgba(233, 30, 99, 0.06);
  border: 1px solid rgba(233, 30, 99, 0.1);

  svg {
    color: ${ACCENT};
    margin-right: 6px;
  }
`;

const LocBtn = styled.button`
  margin-top: 8px;
  padding: 0.55rem 1rem;
  border: 1px solid rgba(233, 30, 99, 0.35);
  border-radius: 10px;
  background: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${ACCENT_DARK};
  cursor: pointer;

  &:hover {
    background: rgba(233, 30, 99, 0.06);
  }
`;

const ErrorBox = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const ReviewBlock = styled.div`
  background: rgba(248, 250, 252, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  padding: 1rem 1.15rem;
  margin-bottom: 0.75rem;

  h4 {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${ACCENT_DARK};
    margin: 0 0 0.65rem;
    font-weight: 700;
  }

  p {
    margin: 0 0 0.35rem;
    font-size: 0.9rem;
    color: #475569;
  }
`;

const Nav = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
`;

const Btn = styled.button`
  padding: 0.65rem 1.35rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: ${({ $primary }) => ($primary ? 'none' : '1px solid rgba(148, 163, 184, 0.4)')};
  background: ${({ $primary }) =>
    $primary ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` : '#fff'};
  color: ${({ $primary }) => ($primary ? '#fff' : '#475569')};
  box-shadow: ${({ $primary }) => ($primary ? '0 4px 14px rgba(233, 30, 99, 0.3)' : 'none')};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SuccessWrap = styled.div`
  max-width: 520px;
  margin: 4rem auto;
  text-align: center;
  padding: 2.5rem 1.75rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(233, 30, 99, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.8);

  svg {
    font-size: 3rem;
    color: #22c55e;
    margin-bottom: 1rem;
  }

  h2 {
    margin-bottom: 0.75rem;
    font-weight: 800;
  }

  p {
    color: #64748b;
    margin-bottom: 1.5rem;
    line-height: 1.55;
  }
`;

const STEPS = ['Your details', 'Salon info', 'Services & pricing', 'Review'];

const HostApplicationForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Cameroon',
    lat: '',
    lng: '',
    salonName: '',
    salonDescription: '',
    numberOfEmployees: 1,
    yearsOfExperience: 0,
    services: [],
  });

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  useEffect(() => {
    if (!location.state?.editMode && user) {
      hostApplicationsAPI.getMy().then(() => navigate('/become-a-host/status')).catch(() => {});
    }
  }, [user, navigate, location.state?.editMode]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        set('lat', String(coords.latitude));
        set('lng', String(coords.longitude));
        setError('');
      },
      () => setError('Could not detect location. You can still apply without map coordinates.')
    );
  };

  const validateStep = (s) => {
    if (s === 0) {
      return (
        form.firstName &&
        form.lastName &&
        form.email &&
        form.phoneNumber &&
        form.street &&
        form.city &&
        form.state &&
        form.country
      );
    }
    if (s === 1) {
      return form.salonName && form.salonDescription && Number(form.numberOfEmployees) >= 1;
    }
    if (s === 2) {
      return normalizeServicesForApi(form.services).length > 0;
    }
    return true;
  };

  const next = () => {
    if (!validateStep(step)) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      setError('Please complete all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        numberOfEmployees: Number(form.numberOfEmployees) || 1,
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
        services: normalizeServicesForApi(form.services),
      };
      await hostApplicationsAPI.submit(payload);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Page>
        <SuccessWrap>
          <FaCheckCircle />
          <h2>Application submitted</h2>
          <p>We will review your application and notify you by email. This usually takes 2–3 business days.</p>
          <Nav style={{ justifyContent: 'center', border: 'none', marginTop: 0 }}>
            <Btn $primary type="button" onClick={() => navigate('/host-application-status')}>
              <FaEye style={{ marginRight: 8 }} /> View status
            </Btn>
            <Btn type="button" onClick={() => navigate('/')}>
              <FaHome style={{ marginRight: 8 }} /> Home
            </Btn>
          </Nav>
        </SuccessWrap>
      </Page>
    );
  }

  return (
    <Page>
      <Card>
        <Header>
          <h1>Become a host</h1>
          <p>
            Apply to list your nail salon on NailBook. Your address will be used as your salon location for guests
            searching nearby.
          </p>
        </Header>

        <Stepper>
          {STEPS.map((label, i) => (
            <StepPill key={label} $active={i === step} $done={i < step}>
              {i + 1}. {label}
            </StepPill>
          ))}
        </Stepper>

        <Body>
          {error && <ErrorBox>{error}</ErrorBox>}

          {step === 0 && (
            <>
              <Hint>
                <FaInfoCircle /> Contact and location details. This address becomes your salon address after approval.
              </Hint>
              <Grid>
                <Field>
                  <label>First name <span className="req">*</span></label>
                  <input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
                </Field>
                <Field>
                  <label>Last name <span className="req">*</span></label>
                  <input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
                </Field>
                <Field>
                  <label><FaEnvelope /> Email <span className="req">*</span></label>
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
                </Field>
                <Field>
                  <label><FaPhone /> Phone <span className="req">*</span></label>
                  <input type="tel" value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)} placeholder="+237 6XX XXX XXX" required />
                </Field>
                <FullWidth>
                  <Field>
                    <label><FaMapMarkerAlt /> Address <span className="req">*</span></label>
                    <input value={form.street} onChange={(e) => set('street', e.target.value)} placeholder="Street address" required />
                  </Field>
                </FullWidth>
                <Field>
                  <label>City <span className="req">*</span></label>
                  <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Douala" required />
                </Field>
                <Field>
                  <label>Region <span className="req">*</span></label>
                  <input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="Littoral" required />
                </Field>
                <Field>
                  <label>Postal code</label>
                  <input value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} />
                </Field>
                <Field>
                  <label>Country <span className="req">*</span></label>
                  <select value={form.country} onChange={(e) => set('country', e.target.value)}>
                    <option value="Cameroon">Cameroon</option>
                  </select>
                </Field>
                <FullWidth>
                  <LocBtn type="button" onClick={useCurrentLocation}>
                    Use my current location (for nearby search)
                  </LocBtn>
                  {(form.lat || form.lng) && (
                    <Hint style={{ marginTop: 8 }}>
                      Coordinates: {form.lat}, {form.lng}
                    </Hint>
                  )}
                </FullWidth>
              </Grid>
            </>
          )}

          {step === 1 && (
            <>
              <Hint>
                <FaHome /> Tell guests about your salon. Location is taken from the address you entered in step 1.
              </Hint>
              <Grid>
                <FullWidth>
                  <Field>
                    <label>Salon name <span className="req">*</span></label>
                    <input value={form.salonName} onChange={(e) => set('salonName', e.target.value)} required />
                  </Field>
                </FullWidth>
                <FullWidth>
                  <Field>
                    <label><FaFileAlt /> Description <span className="req">*</span></label>
                    <textarea value={form.salonDescription} onChange={(e) => set('salonDescription', e.target.value)} required />
                  </Field>
                </FullWidth>
                <Field>
                  <label>Number of employees <span className="req">*</span></label>
                  <input type="number" min={1} value={form.numberOfEmployees} onChange={(e) => set('numberOfEmployees', e.target.value)} required />
                </Field>
                <Field>
                  <label><FaStar /> Years of experience <span className="req">*</span></label>
                  <input type="number" min={0} value={form.yearsOfExperience} onChange={(e) => set('yearsOfExperience', e.target.value)} required />
                </Field>
              </Grid>
            </>
          )}

          {step === 2 && (
            <>
              <Hint>
                <FaListUl /> Check every service you offer. Set your price in FCFA and estimated duration (minutes).
              </Hint>
              <ServiceCatalogPicker
                value={form.services}
                onChange={(services) => set('services', services)}
              />
            </>
          )}

          {step === 3 && (
            <>
              <ReviewBlock>
                <h4>Your details</h4>
                <p><strong>Name:</strong> {form.firstName} {form.lastName}</p>
                <p><strong>Email:</strong> {form.email}</p>
                <p><strong>Phone:</strong> {form.phoneNumber}</p>
                <p><strong>Address:</strong> {form.street}, {form.city}, {form.state}{form.postalCode ? ` ${form.postalCode}` : ''}, {form.country}</p>
              </ReviewBlock>
              <ReviewBlock>
                <h4>Salon (same location)</h4>
                <p><strong>Name:</strong> {form.salonName}</p>
                <p><strong>Description:</strong> {form.salonDescription}</p>
                <p><strong>Employees:</strong> {form.numberOfEmployees}</p>
                <p><strong>Experience:</strong> {form.yearsOfExperience} years</p>
              </ReviewBlock>
              <ReviewBlock>
                <h4>Services ({normalizeServicesForApi(form.services).length})</h4>
                {normalizeServicesForApi(form.services).map((s) => (
                  <p key={`${s.catalogId || s.name}`}>
                    {s.name} — {Number(s.price).toLocaleString()} FCFA · {s.duration} min
                  </p>
                ))}
              </ReviewBlock>
            </>
          )}

          <Nav>
            <Btn type="button" disabled={step === 0} onClick={() => { setError(''); setStep((s) => s - 1); }}>
              Back
            </Btn>
            {step < STEPS.length - 1 ? (
              <Btn $primary type="button" onClick={next}>Continue</Btn>
            ) : (
              <Btn $primary type="button" disabled={loading} onClick={submit}>
                {loading ? 'Submitting…' : <><FaCheck /> Submit application</>}
              </Btn>
            )}
          </Nav>
        </Body>
      </Card>
    </Page>
  );
};

export default HostApplicationForm;
