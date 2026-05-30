import os
import unittest
from unittest.mock import Mock

import jwt

os.environ.setdefault("DATABASE_URL", "postgresql://localhost/test")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret")

from app.main import _get_tracking_key


class TrackingIdentityTests(unittest.TestCase):
    def test_backend_user_id_claim_counts_as_authenticated(self):
        token = jwt.encode(
            {"userId": "user-1"},
            os.environ["JWT_SECRET"],
            algorithm="HS256",
        )
        request = Mock()
        request.headers = {"authorization": f"Bearer {token}"}
        request.cookies = {}
        request.client = Mock(host="127.0.0.1")

        self.assertEqual(_get_tracking_key(request), ("user:user-1", True))


if __name__ == "__main__":
    unittest.main()
