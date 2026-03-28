from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base


class Guest(Base):
    __tablename__ = "guests"
    __table_args__ = (UniqueConstraint("hotel_id", "id_number", name="uq_guest_hotel_id_number"),)
    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, nullable=False, index=True)
    name = Column(String, nullable=False)
    id_type = Column(String)
    id_number = Column(String, index=True)
    phone = Column(String, nullable=False)
    email = Column(String)
    nationality = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    reservations = relationship("Reservation", back_populates="guest")
