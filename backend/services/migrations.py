"""Operations used by the explicit Lingvar PostgreSQL migration CLI.

The legacy validator intentionally reads PostgreSQL catalogs instead of ORM
metadata.  A reference schema is made by the immutable first Alembic revision
inside a transaction which is always rolled back.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection, Engine, make_url


INITIAL_REVISION = "0001_initial_schema"
VERSION_TABLE = "alembic_version"
REFERENCE_DATABASE = "lingvar_migration_reference"
LOCK_KEY = "lingvar:migrations"
REFERENCE_LOCK_KEY = "lingvar:migration-reference"
LOCK_TIMEOUT = "5s"
BACKEND_DIR = Path(__file__).resolve().parents[1]
ALEMBIC_INI = BACKEND_DIR / "alembic.ini"


class MigrationError(RuntimeError):
    """A safe, user-facing refusal to change or use a database."""


def _database_url(variable: str = "DATABASE_URL") -> str:
    url = os.getenv(variable)
    if not url:
        raise MigrationError(f"{variable} must be explicitly set.")
    try:
        parsed = make_url(url)
    except Exception as error:
        raise MigrationError(f"{variable} is not a valid PostgreSQL URL.") from error
    if not parsed.drivername.startswith("postgresql"):
        raise MigrationError(f"{variable} must point to PostgreSQL.")
    return url


def _engine(variable: str = "DATABASE_URL") -> Engine:
    return create_engine(_database_url(variable), pool_pre_ping=True)


def _alembic_config(connection: Connection, operation: str) -> Config:
    config = Config(str(ALEMBIC_INI))
    config.attributes["connection"] = connection
    config.attributes["lingvar_operation"] = operation
    return config


def _script_directory() -> ScriptDirectory:
    directory = ScriptDirectory.from_config(Config(str(ALEMBIC_INI)))
    heads = directory.get_heads()
    if len(heads) != 1:
        raise MigrationError("Migration catalog must contain exactly one head.")
    if INITIAL_REVISION not in {revision.revision for revision in directory.walk_revisions()}:
        raise MigrationError("The immutable initial migration is missing from the catalog.")
    return directory


def _head_revision() -> str:
    return _script_directory().get_current_head()


def _row_dicts(result) -> list[dict[str, Any]]:
    rows = [dict(row._mapping) for row in result]
    for row in rows:
        for key, value in tuple(row.items()):
            if isinstance(value, tuple):
                row[key] = list(value)
    return rows


def _fetch(connection: Connection, query: str, **params: Any) -> list[dict[str, Any]]:
    return _row_dicts(connection.execute(text(query), params))


def _extension_owned_filter(classid: str, object_id: str) -> str:
    return f"""NOT EXISTS (
        SELECT 1
        FROM pg_depend extension_dependency
        JOIN pg_extension extension ON extension.oid = extension_dependency.refobjid
        WHERE extension_dependency.classid = '{classid}'::regclass
          AND extension_dependency.refclassid = 'pg_extension'::regclass
          AND extension_dependency.objid = {object_id}
          AND extension_dependency.deptype = 'e'
          AND extension.extname = 'uuid-ossp'
    )"""


def schema_snapshot(connection: Connection) -> dict[str, list[dict[str, Any]]]:
    """Return the structural catalog properties governed by the initial revision.

    Current rows and sequence positions are deliberately absent: they are data,
    and comparison must neither advance nor reset a sequence.
    """
    table_filter = _extension_owned_filter("pg_class", "relation.oid")
    index_filter = _extension_owned_filter("pg_class", "index_relation.oid")
    sequence_filter = _extension_owned_filter("pg_class", "sequence_relation.oid")
    type_filter = _extension_owned_filter("pg_type", "user_type.oid")
    function_filter = _extension_owned_filter("pg_proc", "routine.oid")

    return {
        "tables": _fetch(
            connection,
            f"""
            SELECT relation.relname AS name, relation.relkind AS kind,
                   relation.relispartition AS is_partition,
                   relation.relpersistence AS persistence,
                   relation.relrowsecurity AS row_security,
                   relation.relforcerowsecurity AS force_row_security,
                   EXISTS (SELECT 1 FROM pg_inherits WHERE inhrelid = relation.oid) AS inherits
            FROM pg_class relation
            JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
            WHERE namespace.nspname = 'public'
              AND relation.relkind IN ('r', 'p')
              AND relation.relname <> :version_table
              AND {table_filter}
            ORDER BY relation.relname
            """,
            version_table=VERSION_TABLE,
        ),
        "columns": _fetch(
            connection,
            """
            SELECT relation.relname AS table_name, attribute.attnum AS position,
                   attribute.attname AS name,
                   format_type(attribute.atttypid, attribute.atttypmod) AS data_type,
                   attribute.attnotnull AS not_null,
                   pg_get_expr(default_value.adbin, default_value.adrelid) AS default_expression,
                   attribute.attidentity AS identity_kind,
                   attribute.attgenerated AS generated_kind,
                   COALESCE(collation_namespace.nspname || '.' || collation_catalog.collname, '') AS collation
            FROM pg_attribute attribute
            JOIN pg_class relation ON relation.oid = attribute.attrelid
            JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
            LEFT JOIN pg_attrdef default_value
              ON default_value.adrelid = attribute.attrelid
             AND default_value.adnum = attribute.attnum
            LEFT JOIN pg_collation collation_catalog ON collation_catalog.oid = attribute.attcollation
            LEFT JOIN pg_namespace collation_namespace ON collation_namespace.oid = collation_catalog.collnamespace
            WHERE namespace.nspname = 'public'
              AND relation.relkind IN ('r', 'p')
              AND relation.relname <> :version_table
              AND attribute.attnum > 0
              AND NOT attribute.attisdropped
            ORDER BY relation.relname, attribute.attnum
            """,
            version_table=VERSION_TABLE,
        ),
        "constraints": _fetch(
            connection,
            """
            SELECT relation.relname AS table_name, catalog_constraint.conname AS name,
                   catalog_constraint.contype AS kind, catalog_constraint.conkey::text AS key_columns,
                   referenced_namespace.nspname AS referenced_schema,
                   referenced_relation.relname AS referenced_table,
                   catalog_constraint.confkey::text AS referenced_columns,
                   catalog_constraint.confupdtype AS on_update,
                   catalog_constraint.confdeltype AS on_delete,
                   catalog_constraint.condeferrable AS deferrable,
                   catalog_constraint.condeferred AS initially_deferred,
                   catalog_constraint.convalidated AS is_valid,
                   catalog_constraint.connoinherit AS no_inherit,
                   pg_get_constraintdef(catalog_constraint.oid, true) AS definition
            FROM pg_constraint catalog_constraint
            JOIN pg_class relation ON relation.oid = catalog_constraint.conrelid
            JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
            LEFT JOIN pg_class referenced_relation ON referenced_relation.oid = catalog_constraint.confrelid
            LEFT JOIN pg_namespace referenced_namespace ON referenced_namespace.oid = referenced_relation.relnamespace
            WHERE namespace.nspname = 'public'
              AND relation.relkind IN ('r', 'p')
              AND relation.relname <> :version_table
            ORDER BY relation.relname, catalog_constraint.conname
            """,
            version_table=VERSION_TABLE,
        ),
        "indexes": _fetch(
            connection,
            f"""
            SELECT relation.relname AS table_name, index_relation.relname AS name,
                   index_data.indisunique AS is_unique,
                   index_data.indisvalid AS is_valid,
                   index_data.indisready AS is_ready,
                   index_data.indislive AS is_live,
                   index_data.indnullsnotdistinct AS nulls_not_distinct,
                   access_method.amname AS access_method,
                   index_data.indkey::text AS key_columns,
                   index_data.indnkeyatts AS key_column_count,
                   index_data.indnatts AS attribute_count,
                   index_data.indoption::text AS options,
                   pg_get_expr(index_data.indpred, index_data.indrelid) AS predicate,
                   pg_get_expr(index_data.indexprs, index_data.indrelid) AS expressions,
                   pg_get_indexdef(index_data.indexrelid) AS definition
            FROM pg_index index_data
            JOIN pg_class index_relation ON index_relation.oid = index_data.indexrelid
            JOIN pg_class relation ON relation.oid = index_data.indrelid
            JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
            JOIN pg_am access_method ON access_method.oid = index_relation.relam
            WHERE namespace.nspname = 'public'
              AND relation.relkind IN ('r', 'p')
              AND relation.relname <> :version_table
              AND NOT EXISTS (
                SELECT 1 FROM pg_constraint owned_constraint
                WHERE owned_constraint.conindid = index_data.indexrelid
              )
              AND {index_filter}
            ORDER BY relation.relname, index_relation.relname
            """,
            version_table=VERSION_TABLE,
        ),
        "sequences": _fetch(
            connection,
            f"""
            SELECT sequence_relation.relname AS name,
                   format_type(sequence_data.seqtypid, NULL) AS data_type,
                   sequence_data.seqstart::text AS start_value,
                   sequence_data.seqincrement::text AS increment,
                   sequence_data.seqmax::text AS maximum,
                   sequence_data.seqmin::text AS minimum,
                   sequence_data.seqcache::text AS cache,
                   sequence_data.seqcycle AS cycle,
                   owner_relation.relname AS owner_table,
                   owner_attribute.attname AS owner_column
            FROM pg_class sequence_relation
            JOIN pg_namespace namespace ON namespace.oid = sequence_relation.relnamespace
            JOIN pg_sequence sequence_data ON sequence_data.seqrelid = sequence_relation.oid
            LEFT JOIN pg_depend ownership
              ON ownership.classid = 'pg_class'::regclass
             AND ownership.refclassid = 'pg_class'::regclass
             AND ownership.objid = sequence_relation.oid
             AND ownership.deptype IN ('a', 'i')
            LEFT JOIN pg_class owner_relation ON owner_relation.oid = ownership.refobjid
            LEFT JOIN pg_attribute owner_attribute
              ON owner_attribute.attrelid = ownership.refobjid
             AND owner_attribute.attnum = ownership.refobjsubid
            WHERE namespace.nspname = 'public'
              AND sequence_relation.relkind = 'S'
              AND {sequence_filter}
            ORDER BY sequence_relation.relname
            """,
        ),
        "other_relations": _fetch(
            connection,
            f"""
            SELECT relation.relname AS name, relation.relkind AS kind,
                   pg_get_viewdef(relation.oid, true) AS definition
            FROM pg_class relation
            JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
            WHERE namespace.nspname = 'public'
              AND relation.relkind NOT IN ('r', 'p', 'S', 'i')
              AND relation.relname <> :version_table
              AND {table_filter}
            ORDER BY relation.relname
            """,
            version_table=VERSION_TABLE,
        ),
        "types": _fetch(
            connection,
            f"""
            SELECT user_type.typname AS name, user_type.typtype AS kind,
                   format_type(user_type.oid, NULL) AS definition
            FROM pg_type user_type
            JOIN pg_namespace namespace ON namespace.oid = user_type.typnamespace
            WHERE namespace.nspname = 'public'
              AND user_type.typrelid = 0
              AND NOT EXISTS (
                SELECT 1
                FROM pg_type version_row_type
                JOIN pg_class version_relation ON version_relation.reltype = version_row_type.oid
                JOIN pg_namespace version_namespace ON version_namespace.oid = version_relation.relnamespace
                WHERE version_namespace.nspname = 'public'
                  AND version_relation.relname = :version_table
                  AND user_type.typelem = version_row_type.oid
              )
              AND {type_filter}
            ORDER BY user_type.typname
            """,
            version_table=VERSION_TABLE,
        ),
        "functions": _fetch(
            connection,
            f"""
            SELECT routine.proname AS name,
                   pg_get_function_identity_arguments(routine.oid) AS arguments,
                   pg_get_functiondef(routine.oid) AS definition
            FROM pg_proc routine
            JOIN pg_namespace namespace ON namespace.oid = routine.pronamespace
            WHERE namespace.nspname = 'public'
              AND {function_filter}
            ORDER BY routine.proname, pg_get_function_identity_arguments(routine.oid)
            """,
        ),
        "triggers": _fetch(
            connection,
            """
            SELECT relation.relname AS table_name, catalog_trigger.tgname AS name,
                   catalog_trigger.tgenabled AS enabled, pg_get_triggerdef(catalog_trigger.oid, true) AS definition
            FROM pg_trigger catalog_trigger
            JOIN pg_class relation ON relation.oid = catalog_trigger.tgrelid
            JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
            WHERE namespace.nspname = 'public' AND NOT catalog_trigger.tgisinternal
            ORDER BY relation.relname, catalog_trigger.tgname
            """,
        ),
        "rules": _fetch(
            connection,
            """
            SELECT relation.relname AS table_name, rewrite_rule.rulename AS name,
                   pg_get_ruledef(rewrite_rule.oid, true) AS definition
            FROM pg_rewrite rewrite_rule
            JOIN pg_class relation ON relation.oid = rewrite_rule.ev_class
            JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
            WHERE namespace.nspname = 'public' AND rewrite_rule.rulename <> '_RETURN'
            ORDER BY relation.relname, rewrite_rule.rulename
            """,
        ),
        "policies": _fetch(
            connection,
            """
            SELECT policy.polrelid::regclass::text AS table_name, policy.polname AS name,
                   policy.polcmd AS command, policy.polpermissive AS permissive,
                   pg_get_expr(policy.polqual, policy.polrelid) AS using_expression,
                   pg_get_expr(policy.polwithcheck, policy.polrelid) AS check_expression
            FROM pg_policy policy
            JOIN pg_class relation ON relation.oid = policy.polrelid
            JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
            WHERE namespace.nspname = 'public'
            ORDER BY policy.polrelid::regclass::text, policy.polname
            """,
        ),
        "external_dependencies": _fetch(
            connection,
            """
            WITH managed_relation AS (
                SELECT relation.oid, relation.relname, namespace.nspname
                FROM pg_class relation
                JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
                WHERE namespace.nspname = 'public'
                  AND relation.relkind IN ('r', 'p')
                  AND relation.relname <> :version_table
            ), external_relation AS (
                SELECT relation.oid, relation.relname, relation.relkind, namespace.nspname
                FROM pg_class relation
                JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
                WHERE namespace.nspname NOT IN ('public', 'pg_catalog', 'information_schema')
                  AND namespace.nspname !~ '^pg_'
                  AND NOT EXISTS (
                    SELECT 1
                    FROM pg_depend extension_dependency
                    JOIN pg_extension extension ON extension.oid = extension_dependency.refobjid
                    WHERE extension_dependency.classid = 'pg_class'::regclass
                      AND extension_dependency.refclassid = 'pg_extension'::regclass
                      AND extension_dependency.objid = relation.oid
                      AND extension_dependency.deptype = 'e'
                      AND extension.extname = 'uuid-ossp'
                  )
            )
            SELECT 'public_to_external_relation' AS direction,
                   managed.nspname AS source_schema, managed.relname AS source_name,
                   attribute.attname AS source_column, 'relation' AS source_kind,
                   external.nspname AS target_schema, external.relname AS target_name,
                   NULL::text AS target_column, external.relkind::text AS target_kind,
                   dependency.deptype AS dependency_type
            FROM pg_depend dependency
            JOIN managed_relation managed ON managed.oid = dependency.objid
            JOIN external_relation external ON external.oid = dependency.refobjid
            LEFT JOIN pg_attribute attribute
              ON attribute.attrelid = managed.oid AND attribute.attnum = dependency.objsubid
            WHERE dependency.classid = 'pg_class'::regclass
              AND dependency.refclassid = 'pg_class'::regclass

            UNION ALL

            SELECT 'external_relation_to_public' AS direction,
                   external.nspname AS source_schema, external.relname AS source_name,
                   NULL::text AS source_column, external.relkind::text AS source_kind,
                   managed.nspname AS target_schema, managed.relname AS target_name,
                   attribute.attname AS target_column, 'relation' AS target_kind,
                   dependency.deptype AS dependency_type
            FROM pg_depend dependency
            JOIN external_relation external ON external.oid = dependency.objid
            JOIN managed_relation managed ON managed.oid = dependency.refobjid
            LEFT JOIN pg_attribute attribute
              ON attribute.attrelid = managed.oid AND attribute.attnum = dependency.refobjsubid
            WHERE dependency.classid = 'pg_class'::regclass
              AND dependency.refclassid = 'pg_class'::regclass

            UNION ALL

            SELECT 'external_constraint_to_public' AS direction,
                   external.nspname AS source_schema,
                   external.relname || '.' || catalog_constraint.conname AS source_name,
                   NULL::text AS source_column, 'constraint' AS source_kind,
                   managed.nspname AS target_schema, managed.relname AS target_name,
                   attribute.attname AS target_column, 'relation' AS target_kind,
                   dependency.deptype AS dependency_type
            FROM pg_depend dependency
            JOIN pg_constraint catalog_constraint ON catalog_constraint.oid = dependency.objid
            JOIN external_relation external ON external.oid = catalog_constraint.conrelid
            JOIN managed_relation managed ON managed.oid = dependency.refobjid
            LEFT JOIN pg_attribute attribute
              ON attribute.attrelid = managed.oid AND attribute.attnum = dependency.refobjsubid
            WHERE dependency.classid = 'pg_constraint'::regclass
              AND dependency.refclassid = 'pg_class'::regclass

            UNION ALL

            SELECT 'external_view_to_public' AS direction,
                   external.nspname AS source_schema, external.relname AS source_name,
                   NULL::text AS source_column, external.relkind::text AS source_kind,
                   managed.nspname AS target_schema, managed.relname AS target_name,
                   attribute.attname AS target_column, 'relation' AS target_kind,
                   dependency.deptype AS dependency_type
            FROM pg_depend dependency
            JOIN pg_rewrite rewrite_rule ON rewrite_rule.oid = dependency.objid
            JOIN external_relation external ON external.oid = rewrite_rule.ev_class
            JOIN managed_relation managed ON managed.oid = dependency.refobjid
            LEFT JOIN pg_attribute attribute
              ON attribute.attrelid = managed.oid AND attribute.attnum = dependency.refobjsubid
            WHERE dependency.classid = 'pg_rewrite'::regclass
              AND dependency.refclassid = 'pg_class'::regclass
              AND NOT EXISTS (
                SELECT 1
                FROM pg_depend extension_dependency
                JOIN pg_extension extension ON extension.oid = extension_dependency.refobjid
                WHERE extension_dependency.classid = 'pg_rewrite'::regclass
                  AND extension_dependency.refclassid = 'pg_extension'::regclass
                  AND extension_dependency.objid = rewrite_rule.oid
                  AND extension_dependency.deptype = 'e'
                  AND extension.extname = 'uuid-ossp'
              )

            UNION ALL

            SELECT 'public_view_to_external' AS direction,
                   public_view_namespace.nspname AS source_schema, public_view.relname AS source_name,
                   NULL::text AS source_column, public_view.relkind::text AS source_kind,
                   external.nspname AS target_schema, external.relname AS target_name,
                   NULL::text AS target_column, external.relkind::text AS target_kind,
                   dependency.deptype AS dependency_type
            FROM pg_depend dependency
            JOIN pg_rewrite rewrite_rule ON rewrite_rule.oid = dependency.objid
            JOIN pg_class public_view ON public_view.oid = rewrite_rule.ev_class
            JOIN pg_namespace public_view_namespace ON public_view_namespace.oid = public_view.relnamespace
            JOIN external_relation external ON external.oid = dependency.refobjid
            WHERE dependency.classid = 'pg_rewrite'::regclass
              AND dependency.refclassid = 'pg_class'::regclass
              AND public_view_namespace.nspname = 'public'
              AND NOT EXISTS (
                SELECT 1
                FROM pg_depend extension_dependency
                JOIN pg_extension extension ON extension.oid = extension_dependency.refobjid
                WHERE extension_dependency.classid = 'pg_rewrite'::regclass
                  AND extension_dependency.refclassid = 'pg_extension'::regclass
                  AND extension_dependency.objid = rewrite_rule.oid
                  AND extension_dependency.deptype = 'e'
                  AND extension.extname = 'uuid-ossp'
              )
            ORDER BY direction, source_schema, source_name, target_schema, target_name, dependency_type
            """,
            version_table=VERSION_TABLE,
        ),
        "event_triggers": _fetch(
            connection,
            """
            SELECT event_trigger.evtname AS name, event_trigger.evtevent AS event,
                   event_trigger.evtenabled AS enabled, event_trigger.evttags::text AS tags,
                   event_trigger.evtfoid::regprocedure::text AS function_name
            FROM pg_event_trigger event_trigger
            WHERE NOT EXISTS (
                SELECT 1
                FROM pg_depend extension_dependency
                JOIN pg_extension extension ON extension.oid = extension_dependency.refobjid
                WHERE extension_dependency.classid = 'pg_event_trigger'::regclass
                  AND extension_dependency.refclassid = 'pg_extension'::regclass
                  AND extension_dependency.objid = event_trigger.oid
                  AND extension_dependency.deptype = 'e'
                  AND extension.extname = 'uuid-ossp'
            )
            ORDER BY event_trigger.evtname
            """,
        ),
        "collations": _fetch(
            connection,
            """
            SELECT catalog_collation.collname AS name, catalog_collation.collprovider::text AS provider,
                   catalog_collation.collcollate AS collate, catalog_collation.collctype AS ctype,
                   COALESCE(catalog_collation.colliculocale, '') AS icu_locale,
                   catalog_collation.collisdeterministic AS deterministic
            FROM pg_collation catalog_collation
            JOIN pg_namespace namespace ON namespace.oid = catalog_collation.collnamespace
            WHERE namespace.nspname = 'public'
              AND NOT EXISTS (
                SELECT 1
                FROM pg_depend extension_dependency
                JOIN pg_extension extension ON extension.oid = extension_dependency.refobjid
                WHERE extension_dependency.classid = 'pg_collation'::regclass
                  AND extension_dependency.refclassid = 'pg_extension'::regclass
                  AND extension_dependency.objid = catalog_collation.oid
                  AND extension_dependency.deptype = 'e'
                  AND extension.extname = 'uuid-ossp'
              )
            ORDER BY catalog_collation.collname
            """,
        ),
        "database_settings": _fetch(
            connection,
            """
            SELECT pg_encoding_to_char(catalog_database.encoding) AS encoding,
                   catalog_database.datlocprovider::text AS locale_provider,
                   catalog_database.datcollate AS collate,
                   catalog_database.datctype AS ctype,
                   COALESCE(catalog_database.daticulocale, '') AS icu_locale
            FROM pg_database catalog_database
            WHERE catalog_database.datname = current_database()
            """,
        ),
    }


def _object_count(snapshot: dict[str, list[dict[str, Any]]]) -> int:
    return sum(len(entries) for category, entries in snapshot.items() if category != "database_settings")


def _server_identity(connection: Connection, role: str) -> str:
    row = connection.execute(
        text("SELECT current_database() AS database_name, current_setting('server_version_num')::int AS version_num")
    ).mappings().one()
    version = int(row["version_num"])
    if not 150000 <= version < 160000:
        raise MigrationError(f"{role} must use PostgreSQL 15; server version is unsupported.")
    return str(row["database_name"])


def _has_version_table(connection: Connection) -> bool:
    return connection.execute(text("SELECT to_regclass('public.alembic_version') IS NOT NULL")).scalar_one()


def _current_versions(connection: Connection) -> list[str]:
    if not _has_version_table(connection):
        return []
    return list(connection.execute(text("SELECT version_num FROM public.alembic_version ORDER BY version_num")).scalars())


def _require_unmanaged(connection: Connection) -> None:
    if _has_version_table(connection):
        raise MigrationError("Target already has alembic_version and cannot be baselined again.")


def _normalise_schema(snapshot: dict[str, list[dict[str, Any]]]) -> dict[str, list[dict[str, Any]]]:
    # pg_catalog emits stable PostgreSQL 15 definitions for reference and target.
    # This deliberately avoids lossy regex rewriting of defaults or expressions.
    return snapshot


def _schema_differences(expected: dict[str, list[dict[str, Any]]], actual: dict[str, list[dict[str, Any]]]) -> list[str]:
    differences: list[str] = []
    expected = _normalise_schema(expected)
    actual = _normalise_schema(actual)
    keyed = {
        "tables": ("name",),
        "columns": ("table_name", "position"),
        "constraints": ("table_name", "name"),
        "indexes": ("table_name", "name"),
        "sequences": ("name",),
        "other_relations": ("name",),
        "types": ("name",),
        "functions": ("name", "arguments"),
        "triggers": ("table_name", "name"),
        "rules": ("table_name", "name"),
        "policies": ("table_name", "name"),
        "external_dependencies": (
            "direction", "source_schema", "source_name", "source_column", "source_kind",
            "target_schema", "target_name", "target_column", "target_kind", "dependency_type",
        ),
        "event_triggers": ("name",),
        "collations": ("name",),
        "database_settings": (),
    }
    for category, fields in keyed.items():
        expected_rows = {tuple(row.get(field) for field in fields): row for row in expected[category]}
        actual_rows = {tuple(row.get(field) for field in fields): row for row in actual[category]}
        for key in sorted(expected_rows.keys() - actual_rows.keys(), key=repr):
            differences.append(f"{category} {key}: expected object is absent")
        for key in sorted(actual_rows.keys() - expected_rows.keys(), key=repr):
            differences.append(f"{category} {key}: unexpected object is present")
        for key in sorted(expected_rows.keys() & actual_rows.keys(), key=repr):
            expected_row = expected_rows[key]
            actual_row = actual_rows[key]
            for property_name in sorted(set(expected_row) | set(actual_row)):
                if property_name in fields:
                    continue
                if expected_row.get(property_name) != actual_row.get(property_name):
                    differences.append(
                        f"{category} {key}, {property_name}: expected "
                        f"{expected_row.get(property_name)!r}, got {actual_row.get(property_name)!r}"
                    )
    return differences


def _set_lock_timeout(connection: Connection) -> None:
    connection.execute(text("SELECT set_config('lock_timeout', :timeout, true)"), {"timeout": LOCK_TIMEOUT})


def ensure_public_search_path(connection: Connection) -> None:
    if not connection.execute(text("SELECT to_regnamespace('public') IS NOT NULL")).scalar_one():
        raise MigrationError("PostgreSQL schema public must exist for Lingvar migrations.")
    connection.execute(text("SET LOCAL search_path TO public, pg_catalog"))


def _advisory_lock(connection: Connection, key: str) -> None:
    _set_lock_timeout(connection)
    connection.execute(text("SELECT pg_advisory_xact_lock(hashtext(:key))"), {"key": key})


def _reference_schema(reference_url: str) -> dict[str, list[dict[str, Any]]]:
    reference_engine = create_engine(reference_url, pool_pre_ping=True)
    try:
        with reference_engine.connect() as reference:
            transaction = reference.begin()
            try:
                reference_name = _server_identity(reference, "MIGRATION_REFERENCE_URL")
                if reference_name != REFERENCE_DATABASE:
                    raise MigrationError(
                        f"MIGRATION_REFERENCE_URL must use the dedicated database {REFERENCE_DATABASE!r}."
                    )
                _advisory_lock(reference, REFERENCE_LOCK_KEY)
                if _has_version_table(reference) or _object_count(schema_snapshot(reference)):
                    raise MigrationError("Reference database must be empty before the initial migration.")
                config = _alembic_config(reference, "upgrade")
                command.upgrade(config, INITIAL_REVISION)
                snapshot = schema_snapshot(reference)
            finally:
                transaction.rollback()
            return snapshot
    finally:
        reference_engine.dispose()


def _legacy_reference_url(target_name: str) -> str:
    reference_url = _database_url("MIGRATION_REFERENCE_URL")
    reference_name = make_url(reference_url).database
    if reference_name == target_name:
        raise MigrationError("Target and reference databases must be different.")
    return reference_url


def _compare_legacy(connection: Connection, reference_url: str) -> list[str]:
    expected = _reference_schema(reference_url)
    actual = schema_snapshot(connection)
    return _schema_differences(expected, actual)


def check_legacy() -> None:
    """Read-only comparison of an unmanaged target and the initial revision."""
    target_engine = _engine()
    try:
        with target_engine.connect() as target:
            with target.begin():
                target_name = _server_identity(target, "DATABASE_URL")
                ensure_public_search_path(target)
                _require_unmanaged(target)
                differences = _compare_legacy(target, _legacy_reference_url(target_name))
                if differences:
                    raise MigrationError("Legacy schema differs from initial revision:\n- " + "\n- ".join(differences))
    finally:
        target_engine.dispose()


def _lock_existing_tables(connection: Connection) -> None:
    rows = _fetch(
        connection,
        """
        SELECT relation.relname AS name
        FROM pg_class relation
        JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
        WHERE namespace.nspname = 'public' AND relation.relkind IN ('r', 'p')
          AND relation.relname <> :version_table
        ORDER BY relation.relname
        """,
        version_table=VERSION_TABLE,
    )
    quote = connection.dialect.identifier_preparer.quote
    for row in rows:
        connection.execute(text(f"LOCK TABLE public.{quote(row['name'])} IN ACCESS EXCLUSIVE MODE"))


def baseline() -> None:
    """Register only a structurally matching legacy database as the initial revision."""
    target_engine = _engine()
    try:
        with target_engine.connect() as target:
            transaction = target.begin()
            try:
                target_name = _server_identity(target, "DATABASE_URL")
                reference_url = _legacy_reference_url(target_name)
                _advisory_lock(target, LOCK_KEY)
                ensure_public_search_path(target)
                _require_unmanaged(target)
                _lock_existing_tables(target)
                differences = _compare_legacy(target, reference_url)
                if differences:
                    raise MigrationError("Legacy schema differs from initial revision:\n- " + "\n- ".join(differences))
                config = _alembic_config(target, "stamp")
                config.attributes["lingvar_baseline_stamp"] = True
                command.stamp(config, INITIAL_REVISION)
                transaction.commit()
            except Exception:
                transaction.rollback()
                raise
    finally:
        target_engine.dispose()


def assert_upgrade_allowed(connection: Connection) -> None:
    """Alembic environment hook: initial revision cannot overlay legacy objects."""
    if _has_version_table(connection):
        versions = _current_versions(connection)
        known_revisions = {revision.revision for revision in _script_directory().walk_revisions()}
        if len(versions) != 1 or versions[0] not in known_revisions:
            raise MigrationError(
                "alembic_version must contain exactly one known revision before upgrade."
            )
        return
    snapshot = schema_snapshot(connection)
    if _object_count(snapshot):
        raise MigrationError(
            "Unmanaged public schema is not empty. Use check-legacy and baseline; "
            "do not apply the initial migration over an existing database."
        )


def upgrade() -> None:
    target_engine = _engine()
    try:
        with target_engine.connect() as target:
            transaction = target.begin()
            try:
                _server_identity(target, "DATABASE_URL")
                _advisory_lock(target, LOCK_KEY)
                config = _alembic_config(target, "upgrade")
                command.upgrade(config, "head")
                transaction.commit()
            except Exception:
                transaction.rollback()
                raise
    finally:
        target_engine.dispose()


def check() -> None:
    target_engine = _engine()
    try:
        with target_engine.connect() as target:
            _server_identity(target, "DATABASE_URL")
            versions = _current_versions(target)
            head = _head_revision()
            if len(versions) != 1:
                raise MigrationError("Database must contain exactly one Alembic revision.")
            if versions[0] != head:
                raise MigrationError(
                    "Database migration revision is not current or is unknown; "
                    "apply the explicit migration command before starting the backend."
                )
    finally:
        target_engine.dispose()
