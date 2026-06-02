import React, { useEffect, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100001;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  touch-action: pan-y;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: max(12px, env(safe-area-inset-top, 12px));
  right: max(12px, env(safe-area-inset-right, 12px));
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
  }
`;

const Counter = styled.div`
  position: absolute;
  top: max(18px, env(safe-area-inset-top, 18px));
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
  font-weight: 600;
  z-index: 2;
`;

const Stage = styled.div`
  position: relative;
  width: 100%;
  max-width: min(960px, 100vw);
  height: min(78vh, 720px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3rem;
  box-sizing: border-box;

  @media (max-width: 576px) {
    padding: 0 0.5rem;
    height: min(70vh, 600px);
  }
`;

const SlideImg = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  border-radius: 4px;
`;

const NavBtn = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ $side }) => ($side === 'left' ? 'left: 8px;' : 'right: 8px;')}
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;

  &:hover {
    background: rgba(255, 255, 255, 0.28);
  }

  @media (max-width: 576px) {
    width: 38px;
    height: 38px;
  }
`;

const Dots = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 1rem;
  padding-bottom: env(safe-area-inset-bottom, 12px);
`;

const Dot = styled.button`
  width: ${({ $active }) => ($active ? '8px' : '6px')};
  height: ${({ $active }) => ($active ? '8px' : '6px')};
  border-radius: 50%;
  border: none;
  padding: 0;
  background: ${({ $active }) => ($active ? '#fff' : 'rgba(255,255,255,0.4)')};
  cursor: pointer;
`;

const SWIPE_THRESHOLD = 50;

const ImageLightbox = ({ images = [], initialIndex = 0, onClose }) => {
  const urls = (images || []).filter(Boolean);
  const [index, setIndex] = useState(initialIndex);
  const touchStart = useRef(null);

  const go = useCallback(
    (dir) => {
      setIndex((i) => {
        const next = i + dir;
        if (next < 0) return urls.length - 1;
        if (next >= urls.length) return 0;
        return next;
      });
    },
    [urls.length]
  );

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, go]);

  const onTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStart.current == null || urls.length < 2) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (diff > SWIPE_THRESHOLD) go(-1);
    else if (diff < -SWIPE_THRESHOLD) go(1);
    touchStart.current = null;
  };

  if (!urls.length) return null;

  const multi = urls.length > 1;

  return createPortal(
    <Overlay
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <CloseBtn type="button" onClick={onClose} aria-label="Close">
        <FaTimes />
      </CloseBtn>
      {multi && (
        <Counter>
          {index + 1} / {urls.length}
        </Counter>
      )}
      <Stage onClick={(e) => e.stopPropagation()}>
        {multi && (
          <NavBtn type="button" $side="left" onClick={() => go(-1)} aria-label="Previous image">
            <FaChevronLeft />
          </NavBtn>
        )}
        <SlideImg src={urls[index]} alt="" draggable={false} />
        {multi && (
          <NavBtn type="button" $side="right" onClick={() => go(1)} aria-label="Next image">
            <FaChevronRight />
          </NavBtn>
        )}
      </Stage>
      {multi && (
        <Dots>
          {urls.map((_, i) => (
            <Dot key={i} type="button" $active={i === index} onClick={() => setIndex(i)} aria-label={`Image ${i + 1}`} />
          ))}
        </Dots>
      )}
    </Overlay>,
    document.body
  );
};

export default ImageLightbox;
