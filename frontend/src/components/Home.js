import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaCompass, FaMapMarkerAlt } from 'react-icons/fa';
import { useSalons } from '../context/SalonsContext';
import { salonsAPI } from '../services/api';
import SalonCard from './SalonCard';
import SalonSearchBar from './home/SalonSearchBar';
import styled from 'styled-components';
import { getCurrentPosition, reverseGeocodeCity } from '../utils/geolocation';
import { collectSalonImages } from '../utils/salonSearch';
import HeroFadeCarousel from './home/HeroFadeCarousel';
import wig from '../Assets/wigs.png';

const NEARBY_RADIUS_KM = 60;
const HERO_FALLBACKS = [
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=80',
  'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=900&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80',
  'https://images.unsplash.com/photo-1519014816548-bf9abb066534?w=900&q=80',
];

const HeroSection = styled.section`
  position: relative;
  overflow: visible;
  z-index: 100;
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 40%, #fff 100%);
  padding: 4rem 0 3.5rem;

  @media (min-width: 992px) {
    padding: 5rem 0 4rem;
  }

  @media (max-width: 768px) {
    padding: 4.5rem 1rem 3rem;
    text-align: center;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url(${({ $bg }) => $bg});
      background-size: cover;
      background-position: center;
      opacity: 0.42;
      z-index: 0;
    }

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(252, 228, 236, 0.92) 0%,
        rgba(255, 255, 255, 0.88) 55%,
        rgba(255, 255, 255, 0.95) 100%
      );
      z-index: 1;
    }
  }
`;

const HeroInner = styled.div`
  position: relative;
  z-index: 2;
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const HeroTopRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2rem;
  margin-bottom: 2.5rem;

  @media (min-width: 992px) {
    flex-direction: row;
    align-items: center;
    text-align: left;
    gap: 3rem;
    margin-bottom: 2.75rem;
  }
`;

const HeroTextCol = styled.div`
  flex: 1;
  min-width: 0;

  @media (min-width: 992px) {
    max-width: 52%;
  }
`;

const HeroImageCol = styled.div`
  display: none;

  @media (min-width: 992px) {
    display: block;
    flex: 1;
    max-width: 48%;
  }
`;

const HeroHeading = styled.h1`
  font-weight: 700;
  letter-spacing: -0.03em;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.12;
  margin-bottom: 1.25rem;
  color: #111;
`;

const HeroSubtext = styled.p`
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.65;
  opacity: 0.88;
  color: #475569;
  margin: 0;
  max-width: 520px;

  @media (max-width: 768px) {
    margin: 0 auto;
  }
`;

const HeroSearchWrap = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 9999;
`;

const MainContent = styled.div`
  position: relative;
  z-index: 1;
`;

const SectionWrapper = styled.section`
  padding: 4rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  &:last-of-type {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    padding: 2.5rem 0;
  }
`;

const SectionHeaderContainer = styled.div`
  text-align: center;
  margin-bottom: 3.5rem;

  @media (max-width: 768px) {
    margin-bottom: 2rem;
  }
`;

const SectionSubtitle = styled.span`
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  color: #aaa;
  margin-bottom: 0.75rem;
  font-weight: 600;
`;

const LuxurySectionTitle = styled.h2`
  font-weight: 600;
  font-size: 2rem;
  letter-spacing: -0.02em;
  color: #222;
  margin: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const LocationPillWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`;

const LocationPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  padding: 6px 16px;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  font-size: 0.85rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const MobileHScroll = styled.div`
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 4px 2px 14px;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;

  &::-webkit-scrollbar {
    display: none;
  }

  > div {
    min-width: 82%;
    max-width: 82%;
    scroll-snap-align: start;
  }
`;

const DesktopGridWrap = styled.div`
  display: block;
  @media (max-width: 767px) {
    display: none;
  }
`;

const MobileOnly = styled.div`
  display: none;
  @media (max-width: 767px) {
    display: block;
  }
