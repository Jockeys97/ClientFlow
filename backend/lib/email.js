import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.etherealCredentials = null;
    // Initialize async
    this.initTransporter().catch(err => console.error('Email service init failed:', err.message));
  }

  async initTransporter() {
    // For demo/development: use Ethereal Email if no real SMTP configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_USER === 'your-email@gmail.com') {
      console.log('📧 Using Ethereal Email for demo...');
      
      try {
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        
        console.log('📧 Demo email service initialized with Ethereal');
        console.log(`📧 View emails at: https://ethereal.email/messages`);
        console.log(`📧 Login with: ${testAccount.user} / ${testAccount.pass}`);
        
        this.etherealCredentials = { 
          user: testAccount.user, 
          pass: testAccount.pass 
        };
        
      } catch (error) {
        console.error('📧 Failed to create Ethereal account:', error.message);
        this.transporter = null;
      }
      return;
    }

    // Production SMTP configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    console.log('📧 Production email service initialized');
  }

  async sendWelcomeEmail(clientData) {
    if (!this.transporter) {
      console.log('📧 Email not sent - service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    const htmlTemplate = this.getWelcomeTemplate(clientData);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: clientData.email,
      subject: 'Benvenuto nel nostro sistema!',
      html: htmlTemplate,
      text: `Ciao ${clientData.name}, benvenuto nel nostro sistema di gestione clienti!`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Welcome email sent to ${clientData.email}:`, info.messageId);
      
      // For Ethereal, show preview URL
      if (this.etherealCredentials) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`📧 Preview email: ${previewUrl}`);
        return { success: true, messageId: info.messageId, previewUrl };
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('📧 Email send error:', error.message);
      return { success: false, error: error.message };
    }
  }

  getWelcomeTemplate(client) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Benvenuto</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f8fafc; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .highlight { color: #4f46e5; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Benvenuto nel nostro sistema!</h1>
            </div>
            
            <div class="content">
                <h2>Ciao <span class="highlight">${client.name}</span>!</h2>
                
                <p>Siamo felici di averti con noi! I tuoi dati sono stati registrati con successo nel nostro sistema.</p>
                
                <p><strong>Dati registrati:</strong></p>
                <ul>
                    <li><strong>Nome:</strong> ${client.name}</li>
                    <li><strong>Email:</strong> ${client.email}</li>
                    <li><strong>Azienda:</strong> ${client.company}</li>
                    ${client.city ? `<li><strong>Città:</strong> ${client.city}</li>` : ''}
                    ${client.phone ? `<li><strong>Telefono:</strong> ${client.phone}</li>` : ''}
                </ul>
                
                <p>Il nostro team ti contatterà presto per discutere le tue esigenze.</p>
                
                <p>Grazie per aver scelto i nostri servizi!</p>
            </div>
            
            <div class="footer">
                <p>Dashboard System | Sistema di Gestione Clienti</p>
                <p>Questa è un'email automatica, non rispondere a questo messaggio.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

export default new EmailService();