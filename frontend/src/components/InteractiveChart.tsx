'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  label?: string;
}

interface InteractiveChartProps {
  title: string;
  data: ChartData[];
  value: number | string;
  description: string;
  icon: React.ReactNode;
  color: string;
  colorClasses: string;
}

type ChartType = 'line' | 'bar' | 'pie';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function InteractiveChart({
  title,
  data,
  value,
  description,
  icon,
  color,
  colorClasses,
}: InteractiveChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [isExpanded, setIsExpanded] = useState(false);

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="h-40 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">No data available</p>
          </div>
        </div>
      );
    }

    const chartHeight = isExpanded ? 200 : 120;

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={3}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="value" 
                fill={color}
                radius={[4, 4, 0, 0]}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={isExpanded ? 30 : 20}
                outerRadius={isExpanded ? 70 : 45}
                paddingAngle={5}
                dataKey="value"
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              {isExpanded && (
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="feature-card relative group hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`feature-icon ${colorClasses} group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{value}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`w-5 h-5 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Chart Type Selector */}
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">View:</span>
        <div className="flex space-x-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
          {(['line', 'bar', 'pie'] as ChartType[]).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                chartType === type
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title={`Switch to ${type} chart`}
            >
              {type === 'line' && (
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
              {type === 'bar' && (
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )}
              {type === 'pie' && (
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
              )}
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="transition-all duration-500 ease-in-out overflow-hidden">
        {renderChart()}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {title} Breakdown
          </h4>
          <div className="space-y-3 max-h-40 overflow-y-auto chart-details-scroll">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
