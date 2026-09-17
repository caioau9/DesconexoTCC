DESCONEXO MVP v6.0.0

This is a complete architectural rebuild from Batches 1-3.

Implemented distribution:
- Floor 1: kitchen northwest, corridor below kitchen, pantry southwest, Bathroom 1 south-center, living room across the east side.
- Floor 2: parents bedroom northwest, Sala 2 northeast and center, parents closet southwest, Bathroom 2 south-center, protagonist bedroom southeast.
- Parents closet is reachable only through the locked parents bedroom.
- Main entrance is permanently locked.
- Dirty opaque windows are installed on all referenced facades.
- Interior doors are aligned with their walls.
- Physical switchback staircase includes lower flight, intermediate landing, reverse upper flight.
- Furniture uses collision boxes generated with visible geometry.
- Diary is a book and visible page.
- Medication is in Bathroom 2.
- TV sequence starts automatically in the first-floor living room.
- P toggles development fly mode.

RUN
py -m http.server 8080
Open http://localhost:8080
Press Ctrl+F5 and choose RESET SAVE.
