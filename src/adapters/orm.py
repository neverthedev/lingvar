from sqlalchemy import Table, Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import mapper
from src.models.user import User
from src.db import get_metadata

user_table = Table(
    "user",
    get_metadata(),
    Column("id", Integer, primary_key=True),
    Column("username", String(50)),
    Column("password", String(20)),
)

word_table = Table(
    "word",
    get_metadata(),
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("user.id")),
    Column("original", String(50)),
    Column("translation", String(20)),
    Column('created', DateTime)
)


mapper(User, user_table)
