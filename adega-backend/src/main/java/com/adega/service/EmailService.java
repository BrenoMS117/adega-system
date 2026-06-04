package com.adega.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.url}")
    private String appUrl;

    public void sendPasswordResetEmail(String toEmail, String nome, String token) {
        String resetUrl = appUrl + "/redefinir-senha?token=" + token;
        String html = buildResetEmailHtml(nome, resetUrl);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("Redefinição de senha — Adega System");
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Falha ao enviar email de redefinição para {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildResetEmailHtml(String nome, String resetUrl) {
        return """
                <!DOCTYPE html>
                <html lang="pt-BR">
                <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0">
                    <tr><td align="center" style="padding:40px 0;">
                      <table width="600" cellpadding="0" cellspacing="0"
                             style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
                        <tr>
                          <td style="background:#1e3a5f;padding:32px 40px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:1px;">Adega System</h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:40px;">
                            <p style="font-size:16px;color:#333;margin:0 0 12px;">Olá, <strong>%s</strong>!</p>
                            <p style="font-size:15px;color:#555;margin:0 0 28px;">
                              Recebemos uma solicitação para redefinir a senha da sua conta.
                            </p>
                            <div style="text-align:center;margin:0 0 28px;">
                              <a href="%s"
                                 style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;
                                        padding:14px 32px;border-radius:6px;font-size:15px;font-weight:bold;">
                                Redefinir minha senha
                              </a>
                            </div>
                            <p style="font-size:13px;color:#888;margin:0 0 8px;">
                              Este link é válido por <strong>1 hora</strong>.
                            </p>
                            <p style="font-size:13px;color:#aaa;margin:0;">
                              Se você não solicitou a redefinição, ignore este email.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(nome, resetUrl);
    }
}
