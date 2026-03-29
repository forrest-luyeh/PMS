from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.deps import get_db, require_role, get_tenant_context
from models import HeroSlide
from schemas.hero_slide import HeroSlideCreate, HeroSlideUpdate, HeroSlideResponse

router = APIRouter(prefix="/hero-slides", tags=["hero-slides"])


@router.get("", response_model=list[HeroSlideResponse])
def list_hero_slides(
    db: Session = Depends(get_db),
    tenant=Depends(get_tenant_context),
):
    return db.query(HeroSlide).filter_by(tenant_id=tenant.id).order_by(HeroSlide.sort_order).all()


@router.post("", response_model=HeroSlideResponse)
def create_hero_slide(
    body: HeroSlideCreate,
    db: Session = Depends(get_db),
    tenant=Depends(get_tenant_context),
    _=Depends(require_role("TENANT_ADMIN", "BRAND_ADMIN", "ADMIN")),
):
    obj = HeroSlide(**body.model_dump(), tenant_id=tenant.id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{slide_id}", response_model=HeroSlideResponse)
def update_hero_slide(
    slide_id: int,
    body: HeroSlideUpdate,
    db: Session = Depends(get_db),
    tenant=Depends(get_tenant_context),
    _=Depends(require_role("TENANT_ADMIN", "BRAND_ADMIN", "ADMIN")),
):
    obj = db.query(HeroSlide).filter_by(id=slide_id, tenant_id=tenant.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="HeroSlide not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{slide_id}")
def delete_hero_slide(
    slide_id: int,
    db: Session = Depends(get_db),
    tenant=Depends(get_tenant_context),
    _=Depends(require_role("TENANT_ADMIN", "BRAND_ADMIN", "ADMIN")),
):
    obj = db.query(HeroSlide).filter_by(id=slide_id, tenant_id=tenant.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="HeroSlide not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}
