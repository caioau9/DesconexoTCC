DESCONEXO MVP v4.1.0

FIXES
- Removed the two-ellipse eye overlay completely.
- Added one subtle, image-based radial vignette rendered through Babylon GUI.
- Normal vignette is intentionally faint; distorted state is stronger but still transparent.
- Added collision rectangles for beds, shelves, counters, sinks, sofa, wardrobe, and television.
- Added visible door leaves at room openings.
- Corrected the protagonist bedroom door position and collision opening.
- Added a locked parents room door and blocking collider.
- Corrected the television orientation so the screen faces the living room.
- Bathroom doorway positions remain open and traversable.
- Collision tests include architectural walls and furniture obstacles.
- Active floor filtering remains enabled.

RUN
py -m http.server 8080
Open http://localhost:8080
Press Ctrl+F5 after replacing files.
