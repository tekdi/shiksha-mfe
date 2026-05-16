import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LabelList
} from 'recharts';
import { QuizQuestion, BloomsLevel } from '../../utils/AIContentTypes';

interface BloomsChartProps {
  questions: QuizQuestion[];
}

const BLOOMS_COLORS: Record<BloomsLevel, string> = {
  remember: '#4FC3F7',
  understand: '#81C784',
  apply: '#FFB74D',
  analyze: '#E57373'
};

const BloomsChart: React.FC<BloomsChartProps> = ({ questions }) => {
  if (!questions || questions.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: '12px' }}>
        <Typography color="text.secondary">No questions generated yet</Typography>
      </Paper>
    );
  }

  const data = [
    { name: 'Remember', level: 'remember', count: questions.filter(q => q.bloomsLevel === 'remember').length },
    { name: 'Understand', level: 'understand', count: questions.filter(q => q.bloomsLevel === 'understand').length },
    { name: 'Apply', level: 'apply', count: questions.filter(q => q.bloomsLevel === 'apply').length },
    { name: 'Analyze', level: 'analyze', count: questions.filter(q => q.bloomsLevel === 'analyze').length },
  ].filter(d => d.count >= 0); // Keep all for consistent axis

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', bgcolor: '#fafafa' }}>
      <Typography variant="h6" gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary', mb: 2 }}>
        Bloom's Taxonomy Distribution
      </Typography>
      <Box sx={{ width: '100%', height: 180 }}>
        <ResponsiveContainer>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fontWeight: 500 }}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={BLOOMS_COLORS[entry.level as BloomsLevel]} />
              ))}
              <LabelList dataKey="count" position="insideRight" style={{ fill: '#fff', fontSize: 10, fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default BloomsChart;
