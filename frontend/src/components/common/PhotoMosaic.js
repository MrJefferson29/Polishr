import React, { useState } from 'react';
import styled from 'styled-components';
import ImageLightbox from './ImageLightbox';

const PATTERNS = [
  { col: 2, row: 2 },
  { col: 1, row: 1 },
  { col: 1, row: 2 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 1, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 2 },
];

const VARIANTS = {
  hero: { cols: 6, colsMobile: 4, rowHeight: 110, rowHeightMobile: 88, gap: 4, radius: 6 },
  compact: { cols: 4, colsMobile: 3, rowHeight: 64, rowHeightMobile: 56, gap: 3, radius: 5 },
  default: { cols: 6, colsMobile: 4, rowHeight: 80, rowHeightMobile: 68, gap: 4, radius: 8 },
  gallery: { cols: 6, colsMobile: 4, rowHeight: 120, rowHeightMobile: 100, gap: 4, radius: 10 },
};

const Mosaic = styled.div`
  display: grid;
  width: 100%;
  gap: ${({ $gap }) => $gap}px;
  grid-template-columns: repeat(${({ $colsMobile }) => $colsMobile}, 1fr);
  grid-auto-rows: ${({ $rowHeightMobile }) => $rowHeightMobile}px;
  grid-auto-flow: dense;

  @media (min-width: 576px) {
    grid-template-columns: repeat(${({ $cols }) => $cols}, 1fr);
    grid-auto-rows: ${({ $rowHeight }) => $rowHeight}px;
  }
`;

const Cell = styled.button`
  grid-column: span ${({ $col }) => $col};
  grid-row: span ${({ $row }) => $row};
  overflow: hidden;
  border-radius: ${({ $radius }) => $radius}px;
  background: #e2e8f0;
  min-height: 0;
  border: none;
  padding: 0;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  display: block;
  width: 100%;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    transition: transform 0.35s ease;
    pointer-events: none;
  }

  &:hover img {
    transform: ${({ $clickable }) => ($clickable ? 'scale(1.03)' : 'none')};
  }
`;

const Empty = styled.div`
  padding: 2.5rem 1rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.95rem;
`;

const CellStatic = styled.div`
  grid-column: span ${({ $col }) => $col};
  grid-row: span ${({ $row }) => $row};
  overflow: hidden;
  border-radius: ${({ $radius }) => $radius}px;
  background: #e2e8f0;
  min-height: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    transition: transform 0.35s ease;
  }

  &:hover img {
    transform: scale(1.03);
  }
`;

const PhotoMosaic = ({
  images = [],
  variant = 'default',
  className,
  emptyMessage = 'No photos yet.',
  enableLightbox = false,
}) => {
  const urls = (images || []).filter(Boolean);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!urls.length) {
    return <Empty className={className}>{emptyMessage}</Empty>;
  }

  const cfg = VARIANTS[variant] || VARIANTS.default;

  return (
    <>
      <Mosaic
        className={className}
        $cols={cfg.cols}
        $colsMobile={cfg.colsMobile}
        $rowHeight={cfg.rowHeight}
        $rowHeightMobile={cfg.rowHeightMobile}
        $gap={cfg.gap}
      >
        {urls.map((src, i) => {
          const pattern = PATTERNS[i % PATTERNS.length];
          const Tag = enableLightbox ? Cell : CellStatic;
          const cellProps = enableLightbox
            ? {
                type: 'button',
                $clickable: true,
                onClick: () => setLightboxIndex(i),
                'aria-label': `View photo ${i + 1}`,
              }
            : {};
          return (
            <Tag
              key={`${src}-${i}`}
              $col={pattern.col}
              $row={pattern.row}
              $radius={cfg.radius}
              {...cellProps}
            >
              <img src={src} alt="" loading="lazy" decoding="async" />
            </Tag>
          );
        })}
      </Mosaic>
      {enableLightbox && lightboxIndex != null && (
        <ImageLightbox
          images={urls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
};

export default PhotoMosaic;
