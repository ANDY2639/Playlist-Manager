#!/bin/bash
set -e

echo "==> Installing yt-dlp for ytdlp-nodejs..."

# Define installation directory
INSTALL_DIR="${HOME}/.local/bin"
mkdir -p "$INSTALL_DIR"

# Check if yt-dlp is already installed
if command -v yt-dlp &> /dev/null; then
    echo "✓ yt-dlp already installed at: $(which yt-dlp)"
    yt-dlp --version
    exit 0
fi

# Method 1: Download binary directly (most reliable for production)
echo "Downloading yt-dlp binary from GitHub..."
if curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "${INSTALL_DIR}/yt-dlp" 2>/dev/null; then
    chmod a+rx "${INSTALL_DIR}/yt-dlp"
    export PATH="${INSTALL_DIR}:$PATH"
    echo "✓ yt-dlp binary downloaded successfully"
else
    echo "Failed to download yt-dlp binary, trying pip installation..."

    # Method 2: Try pip with --user flag (fallback)
    if command -v pip3 &> /dev/null; then
        echo "Attempting pip3 installation with --user flag..."
        if pip3 install --user --upgrade yt-dlp 2>/dev/null; then
            export PATH="${HOME}/.local/bin:$PATH"
            echo "✓ yt-dlp installed via pip3"
        else
            echo "pip3 installation failed (likely externally-managed-environment)"
        fi
    elif command -v pip &> /dev/null; then
        echo "Attempting pip installation with --user flag..."
        if pip install --user --upgrade yt-dlp 2>/dev/null; then
            export PATH="${HOME}/.local/bin:$PATH"
            echo "✓ yt-dlp installed via pip"
        else
            echo "pip installation failed (likely externally-managed-environment)"
        fi
    fi
fi

# Verify installation
echo "Verifying yt-dlp installation..."
if command -v yt-dlp &> /dev/null; then
    echo "✓ yt-dlp installed successfully!"
    echo "  Location: $(which yt-dlp)"
    echo "  Version: $(yt-dlp --version)"
    exit 0
fi

# Check if binary exists in INSTALL_DIR
if [ -f "${INSTALL_DIR}/yt-dlp" ]; then
    echo "✓ yt-dlp binary exists at ${INSTALL_DIR}/yt-dlp"
    echo "  Version: $("${INSTALL_DIR}/yt-dlp" --version)"
    echo "Note: Binary installed at ${INSTALL_DIR}/yt-dlp"
    echo "==> yt-dlp installation complete!"
    exit 0
fi

# Installation failed
echo "✗ yt-dlp installation failed"
echo "Please install yt-dlp manually or check the logs above for errors"
exit 1
