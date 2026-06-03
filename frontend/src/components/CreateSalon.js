import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { salonsAPI } from '../services/api';
import styled from 'styled-components';
import ServiceCatalogPicker from './common/ServiceCatalogPicker';
import { normalizeServicesForApi } from '../utils/salonServices';

const DEFAULT_HOURS = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '10:00', close: '16:00', closed: false },
  sunday: { open: '10:00', close: '16:00', closed: true },
};

const Section = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
`;

const CreateSalon = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: 'Cameroon',
    postalCode: '',
    lat: '',
    lng: '',
    phone: '',
    email: '',
    numberOfEmployees: 1,
    cancellationPolicy: '24 hours before appointment',
  });
  const [placeImages, setPlaceImages] = useState([]);
  const [workImages, setWorkImages] = useState([]);
  const [services, setServices] = useState([]);
  const [openingHours] = useState(DEFAULT_HOURS);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        update('lat', String(coords.latitude));
        update('lng', String(coords.longitude));
      },
      () => setError('Could not detect location. Allow GPS access or enter coordinates manually.')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalized = normalizeServicesForApi(services);
    if (!normalized.length) {
      setError('Select at least one service with pricing.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('services', JSON.stringify(normalized));
      fd.append('openingHours', JSON.stringify(openingHours));
      fd.append('amenities', JSON.stringify(['wifi', 'parking']));
      placeImages.forEach((f) => fd.append('placeImages', f));
      workImages.forEach((f) => fd.append('workImages', f));
      await salonsAPI.create(fd);
      navigate('/my-salon');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create salon profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: 800 }}>
      <h2 className="mb-4">Set Up Your Salon Profile</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Section>
          <h5>Basic Info</h5>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>Salon Name *</Form.Label>
              <Form.Control value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Tagline</Form.Label>
              <Form.Control value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Luxury nails & spa" />
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Description *</Form.Label>
            <Form.Control as="textarea" rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} required />
          </Form.Group>
          <Row>
            <Col md={8} className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control value={form.address} onChange={(e) => update('address', e.target.value)} />
            </Col>
            <Col md={4} className="mb-3">
              <Form.Label>City *</Form.Label>
              <Form.Control value={form.city} onChange={(e) => update('city', e.target.value)} required />
            </Col>
          </Row>
          <Row>
            <Col md={4} className="mb-3">
              <Form.Label>State</Form.Label>
              <Form.Control value={form.state} onChange={(e) => update('state', e.target.value)} />
            </Col>
            <Col md={4} className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </Col>
            <Col md={4} className="mb-3">
              <Form.Label>Staff Count</Form.Label>
              <Form.Control type="number" min={1} value={form.numberOfEmployees} onChange={(e) => update('numberOfEmployees', e.target.value)} />
            </Col>
          </Row>
          <Row>
            <Col md={4} className="mb-3">
              <Form.Label>Country</Form.Label>
              <Form.Control value={form.country} onChange={(e) => update('country', e.target.value)} />
            </Col>
            <Col md={4} className="mb-3">
              <Form.Label>Latitude</Form.Label>
              <Form.Control value={form.lat} onChange={(e) => update('lat', e.target.value)} placeholder="e.g. 4.0511" />
            </Col>
            <Col md={4} className="mb-3">
              <Form.Label>Longitude</Form.Label>
              <Form.Control value={form.lng} onChange={(e) => update('lng', e.target.value)} placeholder="e.g. 9.7679" />
            </Col>
          </Row>
          <Button type="button" variant="outline-danger" size="sm" onClick={useCurrentLocation}>
            Use my current location
          </Button>
          <p className="small text-muted mt-2 mb-0">
            Location helps guests discover your salon on the home page nearby list.
          </p>
        </Section>

        <Section>
          <h5>Photos</h5>
          <Form.Group className="mb-3">
            <Form.Label>Salon photos</Form.Label>
            <Form.Control type="file" accept="image/*" multiple onChange={(e) => setPlaceImages(Array.from(e.target.files))} />
          </Form.Group>
          <Form.Group>
            <Form.Label>Portfolio / previous work</Form.Label>
            <Form.Control type="file" accept="image/*" multiple onChange={(e) => setWorkImages(Array.from(e.target.files))} />
          </Form.Group>
        </Section>

        <Section>
          <h5 className="mb-3">Services & pricing</h5>
          <ServiceCatalogPicker value={services} onChange={setServices} />
        </Section>

        <Button variant="danger" size="lg" type="submit" disabled={loading} className="w-100 rounded-pill">
          {loading ? <Spinner size="sm" animation="border" /> : 'Create Salon Profile'}
        </Button>
      </Form>
    </Container>
  );
};

export default CreateSalon;
