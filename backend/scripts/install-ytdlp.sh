#!/bin/bash
set -e

echo "==> Installing yt-dlp for ytdlp-nodejs..."

# Define installation directory
INSTALL_DIR="${HOME}/.local/bin"
mkdir -p "$INSTALL_DIR"

# Check if yt-dlp is already installed
if command -v yt-dlp &> /dev/null; then
    echo "yt-dlp already installed at: $(which yt-dlp)"
    yt-dlp --version
    exit 0
fi

# Try pip installation first (most reliable)
echo "Attempting pip installation..."
if command -v pip3 &> /dev/null; then
    echo "Using pip3..."
    pip3 install --user --upgrade yt-dlp
    export PATH="${HOME}/.local/bin:$PATH"
elif command -v pip &> /dev/null; then
    echo "Using pip..."
    pip install --user --upgrade yt-dlp
    export PATH="${HOME}/.local/bin:$PATH"
else
    # Fallback: Download binary directly
    echo "pip not found, downloading yt-dlp binary directly..."

    # Download latest yt-dlp binary
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "${INSTALL_DIR}/yt-dlp"
    chmod a+rx "${INSTALL_DIR}/yt-dlp"

    # Add to PATH for current session
    export PATH="${INSTALL_DIR}:$PATH"
fi

# Verify installation
echo "Verifying yt-dlp installation..."
if command -v yt-dlp &> /dev/null; then
    echo "✓ yt-dlp installed successfully!"
    echo "Location: $(which yt-dlp)"
    yt-dlp --version
else
    echo "✗ Warning: yt-dlp not found in PATH"
    echo "Checking ${INSTALL_DIR}..."
    if [ -f "${INSTALL_DIR}/yt-dlp" ]; then
        echo "✓ yt-dlp binary exists at ${INSTALL_DIR}/yt-dlp"
        "${INSTALL_DIR}/yt-dlp" --version
        echo "Note: Make sure ${INSTALL_DIR} is in your PATH"
    else
        echo "✗ yt-dlp installation failed"
        exit 1
    fi
fi

echo "==> yt-dlp installation complete!"
