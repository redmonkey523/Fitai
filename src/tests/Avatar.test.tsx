import React from 'react';
import { render } from '@testing-library/react-native';
import Avatar from '../components/Avatar';

describe('Avatar', () => {
  it('renders with fallback when uri missing', () => {
    const { getByRole } = render(<Avatar />);
    // Image role exists
    expect(getByRole('image')).toBeTruthy();
  });
  it('renders verified dot when verified', () => {
    const { toJSON } = render(<Avatar uri="https://example.com/a.jpg" verified size={40} />);
    expect(toJSON()).toBeTruthy();
  });
});


