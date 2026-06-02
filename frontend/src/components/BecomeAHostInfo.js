import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Button } from 'react-bootstrap';
import {
  FaArrowRight,
  FaCalendarCheck,
  FaChartLine,
  FaCheckCircle,
  FaComments,
  FaImages,
  FaShieldAlt,
  FaStore,
  FaUsers,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSalons } from '../context/SalonsContext';
import { getSalonRandomImages } from '../utils/salonSearch';

const ACCENT = '#e91e63';
const ACCENT_DARK = '#c2185b';

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(165deg, #fce4ec 0%, #fafafa 45%, #fff 100%);
  padding-bottom: 100px;
`;

const Hero = styled.section`
  position: relative;
  overflow: hidden;
  padding: clamp(5rem, 10vw, 7rem) 1.25rem clamp(3rem, 6vw, 4.5rem);
  text-align: center;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 15% 20%, rgba(233, 30, 99, 0.12) 0%, transparent 45%),
      radial-gradient(circle at 85% 80%, rgba(194, 24, 91, 0.08) 0%, transparent 40%);
    pointer-events: none;
  }
`;

const HeroInner = styled.div`
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
`;

const Eyebrow = styled.p`
  margin: 0 0 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: ${ACCENT_DARK};
`;

const HeroTitle = styled.h1`
  margin: 0 0 1rem;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0f172a;
  line-height: 1.1;
`;

const HeroLead = styled.p`
  margin: 0 auto 2rem;
  max-width: 560px;
  font-size: clamp(1rem, 2.2vw, 1.15rem);
  line-height: 1.65;
  color: #475569;
`;

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
`;

const PrimaryBtn = styled(Button)`
  && {
    background: linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%);
    border: none;
    border-radius: 999px;
    font-weight: 700;
    padding: 0.75rem 1.75rem;
    box-shadow: 0 8px 24px rgba(233, 30, 99, 0.28);

    &:hover {
      background: linear-gradient(135deg, #ec407a 0%, ${ACCENT_DARK} 100%);
      transform: translateY(-1px);
    }
  }
`;

const GhostBtn = styled(Button)`
  && {
    border-radius: 999px;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-color: rgba(233, 30, 99, 0.35);
    color: ${ACCENT_DARK};

    &:hover {
      background: rgba(233, 30, 99, 0.06);
      border-color: ${ACCENT};
      color: ${ACCENT_DARK};
    }
  }
`;

const Section = styled.section`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.25rem clamp(2.5rem, 5vw, 4rem);
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.5rem;
`;

const SectionSub = styled.p`
  text-align: center;
  color: #64748b;
  max-width: 560px;
  margin: 0 auto 2rem;
  line-height: 1.6;
`;

const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StepCard = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(233, 30, 99, 0.1);
  border-radius: 18px;
  padding: 1.35rem 1.15rem;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
  text-align: center;

  .num {
    width: 36px;
    height: 36px;
    margin: 0 auto 0.75rem;
    border-radius: 50%;
    background: linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK});
    color: #fff;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95rem;
  }

  h3 {
    margin: 0 0 0.4rem;
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
  }

  p {
    margin: 0;
    font-size: 0.88rem;
    color: #64748b;
    line-height: 1.5;
  }
`;

const BenefitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const BenefitCard = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid #f1f5f9;
  box-shadow: 0 6px 28px rgba(15, 23, 42, 0.05);

  svg {
    font-size: 1.5rem;
    color: ${ACCENT};
    margin-bottom: 0.75rem;
  }

  h3 {
    margin: 0 0 0.5rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
  }

  p {
    margin: 0;
    font-size: 0.92rem;
    color: #64748b;
    line-height: 1.55;
  }
`;

const ShowcaseSection = styled(Section)`
  margin-top: 0.5rem;
`;

const ShowcaseCard = styled.div`
  background: #fff;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(233, 30, 99, 0.12);
  box-shadow: 0 12px 40px rgba(233, 30, 99, 0.08);
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 320px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 3px;
  background: #111;
  min-height: 280px;

  img {
    width: 100%;
    height: 100%;
    min-height: 130px;
    object-fit: cover;
    display: block;
  }
`;

const ShowcaseCopy = styled.div`
  padding: clamp(1.5rem, 4vw, 2.5rem);
  display: flex;
  flex-direction: column;
  justify-content: center;

  h3 {
    margin: 0 0 0.75rem;
    font-size: clamp(1.25rem, 2.5vw, 1.6rem);
    font-weight: 800;
    color: #0f172a;
  }

  p {
    margin: 0 0 1.25rem;
    color: #64748b;
    line-height: 1.6;
    font-size: 0.95rem;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #334155;
      margin-bottom: 0.45rem;

      svg {
        color: #22c55e;
        flex-shrink: 0;
      }
    }
  }
`;

const FaqGrid = styled.div`
  display: grid;
  gap: 0.75rem;
  max-width: 760px;
  margin: 0 auto;
`;

const FaqItem = styled.details`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 0.25rem 1rem;

  summary {
    cursor: pointer;
    font-weight: 600;
    color: #0f172a;
    padding: 0.85rem 0;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }
  }

  p {
    margin: 0 0 1rem;
    color: #64748b;
    font-size: 0.92rem;
    line-height: 1.6;
  }
`;

const StickyBar = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(233, 30, 99, 0.12);
  padding: 0.85rem 1.25rem;
  display: flex;
  justify-content: center;
  box-shadow: 0 -4px 24px rgba(15, 23, 42, 0.06);
