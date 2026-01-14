# VLM Batch Descriptor

A modern Next.js web application that uses local Vision-Language Models (via **Ollama**) to batch generate descriptions for images and automatically write them to image metadata (EXIF/XMP).

![VLM Batch Descriptor UI](https://via.placeholder.com/800x400?text=VLM+Batch+Descriptor+Preview)

## Features

- 🖼️ **Batch Processing**: Process entire folders of images at once.
- 🧠 **Local AI**: Uses running local LLMs (Llava, Bakllava, etc.) via Ollama. No cloud API keys required.
- 🏷️ **Metadata Writing**: Writes descriptions directly to:
  - `ImageDescription` (EXIF)
  - `XPComment` (Windows)
  - `XMP-dc:Description` (XMP)
- 🔒 **Secure**: Hardened against command injection using `spawnSync`.
- 🛡️ **Robust**: 
  - File existence and permission checks.
  - Abort controller to cancel batches mid-way.
  - Hard timeouts to prevent hanging on corrupted files.
- 🎨 **Modern UI**: Clean, glassmorphism-inspired interface with real-time logs and progress tracking.

## Prerequisites

- **Ollama**: Installed and running locally. [Get Ollama](https://ollama.ai)
- **Node.js**: v18 or newer.
- **Git**

## Setup

1. **Pull a VLM Model** (if you haven't already):
   ```bash
   ollama pull llava
   ```

2. **Clone the Repository**:
   ```bash
   git clone https://github.com/psychedelicmojo/vlm-batch-descriptor.git
   cd vlm-batch-descriptor/app
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

## Usage

1. **Start Ollama** (with CORS allowed for browser access):
   **PowerShell**:
   ```powershell
   $env:OLLAMA_ORIGINS="*"; ollama serve
   ```
   **Mac/Linux**:
   ```bash
   OLLAMA_ORIGINS="*" ollama serve
   ```

2. **Start the Web App**:
   ```bash
   npm run dev
   ```

3. **Open Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

4. **Workflow**:
   - Paste the full path to your image folder (e.g., `C:\Users\Name\Pictures\Vacation`).
   - Click **"Load Images"**.
   - Select your model (e.g., `llava:latest`).
   - Click **"Start Batch"**.
   - Watch as descriptions are generated and written to your files!

## Technical Details

- **Frontend**: Next.js App Router (React), Vanilla CSS.
- **Backend**: Next.js API Routes.
- **Image Processing**:
  - Images directly read from disk.
  - Base64 encoded for safe transport to Ollama.
- **Metadata Tools**: Uses a vendored `exiftool` binary for maximum compatibility.

## Known Limitations

- Currently designed for Windows file paths (backslashes), though core logic works on Mac/Linux.
- Serial processing is enforced to prevent overloading local consumer GPUs.

## License

MIT
