"""Email utility for sending transactional emails.

Dev-mode fallback: if SMTP_USER is empty, the reset link is printed to the
server console instead of being sent. This lets you test the full reset flow
locally without configuring an email server.
"""
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    """Send a password-reset email.

    Falls back to console logging when SMTP credentials are not configured.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # Dev / CI mode — no real email server available
        logger.warning(
            "SMTP credentials not configured. "
            "Password reset link (copy into browser to test):\n\n"
            f"  {reset_link}\n"
        )
        return

    subject = "UniPark — Reset Your Password"

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                UniPark
              </h1>
              <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">
                Strathmore University Parking Management
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 12px;font-size:20px;color:#111827;font-weight:600;">
                Reset your password
              </h2>
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                We received a request to reset the password for your UniPark account
                (<strong>{to_email}</strong>). Click the button below to choose a new password.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 28px;">
                    <a href="{reset_link}"
                       style="display:inline-block;background:#1d4ed8;color:#ffffff;
                              text-decoration:none;font-size:15px;font-weight:600;
                              padding:14px 36px;border-radius:8px;letter-spacing:0.2px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.5;">
                This link expires in <strong>15 minutes</strong>. If you did not request a
                password reset, you can safely ignore this email — your password will not change.
              </p>

              <!-- Fallback URL -->
              <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">
                If the button doesn't work, paste this URL into your browser:<br />
                <span style="color:#1d4ed8;word-break:break-all;">{reset_link}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                &copy; {__import__('datetime').date.today().year} Strathmore University UniPark.
                All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    plain_body = (
        f"UniPark Password Reset\n\n"
        f"Click the link below to reset your password (expires in 15 minutes):\n\n"
        f"{reset_link}\n\n"
        f"If you did not request this, ignore this email."
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"UniPark <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(plain_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        logger.info(f"Password reset email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email to {to_email}: {e}")
        raise


def send_notification_email(to_email: str, subject: str, title: str, message: str) -> None:
    """Send a transactional notification email.

    Falls back to console logging when SMTP credentials are not configured.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            f"SMTP credentials not configured. Notification Email to {to_email}:\n"
            f"Subject: {subject}\n"
            f"Title: {title}\n"
            f"Message: {message}\n"
        )
        return

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:24px 30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">
                UniPark
              </h1>
              <p style="margin:4px 0 0;color:#bfdbfe;font-size:12px;">
                Strathmore University Parking Management
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <h2 style="margin:0 0 12px;font-size:18px;color:#111827;font-weight:600;">
                {title}
              </h2>
              <p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.6;white-space:pre-line;">
                {message}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                &copy; {__import__('datetime').date.today().year} Strathmore University UniPark.
                All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"UniPark <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(message, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        logger.info(f"Notification email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send notification email to {to_email}: {e}")
        raise

