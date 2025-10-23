#!/usr/bin/env python3
"""
Script to add the dopełniacz rule to the database
"""

from services.database import SessionLocal
from models.vocabulary import Rule
import sys

def add_dopelniacz_rule():
    """Add the dopełniacz rule to the database"""
    db = SessionLocal()

    try:
        # Check if the main rule already exists
        existing_rule = db.query(Rule).filter(
            Rule.title == "DOPEŁNIACZ LICZBY POJEDYNCZEJ"
        ).first()

        if existing_rule:
            print(f"Main rule already exists with ID: {existing_rule.id}")
            main_rule_id = existing_rule.id
        else:
            # Create the main rule
            new_rule = Rule(
                title="DOPEŁNIACZ LICZBY POJEDYNCZEJ",
                description="Odmiana rzeczowników liczby pojedynczej w dopełniaczu",
                parent_rule_id=None,  # Parent id must be blank (None)
                ordering=1  # Order first
            )

            # Add to database
            db.add(new_rule)
            db.commit()
            db.refresh(new_rule)
            main_rule_id = new_rule.id

            print(f"Successfully added main rule with ID: {new_rule.id}")
            print(f"Title: {new_rule.title}")
            print(f"Description: {new_rule.description}")
            print(f"Parent Rule ID: {new_rule.parent_rule_id}")
            print(f"Ordering: {new_rule.ordering}")

        # Check if the subrule already exists
        existing_subrule = db.query(Rule).filter(
            Rule.title == "Rodzaj męski, żywotny",
            Rule.parent_rule_id == main_rule_id
        ).first()

        if existing_subrule:
            print(f"Subrule already exists with ID: {existing_subrule.id}")
            return main_rule_id

        # Create the subrule
        subrule = Rule(
            title="Rodzaj męski, żywotny",
            description="Końcówki -a, -y. -a w rzeczownikach męskoosobowych (przyjaciela, kota), -y w rzeczownikach kończących się na -a (mężczyzny, taty).",
            parent_rule_id=main_rule_id,
            ordering=1
        )

        # Add subrule to database
        db.add(subrule)
        db.commit()
        db.refresh(subrule)

        print(f"Successfully added subrule with ID: {subrule.id}")
        print(f"Title: {subrule.title}")
        print(f"Description: {subrule.description}")
        print(f"Parent Rule ID: {subrule.parent_rule_id}")
        print(f"Ordering: {subrule.ordering}")

        return main_rule_id

    except Exception as e:
        print(f"Error adding rule: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    add_dopelniacz_rule()
