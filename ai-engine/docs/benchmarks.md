# Benchmarks

What this engine costs to run, measured rather than estimated.

Reproduce any figure here with:

```bash
python -m benchmarks.run              # everything, including live model calls
python -m benchmarks.run --offline    # only the parts that need no model
```

Your numbers will differ, because a CPU figure depends on what else the machine is
doing and a provider figure depends on the provider. So the run these tables were
written from is committed alongside them, with every individual sample it took:
[`benchmarks/results/2026-08-27.json`](../benchmarks/results/2026-08-27.json). Any
figure below can be traced to the samples it came from, and `tests/test_benchmarks_doc.py`
checks that each one still matches — a performance claim is the easiest kind to get
wrong by hand, and nothing else in a document goes red when it drifts.

## How to read these

**Total wall-clock time is not a useful number on its own.** Most of it is a hosted
model answering over the internet, which describes the provider and the network rather
than this code. Every measurement is therefore split in two:

| | what it is | who controls it |
|---|---|---|
| **Engine time** | parsing, sectioning, grounding, validation, packaging, zip | this service |
| **Provider time** | waiting on an HTTP call to the model gateway | the provider, the network, the model |

Engine time is what a tenant sizes a server against, and it is the only half that
stays the same when an operator swaps providers or self-hosts a model.

The split is measured at the HTTP transport rather than by timing code inside the
pipeline. That puts no instrumentation in the shipped path, and it counts every call
including retries the caller never sees.

Medians, with the range beside them. One slow call to a shared free tier drags a mean
somewhere misleading, and hiding that variance behind a single number would
misrepresent what a tenant should expect.

Engine time is the **median of the per-run differences**, not the difference of the two
medians. Those are not the same number and the second is not meaningful — the slowest
total and the slowest provider call need not come from the same run, so subtracting one
median from the other can attribute a provider hiccup in one run to engine work in
another. It once reported 1.59 s of engine time for a run whose real figure was 87 ms.

**Every run records the machine's load average beside its figures**, and the report
says so when the machine was busy. A CPU measurement without the conditions it was
taken under is not reproducible: the same 60-page document measured 435 ms on an idle
machine and 843 ms on a loaded one, and a reader had no way to know which they were
looking at. The figures below are the loaded ones — the conservative case.

## The documents

Generated to order, structured like a real teaching document — headings, paragraphs,
sections ending where a teacher would end them — and byte-identical on every machine,
so a figure measured today is comparable with one measured next month.

| Size | Pages | Sections | Words |
|---|---|---|---|
| Small | 2 | 4 | 606 |
| Medium | 20 | 58 | 8,498 |
| Large | 60 | 178 | 26,066 |

The large one is deliberately well past everyday use, so these figures describe the
engine at its heaviest rather than at its most flattering.

## Ingestion — no model involved

Turning a PDF into structured content: pages, headings, and the text beneath each.

| Document | Median | Range |
|---|---|---|
| 2-page | 24 ms | 22–25 ms |
| 20-page | 285 ms | 277–349 ms |
| 60-page | 843 ms | 833–851 ms |

Roughly linear in page count, at about **14 ms per page** under load. On an otherwise
idle machine the same documents measured 11 ms, 142 ms and 435 ms — about 7 ms a page.
Either way a sixty-page chapter is structured in under a second.

## Packaging — no model involved

Writing a finished lesson out in each of the three formats. One twelve-step lesson,
which is a long micro-lesson.

| Format | Median | Output |
|---|---|---|
| H5P Course Presentation | 493 µs | 2.0 KB |
| Standalone HTML5 deck | 43 µs | 11.2 KB |
| SCORM 1.2 course | 631 µs | 6.7 KB |

Microseconds. Packaging is not a cost worth planning for.

## End to end — where the time actually goes

One upload through every stage, the way `POST /course/file` runs it.

| Document | Total | Engine | Provider | Range |
|---|---|---|---|---|
| 2-page | 15.99 s | 180 ms | 15.81 s | 15.52–40.37 s |
| 20-page | 35.70 s | 85 ms | 35.61 s | 31.91–166.14 s |
| 60-page | 31.27 s | 79 ms | 31.19 s | 30.05–31.74 s |

**Engine time stays between 79 and 180 milliseconds regardless of document size —
under 1% of the wall clock.** Everything else is the model.

Two consequences worth stating plainly:

* Capacity planning is about **concurrent waiting**, not CPU. A server running this
  spends its time idle on network calls, so it is bound by the provider's rate limits
  and by how many requests it may have in flight, not by cores.
* Making the engine faster would not move the total. If a deployment needs a faster
  answer, the lever is the model and where it runs, not this code.

### Why the 60-page document is not slower than the 20-page one

Because the input is bounded before generation, and **the engine says so**. A document
larger than the configured limits is capped at `max_source_chars` (24,000) and
`MAX_STEPS` (40 sections), and every cap produces a warning naming the stage it came
from:

```
documentinsights: Source text was truncated to 24000 characters before summarising.
microlesson:      Document had 176 sections; used the first 40.
assessment:       Document had 60 sections; used the first 40.
```

That is the design working, not a measurement artefact. A silent cap would make a
sixty-page document look like it had been fully processed; a reported one lets a
teacher decide whether to split the chapter.

### Variance comes from the provider, not the engine

The widest range above — 31.91 s to 166.14 s on the 20-page document — is a single run
in which the primary gateway rate-limited under nine back-to-back builds and the
configured fallback took over mid-run, waiting out the retry budget as it is designed
to. The build still completed and still produced every stage, and engine time across
those same runs varied by tens of milliseconds. That is the whole reason the two halves
are reported separately: a reader looking only at the total would conclude this service
had become forty times slower, when nothing about it had changed at all.

## What is not measured here

Stated so the table is not read as covering more than it does:

* **Transcription and interactive video.** Both are dominated by the same provider
  wait, and both take a media file rather than a document, so they do not belong on
  the same axis as the figures above.
* **Concurrency.** These are single-request measurements. What happens at fifty
  simultaneous uploads is a property of the deployment and its rate limits, and
  measuring it against a free tier would say more about the tier than the engine.
* **A self-hosted model.** Every provider figure here is a hosted gateway. Self-hosted
  numbers depend entirely on the hardware and are for whoever deploys it to measure on
  theirs — which is exactly why engine time is reported separately.

## Environment

| | |
|---|---|
| Machine | Apple M5, 10 cores, 16 GB |
| Load average during the run | 8.32 — the machine was busy, so CPU figures are conservative |
| Python | 3.12 |
| Model | `openai/gpt-oss-20b` through an OpenAI-compatible hosted gateway |
| Repeats | 5 per CPU measurement, 3 per pipeline measurement |
