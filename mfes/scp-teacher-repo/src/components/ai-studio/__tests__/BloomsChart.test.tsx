import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BloomsChart from '../BloomsChart';

// Mock Recharts entirely to avoid SVG issues in JSDOM
// Mock Recharts to render simple divs with data for testing
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ data, children }: any) => (
    <div data-testid="bar-chart">
      {data.map((d: any) => (
        <div key={d.name}>
          <span>{d.name}</span>
          <span>{d.count}</span>
        </div>
      ))}
      {children}
    </div>
  ),
  Bar: ({ children }: any) => <div>{children}</div>,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Cell: () => null,
  LabelList: () => null,
}));

describe('BloomsChart', () => {
  const mockQuestions: any[] = [
    { id: '1', bloomsLevel: 'remember' },
    { id: '2', bloomsLevel: 'remember' },
    { id: '3', bloomsLevel: 'understand' },
    { id: '4', bloomsLevel: 'apply' },
  ];

  it('renders bars for each Bloom level present', () => {
    render(<BloomsChart questions={mockQuestions} />);
    expect(screen.getByText("Bloom's Taxonomy Distribution")).toBeInTheDocument();
    // Recharts renders text inside SVG
    expect(screen.getByText('Remember')).toBeInTheDocument();
    expect(screen.getByText('Understand')).toBeInTheDocument();
    expect(screen.getByText('Apply')).toBeInTheDocument();
  });

  it('shows correct count labels', () => {
    render(<BloomsChart questions={mockQuestions} />);
    // Check for the counts (rendered as labels in the bar)
    expect(screen.getByText('2')).toBeInTheDocument(); // remember count
    expect(screen.getAllByText('1')).toHaveLength(2); // understand and apply count
  });

  it('handles empty questions array gracefully', () => {
    render(<BloomsChart questions={[]} />);
    expect(screen.getByText('No questions generated yet')).toBeInTheDocument();
  });
});
