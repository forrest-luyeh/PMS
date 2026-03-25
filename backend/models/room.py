import enum
from sqlalchemy import Column, Integer, String, Numeric, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class RoomStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    OCCUPIED = "OCCUPIED"
    DIRTY = "DIRTY"
    OUT_OF_ORDER = "OUT_OF_ORDER"


class RoomType(Base):
    __tablename__ = "room_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    base_rate = Column(Numeric(10, 2), nullable=False)
    max_occupancy = Column(Integer, nullable=False, default=2)

    rooms = relationship("Room", back_populates="room_type")


class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, nullable=False, unique=True)
    floor = Column(Integer, nullable=False)
    room_type_id = Column(Integer, ForeignKey("room_types.id"), nullable=False)
    status = Column(SAEnum(RoomStatus), nullable=False, default=RoomStatus.AVAILABLE)
    notes = Column(Text)

    room_type = relationship("RoomType", back_populates="rooms")
    reservations = relationship("Reservation", back_populates="room")
