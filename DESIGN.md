# Design
## Source of truth
Active · 2026-11-16. New local React + Three.js gallery. Evidence: user's 3:4 poster, mouse parallax, low-reflection glass, cinematic lighting requirements. No existing assets or design system.
## Brand
ATELIER: quiet, tactile, editorial, museum quality. Avoid dashboard cards and exaggerated neon.
## Product goals
Display a 3:4 poster with a realistic beveled frame, subtle glass and responsive movement. Upload, change frame finishes, switch artwork, control light, export image, and enter focus mode. Success: usable local build and verified interactions. Non-goal: actual hardware ray tracing or backend storage.
## Personas and jobs
Designers and collectors previewing poster art in a curated exhibition.
## Information architecture
Single fullscreen viewer; centered 3D frame, minimal top help entry, right view tools and compact floating material/artwork controls. User explicitly requested display-first, no literary or promotional copy.
## Design principles
Art first. Restrained reflections. Immediate feedback. Original procedural art with no remote asset dependency.
No screen-space vignette: its elliptical transition becomes visible across the poster when zoomed in.
## Visual language
Charcoal/olive environment, subtle metallic frame, compact sans-serif controls. Slow damped mouse parallax, left-button drag rotation (about ±69° yaw and ±37° pitch), bounded wheel zoom. Reset restores both rotation and distance. Backdrop and floor stay outside the entire rotated frame envelope.
## Components
Gallery canvas, frame finish swatches, poster selector, upload, icon toolbar, help dialog, status toast. Tokens in src/styles.css.
Frame selector: compact bottom trigger opens an eight-style grid. Keep original champagne/graphite/silver and add walnut, light oak, travertine, white marble, carved bronze. Vary profile width/depth as actual geometry; apply directional wood grain, metal brushing, stone pores/veins and bronze relief with local procedural PBR maps. Load only the active style and release replaced GPU resources. Keep the poster opening fixed at 3:4.
Material refinement: avoid repeated tile motifs and laminated stripes across all styles. Use unique rail regions, continuous physical-distance UVs, clamped textures and low-amplitude irregular relief. Timber faces should read as solid wood with minimal edge roundovers. Keep texture size at 512px and avoid increasing render quality to hide mapping problems.
Bronze clarity exception: use 1024px maps only for bronze; sharpen actual ornament silhouettes with instanced leaf relief and larger, less dense beads. Ornaments use a separate map-free bronze material so the rail atlas is not stretched onto spheres. Other styles remain at 512px; preserve global performance settings.
## Accessibility
Semantic buttons with labels and pressed states; focus rings; dialog keyboard close and focus return. Respect prefers-reduced-motion. WebGL error fallback. Keyboard accessible controls and live status.
## Responsive behavior
Desktop and mobile fullscreen centered exhibit; compact bottom floating toolbar, responsive frame scale with horizontal safe margins, no promotional sections.
## Interaction states
Canvas loading fallback, WebGL unavailable error, image upload validation/failure, image export feedback, selected artwork/material, focus mode and lighting state.
## Content voice
Short, functional Simplified Chinese labels only. No literary copy or exhibition marketing text outside the poster artwork.
## Implementation constraints
React, TypeScript, Three.js via R3F. PBR physical materials, locally generated room environment, contact shadows, SSAO and restrained postprocessing. Raster renderer with image-based lighting approximates diffuse/global light; no claim of actual path tracing. Continuous extruded frame geometry avoids coplanar rail intersections. User explicitly prioritizes adjustable performance: default DPR 1, FXAA only, half-resolution low-sample N8AO, 1024px shadows, bloom off. Settings panel offers fast/balanced/quality presets, DPR 0.75–2, mutually exclusive AA modes, AO, shadows, bloom and glass transmission controls. Persist settings in localStorage; no automatic quality escalation.
## Open questions
None blocking. Assumption: local project; uploaded art stays in browser memory. Non-3:4 images center-crop to fill.
