import { Play, Pause, RefreshCw, Cpu, Server } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Admin() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkers = async () => {
    try {
      const res = await fetch('/api/admin/pipeline/workers');
      if (res.ok) {
        setWorkers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (workerId: string, action: string) => {
    await fetch(`/api/admin/pipeline/workers/${workerId}/${action}`, { method: 'POST' });
    fetchWorkers();
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Administration & Jobs</h1>

      {/* System Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-full)', color: 'var(--accent-primary)' }}>
            <Server size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Job Engines</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{workers.length} Workers</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: 'var(--radius-full)', color: 'var(--accent-secondary)' }}>
            <Cpu size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Global Status</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {workers.some(w => w.isRunning) ? 'Processing' : 'Idle'}
            </div>
          </div>
        </div>
      </div>

      {/* Job Queues */}
      <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Job Queues (Workers)</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div>Loading workers...</div>
        ) : (
          workers.map(worker => (
            <JobCard 
              key={worker.id} 
              worker={worker} 
              onAction={handleAction} 
            />
          ))
        )}
      </div>
    </div>
  );
}

function JobCard({ worker, onAction }: { worker: any, onAction: (id: string, action: string) => void }) {
  const isRunning = worker.isRunning;
  const title = worker.label;
  const status = isRunning ? 'Running' : 'Idle';
  const backlog = worker.pendingItems || 0;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h3>
          <span style={{ fontSize: '0.85rem', color: isRunning ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
            {status} • Backlog: {backlog} items
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isRunning ? (
            <button className="btn-ghost" onClick={() => onAction(worker.id, 'stop')} style={{ padding: '0.5rem' }}><Pause size={18} /></button>
          ) : (
            <button className="btn-ghost" onClick={() => onAction(worker.id, 'start')} style={{ padding: '0.5rem' }}><Play size={18} /></button>
          )}
          <button className="btn-ghost" onClick={() => onAction(worker.id, 'reset')} style={{ padding: '0.5rem' }}><RefreshCw size={18} /></button>
        </div>
      </div>
      
      {backlog > 0 && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${isRunning ? '50%' : '5%'}` }}></div>
        </div>
      )}
    </div>
  );
}
