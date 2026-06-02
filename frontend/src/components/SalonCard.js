import React, { useMemo } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { FaMapMarkerAlt, FaStar, FaClock, FaUsers, FaCut } from 'react-icons/fa';
import styled from 'styled-components';
import ImageCarousel from './common/ImageCarousel';

const CardWrap = styled(Card)`
  cursor: pointer;
  border: none;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.07);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  height: 100%;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 14px 36px rgba(233, 30, 99, 0.14);
  }
`;

const MediaWrap = styled.div`
  position: relative;
  background: #f1f5f9;
  overflow: hidden;
`;

const HostAvatar = styled.img`
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 3px solid #fff;
  object-fit: cover;
  z-index: 3;
  background: #fff;
`;

const Title = styled.h6`
  font-weight: 600;
  margin-bottom: 2px;
  color: #111;
`;

const Subtitle = styled.div`
  font-size: 13px;
  color: #6c757d;
  margin-bottom: 6px;
`;

const Location = styled.div`
  font-size: 13px;
  color: #6c757d;
  display: flex;
  align-items: center;
  margin-bottom: 8px;

  svg {
    font-size: 12px;
  }
`;

const Description = styled.p`
  font-size: 13px;
  color: #555;
  margin-bottom: 10px;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #777;
  margin-bottom: 10px;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const ServiceTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;

  .badge {
    font-size: 11px;
    padding: 5px 8px;
    border-radius: 6px;
  }
`;

const BottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
`;

const Rating = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #f59e0b;

  span {
    color: #777;
    font-weight: 400;
    margin-left: 4px;
  }
`;

const PriceTag = styled(Badge)`
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 8px;
`;

const HostText = styled.div`
  font-size: 12px;
  color: #888;
  margin-top: 4px;
`;

const SalonCard = ({ salon, onClick, shuffleImages = true }) => {
  const carouselImages = useMemo(
    () => [...(salon.placeImages || []), ...(salon.workImages || [])],
    [salon.placeImages, salon.workImages]
  );

  const activeServices = (salon.services || []).filter((s) => s.isActive !== false);

  const minPrice = activeServices.length
    ? Math.min(...activeServices.map((s) => s.price))
    : null;

  const maxPrice = activeServices.length
    ? Math.max(...activeServices.map((s) => s.price))
    : null;

  const owner = salon.owner;
  const hostName = owner
    ? `${owner.firstName || ''} ${owner.lastName || ''}`.trim()
    : '';

  const avatarUrl =
    owner?.profileImage ||
    (hostName
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(hostName)}&size=96&background=2563eb&color=fff`
      : null);

  const rating = salon.rating ?? salon.averageRating ?? 0;
  const reviewCount = salon.reviews ?? salon.totalReviews ?? 0;

  return (
    <CardWrap onClick={onClick}>
      <MediaWrap>
        <ImageCarousel
          images={carouselImages}
          height="340px"
          shuffle={shuffleImages}
          objectFit="cover"
          framePadding={0}
          autoPlayInterval={4000}
          showNav={false}
        />
        {avatarUrl && <HostAvatar src={avatarUrl} alt={hostName} />}
      </MediaWrap>

      <Card.Body className="d-flex flex-column p-3">
        <Title>{salon.name}</Title>

        {salon.title && <Subtitle>{salon.title}</Subtitle>}

        <Location>
          <FaMapMarkerAlt className="me-1" />
          <span className="text-truncate">
            {salon.city}
            {salon.state ? `, ${salon.state}` : ''}
            {salon.country ? ` · ${salon.country}` : ''}
          </span>
        </Location>

        {salon.description && (
          <Description>{salon.description}</Description>
        )}

        <MetaRow>
          {salon.distanceKm != null && (
            <Badge bg="info" className="fw-normal">
              {salon.distanceKm} km away
            </Badge>
          )}

          {salon.numberOfEmployees > 0 && (
            <span><FaUsers /> {salon.numberOfEmployees}</span>
          )}

          {activeServices.length > 0 && (
            <span><FaCut /> {activeServices.length}</span>
          )}

          {activeServices[0]?.duration && (
            <span><FaClock /> {activeServices[0].duration} min</span>
          )}
        </MetaRow>

        {activeServices.length > 0 && (
          <ServiceTags>
            {activeServices.slice(0, 3).map((s, i) => (
              <Badge key={i} bg="light" text="dark">
                {s.name} · {s.price} FCFA
              </Badge>
            ))}
            {activeServices.length > 3 && (
              <Badge bg="secondary">
                +{activeServices.length - 3}
              </Badge>
            )}
          </ServiceTags>
        )}

        <BottomRow>
          <Rating>
            <FaStar /> {Number(rating).toFixed(1)}
            <span>({reviewCount})</span>
          </Rating>

          {minPrice != null && (
            <PriceTag bg="danger">
              {minPrice === maxPrice
                ? `${minPrice} FCFA`
                : `${minPrice} – ${maxPrice} FCFA`}
            </PriceTag>
          )}
        </BottomRow>

        {hostName && <HostText>Hosted by {hostName}</HostText>}
      </Card.Body>
    </CardWrap>
  );
};

export default SalonCard;