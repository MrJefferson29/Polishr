import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { salonsAPI } from '../services/api';

const initialState = {
  salons: [],
  filteredSalons: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedSalon: null,
};

const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SALONS: 'SET_SALONS',
  SET_FILTERED: 'SET_FILTERED',
  SET_SEARCH: 'SET_SEARCH',
  SET_SELECTED: 'SET_SELECTED',
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case ACTIONS.SET_SALONS:
      return { ...state, salons: action.payload, filteredSalons: action.payload, loading: false, error: null };
    case ACTIONS.SET_FILTERED:
      return { ...state, filteredSalons: action.payload };
    case ACTIONS.SET_SEARCH:
      return { ...state, searchQuery: action.payload };
    case ACTIONS.SET_SELECTED:
      return { ...state, selectedSalon: action.payload };
    default:
      return state;
  }
}

const SalonsContext = createContext();

export const SalonsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchSalons = useCallback(async (params = {}) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      const { data } = await salonsAPI.getAll(params);
      dispatch({ type: ACTIONS.SET_SALONS, payload: data });
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.response?.data?.message || 'Failed to load salons' });
    }
  }, []);

  const getSalonById = useCallback(async (id) => {
    try {
      const { data } = await salonsAPI.getById(id);
      dispatch({ type: ACTIONS.SET_SELECTED, payload: data });
      return data;
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.response?.data?.message || 'Failed to load salon' });
      return null;
    }
  }, []);

  const setSearchQuery = useCallback((query) => {
    dispatch({ type: ACTIONS.SET_SEARCH, payload: query });
    const q = query.trim().toLowerCase();
    if (!q) {
      dispatch({ type: ACTIONS.SET_FILTERED, payload: state.salons });
      return;
    }
    const filtered = state.salons.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.title?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        (s.services || []).some(
          (svc) =>
            svc.isActive !== false &&
            (svc.name?.toLowerCase().includes(q) || svc.category?.toLowerCase().includes(q))
        )
    );
    dispatch({ type: ACTIONS.SET_FILTERED, payload: filtered });
  }, [state.salons]);

  useEffect(() => {
    fetchSalons();
  }, [fetchSalons]);

  const value = {
    ...state,
    listings: state.filteredSalons,
    filteredListings: state.filteredSalons,
    fetchSalons,
    fetchListings: fetchSalons,
    getSalonById,
    getListingById: getSalonById,
    setSearchQuery,
  };

  return <SalonsContext.Provider value={value}>{children}</SalonsContext.Provider>;
};

export const useSalons = () => {
  const ctx = useContext(SalonsContext);
  if (!ctx) throw new Error('useSalons must be used within SalonsProvider');
  return ctx;
};

export const useListings = useSalons;
export const ListingsProvider = SalonsProvider;
