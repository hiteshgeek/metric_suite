/**
 * SqlGenerator - Generate SQL from query object
 * For two-way sync between visual builder and SQL editor
 */

/**
 * Generate SQL SELECT statement from query object
 * @param {Object} query - Query object
 * @returns {string} SQL string
 */
export function generateSQL(query) {
  if (!query || !query.from) {
    return '';
  }

  const parts = [];

  // SELECT clause
  parts.push('SELECT');
  parts.push(generateSelectClause(query.select));

  // FROM clause
  parts.push('FROM');
  parts.push(query.from);

  // JOIN clauses
  if (query.joins && query.joins.length > 0) {
    parts.push(generateJoinClauses(query.joins));
  }

  // WHERE clause
  if (query.where && query.where.length > 0) {
    parts.push('WHERE');
    parts.push(generateWhereClause(query.where));
  }

  // GROUP BY clause
  if (query.groupBy && query.groupBy.length > 0) {
    parts.push('GROUP BY');
    parts.push(query.groupBy.join(', '));
  }

  // ORDER BY clause
  if (query.orderBy && query.orderBy.length > 0) {
    parts.push('ORDER BY');
    parts.push(generateOrderByClause(query.orderBy));
  }

  // LIMIT clause
  if (query.limit) {
    parts.push('LIMIT');
    parts.push(query.limit.toString());
  }

  return parts.join(' ');
}

/**
 * Generate SELECT clause
 */
function generateSelectClause(fields) {
  if (!fields || fields.length === 0) {
    return '*';
  }

  return fields.map(field => {
    if (typeof field === 'string') {
      return field;
    }

    let fieldStr = '';

    // Handle aggregate functions
    if (field.aggregate) {
      if (field.aggregate === 'COUNT DISTINCT') {
        fieldStr = `COUNT(DISTINCT ${field.name})`;
      } else {
        fieldStr = `${field.aggregate}(${field.name})`;
      }
    } else {
      fieldStr = field.name;
    }

    // Add alias
    if (field.alias) {
      fieldStr += ` AS ${field.alias}`;
    }

    return fieldStr;
  }).join(', ');
}

/**
 * Generate JOIN clauses
 */
function generateJoinClauses(joins) {
  return joins.map(join => {
    const joinType = join.type || 'INNER';
    return `${joinType} JOIN ${join.table} ON ${join.leftCol} = ${join.rightCol}`;
  }).join(' ');
}

/**
 * Generate WHERE clause
 */
function generateWhereClause(filters) {
  return filters.map((filter, index) => {
    const condition = generateCondition(filter);
    if (index === 0) {
      return condition;
    }
    return `${filter.conjunction || 'AND'} ${condition}`;
  }).join(' ');
}

/**
 * Generate a single WHERE condition
 */
function generateCondition(filter) {
  const { column, operator, value } = filter;

  switch (operator) {
    case 'IS NULL':
    case 'IS NOT NULL':
      return `${column} ${operator}`;

    case 'BETWEEN':
      if (Array.isArray(value) && value.length === 2) {
        return `${column} BETWEEN ${formatValue(value[0])} AND ${formatValue(value[1])}`;
      }
      return `${column} BETWEEN '' AND ''`;

    case 'IN':
    case 'NOT IN':
      if (Array.isArray(value)) {
        const formattedValues = value.map(v => formatValue(v)).join(', ');
        return `${column} ${operator} (${formattedValues})`;
      }
      return `${column} ${operator} ()`;

    case 'LIKE':
    case 'NOT LIKE':
      return `${column} ${operator} ${formatValue(value)}`;

    default:
      return `${column} ${operator} ${formatValue(value)}`;
  }
}

/**
 * Generate ORDER BY clause
 */
function generateOrderByClause(orderBy) {
  return orderBy.map(order => {
    return `${order.column} ${order.direction || 'ASC'}`;
  }).join(', ');
}

/**
 * Format a value for SQL
 */
function formatValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  // String - escape single quotes and wrap
  const escaped = String(value).replace(/'/g, "''");
  return `'${escaped}'`;
}

/**
 * Format SQL with proper indentation (for display)
 */
export function formatSQL(sql) {
  if (!sql) return '';

  // Add newlines before main keywords
  let formatted = sql
    .replace(/\s+(FROM)\s+/gi, '\n$1 ')
    .replace(/\s+(LEFT|RIGHT|INNER|OUTER|CROSS)\s+JOIN/gi, '\n$1 JOIN')
    .replace(/\s+(WHERE)\s+/gi, '\n$1 ')
    .replace(/\s+(AND|OR)\s+/gi, '\n  $1 ')
    .replace(/\s+(GROUP BY)\s+/gi, '\n$1 ')
    .replace(/\s+(ORDER BY)\s+/gi, '\n$1 ')
    .replace(/\s+(LIMIT)\s+/gi, '\n$1 ');

  return formatted;
}

/**
 * Validate query object
 */
export function validateQuery(query) {
  const errors = [];

  if (!query.from) {
    errors.push('No table selected');
  }

  if (!query.select || query.select.length === 0) {
    // Not an error, will use *
  }

  // Validate joins
  if (query.joins) {
    query.joins.forEach((join, index) => {
      if (!join.table) {
        errors.push(`Join ${index + 1}: No table specified`);
      }
      if (!join.leftCol || !join.rightCol) {
        errors.push(`Join ${index + 1}: Missing ON clause`);
      }
    });
  }

  // Validate filters
  if (query.where) {
    query.where.forEach((filter, index) => {
      if (!filter.column) {
        errors.push(`Filter ${index + 1}: No column specified`);
      }
      if (!filter.operator) {
        errors.push(`Filter ${index + 1}: No operator specified`);
      }
      // Check if value is required
      const noValueOperators = ['IS NULL', 'IS NOT NULL'];
      if (!noValueOperators.includes(filter.operator) && !filter.value && filter.value !== 0) {
        errors.push(`Filter ${index + 1}: No value specified`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default generateSQL;
