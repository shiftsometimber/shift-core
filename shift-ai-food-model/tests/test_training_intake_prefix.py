"""A truncated credit record must never become image-rights evidence."""
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from openimages_training_intake import rows


class CreditPrefixChecks(unittest.TestCase):
    def test_incomplete_credit_rows_are_not_admitted(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "credits.csv"
            path.write_text('ImageID,Author,License\ncomplete,Photographer,CC BY\nincomplete,Someone')
            self.assertEqual(list(rows(path)), [{"ImageID": "complete", "Author": "Photographer", "License": "CC BY"}])


if __name__ == '__main__':
    unittest.main()
