"""
MIR Pipeline Discovery and Analysis
Discovers the LLVM MIR pass pipeline by parsing llc --debug-pass=Structure output
and categorizing passes into semantic stages.
"""
import subprocess
import tempfile
import os
from typing import Dict, List, Optional, Tuple

# Pass name to -stop-after ID mapping
# mpas human-readable name from --debug-pass=Structure to llc --stop-after IDs
PASS_NAME_TO_ID = {
    "Finalize ISel and expand pseudo-instructions": "finalize-isel",
    "Virtual Register Rewriter": "virtregrewriter",
    "Prologue/Epilogue Insertion & Frame Finalization": "prologepilog",
    "AMDGPU DAG->DAG Pattern Instruction Selection": "amdgpu-isel",
    "Machine Common Subexpression Elimination": "machine-cse",
    "Greedy Register Allocator": "greedy",
    "AMDGPU Assembly Printer": "amdgpu-asm-printer",
    "Peephole Optimizations": "peephole-opt",
    # MORE
}

def parse_debug_pass_structure(output: str):
    """
    Parses llc --debug-pass=Structure output to extract pass hierarchy.
        - 0 spaces: Module-level
        - 2 spaces: ModulePass Manager
        - 4 spaces: FunctionPass Manager
        - 6 spaces: Function passes
        - 8 spaces: Nested passes (most MIR passes are here)
    """
    passes = []
    for line in output.split('\n'):
        if not line.strip() or line.startswith('Pass Arguments:'):
            continue

        indent = len(line) - len(line.lstrip(' '))
        pass_name = line.strip()

        # Categorize by indentation level
        if indent == 0:
            level = "module"
        elif indent == 2:
            level = "module_manager"
        elif indent == 4:
            level = "function_manager"
        elif indent == 6:
            level = "function_pass"
        elif indent == 8:
            level = "nested_pass"  # Most MIR passes are here
        else:
            level = "unknown"

        passes.append({
            "name": pass_name,
            "indent": indent,
            "level": level,
        })

    return passes

def map_pass_name_to_id(pass_name: str) -> str:
    """
    Maps human-readable pass name to llc -stop-after ID.
    """
    # Check hardcoded mapping first
    if pass_name in PASS_NAME_TO_ID:
        return PASS_NAME_TO_ID[pass_name]

    # Fallback: lowercase and replace spaces with hyphens
    # This won't always be correct, but gives us a starting point
    return pass_name.lower().replace(' ', '-')

def extract_mir_passes(all_passes: List[Dict]):
    """
    Extract MIR passes from all passes
        MIR passes start after "DAG->DAG Pattern Instruction Selection".
        Everything before that is IR passes.
    """
    mir_passes = []
    mir_started = False

    for pass_obj in all_passes:
        pass_name = pass_obj["name"]

        # Detect MIR boundary
        if "DAG->DAG Pattern Instruction Selection" in pass_name:
            mir_started = True

        if mir_started and pass_obj["level"] in ["function_pass", "nested_pass"]:
            # Map human name to pass ID
            pass_id = map_pass_name_to_id(pass_name)

            mir_passes.append({
                "name": pass_name,
                "id": pass_id,
                "indent": pass_obj["indent"],
                "level": pass_obj["level"],
            })

    return mir_passes