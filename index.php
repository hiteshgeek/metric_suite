<?php
include_once __DIR__ . '/includes/functions.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MediaHub - Complete File Management Suite</title>
    <link rel="stylesheet" href="<?php echo asset('media-hub.css'); ?>" />
    <link rel="icon" type="image/svg+xml" href="src/assets/images/download.svg">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            min-height: 100vh;
            color: #e2e8f0;
        }

        .hero {
            text-align: center;
            padding: 80px 20px 60px;
        }

        .hero h1 {
            font-size: 56px;
            font-weight: 800;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .hero p {
            font-size: 20px;
            opacity: 0.8;
            max-width: 600px;
            margin: 0 auto;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px 80px;
        }

        .section-title {
            color: rgba(255, 255, 255, 0.5);
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 30px;
            text-align: center;
        }

        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 24px;
            margin-bottom: 60px;
        }

        .project-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 32px;
            transition: all 0.3s;
        }

        .project-card:hover {
            border-color: rgba(255, 255, 255, 0.2);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .project-icon {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
        }

        .project-icon svg {
            width: 32px;
            height: 32px;
        }

        .project-card.file-uploader .project-icon {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .project-card.file-carousel .project-icon {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }

        .project-card.media-capture .project-icon {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .project-icon svg {
            fill: white;
            stroke: white;
        }

        /* Utils Section */
        .utils-divider {
            display: flex;
            align-items: center;
            gap: 20px;
            margin: 50px 0 30px;
        }

        .utils-divider::before,
        .utils-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }

        .utils-divider span {
            color: rgba(255, 255, 255, 0.4);
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2px;
            white-space: nowrap;
        }

        .utils-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 16px;
            margin-bottom: 60px;
        }

        .util-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 20px;
            transition: all 0.3s;
        }

        .util-card:hover {
            border-color: rgba(255, 255, 255, 0.15);
            background: rgba(255, 255, 255, 0.05);
        }

        .util-card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .util-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .util-icon svg {
            width: 18px;
            height: 18px;
        }

        .util-icon.tooltip-icon {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        }

        .util-icon.button-icon {
            background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        }

        .util-card h3 {
            font-size: 15px;
            font-weight: 600;
            color: white;
            margin: 0;
        }

        .util-card p {
            font-size: 12px;
            line-height: 1.5;
            opacity: 0.6;
            margin: 0 0 14px;
        }

        .util-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            color: white;
            text-decoration: none;
            font-size: 12px;
            font-weight: 500;
            transition: background 0.2s;
        }

        .util-link:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        .util-link svg {
            width: 12px;
            height: 12px;
        }

        .project-card h2 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 12px;
            color: white;
        }

        .project-card p {
            font-size: 14px;
            line-height: 1.6;
            opacity: 0.7;
            margin-bottom: 24px;
        }

        .project-links {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        .project-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: white;
            text-decoration: none;
            font-size: 13px;
            font-weight: 500;
            transition: background 0.2s;
        }

        .project-link:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .project-link svg {
            width: 14px;
            height: 14px;
        }

        .features-section {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 60px;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 24px;
        }

        .feature-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }

        .feature-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .feature-icon svg {
            width: 20px;
            height: 20px;
            stroke: #a5b4fc;
        }

        .feature-text h3 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 4px;
            color: white;
        }

        .feature-text p {
            font-size: 12px;
            opacity: 0.6;
            line-height: 1.5;
        }

        footer {
            text-align: center;
            padding: 40px 20px;
            opacity: 0.6;
            font-size: 14px;
        }

        footer a {
            color: #a5b4fc;
            text-decoration: none;
        }

        footer a:hover {
            text-decoration: underline;
        }

        @media (max-width: 768px) {
            .hero h1 {
                font-size: 36px;
            }

            .hero p {
                font-size: 16px;
            }

            .projects-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <header class="hero">
        <h1>MediaHub</h1>
        <p>A complete file management suite with upload, preview, and capture capabilities</p>
    </header>

    <main class="container">
        <p class="section-title">Choose a Component</p>

        <div class="projects-grid">
            <!-- FileUploader -->
            <div class="project-card file-uploader">
                <div class="project-icon">
                    <svg viewBox="0 0 640 640"><path d="M352 96C352 78.3 337.7 64 320 64C302.3 64 288 78.3 288 96L288 306.7L246.6 265.3C234.1 252.8 213.8 252.8 201.3 265.3C188.8 277.8 188.8 298.1 201.3 310.6L297.3 406.6C309.8 419.1 330.1 419.1 342.6 406.6L438.6 310.6C451.1 298.1 451.1 277.8 438.6 265.3C426.1 252.8 405.8 252.8 393.3 265.3L352 306.7L352 96zM160 384C124.7 384 96 412.7 96 448L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 448C544 412.7 515.3 384 480 384L433.1 384L376.5 440.6C345.3 471.8 294.6 471.8 263.4 440.6L206.9 384L160 384zM464 440C477.3 440 488 450.7 488 464C488 477.3 477.3 488 464 488C450.7 488 440 477.3 440 464C440 450.7 450.7 440 464 440z"/></svg>
                </div>
                <h2>FileUploader</h2>
                <p>Modern file upload with drag & drop, validation, preview, and Bootstrap integration. Supports multiple files, size limits, and instant AJAX upload.</p>
                <div class="project-links">
                    <a href="projects/file-uploader/" class="project-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                        Home
                    </a>
                    <a href="projects/file-uploader/usage/demo-modular-library.php" class="project-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        Demos
                    </a>
                    <a href="projects/file-uploader/config-builder.php" class="project-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
                        Config Builder
                    </a>
                    <a href="projects/file-uploader/setup-guide.php" class="project-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                        Setup Guide
                    </a>
                </div>
            </div>

            <!-- FileCarousel -->
            <div class="project-card file-carousel">
                <div class="project-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                        <line x1="7" y1="2" x2="7" y2="22"></line>
                        <line x1="17" y1="2" x2="17" y2="22"></line>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                    </svg>
                </div>
                <h2>FileCarousel</h2>
                <p>Modal gallery viewer for images, videos, PDFs, Excel, CSV, and text files. Features smart preloading, keyboard navigation, and download support.</p>
                <div class="project-links">
                    <a href="projects/file-carousel/" class="project-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                        Home
                    </a>
                    <a href="projects/file-carousel/usage/demo-basic.php" class="project-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        Demos
                    </a>
                    <a href="projects/file-carousel/config-builder.php" class="project-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
                        Config Builder
                    </a>
                </div>
            </div>

            <!-- MediaCapture -->
            <div class="project-card media-capture">
                <div class="project-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                    </svg>
                </div>
                <h2>MediaCapture</h2>
                <p>Screen capture and recording utilities. Capture full screen, regions, or pages. Record video with audio and microphone-only audio recording.</p>
                <div class="project-links">
                    <a href="projects/media-capture/" class="project-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                        Home
                    </a>
                    <a href="projects/media-capture/usage/demo-screenshots.php" class="project-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        Demos
                    </a>
                    <a href="projects/media-capture/config-builder.php" class="project-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
                        Config Builder
                    </a>
                </div>
            </div>

        </div>

        <!-- Utils Section -->
        <div class="utils-divider">
            <span>Utility Components</span>
        </div>

        <div class="utils-grid">
            <!-- Tooltip System -->
            <div class="util-card">
                <div class="util-card-header">
                    <div class="util-icon tooltip-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    </div>
                    <h3>Tooltip System</h3>
                </div>
                <p>Modern tooltips with fixed positioning, themes, keyboard shortcuts, and smart viewport detection.</p>
                <a href="projects/utils/usage/demo-tooltip.php" class="util-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    View Demo
                </a>
            </div>

            <!-- Button Sizes -->
            <div class="util-card">
                <div class="util-card-header">
                    <div class="util-icon button-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 12h8"/></svg>
                    </div>
                    <h3>Button Sizes</h3>
                </div>
                <p>Four size variants (xs, sm, md, lg) for circular and rectangular buttons with CSS custom properties.</p>
                <a href="projects/utils/usage/demo-button-sizes.php" class="util-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    View Demo
                </a>
            </div>

            <!-- All Utils Link -->
            <div class="util-card">
                <div class="util-card-header">
                    <div class="util-icon" style="background: linear-gradient(135deg, #64748b 0%, #475569 100%);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
                    </div>
                    <h3>All Utils</h3>
                </div>
                <p>Browse all shared utility components and documentation for the MediaHub library.</p>
                <a href="projects/utils/" class="util-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    Browse All
                </a>
            </div>
        </div>

        <div class="features-section">
            <p class="section-title">Key Features</p>
            <div class="features-grid">
                <div class="feature-item">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    </div>
                    <div class="feature-text">
                        <h3>Modular Design</h3>
                        <p>Use components independently or together</p>
                    </div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    </div>
                    <div class="feature-text">
                        <h3>Drag & Drop</h3>
                        <p>Intuitive file upload experience</p>
                    </div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </div>
                    <div class="feature-text">
                        <h3>Live Preview</h3>
                        <p>Preview files before upload</p>
                    </div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div class="feature-text">
                        <h3>Validation</h3>
                        <p>File type and size limits</p>
                    </div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    </div>
                    <div class="feature-text">
                        <h3>Multi-Format</h3>
                        <p>Images, videos, PDFs, and more</p>
                    </div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                    </div>
                    <div class="feature-text">
                        <h3>Screen Recording</h3>
                        <p>Capture video with audio</p>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer>
        <p>MediaHub &copy; <?= date('Y') ?> | <a href="DOCUMENTATION.md">Documentation</a></p>
    </footer>
</body>
</html>
