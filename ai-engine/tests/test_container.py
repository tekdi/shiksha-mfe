"""The container definition, checked without needing Docker.

None of this builds an image — CI has no daemon and a test that silently skips is
worse than no test. What it checks is the thing that actually rots: the runtime lock
drifting away from the dependencies the project declares, so the image builds fine on
the day it is written and fails months later for someone who added a package and had
no reason to know a second file existed.

The Dockerfile itself was verified by building and running it: the image serves
`/ingest` and `/summarize/file`, reports healthy through its own healthcheck, runs as
a non-root user, and answers with a read-only root filesystem. That is recorded in
`docs/deployment.md` rather than asserted here, because asserting it would mean
running Docker inside the test suite.
"""

from __future__ import annotations

import re
import tomllib
from pathlib import Path

import pytest

ENGINE = Path(__file__).resolve().parents[1]
LOCK = ENGINE / "requirements-runtime.txt"
DOCKERFILE = ENGINE / "Dockerfile"
COMPOSE = ENGINE / "docker-compose.yml"


def pyproject() -> dict:
    return tomllib.loads((ENGINE / "pyproject.toml").read_text())


def locked_packages() -> set[str]:
    """Every distribution the runtime lock pins, normalised the way pip compares them."""
    names = set()
    for line in LOCK.read_text().splitlines():
        match = re.match(r"^([A-Za-z0-9][A-Za-z0-9._-]*)==", line)
        if match:
            names.add(re.sub(r"[-_.]+", "-", match.group(1)).lower())
    return names


def declared(section: list[str]) -> set[str]:
    """Distribution names out of a dependency list, without their version specifiers."""
    names = set()
    for entry in section:
        name = re.split(r"[<>=!\[; ]", entry.strip(), maxsplit=1)[0]
        if name:
            names.add(re.sub(r"[-_.]+", "-", name).lower())
    return names


def dockerfile_instructions() -> str:
    """The Dockerfile with its comments stripped.

    A first version of the worker-count test below asserted against the raw file and
    failed on the comment *explaining* why there is no `--workers`. Asserting on prose
    is worse than not asserting: it fails when the reasoning is written down and passes
    when the documentation is deleted. Only the instructions are evidence.
    """
    lines = [ln for ln in DOCKERFILE.read_text().splitlines() if not ln.lstrip().startswith("#")]
    return "\n".join(lines)


def test_every_runtime_dependency_is_pinned_in_the_lock():
    """The failure this prevents: someone adds a dependency, the tests pass because
    their virtualenv already has it, and the image fails to import months later."""
    missing = declared(pyproject()["project"]["dependencies"]) - locked_packages()
    assert not missing, f"declared but not in requirements-runtime.txt: {sorted(missing)}"


def test_the_spelling_extra_ships_in_the_image():
    """The prose gateway is a feature of the service, not a developer convenience.
    Left out, the check degrades to "skipped, and here is why" in production."""
    extra = pyproject()["project"]["optional-dependencies"]["spelling"]
    missing = declared(extra) - locked_packages()
    assert not missing, f"the spelling extra is not in the runtime lock: {sorted(missing)}"


def test_the_test_tooling_does_not_ship():
    """pytest in a production image is dead weight and extra attack surface."""
    dev = declared(pyproject()["project"]["optional-dependencies"]["dev"])
    leaked = dev & locked_packages()
    assert not leaked, f"development-only packages are in the runtime lock: {sorted(leaked)}"


def test_every_pin_carries_a_hash():
    """Installed with --require-hashes, so a pin without one fails the build. Catching
    it here names the package instead of leaving a build log to be read."""
    text = LOCK.read_text()
    pins = re.findall(r"^([A-Za-z0-9][A-Za-z0-9._-]*)==\S+(.*)$", text, re.MULTILINE)
    unhashed = [name for name, rest in pins if "--hash" not in rest and "\\" not in rest]
    assert not unhashed, f"pinned without a hash: {unhashed}"


# --- the container definition refers to things that exist ---------------------------


def test_the_dockerfile_installs_from_the_runtime_lock():
    """Not from pyproject directly, which would resolve fresh on every build and make
    two images built a week apart quietly different."""
    body = dockerfile_instructions()
    assert "requirements-runtime.txt" in body
    assert "--require-hashes" in body
    assert "--only-binary :all:" in body


