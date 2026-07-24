---
name: remember-this
description: Save conversation findings to the RAG database at ai-vault for knowledge persistence
---

## Purpose

The user is asking you to add or update markdown files related to the topics we were discussing to a RAG data base. Your goal is to 
- Establish what information the user wants you to save from your conversation. Determine which topics are to be saved, ask if it is ambiguous.
- Establish where within the RAG vault your summary file should be located based on the directory/filepath naming scheme which is based on the topics being requested to be saved.
- Save a detailed summary of the requested topics/findings, all associated references brought up during the conversation, all URL links, and all relevant context from any associated research.
- The document must contain everything a fresh agent needs to understand your findings without having to redo the research.
- This ensures knowledge persistence, auditability, and reproducibility.

Expect this command was used after a user asks a question or series of questions. It would also likely be used after performing research, so the research information can be retained to our local RAG system.

**This is a strict path requirement.** All research documents must be saved in a topic file under the appropriate meta-topic subfolders:

First, determine the RAG vault path by calling `local-rag_list_files` and reading `baseDirs[0]` from the response. All documents must be saved under this base directory. Under the base directory they should be saved in directories organized by topic: `<vault-base-dir>/<meta-topic>/<meta-subtopic>/<topic>.md`.

Where `<meta-topic>`, `<meta-subtopic>` and `<topic>` are kebab-case folder/filenames describing the research subject. For example:
- `opencode/core/opencode-life-cycle.md` for research regarding the functionality of the lifecycle for the OpenCode tool
- `opencode/plugins/superpowers.md` for the Superpowers plugin for OpenCode
- `wsl/troubleshooting/vscode-memory-leak.md` for a troubleshooting guide to VSCode memory leaks when connecting to WSL through VSCode

- Use lowercase kebab-case for filenames.
- If a file for that topic already exists, **update it** with the new findings.
- **Include a technology stack / context summary at the very top of the file.**
- **Include a timestamp at the top of each document noting when the research was conducted.**
- If the `<meta-topic>\<meta-subtopic>` directory does not exist, create it before writing.
- `meta-topic`s are typically the associated with a specific tool, project, techstack, or idea.
- `meta-subtopic`s are ways to better organize the exact markdown file output location.
- Common `meta-subtopic`s include:
  - core - core API information, architecture, project setup, etc for the main meta-topic
  - plugins - associated plugins for the main meta-topic
  - troubleshooting - troubleshooting documents, specific errors/failures and their resolutions with regard to the main meta-topic
  - frameworks - associated frameworks for the main meta-topic
  - testing - testing methods/patterns/tools for the main meta-topic