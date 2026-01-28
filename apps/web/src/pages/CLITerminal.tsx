
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Terminal,
  Maximize2,
  Minimize2,
  Copy,
  Download,
  Trash2,
  HelpCircle
} from 'lucide-react';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
  content: string;
  timestamp: Date;
}

const HELP_TEXT = `
VULX Security Scanner CLI
=========================

Available Commands:
  scan <target>         Start a scan on the specified target
    --type <type>       Scan type: quick, standard, full (default: standard)
    --spec <url>        OpenAPI specification URL
    --auth <method>     Auth method: bearer, basic, apikey, oauth2
    --token <token>     Bearer token or API key value

  projects              List all projects
  project <id>          Show project details

  scans                 List recent scans
  scan-status <id>      Check scan status
  scan-results <id>     View scan results

  report <scan-id>      Generate a report
    --format <fmt>      Report format: pdf, json, html (default: pdf)
    --framework <fw>    Compliance framework: soc2, pci_dss, hipaa, gdpr

  auth                  Show authentication methods
  config                Show current configuration
  version               Show CLI version

  clear                 Clear terminal
  help                  Show this help message

Examples:
  vulx scan https://api.example.com
  vulx scan https://api.example.com --type full --spec https://api.example.com/openapi.json
  vulx scan https://api.example.com --auth bearer --token eyJhbGciOiJIUzI1...
  vulx report abc123 --format pdf --framework soc2
`;

const EXAMPLE_SCAN_OUTPUT = `
[*] Starting VULX Security Scan
[*] Target: https://api.example.com
[*] Scan Type: standard
[*] Engines: ZAP, Nuclei

[+] Initializing scan engines...
[+] ZAP: Ready
[+] Nuclei: Ready

[*] Phase 1: Discovery
    [>] Crawling target...
    [>] Found 24 endpoints
    [>] Parsing OpenAPI specification...
    [>] Identified 8 API resources

[*] Phase 2: Active Scanning
    [>] Running Nuclei templates...
    [>] Running ZAP active scan...

[!] Vulnerabilities Found:
    [CRITICAL] SQL Injection in /api/users/{id}
    [HIGH] Broken Authentication at /api/auth/login
    [MEDIUM] Missing Rate Limiting on /api/users
    [LOW] Information Disclosure in error responses

[*] Phase 3: Generating Report
    [>] Mapping to OWASP API Top 10
    [>] Calculating risk score

[+] Scan Complete!
    Duration: 12m 34s
    Findings: 4 (1 Critical, 1 High, 1 Medium, 1 Low)
    Risk Score: 72/100

Report: https://app.vulx.io/scans/abc123/report
`;

