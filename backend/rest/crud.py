from . import models, schemas

from fastapi import Depends

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user(user_id: int):
    return models.User.filter(models.User.id == user_id).first()

def get_user_by_name(name: str):
    return models.User.filter(models.User.username == name).first()

def get_user_by_email(email: str):
    return models.User.filter(models.User.email == email).first()
        
def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def hash_password(password):
    return pwd_context.hash(password)

def auth_user(username: str, password: str):
    user = get_user_by_name (username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def get_users(skip: int = 0, limit: int = 100):
    return list(models.User.select().offset(skip).limit(limit))


def create_user(user: schemas.UserCreate):
    db_user = models.User(username=user.username, email=user.email, hashed_password=hash_password(user.password))
    db_user.save()
    return db_user


def new_item(item: schemas.ItemBase, user_id: int):
    db_item = models.Item(**item.dict(), owner_id=user_id)
    
    if not get_user(user_id):
        return {'code': 400, 'detail':'User does not exist'}
    try:
        db_item.save(force_insert=True)
    except Exception as e:
        return {'code': 400, 'detail':str(e)}
    
    return db_item


def get_all_items(skip: int = 0, limit: int = 100):
    return list(models.Item.select().offset(skip).limit(limit))


def edit_item(item: schemas.ItemBase, user_id: int):
    
    db_item = models.Item.filter(models.Item.id == item.id).first()
    
    if not get_user(user_id):
        return {'code': 400, 'detail':'User does not exist'}
    if not db_item:
        return {'code': 400, 'detail':'Item does not exist'}
    
    db_item = models.Item(**item.dict(), owner_id=user_id)
    db_item.save()
    
    return db_item


def delete_item(item: schemas.ItemBase, user_id: int):
    db_item = models.Item.filter(models.Item.id == item.id).first()
    
    if not get_user(user_id):
        return {'code': 400, 'detail':'User does not exist'}
    if not db_item:
        return {'code': 400, 'detail':'Item does not exist'}
    
    db_item = models.Item(**item.dict(), owner_id=user_id)
    db_item.delete_instance() 
    
    return db_item
    


