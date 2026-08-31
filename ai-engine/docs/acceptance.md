# Acceptance criteria, and where each one is met

Every criterion in [issue #7](https://github.com/tekdi/shiksha-mfe/issues/7), against
the code that meets it, the endpoint that exposes it, and the tests that hold it in
place. Written so a reviewer can check a claim without reading the whole engine.

Two conventions:

* **Endpoint** — every capability is reachable over HTTP, and named here by the route
  a caller would use. Where two routes exist, the `/file` form goes from an upload to
  a finished result in one call, and the other takes an object so a teacher can edit
  before packaging.
* **Held by** — the tests that would go red if the behaviour regressed. Named
  individually where a criterion turns on one specific guarantee.

The suite is **982 tests at 93% branch coverage**, one of which needs a browser and
skips without one. Every guarantee listed here was additionally broken on purpose to
confirm its test fails — the mutation harnesses live outside the repository and are
described in each week's notes.

---

## Module A — Document Ingestion

| Criterion | Where | Endpoint | Held by |
|---|---|---|---|
| PDF and PPT, plus DOCX, CSV, TXT, Markdown and HTML, parsed into one structured JSON shape carrying headings, body text, lists, tables, images and metadata | `app/ingestion/` — one parser per format onto a single block schema | `POST /ingest` | `test_ingest.py`, `test_format_parsers.py` (13) |
| Key takeaways, glossary and a sectioned course outline generated through the model gateway | `app/summarization/` | `POST /summarize`, `/summarize/file` | `test_summarize.py` (12), `test_pipeline.py` |
| Narration script generated from speaker notes, segmented per page or slide | `app/narration/` — sectioning done in Python, the model writes only the words | `POST /narrate`, `/narrate/file` | `test_narrate.py`, `test_narration_pipeline.py` |

Seven input formats reach one contract, so every later module works on the same shape
and adding a format changes nothing downstream.

---

## Module B — Assessment Suite

| Criterion | Where | Endpoint | Held by |
|---|---|---|---|
| MCQ, Match-the-Pair, Fill-in-the-Blanks and subjective short-answer, generated strictly from source with no hallucination; the model must quote the source span, and a question whose quote is not in the document is dropped with a warning | `app/assessment/pipeline.py` | `POST /assess`, `/assess/file` | `test_is_grounded_matches_despite_formatting`, `test_is_grounded_rejects_too_short_evidence`, `test_ungrounded_question_is_dropped_with_warning`, `test_fill_blank_answer_not_in_evidence_is_dropped`, `test_wrong_section_claim_is_reattributed_to_the_real_section` |
| Rubrics: per-question points, a mastery threshold and score bands travel with the assessment | `app/assessment/schema.py` | carried on the assessment object | `test_assess_h5p_carries_a_supplied_rubric_into_the_package`, `test_assess_h5p_rejects_a_rubric_with_a_hole_in_it`, `test_computed_max_points_and_counts` |
| LaTeX in STEM questions renders via MathJax in the H5P package; markup that cannot be carried faithfully is reported rather than shown wrongly | `app/assessment/` and `app/packaging/h5p/` | `POST /assess/h5p` | `test_has_latex_detects_portable_delimiters`, `test_math_display_is_never_declared_as_a_dependency` |
| All question types packaged as valid H5P Question Set and SCORM 1.2, satisfying Moodle's SCORM data-model validation | `app/packaging/h5p/`, `app/packaging/scorm/` | `POST /assess/h5p`, `/assess/scorm` | `test_assessment_emit_h5p.py` (66), `test_assessment_emit_scorm.py` (32), `test_packaging_scorm.py` (35) |
| Short answers marked inside the LMS against a generated key-point scheme, with no model available at runtime | `app/assessment/` — the scheme is written when the question is written | inside the emitted package | `test_assessment_grading.py` (15), `test_grader_parity.py` |

The short-answer marker is checked against **H5P's own matcher**, transcribed verbatim
and run under `node`, so our marking and the LMS's agree rather than merely both
existing. Its two honest limits — a stuffed answer scoring full marks, and a correct
answer in different words scoring nothing — are named in tests rather than hidden.

Recorded decisions: [ADR-0003](adr/0003-neutral-assessment-contract-and-grounding.md),
[ADR-0005](adr/0005-scorm-12-packaging.md), [ADR-0006](adr/0006-short-answer-questions.md).

---

## Module C — Multimedia Intelligence

| Criterion | Where | Endpoint | Held by |
|---|---|---|---|
| Video and audio transcribed with Whisper, output as WebVTT, SRT and a plain-text transcript | `app/transcription/` — the audio twin of the text gateway, same contract | `POST /transcribe` | `test_webvtt_starts_with_the_header_and_uses_a_dot_separator`, `test_srt_numbers_every_cue_and_uses_a_comma_separator`, `test_an_embedded_newline_cannot_split_a_cue`, `test_transcription_pipeline.py` |
| Auto-generated timestamped chapter markers, computed from the transcript's own timings so a boundary cannot be invented; only the titles are generated | `app/chaptering/` | `POST /chapter`, `/chapter/file` | `test_chaptering_pipeline.py` (18), `test_chaptering_schema.py` |
| H5P Interactive Video with inline knowledge checks — chapters as marks on the navigation bar, a check at the end of each chapter pausing the video until answered | `app/interactive_video/` | `POST /interactive-video`, `/interactive-video/file` | `test_every_chapter_gets_its_own_knowledge_check`, `test_each_chapter_becomes_a_bookmark_at_its_start`, `test_a_question_is_placed_at_the_end_of_its_chapter_and_pauses_the_video`, `test_several_questions_on_one_chapter_do_not_stack_on_the_same_spot`, `test_interactive_video_emit.py` (40) |

The two subtitle formats differ only in a separator and a header, and feeding a player
the wrong one shows nothing at all — so both are pinned by tests rather than assumed.

Recorded decisions: [ADR-0007](adr/0007-transcription-provider-strategy.md),
[ADR-0008](adr/0008-auto-chaptering.md),
[ADR-0009](adr/0009-interactive-video-packaging.md).

---

## Module D — Micro-Learning Studio

| Criterion | Where | Endpoint | Held by |
|---|---|---|---|
| Micro-lesson generated from a document, a transcript, or free-form input | `app/microlesson/pipeline.py` — three sources onto one internal shape | `POST /micro-lesson`, `/micro-lesson/file`, `/micro-lesson/transcript`, `/micro-lesson/text` | `test_micro_lesson.py` (14), `test_microlesson_pipeline.py` (29) |
| Output formats: H5P Course Presentation, HTML5 slide deck, SCORM 1.2 package | `app/microlesson/emit/` — HTML5 and SCORM share one renderer through a single seam | `POST /micro-lesson/h5p`, `/html5`, `/scorm` and their `/file` forms | `test_microlesson_emit_h5p.py` (36), `test_microlesson_emit_html5.py` (21), `test_microlesson_emit_scorm.py` (21) |
| Generated lessons import into the LMS | verified in a real **Moodle 4.5** rather than asserted | — | `test_micro_lesson_packaging.py` (13); the import itself is recorded in [`deployment.md`](deployment.md#moodle) |
| All four modules integrated behind a single publishing workflow | `app/course/` | `POST /course/file`, `/course/text`, `/course/bundle`, `/course/bundle/file` | `test_course_pipeline.py` (19), `test_course_bundle.py` (19), `test_course_routes.py` (13) |
| QA, benchmarking, documentation and final demo | see below | — | — |

The lesson's **structure is computed, never generated**: the number of steps comes from
the document, and the model writes only the words inside them. A lesson whose shape
moved between runs would be a package whose shape moved between runs, and nothing
downstream could be asserted.

Recorded decisions: [ADR-0011](adr/0011-micro-lesson-structure.md),
[ADR-0012](adr/0012-micro-lesson-packaging.md),
[ADR-0013](adr/0013-course-orchestration-and-publishing.md).

---

## The final criterion: QA, benchmarking, documentation and demo

| | Where |
|---|---|
| **Benchmarking** | [`docs/benchmarks.md`](benchmarks.md) — measured, split into engine time and provider time, reproducible with `python -m benchmarks.run` |
| **QA** | `python -m scripts.smoke` walks every endpoint a running deployment advertises; **33 of 33 answered** against the live model |
| **Documentation** | [`README.md`](../README.md) for the service, [`deployment.md`](deployment.md) for running it and for putting its output into an LMS, thirteen ADRs for why each decision went the way it did, and this file for the criteria |
| **Deployability** | Expected Outcome 1 of #7 asks for on-premise or any cloud provider: `Dockerfile` and `docker-compose.yml`, hash-pinned, non-root, read-only root filesystem, 111 MB |

---

## Expected outcomes

| # | Outcome | Met by |
|---|---|---|
| 1 | Fully functional four-module platform, deployable on-premise or on any cloud | All four modules, plus the container above |
| 2 | Ingest a document or recording and produce a structured, interactive micro-lesson | `POST /course/bundle/file` — one upload, ten files |
| 3 | All inference through one provider-agnostic gateway, hosted or self-hosted by configuration alone | `app/summarization/llm_client.py` and `app/transcription/stt_client.py` share the OpenAI-compatible contract — [ADR-0002](adr/0002-hosted-model-apis-for-development.md) |
| 4 | Automated quiz generation packaged as H5P and SCORM | Module B above, four question types |
| 5 | Video and audio transcribed, subtitled, chaptered, and packaged as H5P Interactive Video | Module C above |
| 6 | Micro-lessons assembled from any source asset and imported into an LMS | Module D above, verified in Moodle 4.5 |

---

## Two deviations, both recorded

Stated here rather than left for a reviewer to notice.

**H5P is written directly** rather than through `h5p-nodejs-library`, and **the SCORM
runtime is implemented in-project** rather than vendored from pipwerks, which ships no
licence. Both keep the service to a single Python runtime with no Node dependency in
the image. Recorded in [ADR-0004](adr/0004-pure-python-h5p-packaging.md) and
[ADR-0005](adr/0005-scorm-12-packaging.md), and both are noted in #7 itself.

**Development runs against hosted open models** rather than a local Whisper and a local
Llama. The gateway contract is identical either way, so self-hosting is configuration
rather than a code change — which is what Expected Outcome 3 asks for. Recorded in
[ADR-0002](adr/0002-hosted-model-apis-for-development.md) and
[ADR-0007](adr/0007-transcription-provider-strategy.md).
