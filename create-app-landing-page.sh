#!/bin/bash

# Create Landing Page for Mobile App Distribution
# This creates a simple HTML page with download links and QR code

echo "Creating RuralConnect AI App Landing Page..."

cat > app-download.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Download RuralConnect AI - Mobile App</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
        }
        
        .logo {
            font-size: 48px;
            margin-bottom: 10px;
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 32px;
        }
        
        .tagline {
            color: #666;
            margin-bottom: 30px;
            font-size: 18px;
        }
        
        .qr-code {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 10px;
            margin: 30px 0;
            display: inline-block;
        }
        
        .qr-code img {
            width: 200px;
            height: 200px;
        }
        
        .download-btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 40px;
            border-radius: 50px;
            text-decoration: none;
            font-size: 18px;
            font-weight: 600;
            margin: 10px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .web-btn {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        .features {
            margin-top: 40px;
            text-align: left;
        }
        
        .features h3 {
            color: #333;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .feature-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            display: flex;
            align-items: center;
        }
        
        .feature-icon {
            font-size: 24px;
            margin-right: 10px;
        }
        
        .feature-text {
            color: #555;
            font-size: 14px;
        }
        
        .instructions {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 10px;
            padding: 20px;
            margin-top: 30px;
            text-align: left;
        }
        
        .instructions h4 {
            color: #856404;
            margin-bottom: 10px;
        }
        
        .instructions ol {
            margin-left: 20px;
            color: #856404;
        }
        
        .instructions li {
            margin: 5px 0;
        }
        
        .footer {
            margin-top: 30px;
            color: #999;
            font-size: 14px;
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 30px 20px;
            }
            
            h1 {
                font-size: 24px;
            }
            
            .download-btn {
                display: block;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🌾</div>
        <h1>RuralConnect AI</h1>
        <p class="tagline">Empowering Rural India with AI</p>
        
        <div class="qr-code">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://expo.dev/accounts/chinnu22/projects/ruralconnect-ai/builds/b36d0e44-bc7d-46d9-a65d-eb19eab973e7" alt="QR Code">
            <p style="margin-top: 10px; color: #666; font-size: 14px;">Scan to Download</p>
        </div>
        
        <a href="https://expo.dev/accounts/chinnu22/projects/ruralconnect-ai/builds/b36d0e44-bc7d-46d9-a65d-eb19eab973e7" class="download-btn" target="_blank">
            📱 Download Android App
        </a>
        
        <a href="http://ruralconnect-web-032761628276.s3-website-us-east-1.amazonaws.com" class="download-btn web-btn" target="_blank">
            🌐 Try Web Version
        </a>
        
        <div class="features">
            <h3>✨ Features</h3>
            <div class="feature-list">
                <div class="feature-item">
                    <span class="feature-icon">🌾</span>
                    <span class="feature-text">Smart Agriculture with AI crop recommendations</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🏥</span>
                    <span class="feature-text">Primary Healthcare with symptom checker</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">📚</span>
                    <span class="feature-text">Education & Skill Development</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🏗️</span>
                    <span class="feature-text">Infrastructure & Civic Engagement</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🤖</span>
                    <span class="feature-text">AI Assistant powered by AWS Bedrock</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🌍</span>
                    <span class="feature-text">15 Indian Languages supported</span>
                </div>
            </div>
        </div>
        
        <div class="instructions">
            <h4>📋 Installation Instructions</h4>
            <ol>
                <li>Download the APK file by clicking the button above</li>
                <li>Enable "Install from Unknown Sources" in your device settings</li>
                <li>Open the downloaded APK file</li>
                <li>Tap "Install" and wait for installation to complete</li>
                <li>Open the app and start exploring!</li>
            </ol>
        </div>
        
        <div class="footer">
            <p>Built with ❤️ for Rural India</p>
            <p>Powered by AWS Bedrock, React Native & Expo</p>
        </div>
    </div>
</body>
</html>
EOF

echo "✓ Landing page created: app-download.html"
echo ""
echo "To view locally:"
echo "  open app-download.html"
echo ""
echo "To deploy to S3:"
echo "  aws s3 cp app-download.html s3://ruralconnect-web-032761628276/download.html --content-type text/html"
echo "  URL: http://ruralconnect-web-032761628276.s3-website-us-east-1.amazonaws.com/download.html"
echo ""
