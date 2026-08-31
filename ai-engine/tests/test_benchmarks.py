"""The benchmark harness itself.

A measuring instrument that is not checked is not evidence. These do not run the
benchmarks — those cost live model calls and are a command someone runs deliberately.
They check that the thing doing the measuring measures what it claims to.

The two properties that matter are the ones a reader of the published numbers is
implicitly trusting: that the documents are the size they are reported to be and are
the same on every machine, and that the split between "our time" and "the provider's
time" is arithmetic rather than a guess.
"""

from __future__ import annotations

import httpx
import pytest

from benchmarks.corpus import FIXED_ID, SIZES, Document, build_pdf, pin_identifier
from benchmarks.instruments import Timings, TimingTransport
from benchmarks.run import Measurement

# --- the corpus -------------------------------------------------------------------


@pytest.mark.parametrize("pages", [2, 5])
def test_a_document_has_at_least_the_pages_it_was_asked_for(pages):
    """The first version estimated how many sections fit a page and was asked for
    sixty, producing thirty-two. Reported sizes have to be real ones."""
    document = build_pdf(pages)
    assert document.pages >= pages


def test_the_reported_page_count_is_what_the_pdf_actually_holds():
    """Read back off the finished file rather than carried from the request."""
    document = build_pdf(5)
    import fitz

    with fitz.open(stream=document.content, filetype="pdf") as opened:
        assert opened.page_count == document.pages


def test_the_same_size_gives_byte_identical_documents():
    """Without this, a number measured today cannot be compared with one measured
    next month, because the input would have quietly changed."""
    first = build_pdf(3).content
    second = build_pdf(3).content
    assert first == second


def test_the_trailer_identifier_is_always_pinned():
    """The exact assertion that the test above could not make reliably.

    A PDF's trailer identifier is generated from the contents and the clock, so it is
    the one thing that differs between two otherwise identical builds. It is rewritten
    to a fixed value — but PDF allows each half to be a hex string `<…>` or a literal
    string `(…)`, and a first version only recognised the hex-hex form. PyMuPDF writes
    a literal half roughly once in fifty builds, so one build in fifty kept its real
    identifier and came out with different bytes.

    Comparing two builds catches that only when the flake happens to land inside the
    test; asserting the identifier directly catches it every time.
    """
    for pages in (2, 3):
        content = build_pdf(pages).content
        assert FIXED_ID in content, f"the {pages}-page build kept a generated identifier"


@pytest.mark.parametrize(
    "trailer",
    [
        # Two hex halves — what PyMuPDF writes most of the time.
        b"trailer\n<</Size 39/Root 1 0 R/ID [<AB12><CD34>]>>\nstartxref",
        # A hex half and a literal half — what it writes about once in fifty builds,
        # and the shape a hex-only pattern silently left alone.
        b"trailer\n<</Size 39/Root 1 0 R/ID[<C3BA5133>(A\\277h\\321?q!8-%)]>>\nstartxref",
        # Two literal halves, which PDF also permits.
        b"trailer\n<</Size 39/Root 1 0 R/ID [(abc)(def)]>>\nstartxref",
        # Split across lines, which a serialiser is free to do.
        b"trailer\n<</Size 39/Root 1 0 R/ID [<AB12>\n<CD34>]>>\nstartxref",
    ],
)
def test_every_shape_of_trailer_identifier_is_pinned(trailer):
    """The exact test the generated-document one cannot be: each form is handed over
    directly rather than waited for."""
    out = pin_identifier(trailer)
    assert FIXED_ID in out
    # Separately, so a failure names the shape that leaked rather than reporting that
    # the conjunction as a whole was false.
    assert b"C3BA5133" not in out
    assert b"AB12" not in out
    assert b"(abc)" not in out


def test_pinning_leaves_document_content_alone():
    """Anchored on the trailer, so a page that happens to contain the same bytes is
    not rewritten."""
    body = b"BT (/ID [<not a trailer>]) Tj ET\ntrailer\n<</Root 1 0 R/ID [<AB><CD>]>>\nstartxref"
    out = pin_identifier(body)
    assert b"(/ID [<not a trailer>])" in out
    assert out.count(FIXED_ID) == 1


def test_no_timestamp_survives_into_a_generated_document():
    """The other half of the same guarantee. A creation date left in place would make
    every build differ by the second it was made."""
    content = build_pdf(2).content
    assert b"D:19800101000000Z" in content
    assert content.count(b"/CreationDate") == 1


def test_a_document_carries_the_counts_a_report_row_needs():
    document = build_pdf(3)
    assert document.words > 0
    assert document.sections > 0
    assert document.kilobytes > 0
    assert isinstance(document, Document)


