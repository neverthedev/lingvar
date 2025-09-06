#!/usr/bin/env python3
"""
Test script for the authentication system
"""
import sys
import os
sys.path.append('/workspaces/lingvar/backend')

from database import test_connection, create_tables
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db, User
from main import app
import tempfile
import os
import sys
from services.auth import get_password_hash, verify_password

def test_auth_system():
    print("🔧 Testing authentication system...")

    # Test database connection
    print("📅 Testing database connection...")
    if test_connection():
        print("✅ Database connection successful!")
        create_tables()
        print("✅ Database tables created/verified!")
    else:
        print("❌ Database connection failed!")
        return False

    # Test password hashing
    print("🔐 Testing password hashing...")
    password = "test123"
    hashed = get_password_hash(password)
    print(f"✅ Password hashed: {hashed[:50]}...")

    # Test password verification
    if verify_password(password, hashed):
        print("✅ Password verification successful!")
    else:
        print("❌ Password verification failed!")
        return False

    print("🎉 All tests passed! Authentication system is ready!")
    return True

if __name__ == "__main__":
    test_auth_system()
