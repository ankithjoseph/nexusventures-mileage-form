import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExpenseReportSubmission {
  name: string;
  email: string;
  pps: string;
  pdfData: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const submission: ExpenseReportSubmission = await req.json();

    console.log("Sending expense report emails for:", submission.name);
    console.log("PDF data received:", submission.pdfData ? "Yes" : "No");
    console.log("PDF data length:", submission.pdfData?.length || 0);

    // Email al administrador (jesus@irishtaxagents.com)
    const adminEmail = await resend.emails.send({
      from: "Nexus Ventures Expense Report <log@happydreamsireland.com>",
      to: "jesus@irishtaxagents.com",
      subject: `Nuevo Informe de Gastos - ${submission.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px;">
            Nuevo Informe de Gastos por Viajes de Trabajo
          </h1>

          <p style="font-size: 16px; margin: 20px 0;">
            Se ha recibido un nuevo informe de gastos por viajes de trabajo.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Nombre:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${submission.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${submission.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>PPS:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${submission.pps}</td>
            </tr>
          </table>

          <p style="color: #718096; font-size: 14px; margin-top: 30px;">
            El informe completo está adjunto en formato PDF.
          </p>
        </div>
      `,
      attachments: submission.pdfData ? [
        {
          filename: `expense-report-${submission.name.replace(/\s+/g, '-')}.pdf`,
          content: submission.pdfData,
        },
      ] : [],
    });

    if (adminEmail.error) {
      console.error("Admin email send failed:", adminEmail.error);
      return new Response(
        JSON.stringify({ success: false, stage: "admin", error: adminEmail.error }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Admin email sent:", adminEmail);

    // Email de confirmación al usuario
    const userEmail = await resend.emails.send({
      from: "Nexus Ventures <log@happydreamsireland.com>",
      to: submission.email,
      subject: "Confirmación de Informe - Gastos por Viajes de Trabajo",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px;">
            Gracias por su informe
          </h1>

          <p style="font-size: 16px; margin: 20px 0;">
            Estimado/a ${submission.name},
          </p>

          <p style="font-size: 16px; margin: 20px 0;">
            Hemos recibido exitosamente su informe de gastos por viajes de trabajo.
            Adjuntamos una copia del mismo para sus registros.
          </p>

          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2d3748;">
              <strong>PPS:</strong> ${submission.pps}
            </p>
          </div>

          <p style="font-size: 14px; color: #718096; margin-top: 30px;">
            Si tiene alguna pregunta, no dude en contactarnos.
          </p>

          <p style="font-size: 14px; margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Nexus Ventures Team</strong>
          </p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <a href="https://www.nexusventures.eu" style="color: #1a365d; text-decoration: none;">
              www.nexusventures.eu
            </a>
          </div>
        </div>
      `,
      attachments: submission.pdfData ? [
        {
          filename: `mi-informe-gastos-${new Date().toISOString().split('T')[0]}.pdf`,
          content: submission.pdfData,
        },
      ] : [],
    });

    if (userEmail.error) {
      console.error("User email send failed:", userEmail.error);
      return new Response(
        JSON.stringify({ success: false, stage: "user", error: userEmail.error }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("User email sent:", userEmail);

    return new Response(JSON.stringify({ success: true, adminEmailId: adminEmail.data?.id, userEmailId: userEmail.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-expense-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);