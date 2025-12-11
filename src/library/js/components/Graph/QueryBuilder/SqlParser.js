/**
 * SqlParser - Parse SQL SELECT statements into query object
 * For two-way sync between SQL editor and visual builder
 */

/**
 * Parse a SQL SELECT statement
 * @param {string} sql - SQL string to parse
 * @returns {Object} Parsed query object
 */
export function parseSQL(sql) {
  const query = {
    select: [],
    from: '',
    joins: [],
    where: [],
    groupBy: [],
    orderBy: [],
    limit: null,
  };

  if (!sql || typeof sql !== 'string') {
    return query;
  }

  // Normalize whitespace and remove comments
  let normalizedSql = sql
    .replace(/--.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Check if it's a SELECT statement
  if (!normalizedSql.toUpperCase().startsWith('SELECT')) {
    throw new Error('Only SELECT statements are supported');
  }

  try {
    // Extract main clauses using regex
    const selectMatch = normalizedSql.match(/SELECT\s+(DISTINCT\s+)?(.+?)\s+FROM/i);
    const fromMatch = normalizedSql.match(/FROM\s+(\w+)(?:\s+(?:AS\s+)?(\w+))?/i);
    const joinMatches = normalizedSql.matchAll(/(LEFT|RIGHT|INNER|OUTER|CROSS)?\s*JOIN\s+(\w+)(?:\s+(?:AS\s+)?(\w+))?\s+ON\s+(.+?)(?=(?:LEFT|RIGHT|INNER|OUTER|CROSS)?\s*JOIN|WHERE|GROUP|ORDER|LIMIT|$)/gi);
    const whereMatch = normalizedSql.match(/WHERE\s+(.+?)(?=GROUP|ORDER|LIMIT|$)/i);
    const groupByMatch = normalizedSql.match(/GROUP\s+BY\s+(.+?)(?=HAVING|ORDER|LIMIT|$)/i);
    const orderByMatch = normalizedSql.match(/ORDER\s+BY\s+(.+?)(?=LIMIT|$)/i);
    const limitMatch = normalizedSql.match(/LIMIT\s+(\d+)/i);

    // Parse SELECT clause
    if (selectMatch) {
      const selectClause = selectMatch[2];
      query.select = parseSelectFields(selectClause);
    }

    // Parse FROM clause
    if (fromMatch) {
      query.from = fromMatch[1];
    }

    // Parse JOINs
    for (const joinMatch of joinMatches) {
      const joinType = (joinMatch[1] || 'INNER').toUpperCase();
      const joinTable = joinMatch[2];
      const onClause = joinMatch[4];

      // Parse ON clause
      const onMatch = onClause.match(/(\w+\.\w+)\s*=\s*(\w+\.\w+)/);
      if (onMatch) {
        query.joins.push({
          type: joinType,
          table: joinTable,
          leftCol: onMatch[1],
          rightCol: onMatch[2],
        });
      }
    }

    // Parse WHERE clause
    if (whereMatch) {
      query.where = parseWhereClause(whereMatch[1]);
    }

    // Parse GROUP BY clause
    if (groupByMatch) {
      query.groupBy = groupByMatch[1]
        .split(',')
        .map(col => col.trim())
        .filter(col => col);
    }

    // Parse ORDER BY clause
    if (orderByMatch) {
      query.orderBy = parseOrderByClause(orderByMatch[1]);
    }

    // Parse LIMIT clause
    if (limitMatch) {
      query.limit = parseInt(limitMatch[1]);
    }

  } catch (error) {
    console.warn('SQL parsing error:', error);
  }

  return query;
}

/**
 * Parse SELECT fields
 */
function parseSelectFields(selectClause) {
  const fields = [];
  const parts = splitByComma(selectClause);

  for (const part of parts) {
    const trimmed = part.trim();

    if (trimmed === '*') {
      fields.push({ name: '*', aggregate: null, alias: null });
      continue;
    }

    // Check for aggregate function
    const aggMatch = trimmed.match(/^(COUNT|SUM|AVG|MIN|MAX|COUNT\s+DISTINCT)\s*\(\s*(\*|\w+)\s*\)(?:\s+AS\s+(\w+))?$/i);
    if (aggMatch) {
      fields.push({
        name: aggMatch[2],
        aggregate: aggMatch[1].toUpperCase().replace(/\s+/, ' '),
        alias: aggMatch[3] || null,
      });
      continue;
    }

    // Check for alias
    const aliasMatch = trimmed.match(/^(\w+)(?:\s+AS\s+(\w+))?$/i);
    if (aliasMatch) {
      fields.push({
        name: aliasMatch[1],
        aggregate: null,
        alias: aliasMatch[2] || null,
      });
      continue;
    }

    // Table.column format
    const tableColMatch = trimmed.match(/^(\w+)\.(\w+)(?:\s+AS\s+(\w+))?$/i);
    if (tableColMatch) {
      fields.push({
        name: `${tableColMatch[1]}.${tableColMatch[2]}`,
        aggregate: null,
        alias: tableColMatch[3] || null,
      });
    }
  }

  return fields;
}

/**
 * Parse WHERE clause into filter objects
 */
function parseWhereClause(whereClause) {
  const filters = [];

  // Split by AND/OR while preserving the conjunction
  const parts = whereClause.split(/\s+(AND|OR)\s+/i);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();

    // Skip if it's a conjunction keyword
    if (part.toUpperCase() === 'AND' || part.toUpperCase() === 'OR') {
      continue;
    }

    const filter = parseCondition(part);
    if (filter) {
      // Set conjunction from previous part
      if (i > 0 && (parts[i - 1].toUpperCase() === 'OR')) {
        filter.conjunction = 'OR';
      } else {
        filter.conjunction = 'AND';
      }
      filters.push(filter);
    }
  }

  return filters;
}

