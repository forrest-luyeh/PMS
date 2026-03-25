from pydantic import BaseModel, field_validator
from typing import Optional


def _empty_to_none(v):
    return v if v else None


class GuestCreate(BaseModel):
    name: str
    phone: str
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    email: Optional[str] = None
    nationality: Optional[str] = None

    @field_validator('id_number', 'email', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        return _empty_to_none(v)


class GuestUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    email: Optional[str] = None
    nationality: Optional[str] = None

    @field_validator('id_number', 'email', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        return _empty_to_none(v)


class GuestResponse(BaseModel):
    id: int
    name: str
    phone: str
    id_type: Optional[str]
    id_number: Optional[str]
    email: Optional[str]
    nationality: Optional[str]
    model_config = {"from_attributes": True}
