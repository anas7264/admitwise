import unittest
from tools.validate_backup import validate_backup


class BackupValidationTests(unittest.TestCase):
    def valid_backup(self):
        return {
            "application": "ADMITWISE",
            "schemaVersion": 1,
            "profile": {"id": "default"},
            "institutions": [{
                "id": "abc",
                "institution": "Example University",
                "program": "Electrical Engineering",
                "year": 2027,
                "sourceUrl": "https://example.edu/admission",
                "groups": [{"mode": "all", "rules": [
                    {"field": "bagrutAverage", "operator": "gte", "value": 100}
                ]}]
            }]
        }

    def test_valid_backup(self):
        self.assertEqual(validate_backup(self.valid_backup()), [])

    def test_rejects_unsupported_fields_and_javascript_urls(self):
        data = self.valid_backup()
        data["institutions"][0]["sourceUrl"] = "javascript:alert(1)"
        data["institutions"][0]["groups"][0]["rules"][0]["field"] = "password"
        self.assertGreaterEqual(len(validate_backup(data)), 2)

    def test_rejects_missing_institutions_array(self):
        self.assertTrue(validate_backup({"application": "ADMITWISE", "schemaVersion": 1, "profile": {}}))


if __name__ == "__main__":
    unittest.main()
