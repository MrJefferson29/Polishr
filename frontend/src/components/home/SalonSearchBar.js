import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import styled from 'styled-components';
import {
  filterSalonsByQuery,
  getSalonThumbnail,
  getFeaturedServices,
} from '../../utils/salonSearch';

const ACCENT = '#e91e63';
const ACCENT_DARK = '#c2185b';

const Wrap = styled.div`
  position: relative;
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  z-index: 9999;
`;

const SearchForm = styled(Form)`
  width: 100%;
`;

const InputGroupStyled = styled(InputGroup)`
  background: #ffffff;
  border-radius: 50px;
  padding: 6px 12px;
  box-shadow: 0 10px 30px rgba(248, 187, 208, 0.25);
  border: 1px solid rgba(248, 187, 208, 0.45);
  transition: all 0.25s ease;
  position: relative;

  &:focus-within {
    box-shadow: 0 12px 36px rgba(233, 30, 99, 0.2);
    border-color: rgba(233, 30, 99, 0.35);
  }
`;

const Input = styled(Form.Control)`
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  padding-left: 1.25rem;
  font-size: 1rem;
  color: #333;

  &::placeholder {
    color: #aaa;
  }
`;

const SubmitBtn = styled.button`
  background: linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK});
  color: #fff;
  border: none;
  border-radius: 50px !important;
  padding: 0 1.5rem;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.2s ease;

  &:hover {
    filter: brightness(1.06);
  }
`;

const Dropdown = styled.ul`
  position: fixed;
  margin: 0;
  padding: 0.5rem;
  list-style: none;
  background: rgba(255, 255, 255, 0.99);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  border: 1px solid rgba(233, 30, 99, 0.15);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
  max-height: min(360px, 50vh);
  overflow-y: auto;
  z-index: 100000;
`;

const SuggestionItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover,
  &[data-active='true'] {
    background: rgba(233, 30, 99, 0.08);
  }

  .thumb {
    width: 56px;
    height: 56px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
    background: linear-gradient(135deg, #fce4ec, #f1f5f9);
  }

  .thumb-placeholder {
    width: 56px;
    height: 56px;
    border-radius: 10px;
    flex-shrink: 0;
    background: linear-gradient(135deg, #fce4ec, #f8bbd0);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: ${ACCENT};
  }

  .info {
    flex: 1;
    min-width: 0;
  }

  .title {
    font-weight: 600;
    color: #0f172a;
    font-size: 0.95rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .services {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.35rem;
  }

  .chip {
    font-size: 0.72rem;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    background: rgba(233, 30, 99, 0.08);
    color: ${ACCENT_DARK};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
  }
`;

const EmptyHint = styled.li`
  padding: 1rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
`;

const SalonSearchBar = ({ salons = [], onSearchSubmit, placeholder }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapRef = useRef(null);
  const inputGroupRef = useRef(null);

  const suggestions = useMemo(
    () => filterSalonsByQuery(salons, query, 8),
    [salons, query]
  );

  const showDropdown = open && query.trim().length > 0;

  const updateDropdownPosition = useCallback(() => {
    const el = inputGroupRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!showDropdown) return undefined;
    updateDropdownPosition();
    window.addEventListener('scroll', updateDropdownPosition, true);
    window.addEventListener('resize', updateDropdownPosition);
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [showDropdown, updateDropdownPosition]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const goToSalon = (salonId) => {
    setOpen(false);
    setQuery('');
    setActiveIndex(-1);
    navigate(`/salon/${salonId}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      goToSalon(suggestions[activeIndex]._id);
      return;
    }
    if (suggestions.length === 1) {
      goToSalon(suggestions[0]._id);
      return;
    }
    onSearchSubmit?.(query);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const dropdownPortal =
    showDropdown &&
    createPortal(
      <Dropdown role="listbox" style={dropdownStyle}>
        {suggestions.length === 0 ? (
          <EmptyHint>No salons match &ldquo;{query}&rdquo;</EmptyHint>
        ) : (
          suggestions.map((salon, idx) => {
            const thumb = getSalonThumbnail(salon);
            const services = getFeaturedServices(salon, 2);
            return (
              <SuggestionItem
                key={salon._id}
                role="option"
                data-active={activeIndex === idx}
                aria-selected={activeIndex === idx}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => goToSalon(salon._id)}
              >
                {thumb ? (
                  <img className="thumb" src={thumb} alt="" />
                ) : (
                  <div className="thumb-placeholder">💅</div>
                )}
                <div className="info">
                  <div className="title">{salon.name}</div>
                  <div className="services">
                    {services.length > 0 ? (
                      services.map((s, i) => (
                        <span key={i} className="chip">
                          {s.name}
                        </span>
                      ))
                    ) : (
                      <span className="chip">View salon</span>
                    )}
                  </div>
                </div>
              </SuggestionItem>
            );
          })
        )}
      </Dropdown>,
      document.body
    );

  return (
    <Wrap ref={wrapRef}>
      <SearchForm onSubmit={handleSubmit}>
        <InputGroupStyled ref={inputGroupRef} size="lg">
          <Input
            type="search"
            autoComplete="off"
            placeholder={placeholder || 'Search salon name or service (e.g. gel manicure)...'}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              setOpen(true);
              updateDropdownPosition();
            }}
            onKeyDown={handleKeyDown}
            aria-autocomplete="list"
            aria-expanded={showDropdown}
          />
          <SubmitBtn type="submit" aria-label="Search">
            <FaSearch />
          </SubmitBtn>
        </InputGroupStyled>
      </SearchForm>
      {dropdownPortal}
    </Wrap>
  );
};

export default SalonSearchBar;
