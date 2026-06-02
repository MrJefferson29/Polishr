import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const CarouselWrap = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  ${({ $height }) => ($height ? `height: ${$height};` : 'min-height: 200px;')}
`;

const Track = styled.div`
  display: flex;
  transition: transform 0.35s ease;
  transform: translateX(${({ $index }) => `-${$index * 100}%`});
  height: 100%;
`;

const Slide = styled.div`
  min-width: 100%;
  height: 100%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ $pad }) => `${$pad}px`};
  box-sizing: border-box;
  background: ${({ $fit }) => ($fit === 'cover' ? '#000' : '#f8fafc')};
`;

const SlideImg = styled.img`
  max-width: 100%;
  max-height: 100%;
  width: ${({ $fit }) => ($fit === 'cover' ? '100%' : 'auto')};
  height: ${({ $fit }) => ($fit === 'cover' ? '100%' : 'auto')};
  object-fit: ${({ $fit }) => $fit};
  display: block;
`;

const NavBtn = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ $side }) => ($side === 'left' ? 'left: 8px;' : 'right: 8px;')}
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  &:hover {
    background: #fff;
  }
`;

const Dots = styled.div`
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  z-index: 2;
`;

const Dot = styled.button`
  width: ${({ $active }) => ($active ? '8px' : '6px')};
  height: ${({ $active }) => ($active ? '8px' : '6px')};
  border-radius: 50%;
  border: none;
  padding: 0;
  background: ${({ $active }) => ($active ? '#fff' : 'rgba(255,255,255,0.55)')};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
`;

const Placeholder = styled.div`
  width: 100%;
  height: 100%;
  min-height: ${({ $minH }) => $minH || '200px'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.9rem;
  background: linear-gradient(135deg, #fce4ec 0%, #f8fafc 100%);
`;

/** Shuffle array (Fisher–Yates) — new order each mount when shuffle=true */
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const ImageCarousel = ({
  images = [],
  height = '200px',
  shuffle: doShuffle = false,
  showNav = true,
  showDots = true,
  className,
  objectFit = 'contain',
  framePadding = 8,
  autoPlayInterval = 0,
  enableSwipe = false,
}) => {
  const slides = useMemo(() => {
    const list = (images || []).filter(Boolean);
    return doShuffle ? shuffle(list) : list;
  }, [images, doShuffle]);

  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);
  const touchStart = useRef(null);

  const go = useCallback(
    (dir) => {
      setIndex((i) => {
        const next = i + dir;
        if (next < 0) return slides.length - 1;
        if (next >= slides.length) return 0;
        return next;
      });
    },
    [slides.length]
  );

  useEffect(() => {
    if (!autoPlayInterval || slides.length < 2) return undefined;
    const id = setInterval(() => {
      if (!pausedRef.current) go(1);
    }, autoPlayInterval);
    return () => clearInterval(id);
  }, [autoPlayInterval, slides.length, go]);

  const pauseBriefly = () => {
    pausedRef.current = true;
    window.setTimeout(() => {
      pausedRef.current = false;
    }, autoPlayInterval * 2 || 8000);
  };

  const onTouchStart = (e) => {
    if (!enableSwipe) return;
    touchStart.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (!enableSwipe || touchStart.current == null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (diff > 50) go(-1);
    else if (diff < -50) go(1);
    touchStart.current = null;
    pauseBriefly();
  };

  if (!slides.length) {
    return (
      <CarouselWrap className={className} $height={height}>
        <Placeholder $minH={height}>No photos yet</Placeholder>
      </CarouselWrap>
    );
  }

  const goNav = (dir, e) => {
    e?.stopPropagation();
    go(dir);
    pauseBriefly();
  };

  const multi = slides.length > 1;

  return (
    <CarouselWrap
      className={className}
      $height={height}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Track $index={index}>
        {slides.map((src, i) => (
          <Slide key={`${src}-${i}`} $pad={framePadding} $fit={objectFit}>
            <SlideImg src={src} alt="" loading="lazy" $fit={objectFit} />
          </Slide>
        ))}
      </Track>
      {multi && showNav && (
        <>
          <NavBtn type="button" $side="left" onClick={(e) => goNav(-1, e)} aria-label="Previous">
            <FaChevronLeft />
          </NavBtn>
          <NavBtn type="button" $side="right" onClick={(e) => goNav(1, e)} aria-label="Next">
            <FaChevronRight />
          </NavBtn>
        </>
      )}
      {multi && showDots && (
        <Dots>
          {slides.map((_, i) => (
            <Dot
              key={i}
              type="button"
              $active={i === index}
              onClick={(e) => { e.stopPropagation(); setIndex(i); pauseBriefly(); }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </Dots>
      )}
    </CarouselWrap>
  );
};

export default ImageCarousel;
