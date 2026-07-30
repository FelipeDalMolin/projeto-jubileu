from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
REPORT_SCRIPT = ROOT / "ops/jubileu-report.sh"


class ReportPrivacyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.text = REPORT_SCRIPT.read_text(encoding="utf-8")

    def test_retention_and_permissions_are_limited_to_report_files(self) -> None:
        self.assertIn("REPORT_DIR nao pode apontar para um diretorio amplo", self.text)
        self.assertIn("REPORT_DIR deve terminar em jubileu ou jubileu-*", self.text)
        self.assertIn('"$PROJECT_DIR/"*|"$SOURCE_DIR/"*', self.text)
        self.assertIn("REPORT_RETENTION_DAYS deve ser um inteiro nao negativo", self.text)
        self.assertNotIn(
            'find "$REPORT_DIR" -maxdepth 1 -type f -exec chmod 600 {} +',
            self.text,
        )
        self.assertIn("-name 'jubileu-report-*.md'", self.text)
        self.assertIn("-name 'latest.json'", self.text)

    def test_report_does_not_persist_git_filenames_or_commit_subjects(self) -> None:
        self.assertIn("dirty_files=%s", self.text)
        self.assertNotIn("git -C '$SOURCE_DIR' status -sb", self.text)
        self.assertNotIn("git -C '$SOURCE_DIR' log --oneline", self.text)

    def test_report_sections_avoid_raw_tunnel_status_and_journal(self) -> None:
        self.assertNotIn(
            "'$CODE_CLI' tunnel status || true; echo;",
            self.text,
        )
        self.assertNotIn(
            "journalctl --user -u cloudflared --since '$(journal_since)' "
            "--no-pager -n 80",
            self.text,
        )


if __name__ == "__main__":
    unittest.main()
