from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "nginx-log-aggregate.py"
SPEC = importlib.util.spec_from_file_location("nginx_log_aggregate", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
nginx_log_aggregate = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(nginx_log_aggregate)


class NginxLogAggregateTest(unittest.TestCase):
    def test_extracts_status_from_json_and_combined_formats(self):
        json_line = '{"route":"/api/ready","status":200}'
        combined_line = (
            '127.0.0.1 - - [29/Jul/2026:10:00:00 -0300] '
            '"GET /api/ready HTTP/1.1" 503 20 "-" "probe"'
        )

        self.assertEqual(nginx_log_aggregate.extract(json_line, "status"), "200")
        self.assertEqual(nginx_log_aggregate.extract(combined_line, "status"), "503")

    def test_routes_drop_query_and_normalize_identifiers_in_both_formats(self):
        json_line = (
            '{"route":"/api/dias/{data_iso}/eventos/123?token=nao-pode-aparecer",'
            '"status":200}'
        )
        combined_line = (
            '127.0.0.1 - - [29/Jul/2026:10:00:00 -0300] '
            '"GET /api/dias/2026-07-29/eventos/123?nome=nao-pode-aparecer '
            'HTTP/1.1" 200 20 "-" "browser"'
        )

        self.assertEqual(
            nginx_log_aggregate.extract(json_line, "route"),
            "/api/dias/{data_iso}/eventos/{id}",
        )
        self.assertEqual(
            nginx_log_aggregate.extract(combined_line, "route"),
            "/api/dias/{date}/eventos/{id}",
        )

    def test_unknown_literal_segments_are_never_emitted(self):
        line = (
            '127.0.0.1 - - [29/Jul/2026:10:00:00 -0300] '
            '"GET /pessoa/Maria-da-Silva?cpf=000 HTTP/1.1" 404 20 "-" "browser"'
        )

        route = nginx_log_aggregate.extract(line, "route")

        self.assertEqual(route, "/{segment}/{segment}")
        self.assertNotIn("Maria", route)
        self.assertNotIn("cpf", route)


if __name__ == "__main__":
    unittest.main()
