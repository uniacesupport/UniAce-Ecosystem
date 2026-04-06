import nodemailer from 'nodemailer';
import dns from 'dns';

/**
 * MailService handles sending emails using SMTP.
 * It requires SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables.
 */
export class MailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter() {
    if (!this.transporter) {
      const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
      const port = parseInt(process.env.SMTP_PORT || '465');
      // Fallback to SMTP_FROM_EMAIL if SMTP_USER is missing
      const user = (process.env.SMTP_USER || process.env.SMTP_FROM_EMAIL)?.trim();
      let pass = process.env.SMTP_PASS?.trim();

      // Gmail app passwords are 16 chars, often shown as 4 groups of 4 with spaces.
      // We remove all whitespace to be safe if it's a Gmail host.
      if (pass && host?.includes('gmail.com')) {
        const cleanedPass = pass.replace(/\s/g, '');
        if (cleanedPass.length === 16) {
          console.log('SMTP: Detected and cleaned a 16-character Gmail App Password.');
          pass = cleanedPass;
        }
      }

      if (!host || !user || !pass) {
        console.warn(`SMTP configuration is incomplete: host=${!!host}, user=${!!user}, pass=${!!pass}. Email features will be disabled.`);
        return null;
      }

      console.log(`Initializing SMTP Transporter: host=${host}, port=${port}, user=${user}, hasPass=${!!pass}`);

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
        // THE ULTIMATE FIX FOR RENDER IPv6 ENETUNREACH:
        // We intercept the DNS lookup and force it to ONLY return an IPv4 address.
        // This completely bypasses Render's broken IPv6 outbound routing.
        lookup: (hostname: string, options: any, callback: any) => {
          dns.lookup(hostname, { family: 4 }, (err, address, family) => {
            callback(err, address, family);
          });
        },
        tls: {
          rejectUnauthorized: false,
          servername: host
        }
      } as any);
    }
    return this.transporter;
  }

  /**
   * Verifies the SMTP connection.
   */
  static async verifyConnection() {
    // Clear the transporter to force a re-initialization with potentially new env vars
    this.transporter = null;
    const transporter = this.getTransporter();
    if (!transporter) {
      return { success: false, message: 'Email service not configured. Please set SMTP environment variables.' };
    }

    try {
      await transporter.verify();
      return { success: true, message: 'SMTP connection verified successfully.' };
    } catch (error: any) {
      console.error('SMTP Connection Verification Failed:', error);
      return { success: false, message: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Sends a generic email.
   */
  static async sendEmail(to: string, subject: string, html: string, fromName: string = 'UniAce Team') {
    const transporter = this.getTransporter();
    if (!transporter) {
      throw new Error('Email service not configured. Please set SMTP environment variables.');
    }

    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: %s', info.messageId);
      return info;
    } catch (error: any) {
      console.error('Error sending email:', error);
      if (error.message?.includes('535-5.7.8') || error.message?.includes('Invalid login')) {
        console.error('HINT: This error usually means your Gmail App Password is incorrect or missing. Ensure you are using a 16-character App Password, NOT your regular Gmail password.');
      }
      throw error;
    }
  }

  /**
   * Sends the Day 0 Welcome Email.
   */
  static async sendWelcomeEmail(to: string, displayName: string) {
    const subject = `Welcome to UniAce, ${displayName}! 🚀 Your 7-Day Premium Trial Starts Now`;
    
    const html = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 48px; margin-bottom: 10px;">🎓</div>
          <h1 style="color: #10b981; font-size: 28px; font-weight: 800; margin: 0;">UniAce</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Your AI-Powered Academic Companion</p>
        </div>

        <div style="background-color: #f8fafc; border-radius: 24px; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="font-size: 22px; font-weight: 700; margin-top: 0;">Hi ${displayName}, welcome to the future of studying! 🎓</h2>
          
          <p>You've just unlocked <strong>7 Days of UniAce Premium</strong>. That means unlimited AI Tutor access, smart quizzes, and personalized study plans are all yours for the next week.</p>

          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; font-weight: 600; color: #065f46;">Your first "Aha!" moment is waiting.</p>
            <p style="margin: 5px 0 0; font-size: 14px; color: #047857;">Don't let "blank page syndrome" slow you down. Try asking your first question right now!</p>
          </div>

          <h3 style="font-size: 18px; font-weight: 600; margin-top: 25px;">What to do first:</h3>
          <ul style="padding-left: 20px;">
            <li style="margin-bottom: 10px;"><strong>Ask a tough question:</strong> Paste that physics problem or math derivation you've been stuck on.</li>
            <li style="margin-bottom: 10px;"><strong>Generate a Quiz:</strong> Turn any topic into a 5-minute practice session.</li>
            <li style="margin-bottom: 10px;"><strong>Install the App:</strong> Add UniAce to your home screen for 1-tap access.</li>
          </ul>

          <div style="text-align: center; margin-top: 35px;">
            <a href="${process.env.APP_URL || 'https://uniace.app'}/ai-tutor" style="background-color: #10b981; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">Open My AI Tutor 🚀</a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">
            Your trial ends in 7 days. We'll remind you before it expires so you don't miss a beat.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #64748b; margin-bottom: 5px;">&copy; 2026 UniAce Ecosystem. All rights reserved.</p>
          <p style="font-size: 11px; color: #94a3b8;">
            <strong>Security Note:</strong> UniAce will never ask you to download a .exe or .apk file. We are a secure Web App.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }

  /**
   * Sends the Trial Expiration Reminder Email (e.g., Day 5 or 6).
   */
  static async sendTrialReminderEmail(to: string, displayName: string, daysLeft: number) {
    const subject = `Your UniAce Premium Trial Ends in ${daysLeft} Day${daysLeft === 1 ? '' : 's'}! ⏳`;
    
    const html = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 48px; margin-bottom: 10px;">🎓</div>
          <h1 style="color: #10b981; font-size: 28px; font-weight: 800; margin: 0;">UniAce</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Your AI-Powered Academic Companion</p>
        </div>

        <div style="background-color: #fffbeb; border-radius: 24px; padding: 30px; border: 1px solid #fde68a;">
          <h2 style="font-size: 22px; font-weight: 700; margin-top: 0; color: #92400e;">Time is flying, ${displayName}! ⏳</h2>
          
          <p>Your 7-day UniAce Premium trial is coming to an end. In just <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>, you'll lose access to your advanced study tools.</p>

          <div style="background-color: #ffffff; border: 1px solid #fde68a; padding: 20px; margin: 20px 0; border-radius: 16px;">
            <p style="margin: 0 0 10px; font-weight: 700; color: #1e293b;">What you'll lose access to:</p>
            <ul style="padding-left: 20px; margin: 0; color: #475569;">
              <li style="margin-bottom: 8px;"><strong>Unlimited AI Tutoring:</strong> No more instant help with complex formulas.</li>
              <li style="margin-bottom: 8px;"><strong>Smart Quiz Generation:</strong> Back to manual practice.</li>
              <li style="margin-bottom: 8px;"><strong>Personalized Study Plans:</strong> Your roadmap to an "A" will be locked.</li>
            </ul>
          </div>

          <p style="font-weight: 600; text-align: center; color: #1e293b;">Don't lose your momentum. Upgrade now to keep mastering your courses!</p>

          <div style="text-align: center; margin-top: 35px;">
            <a href="${process.env.APP_URL || 'https://uniace.app'}/pricing" style="background-color: #10b981; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">Keep My Premium Access 🚀</a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #64748b; margin-bottom: 5px;">&copy; 2026 UniAce Ecosystem. All rights reserved.</p>
          <p style="font-size: 11px; color: #94a3b8;">
            <strong>Pro Tip:</strong> You can upgrade anytime from your Profile settings.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }
}
