# Motion Register

A close visual reconstruction of the registration interface in the user-supplied reference video: a bright green canvas, an animated character that brings in the registration form, two name fields and a dark green NEXT button.

## Run locally

Serve the `dist/` directory with any static HTTP server. For example:

```sh
python3 -m http.server 8000 --directory dist
```

Then open `http://localhost:8000`. A server is required for loading `assets/motion.json`; opening the HTML directly with `file://` is not supported.

## Files

- `index.html`: accessible native HTML form and controls.
- `styles.css`: responsive layout matching the reference.
- `script.js`: dependency-free canvas playback, synchronized form position, validation, replay and pause.
- `assets/actor-*.webp`: transparent sprite atlases extracted from the supplied reference video.
- `assets/motion.json`: timing, positions and atlas coordinates for each frame.
- `vercel.json`: buildless static hosting configuration.

## Behavior

The entrance runs once; the character's settled gestures then loop beside the usable form. Replay repeats the entrance. Pause stops the character and form movement. The page honors the system's reduced-motion preference, handles keyboard interaction, validates both fields and displays a local success state.

This is a frontend demonstration. Form details are neither transmitted nor persisted, and completing the form does not enroll anyone in an event. The privacy dialog makes this explicit.

## Visual assets

The character's appearance and movements come from the reference supplied by the user. The original asset creator and license were not supplied. The HTML form, styles and animation synchronization are recreated source code; the original video's source code was not recovered.

## Deploy

Import this repository in Vercel with framework `Other`, no install or build command, and output directory `dist`. No environment variables, packages or backend services are required.
