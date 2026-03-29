from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base



class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    contact_email = Column(String, nullable=False)
    contact_phone = Column(String, nullable=True)
    social_instagram = Column(String, nullable=True)
    social_facebook  = Column(String, nullable=True)
    social_line      = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    brands = relationship("Brand", back_populates="tenant")
    hotels = relationship("Hotel", back_populates="tenant")


class Brand(Base):
    __tablename__ = "brands"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant", back_populates="brands")
    hotels = relationship("Hotel", back_populates="brand")


class Hotel(Base):
    __tablename__ = "hotels"
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False)
    address = Column(String)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    phone          = Column(String, nullable=True)
    region         = Column(String, nullable=True)
    license_number = Column(String, nullable=True)
    check_in_time  = Column(String, nullable=True)
    check_out_time = Column(String, nullable=True)
    description    = Column(Text, nullable=True)
    is_featured    = Column(Boolean, default=False, nullable=False)

    brand     = relationship("Brand",        back_populates="hotels")
    tenant    = relationship("Tenant",       back_populates="hotels")
    images    = relationship("HotelImage",   back_populates="hotel",   order_by="HotelImage.sort_order")
    amenities = relationship("HotelAmenity", back_populates="hotel")


class HotelImage(Base):
    __tablename__ = "hotel_images"
    id         = Column(Integer, primary_key=True, index=True)
    hotel_id   = Column(Integer, ForeignKey("hotels.id"), nullable=False, index=True)
    url        = Column(String, nullable=False)
    sort_order = Column(Integer, default=0)
    alt_text   = Column(String, nullable=True)

    hotel = relationship("Hotel", back_populates="images")


class HotelAmenity(Base):
    __tablename__ = "hotel_amenities"
    id       = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), nullable=False, index=True)
    name     = Column(String, nullable=False)
    category = Column(String, nullable=True)

    hotel = relationship("Hotel", back_populates="amenities")
