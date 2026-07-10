#!/usr/bin/env python3
"""Convert a Manytask grades export into retrograder's retro-import format.

The export (grades.csv) has some student metadata columns followed by one
column per task, where 1 means solved and 0/empty means not solved. Task
point values are taken from src/data/tasks.yaml; seminar points (the
export's own points column) are added on top. The output is the
two-column CSV (nickname, score) that the web app's retro mode imports -
full names are deliberately left out.

Usage: python3 scripts/convert_grades.py [grades.csv [output.csv]]

By default the output goes to src/data/grades.csv, which the app bundles and
shows in retro mode until the user imports another file.
"""

import csv
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TASKS_YAML = ROOT / "src" / "data" / "tasks.yaml"


def load_task_points(path: pathlib.Path) -> dict[str, int]:
    """Read {task name: points} from tasks.yaml.

    Uses PyYAML when available; otherwise falls back to a minimal parser that
    understands the file's regular generated structure.
    """
    try:
        import yaml  # type: ignore[import-untyped]

        groups = yaml.safe_load(path.read_text())
        return {task["name"]: int(task["score"]) for group in groups for task in group["tasks"]}
    except ImportError:
        pass

    points: dict[str, int] = {}
    task = None
    for line in path.read_text().splitlines():
        stripped = line.strip()
        if stripped.startswith("- name:") and line.startswith("    "):
            task = stripped.split(":", 1)[1].strip()
        elif stripped.startswith("score:") and task is not None:
            points[task] = int(stripped.split(":", 1)[1])
            task = None
    return points


def main() -> int:
    grades_path = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "grades.csv"
    out_path = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "src" / "data" / "grades.csv"

    points = load_task_points(TASKS_YAML)

    with grades_path.open(newline="") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        print("no rows in", grades_path)
        return 1

    columns = rows[0].keys()
    task_columns = [c for c in columns if c in points]
    unknown = points.keys() - set(columns)
    if unknown:
        print(f"warning: {len(unknown)} tasks from tasks.yaml missing in the export: {sorted(unknown)}")

    students = []
    skipped = 0
    for i, row in enumerate(rows, start=2):
        login = (row.get("Логин") or "").strip()
        if not login:
            print(f"warning: row {i} has no login, skipped")
            skipped += 1
            continue
        seminars = (row.get("Баллы за семинары") or "").strip()
        try:
            score = int(seminars or 0)
        except ValueError:
            print(f"warning: row {i} ({login}): seminar points {seminars!r} not a number, treated as 0")
            score = 0
        for column in task_columns:
            cell = (row.get(column) or "").strip()
            if cell == "1":
                score += points[column]
            elif cell not in ("", "0"):
                print(f"warning: row {i} ({login}), task {column}: unexpected value {cell!r}, treated as unsolved")
        students.append((login, score))

    with out_path.open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["nickname", "score"])
        writer.writerows(students)

    total = sum(s[1] for s in students)
    print(f"{len(students)} students written to {out_path.relative_to(ROOT)} ({skipped} skipped)")
    print(f"joined {len(task_columns)} task columns; scores: min {min(s[1] for s in students)}, "
          f"max {max(s[1] for s in students)}, mean {total / len(students):.0f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
