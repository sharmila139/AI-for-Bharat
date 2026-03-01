/**
 * Multiple Choice Voting Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MultipleChoiceVoting } from '../MultipleChoiceVoting';

const mockOptions = [
  { option_id: 'opt_1', text: 'Option 1' },
  { option_id: 'opt_2', text: 'Option 2' },
  { option_id: 'opt_3', text: 'Option 3' },
];

describe('MultipleChoiceVoting', () => {
  it('renders all options', () => {
    const onVoteChange = jest.fn();
    const { getByText } = render(
      <MultipleChoiceVoting
        options={mockOptions}
        selectedOptions={[]}
        onVoteChange={onVoteChange}
      />
    );

    expect(getByText('Option 1')).toBeTruthy();
    expect(getByText('Option 2')).toBeTruthy();
    expect(getByText('Option 3')).toBeTruthy();
  });

  it('allows selecting multiple options', () => {
    const onVoteChange = jest.fn();
    const { getByText } = render(
      <MultipleChoiceVoting
        options={mockOptions}
        selectedOptions={[]}
        onVoteChange={onVoteChange}
      />
    );

    fireEvent.press(getByText('Option 1'));
    expect(onVoteChange).toHaveBeenCalledWith({
      selected_options: ['opt_1'],
    });

    fireEvent.press(getByText('Option 2'));
    expect(onVoteChange).toHaveBeenCalledWith({
      selected_options: ['opt_2'],
    });
  });

  it('allows deselecting options', () => {
    const onVoteChange = jest.fn();
    const { getByText } = render(
      <MultipleChoiceVoting
        options={mockOptions}
        selectedOptions={['opt_1', 'opt_2']}
        onVoteChange={onVoteChange}
      />
    );

    fireEvent.press(getByText('Option 1'));
    expect(onVoteChange).toHaveBeenCalledWith({
      selected_options: ['opt_2'],
    });
  });

  it('displays selection count', () => {
    const onVoteChange = jest.fn();
    const { getByText } = render(
      <MultipleChoiceVoting
        options={mockOptions}
        selectedOptions={['opt_1', 'opt_2']}
        onVoteChange={onVoteChange}
      />
    );

    expect(getByText('2 options selected')).toBeTruthy();
  });

  it('handles empty selection', () => {
    const onVoteChange = jest.fn();
    const { getByText } = render(
      <MultipleChoiceVoting
        options={mockOptions}
        selectedOptions={[]}
        onVoteChange={onVoteChange}
      />
    );

    expect(getByText('0 options selected')).toBeTruthy();
  });
});
