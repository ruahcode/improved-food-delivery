import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5173", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Click on the Sign Up link to go to the registration page
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/nav/div/div/div[3]/a[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Fill in the registration form with valid username, email, and password
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/main/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Test User')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/main/div/div/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('testuser@example.com')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/main/div/div/form/div[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('TestPassword123!')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/main/div/div/form/div[4]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('TestPassword123!')
        

        # Submit the registration form by clicking the Create Account button
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/main/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Clear and re-enter the password and confirm password fields with a simpler valid password to test if the validation error persists
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/main/div/div/form/div[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/main/div/div/form/div[4]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/main/div/div/form/div[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Password1')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/main/div/div/form/div[4]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Password1')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/main/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Try registering with a new unique email address to avoid the 'email already registered' error
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/main/div/div/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('newuser123@example.com')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/main/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Verify that a JWT token is issued and stored securely after registration
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/nav/div/div/div[3]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assertion: Verify registration success notification is displayed
        success_notification = frame.locator('text=Registration successful')
        assert await success_notification.is_visible(), 'Registration success notification should be visible'
          
        # Assertion: Verify a JWT token is issued and stored securely
        # Assuming the JWT token is stored in localStorage under the key 'jwt_token'
        jwt_token = await frame.evaluate("() => window.localStorage.getItem('jwt_token')")
        assert jwt_token is not None and len(jwt_token) > 0, 'JWT token should be issued and stored in localStorage'
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    