# Installation Guide

## Software Requirements

- Python 3.8+
- pip (Python package manager)
- Git

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Vinyl-Projection-Mapping-Player.git
cd Vinyl-Projection-Mapping-Player
```

### 2. Create a Virtual Environment (Optional but Recommended)

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Hardware Setup

- Connect your NFC reader to the appropriate port
- Configure your projection system
- Set up audio output connections

### 5. Configuration

Copy the sample configuration and customize:

```bash
cp config.example.yaml config.yaml
```

Edit `config.yaml` with your specific settings:
- NFC reader device path
- Audio output device
- Projection settings
- Vinyl record database path

### 6. Verify Installation

```bash
python main.py --version
```

## Troubleshooting

### Issue: NFC Reader Not Detected
- Check USB connections
- Verify device permissions
- Check that the correct device path is configured

### Issue: Audio Not Playing
- Verify audio device is connected
- Check audio output configuration
- Ensure music files are in the correct location

### Issue: Projection Not Working
- Verify projector is connected
- Check display settings
- Ensure projection resolution matches configuration

## Getting Help

If you encounter issues not covered here:
1. Check existing [GitHub Issues](https://github.com/yourusername/Vinyl-Projection-Mapping-Player/issues)
2. Create a new issue with details about your setup
3. Include error messages and hardware configuration
