import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  HelpCircle,
  Command,
  Cpu,
  BarChart3,
  Copy,
  Download,
  Trash2,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
  content: string;
  timestamp: Date;
}

const HELP_TEXT = `
VULX Security Scanner CLI v2.4.0
================================

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
[*] Starting VULX Security Scan Protocol
[*] Target Payload: https://api.example.com
[*] Protocol: REST/OAuth2
[*] Engines: Titan-v4, Nuclei-SaaS

[+] Initializing encrypted sandbox...
[+] System: Ready
[+] Network: Online

[*] Phase 1: Neural Discovery
    [>] Crawling endpoints...
    [>] Vector match: 24 nodes found
    [>] Mapping OpenAPI 3.0.1...
    [>] Identity validation success

[*] Phase 2: Autonomous Injection
    [>] Running Titan-v4 deep packet analysis...
    [>] Executing cross-vector payloads...

[!] SECURITY BREACH DETECTED:
    [CRITICAL] SQL-Injection-014 at /api/v1/users/auth
    [HIGH] Auth-Bypass-992 at /api/v1/internal/admin
    [MEDIUM] Rate-Limit-Missing at /api/v1/tokens
    [LOW] Header-Exposure at /static/debug

[*] Phase 3: Binary Remastering
    [>] Calculating Risk Quantum...
    [>] Synchronizing with Dashboard...

[+] PROTOCOL COMPLETE.
    Cycle: 12.34s
    Findings: 4 total
    Threat Score: 72/100 (HIGH RISK)

Report Generated: https://app.vulx.io/scans/abc123/report
`;

