#!/usr/bin/env node

/**
 * Web3FyGo Browser Diagnostics Script
 * Run this to diagnose browser and system issues
 */

const { execSync } = require('child_process');
const https = require('https');

console.log('🔍 Web3FyGo Browser Diagnostics\n');

// System Information
console.log('=== SYSTEM INFO ===');
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Node.js: ${process.version}`);
console.log(`Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB\n`);

// Check Browser Installation
console.log('=== BROWSER CHECK ===');

function getChromeExecutablePath() {
    const fs = require('fs');

    // Common Chrome paths for different platforms
    const chromePaths = {
        win32: [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
        ],
        darwin: [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium'
        ],
        linux: [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium'
        ]
    };

    const platform = process.platform;
    const paths = chromePaths[platform] || chromePaths.linux;

    // Check each path until we find one that exists
    for (const path of paths) {
        try {
            if (fs.existsSync(path)) {
                return path;
            }
        } catch (error) {
            // Continue checking other paths
        }
    }

    return null;
}

const chromePath = getChromeExecutablePath();
if (chromePath) {
    console.log(`✅ Chrome found at: ${chromePath}`);

    // Try to get version
    try {
        let versionCommand = '';
        if (process.platform === 'darwin') {
            versionCommand = `"${chromePath}" --version`;
        } else {
            versionCommand = `${chromePath} --version`;
        }

        const chromeVersion = execSync(versionCommand, { encoding: 'utf8', timeout: 5000 });
        console.log(`📝 Chrome version: ${chromeVersion.trim()}`);
    } catch (versionError) {
        console.log('⚠️ Chrome found but version check failed');
    }
} else {
    console.log('❌ No Chrome/Chromium found');
    if (process.platform === 'darwin') {
        console.log('💡 Install Chrome from: https://www.google.com/chrome/');
    } else {
        console.log('💡 Install with: sudo apt-get install google-chrome-stable');
    }
}

// Check Puppeteer
console.log('\n=== PUPPETEER CHECK ===');
try {
    const puppeteer = require('puppeteer');
    console.log('✅ Puppeteer module found');

    // Test basic browser launch
    console.log('🧪 Testing browser launch...');
    (async () => {
        try {
            const launchConfig = {
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                timeout: 10000
            };

            // Use detected Chrome path if available
            if (chromePath) {
                launchConfig.executablePath = chromePath;
                console.log('🔧 Using detected Chrome path for test');
            }

            const browser = await puppeteer.launch(launchConfig);

            console.log('✅ Browser launch successful');

            const version = await browser.version();
            console.log(`📝 Browser version: ${version}`);

            await browser.close();
            console.log('✅ Browser closed successfully');

        } catch (error) {
            console.log(`❌ Browser launch failed: ${error.message}`);

            if (error.message.includes('socket hang up')) {
                console.log('\n🔍 Socket hang up detected. Possible causes:');
                console.log('  • Network connectivity issues');
                console.log('  • Firewall blocking browser');
                console.log('  • System resource constraints');
                console.log('  • Browser executable not found');
            }
        }
    })();

} catch (error) {
    console.log(`❌ Puppeteer not found: ${error.message}`);
    console.log('💡 Install with: npm install puppeteer');
}

// Check Network Connectivity
console.log('\n=== NETWORK CHECK ===');
const testConnectivity = () => {
    return new Promise((resolve, reject) => {
        const req = https.get('https://www.amazon.com/', { timeout: 5000 }, (res) => {
            console.log(`✅ Amazon connectivity: HTTP ${res.statusCode}`);
            resolve(res);
        });

        req.on('error', (error) => {
            console.log(`❌ Amazon connectivity failed: ${error.message}`);
            reject(error);
        });

        req.on('timeout', () => {
            console.log('❌ Amazon connectivity: Timeout');
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
};

testConnectivity().catch(() => {
    console.log('💡 Check your internet connection and firewall settings');
});

// Check API Server
console.log('\n=== API SERVER CHECK ===');
setTimeout(() => {
    const testApi = () => {
        return new Promise((resolve, reject) => {
            const req = https.get('http://localhost:3000/health', { timeout: 3000 }, (res) => {
                console.log(`✅ API server: HTTP ${res.statusCode}`);
                resolve(res);
            });

            req.on('error', (error) => {
                console.log(`❌ API server not running: ${error.message}`);
                console.log('💡 Start with: npm run dev');
                reject(error);
            });

            req.on('timeout', () => {
                console.log('❌ API server timeout');
                req.destroy();
                reject(new Error('Timeout'));
            });
        });
    };

    testApi().catch(() => { });
}, 2000);

// Recommendations
setTimeout(() => {
    console.log('\n=== RECOMMENDATIONS ===');
    console.log('1. If browser launch fails:');
    console.log('   • Check Chrome/Chromium installation');
    console.log('   • Try: export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome');
    console.log('   • For servers: install xvfb for headless display');

    console.log('\n2. If socket hang up persists:');
    console.log('   • Check firewall settings');
    console.log('   • Try different network connection');
    console.log('   • Reduce concurrent requests');

    console.log('\n3. Alternative approaches:');
    console.log('   • Use HTTP-only scraping (no browser)');
    console.log('   • Use fallback data mode');
    console.log('   • Configure headless mode instead of local browser');

    console.log('\n4. Get help:');
    console.log('   • Run: curl http://localhost:3000/api/browser-diagnostics');
    console.log('   • Check logs with: npm run dev');
    console.log('   • View troubleshooting guide: SCRAPING-TROUBLESHOOTING.md');

    console.log('\n✨ Diagnostics complete!');
}, 4000); 