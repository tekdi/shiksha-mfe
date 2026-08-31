"""The published benchmark figures are the measured ones.

`docs/benchmarks.md` is the only place in this repository that states a performance
number, and a performance number is the easiest kind of claim to get wrong by accident:
it is transcribed by hand from a run that happened once, on a machine that is no longer
in that state, and nothing about the document goes red when it drifts.

So the run that produced the table is committed beside it, and every figure in the
document is checked against it here. A reviewer who does not believe a number can open
`benchmarks/results/2026-08-27.json` and find the samples it was derived from.

This is not a benchmark. Nothing here measures anything — it compares two files.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

ENGINE = Path(__file__).resolve().parents[1]
DOC = ENGINE / "docs" / "benchmarks.md"
RESULTS = ENGINE / "benchmarks" / "results" / "2026-08-27.json"


def published() -> dict:
    return json.loads(RESULTS.read_text())


def rows() -> dict[tuple[str, str], dict]:
    """Every measured row, keyed by the label and scale that identify it in the run."""
    found = {}
    for section in published()["sections"]:
        for row in section["rows"]:
            found[(row["label"], row["scale"])] = row
    return found


def as_written(seconds: float) -> str:
    """Format a duration the way `benchmarks.run._t` does, so the two are comparable.

    Deliberately a second implementation rather than an import. Importing the real one
    would make this test agree with the code even when both are wrong — the document
    was written by reading printed output, so what is checked is that the printed form
    of the stored number is the string in the document.
    """
    if seconds < 0.001:
        return f"{seconds * 1_000_000:.0f} µs"
    if seconds < 1:
        return f"{seconds * 1000:.0f} ms"
    return f"{seconds:.2f} s"


def stated(pattern: str) -> list[tuple[str, ...]]:
    return re.findall(pattern, DOC.read_text())


# --- the three tables ---------------------------------------------------------------


def written_range(samples: list[float]) -> str:
    """A range the way the report prints it: `833–851 ms`, the unit stated once."""
    low, high = as_written(min(samples)), as_written(max(samples))
    low_value, low_unit = low.rsplit(" ", 1)
    high_unit = high.rsplit(" ", 1)[1]
    if low_unit == high_unit:
        return f"{low_value}–{high}"
    return f"{low}–{high}"


@pytest.mark.parametrize("scale", ["2-page", "20-page", "60-page"])
def test_the_ingestion_table_matches_the_run(scale):
    """The row reads `| 60-page | 843 ms | 833–851 ms |`.

    Both columns are compared exactly. A first version fell back to `endswith` when the
    range did not match, which is an assertion that passes on almost anything — the
    same shape that has hidden a real defect in this repository before.
    """
    line = re.search(
        rf"^\| {re.escape(scale)} \| ([^|]+) \| ([^|]+) \|$",
        DOC.read_text(),
        re.MULTILINE,
    )
    assert line, f"no ingestion row for {scale} in benchmarks.md"

    row = rows()[("Ingestion (parse to structured JSON)", f"{scale} PDF")]
    assert line.group(1).strip() == as_written(row["median_seconds"]), (
        f"benchmarks.md states {line.group(1).strip()} for {scale} ingestion; "
        f"the run recorded {as_written(row['median_seconds'])}"
    )
    assert line.group(2).strip() == written_range(row["samples"]), (
        f"benchmarks.md states a range of {line.group(2).strip()} for {scale}; "
        f"the run's samples span {written_range(row['samples'])}"
    )


@pytest.mark.parametrize(
    ("written", "label"),
    [
        ("H5P Course Presentation", "Packaging — H5P Course Presentation"),
        ("Standalone HTML5 deck", "Packaging — standalone HTML5 deck"),
        ("SCORM 1.2 course", "Packaging — SCORM 1.2 course"),
    ],
)
def test_the_packaging_table_matches_the_run(written, label):
    line = re.search(
        rf"^\| {re.escape(written)} \| ([^|]+) \| ([^|]+) \|$",
        DOC.read_text(),
        re.MULTILINE,
    )
    assert line, f"no packaging row for {written!r} in benchmarks.md"

    row = rows()[(label, "12-step lesson")]
    assert line.group(1).strip() == as_written(row["median_seconds"]), (
        f"benchmarks.md states {line.group(1).strip()} for {written}; "
        f"the run recorded {as_written(row['median_seconds'])}"
    )


@pytest.mark.parametrize("scale", ["2-page", "20-page", "60-page"])
def test_the_end_to_end_table_matches_the_run(scale):
    """Total, engine and provider, all three from the same stored samples.

    The engine column is the one worth pinning: it is the number this project is
    accountable for, and it is derived rather than measured directly.
    """
    line = re.search(
        rf"^\| {re.escape(scale)} \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$",
        DOC.read_text(),
        re.MULTILINE,
    )
    assert line, f"no end-to-end row for {scale} in benchmarks.md"

    row = rows()[("Whole course pipeline", f"{scale} PDF")]
    for column, key, what in (
        (1, "median_seconds", "total"),
        (2, "engine_seconds", "engine"),
        (3, "provider_seconds", "provider"),
    ):
        assert line.group(column).strip() == as_written(row[key]), (
            f"benchmarks.md states {line.group(column).strip()} as the {what} time for "
            f"{scale}; the run recorded {as_written(row[key])}"
        )


# --- the conditions the figures were taken under ------------------------------------


def test_the_environment_table_matches_the_run():
    """A CPU figure without its load average is not reproducible, so the document
    states one. It has to be the run's."""
    body = DOC.read_text()
    run = published()

    load = re.search(r"\| Load average during the run \| ([\d.]+)", body)
    assert load, "benchmarks.md no longer states the load average"
    assert float(load.group(1)) == pytest.approx(run["load_average"], abs=0.01)

    assert f"{run['cores']} cores" in body, (
        f"benchmarks.md does not state {run['cores']} cores"
    )
    assert f"`{run['model']}`" in body, (
        f"benchmarks.md does not name the model {run['model']}"
    )

    repeats = re.search(
        r"\| Repeats \| (\d+) per CPU measurement, (\d+) per pipeline", body
    )
    assert repeats, "benchmarks.md no longer states the repeat counts"
    assert int(repeats.group(1)) == run["cpu_repeats"]
    assert int(repeats.group(2)) == run["pipeline_repeats"]


