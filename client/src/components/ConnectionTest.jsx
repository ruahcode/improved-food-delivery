import { useState, useEffect } from 'react';
import { env } from '../config/env.js';

const ConnectionTest = () => {
  const [status, setStatus] = useState('testing');
  const [results, setResults] = useState({});

  useEffect(() => {
    const testConnections = async () => {
      const tests = {
        backend: testBackend,
        proxy: testProxy,
        cors: testCors
      };

      const results = {};
      
      for (const [name, test] of Object.entries(tests)) {
        try {
          const result = await test();
          results[name] = { success: true, ...result };
        } catch (error) {
          results[name] = { success: false, error: error.message };
        }
      }

      setResults(results);
      setStatus('complete');
    };

    testConnections();
  }, []);

  const testBackend = async () => {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    return { status: response.status, data };
  };

  const testProxy = async () => {
    const response = await fetch('/api/health');
    const data = await response.json();
    return { status: response.status, data };
  };

  const testCors = async () => {
    const response = await fetch(env.apiBaseUrl.replace('/api', '') + '/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    const data = await response.json();
    return { status: response.status, data };
  };

  if (status === 'testing') {
    return <div className="p-4">Testing connections...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Connection Test Results</h2>
      
      <div className="space-y-4">
        {Object.entries(results).map(([name, result]) => (
          <div key={name} className={`p-4 rounded border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h3 className="font-semibold capitalize">{name} Connection</h3>
            <p className={result.success ? 'text-green-600' : 'text-red-600'}>
              {result.success ? '✓ Success' : '✗ Failed'}
            </p>
            {result.error && (
              <p className="text-red-500 text-sm mt-1">Error: {result.error}</p>
            )}
            {result.data && (
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold">Environment Info</h3>
        <ul className="text-sm mt-2 space-y-1">
          <li><strong>API Base URL:</strong> {env.apiBaseUrl}</li>
          <li><strong>Mode:</strong> {env.nodeEnv}</li>
          <li><strong>Debug:</strong> {env.debugMode ? 'Enabled' : 'Disabled'}</li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectionTest;