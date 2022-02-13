from typing import Any, List, Optional

import peewee
from pydantic import BaseModel
from pydantic.utils import GetterDict


class PeeweeGetterDict(GetterDict):
    def get(self, key: Any, default: Any = None):
        res = getattr(self._obj, key, default)
        if isinstance(res, peewee.ModelSelect):
            return list(res)
        return res


class ItemBase(BaseModel):
    id : int
    name : str
    recent : int
    image : str 

class Item(ItemBase):
    owner_id: int

    class Config:
        orm_mode = True
        getter_dict = PeeweeGetterDict


class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    items: List[Item] = []

    class Config:
        orm_mode = True
        getter_dict = PeeweeGetterDict
        
        
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id : int