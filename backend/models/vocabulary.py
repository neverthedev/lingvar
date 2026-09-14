from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from services.base import Base

# SQLAlchemy models for vocabulary items
class Noun(Base):
    __tablename__ = "nouns"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(100), nullable=False, index=True)
    cases_pojed = Column(JSONB, nullable=False)
    cases_mnoga = Column(JSONB, nullable=False)
    cases_menska = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Pronoun(Base):
    __tablename__ = "pronouns"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(100), nullable=False, index=True)
    cases = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
class Verb(Base):
    __tablename__ = "verbs"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(100), nullable=False, index=True)
    cases = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Numerator(Base):
    __tablename__ = "numerators"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(100), nullable=False, index=True)
    translation = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    parent_rule_id = Column(Integer, ForeignKey("rules.id"), nullable=True, index=True)
    ordering = Column(Integer, nullable=True, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Self-referencing relationship for subrules
    parent_rule = relationship("Rule", remote_side=[id], back_populates="subrules")
    subrules = relationship("Rule", back_populates="parent_rule", order_by="Rule.ordering")

class WordTestStat(Base):
    __tablename__ = "word_test_stats"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True, index=True)
    word_type = Column(String(50), primary_key=True, index=True)
    word_id = Column(Integer, primary_key=True, index=True)
    attempts = Column(Integer, nullable=False, default=0)
    correct = Column(Integer, nullable=False, default=0)
    weight = Column(Integer, nullable=False, default=0)
    last_tested_at = Column(DateTime(timezone=True))
    last_correct = Column(Boolean)

    __table_args__ = (
        Index("idx_word_test_stats_user", "user_id"),
    )
