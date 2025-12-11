/**
 * Unified Query Engine
 * Handles data fetching and transformation for all widget types
 */

import { deepMerge } from '../Graph/utils.js';

/**
 * Query configuration schema
 */
export const DEFAULT_QUERY_CONFIG = {
  // Data source type
  sourceType: 'sql', // sql, api, static, websocket

  // Source URL or connection info
  source: null,

  // SQL query (for sql sourceType)
  rawQuery: '',

  // Visual query builder state (alternative to rawQuery)
  query: {
    select: [],
    from: '',
    where: [],
    groupBy: [],
    orderBy: [],
    limit: null,
  },

  // Result mapping
  mapping: {
    // Counter mappings
    value: null,
    label: null,
    previousValue: null,
    sparklineData: null,
    currentValue: null,
    targetValue: null,

    // List mappings
    text: null,
    meta: null,
    items: null,
    groups: null,

    // Table mappings
    columns: 'auto', // auto-detect or explicit
    data: null,
  },

  // Data transformations
  transforms: [],

  // Refresh settings
  refresh: {
    enabled: false,
    interval: 30000,
  },

  // Caching
  cache: {
    enabled: false,
    ttl: 60000, // 1 minute
  },
};

/**
 * Query Engine class
 */
export class QueryEngine {
  constructor(config = {}) {
    this.config = deepMerge({ ...DEFAULT_QUERY_CONFIG }, config);
    this.cache = new Map();
    this.refreshTimers = new Map();
    this.websockets = new Map();
  }

  /**
   * Execute query and return results
   */
  async execute(queryConfig = null) {
    const cfg = queryConfig ? deepMerge(this.config, queryConfig) : this.config;

    // Check cache first
    if (cfg.cache.enabled) {
      const cached = this._getFromCache(cfg);
      if (cached) return cached;
    }

    let result;

    switch (cfg.sourceType) {
      case 'sql':
        result = await this._executeSqlQuery(cfg);
        break;
      case 'api':
        result = await this._executeApiQuery(cfg);
        break;
      case 'static':
        result = this._executeStaticQuery(cfg);
        break;
      case 'websocket':
        result = await this._setupWebSocket(cfg);
        break;
      default:
        throw new Error(`Unknown source type: ${cfg.sourceType}`);
    }

    // Apply transformations
    if (cfg.transforms && cfg.transforms.length > 0) {
      result = this._applyTransforms(result, cfg.transforms);
    }

    // Apply mapping
    result = this._applyMapping(result, cfg.mapping);

    // Cache result
    if (cfg.cache.enabled) {
      this._setCache(cfg, result);
    }

    return result;
  }

  /**
   * Execute SQL query
   */
  async _executeSqlQuery(cfg) {
    if (!cfg.source) {
      throw new Error('SQL query requires a source endpoint');
    }

    const query = cfg.rawQuery || this._buildSqlFromVisual(cfg.query);
    if (!query) {
      throw new Error('No SQL query provided');
    }

    const response = await fetch(cfg.source, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: cfg.variables || {},
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Query execution failed');
    }

    return result.data;
  }

  /**
   * Execute API query
   */
  async _executeApiQuery(cfg) {
    const options = {
      method: cfg.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...cfg.headers,
      },
    };

    if (cfg.body && (cfg.method === 'POST' || cfg.method === 'PUT')) {
      options.body = JSON.stringify(cfg.body);
    }

    const response = await fetch(cfg.source, options);
    const result = await response.json();

