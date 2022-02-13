import peewee

from .database import db


class User(peewee.Model):
    username = peewee.CharField()
    email = peewee.CharField(unique=True, index=True)
    hashed_password = peewee.CharField()
    is_active = peewee.BooleanField(default=True)

    class Meta:
        database = db


class Item(peewee.Model):
    id = peewee.IntegerField(primary_key=True, unique=True, index=True)
    name = peewee.CharField(index=True)
    recent = peewee.IntegerField()
    image = peewee.CharField()
    owner = peewee.ForeignKeyField(User, backref="items")

    class Meta:
        database = db