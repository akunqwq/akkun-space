 [简体中文](README.CN.md) | English

# Akun's Space

AkkunSpace is my personal digital space.

**This repository opens the implementation of the space** — site code, UI design, tools, architecture, and technical decisions — for learning and reference.

**Not included in this repository:**
- Personal data (birthday, anniversaries, private configuration)
- Private records and sensitive information
- Production environment variable values

> A personal space carries private memories. We open the implementation ("how it works") while keeping private data ("who I am") out of the repository. All personal-event env vars (e.g. `PERSONAL_BIRTHDAY`) are read server-side only and never appear in the client bundle or API response.

To run locally, copy `.env.example` to `.env.local` and fill in your own values. Personal-event variables are optional — leave empty to disable the corresponding event.

See [README.CN.md](README.CN.md) for the full Chinese documentation.

