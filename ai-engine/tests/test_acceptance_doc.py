"""The acceptance matrix has to keep pointing at things that exist.

`docs/acceptance.md` maps every criterion in issue #7 to the code that meets it and
the tests that hold it. It is written for a reviewer to spot-check, which makes a
stale reference in it worse than no reference at all: a test name that no longer
exists reads as evidence right up until someone looks.

Every check here asserts a floor on how much it found before asserting that nothing is
missing. Without that a regex that quietly stops matching passes as loudly as one that
matches everything — which is exactly what a first version of this did, matching no
filenames at all because the pattern could not cross the dot in `test_x.py`.
"""

from __future__ import annotations

import re
import subprocess
import sys
import tomllib
from pathlib import Path

ENGINE = Path(__file__).resolve().parents[1]
DOC = ENGINE / "docs" / "acceptance.md"


def body() -> str:
    return DOC.read_text()


def cited(pattern: str) -> set[str]:
    return set(re.findall(pattern, body()))


def test_every_test_file_the_matrix_names_exists():
    names = cited(r"`(test_[a-z0-9_]+\.py)`")
    assert len(names) >= 15, (
        f"only found {len(names)} test files cited; the pattern is wrong"
    )
    present = {p.name for p in (ENGINE / "tests").glob("test_*.py")}
    assert not names - present, (
        f"named in acceptance.md but gone: {sorted(names - present)}"
    )


def test_every_individual_test_the_matrix_names_exists():
    """Named tests are the strongest claims in the document — the ones where a single
    guarantee is pointed at. A renamed test would leave the claim unbacked."""
    names = cited(r"`(test_[a-z0-9_]+)`(?!\.)")
    named = {n for n in names if not n.endswith(".py")}
    assert len(named) >= 15, (
        f"only found {len(named)} individual tests cited; the pattern is wrong"
    )

    defined: set[str] = set()
    for path in (ENGINE / "tests").glob("test_*.py"):
        defined |= set(
            re.findall(
                r"^(?:async )?def (test_[a-z0-9_]+)", path.read_text(), re.MULTILINE
            )
        )
    assert not named - defined, (
        f"named in acceptance.md but not defined: {sorted(named - defined)}"
    )


def test_every_source_path_the_matrix_names_exists():
    paths = cited(r"`(app/[A-Za-z0-9_/]+(?:\.py)?)`")
    assert len(paths) >= 10, (
        f"only found {len(paths)} source paths cited; the pattern is wrong"
    )
    missing = sorted(p for p in paths if not (ENGINE / p).exists())
    assert not missing, f"named in acceptance.md but gone: {missing}"


def test_every_relative_link_resolves():
    links = {
        target
        for target in re.findall(r"\]\(([^)#]+)(?:#[^)]*)?\)", body())
        if not target.startswith("http")
    }
    assert len(links) >= 10, (
        f"only found {len(links)} relative links; the pattern is wrong"
    )
    missing = sorted(t for t in links if not (DOC.parent / t).resolve().exists())
    assert not missing, f"acceptance.md links to files that do not exist: {missing}"


def test_every_endpoint_the_matrix_names_is_really_served():
    """The matrix tells a reviewer which route to call for each criterion. A route
    that was renamed would send them somewhere that 404s."""
    from app.main import app

    served = set(app.openapi()["paths"])
    endpoints = {e for e in cited(r"`(/[a-z0-9/_-]*)`") if e != "/"}
    assert len(endpoints) >= 12, (
        f"only found {len(endpoints)} endpoints cited; the pattern is wrong"
    )

    # `/micro-lesson/h5p`, `/html5`, `/scorm` is how the document lists a family, so a
    # bare suffix is resolved against the families the service actually serves.
    def real(endpoint: str) -> bool:
        return endpoint in served or any(p.endswith(endpoint) for p in served)

    missing = sorted(e for e in endpoints if not real(e))
    assert not missing, (
        f"acceptance.md names endpoints the app does not serve: {missing}"
    )


def test_the_matrix_covers_all_four_modules_and_the_outcomes():
    """A criterion silently dropped from the document is the failure this catches."""
    text = body()
    for heading in (
        "Module A — Document Ingestion",
        "Module B — Assessment Suite",
        "Module C — Multimedia Intelligence",
        "Module D — Micro-Learning Studio",
        "Expected outcomes",
    ):
        assert heading in text, f"acceptance.md no longer covers {heading!r}"


def test_the_suite_size_the_matrix_quotes_is_the_real_one():
    """The one number in the document that goes stale on its own.

    Every other claim here is a name, and a name that rots is caught by the checks
    above. A count rots silently: the sentence stays true-looking while the suite grows
    underneath it, and it had already drifted by nineteen tests before this was added.

    Asked pytest what it collects rather than counting `def test_` lines. Parametrised
    cases are tests, and a first version that counted function definitions could not
    tell 947 from 966 — it needed a tolerance so wide that the very drift it was
    written to catch passed straight through it. An exact figure is also the only one
    worth printing: a reviewer reading a precise number is entitled to a precise number.

    Adding a test therefore makes this fail until the sentence is updated, which is the
    intended cost. It is a one-word edit, and the alternative is a document that
    quietly stops being true.
    """
    quoted = re.search(r"\*\*(\d+) tests at (\d+)% branch coverage\*\*", body())
    assert quoted, "acceptance.md no longer states the suite size in the expected form"

    collected = subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            "--collect-only",
            "-q",
            "-p",
            "no:cacheprovider",
            # Collection only, so the coverage plugin the default options add would
            # report zero and fail the run under its own threshold.
            "-o",
            "addopts=",
        ],
        cwd=ENGINE,
        capture_output=True,
        text=True,
        timeout=300,
        check=False,  # a collection error is reported below, with its output
    )
    found = re.search(r"(\d+) tests? collected", collected.stdout)
    assert found, (
        f"could not read a collection count from pytest:\n{collected.stdout[-800:]}"
    )

    assert int(quoted.group(1)) == int(found.group(1)), (
        f"acceptance.md says {quoted.group(1)} tests; pytest collects {found.group(1)}"
    )

    # The coverage half of the same sentence. The real figure costs a full instrumented
    # run to obtain, which does not belong inside one test — but a claim below the
    # threshold the build already enforces is incoherent whatever the real number is,
    # and that is the direction the claim would rot in.
    floor = tomllib.loads((ENGINE / "pyproject.toml").read_text())
    floor = floor["tool"]["coverage"]["report"]["fail_under"]
    assert int(quoted.group(2)) >= floor, (
        f"acceptance.md claims {quoted.group(2)}% coverage, below the {floor}% the build enforces"
    )
