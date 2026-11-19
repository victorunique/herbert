"""Standalone CLI bridge for XHerbert core modules executed via uv run."""

import argparse
import subprocess
import sys
from pathlib import Path


def build_parser() -> argparse.ArgumentParser:
    """Create the argument parser describing all standalone module CLIs."""
    parser = argparse.ArgumentParser(
        prog="xherbert-cli",
        description="Standalone CLI invoker for XHerbert core modules (lexer, parser, interpreter, simulator).",
    )
    parser.add_argument(
        "module",
        choices=["lexer", "parser", "interpreter", "simulate"],
        help="Core module to execute standalone.",
    )
    parser.add_argument(
        "--code",
        type=str,
        default="",
        help="H language source code string (use \\n for newlines).",
    )
    parser.add_argument(
        "--level",
        type=str,
        default="",
        help="Path to a .txt level file (required for 'simulate' module).",
    )
    parser.add_argument(
        "--max-steps",
        type=int,
        default=1000,
        help="Maximum execution steps for interpreter or simulator (default: 1000).",
    )
    return parser


def main() -> int:
    """Parse CLI arguments and dispatch to the corresponding TypeScript module CLI."""
    parser = build_parser()
    args = parser.parse_args()
    root_dir = Path(__file__).resolve().parent.parent
    script_map = {
        "lexer": "src/cli/lexerCli.ts",
        "parser": "src/cli/parserCli.ts",
        "interpreter": "src/cli/interpreterCli.ts",
        "simulate": "src/cli/simulateCli.ts",
    }
    target_script = root_dir / script_map[args.module]
    cmd = [
        "npx",
        "tsx",
        str(target_script),
        "--code",
        args.code,
        "--level",
        args.level,
        "--max-steps",
        str(args.max_steps),
    ]
    completed = subprocess.run(cmd, cwd=root_dir, check=False)
    return completed.returncode


if __name__ == "__main__":
    sys.exit(main())
