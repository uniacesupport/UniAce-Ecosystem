/**
 * Email HTML templates for UniAce Ecosystem.
 * All copyright years are dynamic (new Date().getFullYear()).
 */

/**
 * Renders the Welcome Email Template.
 */
export function getWelcomeEmailTemplate(displayName: string, trialDays: number = 7): string {
  const currentYear = new Date().getFullYear();
  const appUrl = process.env.APP_URL || 'https://uniace.app';

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 10px;">🎓</div>
        <h1 style="color: #10b981; font-size: 28px; font-weight: 800; margin: 0;">UniAce</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Your AI-Powered Academic Companion</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 24px; padding: 30px; border: 1px solid #e2e8f0;">
        <h2 style="font-size: 22px; font-weight: 700; margin-top: 0;">Hi ${displayName}, welcome to the future of studying! 🎓</h2>
        
        <p>You've just unlocked <strong>${trialDays} Days of UniAce Premium</strong>. That means unlimited AI Tutor access, smart quizzes, and personalized study plans are all yours for the next week.</p>

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
          <a href="${appUrl}/ai-tutor" style="background-color: #10b981; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">Open My AI Tutor 🚀</a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">
          Your trial ends in ${trialDays} days. We'll remind you before it expires so you don't miss a beat.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #64748b; margin-bottom: 5px;">&copy; ${currentYear} UniAce Ecosystem. All rights reserved.</p>
        <p style="font-size: 11px; color: #94a3b8;">
          <strong>Security Note:</strong> UniAce will never ask you to download a .exe or .apk file. We are a secure Web App.
        </p>
      </div>
    </div>
  `;
}

/**
 * Renders the Trial Reminder Email Template.
 */
export function getTrialReminderEmailTemplate(displayName: string, daysLeft: number, trialDays: number = 7): string {
  const currentYear = new Date().getFullYear();
  const appUrl = process.env.APP_URL || 'https://uniace.app';

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 10px;">🎓</div>
        <h1 style="color: #10b981; font-size: 28px; font-weight: 800; margin: 0;">UniAce</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Your AI-Powered Academic Companion</p>
      </div>

      <div style="background-color: #fffbeb; border-radius: 24px; padding: 30px; border: 1px solid #fde68a;">
        <h2 style="font-size: 22px; font-weight: 700; margin-top: 0; color: #92400e;">Time is flying, ${displayName}! ⏳</h2>
        
        <p>Your ${trialDays}-day UniAce Premium trial is coming to an end. In just <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>, you'll lose access to your advanced study tools.</p>

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
          <a href="${appUrl}/pricing" style="background-color: #10b981; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">Keep My Premium Access 🚀</a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #64748b; margin-bottom: 5px;">&copy; ${currentYear} UniAce Ecosystem. All rights reserved.</p>
        <p style="font-size: 11px; color: #94a3b8;">
          <strong>Pro Tip:</strong> You can upgrade anytime from your Profile settings.
        </p>
      </div>
    </div>
  `;
}

/**
 * Renders the Affiliate Link Email Template.
 */