def test_the_headline_claim_about_engine_time_holds():
    """The document's strongest sentence: engine time stays between 79 and 180 ms
    whatever the document size. If a future run moved that, the claim would be the
    last thing anyone thought to update."""
    body = DOC.read_text()
    claimed = re.search(r"between (\d+) and (\d+) milliseconds", body)
    assert claimed, "benchmarks.md no longer states the engine-time bound"

    engine = [
        row["engine_seconds"]
        for (label, _), row in rows().items()
        if label == "Whole course pipeline"
    ]
    assert engine, "the stored run has no pipeline rows"
    assert round(min(engine) * 1000) == int(claimed.group(1))
    assert round(max(engine) * 1000) == int(claimed.group(2))


@pytest.mark.parametrize(
    ("size", "pages"), [("Small", 2), ("Medium", 20), ("Large", 60)]
)
def test_the_document_sizes_are_the_ones_the_corpus_builds(size, pages):
    """The sizes table is the reader's anchor for every other figure: every duration
    above is "for a document of this many words".

    Read out of the table rather than restated here. A first version asserted only that
    `| 20 |` appeared somewhere in the document and compared the corpus against numbers
    hard-coded in this file — so changing the published word count broke nothing, which
    a mutation run caught.
    """
    from benchmarks.corpus import build_pdf

    line = re.search(
        rf"^\| {size} \| (\d+) \| (\d+) \| ([\d,]+) \|$", DOC.read_text(), re.MULTILINE
    )
    assert line, f"no row for the {size!r} document in the sizes table"

    document = build_pdf(pages)
    assert int(line.group(1)) == document.pages, (
        f"benchmarks.md says the {size} document is {line.group(1)} pages; "
        f"the corpus builds {document.pages}"
    )
    assert int(line.group(2)) == document.sections, (
        f"benchmarks.md says {line.group(2)} sections; the corpus builds {document.sections}"
    )
    assert int(line.group(3).replace(",", "")) == document.words, (
        f"benchmarks.md says {line.group(3)} words; the corpus builds {document.words:,}"
    )
