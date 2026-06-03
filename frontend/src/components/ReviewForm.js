import React, { useState } from 'react';
import { Alert } from 'react-bootstrap';
import { MdStar, MdStarBorder } from 'react-icons/md';
import { FaStar } from 'react-icons/fa';
import styled from 'styled-components';

const ACCENT = '#e91e63';
const ACCENT_DARK = '#c2185b';

const ReviewForm = ({ booking, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    rating: 0,
    detailedRatings: {
      skill: 0,
      cleanliness: 0,
      atmosphere: 0,
      value: 0,
      punctuality: 0,
      communication: 0,
    },
    title: '',
    content: '',
  });
  const [errors, setErrors] = useState({});
  const [hoveredRating, setHoveredRating] = useState(0);
  const [hoveredDetailed, setHoveredDetailed] = useState({});

  const ratingCategories = [
    { key: 'skill', label: 'Skill', icon: '💅' },
    { key: 'cleanliness', label: 'Cleanliness', icon: '🧹' },
    { key: 'atmosphere', label: 'Atmosphere', icon: '✨' },
    { key: 'value', label: 'Value', icon: '💰' },
    { key: 'punctuality', label: 'Punctuality', icon: '⏰' },
    { key: 'communication', label: 'Communication', icon: '💬' },
  ];

  const handleRatingChange = (rating) => {
    setFormData((prev) => ({ ...prev, rating }));
    if (errors.rating) setErrors((prev) => ({ ...prev, rating: null }));
  };

  const handleDetailedRatingChange = (category, rating) => {
    setFormData((prev) => ({
      ...prev,
      detailedRatings: { ...prev.detailedRatings, [category]: rating },
    }));
    if (errors.detailedRatings?.[category]) {
      setErrors((prev) => ({
        ...prev,
        detailedRatings: { ...prev.detailedRatings, [category]: null },
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.rating) newErrors.rating = 'Overall rating is required';

    Object.entries(formData.detailedRatings).forEach(([category, rating]) => {
      if (!rating) {
        if (!newErrors.detailedRatings) newErrors.detailedRatings = {};
        const label = ratingCategories.find((c) => c.key === category)?.label || category;
        newErrors.detailedRatings[category] = `${label} rating is required`;
      }
    });

    if (!formData.title.trim()) {
      newErrors.title = 'Review title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Review content is required';
    } else if (formData.content.trim().length < 20) {
      newErrors.content = 'Please write at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit({
      bookingId: booking._id,
      appointmentId: booking._id,
      ...formData,
    });
  };

  const renderStars = (rating, onChange, hoverKey, size = 26) => {
    const hoverVal = typeof hoverKey === 'number' ? hoverKey : hoveredDetailed[hoverKey] || 0;
    return (
      <StarsRow>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hoverVal || rating);
          const Icon = filled ? MdStar : MdStarBorder;
          return (
            <Icon
              key={star}
              size={size}
              style={{ color: filled ? '#f59e0b' : '#cbd5e1', cursor: 'pointer' }}
              onClick={() => onChange(star)}
              onMouseEnter={() =>
                typeof hoverKey === 'number'
                  ? setHoveredRating(star)
                  : setHoveredDetailed((p) => ({ ...p, [hoverKey]: star }))
              }
              onMouseLeave={() =>
                typeof hoverKey === 'number'
                  ? setHoveredRating(0)
                  : setHoveredDetailed((p) => ({ ...p, [hoverKey]: 0 }))
              }
            />
          );
        })}
      </StarsRow>
    );
  };

  if (!booking) {
    return <Alert variant="warning">No booking information available for review.</Alert>;
  }

  const salonName = booking.salon?.name || booking.listing?.title || 'this salon';

  return (
    <Shell onSubmit={handleSubmit}>
      <Header>
        <div className="icon">
          <FaStar />
        </div>
        <div>
          <h2>Write a review</h2>
          <p>Share your experience at {salonName}</p>
        </div>
      </Header>

      <Section>
        <SectionLabel>Overall rating *</SectionLabel>
        <OverallRow>
          {renderStars(formData.rating, handleRatingChange, hoveredRating, 34)}
          <ScoreHint>
            {hoveredRating || formData.rating || 0} / 5
          </ScoreHint>
        </OverallRow>
        {errors.rating && <FieldError>{errors.rating}</FieldError>}
      </Section>

      <Section>
        <SectionLabel>Rate your experience *</SectionLabel>
        <DetailGrid>
          {ratingCategories.map((cat) => (
            <DetailRow key={cat.key}>
              <span>
                {cat.icon} {cat.label}
              </span>
              {renderStars(
                formData.detailedRatings[cat.key],
                (r) => handleDetailedRatingChange(cat.key, r),
                cat.key,
                22
              )}
              {errors.detailedRatings?.[cat.key] && (
                <FieldError>{errors.detailedRatings[cat.key]}</FieldError>
              )}
            </DetailRow>
          ))}
        </DetailGrid>
      </Section>

      <Section>
        <SectionLabel htmlFor="review-title">Review title *</SectionLabel>
        <StyledInput
          id="review-title"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Summarize your visit in a few words"
          maxLength={100}
          $invalid={!!errors.title}
        />
        <CharCount>{formData.title.length}/100</CharCount>
        {errors.title && <FieldError>{errors.title}</FieldError>}
      </Section>

      <Section>
        <SectionLabel htmlFor="review-content">Your review *</SectionLabel>
        <StyledTextarea
          id="review-content"
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          rows={5}
          placeholder="What did you love? What could be better?"
          maxLength={1000}
          $invalid={!!errors.content}
        />
        <CharCount>{formData.content.length}/1000</CharCount>
        {errors.content && <FieldError>{errors.content}</FieldError>}
      </Section>

      <Actions>
        <GhostBtn type="button" onClick={onCancel} disabled={isLoading}>
          Cancel
        </GhostBtn>
        <PrimaryBtn type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting…' : 'Submit review'}
        </PrimaryBtn>
      </Actions>
    </Shell>
  );
};

