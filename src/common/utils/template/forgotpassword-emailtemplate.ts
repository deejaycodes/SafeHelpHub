const FORGOT_PASSWORD_TEMPLATE = (resetCode) => {
    return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Reset Your Password - SAFEHELPHUB</title>
            <style>
              .container {
                width: 100%;
                height: 100%;
                padding: 20px;
                background-color: #f4f4f4;
              }
              .email {
                width: 80%;
                margin: 0 auto;
                background-color: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              .email-header {
                background-color: orange; /* Changed to orange */
                color: #fff;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .email-body {
                padding: 20px;
              }
              .email-footer {
                background-color: orange; /* Changed to orange */
                color: #fff;
                padding: 20px;
                text-align: center;
                border-radius: 0 0 8px 8px;
              }
              .button {
                background-color: #007bff; /* Different button color for reset password */
                color: white;
                padding: 10px 15px;
                text-align: center;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="email">
                <div class="email-header">
                  <h1>Password Reset Request</h1>
                </div>
                <div class="email-body">
                 <p>We received a request to reset your password. Use the 4-digit code below to reset your password. This code will expire in 2 minutes:</p>
                 <p style="font-size: 24px; font-weight: bold; text-align: center;">${resetCode}</p>
                 <p>If you didn't request a password reset, please ignore this email.</p>
                </div>
                <div class="email-footer">
                  <p>For support, contact us at support@safehelphub.com</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
  };
  
  export default FORGOT_PASSWORD_TEMPLATE;
  