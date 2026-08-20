# DESCONEXO 3D Browser MVP

A small, playable vertical slice based on the supplied GDD. It keeps the 3D first-person concept and implements the opening progression with geometric placeholder assets.

## Included

- First-person WASD and mouse-look navigation
- Collision and a compact 3D house blockout
- Interaction ray and context prompts
- Wedding album and key pickup
- Locked bedroom door
- Diary note overlay
- Bathroom medicine interaction
- Living-room television event
- Normal/distorted lighting states
- Return-to-medicine objective
- Local save and reset

## Run

Because the game loads Babylon.js from its official CDN, use an internet connection and a local HTTP server.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in a desktop browser.

## Controls

- WASD: move
- Mouse: look
- E: interact
- Esc: release pointer lock

## Intended critical path

1. Inspect the album beside the bed.
2. Take the key.
3. Unlock the bedroom door.
4. Read the diary page on the landing table.
5. Inspect the medicine in the bathroom alcove.
6. Descend to the living room and watch the television.
7. Return to the bathroom and take the medicine.

## Notes

This is an MVP, not a production build. Models, textures, audio, animation, level layout, accessibility, and narrative presentation are placeholders. The next production step would be replacing blockout geometry with optimized GLB assets while keeping the gameplay systems intact.
