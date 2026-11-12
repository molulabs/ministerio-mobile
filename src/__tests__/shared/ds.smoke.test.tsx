import { Button } from '@molulabs/ds';
import { DesignSystemProvider } from '@molulabs/ds/native';
import { render, screen } from '@testing-library/react-native';

it('renders a component of the design system', async () => {
  await render(
    <DesignSystemProvider>
      <Button>Entrar</Button>
    </DesignSystemProvider>,
  );
  expect(screen.getByRole('button', { name: 'Entrar' })).toBeOnTheScreen();
});
