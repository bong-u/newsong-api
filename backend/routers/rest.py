from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from typing import List
from jose import JWTError, jwt
from datetime import datetime, timedelta
from decouple import config

from backend.rest import crud, database, models, schemas

from sqlalchemy.orm import Session
from backend.rest.database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
            
router = APIRouter(
    prefix='',
    tags=['auth'],
    dependencies=[],
)


SECRET_KEY = config('SECRET_KEY')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 30


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login/")


def create_access_token(data: dict):
    to_encode = data.copy()
    expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        id : str = payload.get("sub")
        if id is None:
            raise credentials_exception
        token_data = schemas.TokenData(id=id)
        
    except JWTError:
        raise credentials_exception
        
    user = crud.get_user (db, token_data.id)
    if user is None:
        raise credentials_exception

    return user
        

@router.post("/login/", response_model=schemas.Token)
async def login (form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.auth_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={'sub': str(user.id)})
    
    return {'access_token': access_token, 'token_type': 'bearer'}
    
@router.post("/signup/", response_model=schemas.User)
def signup(new_user: schemas.UserCreate, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db=db, email=new_user.email)
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    return crud.create_user(db, user=new_user)


@router.get("/user/", response_model=schemas.User)
async def current_user(user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user


@router.post("/item/", response_model=schemas.Item)
def new_item(item: schemas.ItemBase, user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    
    res = crud.create_item(db, item=item, user_id=user.id)
    
    if not isinstance(res, models.Item):
        raise HTTPException(status_code=res['code'], detail=res['detail'])
    
    return res

@router.get("/item/", response_model=List[schemas.Item])
def get_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items = crud.get_all_items(db=db, skip=skip, limit=limit)
    return items

@router.put("/item/", response_model=schemas.Item)
async def update_item(item: schemas.ItemBase, user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    
    res = crud.edit_item(db, item=item, user_id=user.id)
    
    if not isinstance(res, models.Item):
        raise HTTPException(status_code=res['code'], detail=res['detail'])
    
    return res

@router.delete("/item/", response_model=schemas.Item)
async def delete_item(item: schemas.ItemBase, user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    
    res = crud.delete_item(db, item=item, user_id=user.id)
    
    if not isinstance(res, models.Item):
        raise HTTPException(status_code=res['code'], detail=res['detail'])
    
    return res