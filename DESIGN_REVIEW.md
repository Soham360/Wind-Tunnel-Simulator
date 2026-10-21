# Interface review · Apple design principles

The original workbench had a clear visual focus, but small labels, faint secondary text and compact buttons made its instruments harder to use. Controls mixed air conditions and orientation, camera reset jumped abruptly, and resetting a run discarded data without recovery.

## Changes implemented

1. **Typography and craft:** platform system fonts, size-specific tracking, larger secondary text and chart labels, stronger contrast, and tabular instrument values. Removed the remote font request.
2. **Response and familiarity:** immediate press feedback, 44 px primary and viewport buttons, larger slider interaction areas, and distinct selected/unselected pressure and airflow buttons.
3. **Grouping and agency:** separate Airflow and Model orientation fieldsets; synchronized number inputs for exact settings alongside continuous sliders.
4. **Interruptibility:** critically damped camera reset (0.4 s response) starts from the current camera position. Orbit input cancels it immediately. Retargeting retains spring velocity; model orientation remains directly controlled by the sliders.
5. **Forgiveness:** Undo reset restores conditions, physical length, time history and exported data. Loading a different model invalidates the previous undo snapshot.
6. **Flexibility:** responsive cards, wrapping toolbars, scalable typography, live reduced-motion handling for camera inertia and particles, solid material fallbacks for reduced transparency, and stronger borders for increased contrast.
7. **Hierarchy:** a restrained translucent sticky navigation layer, solid instrument cards, and opaque-backed viewport labels retain clear separation from the 3D scene.
8. **Latency:** cancelable pitch sweeps calculate three samples per animation frame; force history reuses the latest steady result rather than recomputing geometry each recording tick.
9. **Accessible data:** drag uses a dashed chart stroke as well as a different color, and chart axes are larger and darker.

## Verification

Nine automated tests pass: six existing physics tests and three spring tests covering settling, retarget continuity and frame independence. Static build and JavaScript syntax checks pass. Browser checks cover exact input synchronization, reset/undo, chart rendering and no console errors. A phone-width layout check found no horizontal document overflow.

This is an application of the supplied apple-design skill, not a claim of Apple certification. Reduced-transparency and increased-contrast fallbacks are implemented in CSS; a screen-reader audit and testing with users remain future work.