export const CLITerminal: React.FC = () => {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '1',
      type: 'info',
      content: 'VULX SECURITY OPERATING SYSTEM [Version 2.4.0]',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'info',
      content: '(c) 2026 VULX Corporation. All rights reserved.',
      timestamp: new Date()
    },
    {
      id: '3',
      type: 'info',
      content: 'Type "help" to list available commands.',
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

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

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
      addLine('error', 'SYSERR: Target endpoint required');
      addLine('info', 'USAGE: scan <target> [--type quick|full]');
      return;
    }

    addLine('info', '');
    const outputLines = EXAMPLE_SCAN_OUTPUT.trim().split('\n');

    for (const line of outputLines) {
      await new Promise(resolve => setTimeout(resolve, 80));

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
        addLine('output', 'Fetching Documentation Package...');
        await new Promise(r => setTimeout(r, 400));
        HELP_TEXT.split('\n').forEach(line => addLine('output', line));
        break;

      case 'clear':
        setLines([]);
        break;

      case 'version':
        addLine('output', 'VULX Terminal Kernel: 2.4.0-stable');
        addLine('output', 'Core Engines: Titan-v4 (Proprietary), Nuclei-3.1, Schemathesis-3.21');
        break;

      case 'scan':
        setIsProcessing(true);
        await simulateScan(args);
        setIsProcessing(false);
        break;

      case 'projects':
        addLine('output', '');
        addLine('output', 'NAMESPACE                             NODES   LAST UPDATE');
        addLine('output', '─────────────────────────────────────────────────────────────');
        addLine('output', 'vulx-infra-internal                   12      01/28/2026');
        addLine('output', 'nexus-core-prod                       5       01/27/2026');
        addLine('output', '');
        break;

      case 'scans':
        addLine('output', '');
        addLine('output', 'HASH          STATUS      FINDINGS    DURATION');
        addLine('output', '──────────────────────────────────────────────');
        addLine('output', '0xabc123      COMPLETED   4           12.3s');
        addLine('output', '0xdef456      COMPLETED   1           4.1s');
        addLine('output', '');
        break;

      case 'report':
        if (!args[0]) {
          addLine('error', 'SYSERR: Scan hash required');
        } else {
          addLine('info', `Initializing Report Generation for ${args[0]}...`);
          await new Promise(resolve => setTimeout(resolve, 1200));
          addLine('success', 'Report Matrix Synthesized Successfully.');
          addLine('output', `Vector URL: https://app.vulx.io/reports/${args[0]}.pdf`);
        }
        break;

      case '':
        break;

      default:
        addLine('error', `SYSERR: Command [${command}] not recognized in current context.`);
        addLine('info', 'Input "help" for command matrix.');
    }
  }, [addLine, simulateScan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const cmd = input.trim();
    addLine('input', `> ${cmd}`);
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
    a.download = 'vulx-terminal-session.log';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-primary-400 font-black';
      case 'output': return 'text-zinc-400 font-medium';
      case 'error': return 'text-red-500 font-bold';
      case 'success': return 'text-emerald-500 font-bold';
      case 'info': return 'text-primary-300 font-bold';
      default: return 'text-zinc-500';
    }
  };

  return (
    <div className={`flex flex-col animate-fade-in ${isFullscreen ? 'fixed inset-0 z-50 bg-zinc-950 p-6' : 'h-[720px] shadow-2xl rounded-3xl overflow-hidden'}`}>
      {/* Chrome */}
      <div className="bg-zinc-900 px-6 py-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center space-x-2 text-zinc-400">
            <Command className="w-4 h-4 text-primary-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">VULX.CORE.SYS</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {[
            { icon: Copy, fn: copyToClipboard, label: 'Sync' },
            { icon: Download, fn: downloadOutput, label: 'Logs' },
            { icon: Trash2, fn: () => setLines([]), label: 'Purge' }
          ].map((action, i) => (
            <button
              key={i}
              onClick={action.fn}
              className="px-3 py-1.5 text-[10px] font-black text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all uppercase tracking-widest flex items-center gap-2"
            >
              <action.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{action.label}</span>
            </button>
          ))}
          <div className="h-4 w-px bg-zinc-800 mx-2" />
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div
        ref={terminalRef}
        onClick={handleTerminalClick}
        className="flex-1 bg-zinc-950 p-8 overflow-y-auto font-mono text-sm leading-relaxed relative"
      >
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }} />

        <div className="relative z-10 space-y-1">
          {lines.map((line) => (
            <div key={line.id} className={`${getLineColor(line.type)} whitespace-pre-wrap flex gap-3`}>
              <span className="text-zinc-800 select-none opacity-50 shrink-0">[{line.timestamp.toLocaleTimeString([], { hour12: false })}]</span>
              <span className="flex-1">{line.content}</span>
            </div>
          ))}

          {/* Prompt */}
          <form onSubmit={handleSubmit} className="flex items-center gap-3 mt-4 group">
            <span className="text-zinc-800 select-none opacity-50 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
            <span className="text-emerald-500 font-black animate-pulse">{'>'}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              className="flex-1 bg-transparent text-white outline-none font-bold placeholder:text-zinc-800"
              placeholder={isProcessing ? 'ENGINE BUSY...' : 'TYPE COMMAND...'}
              autoFocus
            />
            {isProcessing && (
              <Cpu className="w-4 h-4 text-emerald-500 animate-spin mr-2" />
            )}
          </form>
        </div>
      </div>

      {/* Footer Info Hub */}
      <div className="bg-zinc-900 px-6 py-3 flex items-center justify-between border-t border-zinc-800">
        <div className="flex items-center space-x-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Linked: US-EAST-1</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3 h-3 text-zinc-600" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Matrix: Active</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-zinc-600">
            <div className="flex gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-[9px] font-black">ENT</kbd>
              <span className="text-[9px] font-black uppercase tracking-widest">Execute</span>
            </div>
            <div className="flex gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-[9px] font-black">TAB</kbd>
              <span className="text-[9px] font-black uppercase tracking-widest">Auth</span>
            </div>
          </div>
          <button
            onClick={() => processCommand('help')}
            className="flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-lg text-primary-400 hover:bg-primary-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Doc Matrix</span>
          </button>
        </div>
      </div>
    </div>
  );
};
