# Utility Scripts

This directory contains utility scripts for setup, testing, and verification.

## Scripts

### Setup & Verification

**VERIFY-SETUP.sh**
- Verifies that the development environment is correctly set up
- Checks dependencies, services, and configurations
- Run before starting development to ensure everything works

```bash
./scripts/VERIFY-SETUP.sh
```

**quick-start.sh**
- Quick start script to launch the application
- Starts both backend and frontend services
- Useful for rapid development and testing

```bash
./scripts/quick-start.sh
```

### Testing

**test-complete-flow.sh**
- End-to-end testing script
- Tests the complete user flow from login to MR component interactions
- Verifies all critical functionality

```bash
./scripts/test-complete-flow.sh
```

## Usage Notes

- All scripts should be executable: `chmod +x scripts/*.sh`
- Scripts assume they're run from the project root directory
- Check each script for environment variable requirements

## Related Documentation

- [Setup Guide](../docs/setup/COMPLETE_SETUP_GUIDE.md)
- [Testing Guide](../docs/guides/TESTING-GUIDE-PHASE-5.5.md)
- [Quick Start](../docs/setup/QUICKSTART.md)