`;

const Home = () => {
  const navigate = useNavigate();
  const { filteredSalons, salons, loading, error, setSearchQuery, fetchSalons } = useSalons();
  const [popular, setPopular] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [nearbyError, setNearbyError] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [mobileHeroBg, setMobileHeroBg] = useState(HERO_FALLBACKS[0]);

  const allSalonsForSearch = useMemo(() => {
    const map = new Map();
    [...salons, ...popular, ...nearby].forEach((s) => {
      if (s?._id) map.set(s._id, s);
    });
    return Array.from(map.values());
  }, [salons, popular, nearby]);

  useEffect(() => {
    salonsAPI.getPopular().then(({ data }) => setPopular(data)).catch(() => {});
  }, []);

  const heroCarouselImages = useMemo(() => {
    const pool = collectSalonImages(allSalonsForSearch);
    const picks = [wig];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    for (const url of shuffled) {
      if (picks.length >= 4) break;
      if (!picks.includes(url)) picks.push(url);
    }
    while (picks.length < 4) {
      const fallback = HERO_FALLBACKS[picks.length - 1] || HERO_FALLBACKS[0];
      if (!picks.includes(fallback)) picks.push(fallback);
      else break;
    }
    return picks.slice(0, 4);
  }, [allSalonsForSearch]);

  useEffect(() => {
    setMobileHeroBg(heroCarouselImages[0] || HERO_FALLBACKS[0]);
  }, [heroCarouselImages]);

  useEffect(() => {
    let cancelled = false;

    const loadNearby = async () => {
      try {
        const pos = await getCurrentPosition();
        const { latitude, longitude } = pos.coords;

        const [cityLabel, nearbyRes] = await Promise.all([
          reverseGeocodeCity(latitude, longitude).catch(() => ''),
          salonsAPI.getNearby(latitude, longitude, NEARBY_RADIUS_KM),
        ]);

        if (cancelled) return;

        const list = Array.isArray(nearbyRes.data) ? nearbyRes.data : [];
        setNearby(list);
        setLocationLabel(cityLabel || 'Near you');

        if (!list.length && cityLabel) {
          const { data: byCity } = await salonsAPI.getAll({ city: cityLabel });
          if (!cancelled && byCity?.length) {
            setNearby(byCity);
            setNearbyError('');
          } else if (!cancelled) {
            setNearbyError(
              `No salons with map locations within ${NEARBY_RADIUS_KM} km of ${cityLabel} yet.`
            );
          }
        } else if (!list.length) {
          setNearbyError('No salons with map coordinates found near your current location yet.');
        }
      } catch (err) {
        if (!cancelled) {
          const denied = err?.code === 1;
          setNearbyError(
            denied
              ? 'Enable location access to see salons near you.'
              : 'Could not load nearby salons. Check your connection and try again.'
          );
        }
      } finally {
        if (!cancelled) setNearbyLoading(false);
      }
    };

    if (!navigator.geolocation) {
      setNearbyError('Location is not supported in this browser.');
      setNearbyLoading(false);
      return undefined;
    }

    loadNearby();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearchSubmit = (query) => {
    setSearchQuery(query);
    const el = document.getElementById('all-salons-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderCol = (salon) => (
    <Col key={salon._id} xs={12} sm={6} md={4} lg={3} className="mb-4 d-flex align-items-stretch">
      <SalonCard salon={salon} onClick={() => navigate(`/salon/${salon._id}`)} shuffleImages />
    </Col>
  );

  const renderMobileCard = (salon) => (
    <div key={salon._id} className="d-flex align-items-stretch">
      <SalonCard salon={salon} onClick={() => navigate(`/salon/${salon._id}`)} shuffleImages />
    </div>
  );

  return (
    <div>
      <HeroSection $bg={mobileHeroBg}>
        <HeroInner>
          <HeroTopRow>
            <HeroTextCol>
              <HeroHeading>Find Your Perfect Beauty Salon</HeroHeading>
              <HeroSubtext>
                Browse premium salons near you, book instant appointments, and follow your favorite
                nail technicians.
              </HeroSubtext>
            </HeroTextCol>
            <HeroImageCol>
              <HeroFadeCarousel images={heroCarouselImages} alt="Salon inspiration" />
            </HeroImageCol>
          </HeroTopRow>

          <HeroSearchWrap>
            <SalonSearchBar
              salons={allSalonsForSearch}
              onSearchSubmit={handleSearchSubmit}
              placeholder="Search salon name or service (gel manicure, braids…)"
            />
          </HeroSearchWrap>
        </HeroInner>
      </HeroSection>

      <MainContent>
      <Container className="pb-5">
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="danger" />
          </div>
        )}
        {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

        <SectionWrapper>
          <SectionHeaderContainer>
            <SectionSubtitle>Discovery</SectionSubtitle>
            <LuxurySectionTitle>
              <FaCompass className="text-danger me-1" size={24} /> Salons Near You
            </LuxurySectionTitle>
            {locationLabel && (
              <LocationPillWrapper>
                <LocationPill>
                  <FaMapMarkerAlt className="text-danger" />
                  <span>Near</span>
                  <Badge bg="light" text="dark" className="border ms-1">
                    {locationLabel}
                  </Badge>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                    · by distance from salons
                  </span>
                </LocationPill>
              </LocationPillWrapper>
            )}
          </SectionHeaderContainer>

          {nearbyLoading && (
            <div className="text-center py-4 text-muted">
              <Spinner animation="border" size="sm" variant="danger" className="me-2" />
              Finding nearby salons...
            </div>
          )}
          {!nearbyLoading && nearbyError && (
            <Alert variant="info" className="text-center rounded-3 max-width-md mx-auto">
              {nearbyError}
            </Alert>
          )}
          {!nearbyLoading && nearby.length > 0 && (
            <>
              <MobileOnly>
                <MobileHScroll>{nearby.map(renderMobileCard)}</MobileHScroll>
              </MobileOnly>
              <DesktopGridWrap>
                <Row className="g-4">{nearby.map(renderCol)}</Row>
              </DesktopGridWrap>
            </>
          )}
        </SectionWrapper>

        {popular.length > 0 && (
          <SectionWrapper>
            <SectionHeaderContainer>
              <SectionSubtitle>Trending</SectionSubtitle>
              <LuxurySectionTitle>Popular Salons</LuxurySectionTitle>
            </SectionHeaderContainer>
            <MobileOnly>
              <MobileHScroll>{popular.map(renderMobileCard)}</MobileHScroll>
            </MobileOnly>
            <DesktopGridWrap>
              <Row className="g-4">{popular.map(renderCol)}</Row>
            </DesktopGridWrap>
          </SectionWrapper>
        )}

        <SectionWrapper id="all-salons-section">
          <SectionHeaderContainer>
            <SectionSubtitle>Curation</SectionSubtitle>
            <LuxurySectionTitle>All Salons</LuxurySectionTitle>
          </SectionHeaderContainer>

          <Row className="g-4">{filteredSalons.map(renderCol)}</Row>

          {!loading && filteredSalons.length === 0 && (
            <div className="text-center text-muted py-5">
              <p className="mb-3">No salons matched your search. Try another name or service.</p>
              <button
                type="button"
                className="btn btn-outline-danger px-4 rounded-pill"
                onClick={() => {
                  setSearchQuery('');
                  fetchSalons();
                }}
              >
                Show all salons
              </button>
            </div>
          )}
        </SectionWrapper>
      </Container>
      </MainContent>
    </div>
  );
};

export default Home;
