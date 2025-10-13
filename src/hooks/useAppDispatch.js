import { useDispatch } from 'react-redux';
import { store } from '../store';

// Typed dispatch hook
export const useAppDispatch = () => useDispatch(); // typeof store.dispatch() removed for JS

// Typed selector hook
export const useAppSelector = (selector) => {
  const { useSelector } = require('react-redux');
  return useSelector(selector);
};
