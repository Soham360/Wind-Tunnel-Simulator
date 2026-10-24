# Flowlab · Wind Tunnel Simulator

A browser-based aerodynamics workbench inspired by the interface, modular Three.js scenes, live graphs and learning notes in [Robot-Arm-Simulator](https://github.com/Soham360/Robot-Arm-Simulator), [Plane-Engine-Simulator](https://github.com/Soham360/Plane-Engine-Simulator) and [Rocket-Engine-Simulator](https://github.com/Soham360/Rocket-Engine-Simulator). The current local versions of all three projects were reviewed as templates.

## Run

Requires Node.js 22 or newer. No package installation is needed.

```sh
node server.js
```

Open http://127.0.0.1:4173. Use `PORT` to select another port. For static hosting run `node build.js` and serve the contents of `dist/`. GitHub Actions tests and builds every push to main, then publishes dist/ to GitHub Pages. Pull requests run checks without deployment. The live simulator is https://soham360.github.io/Wind-Tunnel-Simulator/.

## Explore

- Upload or drag a **STL, OBJ, or self-contained GLB** into the 3D viewport. Files are parsed locally and never uploaded to a server.
- Try the wing, sphere or bluff-body presets.
- Set physical **X-axis model length in metres**. Imported units are normalized to this value; dimensions are shown below the model name.
- Orient with pitch, yaw and roll. Positive pitch raises the −X nose into flow travelling along +X. Y is vertical and Z is the span direction. Camera orbit is independent of model orientation.
- Adjust airspeed and density. Inspect pressure coefficient colors, continuous illustrative airflow ribbons, drag, vertical lift, Cd, Reynolds number, dynamic pressure, reference area, surface area and Mach number.
- Watch the force history and −30° to +30° pitch sweep. Pause stops airflow highlight motion and recording; controls continue to update the steady estimate and sweep.
- Export CSV with time, conditions, orientation, physical length, area, force components, coefficients, Reynolds and Mach. The latest hour (18,000 samples at 5 Hz) is retained in memory. Model or scale changes start a new run. Reset restores initial conditions and orientation while retaining the current geometry.

## Geometry requirements

20 MB maximum file size, 150,000 triangles maximum. Use static triangle meshes, with nonzero X/Y/Z extent and consistently outward-facing winding. STL supports binary and ASCII; OBJ imports mesh geometry without MTL dependencies. GLB must embed buffers and textures. Draco/Meshopt-compressed assets, external-resource glTF, animated skins, instanced meshes, CAD STEP/IGES and texture/material fidelity are outside this version's import support. Convert CAD files to STL first. Degenerate triangles contribute zero force. Invalid imports leave the prior model active.

## Aerodynamic model and limits

For each triangle with area A and outward normal n, with airflow u = (+1,0,0):

```
q = 0.5 × density × speed²
Cp = 2 × max(0, −n·u)²
Fpressure = −q × Cp × n × A
Ffriction = q × 0.006 × (u − (n·u)n) × A
```

Forces are summed in tunnel coordinates. Drag is +X, lift is +Y, side force is +Z. Cd and Cl divide drag and lift by q times the **unrotated X–Z bounding rectangle**; this reference stays fixed when orienting a model. Reynolds number uses X-axis physical length and fixed viscosity 1.81e−5 Pa·s. Mach uses fixed sound speed 343 m/s. Density is independently adjustable, with no temperature or altitude coupling.

This modified Newtonian-style surface approximation is an **educational estimate**, particularly at the available low speeds. It is not a CFD solver or validated aerodynamic design tool. It omits circulation, suction, boundary-layer transition, stall, separation, turbulence, compressibility and interference or shielding between panels. Concave, intersecting or internal surfaces may be overcounted. The wing preset cannot reproduce real airfoil performance. Streamlines are decorative direction cues and do not solve flow around imported geometry. Colors represent Cp, not measured pressure or a computed surrounding pressure field.

The general force normalization follows [NASA's drag equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/drag-equation/) and [lift equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/lift-equation-2/). The particular triangle coefficient and friction approximation here are not validated by those references.

## Checks

```sh
node --test tests/*.test.js
node build.js
```

Physics tests check zero-speed behavior, velocity-squared and density/area scaling, orientation symmetry and coefficient normalization. Browser checks cover the rendered interface and import/control interactions. Three.js r170 is pinned to the jsDelivr npm distribution, matching the engine templates. An internet connection is required for the initial library load. Required loaders are vendored with the MIT license. Typography uses the platform system fonts. No analytics or backend services.



## Interface design

See [DESIGN_REVIEW.md](DESIGN_REVIEW.md) for the Apple design review, changes and verification. Use the exact-value inputs beside the sliders for precise settings. Reset run offers Undo reset to restore the previous conditions and recorded data. Camera reset is animated and can be interrupted by dragging; reduced motion uses an immediate reset.


## Camera views and lessons

Use 3D, Side, Other side, Front, and Top below the viewport to align the camera. View changes preserve test orientation and forces, automatically frame the current geometry, and can be interrupted by orbiting. Camera transitions travel around the model rather than through it.

Model & methods uses native MathML with labeled equations, units and assumptions, without an external equation-rendering dependency. Lessons covers speed, orientation, scale, shape, importing geometry, and the difference between this approximation and CFD. Experiment buttons replace the test article and start a new run; export retained data first. Speed and scale comparisons hold the other conditions fixed. A cube preset provides a shape comparison with the sphere at the same bounding reference area.


## Custom airfoils and continuous airflow

Airflow is rendered as 42 continuous ribbons with highlights moving in the wind direction. Paths curve around a conservative projected bounding envelope and update with model geometry and orientation. They are a visual aid, not CFD streamlines, and do not encode a computed velocity or surrounding pressure field. Pause, zero airspeed and reduced-motion preferences stop highlight motion; Streamlines toggles the entire overlay.

Open Airfoil editor to build a custom wing. Ten handles control five shared chordwise stations on the upper and lower surfaces. Drag with pointer capture, use arrow keys (Shift for larger steps), or enter exact normalized X/Y coordinates. Shared X values remain ordered, upper and lower surfaces cannot cross, and the leading/trailing edges are fixed. Shape-preserving cubic interpolation smooths camber and thickness separately. The sampled profile is extruded in Z, centered and scaled to the Model length setting. Span/chord controls physical span.

Test this airfoil activates the editor profile; moving a point also activates it and updates the 3D model and force estimates. Each geometry change starts a new recorded run. Subsequent edits preserve your camera position. Undo shape retains up to 40 edit snapshots. Reset profile and Symmetric profile provide starting shapes; Download profile (.dat) exports normalized 2D coordinates. The force solver remains the existing educational surface-pressure approximation, without circulation or stall.
