import subprocess
import glob
import os
import datetime

DAG_STAGE_FLAGS = {
    'dag-combine1': '-view-dag-combine1-dags',    # After build, before first optimization pass
    'legalize': '-view-legalize-dags',            # Before legalization (after dag-combine1)
    'dag-combine2': '-view-dag-combine2-dags',    # Before second optimization pass (after legalization)
    'isel': '-view-isel-dags',                    # Before instruction selection (after dag-combine2)
    'sched': '-view-sched-dags'                   # Before scheduling (after instruction selection)
}


def run_llc(ir_code: str, stage: str, llc_path: str):
    """
        Generates graph .dot file from LLVM IR
        llc_path: user provides path via UI
        -march: default amdgcn, later user defined (TODO)
        -mcpu: default gfx1101, later user defined (TODO)
    """

    with open('/tmp/input.ll', 'w') as f:
        f.write(ir_code)

    flag = DAG_STAGE_FLAGS[stage]

    cmd = [
        llc_path,             # User-provided llc path
        '-march=amdgcn',      # TODO: make configurable
        '-mcpu=gfx1101',      # TODO: make configurable
        '/tmp/input.ll',
        flag,
        '-o', '/dev/null'     # Don't generate assembly, just .dot
    ]

    result = subprocess.run(
        cmd,
        check=True,
        capture_output=True,
        text=True
    )

    terminal_output = []
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    terminal_output.append({
        "type": "command",
        "text": " ".join(cmd),
        "timestamp": timestamp
    })

    if result.stdout.strip():
        for line in result.stdout.strip().split('\n'):
            terminal_output.append({
                "type": "stdout",
                "text": line,
                "timestamp": timestamp
            })
    terminal_output.append({
        "type": "success",
        "text": f"✓ Compiled successfully (exit code: {result.returncode})",
        "timestamp": timestamp
    })

    dot_files = glob.glob('/tmp/dag.*.dot')
    dot_files.sort(key=os.path.getmtime, reverse=True)
    dot_file = dot_files[0]

    return dot_file, terminal_output