/**
 * Parse a single WHERE condition
 */
function parseCondition(condition) {
  const trimmed = condition.trim();

  // IS NULL / IS NOT NULL
  const nullMatch = trimmed.match(/^(\w+)\s+(IS\s+(?:NOT\s+)?NULL)$/i);
  if (nullMatch) {
    return {
      column: nullMatch[1],
      operator: nullMatch[2].toUpperCase().replace(/\s+/g, ' '),
      value: null,
      columnType: 'string',
    };
  }

  // BETWEEN
  const betweenMatch = trimmed.match(/^(\w+)\s+BETWEEN\s+(.+?)\s+AND\s+(.+)$/i);
  if (betweenMatch) {
    return {
      column: betweenMatch[1],
      operator: 'BETWEEN',
      value: [parseValue(betweenMatch[2]), parseValue(betweenMatch[3])],
      columnType: 'string',
    };
  }

  // IN / NOT IN
  const inMatch = trimmed.match(/^(\w+)\s+(NOT\s+)?IN\s*\((.+)\)$/i);
  if (inMatch) {
    const values = inMatch[3].split(',').map(v => parseValue(v.trim()));
    return {
      column: inMatch[1],
      operator: inMatch[2] ? 'NOT IN' : 'IN',
      value: values,
      columnType: 'string',
    };
  }

  // LIKE / NOT LIKE
  const likeMatch = trimmed.match(/^(\w+)\s+(NOT\s+)?LIKE\s+(.+)$/i);
  if (likeMatch) {
    return {
      column: likeMatch[1],
      operator: likeMatch[2] ? 'NOT LIKE' : 'LIKE',
      value: parseValue(likeMatch[3]),
      columnType: 'string',
    };
  }

  // Comparison operators
  const compMatch = trimmed.match(/^(\w+)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/);
  if (compMatch) {
    let operator = compMatch[2];
    if (operator === '<>') operator = '!=';

    return {
      column: compMatch[1],
      operator,
      value: parseValue(compMatch[3]),
      columnType: 'string',
    };
  }

  return null;
}

/**
 * Parse ORDER BY clause
 */
function parseOrderByClause(orderByClause) {
  const orders = [];
  const parts = orderByClause.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    const match = trimmed.match(/^(\w+)(?:\s+(ASC|DESC))?$/i);

    if (match) {
      orders.push({
        column: match[1],
        direction: (match[2] || 'ASC').toUpperCase(),
      });
    }
  }

  return orders;
}

/**
 * Parse a value (remove quotes, etc.)
 */
function parseValue(value) {
  let trimmed = value.trim();

  // Remove surrounding quotes
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    trimmed = trimmed.slice(1, -1);
  }

  // Try to parse as number
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') {
    return num;
  }

  return trimmed;
}

/**
 * Split by comma, respecting parentheses and quotes
 */
function splitByComma(str) {
  const parts = [];
  let current = '';
  let parenDepth = 0;
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (inQuote) {
      current += char;
      if (char === quoteChar) {
        inQuote = false;
      }
    } else if (char === "'" || char === '"') {
      current += char;
      inQuote = true;
      quoteChar = char;
    } else if (char === '(') {
      current += char;
      parenDepth++;
    } else if (char === ')') {
      current += char;
      parenDepth--;
    } else if (char === ',' && parenDepth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

export default parseSQL;
