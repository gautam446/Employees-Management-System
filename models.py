from sqlalchemy import Column, Integer, String, Float
from database import Base


class Employee(Base):
    __tablename__ = "emp"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    dep = Column(String(100), nullable=False)
    salary = Column(Float, nullable=False)
    age = Column(Integer, nullable=False)