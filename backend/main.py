import subprocess
import os

def start_electron():
    electron_dir = os.path.abspath("../frontend")

    subprocess.Popen(
        ["npm", "run", "start"],
        cwd=electron_dir 
    )

if __name__ == "__main__":
    print("Python started.")
    start_electron()
