
import subprocess
import json
import uuid
import sys

def verify():
    cmd = [sys.executable, "-m", "notebooklm_mcp.server"]
    
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

    # 2. Initialized notification
    init_notif = {
        "jsonrpc": "2.0",
        "method": "notifications/initialized"
    }

    # 3. List resources
    list_req = {
        "jsonrpc": "2.0", 
        "id": 2, 
        "method": "resources/list"
    }

    input_str = json.dumps(init_req) + "\n" + json.dumps(init_notif) + "\n" + json.dumps(list_req) + "\n"

    try:
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        
        stdout, stderr = process.communicate(input=input_str, timeout=15)
        
        with open("verify_result_final.txt", "w", encoding="utf-8") as f:
            f.write("--- STDOUT ---\n")
            f.write(stdout)
            f.write("\n--- STDERR ---\n")
            f.write(stderr)
            
            if "notebook" in stdout.lower() or "resources" in stdout.lower():
                print("SUCCESS")
            else:
                print("FAILURE")

    except Exception as e:
        with open("verify_result_final.txt", "w", encoding="utf-8") as f:
            f.write(f"Error: {e}")
        print(f"Error: {e}")

if __name__ == "__main__":
    verify()
