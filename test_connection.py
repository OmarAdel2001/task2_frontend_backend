import urllib.request
import urllib.parse
import json
import sys

def test_endpoint(name, url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    print(f"[{name}] {method} {url} ... ", end="")
    try:
        req_data = None
        if data is not None:
            req_data = json.dumps(data).encode('utf-8')
            headers['Content-Type'] = 'application/json'
        
        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.getcode()
            body = response.read().decode('utf-8')
            is_json = 'application/json' in response.headers.get('Content-Type', '')
            res_content = json.loads(body) if is_json else body
            
            if status in (200, 201):
                print("PASSED ✅")
                return True, res_content
            else:
                print(f"FAILED ❌ (Status: {status})")
                return False, res_content
    except Exception as e:
        print(f"FAILED ❌ (Error: {e})")
        return False, str(e)

def main():
    print("==================================================================")
    print("     DPHISH & TASK2 SERVICES INTEGRATION & DIAGNOSTIC SYSTEM      ")
    print("==================================================================\n")
    
    dphish_backend = "http://localhost:8000"
    dphish_frontend = "http://localhost:8080"
    task2_backend = "http://localhost:5000"
    task2_frontend = "http://localhost:8082"
    
    all_passed = True
    
    # ---------------------------------------------------------
    # PART 1: DPHISH SERVICE (PORT 8000 & 8080)
    # ---------------------------------------------------------
    print("--- 1. Testing DPhish Security Platform ---")
    
    # Test Backend Root
    ok, res = test_endpoint("DPhish Backend Root", f"{dphish_backend}/")
    if not ok: all_passed = False
    
    # Test Backend Stats
    ok, res = test_endpoint("DPhish Backend Stats", f"{dphish_backend}/api/stats")
    if not ok: all_passed = False
    
    # Test Quiz questions
    ok, res = test_endpoint("DPhish Quiz Questions", f"{dphish_backend}/api/quiz/questions")
    if not ok: all_passed = False
    
    # Test Heuristics Analysis
    test_phish = {
        "content": "URGENT: Click here http://bank-secure-update.net/login immediately!",
        "title": "Diagnosis Phish"
    }
    ok, res = test_endpoint("DPhish Analyze POST", f"{dphish_backend}/api/analyze", method="POST", data=test_phish)
    if not ok:
        all_passed = False
    else:
        print(f"   ↳ Score: {res.get('score')} | Level: {res.get('level')} | Indicators: {len(res.get('indicators', []))}")
        
    # Test Frontend Webserver
    ok, res = test_endpoint("DPhish Frontend Static", f"{dphish_frontend}/")
    if not ok: all_passed = False
    
    print()
    
    # ---------------------------------------------------------
    # PART 2: TASK2 SERVICE (PORT 5000 & 8082)
    # ---------------------------------------------------------
    print("--- 2. Testing Task2 Hello World Platform ---")
    
    # Test Backend Direct hello
    ok, res = test_endpoint("Task2 Backend Direct Hello", f"{task2_backend}/api/hello")
    if not ok: all_passed = False
    
    # Test Backend Direct Health
    ok, res = test_endpoint("Task2 Backend Direct Health", f"{task2_backend}/api/health")
    if not ok: all_passed = False
    
    # Test Frontend Static
    ok, res = test_endpoint("Task2 Frontend Static", f"{task2_frontend}/")
    if not ok: all_passed = False
    
    # Test Frontend Reverse-Proxy to Backend (Nginx location /api/)
    ok, res = test_endpoint("Task2 Nginx Proxy -> Backend Connection", f"{task2_frontend}/api/hello")
    if not ok:
        all_passed = False
    else:
        print(f"   ↳ Proxied Message: {res.get('message')} (Timestamp: {res.get('timestamp')})")
        
    print("\n==================================================================")
    if all_passed:
        print("★ STATUS: ALL DIAGNOSTICS PASSED SUCCESSFULLY! BOTH SYSTEMS ONLINE ★")
        sys.exit(0)
    else:
        print("★ STATUS: DIAGNOSTIC FAILURE IDENTIFIED. CHECK SYSTEM LOGS. ★")
        sys.exit(1)

if __name__ == '__main__':
    main()
