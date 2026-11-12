import { render, screen } from '@testing-library/react';

import { ConfirmDialog } from '../Dialogs';

const props = {
  visible: true,
  title: 'Log out of SportVenue?',
  message: "You'll need your email and password to log back in on this device.",
  confirmLabel: 'Log out',
  cancelLabel: 'Stay',
  onConfirm: () => {},
  onCancel: () => {},
};

test('a plain confirmation is just the title, the message and the actions, with no empty body', async () => {
  render(<ConfirmDialog {...props} destructive />);
  const dialog = await screen.findByRole('alertdialog', { name: 'Log out of SportVenue?' });
  expect(dialog).toHaveAccessibleDescription(props.message);
  // Title bar and actions only.
  expect(dialog.children).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Stay' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
});

test('a confirmation with extra inputs keeps its body', async () => {
  render(
    <ConfirmDialog {...props} title="Cancel this booking?">
      <label>
        Reason
        <input />
      </label>
    </ConfirmDialog>,
  );
  const dialog = await screen.findByRole('alertdialog', { name: 'Cancel this booking?' });
  expect(dialog.children).toHaveLength(3);
  expect(screen.getByRole('textbox', { name: 'Reason' })).toBeInTheDocument();
});
