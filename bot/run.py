"""Cross-platform launcher: isolated dependencies, then long polling."""
import os
from pathlib import Path
import subprocess
import sys
import venv


def main():
    root = Path(__file__).resolve().parent
    if sys.version_info < (3, 11):
        raise SystemExit('Python >= 3.11 required')
    environment = root / '.venv'
    executable = environment / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
    if not executable.exists():
        venv.EnvBuilder(with_pip=True).create(environment)
    requirements = root / 'requirements.txt'
    marker = environment / '.bobr-requirements'
    desired = requirements.read_bytes()
    if not marker.exists() or marker.read_bytes() != desired:
        subprocess.run([str(executable), '-m', 'pip', 'install', '-r', str(requirements)], check=True)
        marker.write_bytes(desired)
    subprocess.run([str(executable), '-m', 'bot'], cwd=root.parent, check=True)


if __name__ == '__main__':
    try:
        main()
    except subprocess.CalledProcessError as error:
        raise SystemExit(error.returncode) from None
