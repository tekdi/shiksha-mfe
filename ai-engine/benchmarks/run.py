"""Run the benchmarks and print a report.

    python -m benchmarks.run              # everything
    python -m benchmarks.run --offline    # only the parts that need no model

Three things are measured, and they are separated because they answer different
questions for whoever is deploying this.

**Ingestion** and **packaging** are pure CPU. No network, no model, no cost. They are
what a tenant's own server has to do, so they are measured with several repeats and
reported as a median — these are the figures capacity planning actually needs.

**The whole course pipeline** reaches a model, so most of its wall clock belongs to a
hosted provider rather than to this code. Every run is split into provider time and
engine time, and both are reported, because only the second is ours to improve and
only the second stays the same if the operator swaps providers or self-hosts.

Medians rather than means, and the spread is printed beside them. One slow call to a
shared hosted provider will drag a mean somewhere misleading, and hiding that variance
behind a single number would misrepresent what a tenant should expect.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import statistics
import sys
import tempfile
import time
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path

from app.config import settings
from app.course.pipeline import build_course
from app.course.schema import CourseOptions
from app.ingestion.pdf_parser import parse_pdf
from app.microlesson.emit import emit_h5p, emit_html5, emit_scorm
from app.microlesson.schema import LessonStep, MicroLesson
from app.summarization.pipeline import generation_config

from .corpus import Document, corpus
from .instruments import Timings, timed_client

#: Repeats for the CPU-only measurements. They cost nothing, so enough runs to see
#: the spread rather than a single sample.
CPU_REPEATS = 5

#: Repeats for the pipeline measurements. Each one is several model calls against a
#: rate-limited free tier, so this is deliberately small — the spread still gets
#: reported, and an honest three is worth more than an optimistic one.
PIPELINE_REPEATS = 3


def machine_load() -> tuple[float, int]:
    """The one-minute load average and the core count.

    Reported beside every figure, because a CPU measurement without the conditions it
    was taken under is not reproducible. Measured once at 435 ms and once at 749 ms
    for the identical document — the difference was entirely a busy machine, and a
    reader had no way to know which they were looking at.
    """
    try:
        one_minute = os.getloadavg()[0]
    except (OSError, AttributeError):  # not available on every platform
        one_minute = float("nan")
    return one_minute, os.cpu_count() or 0


@dataclass
class Measurement:
    """One row of the report."""

    label: str
    scale: str
    samples: list[float] = field(default_factory=list)
    provider: list[float] = field(default_factory=list)
    notes: str = ""

    @property
    def median(self) -> float:
        return statistics.median(self.samples) if self.samples else 0.0

    @property
    def spread(self) -> tuple[float, float]:
        return (min(self.samples), max(self.samples)) if self.samples else (0.0, 0.0)

    @property
    def provider_median(self) -> float:
        return statistics.median(self.provider) if self.provider else 0.0

    @property
    def engine_median(self) -> float:
        """The part that is this code rather than somebody else's server.

        The median of the per-run differences, not the difference of the two medians.
        Those are not the same number and the second is not meaningful: the slowest
        total and the slowest provider call need not come from the same run, so
        subtracting one median from the other can attribute a provider hiccup in one
        run to engine work in another. It reported 1.59 s of engine time for a run
        whose real figure was a tenth of that.
        """
        if not self.provider:
            return self.median
        pairs = zip(self.samples, self.provider, strict=True)
        return statistics.median(max(0.0, total - provider) for total, provider in pairs)


# --- pure CPU: what a tenant's own machine does ------------------------------------


def measure_ingestion(documents: list[Document]) -> list[Measurement]:
    """How long it takes to turn a PDF into structured content."""
    rows = []
    for doc in documents:
        row = Measurement("Ingestion (parse to structured JSON)", f"{doc.pages}-page PDF")
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(doc.content)
            path = tmp.name
        try:
            parsed = parse_pdf(path)  # once outside the loop, so imports are warm
            for _ in range(CPU_REPEATS):
                started = time.perf_counter()
                parse_pdf(path)
                row.samples.append(time.perf_counter() - started)
        finally:
            Path(path).unlink(missing_ok=True)
        row.notes = f"{doc.words:,} words, {len(parsed.pages)} pages read"
        rows.append(row)
    return rows


def measure_packaging() -> list[Measurement]:
    """How long it takes to write the three lesson formats.

    One fixed lesson for all three, because the question is what each emitter costs,
    not how the lesson generator behaves. Twelve steps is a long micro-lesson.
    """
    lesson = _sample_lesson(steps=12)
    rows = []
    for label, emit in (
        ("Packaging — H5P Course Presentation", emit_h5p),
        ("Packaging — standalone HTML5 deck", emit_html5),
        ("Packaging — SCORM 1.2 course", emit_scorm),
    ):
        row = Measurement(label, "12-step lesson")
        package = emit(lesson)
        for _ in range(CPU_REPEATS):
            started = time.perf_counter()
            emit(lesson)
            row.samples.append(time.perf_counter() - started)
        row.notes = f"{len(package.content) / 1024:.1f} KB written"
        rows.append(row)
    return rows


def _sample_lesson(*, steps: int) -> MicroLesson:
    return MicroLesson(
        lesson_id="benchmark",
        source={"kind": "text"},
        title="Water and the Earth's Systems",
        generator="benchmark",
        model="n/a",
        generated_at=datetime(1980, 1, 1, tzinfo=UTC),
        objectives=["Describe each stage of the cycle", "Explain what drives it"],
        steps=[
            LessonStep(
                index=i,
                title=f"Stage {i}: how water moves between the ocean and the air",
                bullets=[
                    "Sunlight warms the surface and the fastest molecules escape as vapour.",
                    "Rising air cools, and what it can no longer hold condenses into cloud.",
                    "Droplets grow until rising air cannot hold them, and it rains.",
                ],
                notes="What a teacher would say over this slide, at roughly the length they would say it.",
            )
            for i in range(1, steps + 1)
        ],
    )


# --- the whole pipeline: engine time and provider time, separated -------------------


def _parsed(document: Document):
    """Parse a generated document from a temporary file.

    Deliberately synchronous and deliberately called *before* the async measurement
    below. Writing and parsing a file is pure CPU with blocking I/O, and doing it
    inside the coroutine would both stall the event loop and add its own cost to the
    pipeline timings — which are the thing being measured.
    """
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(document.content)
        path = tmp.name
    try:
        return parse_pdf(path)
    finally:
        Path(path).unlink(missing_ok=True)


async def measure_pipeline(documents: list[Document]) -> list[Measurement]:
    """One upload through every stage, the way `/course/file` runs it."""
    rows = []
    options = CourseOptions(with_insights=True, with_lesson=True, with_assessment=True)
    prepared = [(doc, _parsed(doc)) for doc in documents]
    for doc, parsed in prepared:
        row = Measurement("Whole course pipeline", f"{doc.pages}-page PDF")
        produced = 0
        for attempt in range(PIPELINE_REPEATS):
            timings = Timings()
            async with timed_client(timings, timeout=settings.llm_request_timeout + 30) as client:
                started = time.perf_counter()
                course = await build_course(
                    client, generation_config(), document=parsed, options=options
                )
                timings.total_seconds = time.perf_counter() - started
            row.samples.append(timings.total_seconds)
            row.provider.append(timings.provider_seconds)
            produced = len(course.produced)
            print(
                f"    {doc.pages:>3}-page run {attempt + 1}/{PIPELINE_REPEATS}: "
                f"{timings.total_seconds:6.2f}s total, {timings.provider_seconds:6.2f}s provider "
                f"({timings.provider_share:.0%}), {timings.provider_calls} calls",
                flush=True,
            )
        row.notes = f"{produced} stages produced"
        rows.append(row)
    return rows


# --- reporting ----------------------------------------------------------------------


def render(sections: list[tuple[str, list[Measurement]]]) -> str:
    out = ["# Benchmarks", ""]
    load, cores = machine_load()
    out.append(
        f"Model: `{settings.llm_model}` · CPU repeats: {CPU_REPEATS} · "
        f"pipeline repeats: {PIPELINE_REPEATS} · {cores} cores, load average {load:.2f}"
    )
    if load > cores * 0.5:
        out.append("")
        out.append(
            f"> **Measured on a busy machine** (load {load:.2f} across {cores} cores). "
            "The CPU figures below are correspondingly slower than on an idle one; the "
            "end-to-end figures are dominated by the provider and barely move."
        )
    out.append("")
    for title, rows in sections:
        if not rows:
            continue
        out.append(f"## {title}")
        out.append("")
        splits = any(row.provider for row in rows)
        if splits:
            out.append("| Measurement | Scale | Median | Engine | Provider | Range | Notes |")
            out.append("|---|---|---|---|---|---|---|")
        else:
            out.append("| Measurement | Scale | Median | Range | Notes |")
            out.append("|---|---|---|---|---|")
        for row in rows:
            low, high = row.spread
            if splits:
                out.append(
                    f"| {row.label} | {row.scale} | {_t(row.median)} | {_t(row.engine_median)} "
                    f"| {_t(row.provider_median)} | {_t(low)}–{_t(high)} | {row.notes} |"
                )
            else:
                out.append(
                    f"| {row.label} | {row.scale} | {_t(row.median)} | {_t(low)}–{_t(high)} | {row.notes} |"
                )
        out.append("")
    return "\n".join(out)


def _t(seconds: float) -> str:
    """Seconds at a precision that matches what was measured."""
    if seconds < 0.001:
        return f"{seconds * 1_000_000:.0f} µs"
    if seconds < 1:
        return f"{seconds * 1000:.0f} ms"
    return f"{seconds:.2f} s"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="skip anything that calls a model")
    parser.add_argument("--json", type=Path, help="also write the raw numbers here")
    args = parser.parse_args()

    print("  building the corpus…", flush=True)
    documents = corpus()
    for doc in documents:
        print(f"    {doc.pages:>3} pages, {doc.sections:>3} sections, {doc.words:>6,} words, {doc.kilobytes:>6.1f} KB")

    sections: list[tuple[str, list[Measurement]]] = []
    print("  measuring ingestion…", flush=True)
    sections.append(("Ingestion — no model involved", measure_ingestion(documents)))
    print("  measuring packaging…", flush=True)
    sections.append(("Packaging — no model involved", measure_packaging()))

    if args.offline:
        print("  skipping the pipeline (--offline)", flush=True)
    else:
        print("  measuring the whole pipeline (this calls the model)…", flush=True)
        sections.append(("End to end — split by where the time goes", asyncio.run(measure_pipeline(documents))))

    report = render(sections)
    print()
    print(report)

    if args.json:
        args.json.write_text(json.dumps(
            {
                "model": settings.llm_model,
                "cores": machine_load()[1],
                "load_average": machine_load()[0],
                "cpu_repeats": CPU_REPEATS,
                "pipeline_repeats": PIPELINE_REPEATS,
                "sections": [
                    {
                        "title": title,
                        "rows": [
                            {
                                "label": r.label, "scale": r.scale, "notes": r.notes,
                                "median_seconds": r.median,
                                "engine_seconds": r.engine_median,
                                "provider_seconds": r.provider_median,
                                "samples": r.samples, "provider_samples": r.provider,
                            }
                            for r in rows
                        ],
                    }
                    for title, rows in sections
                ],
            },
            indent=2,
        ))
        print(f"\n  raw numbers written to {args.json}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
