/**
 * Budget Allocation Voting Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BudgetAllocationVoting } from '../BudgetAllocationVoting';

// Mock the Slider component
jest.mock('@react-native-community/slider', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ onValueChange, value, ...props }: any) => (
      <View
        testID="slider"
        onTouchEnd={() => onValueChange && onValueChange(props.maximumValue / 2)}
      />
    ),
  };
});

const mockOptions = [
  { option_id: 'opt_1', text: 'Project A', budget_amount: 1000000 },
  { option_id: 'opt_2', text: 'Project B', budget_amount: 500000 },
  { option_id: 'opt_3', text: 'Project C', budget_amount: 300000 },
];

describe('BudgetAllocationVoting', () => {
  it('renders all options with sliders', () => {
    const onVoteChange = jest.fn();
    const { getByText } = render(
      <BudgetAllocationVoting
        options={mockOptions}
        allocations={[]}
        onVoteChange={onVoteChange}
      />
    );

    expect(getByText('Project A')).toBeTruthy();
    expect(getByText('Project B')).toBeTruthy();
    expect(getByText('Project C')).toBeTruthy();
  });

  it('displays total budget correctly', () => {
    const onVoteChange = jest.fn();
    const { getByText } = render(
      <BudgetAllocationVoting
        options={mockOptions}
        allocations={[]}
        onVoteChange={onVoteChange}
      />
    );

    // Total: 1000000 + 500000 + 300000 = 1800000
    expect(getByText('₹18,00,000')).toBeTruthy();
  });

  it('displays allocated and remaining budget', () => {
    const allocations = [
      { option_id: 'opt_1', amount: 500000 },
      { option_id: 'opt_2', amount: 300000 },
    ];

    const onVoteChange = jest.fn();
    const { getByText } = render(
      <BudgetAllocationVoting
        options={mockOptions}
        allocations={allocations}
        onVoteChange={onVoteChange}
      />
    );

    expect(getByText('₹8,00,000')).toBeTruthy(); // Allocated
    expect(getByText('₹10,00,000')).toBeTruthy(); // Remaining
  });

  it('shows warning when budget is exceeded', () => {
    const allocations = [
      { option_id: 'opt_1', amount: 1000000 },
      { option_id: 'opt_2', amount: 500000 },
      { option_id: 'opt_3', amount: 500000 }, // Total exceeds budget
    ];

    const onVoteChange = jest.fn();
    const { getByText } = render(
      <BudgetAllocationVoting
        options={mockOptions}
        allocations={allocations}
        onVoteChange={onVoteChange}
      />
    );

    expect(getByText(/exceeded the total budget/)).toBeTruthy();
  });

  it('displays percentage of total budget for each allocation', () => {
    const allocations = [{ option_id: 'opt_1', amount: 900000 }]; // 50% of 1800000

    const onVoteChange = jest.fn();
    const { getByText } = render(
      <BudgetAllocationVoting
        options={mockOptions}
        allocations={allocations}
        onVoteChange={onVoteChange}
      />
    );

    expect(getByText(/50% of total budget/)).toBeTruthy();
  });

  it('calls onVoteChange when allocation changes', () => {
    const onVoteChange = jest.fn();
    const { getAllByTestId } = render(
      <BudgetAllocationVoting
        options={mockOptions}
        allocations={[]}
        onVoteChange={onVoteChange}
      />
    );

    // Simulate slider change
    const sliders = getAllByTestId('slider');
    fireEvent(sliders[0], 'touchEnd');

    expect(onVoteChange).toHaveBeenCalled();
  });

  it('displays progress bar showing allocation percentage', () => {
    const allocations = [{ option_id: 'opt_1', amount: 900000 }]; // 50%

    const onVoteChange = jest.fn();
    const { getByText } = render(
      <BudgetAllocationVoting
        options={mockOptions}
        allocations={allocations}
        onVoteChange={onVoteChange}
      />
    );

    expect(getByText('50%')).toBeTruthy();
  });

  it('handles zero allocations', () => {
    const onVoteChange = jest.fn();
    const { getByText } = render(
      <BudgetAllocationVoting
        options={mockOptions}
        allocations={[]}
        onVoteChange={onVoteChange}
      />
    );

    expect(getByText('₹0')).toBeTruthy(); // Allocated amount
  });
});
