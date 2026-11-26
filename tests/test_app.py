import unittest
from app import app


class ApplicationSmokeTests(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True)
        self.client = app.test_client()

    def test_home_returns_arabic_rtl_application_shell(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn('lang="ar"', response.get_data(as_text=True))
        self.assertIn('dir="rtl"', response.get_data(as_text=True))
        self.assertIn("ADMITWISE", response.get_data(as_text=True))

    def test_health_endpoint_is_non_sensitive(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "ok")
        self.assertNotIn("profile", response.get_json())
        self.assertNotIn("institutions", response.get_json())

    def test_security_headers_are_present(self):
        response = self.client.get("/")
        self.assertEqual(response.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(response.headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(response.headers.get("Referrer-Policy"), "no-referrer")
        self.assertIn("default-src 'self'", response.headers.get("Content-Security-Policy", ""))

    def test_application_assets_are_served(self):
        for path in ("/app.js", "/core.js", "/styles.css", "/sw.js", "/manifest.webmanifest", "/favicon.svg"):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
                self.assertGreater(len(response.data), 0)


if __name__ == "__main__":
    unittest.main()
