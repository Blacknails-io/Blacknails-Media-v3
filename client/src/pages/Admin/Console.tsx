import { useState, useEffect, useRef } from 'react';
import type { AppEvent } from '@blacknails/shared';
import { backendEventsController } from '../../controllers/BackendEventsController';
import { Search, Pause, Play, Terminal } from 'lucide-react';
import './Console.css';

export default function Console() {
  const [logs, setLogs] = useState<AppEvent[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [consoleFilter, setConsoleFilter] = useState('');
  const [isConsolePaused, setIsConsolePaused] = useState(false);
  
  const queuedLogsRef = useRef<AppEvent[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);
  const MAX_LOGS = 1000;

  useEffect(() => {
    // 1. Initial state from cache to ensure instant hydration
    setLogs(backendEventsController.getEventHistory().sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, MAX_LOGS));

    // 2. Subscribe to new events
    const unsubscribe = backendEventsController.subscribeEvents((event) => {
      if (isConsolePaused) {
        queuedLogsRef.current.push(event);
      } else {
        setLogs(prev => {
          const newLogs = [event, ...prev].slice(0, MAX_LOGS);
          return newLogs;
        });
      }
    });
    return unsubscribe;
  }, [isConsolePaused]);

  const toggleConsolePause = () => {
    if (isConsolePaused) {
      if (queuedLogsRef.current.length > 0) {
        setLogs(prev => {
          const sortedQueued = [...queuedLogsRef.current].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
          const merged = [...sortedQueued, ...prev].slice(0, MAX_LOGS);
          return merged;
        });
        queuedLogsRef.current = [];
      }
      setIsConsolePaused(false);
    } else {
      setIsConsolePaused(true);
    }
  };

  return (
    <div className="console-container">
      <header className="console-header">
        <h1 className="console-title">
          <Terminal size={24} />
          Live Console
        </h1>
        
        <div className="console-controls">
          <select
            className="console-select"
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
          >
            <option value="ALL">Todos los Tipos</option>
            <option value="SYSTEM">Sistema</option>
            <option value="PROCESS">Proceso</option>
            <option value="DOMAIN">Dominio</option>
          </select>

          <select
            className="console-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="APPLICATION">Aplicación (SYSTEM)</option>
            <option value="DATABASE">Base de Datos (SYSTEM)</option>
            <option value="KAFKA">Kafka (SYSTEM)</option>
            <option value="AUTH">Autenticación (SYSTEM)</option>
            <option value="IMPORT">Importación (PROCESS)</option>
            <option value="INDEX">Indexación (PROCESS)</option>
            <option value="AI">IA (PROCESS)</option>
            <option value="Asset">Asset (DOMAIN)</option>
            <option value="Face">Face (DOMAIN)</option>
            <option value="MediaFile">MediaFile (DOMAIN)</option>
            <option value="Session">Session (DOMAIN)</option>
            <option value="User">User (DOMAIN)</option>
          </select>

          <select
            className="console-select"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="ALL">Todas las Acciones</option>
            <option value="STARTED">STARTED</option>
            <option value="COMPLETED">COMPLETED / FINISHED</option>
            <option value="FAILED">FAILED / ERROR</option>
            <option value="SUCCESS">SUCCESS / PROCESSED</option>
            <option value="DUPLICATED">DUPLICATED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="CREATED">CREATED</option>
            <option value="DELETED">DELETED</option>
            <option value="DETECTED">DETECTED</option>
            <option value="GROUPED">GROUPED</option>
          </select>

          <div className="console-search-wrapper">
            <Search className="console-search-icon" />
            <input
              type="text"
              className="console-search-input"
              placeholder="Filtrar texto..."
              value={consoleFilter}
              onChange={(e) => setConsoleFilter(e.target.value)}
            />
          </div>
          
          <button
            onClick={toggleConsolePause}
            className={`console-pause-btn ${isConsolePaused ? 'paused' : ''} ${isConsolePaused && queuedLogsRef.current.length > 0 ? 'has-queued' : ''}`}
          >
            {isConsolePaused ? (
              <>
                <Play size={16} /> Reanudar
              </>
            ) : (
              <>
                <Pause size={16} /> Pausar
              </>
            )}
            {isConsolePaused && queuedLogsRef.current.length > 0 && (
              <span className="console-queued-badge">
                {queuedLogsRef.current.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="console-window" ref={consoleRef}>
        {logs.length === 0 ? (
          <div className="console-empty">Esperando eventos del sistema...</div>
        ) : (
          logs.filter(log => {
            // 1. Event Type filter
            if (eventTypeFilter !== 'ALL' && log.type !== eventTypeFilter) {
              return false;
            }

            // 2. Category (subsystem/processName/entityType) filter
            if (categoryFilter !== 'ALL') {
              let logCategory = '';
              if (log.type === 'SYSTEM') {
                logCategory = (log as any).subsystem || '';
              } else if (log.type === 'DOMAIN') {
                logCategory = (log as any).entityType || '';
              } else if (log.type === 'PROCESS') {
                logCategory = (log as any).processName || '';
              }
              if (logCategory.toUpperCase() !== categoryFilter.toUpperCase()) {
                return false;
              }
            }

            // 3. Action filter
            if (actionFilter !== 'ALL') {
              const logAction = String((log as any).action || '').toUpperCase();
              if (logAction !== actionFilter.toUpperCase()) {
                if (actionFilter === 'COMPLETED' && logAction === 'FINISHED') {
                  // allow
                } else if (actionFilter === 'SUCCESS' && logAction === 'PROCESSED') {
                  // allow
                } else if (actionFilter === 'FAILED' && logAction === 'ERROR') {
                  // allow
                } else {
                  return false;
                }
              }
            }

            // 4. Free text search filter
            if (!consoleFilter) return true;
            const term = consoleFilter.toLowerCase();
            const msg = String(log?.message || '').toLowerCase();
            const src = String((log as any)?.source || (log as any)?.subsystem || (log as any)?.processName || '').toLowerCase();
            return msg.includes(term) || src.includes(term);
          })
          .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
          .map((log) => {
            const typeTag = log.type;
            let subTag = '';
            if (log.type === 'SYSTEM') {
              subTag = String((log as any).subsystem || '').toUpperCase();
            } else if (log.type === 'DOMAIN') {
              subTag = String((log as any).entityType || '').toUpperCase();
            } else if (log.type === 'PROCESS') {
              subTag = String((log as any).processName || '').toUpperCase();
            }
            const actionTag = String((log as any).action || '').toUpperCase();

            const action = String((log as any)?.action || '').toLowerCase();
            const status = String((log as any)?.status || '').toLowerCase();
            const lowerMsg = String(log?.message || '').toLowerCase();

            const tagTypeClass = 'type-neutral';

            // Action and Message color
            let actionClass = 'action-default';
            let msgClass = 'msg-default';
            if (action === 'error' || status === 'error' || lowerMsg.includes('error') || lowerMsg.includes('falló')) {
              actionClass = 'action-error';
              msgClass = 'msg-error';
            } else if (
              action === 'success' ||
              status === 'processed' ||
              action === 'completed' ||
              status === 'completed' ||
              action === 'connected' ||
              action === 'login' ||
              action === 'detected' ||
              action === 'grouped' ||
              action === 'created'
            ) {
              actionClass = 'action-success';
              msgClass = 'msg-success';
            } else if (action === 'started' || action === 'startup' || status === 'running') {
              actionClass = 'action-info';
              msgClass = 'msg-info';
            } else if (
              action === 'duplicated' ||
              action === 'rejected' ||
              lowerMsg.includes('duplicado') ||
              lowerMsg.includes('saltado') ||
              lowerMsg.includes('rechazado')
            ) {
              actionClass = 'action-warning';
              msgClass = 'msg-warning';
            }

            return (
              <div key={log.id} className="console-log-entry">
                <span className="console-timestamp">
                  [{new Date(log.occurredAt).toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                </span>
                
                <div className="console-tags">
                  <span className={`console-tag ${tagTypeClass}`}>{typeTag}</span>
                  {subTag && <span className={`console-tag ${tagTypeClass}`}>{subTag}</span>}
                  {actionTag && <span className={`console-tag ${actionClass}`}>{actionTag}</span>}
                </div>

                <span className={`console-message ${msgClass}`}>
                  {String(log?.message || '').replace(/^\[.*?\]\s*/, '')}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
