from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.deps import get_db, get_current_user
from models.folio import Folio, FolioItem, FolioStatus, FolioItemType
from schemas.folio import FolioItemCreate, FolioResponse, FolioItemResponse

router = APIRouter(prefix="/folios", tags=["folios"])


def _build_folio_response(folio: Folio) -> FolioResponse:
    items = [FolioItemResponse.model_validate(i) for i in folio.items]
    total_charges = sum(
        i.amount for i in folio.items
        if i.item_type in (FolioItemType.ROOM_CHARGE, FolioItemType.EXTRA_CHARGE)
    )
    total_discounts = sum(i.amount for i in folio.items if i.item_type == FolioItemType.DISCOUNT)
    total_payments = sum(i.amount for i in folio.items if i.item_type == FolioItemType.PAYMENT)
    balance = total_charges - total_discounts - total_payments
    return FolioResponse(
        id=folio.id,
        reservation_id=folio.reservation_id,
        status=folio.status,
        items=items,
        total_charges=total_charges,
        total_payments=total_payments + total_discounts,
        balance=balance,
    )


@router.get("/{folio_id}", response_model=FolioResponse)
def get_folio(folio_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    folio = db.get(Folio, folio_id)
    if not folio: raise HTTPException(404, "Folio not found")
    return _build_folio_response(folio)


@router.post("/{folio_id}/items", response_model=FolioResponse, status_code=201)
def add_folio_item(folio_id: int, body: FolioItemCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    folio = db.get(Folio, folio_id)
    if not folio: raise HTTPException(404, "Folio not found")
    if folio.status == FolioStatus.CLOSED:
        raise HTTPException(400, "Cannot add items to a closed folio")
    if body.item_type == FolioItemType.ROOM_CHARGE:
        raise HTTPException(400, "ROOM_CHARGE items are added automatically during check-in")
    item = FolioItem(folio_id=folio_id, **body.model_dump())
    db.add(item); db.commit()
    db.refresh(folio)
    return _build_folio_response(folio)


@router.delete("/{folio_id}/items/{item_id}", status_code=204)
def delete_folio_item(folio_id: int, item_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    folio = db.get(Folio, folio_id)
    if not folio: raise HTTPException(404, "Folio not found")
    if folio.status == FolioStatus.CLOSED:
        raise HTTPException(400, "Cannot modify a closed folio")
    item = db.get(FolioItem, item_id)
    if not item or item.folio_id != folio_id:
        raise HTTPException(404, "Item not found")
    if item.item_type == FolioItemType.ROOM_CHARGE:
        raise HTTPException(400, "Cannot delete room charge items")
    db.delete(item); db.commit()
