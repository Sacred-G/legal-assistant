import React, { useState, useRef, useEffect } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { sendSystemMessage } from '../config/api';

const SystemAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const terminalRef = useRef(null);
  const terminalInstanceRef = useRef(null);
  const fitAddonRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [terminalInput, setTerminalInput] = useState('');

  useEffect(() => {
    // Initialize terminal
    if (terminalRef.current && !terminalInstanceRef.current) {
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
        lineHeight: 1.5,
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          selection: '#264f78',
          black: '#1e1e1e',
          red: '#f44747',
          green: '#6a9955',
          yellow: '#d7ba7d',
          blue: '#569cd6',
          magenta: '#c586c0',
          cyan: '#4dc9b0',
          white: '#d4d4d4',
          brightBlack: '#808080',
          brightRed: '#f44747',
          brightGreen: '#6a9955',
          brightYellow: '#d7ba7d',
          brightBlue: '#569cd6',
          brightMagenta: '#c586c0',
          brightCyan: '#4dc9b0',
          brightWhite: '#d4d4d4'
        }
      });

      fitAddonRef.current = new FitAddon();
      term.loadAddon(fitAddonRef.current);
      term.open(terminalRef.current);
      fitAddonRef.current.fit();

      // Welcome message
      term.writeln('System Assistant Terminal ready...');
      term.write('\r\n$ ');

      // Handle terminal input
      let currentLine = '';
      term.onKey(({ key, domEvent }) => {
        const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

        if (domEvent.keyCode === 13) { // Enter
          term.write('\r\n');
          if (currentLine.trim()) {
            handleTerminalCommand(currentLine);
          }
          currentLine = '';
          term.write('$ ');
        } else if (domEvent.keyCode === 8) { // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            term.write('\b \b');
          }
        } else if (printable) {
          currentLine += key;
          term.write(key);
        }
      });

      terminalInstanceRef.current = term;
    }

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage = {
      role: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendSystemMessage(inputValue);
      
      const assistantMessage = {
        role: 'assistant',
        content: response
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const exampleCommands = [
    {
      category: 'System Operations',
      commands: [
        {
          title: 'System Status',
          command: 'status',
          description: 'Check system status and health'
        },
        {
          title: 'List Services',
          command: 'services list',
          description: 'List all running services'
        },
        {
          title: 'Monitor Resources',
          command: 'monitor resources',
          description: 'Monitor system resources'
        }
      ]
    },
    {
      category: 'Process Management',
      commands: [
        {
          title: 'List Processes',
          command: 'ps list',
          description: 'List all running processes'
        },
        {
          title: 'Process Details',
          command: 'ps info <pid>',
          description: 'Get detailed process information'
        },
        {
          title: 'Kill Process',
          command: 'ps kill <pid>',
          description: 'Terminate a process'
        }
      ]
    },
    {
      category: 'Configuration',
      commands: [
        {
          title: 'View Config',
          command: 'config view',
          description: 'View system configuration'
        },
        {
          title: 'Update Config',
          command: 'config update <key> <value>',
          description: 'Update configuration setting'
        },
        {
          title: 'Reset Config',
          command: 'config reset',
          description: 'Reset to default configuration'
        }
      ]
    }
  ];

  const handleTerminalCommand = async (command) => {
    try {
      const { data } = await sendSystemMessage(command);
      
      if (data.output) {
        terminalInstanceRef.current?.writeln(data.output);
      }
      if (data.error) {
        terminalInstanceRef.current?.writeln('\x1b[31m' + data.error + '\x1b[0m');
      }
    } catch (error) {
      terminalInstanceRef.current?.writeln('\x1b[31mError executing command: ' + error.message + '\x1b[0m');
    }
    terminalInstanceRef.current?.write('\r\n$ ');
  };

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Examples Sidebar */}
      <div className="w-1/5 bg-gray-900 text-gray-300 overflow-y-auto border-r border-gray-700">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4 text-white">System Commands</h2>
          {exampleCommands.map((category, i) => (
            <div key={i} className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-400">{category.category}</h3>
              <div className="space-y-3">
                {category.commands.map((cmd, j) => (
                  <div 
                    key={j} 
                    className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 cursor-pointer"
                    onClick={() => setInputValue(cmd.command)}
                  >
                    <div className="font-medium text-white mb-1">{cmd.title}</div>
                    <div className="text-sm text-gray-400 mb-2">{cmd.description}</div>
                    <code className="block bg-gray-900 p-2 rounded text-sm text-green-400">
                      {cmd.command.replace(/```bash\n|\n```/g, '')}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="w-[45%] flex flex-col bg-gray-800 border-r border-gray-700">
        <div className="bg-gray-900 p-3 border-b border-gray-700">
          <h3 className="text-gray-200 font-medium">System Assistant</h3>
        </div>
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-4 rounded-lg max-w-[85%] shadow-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white font-medium'
                    : message.role === 'error'
                    ? 'bg-red-500 text-white font-medium'
                    : 'bg-gray-900 text-gray-100 border border-gray-700'
                } ${
                  message.role === 'assistant' ? 'font-mono text-sm whitespace-pre-wrap' : ''
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-4 border-t border-gray-700 bg-gray-900">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter system command or click an example..."
              className="flex-1 p-3 bg-gray-800 text-gray-100 border border-gray-600 rounded-l focus:outline-none focus:border-blue-500 placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className={`px-6 py-3 bg-blue-600 text-white rounded-r font-medium hover:bg-blue-700 focus:outline-none transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Send'}
            </button>
          </div>
        </form>
      </div>

      {/* Terminal Panel */}
      <div className="w-[35%] bg-[#1e1e1e] flex flex-col">
        <div className="bg-[#2d2d2d] p-3 border-b border-gray-700">
          <h3 className="text-gray-300 font-medium flex items-center">
            <span className="mr-2">⌘</span>
            System Terminal
          </h3>
        </div>
        <div className="flex-1 p-2 overflow-hidden" ref={terminalRef} />
      </div>
    </div>
  );
};

export default SystemAssistant;
