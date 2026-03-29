import re
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from core.deps import get_db, require_role, get_tenant_context
from models.post import Post, PostType
from models.tenant import Tenant
from models.user import UserRole
from schemas.post import PostCreate, PostUpdate, PostListResponse, PostResponse

router = APIRouter(prefix="/posts", tags=["posts"])

_ALLOWED_ROLES = ("TENANT_ADMIN", "BRAND_ADMIN", "ADMIN")


def _make_slug(title: str) -> str:
    """Generate a URL-safe slug from a title."""
    s = title.lower()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s).strip("-")
    s = re.sub(r"-+", "-", s)
    # If the result is empty (e.g. pure CJK title), return a placeholder
    return s if s else "post"


def _resolve_tenant_id(current_user, tenant: Optional[Tenant]) -> int:
    """Return tenant_id for the current user."""
    if current_user.role == UserRole.SUPER_ADMIN:
        if tenant is None:
            raise HTTPException(400, "SUPER_ADMIN must provide tenant context")
        return tenant.id
    tid = getattr(current_user, "_token_tenant_id", None) or current_user.tenant_id
    if tid is None:
        raise HTTPException(403, "No tenant context in token")
    return tid


@router.get("", response_model=list[PostListResponse])
def list_posts(
    type: Optional[PostType] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ALLOWED_ROLES)),
    tenant=Depends(get_tenant_context),
):
    tenant_id = _resolve_tenant_id(current_user, tenant)
    q = db.query(Post).filter(Post.tenant_id == tenant_id)
    if type:
        q = q.filter(Post.post_type == type)
    q = q.order_by(Post.created_at.desc())
    return q.offset((page - 1) * limit).limit(limit).all()


@router.post("", response_model=PostResponse, status_code=201)
def create_post(
    body: PostCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ALLOWED_ROLES)),
    tenant=Depends(get_tenant_context),
):
    tenant_id = _resolve_tenant_id(current_user, tenant)

    # Generate slug from title if not provided
    base_slug = _make_slug(body.slug or body.title)
    slug = base_slug
    counter = 1
    while db.query(Post).filter_by(tenant_id=tenant_id, slug=slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    post = Post(
        tenant_id=tenant_id,
        post_type=body.post_type,
        title=body.title,
        slug=slug,
        excerpt=body.excerpt,
        body=body.body,
        cover_image_url=body.cover_image_url,
        video_url=body.video_url,
        is_published=body.is_published,
        published_at=body.published_at,
    )
    db.add(post)
    db.flush()

    # If slug was placeholder (pure CJK), use post-{id}
    if post.slug == "post":
        post.slug = f"post-{post.id}"
    db.commit()
    db.refresh(post)
    return post


@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ALLOWED_ROLES)),
    tenant=Depends(get_tenant_context),
):
    tenant_id = _resolve_tenant_id(current_user, tenant)
    post = db.query(Post).filter_by(id=post_id, tenant_id=tenant_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    return post


@router.put("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    body: PostUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ALLOWED_ROLES)),
    tenant=Depends(get_tenant_context),
):
    tenant_id = _resolve_tenant_id(current_user, tenant)
    post = db.query(Post).filter_by(id=post_id, tenant_id=tenant_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(post, field, val)
    post.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(post)
    return post


@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ALLOWED_ROLES)),
    tenant=Depends(get_tenant_context),
):
    tenant_id = _resolve_tenant_id(current_user, tenant)
    post = db.query(Post).filter_by(id=post_id, tenant_id=tenant_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    db.delete(post)
    db.commit()


@router.patch("/{post_id}/publish", response_model=PostResponse)
def publish_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ALLOWED_ROLES)),
    tenant=Depends(get_tenant_context),
):
    tenant_id = _resolve_tenant_id(current_user, tenant)
    post = db.query(Post).filter_by(id=post_id, tenant_id=tenant_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    post.is_published = True
    if not post.published_at:
        post.published_at = datetime.now(timezone.utc)
    post.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(post)
    return post


@router.patch("/{post_id}/unpublish", response_model=PostResponse)
def unpublish_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*_ALLOWED_ROLES)),
    tenant=Depends(get_tenant_context),
):
    tenant_id = _resolve_tenant_id(current_user, tenant)
    post = db.query(Post).filter_by(id=post_id, tenant_id=tenant_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    post.is_published = False
    post.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(post)
    return post
