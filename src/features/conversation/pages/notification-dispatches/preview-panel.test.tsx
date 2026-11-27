import { render, screen, userEvent } from '@test-utils';
import { DispatchPreview } from './preview-panel';

const bodies = {
  email: {
    subject: 'Appointment for {{patientName}}',
    body: 'Hello {{patientName}}',
    html: '<p>Hello {{patientName}}</p>',
  },
  sms: { body: 'Hi {{patientName}}' },
  whatsapp: { body: 'Hi {{patientName}}' },
};

describe('DispatchPreview', () => {
  it('renders the defined channels as tabs and the first one active', () => {
    render(<DispatchPreview bodies={bodies} context={{ patientName: 'Ada' }} />);

    expect(screen.getByTestId('dispatch-preview')).toBeInTheDocument();
    expect(screen.getByTestId('dispatch-preview-tab-email')).toBeInTheDocument();
    expect(screen.getByTestId('dispatch-preview-tab-sms')).toBeInTheDocument();
    expect(screen.getByTestId('dispatch-preview-tab-whatsapp')).toBeInTheDocument();
    expect(screen.getByTestId('dispatch-preview-subject')).toHaveTextContent('Appointment for Ada');
    expect(screen.getByTestId('dispatch-preview-text')).toHaveTextContent('Hello Ada');
  });

  it('switches the panel when another channel tab is clicked', async () => {
    render(<DispatchPreview bodies={bodies} context={{ patientName: 'Ada' }} />);

    await userEvent.click(screen.getByTestId('dispatch-preview-tab-sms'));

    expect(screen.getByTestId('dispatch-preview-text')).toHaveTextContent('Hi Ada');
    expect(screen.queryByTestId('dispatch-preview-html')).not.toBeInTheDocument();
  });

  it('renders email HTML in a fully sandboxed iframe', () => {
    render(<DispatchPreview bodies={bodies} context={{ patientName: 'Ada' }} />);

    const frame = screen.getByTestId('dispatch-preview-html');
    expect(frame.tagName).toBe('IFRAME');
    expect(frame).toHaveAttribute('sandbox', '');
    expect(frame.getAttribute('srcdoc')).toContain('<p>Hello Ada</p>');
  });

  it('reports an invalid context instead of rendering a misleading preview', () => {
    render(<DispatchPreview bodies={bodies} context={{}} contextError="Unexpected token }" />);

    expect(screen.getByTestId('dispatch-preview-context-error')).toHaveTextContent(
      'Unexpected token }'
    );
    expect(screen.queryByTestId('dispatch-preview')).not.toBeInTheDocument();
  });

  it('lists the missing parameters per body and flags the affected tabs', () => {
    render(
      <DispatchPreview
        bodies={{
          email: { body: 'Hi {{patientName}} on {{date}}' },
          sms: { body: 'Hi {{patientName}}' },
        }}
        context={{ patientName: 'Ada' }}
      />
    );

    expect(screen.getByTestId('dispatch-preview-missing')).toBeInTheDocument();
    expect(screen.getByTestId('dispatch-preview-missing-email')).toHaveTextContent('Email: date');
    expect(screen.queryByTestId('dispatch-preview-missing-sms')).not.toBeInTheDocument();
    expect(screen.getByTestId('dispatch-preview-tab-missing-email')).toHaveTextContent('1');
    expect(screen.queryByTestId('dispatch-preview-tab-missing-sms')).not.toBeInTheDocument();
  });

  it('lists every affected body when several are short of parameters', () => {
    render(
      <DispatchPreview
        bodies={{
          email: { body: 'Hi {{patientName}} on {{date}}' },
          sms: { body: 'Hi {{patientName}} — {{hospitalName}}' },
        }}
        context={{}}
      />
    );

    expect(screen.getByTestId('dispatch-preview-missing-email')).toHaveTextContent(
      'Email: patientName, date'
    );
    expect(screen.getByTestId('dispatch-preview-missing-sms')).toHaveTextContent(
      'SMS: patientName, hospitalName'
    );
  });

  it('shows no validation alert when every body is satisfied', () => {
    render(<DispatchPreview bodies={bodies} context={{ patientName: 'Ada' }} />);

    expect(screen.queryByTestId('dispatch-preview-missing')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dispatch-preview-tab-missing-email')).not.toBeInTheDocument();
  });

  it('shows an empty state when the template has no bodies', () => {
    render(<DispatchPreview bodies={null} context={{}} />);

    expect(screen.getByTestId('dispatch-preview-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('dispatch-preview')).not.toBeInTheDocument();
  });

  it('shows the loading copy while the bodies are in flight', () => {
    render(<DispatchPreview bodies={null} context={{}} loading />);

    expect(screen.getByTestId('dispatch-preview-empty')).toHaveTextContent(
      'Loading the template bodies'
    );
  });
});
