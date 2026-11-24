import { render, screen } from '@test-utils';
import { describe, expect, it } from 'vitest';
import { CallPanel } from './call-panel';

describe('CallPanel', () => {
  it('explains that no room exists until the patient starts the consultation', () => {
    render(<CallPanel callId={null} />);
    expect(screen.getByText('No consultation room yet')).toBeInTheDocument();
    expect(screen.queryByTestId('encounter-video-join')).not.toBeInTheDocument();
  });

  it('offers a join action when a room id is available', () => {
    render(<CallPanel callId="conversation-123" />);
    expect(screen.getByTestId('encounter-video-panel')).toBeInTheDocument();
    expect(screen.getByTestId('encounter-video-join')).toBeInTheDocument();
    expect(screen.getByTestId('encounter-video-status')).toHaveTextContent('Not joined');
  });
});
