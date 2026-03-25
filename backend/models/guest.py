from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from database import Base


class Guest(Base):
    __tablename__ = "guests"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    id_type = Column(String)       # passport / national_id / etc.
    id_number = Column(String, unique=True, index=True)
    phone = Column(String, nullable=False)
    email = Column(String)
    nationality = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    reservations = relationship("Reservation", back_populates="guest")
