#!/usr/bin/env python3
"""Fail a CI lane when a selected pytest suite reports skipped tests."""

from __future__ import annotations

import sys
from pathlib import Path
from xml.etree import ElementTree


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("usage: assert_junit_no_skips.py <junit.xml>")
    report = Path(sys.argv[1])
    root = ElementTree.parse(report).getroot()
    suites = [root] if root.tag == "testsuite" else list(root.iter("testsuite"))
    skipped = sum(int(suite.attrib.get("skipped", "0")) for suite in suites)
    tests = sum(int(suite.attrib.get("tests", "0")) for suite in suites)
    if tests == 0:
        raise SystemExit(f"No tests were recorded in {report}.")
    if skipped:
        raise SystemExit(f"Unexpected skips in {report}: {skipped} of {tests} tests.")
    print(f"No-skip gate OK: {tests} tests, 0 skipped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
