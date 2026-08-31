"""Verify a running deployment, endpoint by endpoint.

    python -m scripts.smoke                                   # against localhost:8000
    python -m scripts.smoke --base-url https://engine.example  # against a deployment
    python -m scripts.smoke --audio clip.mp3 --video lecture.mp4

The test suite proves the code is right. This proves *this deployment* is right — that
the image was built from the code you think, the configuration reaches it, the model
gateway is actually callable from wherever it is running, and every route answers. No
amount of green CI tells you that about a server you just deployed.

**The endpoint list comes from the running service, not from this file.** Whatever
`/openapi.json` advertises is what gets checked, and an endpoint with no check here is
reported as unchecked rather than quietly ignored. That is the one property that keeps
a smoke test honest as the service grows: a new route cannot slip past it.

Checks chain the way a caller does — parse a document once, then feed that result to
everything that takes a document, and feed each generated artefact to the routes that
package it. That keeps the model calls down and, more usefully, exercises the round
trip: every object this engine returns has to be acceptable as an input again.

Media endpoints need media, and none ships in this repository. Without `--audio` and
`--video` they report **skipped, with the reason** — a skipped check is not a passed
one, and a smoke test that quietly counted them as fine would be worse than useless.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlparse

import httpx

ENGINE = Path(__file__).resolve().parents[1]

PASS, FAIL, SKIP = "pass", "fail", "skip"

#: Route prefixes that appear in several places below. Named so the family and its
#: two packaging forms cannot drift apart in one spot and not another.
ASSESS = "/assess"
MICRO_LESSON = "/micro-lesson"
COURSE = "/course"


#: The only schemes this tool will send a request to. Anything else — `file:`,
#: `gopher:`, a bare host with no scheme — is refused rather than handed to a client.
ALLOWED_SCHEMES = frozenset({"http", "https"})


def checked_url(value: str, *, what: str) -> str:
    """Return `value` if it is a URL worth sending a request to, else raise.

    Both URLs here come from the command line, and a command line is not always typed
    by a person — this file is exactly the kind of thing that ends up wrapped in a
    script or a job. Validating the scheme and requiring a host means a malformed or
    hostile argument fails immediately with a clear message, rather than turning into
    a request to somewhere unintended.
    """
    parsed = urlparse(value)
    if parsed.scheme not in ALLOWED_SCHEMES:
        raise ValueError(
            f"{what} must be an http or https URL, not {parsed.scheme or 'a bare path'!r}: {value!r}"
        )
    if not parsed.netloc:
        raise ValueError(f"{what} has no host: {value!r}")
    return value


@dataclass
class Result:
    endpoint: str
    outcome: str
    detail: str = ""
    seconds: float = 0.0


@dataclass
class Sweep:
    """Runs the checks and remembers what each one produced for the next."""

    client: httpx.Client
    document: dict | None = None
    assessment: dict | None = None
    lesson: dict | None = None
    course: dict | None = None
    transcript: dict | None = None
    chaptered: dict | None = None
    results: list[Result] = field(default_factory=list)

    # --- one check ------------------------------------------------------------------

    def call(self, endpoint: str, method: str = "POST", **kwargs) -> dict | bytes | None:
        """Make one request, record how it went, and return the body on success."""
        started = time.perf_counter()
        try:
            response = self.client.request(method, endpoint, **kwargs)
        except httpx.HTTPError as exc:
            self.results.append(Result(endpoint, FAIL, f"{type(exc).__name__}: {exc}",
                                       time.perf_counter() - started))
            return None
        elapsed = time.perf_counter() - started

        if response.status_code != 200:
            body = response.text[:160].replace("\n", " ")
            self.results.append(Result(endpoint, FAIL, f"HTTP {response.status_code}: {body}", elapsed))
            return None

        kind = response.headers.get("content-type", "")
        if "application/json" in kind:
            payload = response.json()
            self.results.append(Result(endpoint, PASS, _describe(payload), elapsed))
            return payload
        self.results.append(Result(endpoint, PASS, f"{len(response.content) / 1024:.1f} KB", elapsed))
        return response.content

    def skip(self, endpoint: str, why: str) -> None:
        self.results.append(Result(endpoint, SKIP, why))

    def checked(self) -> set[str]:
        return {r.endpoint for r in self.results}


def _describe(payload) -> str:
    """A one-line summary of a reply, so the report says what came back."""
    if not isinstance(payload, dict):
        return type(payload).__name__
    for key in ("stages", "questions", "steps", "chapters", "segments", "pages"):
        if isinstance(payload.get(key), list):
            return f"{len(payload[key])} {key}"
    if "ready" in payload:
        return json.dumps(payload)[:80]
    if "status" in payload:
        return str(payload["status"])
    return ", ".join(list(payload)[:3])


# --- the checks ---------------------------------------------------------------------


def _package(sweep: Sweep, area: str, targets: tuple[str, ...], source, pdf: dict) -> None:
    """Check the packaging routes of one area, in both of their forms.

    Each target has a route taking an object and a route taking an upload. The first
    is skipped with a reason when the stage that produces the object did not run, so a
    missing package never reads as a passing check.
    """
    for target in targets:
        if source:
            sweep.call(f"{area}/{target}", json=source)
        else:
            sweep.skip(f"{area}/{target}", f"no {area.strip('/')} to package")
        sweep.call(f"{area}/{target}/file", files=pdf)


def _documents(sweep: Sweep, pdf: dict) -> None:
    """Everything that reads a parsed document."""
    doc = sweep.document
    sweep.call("/summarize", json=doc)
    sweep.call("/summarize/file", files=pdf)
    sweep.call("/narrate", json=doc)
    sweep.call("/narrate/file", files=pdf)

    sweep.assessment = sweep.call(ASSESS, json=doc)
    sweep.call(f"{ASSESS}/file", files=pdf)
    _package(sweep, ASSESS, ("h5p", "scorm"), sweep.assessment, pdf)

    sweep.lesson = sweep.call(MICRO_LESSON, json=doc)
    sweep.call(f"{MICRO_LESSON}/file", files=pdf)
    sweep.call(f"{MICRO_LESSON}/text", content=_NOTES, headers={"content-type": "text/plain"})
    _package(sweep, MICRO_LESSON, ("h5p", "html5", "scorm"), sweep.lesson, pdf)

    sweep.course = sweep.call(f"{COURSE}/file", files=pdf)
    sweep.call(f"{COURSE}/text", content=_NOTES, headers={"content-type": "text/plain"})
    if sweep.course:
        sweep.call(f"{COURSE}/bundle", json=sweep.course)
    else:
        sweep.skip(f"{COURSE}/bundle", "no course to package")
    sweep.call(f"{COURSE}/bundle/file", files=pdf)


def _media(sweep: Sweep, audio: Path | None, video: Path | None, video_url: str) -> None:
    """The routes that take a recording rather than a document."""
    if audio:
        clip = {"file": (audio.name, audio.read_bytes(), "audio/mpeg")}
        sweep.transcript = sweep.call("/transcribe", files=clip)
    else:
        sweep.skip("/transcribe", "no --audio supplied")
        clip = None

    if sweep.transcript:
        sweep.chaptered = sweep.call("/chapter", json=sweep.transcript)
    else:
        sweep.skip("/chapter", "no transcript to chapter")

    if clip:
        sweep.chaptered = sweep.call("/chapter/file", files=clip) or sweep.chaptered
    else:
        sweep.skip("/chapter/file", "no --audio supplied")

    # H5P references a video by URL rather than embedding it, so these routes need
    # somewhere the player can fetch it from. Any reachable URL will do for a smoke
    # test — what is checked is that the package is built, not that it plays.
    query = {"video_url": video_url, "video_mime": "video/mp4"}

    if sweep.chaptered:
        sweep.call(f"{MICRO_LESSON}/transcript", json=sweep.chaptered)
        sweep.call("/interactive-video", json=sweep.chaptered, params=query)
    else:
        sweep.skip(f"{MICRO_LESSON}/transcript", "no chaptered transcript")
        sweep.skip("/interactive-video", "no chaptered transcript")

    if video:
        sweep.call("/interactive-video/file",
                   files={"file": (video.name, video.read_bytes(), "video/mp4")}, params=query)
    else:
        sweep.skip("/interactive-video/file", "no --video supplied")


def run(sweep: Sweep, document_pdf: bytes, audio: Path | None, video: Path | None,
        video_url: str) -> None:
    """Walk every endpoint, in the order a caller would reach them."""
    pdf = {"file": ("smoke.pdf", document_pdf, "application/pdf")}

    for endpoint in ("/", "/health", "/ready"):
        sweep.call(endpoint, "GET")

    sweep.document = sweep.call("/ingest", files=pdf)
    if sweep.document:
        _documents(sweep, pdf)
    else:
        print("  /ingest failed, so everything downstream of a parsed document is skipped")
        for endpoint in ("/summarize", "/narrate", ASSESS, MICRO_LESSON):
            sweep.skip(endpoint, "no parsed document to send")

    _media(sweep, audio, video, video_url)


_NOTES = (
    "The water cycle\n\n"
    "Water moves continuously between the ocean, the atmosphere and the land. "
    "Sunlight warms the surface of the ocean and the fastest molecules escape as vapour. "
    "As that air rises it cools, and what it can no longer hold condenses into cloud. "
    "Droplets grow until rising air cannot hold them, and it falls as rain or snow.\n\n"
    "Where the water goes\n\n"
    "Water that reaches the ground either soaks into the soil or runs off across it. "
    "Which one dominates depends on how saturated the ground already is and how steep it is."
)


# --- reporting ------------------------------------------------------------------------


def advertised(client: httpx.Client) -> set[str]:
    """Every path the running service says it serves."""
    spec = client.get("/openapi.json").json()
    return set(spec.get("paths", {}))


def report(results: list[Result], unchecked: set[str]) -> int:
    width = max((len(r.endpoint) for r in results), default=20)
    mark = {PASS: "ok  ", FAIL: "FAIL", SKIP: "skip"}
    for r in results:
        timing = f"{r.seconds:6.2f}s" if r.seconds else "       "
        print(f"  {mark[r.outcome]} {r.endpoint:<{width}} {timing}  {r.detail}")

    failed = [r for r in results if r.outcome == FAIL]
    skipped = [r for r in results if r.outcome == SKIP]
    print()
    print(f"  {len(results) - len(failed) - len(skipped)} passed, {len(failed)} failed, "
          f"{len(skipped)} skipped, of {len(results)} checks")

    if unchecked:
        # Not a failure, but it must be visible: the service grew a route and this
        # file did not, which is how a smoke test silently stops covering things.
        print(f"\n  advertised but not checked here: {', '.join(sorted(unchecked))}")
    if failed:
        print("\n  failures:")
        for r in failed:
            print(f"    {r.endpoint}: {r.detail}")
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify a running deployment.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--audio", type=Path, help="an audio file, for the media endpoints")
    parser.add_argument("--video", type=Path, help="a video file, for interactive video")
    parser.add_argument(
        "--video-url",
        default="https://example.org/lecture.mp4",
        help="the URL an H5P Interactive Video should point its player at",
    )
    parser.add_argument("--timeout", type=float, default=300.0)
    args = parser.parse_args()

    for label, path in (("--audio", args.audio), ("--video", args.video)):
        if path and not path.is_file():
            print(f"  {label} {path} does not exist")
            return 2

    try:
        base_url = checked_url(args.base_url, what="--base-url")
        video_url = checked_url(args.video_url, what="--video-url")
    except ValueError as exc:
        print(f"  {exc}")
        return 2

    sys.path.insert(0, str(ENGINE))
    from benchmarks.corpus import build_pdf

    print("  building a document to send…")
    document = build_pdf(2)
    print(f"  {document.pages} pages, {document.words} words, {document.kilobytes:.1f} KB")
    print(f"  sweeping {base_url}\n")

    with httpx.Client(base_url=base_url, timeout=args.timeout, follow_redirects=True) as client:
        try:
            paths = advertised(client)
        except httpx.HTTPError as exc:
            print(f"  cannot reach {base_url}: {exc}")
            return 2
        sweep = Sweep(client=client)
        run(sweep, document.content, args.audio, args.video, video_url)

    return report(sweep.results, paths - sweep.checked())


if __name__ == "__main__":
    sys.exit(main())
