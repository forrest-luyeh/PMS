"""
Tenant isolation tests.
Confirms that business APIs return 404 when accessed with a token scoped
to a different hotel (i.e., cross-hotel data leakage is prevented).

Run with:
    cd backend && pytest tests/test_tenant_isolation.py -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
# Import all models so Base.metadata is fully populated
import models.tenant  # noqa
import models.user    # noqa
import models.room    # noqa
import models.guest   # noqa
import models.reservation  # noqa
import models.folio   # noqa
from main import app
from core.deps import get_db
from core.security import hash_password, create_access_token
from models.tenant import Tenant, Brand, Hotel
from models.user import User, UserRole
from models.room import RoomType, Room
from models.guest import Guest

# ---- In-memory SQLite test DB ----

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # All sessions share one connection → same in-memory DB
)
TestingSession = sessionmaker(bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSession()

    # Hotel A
    tenant_a = Tenant(name="Tenant A", slug="tenant-a", contact_email="a@example.com")
    db.add(tenant_a); db.flush()
    brand_a = Brand(tenant_id=tenant_a.id, name="Brand A", slug="brand-a")
    db.add(brand_a); db.flush()
    hotel_a = Hotel(brand_id=brand_a.id, tenant_id=tenant_a.id,
                    name="Hotel A", slug="hotel-a", address="")
    db.add(hotel_a); db.flush()

    # Hotel B
    tenant_b = Tenant(name="Tenant B", slug="tenant-b", contact_email="b@example.com")
    db.add(tenant_b); db.flush()
    brand_b = Brand(tenant_id=tenant_b.id, name="Brand B", slug="brand-b")
    db.add(brand_b); db.flush()
    hotel_b = Hotel(brand_id=brand_b.id, tenant_id=tenant_b.id,
                    name="Hotel B", slug="hotel-b", address="")
    db.add(hotel_b); db.flush()

    # Users
    user_a = User(email="admin_a@test.com", hashed_password=hash_password("pw"),
                  name="Admin A", role=UserRole.ADMIN,
                  hotel_id=hotel_a.id, brand_id=brand_a.id, tenant_id=tenant_a.id)
    user_b = User(email="admin_b@test.com", hashed_password=hash_password("pw"),
                  name="Admin B", role=UserRole.ADMIN,
                  hotel_id=hotel_b.id, brand_id=brand_b.id, tenant_id=tenant_b.id)
    db.add_all([user_a, user_b]); db.flush()

    # RoomType and Room in Hotel A
    rt_a = RoomType(name="Standard", description="", base_rate=1000, max_occupancy=2, hotel_id=hotel_a.id)
    db.add(rt_a); db.flush()
    room_a = Room(number="101", floor=1, room_type_id=rt_a.id, hotel_id=hotel_a.id)
    db.add(room_a); db.flush()

    # Guest in Hotel A
    guest_a = Guest(name="Guest A", phone="0900000001", hotel_id=hotel_a.id)
    db.add(guest_a); db.flush()

    db.commit()

    # Store IDs for test use
    setup_db.hotel_a_id = hotel_a.id
    setup_db.hotel_b_id = hotel_b.id
    setup_db.user_a_id = user_a.id
    setup_db.user_b_id = user_b.id
    setup_db.room_a_id = room_a.id
    setup_db.guest_a_id = guest_a.id

    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


def token_for(user_id, hotel_id, brand_id=None, tenant_id=None):
    return create_access_token(str(user_id), "ADMIN",
                               hotel_id=hotel_id, brand_id=brand_id, tenant_id=tenant_id)


client = TestClient(app)


class TestTenantIsolation:
    def test_rooms_scoped_to_hotel(self):
        """Hotel B user cannot see Hotel A rooms."""
        tok_b = token_for(setup_db.user_b_id, setup_db.hotel_b_id)
        r = client.get("/api/v1/rooms", headers={"Authorization": f"Bearer {tok_b}"})
        assert r.status_code == 200
        # Hotel B has no rooms — list should be empty
        assert r.json() == []

    def test_room_cross_hotel_returns_404(self):
        """Hotel B user cannot access a specific room from Hotel A."""
        tok_b = token_for(setup_db.user_b_id, setup_db.hotel_b_id)
        r = client.get(f"/api/v1/rooms/{setup_db.room_a_id}",
                       headers={"Authorization": f"Bearer {tok_b}"})
        assert r.status_code == 404

    def test_guests_scoped_to_hotel(self):
        """Hotel B user cannot see Hotel A guests."""
        tok_b = token_for(setup_db.user_b_id, setup_db.hotel_b_id)
        r = client.get("/api/v1/guests", headers={"Authorization": f"Bearer {tok_b}"})
        assert r.status_code == 200
        assert r.json()["total"] == 0

    def test_guest_cross_hotel_returns_404(self):
        """Hotel B user cannot access Hotel A guest by ID."""
        tok_b = token_for(setup_db.user_b_id, setup_db.hotel_b_id)
        r = client.get(f"/api/v1/guests/{setup_db.guest_a_id}",
                       headers={"Authorization": f"Bearer {tok_b}"})
        assert r.status_code == 404

    def test_room_types_scoped_to_hotel(self):
        """Hotel B user gets empty room types (none seeded for B)."""
        tok_b = token_for(setup_db.user_b_id, setup_db.hotel_b_id)
        r = client.get("/api/v1/room-types", headers={"Authorization": f"Bearer {tok_b}"})
        assert r.status_code == 200
        assert r.json() == []

    def test_hotel_a_user_sees_own_data(self):
        """Hotel A user can see Hotel A rooms."""
        tok_a = token_for(setup_db.user_a_id, setup_db.hotel_a_id)
        r = client.get("/api/v1/rooms", headers={"Authorization": f"Bearer {tok_a}"})
        assert r.status_code == 200
        assert len(r.json()) == 1
        assert r.json()[0]["number"] == "101"

    def test_hotel_a_guest_visible_to_a(self):
        """Hotel A user can see Hotel A guest."""
        tok_a = token_for(setup_db.user_a_id, setup_db.hotel_a_id)
        r = client.get(f"/api/v1/guests/{setup_db.guest_a_id}",
                       headers={"Authorization": f"Bearer {tok_a}"})
        assert r.status_code == 200
        assert r.json()["name"] == "Guest A"

    def test_no_token_returns_401(self):
        """Unauthenticated requests are rejected."""
        r = client.get("/api/v1/rooms")
        assert r.status_code == 401
