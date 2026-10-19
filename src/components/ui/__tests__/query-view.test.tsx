import type { UseQueryResult } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { QueryView } from '@/components/ui/query-view';
import { ApiError } from '@/lib/api';

const q = (partial: Partial<UseQueryResult<string[]>>) =>
  ({ refetch: jest.fn(), ...partial }) as unknown as UseQueryResult<string[]>;

describe('QueryView', () => {
  it('shows error with retry when there is no data', async () => {
    await render(
      <QueryView query={q({ isError: true, error: new ApiError('network', 'x') })}>
        {() => <Text>data</Text>}
      </QueryView>,
    );
    expect(screen.getByText(/No connection/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen();
  });

  it('shows empty state', async () => {
    await render(
      <QueryView
        query={q({ data: [] })}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'No assets' }}>
        {() => <Text>data</Text>}
      </QueryView>,
    );
    expect(screen.getByText('No assets')).toBeOnTheScreen();
  });

  it('renders data', async () => {
    await render(<QueryView query={q({ data: ['a'] })}>{(d) => <Text>{d[0]}</Text>}</QueryView>);
    expect(screen.getByText('a')).toBeOnTheScreen();
  });
});
