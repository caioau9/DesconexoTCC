DESCONEXO MVP v7.0.0

This is a clean-room rebuild. No earlier house code was reused.

Architecture
- Floor 1: kitchen northwest, corridor below, pantry southwest, Bathroom 1 south-center, living room across the east.
- Floor 2: parents bedroom northwest, Sala 2 north/east, parents closet southwest, Bathroom 2 south-center, protagonist bedroom southeast.
- Exact continuous floor slabs and partition walls generated from shared boundaries.
- Door openings are cut from those same wall definitions.
- Main entrance and parents room remain permanently locked.
- Dirty opaque windows are present on referenced facades.

Physics
- Gravity, downward velocity, terminal velocity and grounded state.
- Falling through the staircase opening is physical rather than instant.
- Stair surfaces and intermediate landing provide continuous support.
- Head bob only occurs while grounded.
- Furniture and doors have matching collisions.

Controls
WASD move; Shift run; Q focus; E interact; P fly/noclip; Space/Ctrl vertical flight.

Run
py -m http.server 8080
Open http://localhost:8080
Press Ctrl+F5 and select RESET SAVE.
