import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

const initMailer = async () => {
    if (process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Generate test SMTP service account from ethereal.email
        console.log('No SMTP config found, generating Ethereal test account...');
        try {
            const testAccount = await nodemailer.createTestAccount();
            
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log('Ethereal Email Configured:');
            console.log(`User: ${testAccount.user}`);
            console.log(`Pass: ${testAccount.pass}`);
        } catch (err) {
            console.error('Failed to create Ethereal account', err);
        }
    }
};

// Initialize on load
initMailer();

export async function sendScanCompleteEmail(to: string, projectName: string, scanId: string, findingCount: number) {
  if (!transporter) {
      await initMailer();
      if (!transporter) return;
  }

  const subject = `VULX Scan Complete: ${projectName}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h1>Scan Completed</h1>
      <p>Your security scan for project <strong>${projectName}</strong> has finished.</p>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Findings:</strong> ${findingCount}</p>
        <p><strong>Scan ID:</strong> ${scanId}</p>
      </div>

      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${projectName}" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Report</a>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"VULX Security" <no-reply@vulx.dev>',
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
