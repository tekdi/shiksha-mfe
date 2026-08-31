"""Measuring how long this engine takes, and where the time goes.

Not a test suite. These run against a live model provider and cost real calls, so
they are a command you run deliberately rather than something CI executes.

The one thing worth saying up front: **total wall-clock time is not a useful number
on its own.** Most of it is a hosted model answering over the internet, which says
more about the provider and the network than about this code. So every measurement
here splits into two:

* **provider time** — spent waiting on an HTTP call to the model gateway
* **engine time** — everything else: parsing, sectioning, validation, packaging, zip

A tenant plans capacity against the second one, because that is what they pay for in
CPU and what changes when they self-host a model. The first tells them what to expect
from whichever provider they point us at.
"""
