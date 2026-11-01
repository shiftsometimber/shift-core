"""CC deed canonicalisation must not admit restricted or unrelated licences."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from openimages_intake import cc_by_2, LicenceLinks


class PublicImageLicenceChecks(unittest.TestCase):
    def test_actual_photo_page_translated_deed_is_the_same_cc_by_2_licence(self):
        parser = LicenceLinks(); parser.feed('<a rel="license noopener" href="https://creativecommons.org/licenses/by/2.0/deed.en">CC BY</a>')
        self.assertTrue(any(cc_by_2(link) for link in parser.links))
        self.assertTrue(cc_by_2('https://creativecommons.org/licenses/by/2.0/'))
        self.assertTrue(cc_by_2('https://creativecommons.org/licenses/by/2.0/legalcode'))

    def test_restricted_licences_and_lookalike_hosts_are_never_canonicalised_to_by(self):
        for link in ('https://creativecommons.org/licenses/by-nc/2.0/deed.en',
                     'https://creativecommons.org/licenses/by-sa/2.0/deed.en',
                     'https://creativecommons.org/licenses/by-nd/2.0/deed.en',
                     'https://creativecommons.org/licenses/by/4.0/deed.en',
                     'https://creativecommons.org.evil.example/licenses/by/2.0/',
                     'https://other.example/licenses/by/2.0/'):
            self.assertFalse(cc_by_2(link))


if __name__ == '__main__':
    unittest.main()