export function getAffiliateLinkEmailTemplate(displayName: string, referralCode: string, appUrl: string): string {
  const currentYear = new Date().getFullYear();
  const trackingLink = `${appUrl}?ref=${referralCode}`;

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 10px;">🔗</div>
        <h1 style="color: #6366f1; font-size: 28px; font-weight: 800; margin: 0;">UniAce</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Affiliate & Partner Program</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 24px; padding: 30px; border: 1px solid #e2e8f0; text-align: center;">
        <h2 style="font-size: 24px; font-weight: 800; margin-top: 0; color: #0f172a;">Hello, ${displayName}!</h2>
        
        <p style="font-size: 16px; color: #475569;">We have generated a new custom referral link for your account!</p>
        
        <div style="background-color: #ffffff; border: 2px dashed #6366f1; padding: 20px; border-radius: 16px; margin: 25px 0;">
          <p style="font-size: 14px; font-weight: 600; color: #64748b; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;">Your Unique Link</p>
          <p style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 10px 0; word-break: break-all;">${trackingLink}</p>
        </div>

        <div style="text-align: left; background-color: #ffffff; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; margin-top: 25px;">
          <p style="font-weight: 700; color: #1e293b; margin-top: 0;">How it works:</p>
          <ul style="padding-left: 20px; margin: 0; color: #475569; font-size: 14px;">
            <li style="margin-bottom: 8px;">Share this link with your students, friends, or network.</li>
            <li style="margin-bottom: 8px;">Anyone who signs up using your link is tracked to your account.</li>
            <li style="margin-bottom: 8px;">You earn commissions when they upgrade to premium plans! (Check your dashboard for details and specific commission rates).</li>
          </ul>
        </div>

        <div style="margin-top: 35px;">
          <a href="${appUrl}/dashboard" style="background-color: #6366f1; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Visit Tutor Dashboard 📊</a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #64748b; margin-bottom: 5px;">&copy; ${currentYear} UniAce Ecosystem. All rights reserved.</p>
      </div>
    </div>
  `;
}

/**
 * Renders the Role Update Email Template.
 */
export function getRoleUpdateEmailTemplate(displayName: string, newRole: string): string {
  const currentYear = new Date().getFullYear();
  const appUrl = process.env.APP_URL || 'https://uniace.app';
  const isTutor = newRole.toLowerCase() === 'tutor';
  const isAdmin = newRole.toLowerCase() === 'admin'; 
  
  const roleName = isTutor ? 'Tutor' : isAdmin ? 'Administrator' : newRole;
  const accentColor = isTutor ? '#10b981' : isAdmin ? '#6366f1' : '#64748b';
  const emoji = isTutor ? '👨‍🏫' : isAdmin ? '🛡️' : '👤';

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 10px;">${emoji}</div>
        <h1 style="color: ${accentColor}; font-size: 28px; font-weight: 800; margin: 0;">UniAce</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Academic Excellence Redefined</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 24px; padding: 30px; border: 1px solid #e2e8f0; text-align: center;">
        <h2 style="font-size: 24px; font-weight: 800; margin-top: 0; color: #0f172a;">Big News, ${displayName}!</h2>
        
        <p style="font-size: 16px; color: #475569;">Your account on UniAce has been updated. You have been granted the role of:</p>
        
        <div style="display: inline-block; background-color: ${accentColor}10; border: 2px solid ${accentColor}; padding: 12px 24px; border-radius: 16px; margin: 15px 0;">
          <span style="font-size: 20px; font-weight: 900; color: ${accentColor}; text-transform: uppercase; letter-spacing: 1px;">${roleName}</span>
        </div>

        ${isTutor ? `
          <div style="text-align: left; background-color: #ffffff; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; margin-top: 25px;">
            <p style="font-weight: 700; color: #1e293b; margin-top: 0;">What this means for you:</p>
            <ul style="padding-left: 20px; margin: 0; color: #475569; font-size: 14px;">
              <li style="margin-bottom: 8px;"><strong>Tutor Dashboard:</strong> Access your specialized dashboard to manage courses.</li>
              <li style="margin-bottom: 8px;"><strong>Course Creation:</strong> You can now contribute to the UniAce ecosystem by creating course content.</li>
              <li style="margin-bottom: 8px;"><strong>Enhanced Status:</strong> Your contributions will be highlighted to students.</li>
            </ul>
          </div>
        ` : ''}

        ${isAdmin ? `
          <div style="text-align: left; background-color: #ffffff; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; margin-top: 25px;">
            <p style="font-weight: 700; color: #1e293b; margin-top: 0;">Administrative Access:</p>
            <p style="color: #475569; font-size: 14px; margin: 0;">You now have full access to the Admin Panel. Please use your privileges responsibly to maintain the platform's integrity and support our students.</p>
          </div>
        ` : ''}

        <div style="margin-top: 35px;">
          <a href="${appUrl}/dashboard" style="background-color: ${accentColor}; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Access My Dashboard 🚀</a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #64748b; margin-bottom: 5px;">&copy; ${currentYear} UniAce Ecosystem. All rights reserved.</p>
        <p style="font-size: 11px; color: #94a3b8;">UniAce: Empowering the next generation of scholars.</p>
      </div>
    </div>
  `;
}

/**
 * Renders the System Diagnostic Test Email Template.
 */
export function getDiagnosticTestEmailTemplate(timestamp: string): string {
  const currentYear = new Date().getFullYear();
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 10px;">🛡️</div>
        <h1 style="color: #10b981; font-size: 28px; font-weight: 800; margin: 0;">UniAce</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Diagnostic & System Utilities</p>
      </div>

      <div style="background-color: #f1f5f9; border-radius: 24px; padding: 30px; border: 1px solid #cbd5e1;">
        <h2 style="color: #10b981; font-size: 22px; font-weight: 700; margin-top: 0;">UniAce System Health Check</h2>
        <p>This is a test email sent from the UniAce Admin Diagnostic Tool.</p>
        
        <div style="background: #ffffff; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Timestamp:</strong> ${timestamp}</p>
          <p style="margin: 5px 0 0; font-size: 14px; color: #475569;"><strong>Status:</strong> SMTP Connection Verified</p>
        </div>
        
        <p style="font-size: 13px; color: #64748b;">If you received this, your email delivery system (SMTP) is fully operational and correctly configured.</p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #64748b; margin-bottom: 5px;">&copy; ${currentYear} UniAce Ecosystem. All rights reserved.</p>
      </div>
    </div>
  `;
}
