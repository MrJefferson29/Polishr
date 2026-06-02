import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { appointmentsAPI } from '../services/api';
import { formatCategoryLabel } from '../constants/salonServiceCatalog';

const serviceDisplayName = (service) =>
  service.name || formatCategoryLabel(service.category);

const AppointmentForm = ({ salon, onClose }) => {
  const navigate = useNavigate();
  const activeServices = (salon.services || []).filter((s) => s.isActive !== false);
  const [selected, setSelected] = useState([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleService = (service) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.name === service.name && s.category === service.category);
      if (exists) return prev.filter((s) => !(s.name === service.name && s.category === service.category));
      return [...prev, service];
    });
  };

  const totalDuration = selected.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = selected.reduce((sum, s) => sum + s.price, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selected.length) {
      setError('Select at least one service.');
      return;
    }
    if (!date || !time) {
      setError('Choose a date and time.');
      return;
    }

    const startTime = new Date(`${date}T${time}:00`);
    if (isNaN(startTime.getTime())) {
      setError('Invalid date or time.');
      return;
    }
    if (startTime <= new Date()) {
      setError('Appointment must be in the future.');
      return;
    }

    setLoading(true);
    try {
      const { data: avail } = await appointmentsAPI.checkAvailability(
        salon._id,
        startTime.toISOString(),
        totalDuration
      );
      if (!avail.available) {
        setError('This time slot is already booked. Please choose another time.');
        setLoading(false);
        return;
      }

      const services = selected.map(({ name, category, duration, price }) => ({
        name, category, duration, price,
      }));

      const { data } = await appointmentsAPI.create({
        salonId: salon._id,
        services,
        startTime: startTime.toISOString(),
        totalPrice,
        notes,
      });

      const appointmentId = data.appointment?._id;
      if (appointmentId) {
        onClose();
        navigate(`/booking-success?appointment_id=${appointmentId}`);
      } else {
        setError('Booking could not be completed. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to book appointment.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Book at {salon.name}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Select services</Form.Label>
            {activeServices.map((service, i) => {
              const isSelected = selected.some(
                (s) => s.name === service.name && s.category === service.category
              );
              return (
                <div
                  key={i}
                  className={`border rounded p-3 mb-2 ${isSelected ? 'border-danger bg-light' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleService(service)}
                >
                  <div className="d-flex justify-content-between">
                    <div>
                      <Form.Check
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleService(service)}
                        label={serviceDisplayName(service)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <small className="text-muted ms-4">{service.duration} min</small>
                    </div>
                    <strong>{service.price} FCFA</strong>
                  </div>
                </div>
              );
            })}
          </Form.Group>

          <div className="row">
            <div className="col-md-6 mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="col-md-6 mb-3">
              <Form.Label>Time</Form.Label>
              <Form.Control type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Notes (optional)</Form.Label>
            <Form.Control as="textarea" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Form.Group>

          {selected.length > 0 && (
            <div className="bg-light rounded p-3">
              <div className="d-flex justify-content-between">
                <span>Duration: {totalDuration} min</span>
                <strong>Total: {totalPrice.toLocaleString()} FCFA</strong>
              </div>
              <p className="small text-muted mb-0 mt-2">
                Payment is handled at the salon. Your booking will be confirmed immediately.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : 'Confirm booking'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AppointmentForm;
