from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
CONFIGS = (
    ROOT / "infra/nginx/jubileu.conf",
    ROOT / "infra/nginx/jubileu.dev.conf",
)


class NginxPrivacyConfigTests(unittest.TestCase):
    def test_access_log_uses_fail_closed_route_templates(self) -> None:
        for config in CONFIGS:
            text = config.read_text(encoding="utf-8")
            with self.subTest(config=config.name):
                self.assertIn("map $uri $jubileu_log_route", text)
                self.assertIn('default "<unmatched>";', text)
                self.assertIn("error_log /dev/stderr crit;", text)
                self.assertIn('"route":"$jubileu_log_route"', text)
                self.assertNotIn('"route":"$uri"', text)
                self.assertIn("map $http_cf_ray $jubileu_cf_ray", text)
                self.assertIn('"cf_ray":"$jubileu_cf_ray"', text)
                self.assertNotIn('"cf_ray":"$http_cf_ray"', text)
                self.assertIn("~^00-(?!0{32}-)", text)
                self.assertIn(
                    'proxy_set_header tracestate "";',
                    text,
                )
                self.assertNotIn("$http_tracestate", text)
                self.assertIn('"/api/jogadores/{jogador_id}"', text)
                self.assertIn('"/api/eventos/{evento_id}/{operation}"', text)


if __name__ == "__main__":
    unittest.main()
