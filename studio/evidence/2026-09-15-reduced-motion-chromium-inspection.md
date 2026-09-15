# Experience evidence — reduced-motion Chromium inspection

Date: 2026-09-15  
Role: Experience / Art / Audio Director  
Inspected accepted base: `adc11238feb9a6e0b720bc6677bbc2b8ebdc624c` (merged PR #115)  
Current composition base: `9ccf4dc259214831202b94c90b8bda164508706f` (merged PR #118)  
Runtime change in this proposal: none

## Observed evidence gap

Accepted Experience PR #91 deterministically proves that the Canvas pulse helper responds to a controlled `(prefers-reduced-motion: reduce)` media-query value, but its own truth boundary explicitly left rendered Chromium behavior uninspected. The Fresh-Player Evidence Boundary continues to identify reduced-motion browser evidence as useful Experience / QA work.

This evidence lane narrows that gap without adding a setting, new effect, mechanic, asset, dependency, or alternate presentation system.

## Method

The originating execution environment could read repository blobs through the connected GitHub surface but could not perform a fresh `git` checkout because direct `github.com` DNS/network access was unavailable. Browser navigation to local HTTP/file URLs was also blocked by the managed Chromium policy.

To tie the rendered evidence to exact source, the `index.html`, `styles.css`, and `game.js` blobs from accepted base `adc11238...` were reconstructed locally and verified against these Git blob SHAs:

- `index.html` -> `b39018e2c2fd76f7f8b46482428d5184490e1a7d`
- `styles.css` -> `f8dbb3e70b969a173b1847b8cab60d856b681887`
- `game.js` -> `7a74e91e7a17bf196eac496546929604ee8134d8`

`node --check game.js` passed on that exact inspected-base `game.js` blob.

Chromium `144.0.7559.96` rendered those exact HTML/CSS/JavaScript contents through Playwright `page.set_content`; CSS and JavaScript were inlined only to bypass the managed navigation restriction. `requestAnimationFrame` was frozen so only the deliberately chosen render-state difference could change pixels.

Two Chromium media states were exercised with `page.emulate_media`:

1. `no-preference`
2. `reduce`

Both states rendered the same active-transfer snapshot: Runner charge 50%, R1 at 20%, player touching R1, Status `TRANSFER R1`. Each media state was captured at `state.elapsed = 0` and `state.elapsed = pi / 8`.

## Evidence

### TESTED

- Chromium reported `(prefers-reduced-motion: reduce).matches === false` in the `no-preference` context.
- Chromium reported `(prefers-reduced-motion: reduce).matches === true` in the `reduce` context.
- Exact inspected-base `game.js` syntax passed `node --check`.
- Inspected base `adc11238...` had successful post-merge deterministic workflow `34923811035`.
- Current accepted `main` `9ccf4dc...` has successful post-merge deterministic workflow `34936101361` after PR #118.
- PR #118 changes controller-selection bookkeeping plus a Gameplay regression; current source inspection shows it does not modify `motionPulse`, Canvas drawing rules, `index.html`, or `styles.css`. That independence is source evidence, not a fresh current-main render inspection.

### MEASURED

Normal-motion render geometry changed across the two elapsed states on exact inspected base `adc11238...`:

- core pulse offset: `4 -> 6`
- transfer midpoint radius: `4 -> 2.5`
- transfer target-ring radius: `43 -> 41.58578643762691`
- screenshot difference: `4,553` changed pixels; bounding box `(182, 242) .. (661, 545)`

Reduced-motion render geometry remained stable across the same elapsed-state change:

- core pulse offset: `4 -> 4`
- transfer midpoint radius: `4 -> 4`
- transfer target-ring radius: `43 -> 43`
- screenshot difference: `0` changed pixels; no difference bounding box

The player-facing state stayed constant in all four captures: `50%`, `TRANSFER R1`, and semantic relay detail `R1 20%, R2 0%, R3 0%, R4 0%`.

### VISUALLY INSPECTED

**YES — on exact inspected base `adc11238...`.** The four rendered Chromium screenshots were actually viewed during the originating pass.

Observable result only:

- normal-motion captures show a changed core-halo radius and changed active-transfer pulse geometry between the two elapsed states;
- reduced-motion captures are pixel-identical across the same elapsed-state change;
- the reduced-motion captures still visibly retain the stable core halo, R1/player shapes, R1 percentage, the static transfer-target feedback around the contact, the HUD, and `TRANSFER R1` Status.

**NOT VISUALLY INSPECTED — current main `9ccf4dc...` in this recomposition pass.** PRs #116 and #118 changed focused/startup/hot-plug gamepad carryover behavior and Gameplay regressions rather than the reduced-motion drawing helpers, but that source-level distinction is INFERRED and must not be relabeled as a fresh current-main render inspection.

No aesthetic-quality claim is made from this inspection.

### PLAYTESTED

NOT TESTED. This was a controlled render inspection, not an interactive session or human accessibility evaluation.

## Player value

This supplies rendered-browser evidence that the accepted reduced-motion path removed the covered continuous size oscillation while retaining static state cues in the inspected active-transfer snapshot. Keeping its exact-base provenance current reduces pressure to expand the accessibility surface speculatively before stronger real-user or OS/browser evidence exists.

## Files / systems touched

Repository delta: this evidence note only.

No runtime, HTML, CSS, tests, controls, resources, geometry, balance, audio, external asset, package, network dependency, game identity, or studio-state fact is changed.

## Truth boundary

This is **browser-render evidence under Playwright media emulation on exact accepted base `adc11238...`**, not proof that a user's real operating-system preference propagates correctly through every browser/OS combination.

It does not establish:

- that current main `9ccf4dc...` was freshly re-rendered under reduced motion in this recomposition pass;
- comfort or suitability for a person who relies on reduced motion;
- accessibility quality;
- screen-reader behavior or nonvisual spatial understanding;
- cross-browser parity;
- fresh-player comprehension;
- balance, fairness, tension, subjective control feel, polish, or fun.

Because managed navigation was blocked in the originating pass, it also does not re-prove external-file loading or normal local-server navigation; earlier browser evidence covers ordinary load/render separately. The inspected render used exact repository source blobs inlined into one Chromium document solely to bypass that environment restriction.

## Known limitations

- Chromium only; no Firefox/Safari/WebKit observation.
- Browser media preference was explicitly emulated rather than inherited from an actual OS setting.
- One controlled active-transfer snapshot was inspected, not every possible gameplay state.
- Current main `9ccf4dc...` was not freshly rendered in this recomposition pass.
- No person who relies on reduced-motion preferences evaluated it.
- The screenshots and exact Playwright/pixel-diff harness were local inspection artifacts and are not durable repository evidence; the recorded `4,553` / `0` pixel counts therefore cannot be independently replayed from this repository alone.

## Dependencies / provenance

No external creative asset was imported. The rendered visuals are entirely the repository's existing procedural Canvas/UI output. Chromium and Playwright were verification tools only and are not runtime dependencies.

## Overlap check

The originating pass began from accepted main `adc11238...`. A search-index timing lag initially hid draft Gameplay PR #116, which had already been created. That discrepancy was recorded rather than silently erased.

PR #116 later landed, followed by Gameplay PR #118. #118 records a `null` gamepad-selection baseline only when focused startup actually observes no standard controller, then adds one deterministic hot-plug regression. Neither #116 nor #118 changes `motionPulse`, the Canvas drawing rules, HTML, CSS, audio, or creative assets, so those gameplay lanes remain semantically distinct from this reduced-motion evidence lane.

This evidence branch is recomposed onto current main `9ccf4dc...` while preserving the Chromium measurements as historical provenance tied to exact inspected base `adc11238...`. It does not claim that historical screenshots are current-main screenshots.

Historical `experience/reduced-motion-verification` / PR #91 protects the deterministic media-query contract; this lane remains materially different because it records actual Chromium rendered-output evidence rather than another deterministic assertion.

## Suggested next lanes

A materially stronger reduced-motion step would be actual OS/browser preference propagation and, ideally, feedback from a person who relies on reduced-motion preferences. If independent long-term replay of this exact Chromium observation becomes important, preserve a minimal render/diff harness and/or captures as evidence artifacts rather than expanding runtime code. A fresh render inspection on a later runtime is useful when that runtime changes relevant presentation behavior or when a review specifically requires current-head render evidence. No broader animation/settings feature follows automatically from this evidence.
