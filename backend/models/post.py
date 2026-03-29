import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Enum as SAEnum
from database import Base


class PostType(str, enum.Enum):
    ACTIVITY      = "activity"
    NEWS          = "news"
    TRAVELER      = "traveler"
    UNCATEGORIZED = "uncategorized"


class Post(Base):
    __tablename__ = "posts"
    __table_args__ = (UniqueConstraint("tenant_id", "slug", name="uq_post_tenant_slug"),)

    id              = Column(Integer, primary_key=True, index=True)
    tenant_id       = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    post_type       = Column(SAEnum(PostType), nullable=False, default=PostType.NEWS)
    title           = Column(String, nullable=False)
    slug            = Column(String, nullable=False, index=True)
    excerpt         = Column(Text, nullable=True)
    body            = Column(Text, nullable=True)
    cover_image_url = Column(String, nullable=True)
    video_url       = Column(String, nullable=True)
    is_published    = Column(Boolean, default=False, nullable=False)
    published_at    = Column(DateTime, nullable=True)
    created_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                             onupdate=lambda: datetime.now(timezone.utc))
