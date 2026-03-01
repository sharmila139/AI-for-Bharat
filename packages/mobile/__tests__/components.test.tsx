/**
 * Component Tests
 * Tests for LoadingState, ErrorBoundary, and ErrorState components
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { LoadingState, ErrorBoundary, ErrorState } from '../src/components';

describe('LoadingState', () => {
  it('renders with default props', () => {
    const { getByTestId } = render(<LoadingState />);
    // ActivityIndicator is rendered
    expect(getByTestId).toBeDefined();
  });

  it('renders with message', () => {
    const { getByText } = render(<LoadingState message="Loading data..." />);
    expect(getByText('Loading data...')).toBeTruthy();
  });

  it('renders inline variant', () => {
    const { container } = render(
      <LoadingState variant="inline" message="Syncing..." />
    );
    expect(container).toBeTruthy();
  });
});

describe('ErrorState', () => {
  it('renders network error with default message', () => {
    const { getByText } = render(<ErrorState type="network" />);
    expect(getByText(/Unable to connect/i)).toBeTruthy();
  });

  it('renders custom error message', () => {
    const { getByText } = render(
      <ErrorState type="network" message="Custom error message" />
    );
    expect(getByText('Custom error message')).toBeTruthy();
  });

  it('calls onRetry when retry button pressed', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <ErrorState type="network" onRetry={onRetry} />
    );

    const retryButton = getByText('Try Again');
    fireEvent.press(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders custom retry label', () => {
    const { getByText } = render(
      <ErrorState type="network" retryLabel="Reload" onRetry={() => {}} />
    );
    expect(getByText('Reload')).toBeTruthy();
  });

  it('renders different error types', () => {
    const types: Array<'network' | 'server' | 'unknown' | 'notFound' | 'unauthorized'> = [
      'network',
      'server',
      'unknown',
      'notFound',
      'unauthorized',
    ];

    types.forEach((type) => {
      const { getByText } = render(<ErrorState type={type} />);
      expect(getByText('Something went wrong')).toBeTruthy();
    });
  });
});

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Child component</Text>
      </ErrorBoundary>
    );
    expect(getByText('Child component')).toBeTruthy();
  });

  it('catches errors and displays fallback UI', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText(/Something went wrong/i)).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });

  it('renders custom fallback UI', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { getByText } = render(
      <ErrorBoundary fallback={<Text>Custom fallback</Text>}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('Custom fallback')).toBeTruthy();
  });

  it('resets error state on retry', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <Text>Success</Text>;
    };

    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error is caught
    expect(getByText(/Something went wrong/i)).toBeTruthy();

    // Click retry
    const retryButton = getByText('Try Again');
    fireEvent.press(retryButton);

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show success
    expect(getByText('Success')).toBeTruthy();
  });
});

describe('Component Integration', () => {
  it('can use all components together', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <LoadingState message="Loading..." />
        <ErrorState type="network" onRetry={() => {}} />
      </ErrorBoundary>
    );

    expect(getByText('Loading...')).toBeTruthy();
    expect(getByText('Something went wrong')).toBeTruthy();
  });
});