def test_the_image_does_not_run_as_root():
    """A numeric id, not a name. Kubernetes checks `runAsNonRoot` against the numeric
    uid and cannot resolve a name out of the image's passwd file, so a named USER can
    be rejected on exactly the platforms this is meant to be deployable on."""
    body = dockerfile_instructions()
    match = re.search(r"^USER\s+(\d+)", body, re.MULTILINE)
    assert match, "no USER instruction with a numeric uid"
    assert int(match.group(1)) != 0, "uid 0 is root"


def test_the_healthcheck_asks_the_application_not_the_port():
    """A TCP check reports healthy the moment the port is open, which is before the
    application can answer anything."""
    assert "/health" in dockerfile_instructions()


def test_the_container_does_not_bake_in_a_worker_count():
    """How many workers to run is a deployment decision. Baking one in would override
    whatever an operator's orchestrator already decided."""
    body = dockerfile_instructions()
    assert "--workers" not in body
    assert "--reload" not in body, "reload watches the filesystem and belongs to development"


def test_the_dockerignore_keeps_secrets_out_of_the_build_context():
    """A developer's .env sitting beside the Dockerfile must not reach an image."""
    ignored = (ENGINE / ".dockerignore").read_text()
    assert ".env" in ignored
    assert ".venv/" in ignored


@pytest.mark.parametrize("path", [DOCKERFILE, COMPOSE, LOCK, ENGINE / ".dockerignore"])
def test_the_deployment_files_are_present(path):
    assert path.is_file(), f"{path.name} is referenced by the documentation and must exist"


def test_compose_reads_configuration_from_the_environment_only():
    """So there is no container-specific way to configure this that drifts from
    `app/config.py`."""
    body = COMPOSE.read_text()
    assert "env_file" in body
    assert ".env" in body


# --- the smoke test must keep covering every route ----------------------------------


def test_the_smoke_test_has_a_check_for_every_route_the_app_serves():
    """The drift this prevents: a route is added, the smoke test still reports "all
    passed", and nobody notices it never touched the new one.

    Coverage is established by *running* the sweep against a stub transport rather
    than by searching its source for path strings. Two earlier versions did the
    latter: the first read `app.routes` and saw three paths instead of thirty-three,
    so it asserted almost nothing and passed; the second matched text and could not
    see the paths built in a loop. Executing the real function and asking it what it
    called is exact, and it cannot be fooled by how a path happens to be spelt.
    """
    import httpx

    from app.main import app
    from scripts.smoke import Sweep, run

    served = set(app.openapi()["paths"])
    assert len(served) >= 30, f"only {len(served)} routes seen; the source of truth is wrong again"

    def anything(request: httpx.Request) -> httpx.Response:
        # Truthy JSON, so each stage's result is passed on to the next the way a real
        # run would; a falsy body would make the sweep skip everything downstream.
        return httpx.Response(200, json={"ok": True})

    with httpx.Client(transport=httpx.MockTransport(anything), base_url="http://stub") as client:
        sweep = Sweep(client=client)
        run(sweep, b"%PDF-1.4 stub", audio=None, video=None, video_url="https://example.org/v.mp4")

    missing = sorted(served - sweep.checked())
    assert not missing, f"scripts/smoke.py has no check for: {missing}"


# --- the smoke tool's own inputs ----------------------------------------------------


def test_a_url_that_is_not_http_is_refused():
    """Both URLs come from the command line, and this file is the kind of thing that
    ends up inside a script or a job rather than always being typed by a person."""
    from scripts.smoke import checked_url

    for bad in ("file:///etc/passwd", "gopher://example.org", "/just/a/path", "example.org"):
        with pytest.raises(ValueError):
            checked_url(bad, what="--base-url")


def test_a_url_with_no_host_is_refused():
    from scripts.smoke import checked_url

    with pytest.raises(ValueError):
        checked_url("http://", what="--base-url")


def test_an_ordinary_url_passes_through_unchanged():
    from scripts.smoke import checked_url

    for good in ("http://127.0.0.1:8000", "https://engine.example.org/base"):
        assert checked_url(good, what="--base-url") == good
