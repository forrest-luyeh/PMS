from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from models.post import PostType


class PostCreate(BaseModel):
    post_type: PostType = PostType.NEWS
    title: str
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    body: Optional[str] = None
    cover_image_url: Optional[str] = None
    video_url: Optional[str] = None
    is_published: bool = False
    published_at: Optional[datetime] = None


class PostUpdate(BaseModel):
    post_type: Optional[PostType] = None
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    body: Optional[str] = None
    cover_image_url: Optional[str] = None
    video_url: Optional[str] = None
    is_published: Optional[bool] = None
    published_at: Optional[datetime] = None


class PostListResponse(BaseModel):
    id: int
    post_type: PostType
    title: str
    slug: str
    excerpt: Optional[str]
    cover_image_url: Optional[str]
    is_published: bool
    published_at: Optional[datetime]
    created_at: datetime
    model_config = {"from_attributes": True}


class PostResponse(BaseModel):
    id: int
    tenant_id: int
    post_type: PostType
    title: str
    slug: str
    excerpt: Optional[str]
    body: Optional[str]
    cover_image_url: Optional[str]
    video_url: Optional[str]
    is_published: bool
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}
