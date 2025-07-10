'use client';

import { useState } from 'react';

export default function SynchronisationButtons() {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string | null>(null);

  const sync = async (direction: 'remote_to_local' | 'local_to_remote') => {
    setLoading(true);
    setLog(null);

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });

      const data = await res.json();

      if (data.success) {
        setLog(data.message || '✅ Synchronisation terminée avec succès.');
      } else {
        setLog(data.error || '❌ Échec de la synchronisation.');
      }
    } catch (err) {
      setLog('❌ Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded-xl space-y-4 w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800">Synchronisation des données</h2>

      <div className="flex gap-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={() => sync('remote_to_local')}
          disabled={loading}
        >
          🔄 Render ➝ Local
        </button>

        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          onClick={() => sync('local_to_remote')}
          disabled={loading}
        >
          🔼 Local ➝ Render
        </button>
      </div>

      {loading && (
        <div className="text-yellow-600 space-y-1">
          <p>⏳ Synchronisation en cours...</p>
          <p className="text-sm italic">
            Cette opération peut prendre quelques minutes. Merci de patienter...
          </p>
        </div>
      )}

      {log && (
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto max-h-64 text-gray-800">
          {log}
        </pre>
      )}
    </div>
  );
}
