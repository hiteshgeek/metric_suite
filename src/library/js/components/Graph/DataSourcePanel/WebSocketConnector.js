/**
 * WebSocketConnector - Connect to WebSocket endpoints for real-time data
 */

import { createElement } from '../utils.js';

export default class WebSocketConnector {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onDataLoaded: null,
      onDataUpdate: null, // For incremental updates
      onError: null,
      onConnectionChange: null,
      ...options,
    };

    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.reconnectTimer = null;
    this.data = [];
    this.columns = [];

    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = '';
    this.container.className = 'ms-websocket-connector';

    this.container.innerHTML = `
      <div class="ms-ws-form">
        <div class="ms-form-group">
          <label class="ms-label">WebSocket URL</label>
          <input type="text" class="ms-input ms-ws-url" placeholder="wss://example.com/stream" />
        </div>

        <div class="ms-ws-advanced-toggle">
          <button class="ms-btn ms-btn-text ms-toggle-advanced">
            <i class="fas fa-cog"></i> Advanced Options
          </button>
        </div>

        <div class="ms-ws-advanced hidden">
          <div class="ms-form-group">
            <label class="ms-label">Authentication Message (JSON)</label>
            <textarea class="ms-textarea ms-ws-auth" rows="2" placeholder='{"type": "auth", "token": "..."}'></textarea>
            <span class="ms-hint">Sent immediately after connection</span>
          </div>

          <div class="ms-form-group">
            <label class="ms-label">Subscribe Message (JSON)</label>
            <textarea class="ms-textarea ms-ws-subscribe" rows="2" placeholder='{"type": "subscribe", "channel": "..."}'></textarea>
            <span class="ms-hint">Sent after authentication</span>
          </div>

          <div class="ms-form-group">
            <label class="ms-label">Data Path</label>
            <input type="text" class="ms-input ms-ws-datapath" placeholder="data" />
            <span class="ms-hint">Path to data in incoming messages</span>
          </div>

          <div class="ms-form-row">
            <div class="ms-form-group ms-form-group-half">
              <label class="ms-label">Update Mode</label>
              <select class="ms-select ms-ws-mode">
                <option value="replace">Replace All</option>
                <option value="append">Append New</option>
                <option value="prepend">Prepend New</option>
                <option value="merge">Merge by ID</option>
              </select>
            </div>
            <div class="ms-form-group ms-form-group-half">
              <label class="ms-label">Max Records</label>
              <input type="number" class="ms-input ms-ws-maxrecords" placeholder="1000" value="1000" min="10" />
            </div>
          </div>

          <div class="ms-form-group">
            <label class="ms-label">ID Field (for merge mode)</label>
            <input type="text" class="ms-input ms-ws-idfield" placeholder="id" />
          </div>

          <div class="ms-form-group">
            <label class="ms-checkbox">
              <input type="checkbox" class="ms-ws-autoreconnect" checked />
              <span>Auto-reconnect on disconnect</span>
            </label>
          </div>
        </div>

        <div class="ms-ws-actions">
          <button class="ms-btn ms-btn-primary ms-connect-btn">
            <i class="fas fa-plug"></i> Connect
          </button>
          <button class="ms-btn ms-btn-danger ms-disconnect-btn hidden">
            <i class="fas fa-times"></i> Disconnect
          </button>
        </div>
      </div>

      <div class="ms-ws-status">
        <div class="ms-ws-status-indicator disconnected"></div>
        <span class="ms-ws-status-text">Disconnected</span>
      </div>

      <div class="ms-ws-stats hidden">
        <div class="ms-ws-stat">
          <span class="ms-ws-stat-label">Messages</span>
          <span class="ms-ws-stat-value ms-ws-msg-count">0</span>
        </div>
        <div class="ms-ws-stat">
          <span class="ms-ws-stat-label">Records</span>
          <span class="ms-ws-stat-value ms-ws-record-count">0</span>
        </div>
        <div class="ms-ws-stat">
          <span class="ms-ws-stat-label">Last Update</span>
          <span class="ms-ws-stat-value ms-ws-last-update">-</span>
        </div>
      </div>

      <div class="ms-ws-log hidden">
        <div class="ms-ws-log-header">
          <span>Connection Log</span>
          <button class="ms-btn ms-btn-icon ms-clear-log" title="Clear log">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div class="ms-ws-log-content"></div>
      </div>
    `;
  }

  attachEventListeners() {
    // Toggle advanced options
    this.container.querySelector('.ms-toggle-advanced').addEventListener('click', () => {
      this.container.querySelector('.ms-ws-advanced').classList.toggle('hidden');
    });

    // Connect button
    this.container.querySelector('.ms-connect-btn').addEventListener('click', () => {
      this.connect();
    });

    // Disconnect button
    this.container.querySelector('.ms-disconnect-btn').addEventListener('click', () => {
      this.disconnect();
    });

    // Clear log
    this.container.querySelector('.ms-clear-log').addEventListener('click', () => {
      this.container.querySelector('.ms-ws-log-content').innerHTML = '';
    });

    // Enter key on URL
    this.container.querySelector('.ms-ws-url').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.connect();
      }
    });
  }

  connect() {
    const url = this.container.querySelector('.ms-ws-url').value.trim();
    if (!url) {
      this.log('error', 'Please enter a WebSocket URL');
      return;
    }

    // Validate URL
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      this.log('error', 'URL must start with ws:// or wss://');
      return;
    }

    this.setStatus('connecting');
    this.log('info', `Connecting to ${url}...`);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (e) => this.handleMessage(e);
      this.ws.onerror = (e) => this.handleError(e);
      this.ws.onclose = (e) => this.handleClose(e);

    } catch (error) {
      this.log('error', `Connection failed: ${error.message}`);
      this.setStatus('disconnected');
    }
  }

  handleOpen() {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.setStatus('connected');
    this.log('success', 'Connected successfully');

    // Show stats
    this.container.querySelector('.ms-ws-stats').classList.remove('hidden');
    this.container.querySelector('.ms-ws-log').classList.remove('hidden');

    // Send auth message if provided
    const authMsg = this.container.querySelector('.ms-ws-auth').value.trim();
    if (authMsg) {
      try {
        this.ws.send(authMsg);
        this.log('info', 'Sent authentication message');
      } catch (e) {
        this.log('error', 'Failed to send auth message');
      }
    }

    // Send subscribe message if provided
    const subscribeMsg = this.container.querySelector('.ms-ws-subscribe').value.trim();
    if (subscribeMsg) {
      setTimeout(() => {
        try {
          this.ws.send(subscribeMsg);
          this.log('info', 'Sent subscribe message');
        } catch (e) {
          this.log('error', 'Failed to send subscribe message');
        }
      }, 100);
    }

    if (this.options.onConnectionChange) {
      this.options.onConnectionChange(true);
    }
  }

  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      const dataPath = this.container.querySelector('.ms-ws-datapath').value.trim();
      const mode = this.container.querySelector('.ms-ws-mode').value;
      const maxRecords = parseInt(this.container.querySelector('.ms-ws-maxrecords').value) || 1000;
      const idField = this.container.querySelector('.ms-ws-idfield').value.trim() || 'id';

      // Extract data from message
      let newData = message;
      if (dataPath) {
        const parts = dataPath.split('.');
        for (const part of parts) {
          if (newData && typeof newData === 'object') {
            newData = newData[part];
          }
        }
      }

      // Ensure array
      if (!Array.isArray(newData)) {
        newData = [newData];
      }

      // Update data based on mode
      switch (mode) {
        case 'replace':
          this.data = newData;
          break;
        case 'append':
          this.data = [...this.data, ...newData].slice(-maxRecords);
          break;
        case 'prepend':
          this.data = [...newData, ...this.data].slice(0, maxRecords);
          break;
        case 'merge':
          // Merge by ID field
          const dataMap = new Map(this.data.map(item => [item[idField], item]));
          newData.forEach(item => {
            dataMap.set(item[idField], item);
          });
          this.data = Array.from(dataMap.values()).slice(-maxRecords);
          break;
      }

      // Extract columns from first record
      if (this.data.length > 0) {
        this.columns = Object.keys(this.data[0]);
      }

      // Update stats
      this.updateStats();

      // Notify callbacks
      if (mode === 'replace') {
        if (this.options.onDataLoaded) {
          this.options.onDataLoaded(this.data, this.columns);
        }
      } else {
        if (this.options.onDataUpdate) {
          this.options.onDataUpdate(this.data, this.columns, newData);
        } else if (this.options.onDataLoaded) {
          this.options.onDataLoaded(this.data, this.columns);
        }
      }

    } catch (error) {
      this.log('error', `Failed to parse message: ${error.message}`);
    }
  }

  handleError(error) {
    this.log('error', 'Connection error');
    if (this.options.onError) {
      this.options.onError(error);
    }
  }

  handleClose(event) {
    this.isConnected = false;
    this.setStatus('disconnected');

    const reason = event.reason || 'Connection closed';
    this.log('info', `Disconnected: ${reason} (code: ${event.code})`);

    if (this.options.onConnectionChange) {
      this.options.onConnectionChange(false);
    }

    // Auto-reconnect
    const autoReconnect = this.container.querySelector('.ms-ws-autoreconnect').checked;
    if (autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts && event.code !== 1000) {
      this.reconnectAttempts++;
      this.log('info', `Reconnecting in ${this.reconnectDelay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }

    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    this.setStatus('disconnected');
    this.log('info', 'Disconnected by user');
  }

  setStatus(status) {
    const indicator = this.container.querySelector('.ms-ws-status-indicator');
    const text = this.container.querySelector('.ms-ws-status-text');
    const connectBtn = this.container.querySelector('.ms-connect-btn');
    const disconnectBtn = this.container.querySelector('.ms-disconnect-btn');

    indicator.className = 'ms-ws-status-indicator ' + status;

    switch (status) {
      case 'connected':
        text.textContent = 'Connected';
        connectBtn.classList.add('hidden');
        disconnectBtn.classList.remove('hidden');
        break;
      case 'connecting':
        text.textContent = 'Connecting...';
        connectBtn.disabled = true;
        break;
      case 'disconnected':
      default:
        text.textContent = 'Disconnected';
        connectBtn.classList.remove('hidden');
        connectBtn.disabled = false;
        disconnectBtn.classList.add('hidden');
        break;
    }
  }

  updateStats() {
    const msgCount = this.container.querySelector('.ms-ws-msg-count');
    const recordCount = this.container.querySelector('.ms-ws-record-count');
    const lastUpdate = this.container.querySelector('.ms-ws-last-update');

    const currentCount = parseInt(msgCount.textContent) || 0;
    msgCount.textContent = currentCount + 1;
    recordCount.textContent = this.data.length;
    lastUpdate.textContent = new Date().toLocaleTimeString();
  }

  log(type, message) {
    const logContent = this.container.querySelector('.ms-ws-log-content');
    const logContainer = this.container.querySelector('.ms-ws-log');

    // Show log container
    logContainer.classList.remove('hidden');

    const entry = createElement('div', { className: `ms-ws-log-entry ms-ws-log-${type}` });

    const time = new Date().toLocaleTimeString();
    const icon = type === 'error' ? 'fa-exclamation-circle' :
                 type === 'success' ? 'fa-check-circle' : 'fa-info-circle';

    entry.innerHTML = `
      <span class="ms-ws-log-time">${time}</span>
      <i class="fas ${icon}"></i>
      <span class="ms-ws-log-message">${message}</span>
    `;

    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;

    // Keep only last 50 entries
    while (logContent.children.length > 50) {
      logContent.removeChild(logContent.firstChild);
    }
  }

  /**
   * Send a message through the WebSocket
   */
  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log('error', 'Not connected');
      return false;
    }

    try {
      const msg = typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(msg);
      return true;
    } catch (error) {
      this.log('error', `Failed to send: ${error.message}`);
      return false;
    }
  }

  /**
   * Get current data
   */
  getData() {
    return {
      data: this.data,
      columns: this.columns,
      isConnected: this.isConnected,
    };
  }

  destroy() {
    this.disconnect();
    this.container.innerHTML = '';
  }
}
