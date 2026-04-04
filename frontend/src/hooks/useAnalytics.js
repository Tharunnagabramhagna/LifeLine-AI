import { useState, useEffect } from 'react';

export const useAnalytics = (liveRequests) => {
  // 1. Line Graph Data (Load over time)
  const [graphData, setGraphData] = useState(Array(20).fill(50));

  // 2. Bar Chart Data (Request Types)
  const [barData, setBarData] = useState([
    { label: 'Cardiac', value: 0 },
    { label: 'Trauma', value: 0 },
    { label: 'Fire', value: 0 },
    { label: 'Other', value: 0 }
  ]);

  // 3. Response Time KPI (computed average)
  const [avgResponseTime, setAvgResponseTime] = useState(240); // Initial 4m 0s in seconds

  // 4. Utilization (Active vs Idle) - Assume 24 total ambulances
  const TOTAL_AMBULANCES = 24;
  const [utilization, setUtilization] = useState({ active: 0, idle: 24, percent: 0 });

  useEffect(() => {
    // Update graph data every 3 seconds to create a shifting line graph effect
    const graphInterval = setInterval(() => {
      setGraphData(prev => {
        // Compute current load based loosely on active requests
        const activeCount = liveRequests.filter(r => r.status !== 'Completed').length;
        const baseLoad = (activeCount / 10) * 100; // if 10 requests = 100%
        // Add some noise
        const loadPoint = Math.min(100, Math.max(10, baseLoad + (Math.random() * 20 - 10)));
        
        return [...prev.slice(1), loadPoint]; // shift left
      });
    }, 3000);

    return () => clearInterval(graphInterval);
  }, [liveRequests]);

  useEffect(() => {
    // Calculate metrics based on current live requests
    const activeRequests = liveRequests.filter(r => r.status !== 'Completed');
    
    // Utilization Update
    const activeCount = activeRequests.length;
    const idleCount = Math.max(0, TOTAL_AMBULANCES - activeCount);
    const percent = Math.round((activeCount / TOTAL_AMBULANCES) * 100);
    setUtilization({ active: activeCount, idle: idleCount, percent });

    // Update bar chart based on current types
    const typesCount = { 'Cardiac Arrest': 0, 'Traffic Collision': 0, 'Fire Injury': 0, 'Other': 0 };
    activeRequests.forEach(req => {
      if (req.type === 'Cardiac Arrest') typesCount['Cardiac Arrest']++;
      else if (req.type === 'Traffic Collision') typesCount['Traffic Collision']++;
      else if (req.type === 'Fire Injury') typesCount['Fire Injury']++;
      else typesCount['Other']++;
    });

    setBarData([
      { label: 'Cardiac', value: typesCount['Cardiac Arrest'] },
      { label: 'Trauma', value: typesCount['Traffic Collision'] },
      { label: 'Fire', value: typesCount['Fire Injury'] },
      { label: 'Other', value: typesCount['Other'] }
    ]);

    // Average Response Time: purely simulated/computational
    // Critical affects time negatively (simulates higher pressure -> faster response)
    const criticalCount = activeRequests.filter(r => r.severity === 'Critical').length;
    // Base 5mins (300s). Each active request adds 10s delay. Criticals subtract 5s.
    const computedSecs = 300 + (activeCount * 10) - (criticalCount * 15);
    setAvgResponseTime(Math.max(60, computedSecs)); // min 1m

  }, [liveRequests]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}m ${secs}s`;
  };

  return {
    graphData,
    barData,
    utilization,
    avgResponseTimeStr: formatTime(avgResponseTime)
  };
};
