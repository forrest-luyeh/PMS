import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class ReservationStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    CHECKED_IN = "CHECKED_IN"
    CHECKED_OUT = "CHECKED_OUT"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class ReservationSource(str, enum.Enum):
    WALK_IN = "WALK_IN"
    PHONE = "PHONE"
    OTA = "OTA"
    DIRECT = "DIRECT"


class Reservation(Base):
    __tablename__ = "reservations"
    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, nullable=False, index=True)
    guest_id = Column(Integer, ForeignKey("guests.id"), nullable=False)
    room_type_id = Column(Integer, ForeignKey("room_types.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    adults = Column(Integer, nullable=False, default=1)
    children = Column(Integer, nullable=False, default=0)
    rate_per_night = Column(Numeric(10, 2), nullable=False)
    status = Column(SAEnum(ReservationStatus), nullable=False, default=ReservationStatus.CONFIRMED)
    source = Column(SAEnum(ReservationSource), nullable=False, default=ReservationSource.DIRECT)
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    guest = relationship("Guest", back_populates="reservations")
    room_type = relationship("RoomType")
    room = relationship("Room", back_populates="reservations")
    folio = relationship("Folio", back_populates="reservation", uselist=False)
