"""Validate an exported ADMITWISE JSON backup without uploading or modifying it."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib.parse import urlparse

VALID_FIELDS = {
    "bagrutAverage", "psychometricTotal", "psychometricQuant", "yael", "amirnet",
    "mathUnits", "mathGrade", "englishUnits", "englishGrade", "physicsUnits", "physicsGrade",
}
VALID_OPERATORS = {"gte", "gt", "lte", "lt", "eq"}


def validate_backup(data: object) -> list[str]:
    errors: list[str] = []
    if not isinstance(data, dict):
        return ["Root must be a JSON object."]
    if data.get("application") != "ADMITWISE":
        errors.append("application must be ADMITWISE.")
    if data.get("schemaVersion") != 1:
        errors.append("schemaVersion must be 1.")
    if not isinstance(data.get("profile"), dict):
        errors.append("profile must be an object.")
    institutions = data.get("institutions")
    if not isinstance(institutions, list):
        errors.append("institutions must be an array.")
        return errors

    for index, record in enumerate(institutions, start=1):
        prefix = f"institution[{index}]"
        if not isinstance(record, dict):
            errors.append(f"{prefix} must be an object.")
            continue
        for required in ("id", "institution", "program", "year"):
            if record.get(required) in (None, ""):
                errors.append(f"{prefix}.{required} is required.")
        try:
            year = int(record.get("year"))
            if year < 2024 or year > 2100:
                raise ValueError
        except (TypeError, ValueError):
            errors.append(f"{prefix}.year must be between 2024 and 2100.")
        if not isinstance(record.get("groups"), list):
            errors.append(f"{prefix}.groups must be an array.")
            continue
        for g_index, group in enumerate(record["groups"], start=1):
            gp = f"{prefix}.groups[{g_index}]"
            if not isinstance(group, dict) or group.get("mode") not in {"all", "any"}:
                errors.append(f"{gp}.mode must be all or any.")
                continue
            if not isinstance(group.get("rules"), list):
                errors.append(f"{gp}.rules must be an array.")
                continue
            for r_index, rule in enumerate(group["rules"], start=1):
                rp = f"{gp}.rules[{r_index}]"
                if not isinstance(rule, dict):
                    errors.append(f"{rp} must be an object.")
                    continue
                if rule.get("field") not in VALID_FIELDS:
                    errors.append(f"{rp}.field is not supported.")
                if rule.get("operator") not in VALID_OPERATORS:
                    errors.append(f"{rp}.operator is not supported.")
                value = rule.get("value")
                if isinstance(value, bool) or not isinstance(value, (float, int)):
                    errors.append(f"{rp}.value must be numeric.")
        source = record.get("sourceUrl")
        if source:
            parsed = urlparse(str(source))
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                errors.append(f"{prefix}.sourceUrl must use http or https.")
    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python tools/validate_backup.py path/to/admitwise-backup.json")
        return 2
    path = Path(sys.argv[1])
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Could not read JSON: {exc}")
        return 2
    errors = validate_backup(data)
    if errors:
        print("Backup validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"Backup is valid. Institution records: {len(data['institutions'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
