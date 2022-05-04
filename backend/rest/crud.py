from backend.rest import models, schemas
from sqlalchemy.orm import Session

from fastapi import Depends

# / crypt password
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")        
def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def hash_password(password):
    return pwd_context.hash(password)
# crypt password /

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_name(db: Session, name: str):
    return db.query(models.User).filter(models.User.username == name).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def auth_user(db:Session, username: str, password: str):
    user = get_user_by_name (db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def get_users(skip: int = 0, limit: int = 100):
    return list(models.User.select().offset(skip).limit(limit))


def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(username=user.username, email=user.email, hashed_password=hash_password(user.password))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_item(db: Session, item: schemas.ItemBase, user_id: int):
    db_item = models.Item(**item.dict(), owner_id=user_id)
    
    if not get_user(db, user_id):
        return {'code': 400, 'detail':'User does not exist'}
    try:
        # db_item.save(force_insert=True)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
    except Exception as e:
        return {'code': 400, 'detail':str(e)}
    
    return db_item


def get_all_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Item).offset(skip).limit(limit).all()


def edit_item(db: Session, item: schemas.ItemBase, user_id: int):
    if not get_user(db, user_id):
        return {'code': 400, 'detail':'User does not exist'}
    
    db_item = db.query(models.Item).filter(models.Item.id == item.id).first()
    
    if not db_item:
        return {'code': 400, 'detail':'Item does not exist'}
    
    for key, value in item.dict().items(): setattr (db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    
    return db_item


def delete_item(db: Session, item: schemas.ItemBase, user_id: int):
    
    if not get_user(db, user_id):
        return {'code': 400, 'detail':'User does not exist'}
    
    db_item = db.query(models.Item).filter(models.Item.id == item.id).first()
    
    if not db_item:
        return {'code': 400, 'detail':'Item does not exist'}
    
    db.delete(db_item)
    db.commit()
    
    return db_item
    


