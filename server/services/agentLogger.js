// In-memory logger buffer for live agent telemetry & debugging
const logs = [
  {
    id: 'log-init',
    timestamp: new Date().toISOString(),
    agent: 'SYSTEM',
    level: 'info',
    message: '🚀 Multi-Agent Telemetry Engine initialized. All 4 agents ready.',
    details: null,
  }
];

function addLog(agent, message, level = 'info', details = null) {
  const logItem = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    agent, // 'LEAD_AGENT' | 'MESSAGING_AGENT' | 'EMAIL_AGENT' | 'REPLY_AGENT' | 'SYSTEM'
    level, // 'info' | 'warn' | 'error' | 'success' | 'hil_waiting'
    message,
    details,
  };
  logs.unshift(logItem);
  if (logs.length > 100) {
    logs.pop();
  }
  return logItem;
}

function getLogs() {
  return logs;
}

function clearLogs() {
  logs.length = 0;
  addLog('SYSTEM', 'Log buffer cleared.');
}

module.exports = {
  addLog,
  getLogs,
  clearLogs,
};
