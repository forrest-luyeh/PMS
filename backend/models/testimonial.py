from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from database import Base


class Testimonial(Base):
    __tablename__ = "testimonials"
    id          = Column(Integer, primary_key=True, index=True)
    tenant_id   = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    author_name = Column(String, nullable=False)
    author_tag  = Column(String, nullable=True)
    quote       = Column(Text, nullable=False)
    sort_order  = Column(Integer, default=0, nullable=False)
    is_active   = Column(Boolean, default=True, nullable=False)
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))
