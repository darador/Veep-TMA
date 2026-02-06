
import subprocess
import json
import time
import sys

def verify():
    cmd = [sys.executable, "-m", "notebooklm_mcp.server"]
    
    with open("verify_result_v2.txt", "w", encoding="utf-8") as f:
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=0 
        )

        time.sleep(2)
        
        # 1. Initialize
        init_req = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "test", "version": "1.0"}
            }
        }
        f.write(f"Sending init: {json.dumps(init_req)}\n")
        process.stdin.write(json.dumps(init_req) + "\n")
        process.stdin.flush()
        
        # Read init response (approximate, just reading lines)
        # We can't blocking read everything easily without threads, but we can try reading a line
        line1 = process.stdout.readline()
        f.write(f"Init response: {line1}\n")

        # 2. Initialized notification
        init_notif = {
            "jsonrpc": "2.0",
            "method": "notifications/initialized"
        }
        f.write(f"Sending initialized: {json.dumps(init_notif)}\n")
        process.stdin.write(json.dumps(init_notif) + "\n")
        process.stdin.flush()

        time.sleep(1)

        # 3. List resources
        list_req = {
            "jsonrpc": "2.0", 
            "id": 2, 
            "method": "resources/list"
        }
        
        f.write(f"Sending list: {json.dumps(list_req)}\n")
        process.stdin.write(json.dumps(list_req) + "\n")
        process.stdin.flush()
        
        # Read list response
        line2 = process.stdout.readline()
        f.write(f"List response: {line2}\n")
        
        # Capture stderr
        stderr_output = process.stderr.read() if process.stderr else ""
        f.write("\n--- STDERR ---\n")
        f.write(stderr_output)
        
        if "notebook" in line2.lower() or "resources" in line2.lower():
             print("SUCCESS") # Printed to stdout for agent to see
             f.write("\nSUCCESS: Protocol interaction completed.\n")
        else:
             print("FAILURE")
             f.write("\nFAILURE: No resources returned.\n")

        process.terminate()

if __name__ == "__main__":
    verify()
