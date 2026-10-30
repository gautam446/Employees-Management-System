from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from auth import create_access_token


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends()
):

    username = form_data.username
    password = form_data.password

    # Admin Login
    if username == "gk" and password == "4432":

        role = "admin"

    # User Login
    elif username != "gk" and password != "4432":

        role = "user"

    # Invalid Login
    else:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Generate JWT Token
    access_token = create_access_token(
        data={
            "sub": username,
            "role": role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": username,
        "role": role
    }
