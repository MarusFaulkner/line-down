# Quality Rush: Line Down!

A 2½-minute maintenance arcade game starring **Mike Maintenance**. Four machines, one technician. Catch failures on their yellow warning, lock out before you touch anything, pick the right tool for the symptom, and keep the line running.

Part of the **Quality Rush** series by Marcus Faulkner, alongside [Defect Runner](https://marusfaulkner.github.io/quality-rush/), [Quality Quest](https://marusfaulkner.github.io/quality-quest/) and [Quality Showdown](https://marusfaulkner.github.io/quality-showdown/).

## How to play

| Action | Phone | Keyboard / mouse |
|---|---|---|
| Go to a machine | Tap it | Click it, or ← → |
| Jump an oil spill | Swipe up or tap **Jump** | Space or ↑ |
| Lockout/tagout | Tap **Lockout** | L |
| Pick a tool | Tap the tool | 1–4 |
| Repair | Tap **Repair!** fast | Space |
| Pause | Pause button | P or Esc |

Every repair follows the same order: **lock out → choose the tool → repair**.

- **Yellow light:** the machine is about to fail. Fix it now for a preventive-maintenance bonus.
- **Red light:** it's down and downtime is ticking. Three machines down at once and the line goes down.
- **Safety strike:** using a tool before lockout. Three strikes stops the shift.
- **Hazards:** jump oil spills; stand still and let forklifts pass.

| Tool | Symptom |
|---|---|
| Wrench | Loose bolts, mounts, fittings, rattling |
| Multimeter | No power, sensor or signal faults |
| Grease gun | Squealing, grinding, running dry |
| Spare part | Broken, stripped or worn-out parts |

The shift report scores your **uptime** (availability, the first factor of OEE), preventive vs. breakdown fixes, unplanned downtime, safety strikes and tool accuracy, and gives you a rank from Apprentice to **Reliability Champion**.

## Run it locally

No build step. Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server
```

## Tech

Plain HTML, CSS and JavaScript. Canvas for the factory floor, Web Audio for the synthesized music and sound effects. Artwork was generated with AI and cut out for the game.

## Disclaimer

A game, not safety or maintenance training. Follow your site's lockout/tagout procedure.

© 2026 Marcus Faulkner · Quality Rush · Mister Quality™
