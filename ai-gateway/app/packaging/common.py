import json
import zipfile
from pathlib import Path

def write_zip(path: Path, files: dict[str, str | bytes]):
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name, content in files.items():
            archive.writestr(name, content)
    return path

def json_text(value):
    return json.dumps(value, indent=2, ensure_ascii=False)
