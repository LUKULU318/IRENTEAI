// src/__tests__/SocialMediaAnalysis.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import SocialMediaAnalysis from '../components/SocialMediaAnalysis';
import { gcpServices } from '../api';

// Mock API calls
jest.mock('../api', () => ({
  gcpServices: {
    analyzeSocialContent: jest.fn()
  }
}));

describe('SocialMediaAnalysis Component', () => {
  test('shows error for invalid URL', async () => {
    render(<SocialMediaAnalysis />);
    
    // Find input and button
    const input = screen.getByLabelText('Social Media URL');
    const button = screen.getByRole('button', { name: /analyze post/i });
    
    // Simulate user flow
    fireEvent.change(input, { target: { value: 'invalid-url' } });
    fireEvent.click(button);
    
    // Assert error message
    expect(await screen.findByText(/valid URL starting with/i)).toBeInTheDocument();
  });

  test('shows loading state during API call', async () => {
    gcpServices.analyzeSocialContent.mockImplementation(
      () => new Promise(() => {})
    );
    
    render(<SocialMediaAnalysis />);
    fireEvent.click(screen.getByText(/analyze post/i));
    
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });
});