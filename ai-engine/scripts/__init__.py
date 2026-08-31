"""Operational tools that are not part of the service and are not tests.

`smoke` verifies a *running deployment* rather than the code: that the image was
built from the code you think, that configuration reaches it, and that every route
the service advertises actually answers from wherever it is running.
"""
