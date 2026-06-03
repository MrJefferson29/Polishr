import React, { useState, useEffect, useMemo } from 'react';
import { Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaHeart, FaMapMarkerAlt } from 'react-icons/fa';
import { followsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSalonRandomImages } from '../utils/salonSearch';

const ACCENT = '#e91e63';
const ACCENT_DARK = '#c2185b';

const Page = styled.div`
  min-height: 100vh;
  background: #fafafa;
  padding: 2rem 1rem 3rem;
`;

const Inner = styled.div`
  max-width: 960px;
  margin: 0 auto;
`;

const Header = styled.header`
  margin-bottom: 2rem;

  h1 {
    margin: 0 0 0.35rem;
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 800;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 0.95rem;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
`;

const Card = styled.article`
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #dbdbdb;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 8px 28px rgba(15, 23, 42, 0.1);
    transform: translateY(-2px);
  }
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 2px;
  aspect-ratio: 1;
  background: #111;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .placeholder {
    background: linear-gradient(135deg, #fce4ec, #f8bbd0);
  }
`;

const CardBody = styled.div`
  padding: 1rem 1.1rem 1.15rem;

  h2 {
    margin: 0 0 0.25rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 0.75rem;

    svg {
      color: ${ACCENT};
      font-size: 0.75rem;
    }
  }

  button {
    border: none;
    background: transparent;
    color: ${ACCENT_DARK};
    font-weight: 600;
    font-size: 0.88rem;
    padding: 0;
    cursor: pointer;

    &:hover {
      color: ${ACCENT};
      text-decoration: underline;
    }
  }
`;

const Empty = styled.div`
  text-align: center;
  padding: 4rem 1rem;
  color: #64748b;

  svg {
    font-size: 2.5rem;
    color: #f48fb1;
    margin-bottom: 1rem;
  }

  h2 {
    color: #0f172a;
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  button {
    margin-top: 1rem;
    border: none;
    border-radius: 999px;
    padding: 0.65rem 1.5rem;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK});
    cursor: pointer;
  }
`;

const SalonCard = ({ host, salon, onOpen }) => {
  const images = useMemo(() => getSalonRandomImages(salon, 4), [salon]);

  return (
    <Card onClick={onOpen}>
      <ImageGrid>
        {[0, 1, 2, 3].map((i) =>
          images[i] ? (
            <img key={i} src={images[i]} alt="" loading="lazy" />
          ) : (
            <div key={i} className="placeholder" aria-hidden />
          )
        )}
      </ImageGrid>
      <CardBody>
        <h2>{salon?.name || `${host.firstName}'s Salon`}</h2>
        {salon?.city && (
          <div className="meta">
            <FaMapMarkerAlt /> {salon.city}
          </div>
        )}
        <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          View salon →
        </button>
      </CardBody>
    </Card>
  );
};

const FollowingList = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    followsAPI
      .getFollowing()
      .then(({ data }) => setFollowing(data))
      .catch(() => setFollowing([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <Page>
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Inner>
        <Header>
          <h1><FaHeart style={{ color: ACCENT }} /> Following</h1>
          <p>Salons you follow — tap a card to view their profile.</p>
        </Header>

        {following.length === 0 ? (
          <Empty>
            <FaHeart />
            <h2>No salons followed yet</h2>
            <p>Explore nearby studios and tap Follow on a salon you love.</p>
            <button type="button" onClick={() => navigate('/')}>Explore salons</button>
          </Empty>
        ) : (
          <Grid>
            {following.map(({ host, salon }) => (
              <SalonCard
                key={host._id}
                host={host}
                salon={salon}
                onOpen={() => salon && navigate(`/salon/${salon._id}`)}
              />
            ))}
          </Grid>
        )}
      </Inner>
    </Page>
  );
};

export default FollowingList;
