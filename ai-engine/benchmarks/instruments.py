"""Timing that separates our own work from waiting on somebody else's server.

`build_course` and every module pipeline take an `httpx.AsyncClient` as a parameter,
which is the seam this uses: hand them a client that records how long each request
took, and provider time is the sum of those. Engine time is then the wall clock minus
that sum, with no instrumentation inside the engine at all.

Measuring inside the engine was the alternative and it was rejected. Timing code
scattered through the pipeline is code that ships to tenants, has to be maintained,
and is itself untested — for a number only ever read here.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field

import httpx


@dataclass
class Timings:
    """What one run cost, split by who spent it."""

    #: Seconds spent inside HTTP calls to the model gateway.
    provider_seconds: float = 0.0
    #: How many calls that was. A stage that retries shows up here.
    provider_calls: int = 0
    #: Total wall clock for the whole operation.
    total_seconds: float = 0.0
    #: Per-call durations, so a single slow call is visible rather than averaged away.
    call_seconds: list[float] = field(default_factory=list)

    @property
    def engine_seconds(self) -> float:
        """Everything that was not waiting on the provider.

        Clamped at zero: the two clocks are read at different moments and a run with
        no provider calls can otherwise come out fractionally negative, which is a
        measurement artefact rather than a result.
        """
        return max(0.0, self.total_seconds - self.provider_seconds)

    @property
    def provider_share(self) -> float:
        """Fraction of the run spent waiting, between 0 and 1."""
        if self.total_seconds <= 0:
            return 0.0
        return min(1.0, self.provider_seconds / self.total_seconds)


class TimingTransport(httpx.AsyncBaseTransport):
    """Wraps a real transport and records how long each request took.

    At the transport layer rather than around `client.post`, because that is below
    every convenience method — anything the engine does to reach the gateway is
    counted, including a retry the caller never sees.
    """

    def __init__(self, inner: httpx.AsyncBaseTransport, timings: Timings) -> None:
        self._inner = inner
        self._timings = timings

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        started = time.perf_counter()
        try:
            return await self._inner.handle_async_request(request)
        finally:
            elapsed = time.perf_counter() - started
            self._timings.provider_seconds += elapsed
            self._timings.provider_calls += 1
            self._timings.call_seconds.append(elapsed)

    async def aclose(self) -> None:
        await self._inner.aclose()


def timed_client(timings: Timings, **kwargs) -> httpx.AsyncClient:
    """An ordinary async client that happens to record what it waited for."""
    return httpx.AsyncClient(transport=TimingTransport(httpx.AsyncHTTPTransport(), timings), **kwargs)
