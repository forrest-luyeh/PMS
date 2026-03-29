from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from database import Base


class HeroSlide(Base):
    __tablename__ = "hero_slides"
    id          = Column(Integer, primary_key=True, index=True)
    tenant_id   = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    image_url   = Column(String, nullable=False)
    label       = Column(String, nullable=True)   # small top text e.g. "Brand Series"
    headline    = Column(String, nullable=False)
    subline     = Column(String, nullable=True)
    link_url    = Column(String, nullable=True)
    link_label  = Column(String, nullable=True)
    sort_order  = Column(Integer, default=0, nullable=False)
    is_active   = Column(Boolean, default=True, nullable=False)
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))
