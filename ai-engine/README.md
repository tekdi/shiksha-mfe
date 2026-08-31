# LMS AI Engine

A local-first, **LMS-agnostic** service that turns documents, slides, audio and
video into structured, interactive micro-learning — emitted as portable open
standards (**H5P / SCORM / xAPI** + JSON) so any LMS can consume it.

Inference goes through an **OpenAI-compatible model interface**, so it can run
against a local [Ollama](https://ollama.com) (the default — offline, no keys) or
a hosted provider during development, and move to **self-hosted** open models for
production (Llama 3, Whisper) without changing the pipeline. See
[`docs/adr/0002`](docs/adr/0002-hosted-model-apis-for-development.md).

> Implements [tekdi/shiksha-mfe#7](https://github.com/tekdi/shiksha-mfe/issues/7).
> See [`docs/adr/0001-standalone-lms-agnostic-engine.md`](docs/adr/0001-standalone-lms-agnostic-engine.md)
> for why this is standalone.

## Modules (per the project plan)

| Module | Scope |
|---|---|
| **A — Document Ingestion** | PDF, PPTX, DOCX, CSV, TXT, Markdown, HTML → structured JSON; summaries, glossary, narration scripts |
| **B — Assessment Suite** | MCQ / match-the-pair / fill-in-the-blanks → H5P + SCORM |
| **C — Multimedia Intelligence** | Whisper transcription, chaptering → H5P Interactive Video |
| **D — Micro-Learning Studio** | Assemble H5P / SCORM / HTML5 lessons; tenant branding; review gate |

Phase 1 was the FastAPI gateway and system probes. **Module A.1** (document
ingestion — PDF, PPTX, DOCX, CSV, TXT, Markdown and HTML into one structured
JSON shape, exposed at `POST /ingest`) is built on top of it. **Module A.2**
(summarisation) adds a layer over a parsed document, deriving a summary, key
takeaways, a glossary, and a course outline via a configurable OpenAI-compatible
model gateway, exposed at `POST /summarize` and `POST /summarize/file`. **Module
A.3** (narration) turns the same parsed document into a spoken `NarrationScript`
— one speakable segment per slide or section, each with a word count and duration
estimate — exposed at `POST /narrate` and `POST /narrate/file`.

**Module B** (assessment) turns a parsed document into a source-grounded
`AssessmentSet` — multiple-choice, match-the-pair, fill-in-the-blank, and
short-answer questions — exposed at `POST /assess` and `POST /assess/file`. Every question is
verified against the source and dropped if it cannot be grounded, so nothing is
hallucinated. The contract is neutral: it carries stable ids and structured
answers so it can be packaged as an H5P Question Set and a SCORM 1.2 course —
both of which now ship — and, later, as xAPI statements, without changing shape. See
[`docs/adr/0003`](docs/adr/0003-neutral-assessment-contract-and-grounding.md).

**Module B packaging** turns that `AssessmentSet` into an **H5P Question Set**
(`.h5p`) at `POST /assess/h5p` and `POST /assess/h5p/file`. Multiple-choice maps
to `H5P.MultiChoice`, fill-in-the-blank to `H5P.Blanks`, and match-the-pair to
`H5P.DragText` (H5P has no first-class matching type; Drag Text's gaps and
distractors express one cleanly). The rubric — per-question points, a mastery
threshold, and score bands — rides along, and LaTeX renders through H5P's
MathDisplay. The emitter is pure Python and writes the ZIP directly; see
[`docs/adr/0004`](docs/adr/0004-pure-python-h5p-packaging.md).

**Teacher controls** over the packaged quiz, both asked for by the mentors.
`solution_visibility` decides when a learner may see the correct answers — `always`,
`after_submission`, or `never` — and `time_limit_seconds` puts a countdown on the
whole attempt. Both are fields on the `AssessmentSet`, so a caller running the
two-step flow can set them while reviewing the questions, and both are query
parameters on every route that generates, so the one-call routes can set them too.

They land differently in the two targets, because the targets differ. H5P Question
Set has three real fields for answer visibility and **no timer of any kind** — that
was verified against the shipped `semantics.json` of all seven content types rather
than assumed — so a time limit on an H5P package is reported as unsupported in the
warnings instead of being written to an invented key that the validator would drop
in silence. SCORM carries its own player, so both controls work there: the deadline
is stored as an instant in `cmi.suspend_data` and survives the learner closing the
tab, and running out of time reports `cmi.core.exit` as `time-out`.

**Short answers** are the one type a learner writes in their own words. Because a
packaged quiz runs inside the LMS with no model available, they are marked by a
**points-based mark scheme** — two to four key points, each detected by exact,
case-insensitive phrase matching, each phrase quoted from the source. That is
automated marking of a real assessment instrument, not an essay grader: it does not
judge reasoning or coherence, so a learner who is correct in entirely different
words scores zero, and the results screen shows them which points were found and
the full model answer. The limits and why they are unavoidable are set out in
[`docs/adr/0006`](docs/adr/0006-short-answer-questions.md).

> **Prerequisite for import:** the target LMS must have the H5P content types
> installed (in Moodle: *Site administration → H5P → Manage H5P content types*),
> and MathDisplay enabled if your questions use LaTeX. The package declares its
> dependencies rather than bundling several MB of libraries into every file; the
> versions it targets are pinned in
> [`app/packaging/h5p/versions.py`](app/packaging/h5p/versions.py).

The same assessment also packages as a **SCORM 1.2** course at `POST /assess/scorm`
and `POST /assess/scorm/file`, importable into Moodle 4.x and Open edX. Where an
H5P package ships content and the LMS supplies the player, a SCORM package **ships
its own player** and the LMS supplies only a JavaScript API to report through — so
it needs no prerequisites at all, and it honours per-question `points` exactly
(H5P has no per-question weight and scores on its own scale). Multiple-choice,
match-the-pair and fill-in-the-blank are reported as `cmi.interactions`, which
Moodle surfaces in its Interactions report. LaTeX is shown as source rather than
typeset — a SCORM package would have to carry its own maths renderer, which is
tracked separately. See
[`docs/adr/0005`](docs/adr/0005-scorm-12-packaging.md).

**Module C** (multimedia intelligence) starts where a document ends: a recording.
`POST /transcribe` turns an audio or video upload into a **time-aligned
transcript**, rendered as WebVTT or SRT subtitles or plain text, through the same
OpenAI-compatible contract the text models use — the audio endpoint is
`/audio/transcriptions`, which Groq serves with `whisper-large-v3` and a local
`faster-whisper` serves identically. See
[`docs/adr/0007`](docs/adr/0007-transcription-provider-strategy.md).

`POST /chapter` divides that transcript into **titled, timed chapters**. The
division is deterministic — Python walks the transcript's own segment timings and
breaks at a natural pause once a chapter has run long enough — and the model only
writes the headings, because a model asked for timestamps invents them. See
[`docs/adr/0008`](docs/adr/0008-auto-chaptering.md).

`POST /interactive-video` composes the two into an **`H5P.InteractiveVideo`**: the
chapters become marks on the player's navigation bar, and each one ends with a
knowledge check that pauses the video. The questions come from the *existing*
assessment pipeline — every chapter is handed to it as its own small document — so
the grounding gate and the question-to-H5P mapping are shared rather than written
twice. The media is referenced by URL rather than bundled, which is what H5P's own
published content does and what keeps a lecture recording under an LMS upload
limit. `POST /interactive-video/file` runs the whole chain from one upload. See
[`docs/adr/0009`](docs/adr/0009-interactive-video-packaging.md).

**Module D.1** opens the Micro-Learning Studio. `POST /micro-lesson` turns a source
into a `MicroLesson`: a short, ordered sequence of steps, each with a heading, a few
on-screen points and the notes a teacher would say over them. Three sources are
accepted, which is what issue #7 asks for — a parsed document, a chaptered
recording, or pasted text — and each has its own endpoint rather than one route
with a mode flag.

The number of steps is computed, never generated: a document splits at its
headings, a transcript at its chapters, pasted text at its blank lines, so the same
input always produces the same lesson shape. The model writes only the words inside
each step, and the author's own heading always wins over the model's. Every step
carries the page or chapter it came from, so a reviewer can ask where a line came
from and get an answer. A section the model returns nothing for falls back to its
own source text and says so; a step the model invents for a section that does not
exist is discarded. See [`docs/adr/0011`](docs/adr/0011-micro-lesson-structure.md).

**Module D.2** turns that lesson into something a learner can open. The same
`MicroLesson` is packaged three ways, because the three answer different questions.
`POST /micro-lesson/h5p` emits an **H5P Course Presentation** — one slide per step,
which is what a Moodle or Sunbird teacher expects and what an LMS knows how to
render. `POST /micro-lesson/html5` emits **one self-contained HTML file**: no LMS,
no unzipping, nothing fetched from the network, so it opens on a machine with no
internet. `POST /micro-lesson/scorm` emits a **SCORM 1.2 course**, the only one of
the three that reports back — the LMS learns who opened the lesson and how far they
got. Each has a `/file` variant that goes from upload to package in one call.

The HTML5 file and the SCORM course share one renderer, so they cannot drift into
looking different; SCORM adds only an API wrapper and a reporting script that
listens on the single hook the deck exposes. That reporting is deliberately
narrower than the assessment package's: **no score is written at all**, because a
lesson asks nothing and 0 out of 0 is a zero rather than an absence, which more
than one LMS renders as a failed attempt. Completion means the last slide was
reached, and `lesson_status` only ever moves `incomplete` → `completed`.

H5P Course Presentation has **no speaker-notes field**, verified against the
package the Hub serves. The generated notes go in the element's Comments field,
which the runtime turns into a button on the slide — and the flag that builds that
button is named `alwaysDisplayComments`, which controls the *button*, not the text.
See [`docs/adr/0012`](docs/adr/0012-micro-lesson-packaging.md).

**Both packages have been imported into a real Moodle 4.5**, not only into a test
harness. The SCORM course played inside Moodle against its own JavaScript API,
moved the learner from `incomplete` to `completed` on reaching the last slide, and
appears in Moodle's own attempt report. The H5P package imported cleanly and Moodle
then listed the libraries it needs — naming exactly the six the manifest declares,
including `H5P.Transition`, which Course Presentation does **not** declare directly
and which only a transitive walk of the dependency tree finds. That is independent
confirmation the manifest is complete.

## Requirements

- Python 3.11+ (developed on 3.12)
- An OpenAI-compatible model endpoint — either a local [Ollama](https://ollama.com)
  with `llama3.2:3b` (the default), or a hosted provider such as Groq (configure
  `AI_ENGINE_LLM_*`; see [`.env.example`](.env.example))

## Run it

In a container, which is one command and needs no Python on the host:

```bash
cd ai-engine
cp .env.example .env           # then put a model API key in it
docker compose up
```

`docker compose up` returns once the service can actually answer, not merely once
the port is open — the health check asks the application rather than the socket.
The image is 111 MB, starts in about three seconds, runs as a non-root user and
runs with a read-only root filesystem.

Or directly, which is what you want while developing:

```bash
cd ai-engine
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"        # or: pip install fastapi "uvicorn[standard]" pydantic-settings httpx pytest

cp .env.example .env           # optional; defaults already match the dev setup
uvicorn app.main:app --reload --port 8000
```

Then:

- `GET /health` — liveness (no dependencies touched)
- `GET /ready` — readiness (checks the configured model gateway is reachable)
- `POST /ingest` — parse a document (PDF, PPTX, DOCX, CSV, TXT, Markdown, HTML) into structured JSON
- `POST /summarize` — derive insights from an already-parsed document
- `POST /summarize/file` — parse a document and derive insights in one call
- `POST /narrate` — derive a spoken narration script from an already-parsed document
- `POST /narrate/file` — parse a document and derive a narration script in one call
- `POST /assess` — generate a source-grounded assessment from an already-parsed document
- `POST /assess/file` — parse a document and generate an assessment in one call
- `POST /assess/h5p` — package an assessment as an H5P Question Set (`.h5p`)
- `POST /assess/h5p/file` — parse, generate and package in one call
- `POST /assess/scorm` — package an assessment as a SCORM 1.2 course (`.zip`)
- `POST /assess/scorm/file` — parse, generate and package as SCORM in one call
- `POST /transcribe` — transcribe an audio or video upload (JSON, WebVTT, SRT or plain text)
- `POST /chapter` — divide a transcript into titled, timed chapters
- `POST /chapter/file` — transcribe a recording and chapter it in one call
- `POST /interactive-video` — package a chaptered transcript as an H5P Interactive Video (`.h5p`)
- `POST /interactive-video/file` — transcribe, chapter, generate checks and package in one call
- `POST /micro-lesson` — build a micro-lesson from a parsed document
- `POST /micro-lesson/file` — parse an upload and build a micro-lesson in one call
- `POST /micro-lesson/transcript` — build a micro-lesson from a chaptered recording
- `POST /micro-lesson/text` — build a micro-lesson from pasted text
- `POST /micro-lesson/h5p` — package a micro-lesson as an H5P Course Presentation (`.h5p`)
- `POST /micro-lesson/h5p/file` — parse an upload, build a lesson and package it as H5P in one call
- `POST /micro-lesson/html5` — package a micro-lesson as one self-contained HTML file
- `POST /micro-lesson/html5/file` — parse an upload, build a lesson and return one HTML file in one call
- `POST /micro-lesson/scorm` — package a micro-lesson as a SCORM 1.2 course (`.zip`)
- `POST /micro-lesson/scorm/file` — parse an upload, build a lesson and package it as SCORM in one call

**Module E — the whole pipeline in one call (week 11).** Every module above answers
one question; these answer all of them at once. A stage that cannot run is reported
rather than fatal, so a document that supports no question still yields its lesson.

- `POST /course/file` — run every module over one upload and return the course, with a report on each stage
- `POST /course/text` — build a course from pasted notes (only the lesson can run; the rest report why)
- `POST /course/bundle/file` — the same, returned as one archive an LMS can be handed
- `POST /course/bundle` — package a course that was already built, after a teacher has edited it
- `GET /` — service banner
- `GET /docs` — interactive API docs

## Test

```bash
pytest
```

The whole suite runs offline. Every model and speech-to-text call is mocked, so it
needs no API key, cannot be broken by a provider being down, and costs nothing to
run. Keep it that way: a test that needs a live key belongs behind a marker.

For coverage:

```bash
pytest --cov
```

Coverage is measured by **branch**, not by line, and the threshold lives in
`pyproject.toml` so the command means the same thing locally and in CI. The reason
for branch coverage is that most of what this engine promises is about the path
*not* taken — a question dropped for not being grounded in the source, a warning
raised where a target format cannot express something, a step falling back to its
own text when the model returns nothing. Line coverage counts those branches as
covered the moment the happy path runs through them, which is precisely the case
where the guarantee is untested.

`tests/test_grader_parity.py` is the exception: it runs our short-answer matcher
against a verbatim transcription of H5P's own, under `node`, and skips rather than
fails where node is absent.

[`.github/workflows/ai-engine.yml`](../.github/workflows/ai-engine.yml) runs the
same command on every pull request that touches `ai-engine/`, against Python 3.11
and 3.12 — the floor `pyproject.toml` declares and the version this is developed
on, so the declared floor cannot quietly rot.

Dependencies there come from [`requirements-ci.txt`](requirements-ci.txt), which
pins exact versions with hashes and is installed with `--require-hashes
--only-binary :all:`. The engine itself is not installed in CI: `pythonpath` above
means `app` imports from the source tree, so an editable install would neither
make the tests run nor exercise the wheel's package data. Locking matters for a reason that is not only about
security: without it CI installs whatever is newest that day, so the code under
test changes while the code in the repository does not, and a build goes red for a
change nobody made. Refusing source distributions matters because installing from
source runs the package's own setup script on the runner. Regenerate the file the
way its header describes — inside a Linux container, so the resolution matches the
runner rather than whatever a developer's laptop happens to resolve.

To check a deployment rather than the code — that the image was built from the code
you think, that configuration reached it, and that every route answers from wherever
it is running:

```bash
python -m scripts.smoke --base-url https://engine.example.org
```

It walks every endpoint the running service advertises, taking the list from the
service's own schema so a route with no check is reported rather than quietly passing.

Running it in production, what to watch when it misbehaves, and how a tenant puts
the output into Moodle or Sunbird: [`docs/deployment.md`](docs/deployment.md).

Every acceptance criterion in the project ticket, against the code that meets it, the
endpoint that exposes it and the tests that hold it:
[`docs/acceptance.md`](docs/acceptance.md).

## Benchmarks

```bash
python -m benchmarks.run --offline    # no model calls, no cost
python -m benchmarks.run              # everything, including live model calls
```

Separate from the test suite, because these reach a live provider and cost real
calls. Every run splits its time into **engine time** — parsing, grounding,
validation, packaging — and **provider time** spent waiting on the model gateway,
measured at the HTTP transport so nothing instruments the shipped path.

The headline result is that engine time stays between 79 and 180 milliseconds
whatever the document size, which is under 1% of the wall clock; a 60-page PDF is
parsed into structured content in under a second, and packaging a lesson costs
microseconds. Capacity planning for this service is therefore about concurrent
waiting and provider rate limits, not about CPU.

Every run records the machine's load average beside its figures, because a CPU
measurement without the conditions it was taken under is not reproducible — the same
document measured 435 ms on an idle machine and 843 ms on a loaded one.

Measured figures, the method behind them, and what is deliberately *not* measured
are in [`docs/benchmarks.md`](docs/benchmarks.md).

## Configuration

All settings are environment variables prefixed `AI_ENGINE_` (or a local
`.env`). [`.env.example`](.env.example) carries the ones you are expected to set;
`app/config.py` is the complete list, and every field there is overridable with the
same `AI_ENGINE_` prefix.
