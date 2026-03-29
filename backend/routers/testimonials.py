from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.deps import get_db, require_role, get_tenant_context
from models import Testimonial
from schemas.testimonial import TestimonialCreate, TestimonialUpdate, TestimonialResponse

router = APIRouter(prefix="/testimonials", tags=["testimonials"])


@router.get("", response_model=list[TestimonialResponse])
def list_testimonials(
    db: Session = Depends(get_db),
    tenant=Depends(get_tenant_context),
):
    return db.query(Testimonial).filter_by(tenant_id=tenant.id).order_by(Testimonial.sort_order).all()


@router.post("", response_model=TestimonialResponse)
def create_testimonial(
    body: TestimonialCreate,
    db: Session = Depends(get_db),
    tenant=Depends(get_tenant_context),
    _=Depends(require_role("TENANT_ADMIN", "BRAND_ADMIN", "ADMIN")),
):
    obj = Testimonial(**body.model_dump(), tenant_id=tenant.id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{testimonial_id}", response_model=TestimonialResponse)
def update_testimonial(
    testimonial_id: int,
    body: TestimonialUpdate,
    db: Session = Depends(get_db),
    tenant=Depends(get_tenant_context),
    _=Depends(require_role("TENANT_ADMIN", "BRAND_ADMIN", "ADMIN")),
):
    obj = db.query(Testimonial).filter_by(id=testimonial_id, tenant_id=tenant.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{testimonial_id}")
def delete_testimonial(
    testimonial_id: int,
    db: Session = Depends(get_db),
    tenant=Depends(get_tenant_context),
    _=Depends(require_role("TENANT_ADMIN", "BRAND_ADMIN", "ADMIN")),
):
    obj = db.query(Testimonial).filter_by(id=testimonial_id, tenant_id=tenant.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}