    // Handle different API response formats
    if (Array.isArray(result)) {
      return result;
    }
    if (result.data) {
      return result.data;
    }
    return result;
  }

  /**
   * Return static data
   */
  _executeStaticQuery(cfg) {
    return cfg.data || [];
  }

  /**
   * Setup WebSocket connection
   */
  async _setupWebSocket(cfg) {
    return new Promise((resolve, reject) => {
      if (this.websockets.has(cfg.source)) {
        return resolve(this.websockets.get(cfg.source).lastData);
      }

      const ws = new WebSocket(cfg.source);

      ws.onopen = () => {
        console.log('WebSocket connected:', cfg.source);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.websockets.get(cfg.source).lastData = data;

          if (cfg.onMessage) {
            cfg.onMessage(data);
          }

          // Resolve promise on first message
          resolve(data);
        } catch (e) {
          console.error('WebSocket message parse error:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      ws.onclose = () => {
        console.log('WebSocket closed:', cfg.source);
        this.websockets.delete(cfg.source);
      };

      this.websockets.set(cfg.source, { ws, lastData: null });
    });
  }

  /**
   * Build SQL query from visual query builder state
   */
  _buildSqlFromVisual(query) {
    if (!query.from) return '';

    const parts = [];

    // SELECT
    const selectFields = query.select.length > 0
      ? query.select.map(f => f.aggregate ? `${f.aggregate}(${f.field})` : f.field).join(', ')
      : '*';
    parts.push(`SELECT ${selectFields}`);

    // FROM
    parts.push(`FROM ${query.from}`);

    // WHERE
    if (query.where && query.where.length > 0) {
      const conditions = query.where.map(w => {
        const value = typeof w.value === 'string' ? `'${w.value}'` : w.value;
        return `${w.field} ${w.operator} ${value}`;
      }).join(' AND ');
      parts.push(`WHERE ${conditions}`);
    }

    // GROUP BY
    if (query.groupBy && query.groupBy.length > 0) {
      parts.push(`GROUP BY ${query.groupBy.join(', ')}`);
    }

    // ORDER BY
    if (query.orderBy && query.orderBy.length > 0) {
      const orderClauses = query.orderBy.map(o =>
        `${o.field} ${o.direction || 'ASC'}`
      ).join(', ');
      parts.push(`ORDER BY ${orderClauses}`);
    }

    // LIMIT
    if (query.limit) {
      parts.push(`LIMIT ${query.limit}`);
    }

    return parts.join(' ');
  }

  /**
   * Apply data transformations
   */
  _applyTransforms(data, transforms) {
    let result = data;

    for (const transform of transforms) {
      switch (transform.type) {
        case 'filter':
          result = this._transformFilter(result, transform);
          break;
        case 'sort':
          result = this._transformSort(result, transform);
          break;
        case 'aggregate':
          result = this._transformAggregate(result, transform);
          break;
        case 'compute':
          result = this._transformCompute(result, transform);
          break;
        case 'pivot':
          result = this._transformPivot(result, transform);
          break;
        case 'slice':
          result = result.slice(transform.start || 0, transform.end);
          break;
        default:
          console.warn(`Unknown transform type: ${transform.type}`);
      }
    }

    return result;
  }

  _transformFilter(data, transform) {
    return data.filter(row => {
      const value = row[transform.field];
      switch (transform.operator) {
        case '=': return value === transform.value;
        case '!=': return value !== transform.value;
        case '>': return value > transform.value;
        case '<': return value < transform.value;
        case '>=': return value >= transform.value;
        case '<=': return value <= transform.value;
        case 'contains': return String(value).includes(transform.value);
        case 'startsWith': return String(value).startsWith(transform.value);
        case 'endsWith': return String(value).endsWith(transform.value);
        case 'in': return transform.value.includes(value);
        default: return true;
      }
    });
  }

  _transformSort(data, transform) {
    return [...data].sort((a, b) => {
      const valA = a[transform.field];
      const valB = b[transform.field];
      const direction = transform.direction === 'desc' ? -1 : 1;

      if (valA === valB) return 0;
      if (valA < valB) return -1 * direction;
      return 1 * direction;
    });
  }

  _transformAggregate(data, transform) {
    const groups = {};

    // Group data
    data.forEach(row => {
      const key = transform.groupBy
        ? transform.groupBy.map(f => row[f]).join('|')
        : '__all__';

      if (!groups[key]) {
        groups[key] = {
          rows: [],
          values: {},
        };
        if (transform.groupBy) {
          transform.groupBy.forEach(f => {
            groups[key].values[f] = row[f];
          });
        }
      }
      groups[key].rows.push(row);
    });

    // Apply aggregations
    return Object.values(groups).map(group => {
      const result = { ...group.values };

      transform.aggregations.forEach(agg => {
        const values = group.rows.map(r => r[agg.field]).filter(v => v !== null && v !== undefined);

        switch (agg.function) {
          case 'sum':
            result[agg.as || agg.field] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            result[agg.as || agg.field] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            break;
          case 'count':
            result[agg.as || agg.field] = values.length;
            break;
          case 'min':
            result[agg.as || agg.field] = Math.min(...values);
            break;
          case 'max':
            result[agg.as || agg.field] = Math.max(...values);
            break;
          case 'first':
            result[agg.as || agg.field] = values[0];
            break;
          case 'last':
            result[agg.as || agg.field] = values[values.length - 1];
            break;
        }
      });

      return result;
    });
  }

  _transformCompute(data, transform) {
    return data.map(row => ({
      ...row,
      [transform.as]: transform.formula(row),
    }));
  }

  _transformPivot(data, transform) {
    const result = {};

    data.forEach(row => {
      const rowKey = row[transform.rows];
      const colKey = row[transform.columns];
      const value = row[transform.values];

      if (!result[rowKey]) {
        result[rowKey] = { [transform.rows]: rowKey };
      }
      result[rowKey][colKey] = value;
    });

    return Object.values(result);
  }

  /**
   * Apply result mapping based on widget type
   */
  _applyMapping(data, mapping) {
    if (!mapping || Object.keys(mapping).length === 0) {
      return data;
    }

    // Single row for counters
    if (Array.isArray(data) && data.length === 1) {
      const row = data[0];
      const result = {};

      Object.entries(mapping).forEach(([key, field]) => {
        if (field && field !== 'auto' && row[field] !== undefined) {
          result[key] = row[field];
        }
      });

      if (Object.keys(result).length > 0) {
        return result;
      }
    }

    // Multiple rows - extract items/groups
    if (Array.isArray(data) && data.length > 0) {
      if (mapping.items || mapping.text) {
        // List mapping
        return {
          items: data.map(row => ({
            text: mapping.text ? row[mapping.text] : Object.values(row)[0],
            meta: mapping.meta ? row[mapping.meta] : undefined,
            value: mapping.value ? row[mapping.value] : undefined,
            ...row,
          })),
        };
      }

      if (mapping.columns === 'auto') {
        // Table auto-mapping
        const columns = Object.keys(data[0]).map(key => ({
          key,
          label: this._formatColumnLabel(key),
          sortable: true,
        }));
        return { columns, data };
      }
    }

    return data;
  }

  _formatColumnLabel(key) {
    return key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Cache management
   */
  _getCacheKey(cfg) {
    return JSON.stringify({
      source: cfg.source,
      rawQuery: cfg.rawQuery,
      query: cfg.query,
      variables: cfg.variables,
    });
  }

  _getFromCache(cfg) {
    const key = this._getCacheKey(cfg);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < cfg.cache.ttl) {
      return cached.data;
    }

    return null;
  }

  _setCache(cfg, data) {
    const key = this._getCacheKey(cfg);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Setup auto-refresh
   */
  setupRefresh(callback) {
    const { enabled, interval } = this.config.refresh;
    if (!enabled || !interval) return;

    this.stopRefresh();

    const timerId = setInterval(async () => {
      try {
        const data = await this.execute();
        callback(data);
      } catch (error) {
        console.error('Auto-refresh error:', error);
      }
    }, interval);

    this.refreshTimers.set(this.config.source, timerId);
  }

  /**
   * Stop auto-refresh
   */
  stopRefresh() {
    const timerId = this.refreshTimers.get(this.config.source);
    if (timerId) {
      clearInterval(timerId);
      this.refreshTimers.delete(this.config.source);
    }
  }

  /**
   * Close WebSocket connections
   */
  closeWebSockets() {
    this.websockets.forEach(({ ws }) => ws.close());
    this.websockets.clear();
  }

  /**
   * Cleanup all resources
   */
  destroy() {
    this.stopRefresh();
    this.closeWebSockets();
    this.cache.clear();
  }
}

/**
 * Create a query engine instance
 */
export function createQueryEngine(config) {
  return new QueryEngine(config);
}

export default QueryEngine;