const Shell = styled.form`
  padding: 0.25rem 0;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(233, 30, 99, 0.12);

  .icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK});
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  h2 {
    margin: 0 0 0.25rem;
    font-size: 1.2rem;
    font-weight: 800;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
  }
`;

const Section = styled.div`
  margin-bottom: 1.35rem;
`;

const SectionLabel = styled.label`
  display: block;
  font-weight: 700;
  font-size: 0.875rem;
  color: #334155;
  margin-bottom: 0.5rem;
`;

const OverallRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ScoreHint = styled.span`
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 600;
`;

const DetailGrid = styled.div`
  display: grid;
  gap: 0.65rem;

  @media (min-width: 576px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const DetailRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.2);

  > span:first-child {
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  border: 1px solid ${({ $invalid }) => ($invalid ? '#f87171' : 'rgba(148, 163, 184, 0.35)')};
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: ${ACCENT};
    box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.12);
  }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  border: 1px solid ${({ $invalid }) => ($invalid ? '#f87171' : 'rgba(148, 163, 184, 0.35)')};
  font-size: 0.95rem;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: ${ACCENT};
    box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.12);
  }
`;

const CharCount = styled.div`
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.25rem;
  text-align: right;
`;

const FieldError = styled.div`
  font-size: 0.8rem;
  color: #dc2626;
  margin-top: 0.25rem;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
`;

const GhostBtn = styled.button`
  padding: 0.6rem 1.15rem;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: #fff;
  color: #475569;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PrimaryBtn = styled.button`
  padding: 0.6rem 1.25rem;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK});
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(233, 30, 99, 0.35);

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const StarsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;

  svg {
    transition: transform 0.15s;

    &:hover {
      transform: scale(1.08);
    }
  }
`;

export default ReviewForm;
