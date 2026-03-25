from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from models.folio import FolioStatus, FolioItemType


class FolioItemCreate(BaseModel):
    description: str
    amount: Decimal
    item_type: FolioItemType


class FolioItemResponse(BaseModel):
    id: int
    description: str
    amount: Decimal
    item_type: FolioItemType
    created_at: datetime
    model_config = {"from_attributes": True}


class FolioResponse(BaseModel):
    id: int
    reservation_id: int
    status: FolioStatus
    items: List[FolioItemResponse] = []
    total_charges: Decimal = Decimal("0")
    total_payments: Decimal = Decimal("0")
    balance: Decimal = Decimal("0")
    model_config = {"from_attributes": True}
