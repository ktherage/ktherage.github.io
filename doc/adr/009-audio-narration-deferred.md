# 009. Audio narration deferred: no acceptable French male voice

## Status

Accepted — deferred until a revisit trigger (see below) is met.

## Context

The blog should offer accessible audio narration for its 24 posts (12 English,
12 French), with read-along paragraph highlighting as a second phase. The site is
fully static (GitHub Pages), so every audio file has to be generated ahead of
time and committed under `static/`. No runtime TTS service is acceptable.

The narration has to be a **male French voice**, with prosody at least as good as
the English narration the author already approved (Kokoro `af_heart`). It also
has to survive the content: French sentences carrying English technical terms
(`Symfony`, `GitHub`, `EventSubscriber`, `code review`), version numbers
(`9.11.0`, `8.5`), plain integers (`20 ans`), and emojis that must never be
spoken. A voice that mispronounces names or numbers is worse than no narration.

Hardware available for local synthesis: 8 cores, 29 GB RAM, **no CUDA GPU**
(Intel iGPU only). The desktop already runs PhpStorm (~3.5 GB), Firefox and
Ollama during a normal session.

Phase 0 accessibility work (semantics, focus, labels, contrast) is independent
and does not depend on this decision: audio is a nice-to-have, not an RGAA
requirement.

## Stack at decision time

- PHP 8.5.4, Cecil 9.11.0, Node 22.22.1
- Symfony `http-client` 8.1.7, `symfony/yaml` 8.1.6 (`composer.lock`)
- Test harness (outside the repo, `/tmp`): Python 3.12, `kokoro` 0.9.4
  (Kokoro-82M), `misaki` 0.9.4, `torch` 2.14.1+cpu, `num2words` 0.5.14,
  `pocket-tts` 4.0.0 (Kyutai Pocket TTS, `french` and `french_24l` configs),
  `piper-tts` 1.8.0 (`onnxruntime` 1.31.0), `edge-tts` 7.3.1, ffmpeg 8.0.1
- Hardware: 8 cores, 29 GB RAM, no CUDA GPU (Intel iGPU)

## Evaluated options

| Engine                                                         | French male voice                               | Quality                         | Local cost          | Licence               | Verdict                                       |
| -------------------------------------------------------------- | ----------------------------------------------- | ------------------------------- | ------------------- | --------------------- | --------------------------------------------- |
| Kokoro 82M                                                     | none — `ff_siwis` is the only FR voice, female  | good                            | ~1× realtime CPU    | Apache-2.0            | rejected: no male voice                       |
| Piper `fr_FR-tom`, `fr_FR-upmc` (`pierre`)                     | yes, native                                     | VITS 16/22 kHz, robotic         | instant             | MIT / CC-BY           | rejected by ear                               |
| Kyutai Pocket TTS, 24 layers                                   | no native male — the 12 male voices are English | best French prosody tested      | 0.43× realtime CPU  | CC-BY-4.0             | rejected: audible English accent              |
| `edge-tts` `fr-FR-HenriNeural`, `fr-FR-RemyMultilingualNeural` | yes, native                                     | clean but "newsreader"          | remote, free        | Microsoft terms       | rejected by ear (below Kyutai)                |
| Coqui XTTS v2 (clone a FR male reference)                      | via cloning                                     | acceptable                      | ~2 GB model + torch | CPML (non-commercial) | rejected: **OOM, killed the desktop session** |
| Kyutai Pocket TTS voice cloning                                | own voice                                       | best of the lot                 | 100 M model, light  | CC-BY-4.0             | blocked: gated weights (HF terms + token)     |
| Gradium Phonon 40m FR                                          | catalogue voices                                | promising, built on Pocket TTS  | 74.6 MB, Rust, CPU  | CC BY-NC 4.0          | blocked: gated model (HF terms + token)       |
| Mistral Voxtral TTS                                            | native, cloning/voice design                    | expected best (4B, code-mixing) | remote API or GPU   | CC BY-NC (weights)    | not tested: no API key                        |

Two findings that shaped the verdict:

- The **accent is structural**. Kyutai has one native French voice (`estelle`,
  female); every male voice in its catalogue is English and is applied
  cross-lingually. No tuning fixes that.
- **Big models do not fit this machine.** XTTS v2 (~2 GB + torch) was killed by
  the OOM killer while PhpStorm, Firefox and Ollama were running; the session
  lost GNOME. Any local candidate above the 100 M scale is off the table
  without a GPU.

Text normalization was solved on the way and is reusable: digits spelled out
with `num2words` (`20` → _vingt_, `9.11.0` → _neuf point onze point zéro_),
emoji ranges stripped before synthesis, and a lexicon restricted to acronyms —
rewriting proper names (`stof`, `dunglas`, `xabbuh`) degraded the result more
than leaving them to the neural model.

## Decision

- **Do not ship audio narration now.** No `static/audio/`, no `<audio>` partial,
  no `og:audio`, no `make audio` target.
- Keep the synthesis harness out of the repository. The exploratory artifacts
  under `.tts-test/` are untracked and must be deleted before any commit that
  touches the site.
- Do not substitute a voice the author rejected (female `estelle`, Piper, or the
  Microsoft voices) to unblock the feature: narration in the wrong voice is
  worse than none for a personal site whose voice is part of the product.
- Continue phase 0 accessibility work; it is independent and unaffected.

## Consequences

- The 24 posts stay text-only. Nothing in the templates or the build changes.
- The design work is not lost: sentence-level synthesis still yields free
  timestamps for read-along highlighting, and the normalization rules above
  apply unchanged to whichever engine is eventually chosen.
- When implementation resumes it will need: a frozen engine + voice + speed, a
  lexicon YAML, a `scripts/tts/` pipeline, a `make audio` target, and a staleness
  check against `date`/`updated` in each post's frontmatter.
- Known trap for that future work: `page.audios` does **not** emit `og:audio` on
  blog posts, because Cecil overwrites the page type with `article`. The
  Open Graph audio tag will need explicit handling in
  `layouts/partials/metatags.html.twig`.
- Audio files must be referenced with `url('audio/…', {language: null})`, never
  `asset()`, which would publish a duplicate hashed copy (see ADR-008).

## Revisit triggers

Resume when **one** of these becomes true:

1. A French male voice with native accent and Pocket-TTS-level prosody ships as
   open weights.
2. A Mistral API key is available — Voxtral TTS is the preferred candidate:
   native French, code-mixing, voice design/cloning, ~$5 for the whole blog at
   $16/M characters, zero local compute.
3. The Hugging Face terms for `kyutai/pocket-tts` voice cloning are
   accepted and a 15 s recording of the author's voice exists — the lightest
   path (100 M model, CC-BY-4.0, no data leaves the machine).
4. `gradium/phonon-40m-fr` is ungated (or a token is provided) **and** the blog
   is confirmed non-commercial, since Phonon's French weights are CC BY-NC 4.0.
5. A GPU becomes available, making local cloning or a 1.6B+ model practical.
