# The engine as one image, so running it is one command rather than a Python setup.
#
# Issue #7's first expected outcome is a platform "deployable on-premise or on any
# cloud provider", and a README that begins "create a virtualenv" does not meet that
# for an operator who runs containers and nothing else.
#
# Two stages. The first resolves and installs dependencies; the second copies the
# finished environment and the source. That keeps pip, the build tooling and the
# wheel cache out of what ships, and it means a change to the application code does
# not re-resolve dependencies — the expensive layer stays cached.

# ---- stage 1: dependencies --------------------------------------------------------
FROM python:3.12-slim AS builder

# Bytecode is written at build time rather than on first request, so the first call
# after a deploy is not slower than every one after it.
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /build

# Dependencies first and alone, so this layer is rebuilt only when they change.
COPY requirements-runtime.txt ./

# Into a virtualenv rather than the system Python, because copying one directory to
# the runtime stage is simpler and more predictable than copying site-packages out
# from under a distribution's own Python.
#
# --require-hashes refuses to install anything whose hash is not in the file, and
# --only-binary :all: refuses source distributions, which would otherwise run each
# package's own setup script during the build. Both are the same choices CI makes.
RUN python -m venv /opt/venv \
 && /opt/venv/bin/pip install --no-cache-dir --require-hashes --only-binary :all: \
      -r requirements-runtime.txt

# ---- stage 2: what actually ships -------------------------------------------------
FROM python:3.12-slim AS runtime

# PYTHONDONTWRITEBYTECODE keeps the read-only filesystem below from being written to
# at runtime; PYTHONUNBUFFERED makes logs appear when they happen rather than when a
# buffer fills, which is what a container platform expects to collect.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# A non-root user, created before anything is copied so ownership is right the first
# time rather than fixed afterwards with a chown that doubles the layer size.
RUN useradd --create-home --uid 10001 engine

COPY --from=builder /opt/venv /opt/venv

WORKDIR /srv
COPY --chown=engine:engine app ./app

# Numeric, not the name. Kubernetes checks `runAsNonRoot` against the numeric id and
# cannot resolve a name from the image's passwd file, so a named USER can be rejected
# on exactly the platforms issue #7 asks this to be deployable on.
USER 10001:10001

EXPOSE 8000

# The engine's own readiness endpoint, not a TCP check: the port is open before the
# application can serve anything, so a TCP probe reports healthy during startup.
# JSON form, so this does not depend on a shell being present in the image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["python", "-c", "import sys,urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).status == 200 else 1)"]

# No --reload and no --workers. Reload watches the filesystem and belongs to
# development; worker count is a deployment decision that depends on the host, and
# baking one in would override whatever an operator's orchestrator already decided.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