export const CLITerminal: React.FC = () => {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '1',
      type: 'info',
      content: 'VULX Security Scanner v1.0.0',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'info',
      content: 'Type "help" for available commands',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input on click
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const addLine = useCallback((type: TerminalLine['type'], content: string) => {
    setLines(prev => [...prev, {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }]);
  }, []);

  const simulateScan = useCallback(async (args: string[]) => {
    const target = args[0];
    if (!target) {
      addLine('error', 'Error: Target URL required');
      addLine('info', 'Usage: scan <target-url> [options]');
      return;
    }

    addLine('info', '');
    const outputLines = EXAMPLE_SCAN_OUTPUT.trim().split('\n');

    for (const line of outputLines) {
      await new Promise(resolve => setTimeout(resolve, 100));

      let type: TerminalLine['type'] = 'output';
      if (line.startsWith('[!]') || line.includes('[CRITICAL]') || line.includes('[HIGH]')) {
        type = 'error';
      } else if (line.startsWith('[+]')) {
        type = 'success';
      } else if (line.startsWith('[*]') || line.startsWith('    [>]')) {
        type = 'info';
      }

      addLine(type, line);
    }
  }, [addLine]);

  const processCommand = useCallback(async (cmd: string) => {
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        HELP_TEXT.split('\n').forEach(line => addLine('output', line));
        break;

      case 'clear':
        setLines([]);
        break;

      case 'version':
        addLine('output', 'VULX Security Scanner v1.0.0');
        addLine('output', 'Engines: ZAP 2.14.0, Nuclei 3.1.0, Schemathesis 3.21.0');
        break;

      case 'scan':
        setIsProcessing(true);
        await simulateScan(args);
        setIsProcessing(false);
        break;

      case 'projects':
        addLine('output', '');
        addLine('output', 'ID                                    NAME               SCANS   LAST SCAN');
        addLine('output', '─────────────────────────────────────────────────────────────────────────');
        addLine('output', 'proj_1234567890                       My API             12      2 hours ago');
        addLine('output', 'proj_0987654321                       Payment Service    5       1 day ago');
        addLine('output', 'proj_abcdef1234                       User API           8       3 days ago');
        addLine('output', '');
        break;

      case 'scans':
        addLine('output', '');
        addLine('output', 'ID            STATUS      TYPE        FINDINGS    STARTED');
        addLine('output', '────────────────────────────────────────────────────────────');
        addLine('output', 'scan_abc123   COMPLETED   standard    4           2h ago');
        addLine('output', 'scan_def456   COMPLETED   quick       1           1d ago');
        addLine('output', 'scan_ghi789   FAILED      full        -           2d ago');
        addLine('output', '');
        break;

      case 'auth':
        addLine('output', '');
        addLine('output', 'Supported Authentication Methods:');
        addLine('output', '');
        addLine('output', '  bearer    - Bearer token authentication');
        addLine('output', '             --token <jwt-token>');
        addLine('output', '');
        addLine('output', '  basic     - Basic HTTP authentication');
        addLine('output', '             --username <user> --password <pass>');
        addLine('output', '');
        addLine('output', '  apikey    - API Key authentication');
        addLine('output', '             --header <header-name> --token <api-key>');
        addLine('output', '');
        addLine('output', '  oauth2    - OAuth2 client credentials');
        addLine('output', '             --client-id <id> --client-secret <secret>');
        addLine('output', '             --token-url <url> --scope <scope>');
        addLine('output', '');
        break;

      case 'config':
        addLine('output', '');
        addLine('output', 'Current Configuration:');
        addLine('output', '  API URL:     https://api.vulx.io');
        addLine('output', '  API Key:     ****...****');
        addLine('output', '  Default Org: org_1234567890');
        addLine('output', '');
        break;

      case 'report':
        if (!args[0]) {
          addLine('error', 'Error: Scan ID required');
          addLine('info', 'Usage: report <scan-id> [--format pdf|json|html] [--framework soc2|pci_dss|hipaa|gdpr]');
        } else {
          addLine('info', `Generating report for scan ${args[0]}...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
          addLine('success', 'Report generated successfully!');
          addLine('output', `Download: https://app.vulx.io/reports/${args[0]}.pdf`);
        }
        break;

      case '':
        break;

      default:
        addLine('error', `Command not found: ${command}`);
        addLine('info', 'Type "help" for available commands');
    }
  }, [addLine, simulateScan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const cmd = input.trim();
    addLine('input', `$ vulx ${cmd}`);
    setHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setInput('');

    await processCommand(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const copyToClipboard = () => {
    const text = lines.map(l => l.content).join('\n');
    navigator.clipboard.writeText(text);
  };

  const downloadOutput = () => {
    const text = lines.map(l => l.content).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vulx-terminal-output.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-industrial-base';
      case 'output': return 'text-gray-300';
      case 'error': return 'text-severity-critical';
      case 'success': return 'text-severity-success';
      case 'info': return 'text-severity-medium';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[600px]'}`}>
      {/* Header */}
      <div className="bg-industrial-surface-hover px-4 py-2 flex items-center justify-between rounded-t-lg border-b border-black/20">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-severity-critical" />
            <div className="w-3 h-3 rounded-full bg-severity-high" />
            <div className="w-3 h-3 rounded-full bg-severity-success" />
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <Terminal className="w-4 h-4" />
            <span className="text-sm font-medium">VULX Terminal</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={copyToClipboard}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded"
            title="Copy output"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={downloadOutput}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded"
            title="Download output"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLines([])}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded"
            title="Clear terminal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={terminalRef}
        onClick={handleTerminalClick}
        className={`flex-1 bg-industrial-surface p-4 overflow-y-auto font-mono text-sm ${isFullscreen ? '' : 'rounded-b-lg'
          }`}
        style={{ minHeight: '400px' }}
      >
        {lines.map((line) => (
          <div key={line.id} className={`${getLineColor(line.type)} whitespace-pre-wrap`}>
            {line.content}
          </div>
        ))}

        {/* Input Line */}
        <form onSubmit={handleSubmit} className="flex items-center mt-1">
          <span className="text-green-400">$ vulx </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            className="flex-1 bg-transparent text-gray-300 outline-none ml-1"
            placeholder={isProcessing ? 'Processing...' : ''}
            autoFocus
          />
          {isProcessing && (
            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin ml-2" />
          )}
        </form>
      </div>

      {/* Help Bar */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-400 rounded-b-lg border-t border-gray-700">
        <div className="flex items-center space-x-4">
          <span>Press <kbd className="px-1 py-0.5 bg-gray-700 rounded">Enter</kbd> to execute</span>
          <span><kbd className="px-1 py-0.5 bg-gray-700 rounded">↑</kbd> / <kbd className="px-1 py-0.5 bg-gray-700 rounded">↓</kbd> for history</span>
        </div>
        <button
          onClick={() => processCommand('help')}
          className="flex items-center space-x-1 hover:text-white"
        >
          <HelpCircle className="w-3 h-3" />
          <span>Help</span>
        </button>
      </div>
    </div>
  );
};