def test_the_documents_are_structured_rather_than_one_block_of_text():
    """Every module past ingestion works off the sections the parser found, so a flat
    document would under-report the whole pipeline."""
    import fitz

    with fitz.open(stream=build_pdf(3).content, filetype="pdf") as opened:
        text = "\n".join(page.get_text() for page in opened)
    assert "Evaporation from Open Water" in text
    assert "Condensation and Cloud Formation" in text


def test_the_published_sizes_span_small_to_large():
    """A benchmark that only measures the sample everyone has already seen says
    nothing about a real teaching document."""
    assert min(SIZES) <= 2
    assert max(SIZES) >= 50


# --- the split between our time and the provider's ----------------------------------


def test_engine_time_is_the_wall_clock_minus_the_waiting():
    timings = Timings(provider_seconds=9.0, total_seconds=10.0)
    assert timings.engine_seconds == pytest.approx(1.0)


def test_engine_time_never_goes_negative():
    """The two clocks are read at different moments, so a run with almost no engine
    work can come out fractionally negative. That is a measurement artefact, and
    reporting it as a negative duration would look like a bug in the engine."""
    timings = Timings(provider_seconds=10.0001, total_seconds=10.0)
    assert timings.engine_seconds == 0.0


def test_the_provider_share_is_a_fraction():
    assert Timings(provider_seconds=5.0, total_seconds=10.0).provider_share == pytest.approx(0.5)
    assert Timings().provider_share == 0.0


def test_a_run_with_no_calls_is_all_engine_time():
    timings = Timings(total_seconds=2.0)
    assert timings.engine_seconds == pytest.approx(2.0)
    assert timings.provider_calls == 0


@pytest.mark.anyio
async def test_every_request_is_counted_including_ones_the_caller_never_sees():
    """Measured at the transport rather than around a call, so a retry inside the
    client counts too — otherwise a slow run would look fast and unexplained."""
    timings = Timings()

    def respond(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"ok": True})

    transport = TimingTransport(httpx.MockTransport(respond), timings)
    async with httpx.AsyncClient(transport=transport) as client:
        await client.get("https://example.invalid/one")
        await client.get("https://example.invalid/two")

    assert timings.provider_calls == 2
    assert len(timings.call_seconds) == 2
    assert timings.provider_seconds == pytest.approx(sum(timings.call_seconds))


@pytest.mark.anyio
async def test_a_failed_request_is_still_counted():
    """Time spent waiting on a call that errored is still time the run took."""
    timings = Timings()

    def explode(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("no route", request=request)

    transport = TimingTransport(httpx.MockTransport(explode), timings)
    async with httpx.AsyncClient(transport=transport) as client:
        with pytest.raises(httpx.ConnectError):
            await client.get("https://example.invalid/boom")

    assert timings.provider_calls == 1
    assert timings.provider_seconds > 0


@pytest.fixture
def anyio_backend():
    return "asyncio"


# --- how a reported figure is derived from its samples ------------------------------


def test_engine_time_is_the_median_of_the_differences():
    """Not the difference of the two medians, which is a different number and not a
    meaningful one: the slowest total and the slowest provider call need not come from
    the same run.

    These samples are the shape that exposed it. Run 3 was slow overall *and* slow at
    the provider, so its engine time is ordinary — but the median total comes from run
    3 while the median provider time comes from run 1, and subtracting one from the
    other invents 1.5 seconds of engine work that no run actually did.
    """
    row = Measurement("whole pipeline", "60-page")
    row.samples = [25.20, 29.38, 31.48]
    row.provider = [25.11, 29.29, 27.79]

    assert row.engine_median == pytest.approx(0.09, abs=0.01)
    # What the wrong arithmetic would have produced, named so a regression is obvious.
    assert row.median - row.provider_median == pytest.approx(1.59, abs=0.01)


def test_engine_time_falls_back_to_the_total_when_nothing_was_measured():
    """A CPU-only row has no provider samples at all, and its whole cost is ours."""
    row = Measurement("ingestion", "60-page")
    row.samples = [0.44, 0.43, 0.45]
    assert row.engine_median == pytest.approx(0.44)


def test_a_report_row_never_claims_negative_engine_time():
    """The two clocks are read at different moments, so a run can come out marginally
    negative. That is an artefact, and printing it as a negative duration would read
    as a bug in the engine."""
    row = Measurement("whole pipeline", "2-page")
    row.samples = [10.0, 10.0]
    row.provider = [10.001, 10.002]
    assert row.engine_median == 0.0
