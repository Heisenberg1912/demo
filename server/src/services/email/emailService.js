import createTransporter from './emailConfig.js';

export const sendOTPEmail = async (email, otp, purpose = 'verification') => {
  try {
    const transporter = createTransporter();
    
    const emailTemplates = {
      login: {
        subject: 'Your Login Verification Code - Builtatic',
        html: `
          <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">Builtatic</h1>
              <h2 style="color: #666; font-weight: normal;">Login Verification</h2>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
              <h3 style="color: #333; margin-bottom: 20px;">Your verification code is:</h3>
              <div style="text-align: center; margin: 20px 0;">
                <span style="background-color: #007bff; color: white; padding: 15px 30px; font-size: 24px; font-weight: bold; border-radius: 5px; letter-spacing: 3px;">${otp}</span>
              </div>
              <p style="color: #666; margin-top: 20px;">This code will expire in 10 minutes.</p>
            </div>
            
            <div style="color: #666; font-size: 14px;">
              <p>If you didn't request this code, please ignore this email.</p>
              <p>For security reasons, please don't share this code with anyone.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">© 2025 Builtatic. All rights reserved.</p>
            </div>
          </div>
        `
      },
      register: {
        subject: 'Welcome to Builtatic - Verify Your Email',
        html: `
          <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">Welcome to Builtatic!</h1>
              <h2 style="color: #666; font-weight: normal;">Email Verification</h2>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
              <h3 style="color: #333; margin-bottom: 20px;">Please verify your email with this code:</h3>
              <div style="text-align: center; margin: 20px 0;">
                <span style="background-color: #28a745; color: white; padding: 15px 30px; font-size: 24px; font-weight: bold; border-radius: 5px; letter-spacing: 3px;">${otp}</span>
              </div>
              <p style="color: #666; margin-top: 20px;">This code will expire in 10 minutes.</p>
            </div>
            
            <div style="color: #666; font-size: 14px;">
              <p>Thank you for joining Builtatic! Please enter this code to complete your registration.</p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">© 2025 Builtatic. All rights reserved.</p>
            </div>
          </div>
        `
      },
      order: {
        subject: 'Order Confirmation Required - Builtatic',
        html: `
          <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">Builtatic</h1>
              <h2 style="color: #666; font-weight: normal;">Order Confirmation</h2>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
              <h3 style="color: #333; margin-bottom: 20px;">Confirm your order with this code:</h3>
              <div style="text-align: center; margin: 20px 0;">
                <span style="background-color: #ffc107; color: #212529; padding: 15px 30px; font-size: 24px; font-weight: bold; border-radius: 5px; letter-spacing: 3px;">${otp}</span>
              </div>
              <p style="color: #666; margin-top: 20px;">This code will expire in 15 minutes.</p>
            </div>
            
            <div style="color: #666; font-size: 14px;">
              <p>Please enter this code to confirm your order.</p>
              <p>If you didn't place this order, please contact our support team immediately.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">© 2025 Builtatic. All rights reserved.</p>
            </div>
          </div>
        `
      }
    };

    const template = emailTemplates[purpose] || emailTemplates.login;
    
    const mailOptions = {
      from: `"Builtatic" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

export const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Builtatic" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Builtatic!',
      html: `
        <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333;">Welcome to Builtatic, ${name}!</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h3 style="color: #333; margin-bottom: 20px;">Your account has been successfully created!</h3>
            <p style="color: #666;">We're excited to have you join our community. You can now explore our platform and start building amazing projects.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">© 2025 Builtatic. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

export const sendSupportEmailNotification = async ({
  supportEmail,
  threadId,
  contactEmail,
  contactName,
  message,
}) => {
  if (!supportEmail || (Array.isArray(supportEmail) && supportEmail.length === 0)) {
    console.warn('Support email notification skipped: no supportEmail configured.');
    return { success: false, error: 'supportEmail missing' };
  }
  try {
    const transporter = createTransporter();
    const displayName = contactName || contactEmail || 'Anonymous visitor';
    const recipients = Array.isArray(supportEmail)
      ? supportEmail
      : supportEmail
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
    const mailOptions = {
      from: `"Builtattic Support Bot" <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject: `[Support #${threadId}] New message from ${displayName}`,
      replyTo: process.env.EMAIL_USER,
      html: `
        <div style="font-family: 'Montserrat', Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px;">
          <h2 style="color:#111;">New support chat message</h2>
          <p style="color:#333; margin-bottom:16px;">You received a new message via the marketplace support widget.</p>
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:8px; color:#555; width:140px;">Thread ID</td>
              <td style="padding:8px; color:#111;"><strong>${threadId}</strong></td>
            </tr>
            <tr>
              <td style="padding:8px; color:#555;">Visitor</td>
              <td style="padding:8px; color:#111;">${displayName}</td>
            </tr>
            ${
              contactEmail
                ? `<tr>
                    <td style="padding:8px; color:#555;">Email</td>
                    <td style="padding:8px; color:#111;">${contactEmail}</td>
                  </tr>`
                : ''
            }
          </table>
          <div style="margin:24px 0; padding:16px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
            <p style="color:#334155; margin:0;">${message.replace(/\n/g, '<br/>')}</p>
          </div>
          <p style="color:#475569; font-size:14px;">
            Reply directly to this email to respond. Make sure the subject line remains unchanged so the system can
            route it back into the chat (ID: ${threadId}).
          </p>
        </div>
      `,
    };
    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending support chat email:', error);
    return { success: false, error: error.message };
  }
};
