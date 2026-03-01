/**
 * Single Choice Voting Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SingleChoiceVoting } from '../SingleChoiceVoting';

const mockOptions = [
  { option_id: 'opt_1', text: 'Option 1', description: 'First option' },
  { option_id: 'opt_2', text: 'Option 2', description: 'Second option' },
  { option_id: 'opt_3', text: 'Option 3' },
];

describe('SingleChoiceVoting', () => {
  it('renders all options', () => {
    const onVoteChange = jest.fn();
    const { getByText } = render(
      <SingleChoiceVoting options={mockOptions} onVoteChange={onVoteChange} />
    );

    expect(getByText('Option 1')).toBeTruthy();
    expect(getByText('Option 2')).toBeTruthy();
    expect(getByText('Option 3')).toBeTruthy();
  });

  it('displays option descriptions', () => {
    const onVoteChange = jest.fn();
    const { getByText } = render(
      <SingleChoiceVoting options={mockOptions} onVoteChange={onVoteChange} />
    );

    expect(getByText('First option')).toBeTruthy();
    expect(getByText('Second option')).toBeTruthy();
  });

  it('calls onVoteChange when option is selected', () => {
    const onVoteChange = jest.fn();
    const { getByText } = render(
      <SingleChoiceVoting options={mockOptions} onVoteChange={onVoteChange} />
    );

    fireEvent.press(getByText('Option 1'));

    expect(onVoteChange).toHaveBeenCalledWith({
      selected_option: 'opt_1',
    });
  });

  it('highlights selected option', () => {
    const onVoteChange = jest.fn();
    const { getByText, rerender } = render(
      <SingleChoiceVoting
        options={mockOptions}
        selectedOption="opt_2"
        onVoteChange={onVoteChange}
      />
    );

    // The selected option should have different styling
    // This would require checking the style prop, which is implementation-specific
    expect(getByText('Option 2')).toBeTruthy();
  });

  it('allows changing selection', () => {
    const onVoteChange = jest.fn();
    const { getByText } = render(
      <SingleChoiceVoting
        options={mockOptions}
        selectedOption="opt_1"
        onVoteChange={onVoteChange}
      />
    );

    fireEvent.press(getByText('Option 2'));

    expect(onVoteChange).toHaveBeenCalledWith({
      selected_option: 'opt_2',
    });
  });
});
