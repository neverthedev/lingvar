"""Explicit PostgreSQL migration entry point: python -m migrate <command>."""
import argparse
import sys

from services import migrations


def main() -> int:
    parser = argparse.ArgumentParser(description="Lingvar PostgreSQL migrations")
    parser.add_argument("command", choices=("upgrade", "check", "check-legacy", "baseline"))
    command_name = parser.parse_args().command.replace("-", "_")
    try:
        getattr(migrations, command_name)()
    except Exception as error:
        print(f"Migration command failed: {error}", file=sys.stderr)
        return 1
    print("Migration command completed successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
