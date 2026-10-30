from pydantic import BaseModel, Field, ConfigDict


class EmployeeCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    dep: str = Field(..., min_length=2, max_length=100)
    salary: float = Field(..., ge=0)
    age: int = Field(..., ge=18, le=100)


class EmployeeUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    dep: str = Field(..., min_length=2, max_length=100)
    salary: float = Field(..., ge=0)
    age: int = Field(..., ge=18, le=100)


class EmployeeResponse(BaseModel):
    id: int
    name: str
    dep: str
    salary: float
    age: int

    model_config = ConfigDict(from_attributes=True)