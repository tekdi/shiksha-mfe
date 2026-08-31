# Deploying the engine, and putting its output into an LMS

Two audiences. The first half is for whoever runs the service; the second is for
whoever takes what it produces and puts it in front of learners. They are usually
different people, and the second half needs nothing from the first.

---

## Part 1 — Running it

### The short version

```bash
cp .env.example .env      # then put a model API key in it
docker compose up
```

`docker compose up` returns once the service can actually answer, not merely once the
port is open — the health check asks the application.

### What you are running

One stateless HTTP service. No database, no cache, no queue, no volume. Every request
carries its own input and the reply carries the whole result, so there is nothing to
persist and nothing to back up. Scaling means running more replicas behind whatever
load balancer you already have.

Measured on the image built from this repository:

| | |
|---|---|
| Image size | 110 MB — what a registry stores and `docker save` produces. `docker images` reports ~424 MB, which is the expanded on-disk footprint including base layers |
| Time from `docker run` to healthy | ~3 s |
| Runs as | `engine`, uid 10001, never root |
| Root filesystem | read-only; only `/tmp` is writable, for streamed uploads |
| System packages required | none — every dependency ships as a wheel |

### Without Docker

The image is a convenience, not a requirement. The service is an ordinary ASGI
application:

```bash
python -m venv .venv && . .venv/bin/activate
pip install -e ".[spelling]"
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Nothing in the engine knows whether it is in a container.

### Configuration

Environment variables only, all prefixed `AI_ENGINE_`, and the container is
configured exactly the same way as a bare process — there is no container-specific
mechanism that could drift. [`.env.example`](../.env.example) carries what you are
expected to set; `app/config.py` is the complete list and every field there is
overridable.

The settings that decide behaviour in production:

| Variable | What it does |
|---|---|
| `AI_ENGINE_LLM_BASE_URL` | Any OpenAI-compatible gateway — a hosted provider, or your own self-hosted models |
| `AI_ENGINE_LLM_MODEL` | The model to ask for. Pin it; a provider retiring a model is a real event |
| `AI_ENGINE_LLM_API_KEY` | Omit for a local gateway that needs none |
| `AI_ENGINE_LLM_FALLBACK_BASE_URL` | A second gateway, used when the first cannot serve at all |
| `AI_ENGINE_MAX_SOURCE_CHARS` | How much of a document reaches the model. Larger costs more per request |
| `AI_ENGINE_MAX_UPLOAD_BYTES` | Refused before anything is parsed |

Nothing about the engine is tied to one vendor: text generation and speech-to-text
both go through the same OpenAI-compatible contract, so moving from a hosted provider
to self-hosted open models is configuration rather than a code change.

### Health, readiness, and the difference

Two endpoints, and conflating them is the usual cause of a bad deploy.

| | Answers | Use it for |
|---|---|---|
| `GET /health` | Is the process alive? | Liveness probes, restart policy |
| `GET /ready` | Can it actually serve? Reaches the model gateway | Readiness probes, load-balancer membership |

With no key configured, `/health` returns `200` and `/ready` reports
`{"ready": false, "components": {"llm": "unreachable"}}`. That is the correct answer,
not a fault: the process is fine and cannot do its job. Routing traffic to it on the
strength of `/health` alone is what produces a deploy that looks green and fails every
request.

### What to expect when things go wrong

The engine is explicit about failure rather than silent, and the shapes are worth
knowing before you meet them at 2am.

**A stage fails, the course still comes back.** A `200` from `/course/…` means the
build ran and reported — not that everything succeeded. Read `stages[]`: each one is
`produced`, `skipped` or `failed`, and a failure carries the reason. Alerting on
status codes alone will miss this by design.

**The primary gateway is rate-limited or down.** If a fallback is configured it takes
over and the log says so. This is normal under load rather than an incident: a
benchmark run of nine back-to-back course builds triggered it, and every build still
completed.

**A model is retired.** A provider withdrawing a model is treated as the gateway being
unable to serve, not as a bad answer, so the fallback engages immediately instead of
retrying something that can never work. Re-pin `AI_ENGINE_LLM_MODEL` when it happens.

**A document is larger than the limits.** It is capped, and every cap produces a
warning naming the stage:

```
documentinsights: Source text was truncated to 24000 characters before summarising.
microlesson:      Document had 176 sections; used the first 40.
```

Nothing is truncated silently. If you see these often, raise `MAX_SOURCE_CHARS` or
split the document.

### What to watch

In rough order of how much it will tell you:

1. **`stages[].outcome`** across recent builds — a stage failing consistently is a
   real signal; the HTTP status will not show it.
2. **Fallback engagement** in the logs — occasional is fine, constant means the
   primary is not sized for your load.
3. **`/ready`** — flapping means the gateway is unstable.
4. Latency, knowing that [almost all of it is the provider](benchmarks.md) and under
   1% is this service.

---

## Part 2 — Putting the output into an LMS

The engine is deliberately LMS-agnostic: it produces standard formats and connects to
nothing. That is what lets one engine serve Moodle, Sunbird, or anything else a tenant
already runs, and it means this section is about file formats rather than integrations.

### What comes out

`POST /course/bundle/file` returns one archive. Inside:

| File | What to do with it |
|---|---|
| `lesson/lesson.h5p` | Upload to an LMS that has H5P |
| `lesson/lesson-scorm.zip` | Upload as a SCORM package |
| `lesson/lesson.html` | Host anywhere, or hand it over directly — it needs no server and no internet |
| `quiz/quiz.h5p`, `quiz/quiz-scorm.zip` | The assessment, same two routes |
| `lesson.json`, `assessment.json`, `insights.json` | The data behind the packages, if you want to edit and re-package |
| `manifest.json` | What was attempted, what succeeded, what did not, and why |
| `README.txt` | The same account in plain words, for whoever opens the archive later |

### Moodle

**SCORM** is the one that reports back to a gradebook, and it needs nothing installed:
add a SCORM package activity and upload the zip. Verified against Moodle 4.5 — the
lesson plays against Moodle's own JavaScript API, moves to `completed` on the last
slide, and appears in Moodle's attempt report with its session time.

A lesson reports **no score at all**, deliberately. It asks the learner nothing, so
there is nothing to mark, and a zero is not an absence — several LMSs render zero as a
failed attempt, which would show a student who read the whole lesson as having failed
it.

**H5P** imports as a content bank item or an H5P activity. One prerequisite that is a
property of Moodle rather than of what we generate: a site administrator has to have
the relevant content types installed, the same way any H5P content requires. On import
Moodle reads the package and lists the libraries it needs — for a Course Presentation
that is six, and it derives them itself without being told.

### Sunbird

The same files. H5P and SCORM are the formats Sunbird already accepts, so the engine
needs no Sunbird-specific code — which was the architectural decision recorded in
[ADR-0001](adr/0001-standalone-lms-agnostic-engine.md). A native connector, if one is
ever wanted, is a separate layer above this service rather than a change to it.

### Anything else

If the target takes SCORM 1.2 or H5P, it takes these. If it takes neither, the
standalone HTML5 deck opens in any browser with no server, no internet and nothing
fetched from a CDN — which also matters inside an LMS, where an outbound request is
both a privacy leak and something that stops working the moment a school filters the
network.

### Editing before publishing

Every generation route has a two-step form as well as the one-call form, so a teacher
can generate, read, correct a heading, and then package the corrected version. Use
`POST /course/file` to get the course as data, edit it, then `POST /course/bundle` to
package what you edited. The one-call `/course/bundle/file` is the shortcut for when
nobody needs to look first.

---

## Verifying a deployment

After deploying, check the deployment rather than the code:

```bash
python -m scripts.smoke --base-url https://engine.example.org
python -m scripts.smoke --audio clip.mp3 --video lecture.mp4   # includes the media routes
```

It walks every endpoint the running service advertises, chaining the way a caller
does — parse a document once, then feed that result to everything that takes one, and
feed each generated artefact to the routes that package it. That exercises the round
trip as well: every object the engine returns has to be acceptable as an input again.

The endpoint list comes from the service's own `/openapi.json`, not from the script,
so a route with no check is reported as unchecked rather than quietly passing. Media
endpoints need media; without `--audio` and `--video` they report **skipped with the
reason**, because a skipped check is not a passed one.

A green test suite says the code is right. This says *this* deployment is right — that
the image was built from the code you think, that configuration reached it, and that
the model gateway is callable from wherever it is running.

## Reproducing the claims here

Every measured number in this document came from the image built out of this
repository, and can be re-measured:

```bash
docker compose up -d --wait
curl -s localhost:8000/ready
python -m benchmarks.run --offline
```

The container definition is checked by `tests/test_container.py`, which does not need
Docker: it holds the runtime lock to the dependencies the project declares, so an
image cannot quietly stop matching what the code needs.
