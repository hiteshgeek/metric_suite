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
    thumbnail VARCHAR(255) COMMENT 'Path to thumbnail image file',

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

-- ============================================================
-- Color Palettes Table
-- ============================================================
-- Stores reusable color palettes for graphs and components
-- ============================================================

CREATE TABLE IF NOT EXISTS color_palettes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT 'Palette name (e.g., "Corporate", "Pastel")',
    description VARCHAR(255) COMMENT 'Description of the palette',
    colors JSON NOT NULL COMMENT 'Array of hex color codes',
    is_default TINYINT(1) DEFAULT 0 COMMENT 'Whether this is the default palette',
    is_system TINYINT(1) DEFAULT 0 COMMENT 'System palettes cannot be deleted',
    sort_order INT UNSIGNED DEFAULT 0 COMMENT 'Display order',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY idx_name (name),
    INDEX idx_default (is_default),
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB COMMENT='Reusable color palettes for charts';

-- ============================================================
-- Insert Default Color Palettes
-- ============================================================

INSERT INTO color_palettes (name, description, colors, is_default, is_system, sort_order) VALUES
('Default', 'Default Metric Suite colors', '["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"]', 1, 1, 1),
('Corporate', 'Professional business colors', '["#1e40af", "#047857", "#b45309", "#b91c1c", "#6b21a8", "#0e7490", "#be185d", "#4d7c0f"]', 0, 1, 2),
('Pastel', 'Soft pastel tones', '["#a5b4fc", "#86efac", "#fde047", "#fca5a5", "#c4b5fd", "#67e8f9", "#f9a8d4", "#bef264"]', 0, 1, 3),
('Vibrant', 'Bold and vivid colors', '["#4f46e5", "#10b981", "#f97316", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d"]', 0, 1, 4),
('Monochrome Blue', 'Shades of blue', '["#1e3a8a", "#1e40af", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"]', 0, 1, 5),
('Monochrome Green', 'Shades of green', '["#14532d", "#166534", "#15803d", "#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"]', 0, 1, 6),
('Earth Tones', 'Natural earth colors', '["#78350f", "#92400e", "#a16207", "#ca8a04", "#65a30d", "#047857", "#0f766e", "#155e75"]', 0, 1, 7),
('Ocean', 'Cool ocean-inspired colors', '["#0c4a6e", "#075985", "#0369a1", "#0284c7", "#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd"]', 0, 1, 8)
ON DUPLICATE KEY UPDATE name=name;

-- ============================================================
-- Migration: Add thumbnail column to graph_configs
-- ============================================================
-- Run this if upgrading from a previous version:
-- ALTER TABLE graph_configs ADD COLUMN thumbnail VARCHAR(255) COMMENT 'Path to thumbnail image file' AFTER is_public;
-- ============================================================
