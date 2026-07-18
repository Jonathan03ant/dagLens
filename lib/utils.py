import subprocess
import os
import signal
import time


def kill_port_8080():
    """Kill any process using port 8080"""
    try:
        result = subprocess.run(
            ['lsof', '-ti', ':8080'],
            capture_output=True,
            text=True
        )

        if result.stdout.strip():
            pids = result.stdout.strip().split('\n')
            for pid in pids:
                try:
                    print(f'Killing existing process on port 8080 (PID: {pid})')
                    os.kill(int(pid), signal.SIGKILL)
                except ProcessLookupError:
                    pass

            time.sleep(0.5)
    except FileNotFoundError:
        try:
            subprocess.run(['fuser', '-k', '-9', '8080/tcp'], stderr=subprocess.DEVNULL)
            print('Killed existing process on port 8080')
            time.sleep(0.5)
        except FileNotFoundError:
            pass