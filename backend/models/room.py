import enum
from sqlalchemy import Column, Integer, String, Numeric, Text, Boolean, Enum as SAEnum, ForeignKey
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
    hotel_id = Column(Integer, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    base_rate = Column(Numeric(10, 2), nullable=False)
    max_occupancy = Column(Integer, nullable=False, default=2)

    room_code  = Column(String, nullable=True)
    bed_type   = Column(String, nullable=True)
    has_window = Column(Boolean, default=True)
    size_sqm   = Column(Numeric(6, 1), nullable=True)

    rooms     = relationship("Room",            back_populates="room_type")
    images    = relationship("RoomTypeImage",   back_populates="room_type", order_by="RoomTypeImage.sort_order")
    amenities = relationship("RoomTypeAmenity", back_populates="room_type")


class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, nullable=False, index=True)
    number = Column(String, nullable=False)
    floor = Column(Integer, nullable=False)
    room_type_id = Column(Integer, ForeignKey("room_types.id"), nullable=False)
    status = Column(SAEnum(RoomStatus), nullable=False, default=RoomStatus.AVAILABLE)
    notes = Column(Text)

    room_type    = relationship("RoomType",    back_populates="rooms")
    reservations = relationship("Reservation", back_populates="room")


class RoomTypeImage(Base):
    __tablename__ = "room_type_images"
    id           = Column(Integer, primary_key=True, index=True)
    room_type_id = Column(Integer, ForeignKey("room_types.id"), nullable=False, index=True)
    url          = Column(String, nullable=False)
    sort_order   = Column(Integer, default=0)
    alt_text     = Column(String, nullable=True)

    room_type = relationship("RoomType", back_populates="images")


class RoomTypeAmenity(Base):
    __tablename__ = "room_type_amenities"
    id           = Column(Integer, primary_key=True, index=True)
    room_type_id = Column(Integer, ForeignKey("room_types.id"), nullable=False, index=True)
    name         = Column(String, nullable=False)
    category     = Column(String, nullable=True)

    room_type = relationship("RoomType", back_populates="amenities")
