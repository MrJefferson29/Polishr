import React, { useEffect, useState } from 'react';
import {
  Container,
  Button,
  Spinner,
  Alert,
  Form,
  Row,
  Col,
  Card,
  Badge,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaImages } from 'react-icons/fa';
import { salonsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ServiceCatalogPicker from './common/ServiceCatalogPicker';
import { matchExistingToCatalog, mapToServicesArray, normalizeServicesForApi } from '../utils/salonServices';
import { FaTrash } from 'react-icons/fa';

const EditSalon = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
  });
  const [placeUrls, setPlaceUrls] = useState([]);
  const [workUrls, setWorkUrls] = useState([]);
  const [newPlaceFiles, setNewPlaceFiles] = useState([]);
  const [newWorkFiles, setNewWorkFiles] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    if (user?.role !== 'host' && user?.role !== 'admin') {
      navigate('/');
      return;
    }
    salonsAPI
      .getMySalon()
      .then(({ data }) => {
        setSalon(data);
        setForm({
          name: data.name || '',
          title: data.title || '',
          description: data.description || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || 'Cameroon',
          postalCode: data.postalCode || '',
          lat: data.lat != null ? String(data.lat) : '',
          lng: data.lng != null ? String(data.lng) : '',
          phone: data.phone || '',
          email: data.email || '',
          numberOfEmployees: data.numberOfEmployees || 1,
        });
        setPlaceUrls(data.placeImages || []);
        setWorkUrls(data.workImages || []);
        const { catalogMap, customServices } = matchExistingToCatalog(data.services || []);
        setServices([...mapToServicesArray(catalogMap), ...customServices]);
      })
      .catch((err) => {
        if (err.response?.status === 404) navigate('/create-salon');
        else setError('Failed to load salon');
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleForm = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        handleForm('lat', String(coords.latitude));
        handleForm('lng', String(coords.longitude));
        setError('');
      },
      () => setError('Could not detect location. Allow GPS access or enter coordinates manually.')
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!salon?._id) return;
    const normalized = normalizeServicesForApi(services);
    if (!normalized.length) {
      setError('Select at least one service with pricing.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('existingPlaceImages', JSON.stringify(placeUrls));
      fd.append('existingWorkImages', JSON.stringify(workUrls));
      fd.append('services', JSON.stringify(normalized));
      newPlaceFiles.forEach((f) => fd.append('placeImages', f));
      newWorkFiles.forEach((f) => fd.append('workImages', f));

      const { data } = await salonsAPI.update(salon._id, fd);
      setSalon(data);
      setPlaceUrls(data.placeImages || []);
      setWorkUrls(data.workImages || []);
      setNewPlaceFiles([]);
      setNewWorkFiles([]);
      setSuccess('Salon updated successfully.');
      setTimeout(() => navigate('/my-salon'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const ImageGrid = ({ urls, setUrls, label, fileState, setFiles }) => (
    <Card className="mb-4 border-0 shadow-sm">
      <Card.Body>
        <h5 className="mb-3"><FaImages className="me-2" />{label}</h5>
        <Row className="g-2 mb-3">
          {urls.map((url) => (
            <Col key={url} xs={6} md={4} lg={3}>
              <div className="position-relative">
                <img
                  src={url}
                  alt=""
                  className="rounded w-100"
                  style={{
                    height: 140,
                    objectFit: 'contain',
                    background: '#f8fafc',
                  }}
                />
                <Button
                  size="sm"
                  variant="danger"
                  className="position-absolute top-0 end-0 m-1"
                  onClick={() => setUrls((u) => u.filter((x) => x !== url))}
                >
                  <FaTrash />
                </Button>
              </div>
            </Col>
          ))}
        </Row>
        <Form.Control
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
        {fileState.length > 0 && (
          <Badge bg="info" className="mt-2">{fileState.length} new file(s) to upload</Badge>
        )}
      </Card.Body>
    </Card>
  );

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Edit Salon</h2>
        <Button variant="outline-secondary" onClick={() => navigate('/my-salon')}>Cancel</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSave}>
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Body>
            <h5 className="mb-3">Basic info</h5>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label>Salon name</Form.Label>
                <Form.Control value={form.name} onChange={(e) => handleForm('name', e.target.value)} required />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Tagline</Form.Label>
                <Form.Control value={form.title} onChange={(e) => handleForm('title', e.target.value)} />
              </Col>
              <Col className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) => handleForm('description', e.target.value)}
                  required
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <ImageGrid
          urls={placeUrls}
          setUrls={setPlaceUrls}
          label="Salon photos"
          fileState={newPlaceFiles}
          setFiles={setNewPlaceFiles}
        />
        <ImageGrid
          urls={workUrls}
          setUrls={setWorkUrls}
          label="Previous work / portfolio"
          fileState={newWorkFiles}
          setFiles={setNewWorkFiles}
        />

        <Card className="mb-4 border-0 shadow-sm">
          <Card.Body>
            <h5 className="mb-3">Services & pricing</h5>
            <p className="text-muted small mb-3">
              Nail, hair, wig installs, braiding, and more — check what you offer and set FCFA prices.
            </p>
            <ServiceCatalogPicker value={services} onChange={setServices} />
          </Card.Body>
        </Card>

        <Card className="mb-4 border-0 shadow-sm">
          <Card.Body>
            <h5 className="mb-3">Location</h5>
            <Row>
              <Col className="mb-2"><Form.Label>Address</Form.Label><Form.Control value={form.address} onChange={(e) => handleForm('address', e.target.value)} /></Col>
              <Col md={4} className="mb-2"><Form.Label>City</Form.Label><Form.Control value={form.city} onChange={(e) => handleForm('city', e.target.value)} /></Col>
              <Col md={4} className="mb-2"><Form.Label>Region</Form.Label><Form.Control value={form.state} onChange={(e) => handleForm('state', e.target.value)} /></Col>
              <Col md={4} className="mb-2"><Form.Label>Country</Form.Label><Form.Control value={form.country} onChange={(e) => handleForm('country', e.target.value)} /></Col>
              <Col md={4} className="mb-2"><Form.Label>Latitude</Form.Label><Form.Control value={form.lat} onChange={(e) => handleForm('lat', e.target.value)} placeholder="e.g. 4.0511" /></Col>
              <Col md={4} className="mb-2"><Form.Label>Longitude</Form.Label><Form.Control value={form.lng} onChange={(e) => handleForm('lng', e.target.value)} placeholder="e.g. 9.7679" /></Col>
              <Col md={4} className="mb-2"><Form.Label>Phone</Form.Label><Form.Control value={form.phone} onChange={(e) => handleForm('phone', e.target.value)} /></Col>
            </Row>
            <Button type="button" variant="outline-danger" size="sm" className="mb-2" onClick={useCurrentLocation}>
              Use my current location
            </Button>
            <p className="small text-muted mb-0">Set latitude/longitude so guests can find you nearby on the home page.</p>
          </Card.Body>
        </Card>

        <Button type="submit" variant="danger" size="lg" disabled={saving}>
          <FaSave className="me-2" />
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </Form>
    </Container>
  );
};

export default EditSalon;
