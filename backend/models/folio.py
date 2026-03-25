import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Numeric, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class FolioStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class FolioItemType(str, enum.Enum):
    ROOM_CHARGE = "ROOM_CHARGE"
    EXTRA_CHARGE = "EXTRA_CHARGE"
    DISCOUNT = "DISCOUNT"
    PAYMENT = "PAYMENT"


class Folio(Base):
    __tablename__ = "folios"
    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=False, unique=True)
    status = Column(SAEnum(FolioStatus), nullable=False, default=FolioStatus.OPEN)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    reservation = relationship("Reservation", back_populates="folio")
    items = relationship("FolioItem", back_populates="folio", order_by="FolioItem.created_at")


class FolioItem(Base):
    __tablename__ = "folio_items"
    id = Column(Integer, primary_key=True, index=True)
    folio_id = Column(Integer, ForeignKey("folios.id"), nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    item_type = Column(SAEnum(FolioItemType), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    folio = relationship("Folio", back_populates="items")
