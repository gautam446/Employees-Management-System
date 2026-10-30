from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    status
)

from sqlalchemy.orm import Session

from database import get_db
from models import Employee
from schemas import EmployeeCreate, EmployeeUpdate, EmployeeResponse

from auth import get_current_user, require_admin
from limiter import limiter


router = APIRouter(
    prefix="/employees",
    tags=["Employee Management"]
)


# --------------------------------
# ADD EMPLOYEE - ADMIN ONLY
# --------------------------------

@router.post(
    "/",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED
)
@limiter.limit("1/minute")
def add_employee(
    request: Request,
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin)
):

    new_employee = Employee(
        name=employee.name,
        dep=employee.dep,
        salary=employee.salary,
        age=employee.age
    )

    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    return new_employee


# --------------------------------
# GET ALL EMPLOYEES - ADMIN & USER
# --------------------------------

@router.get(
    "/",
    response_model=list[EmployeeResponse]
)
def get_employees(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    employees = db.query(Employee).all()

    return employees


# --------------------------------
# SEARCH EMPLOYEE - ADMIN & USER
# --------------------------------

@router.get(
    "/search/{name}",
    response_model=list[EmployeeResponse]
)
def search_employee(
    name: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    employees = db.query(Employee).filter(
        Employee.name.ilike(f"%{name}%")
    ).all()

    return employees


# --------------------------------
# GET EMPLOYEE BY ID - ADMIN & USER
# --------------------------------

@router.get(
    "/{employee_id}",
    response_model=EmployeeResponse
)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if employee is None:

        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    return employee


# --------------------------------
# UPDATE EMPLOYEE - ADMIN ONLY
# --------------------------------

@router.put(
    "/{employee_id}",
    response_model=EmployeeResponse
)
def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin)
):

    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if employee is None:

        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    employee.name = employee_data.name
    employee.dep = employee_data.dep
    employee.salary = employee_data.salary
    employee.age = employee_data.age

    db.commit()
    db.refresh(employee)

    return employee


# --------------------------------
# DELETE EMPLOYEE - ADMIN ONLY
# --------------------------------

@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin)
):

    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if employee is None:

        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    db.delete(employee)
    db.commit()

    return {
        "message": "Employee deleted successfully",
        "employee_id": employee_id
    }