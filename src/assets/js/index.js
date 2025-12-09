/**
 * Metric Suite Application Entry
 * Initializes the Graph Configurator on the page
 */

import { GraphConfigurator } from '../../library/js/components/Graph/GraphConfigurator.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('graph-configurator');

  if (container) {
    // Get base path from data attribute or default
    const basePath = container.dataset.basePath || '';

    // Initialize the Graph Configurator
    window.configurator = new GraphConfigurator(container, {
      apiEndpoint: `${basePath}/api/data.php`,
      saveEndpoint: `${basePath}/api/graph.php`,
      onSave: result => {
        console.log('Configuration saved:', result);
      },
    });
  }
});
