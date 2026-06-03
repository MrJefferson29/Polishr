import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const FADE_MS = 1000;
const INTERVAL_MS = 4000;

const Frame = styled.div`
  position: relative;
  width: 100%;
  height: clamp(320px, 42vw, 580px);
  border-radius: 16px;
  overflow: hidden;
  background: #fce4ec;
`;

const Slide = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${({ $active }) => ($active ? 0.85 : 0)};
  transition: opacity ${FADE_MS}ms ease-in-out;
  pointer-events: none;
`;

/**
 * Cross-fades through `images` every 4 seconds.
 */
export default function HeroFadeCarousel({ images, alt = 'Salon inspiration' }) {
  const slides = (images || []).filter(Boolean).slice(0, 4);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  if (!slides.length) return null;

  return (
    <Frame>
      {slides.map((src, i) => (
        <Slide
          key={`${src}-${i}`}
          src={src}
          alt={alt}
          $active={i === index}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}
    </Frame>
  );
}
