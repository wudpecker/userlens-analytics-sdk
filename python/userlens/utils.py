import base64

def encode_base64(data):
    return base64.b64encode(f"{data}:".encode()).decode()