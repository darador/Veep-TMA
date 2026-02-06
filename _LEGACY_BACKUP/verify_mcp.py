
import subprocess
import json
import time
import sys

def verify():
    cmd = [sys.executable, "-m", "notebooklm_mcp.server"]
    
    with open("verify_result.txt", "w", encoding="utf-8") as f:
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=0 
        )

        # Allow startup
        time.sleep(2)
        
        # JSON-RPC request to list resources
        request = {
            "jsonrpc": "2.0", 
            "id": 1, 
            "method": "resources/list"
        }
        
        f.write(f"Sending request: {json.dumps(request)}\n")
        
        try:
            stdout_data, stderr_data = process.communicate(input=json.dumps(request) + "\n", timeout=10)
            
            f.write("--- STDOUT ---\n")
            f.write(stdout_data)
            f.write("\n--- STDERR ---\n")
            f.write(stderr_data)
            
            if "notebook" in stdout_data.lower():
                f.write("\nSUCCESS: Notebooks found in response.\n")
            else:
                f.write("\nWARNING: No notebooks found or invalid response.\n")
                
        except subprocess.TimeoutExpired:
            process.kill()
            f.write("\nTimeout waiting for response\n")

if __name__ == "__main__":
    verify()
