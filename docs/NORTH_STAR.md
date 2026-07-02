# Blacknails-Media-v3: North Star

## Our Mission
Nuestra idea surge de las capacidades de herramientas como **PhotoPrism** como base. El objetivo es construir un gestor de medios 100% autoalojado, inteligente y centrado en la privacidad, potenciado íntegramente por Inteligencia Artificial local.

## What We Are (Core Principles)
1. **Privacy Absolute:** Everything runs locally. AI models (Ollama/Qwen) process images on the host hardware. No data ever leaves the local network.
2. **Prosumer UI (PhotoPrism Style):** The interface must be powerful yet clean. It provides deep access to metadata, filtering, and AI tags without being cluttered. We use modern aesthetics (Tailwind 4) and fluid animations (Framer Motion) to make data exploration feel high-end.
3. **Background Ingestion:** Media is not "uploaded" via the web browser. The system ingests files automatically from a mapped host directory (`library/import`), mimicking a server-side synchronization process.
4. **Robust Foundation:** The backend strictly adheres to **Hexagonal Architecture** and Domain-Driven Design, ensuring long-term maintainability and clear separation of concerns (Core, Adapters, Ports).
5. **AI-First Organization:** We rely on local AI to automatically tag, describe, and cluster faces, removing the burden of manual organization from the user.

## What We Are NOT (Non-Goals)
- **We are NOT a generic SaaS dashboard:** We do not have "Projects", "Workspaces", or "Teams".
- **We are NOT a cloud service:** We do not have cloud "Upload" buttons in the main user interface. Ingestion is exclusively via local filesystem.
- **We are NOT a terminal interface:** The user experience must be visual, elegant, and accessible, focused on the media and its metadata.

## The "Golden Rule" for Agents and Contributors
Before proposing a new feature, a UI change, or writing a line of code, ask yourself: *Does this make viewing and managing personal photos more elegant, private, and effortless?* If the answer is no, discard it.
