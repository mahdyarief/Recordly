---
description: Scaffold a new FBA + Onion + Hexagonal feature directory
---

# Scaffold Feature Workflow

Follow these steps to create a new, perfectly structured feature in Recordly.

1.  **Run the Scaffold Command (in terminal)**:
    Replace `<NAME>` with your feature name (e.g., `video-preview`).
    
    ```bash
    mkdir -p src/features/<NAME>/{domain/{entities,value-objects,errors,ports},services,adapters,components,hooks,store} && touch src/features/<NAME>/{types.ts,index.ts}
    ```

2.  **Define Your Core Entity**:
    // turbo
    Create `src/features/<NAME>/domain/entities/<NAME_CAPS>.ts`.
    *   *Skill:* `extract-domain-entity`

3.  **Define Ports for Side-Effects**:
    // turbo
    Create interfaces for IPC/FS/Store in `src/features/<NAME>/domain/ports/`.
    *   *Skill:* `define-port`

4.  **Implement Concrete Adapter**:
    // turbo
    Write the Electron/Node implementation in `src/features/<NAME>/adapters/`.

5.  **Build Your Use Cases (Services)**:
    // turbo
    Create the application-layer logic in `src/features/<NAME>/services/`.
    *   *Skill:* `write-use-case`

6.  **Create the Bridge Hook**:
    // turbo
    Write `src/features/<NAME>/hooks/use<NAME_CAPS>.ts`.

7.  **Export the Public API**:
    // turbo
    Fill `src/features/<NAME>/index.ts` with your barrel exports.

8.  **Final Readability Check**:
    // turbo
    Verify Sandi Metz compliance (≤ 100 lines per file, ≤ 5 per function).
    *   *Skill:* `code-readability`
