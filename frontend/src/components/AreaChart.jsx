import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function AreaChart({ data, dataKey = 'score', height = 220 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke="#8884d8" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
