import requests
import asyncio

from datetime import datetime

from .utils import encode_base64

class EventTracker:
    def __init__(self, write_code = "", requests_timeout=5):
        if not write_code or not isinstance(write_code, str):
            print('Error in userlens-sdk-py: write_code is required and must be a string')
            return
        
        if requests_timeout <= 0 or not isinstance(requests_timeout, int):
            print('Error in userlens-sdk-py: requests_timeout must be a positive integer')
            return

        self.write_code = encode_base64(write_code)
        self.requests_timeout = requests_timeout
        self.INGESTOR_URL = 'https://events.userlens.io'

    def identify(self, user_id = "", traits = {}):
        try:
            if not user_id:
                raise ValueError('user_id is required')
            
            payload = {
                "type": "identify",
                "userId": user_id,
                **({"traits": traits} if traits and isinstance(traits, dict) else {})
            }
            headers = {
                "Authorization": f"Basic {self.write_code}",
            }

            response = requests.post(
                f"{self.INGESTOR_URL}/event", 
                json=payload, 
                headers=headers, 
                timeout=self.requests_timeout
            )

            if response.status_code != 200:
                print(f'Error in userlens-sdk-py: {response.json()}')
                return

            return "User identified successfully"
        except Exception as e:
            try:
                print(f'Error in userlens-sdk-py: {e}')
            except:
                print(f'Error in userlens-sdk-py')

    def track(self, user_id = "", event_name = "", traits = {}):
        try:
            if not user_id:
                raise ValueError('user_id is required')
            
            if not event_name:
                raise ValueError('event_name is required')

            payload = {
                "type": "track",
                "userId": user_id,
                "event": event_name,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "source": "userlens-sdk-py"
            }
            headers = {
                "Authorization": f"Basic {self.write_code}",
            }

            response = requests.post(
                f"{self.INGESTOR_URL}/event", 
                json=payload, 
                headers=headers, 
                timeout=self.requests_timeout
            )

            if response.status_code != 200:
                raise ValueError(f'request error {response.json()}')
            
            self.identify(user_id, traits)
            
            return "Event tracked successfully"
        except Exception as e:
            try:
                print(f'Error in userlens-sdk-py: {e}')
            except:
                print(f'Error in userlens-sdk-py')
