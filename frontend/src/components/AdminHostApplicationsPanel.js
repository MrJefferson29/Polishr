import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { hostApplicationsAPI } from '../services/api';
import './AdminHostApplicationsPanel.css';
import { 
  Eye, 
  Check, 
  X, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  Mail,
  Calendar,
  FileText,
  RefreshCw,
  Filter,
  Search,
  CreditCard,
  Home,
  MapPin,
  Phone,
  Image,
  AlertCircle,
  DollarSign,
  Shield
} from 'lucide-react';

const AdminHostApplicationsPanel = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
    setLoading(true);
      const response = await hostApplicationsAPI.list();
      setApplications(response.data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId) => {
    try {
      setProcessing(true);
      await hostApplicationsAPI.approve(applicationId, { adminNote: adminNote.trim() || 'Approved by admin' });
      await fetchApplications();
      setShowModal(false);
      setSelectedApplication(null);
      setAdminNote('');
    } catch (err) {
      console.error('Error approving application:', err);
      const msg = err.response?.data?.message || 'Failed to approve application';
      alert(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async (applicationId) => {
    if (!adminNote.trim()) {
      alert('Please provide a reason for declining the application');
      return;
    }

    try {
      setProcessing(true);
      await hostApplicationsAPI.decline(applicationId, adminNote);
      await fetchApplications();
      setShowModal(false);
      setSelectedApplication(null);
      setAdminNote('');
    } catch (err) {
      console.error('Error declining application:', err);
      alert('Failed to decline application');
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (type, application) => {
    setModalType(type);
    setSelectedApplication(application);
    setShowModal(true);
    if (type === 'decline') {
      setAdminNote('');
    } else if (type === 'approve') {
      setAdminNote('');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedApplication(null);
    setModalType('');
    setAdminNote('');
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = !statusFilter || app.status === statusFilter;
    const matchesSearch = !searchTerm || 
      app.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });



  // Loading State
  if (loading) {
    return (
      <div className="admin-applications-container">
      <Container>
          <div className="admin-loading-container">
            <div className="admin-loading-spinner">
              <RefreshCw size={48} />
            </div>
            <div className="admin-loading-text">
              Loading applications...
            </div>
          </div>
      </Container>
      </div>
    );
  }

  // Empty State
  if (filteredApplications.length === 0 && !loading) {
  return (
      <div className="admin-applications-container">
    <Container>

          {/* Error Display */}
        {error && (
            <div className="admin-error-container">
              <AlertCircle size={20} />
            {error}
            </div>
          )}

          {/* Empty State */}
          <Card className="admin-empty-state">
            <div className="admin-empty-icon">
              <FileText size={48} />
            </div>
            <h3 className="admin-empty-title">
              No Applications Found
            </h3>
            <p className="admin-empty-message">
            {statusFilter || searchTerm 
              ? 'No applications match your current filters. Try adjusting your search criteria.'
              : 'There are no host applications to review at this time.'
            }
            </p>
          </Card>
      </Container>
      </div>
    );
  }

  return (
    <div className="admin-applications-container">
    <Container>


        {/* Error Display */}
      {error && (
          <Alert variant="danger" style={{ marginBottom: '32px' }}>
            <AlertCircle size={20} style={{ marginRight: '8px' }} />
          {error}
        </Alert>
      )}

        {/* Controls Section */}
        <Card className="admin-controls-container">
          <Card.Body>
            <h3 className="admin-controls-title">
              <Filter size={20} /> Search & Filters
            </h3>
            <div className="admin-controls-row">
              <select 
                className="admin-filter-select"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
              </select>
          
              <input
                className="admin-search-input"
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
            </div>
          </Card.Body>
        </Card>

        {/* Applications Table */}
        <Card className="admin-table-container">
          <div className="admin-table-header">
            <h3 className="admin-table-title">
              <FileText size={20} /> Applications Overview
            </h3>
          </div>
          
          {/* Table Header Row */}
          <div className="admin-table-header-row">
            <div className="admin-table-cell">Applicant</div>
            <div className="admin-table-cell">Contact</div>
            <div className="admin-table-cell">Location</div>
            <div className="admin-table-cell">Salon</div>
            <div className="admin-table-cell">Status</div>
            <div className="admin-table-cell">Actions</div>
          </div>
          
          {/* Table Data Rows */}
        {filteredApplications.map((application) => (
            <div key={application._id} className="admin-table-row">
              {/* Applicant Column */}
              <div className="admin-table-cell">
                <User size={18} />
                <strong>{application.firstName} {application.lastName}</strong>
              </div>
              
              {/* Contact Column */}
              <div className="admin-table-cell">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} />
                    {application.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={16} />
                    {application.phoneNumber || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="admin-table-cell">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} />
                    {application.postalAddress?.street || '—'}
                  </div>
                  <div className="text-muted small">
                    {[application.postalAddress?.city, application.postalAddress?.state, application.postalAddress?.country]
                      .filter(Boolean)
                      .join(', ') || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="admin-table-cell">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Home size={16} />
                    <strong>{application.salonName || 'N/A'}</strong>
                  </div>
                  <div className="text-muted small">
                    {application.numberOfEmployees ?? 1} staff · {application.yearsOfExperience ?? 0} yrs exp.
                    · {application.services?.length ?? 0} services
                  </div>
                </div>
              </div>
              
              {/* Status Column */}
              <div className="admin-table-cell">
                <span className={`admin-status-badge ${application.status}`}>
                  {application.status === 'pending' && <Clock size={14} />}
                  {application.status === 'approved' && <CheckCircle size={14} />}
                  {application.status === 'declined' && <XCircle size={14} />}
                {application.status}
                </span>
              </div>
            
              {/* Actions Column */}
              <div className="admin-table-cell">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="admin-action-button view"
                  onClick={() => openModal('view', application)}
                >
                    <Eye size={16} /> View
                  </button>
                
                {application.status === 'pending' && (
                  <>
                      <button
                        className="admin-action-button approve"
                      onClick={() => openModal('approve', application)}
                    >
                        <Check size={16} /> Approve
                      </button>
                    
                      <button
                        className="admin-action-button decline"
                      onClick={() => openModal('decline', application)}
                    >
                        <X size={16} /> Decline
                      </button>
                  </>
                )}
                </div>
              </div>
            </div>
        ))}
        </Card>

        {/* Application Details Modal */}
      {showModal && (
          <div className="admin-modal">
            <div className="admin-modal-content">
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">
                {modalType === 'approve' && 'Approve Application'}
                {modalType === 'decline' && 'Decline Application'}
                {modalType === 'view' && 'Application Details'}
                </h3>
                <button className="admin-modal-close" onClick={closeModal}>
                  <X size={24} />
                </button>
              </div>
              
              <div className="admin-modal-body">
                {/* View Application Details */}
              {modalType === 'view' && selectedApplication && (
                <div>
                  <h4>Personal Information</h4>
                  <p><strong>Name:</strong> {selectedApplication.firstName} {selectedApplication.lastName}</p>
                  <p><strong>Email:</strong> {selectedApplication.email}</p>
                    <p><strong>Phone:</strong> {selectedApplication.phoneNumber || 'N/A'}</p>
                  <h4>Address</h4>
                    <p>
                      {selectedApplication.postalAddress?.street && 
                       selectedApplication.postalAddress?.city && 
                       selectedApplication.postalAddress?.state && 
                       selectedApplication.postalAddress?.postalCode && 
                       selectedApplication.postalAddress?.country
                        ? `${selectedApplication.postalAddress.street}, ${selectedApplication.postalAddress.city}, ${selectedApplication.postalAddress.state} ${selectedApplication.postalAddress.postalCode}, ${selectedApplication.postalAddress.country}`
                        : 'Address not provided'
                      }
                    </p>
                  
                  <h4>Salon information</h4>
                  <p><strong>Name:</strong> {selectedApplication.salonName || 'Not provided'}</p>
                  <p><strong>Description:</strong> {selectedApplication.salonDescription || 'Not provided'}</p>
                  <p><strong>Employees:</strong> {selectedApplication.numberOfEmployees ?? 1}</p>
                  <p><strong>Years of experience:</strong> {selectedApplication.yearsOfExperience ?? 0}</p>
                  <p><strong>Salon location:</strong> Same as applicant address above</p>
                  <p><strong>Services:</strong> {selectedApplication.services?.length ?? 0} listed</p>
                  {selectedApplication.services?.length > 0 && (
                    <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                      {selectedApplication.services.map((s, i) => (
                        <li key={i}>{s.name} — {Number(s.price).toLocaleString()} FCFA · {s.duration} min</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
                {/* Approve Application Form */}
              {modalType === 'approve' && (
                <div>
                  <p>Are you sure you want to approve this application?</p>
                  <p><strong>Applicant:</strong> {selectedApplication?.firstName} {selectedApplication?.lastName}</p>
                  <p>This will grant the user host privileges and create their salon profile.</p>
                  
                    <div className="admin-form-group">
                      <label className="admin-label">Admin Note (optional)</label>
                      <textarea
                        className="admin-textarea"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add notes about this approval (optional)..."
                    />
                    </div>
                </div>
              )}

                {/* Decline Application Form */}
              {modalType === 'decline' && (
                <div>
                  <p>Please provide a reason for declining this application:</p>
                    <div className="admin-form-group">
                      <label className="admin-label">Admin Note (Required)</label>
                      <textarea
                        className="admin-textarea"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Provide a reason for declining the application..."
                      required
                    />
                    </div>
                </div>
              )}
              </div>

              {/* Modal Actions */}
              <div className="admin-modal-actions">
              {modalType === 'approve' && (
                <Button
                    variant="danger"
                  onClick={() => handleApprove(selectedApplication._id)}
                  disabled={processing}
                    style={{ backgroundColor: '#FF385C', borderColor: '#FF385C' }}
                >
                    {processing ? <RefreshCw size={16} className="fa-spin" /> : <Check size={16} />}
                  {processing ? 'Approving...' : 'Approve'}
                </Button>
              )}
              
              {modalType === 'decline' && (
                <Button
                    variant="danger"
                  onClick={() => handleDecline(selectedApplication._id)}
                  disabled={processing || !adminNote.trim()}
                    style={{ backgroundColor: '#FF385C', borderColor: '#FF385C' }}
                >
                    {processing ? <RefreshCw size={16} className="fa-spin" /> : <X size={16} />}
                  {processing ? 'Declining...' : 'Decline'}
                </Button>
              )}
              
                <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              </div>
            </div>
          </div>
      )}
    </Container>
    </div>
  );
};

export default AdminHostApplicationsPanel;