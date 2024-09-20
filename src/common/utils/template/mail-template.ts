const HTML_TEMPLATE = (verificationLink) => {
  return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verification Email - SAFEHELPHUB</title>
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
              background-color: #28a745;
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
                <h1>Welcome to SAFEHELPHUB</h1>
              </div>
              <div class="email-body">
                <p>Thank you for signing up! To complete your registration, please verify your email address by clicking the button below:</p>
                <p><a href="${verificationLink}" class="button">Verify Email</a></p>
                <p>If you did not create an account, please disregard this email.</p>
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

export default HTML_TEMPLATE;
