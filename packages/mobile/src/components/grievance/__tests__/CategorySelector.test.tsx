/**
 * CategorySelector Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategorySelector } from '../CategorySelector';
import { GrievanceCategory } from '../../../services/api/grievance-api';

describe('CategorySelector', () => {
  const mockOnCategoryChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with no selection', () => {
    const { getByText } = render(
      <CategorySelector
        selectedCategory={null}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(getByText('Issue Category')).toBeTruthy();
    expect(getByText('Select Category')).toBeTruthy();
  });

  it('renders selected category', () => {
    const { getByText } = render(
      <CategorySelector
        selectedCategory="road"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(getByText('Roads')).toBeTruthy();
    expect(getByText('Potholes, cracks, damaged pavement')).toBeTruthy();
  });

  it('shows AI badge with high confidence', () => {
    const { getByText } = render(
      <CategorySelector
        selectedCategory={null}
        onCategoryChange={mockOnCategoryChange}
        aiCategory="water"
        aiConfidence={92}
      />
    );

    expect(getByText('AI Detected')).toBeTruthy();
    expect(getByText('Water Supply (92% confidence)')).toBeTruthy();
  });

  it('shows low confidence warning', () => {
    const { getByText } = render(
      <CategorySelector
        selectedCategory={null}
        onCategoryChange={mockOnCategoryChange}
        aiCategory="electricity"
        aiConfidence={75}
      />
    );

    expect(getByText('AI Detected')).toBeTruthy();
    expect(
      getByText('Low confidence. Please verify or select manually.')
    ).toBeTruthy();
  });

  it('shows severity badge', () => {
    const { getByText } = render(
      <CategorySelector
        selectedCategory={null}
        onCategoryChange={mockOnCategoryChange}
        aiSeverity="high"
      />
    );

    expect(getByText('High Severity')).toBeTruthy();
  });

  it('shows classifying indicator', () => {
    const { getByText } = render(
      <CategorySelector
        selectedCategory={null}
        onCategoryChange={mockOnCategoryChange}
        isClassifying={true}
      />
    );

    expect(getByText('AI is analyzing the photo...')).toBeTruthy();
  });

  it('opens modal when selector is pressed', () => {
    const { getByText } = render(
      <CategorySelector
        selectedCategory={null}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const selector = getByText('Select Category');
    fireEvent.press(selector);

    expect(getByText('Select Category')).toBeTruthy(); // Modal title
  });

  it('calls onCategoryChange when category is selected', () => {
    const { getByText } = render(
      <CategorySelector
        selectedCategory={null}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    // Open modal
    const selector = getByText('Select Category');
    fireEvent.press(selector);

    // Select a category
    const roadCategory = getByText('Roads');
    fireEvent.press(roadCategory);

    expect(mockOnCategoryChange).toHaveBeenCalledWith('road');
  });

  it('disables selector when disabled prop is true', () => {
    const { getByText } = render(
      <CategorySelector
        selectedCategory={null}
        onCategoryChange={mockOnCategoryChange}
        disabled={true}
      />
    );

    const selector = getByText('Select Category');
    expect(selector.props.accessibilityState?.disabled).toBe(true);
  });

  it('shows checkmark for selected category in modal', () => {
    const { getByText } = render(
      <CategorySelector
        selectedCategory="sanitation"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    // Open modal
    const selector = getByText('Sanitation');
    fireEvent.press(selector);

    // Check for checkmark
    const checkmarks = getByText('✓');
    expect(checkmarks).toBeTruthy();
  });

  it('renders all 8 categories in modal', () => {
    const { getByText } = render(
      <CategorySelector
        selectedCategory={null}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    // Open modal
    const selector = getByText('Select Category');
    fireEvent.press(selector);

    // Check all categories are present
    expect(getByText('Roads')).toBeTruthy();
    expect(getByText('Water Supply')).toBeTruthy();
    expect(getByText('Electricity')).toBeTruthy();
    expect(getByText('Sanitation')).toBeTruthy();
    expect(getByText('Healthcare')).toBeTruthy();
    expect(getByText('Education')).toBeTruthy();
    expect(getByText('Public Safety')).toBeTruthy();
    expect(getByText('Other')).toBeTruthy();
  });

  it('maps severity levels correctly', () => {
    const severities: Array<'low' | 'medium' | 'high' | 'critical'> = [
      'low',
      'medium',
      'high',
      'critical',
    ];
    const expectedTexts = ['Low Severity', 'Medium Severity', 'High Severity', 'Critical Severity'];

    severities.forEach((severity, index) => {
      const { getByText } = render(
        <CategorySelector
          selectedCategory={null}
          onCategoryChange={mockOnCategoryChange}
          aiSeverity={severity}
        />
      );

      expect(getByText(expectedTexts[index])).toBeTruthy();
    });
  });
});
