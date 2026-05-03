import SibApiV3Sdk from 'sib-api-v3-sdk';

const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Send a transactional email using Brevo (SibApiV3Sdk)
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.subject - Email subject
 * @param {string} options.htmlContent - Email HTML content
 */
export const sendEmail = async ({ email, name, subject, htmlContent }) => {
    try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.sender = { 
            name: process.env.SENDER_NAME || "Aurelyf Care", 
            email: process.env.SENDER_EMAIL || "no-reply@aurelyfcare.com" 
        };
        sendSmtpEmail.to = [{ email: email, name: name }];
        
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Brevo Email sent successfully. Message ID:', data.messageId);
        return data;
    } catch (error) {
        console.error('Error sending email via Brevo:', error);
        throw error;
    }
};

/**
 * Send OTP email
 * @param {string} email 
 * @param {string} name 
 * @param {string} otp 
 */
export const sendOTPEmail = async (email, name, otp) => {
    const subject = "Your Verification Code - Aurelyf Care";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #2c3e50; text-align: center;">Welcome to Aurelyf Care</h2>
            <p>Hello ${name},</p>
            <p>Thank you for registering with us. To complete your registration, please use the following One-Time Password (OTP):</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3498db; background: #f4f7f6; padding: 10px 20px; border-radius: 5px;">${otp}</span>
            </div>
            <p>This code is valid for **10 minutes**. Please do not share this code with anyone.</p>
            <p>If you didn't request this code, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #7f8c8d; text-align: center;">&copy; 2026 Aurelyf Care. All rights reserved.</p>
        </div>
    `;
    
    return await sendEmail({ email, name, subject, htmlContent });
};