`;

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80',
  'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
  'https://images.unsplash.com/photo-1519014816548-bf9abb066534?w=400&q=80',
];

const STEPS = [
  { title: 'Apply', text: 'Submit your host application with salon details and services.' },
  { title: 'Verify', text: 'We review your profile — usually within 3–5 business days.' },
  { title: 'Set up', text: 'Add photos, pricing, hours, and your booking calendar.' },
  { title: 'Grow', text: 'Accept bookings, post to the feed, and build your clientele.' },
];

const FAQ = [
  {
    q: 'Who can list a salon on Polishr?',
    a: 'Licensed nail technicians and salon owners who meet our verification standards can apply to become hosts.',
  },
  {
    q: 'How much does it cost?',
    a: 'Listing is free. Polishr charges a small service fee per completed booking — no monthly subscription.',
  },
  {
    q: 'How do payouts work?',
    a: 'After a completed appointment, earnings are transferred to your linked bank account on your chosen schedule.',
  },
  {
    q: 'Can I manage multiple staff?',
    a: 'Yes. Set your team size and Polishr automatically handles concurrent booking capacity.',
  },
];

const BecomeAHostInfo = () => {
  const navigate = useNavigate();
  const { salons } = useSalons();

  const showcase = useMemo(() => {
    const withImages = (salons || []).filter(
      (s) => (s.placeImages?.length || 0) + (s.workImages?.length || 0) > 0
    );
    const salon = withImages.length
      ? withImages[Math.floor(Math.random() * withImages.length)]
      : null;
    const images = salon ? getSalonRandomImages(salon, 4) : FALLBACK_IMAGES;
    return { salon, images };
  }, [salons]);

  return (
    <Page>
      <Hero>
        <HeroInner>
          <Eyebrow>Host program</Eyebrow>
          <HeroTitle>List your nail salon on Polishr</HeroTitle>
          <HeroLead>
            Reach new clients, manage appointments online, and showcase your work — all on a platform
            built for nail studios.
          </HeroLead>
          <HeroActions>
            <PrimaryBtn size="lg" onClick={() => navigate('/become-a-host/apply')}>
              Start application <FaArrowRight style={{ marginLeft: 8 }} />
            </PrimaryBtn>
            <GhostBtn variant="outline-danger" onClick={() => navigate('/become-a-host/status')}>
              Check application status
            </GhostBtn>
          </HeroActions>
        </HeroInner>
      </Hero>

      <Section>
        <SectionTitle>How it works</SectionTitle>
        <SectionSub>Four simple steps from application to your first booking.</SectionSub>
        <StepsGrid>
          {STEPS.map((step, i) => (
            <StepCard key={step.title}>
              <div className="num">{i + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </StepCard>
          ))}
        </StepsGrid>
      </Section>

      <ShowcaseSection>
        <SectionTitle>Showcase your work</SectionTitle>
        <SectionSub>
          {showcase.salon
            ? `Featured looks from ${showcase.salon.name}${showcase.salon.city ? ` · ${showcase.salon.city}` : ''}`
            : 'Hosts upload portfolio photos that appear across search, feed, and salon profiles.'}
        </SectionSub>
        <ShowcaseCard>
          <ImageGrid>
            {showcase.images.map((src, i) => (
              <img key={`${src}-${i}`} src={src} alt="" loading="lazy" />
            ))}
          </ImageGrid>
          <ShowcaseCopy>
            <h3>Your salon, beautifully presented</h3>
            <p>
              Upload studio and portfolio photos. Polishr displays them in grids, carousels, and search
              results so clients see your style before they book.
            </p>
            <ul>
              <li><FaCheckCircle /> 2×2 photo grids on profiles</li>
              <li><FaCheckCircle /> Auto-rotating cards in search</li>
              <li><FaCheckCircle /> Full-screen gallery with swipe</li>
            </ul>
          </ShowcaseCopy>
        </ShowcaseCard>
      </ShowcaseSection>

      <Section>
        <SectionTitle>Why host with Polishr?</SectionTitle>
        <BenefitsGrid>
          <BenefitCard>
            <FaStore />
            <h3>Built for nail salons</h3>
            <p>Service menus, staff capacity, and appointment flows designed for manicure & pedicure studios.</p>
          </BenefitCard>
          <BenefitCard>
            <FaCalendarCheck />
            <h3>Smart scheduling</h3>
            <p>Concurrent bookings scale with your team size. Guests pick services and times that work.</p>
          </BenefitCard>
          <BenefitCard>
            <FaChartLine />
            <h3>Grow your brand</h3>
            <p>Post to the feed, collect reviews, and get discovered in nearby search results.</p>
          </BenefitCard>
          <BenefitCard>
            <FaUsers />
            <h3>Followers & reach</h3>
            <p>Clients follow your salon for updates. New posts notify your audience automatically.</p>
          </BenefitCard>
          <BenefitCard>
            <FaComments />
            <h3>Direct messaging</h3>
            <p>Chat with guests before appointments to confirm details or answer questions.</p>
          </BenefitCard>
          <BenefitCard>
            <FaShieldAlt />
            <h3>Verified hosts</h3>
            <p>Our review process builds trust so clients feel confident booking with you.</p>
          </BenefitCard>
        </BenefitsGrid>
      </Section>

      <Section>
        <SectionTitle>Questions</SectionTitle>
        <FaqGrid>
          {FAQ.map(({ q, a }) => (
            <FaqItem key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </FaqItem>
          ))}
        </FaqGrid>
      </Section>

      <StickyBar>
        <PrimaryBtn size="lg" onClick={() => navigate('/become-a-host/apply')}>
          <FaImages style={{ marginRight: 8 }} /> Apply to become a host
        </PrimaryBtn>
      </StickyBar>
    </Page>
  );
};

export default BecomeAHostInfo;
