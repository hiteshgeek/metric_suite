<?php
/**
 * Theme Switcher Include
 * Add this to any page to include the theme switcher component
 *
 * Usage:
 * 1. Add to <head>: <?php include __DIR__ . '/includes/theme-switcher.php'; theme_init_script(); ?>
 * 2. Add container where you want the switcher: <div id="theme-switcher"></div>
 * 3. Add to end of body: <?php theme_switcher_script(); ?>
 */

/**
 * Output the theme initialization script (prevents flash of wrong theme)
 * Place this in the <head> tag
 */
function theme_init_script() {
    ?>
    <script>
    (function() {
      try {
        var saved = localStorage.getItem('ms-theme');
        if (saved && saved !== 'system') {
          document.documentElement.setAttribute('data-theme', saved);
        } else {
          document.documentElement.setAttribute('data-theme', 'system');
        }
      } catch (e) {}
    })();
    </script>
    <?php
}

/**
 * Output the theme switcher initialization script
 * Place this at the end of the body, after loading metric-suite.js
 *
 * @param string $container CSS selector for the container (default: '#theme-switcher')
 * @param array $options Options to pass to ThemeSwitcher
 */
function theme_switcher_script($container = '#theme-switcher', $options = []) {
    $optionsJson = json_encode($options);
    ?>
    <script type="module">
    import { ThemeSwitcher } from '<?= asset('metric-suite.js') ?>';
    new ThemeSwitcher('<?= $container ?>', <?= $optionsJson ?>);
    </script>
    <?php
}

/**
 * Output the theme switcher container HTML
 *
 * @param string $id ID for the container element
 * @param string $class Additional classes to add
 */
function theme_switcher_container($id = 'theme-switcher', $class = '') {
    $classAttr = $class ? " class=\"{$class}\"" : '';
    echo "<div id=\"{$id}\"{$classAttr}></div>";
}
