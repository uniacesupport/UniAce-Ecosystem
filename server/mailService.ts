import nodemailer from 'nodemailer';
import dns from 'dns';
import {
  getWelcomeEmailTemplate,
  getTrialReminderEmailTemplate,
  getAffiliateLinkEmailTemplate,
  getRoleUpdateEmailTemplate,
  getDiagnosticTestEmailTemplate
} from './emailTemplates';

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
  static async sendWelcomeEmail(to: string, displayName: string, trialDays: number = 7) {
    const subject = `Welcome to UniAce, ${displayName}! 🚀 Your ${trialDays}-Day Premium Trial Starts Now`;
    const html = getWelcomeEmailTemplate(displayName, trialDays);
    return this.sendEmail(to, subject, html);
  }

  /**
   * Sends the Trial Expiration Reminder Email (e.g., Day 5 or 6).
   */
  static async sendTrialReminderEmail(to: string, displayName: string, daysLeft: number, trialDays: number = 7) {
    const subject = `Your UniAce Premium Trial Ends in ${daysLeft} Day${daysLeft === 1 ? '' : 's'}! ⏳`;
    const html = getTrialReminderEmailTemplate(displayName, daysLeft, trialDays);
    return this.sendEmail(to, subject, html);
  }

  /**
   * Sends an email to an affiliate/tutor with their new custom tracking link.
   */
  static async sendAffiliateLinkEmail(to: string, displayName: string, referralCode: string, appUrl: string) {
    const subject = `Your Custom Affiliate Link is Ready! 🚀`;
    const html = getAffiliateLinkEmailTemplate(displayName, referralCode, appUrl);
    return this.sendEmail(to, subject, html);
  }

  /**
   * Sends a notification email when a user's role is updated (e.g., promoted to Tutor).
   */
  static async sendRoleUpdateEmail(to: string, displayName: string, newRole: string) {
    const isTutor = newRole.toLowerCase() === 'tutor';
    const isAdmin = newRole.toLowerCase() === 'admin'; 
    
    const subject = isTutor 
      ? "Congratulations! You've been promoted to Tutor on UniAce 🎓" 
      : isAdmin 
        ? "Access Granted: You are now an Admin on UniAce 🛡️"
        : `UniAce Account Update: Your role is now ${newRole}`;

    const html = getRoleUpdateEmailTemplate(displayName, newRole);
    return this.sendEmail(to, subject, html);
  }

  /**
   * Sends a system diagnostic/health-check email.
   */
  static async sendDiagnosticTestEmail(to: string) {
    const subject = 'UniAce System Health Check 🛡️';
    const timestamp = new Date().toISOString();
    const html = getDiagnosticTestEmailTemplate(timestamp);
    return this.sendEmail(to, subject, html);
  }
}
