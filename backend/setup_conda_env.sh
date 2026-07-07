#!/usr/bin/env bash
# Creates a dedicated conda environment for the FastAPI backend and installs
# its Python dependencies.
#
# Usage:
#   cd backend
#   ./setup_conda_env.sh
#
# Then:
#   conda activate omnilearn
#   uvicorn main:app --reload --port 8000

set -euo pipefail

ENV_NAME="omnilearn"
PYTHON_VERSION="3.11"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CONDA_BASE="$(conda info --base)"
source "$CONDA_BASE/etc/profile.d/conda.sh"

conda create -n "$ENV_NAME" python="$PYTHON_VERSION" -y

conda activate "$ENV_NAME"

pip install -r "$SCRIPT_DIR/requirements.txt"

echo "Done. Activate the environment with: conda activate $ENV_NAME"