-- ============================================================
-- Metric Suite Database Schema
-- ============================================================
-- This creates the metric_suite database for storing graph
-- configurations and cached schema information.
--
-- Run this script to set up the local database:
--   mysql -u root -p < database/schema.sql
--
-- Or import via phpMyAdmin/MySQL Workbench
-- ============================================================

CREATE DATABASE IF NOT EXISTS metric_suite
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE metric_suite;

-- ============================================================
-- Graph Configurations Table
-- ============================================================
-- Stores saved graph configurations for reuse in dashboards
-- ============================================================

CREATE TABLE IF NOT EXISTS graph_configs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Display name for the graph',
    slug VARCHAR(255) NOT NULL COMMENT 'URL-friendly identifier',
    type VARCHAR(50) NOT NULL DEFAULT 'bar' COMMENT 'Chart type: bar, line, pie, etc.',
    description TEXT COMMENT 'Optional description of what this graph shows',

    -- Graph Configuration (ECharts options)
    config JSON NOT NULL COMMENT 'ECharts configuration object',

    -- Data Source Configuration
    data_source ENUM('query', 'static', 'api') DEFAULT 'query' COMMENT 'How data is fetched',
    data_query TEXT COMMENT 'SQL query to fetch graph data (SELECT only)',
    static_data JSON COMMENT 'Static data for the graph',
    api_endpoint VARCHAR(500) COMMENT 'External API endpoint for data',

    -- Column Mapping
    x_column VARCHAR(100) COMMENT 'Column name for X axis / categories',
    y_columns JSON COMMENT 'Column name(s) for Y axis / values',
    series_column VARCHAR(100) COMMENT 'Column for grouping into series',

    -- Display Options
    refresh_interval INT UNSIGNED DEFAULT 0 COMMENT 'Auto-refresh interval in seconds (0 = disabled)',
    is_public TINYINT(1) DEFAULT 1 COMMENT 'Whether this graph is publicly accessible',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    UNIQUE KEY idx_slug (slug),
    INDEX idx_name (name),
    INDEX idx_type (type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB COMMENT='Saved graph configurations';

-- ============================================================
-- Dashboards Table
-- ============================================================
-- Groups multiple graphs into a dashboard layout
-- ============================================================

CREATE TABLE IF NOT EXISTS dashboards (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Dashboard name',
    slug VARCHAR(255) NOT NULL COMMENT 'URL-friendly identifier',
    description TEXT COMMENT 'Dashboard description',
    layout JSON COMMENT 'Grid layout configuration for graphs',
    is_public TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY idx_slug (slug),
    INDEX idx_name (name)
) ENGINE=InnoDB COMMENT='Dashboard configurations';

-- ============================================================
-- Dashboard Items (Junction Table)
-- ============================================================
-- Links graphs to dashboards with position/size info
-- ============================================================

CREATE TABLE IF NOT EXISTS dashboard_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dashboard_id INT UNSIGNED NOT NULL,
    graph_id INT UNSIGNED NOT NULL,
    position_x INT UNSIGNED DEFAULT 0 COMMENT 'Grid column position',
    position_y INT UNSIGNED DEFAULT 0 COMMENT 'Grid row position',
    width INT UNSIGNED DEFAULT 1 COMMENT 'Grid columns span',
    height INT UNSIGNED DEFAULT 1 COMMENT 'Grid rows span',
    sort_order INT UNSIGNED DEFAULT 0,

    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE,
    FOREIGN KEY (graph_id) REFERENCES graph_configs(id) ON DELETE CASCADE,
    UNIQUE KEY idx_dashboard_graph (dashboard_id, graph_id),
    INDEX idx_sort (dashboard_id, sort_order)
) ENGINE=InnoDB COMMENT='Dashboard to graph relationships';

-- ============================================================
-- Saved Queries Table
-- ============================================================
-- Reusable SQL query templates
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_queries (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Query name',
    description TEXT COMMENT 'What this query does',
    query_text TEXT NOT NULL COMMENT 'The SQL query (SELECT only)',
    parameters JSON COMMENT 'Named parameters for the query',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name (name)
) ENGINE=InnoDB COMMENT='Saved SQL query templates';

-- ============================================================
-- Schema Cache Table (Optional)
-- ============================================================
-- Caches main database schema for faster query building
-- ============================================================

CREATE TABLE IF NOT EXISTS schema_cache (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    database_name VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    schema_json JSON NOT NULL COMMENT 'Cached table structure',
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY idx_db_table (database_name, table_name),
    INDEX idx_cached (cached_at)
) ENGINE=InnoDB COMMENT='Cached schema information from main database';
